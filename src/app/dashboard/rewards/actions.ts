'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { hasAdminPermission } from '@/lib/admin'

export async function redeemReward(rewardId: string): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  // Fetch the reward
  const { data: reward, error: rewardErr } = await supabase
    .from('rewards')
    .select('id, title, coin_cost, quantity_available, is_active')
    .eq('id', rewardId)
    .single()

  if (rewardErr || !reward) return { error: 'Reward not found.' }
  if (!reward.is_active) return { error: 'This reward is no longer available.' }

  // Check if quantity is exhausted
  if (reward.quantity_available !== null) {
    const { count } = await supabase
      .from('reward_redemptions')
      .select('*', { count: 'exact', head: true })
      .eq('reward_id', rewardId)
      .neq('status', 'cancelled')

    if (count !== null && count >= reward.quantity_available) {
      return { error: 'This reward is out of stock.' }
    }
  }

  // Calculate user coin balance
  const { data: txns } = await supabase
    .from('coin_transactions')
    .select('amount')
    .eq('user_id', user.id)

  const balance = (txns || []).reduce((sum, t) => sum + t.amount, 0)
  if (balance < reward.coin_cost) {
    return { error: `Insufficient coins. You have ${balance} coins but this costs ${reward.coin_cost}.` }
  }

  // Insert redemption record
  const { error: redemptionErr } = await supabase
    .from('reward_redemptions')
    .insert({
      user_id: user.id,
      reward_id: rewardId,
      coin_cost: reward.coin_cost,
      status: 'pending',
    })

  if (redemptionErr) return { error: redemptionErr.message }

  // Deduct coins from the ledger
  const { error: txnErr } = await supabase
    .from('coin_transactions')
    .insert({
      user_id: user.id,
      amount: -reward.coin_cost,
      reason: 'reward_redeem',
      reference_id: rewardId,
    })

  if (txnErr) {
    // Non-fatal: the redemption record exists, admin can process manually
    console.error('redeemReward: failed to deduct coins', txnErr)
  }

  revalidatePath('/dashboard/rewards')
  revalidatePath('/dashboard/wallet')
  return { success: true }
}

// ── Admin actions ────────────────────────────────────────────────

export async function createReward(data: {
  title: string
  description: string
  coin_cost: number
  quantity_available: number | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  const allowed = await hasAdminPermission(user.id, 'can_manage_settings')
  if (!allowed) return { error: 'Permission denied.' }

  if (!data.title.trim()) return { error: 'Title is required.' }
  if (!Number.isInteger(data.coin_cost) || data.coin_cost <= 0) {
    return { error: 'Coin cost must be a positive integer.' }
  }

  const { error } = await supabase.from('rewards').insert({
    title: data.title.trim(),
    description: data.description.trim() || null,
    coin_cost: data.coin_cost,
    quantity_available: data.quantity_available,
    is_active: true,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/rewards')
  revalidatePath('/admin/rewards')
  return { success: true as const }
}

export async function toggleRewardActive(rewardId: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  const allowed = await hasAdminPermission(user.id, 'can_manage_settings')
  if (!allowed) return { error: 'Permission denied.' }

  const { error } = await supabase
    .from('rewards')
    .update({ is_active: isActive })
    .eq('id', rewardId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/rewards')
  revalidatePath('/admin/rewards')
  return { success: true as const }
}

export async function fulfilRedemption(redemptionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  const allowed = await hasAdminPermission(user.id, 'can_manage_settings')
  if (!allowed) return { error: 'Permission denied.' }

  const { error } = await supabase
    .from('reward_redemptions')
    .update({ status: 'fulfilled' })
    .eq('id', redemptionId)

  if (error) return { error: error.message }

  revalidatePath('/admin/rewards')
  return { success: true as const }
}
