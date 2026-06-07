'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { hasAdminPermission } from '@/lib/admin'
import { getUserCoinBalance } from '@/lib/perf-data'

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
  const balance = await getUserCoinBalance(user.id)
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
  revalidateTag('rewards', 'max')
  return { success: true }
}

// ── Admin actions ────────────────────────────────────────────────

export async function createReward(data: {
  title: string
  description: string
  coin_cost: number
  quantity_available: number | null
  inclusive_unit_ids?: string[] | null
  exclusive_unit_ids?: string[] | null
  custom_criteria?: any
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
    inclusive_unit_ids: data.inclusive_unit_ids || null,
    exclusive_unit_ids: data.exclusive_unit_ids || null,
    custom_criteria: data.custom_criteria || null,
    is_active: true,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/rewards')
  revalidatePath('/admin/rewards')
  revalidateTag('rewards', 'max')
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
  revalidateTag('rewards', 'max')
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
    .update({ status: 'fulfilled', processed_by: user.id })
    .eq('id', redemptionId)

  if (error) return { error: error.message }

  revalidatePath('/admin/rewards')
  revalidateTag('rewards', 'max')
  return { success: true as const }
}

export async function rejectRedemption(redemptionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  const allowed = await hasAdminPermission(user.id, 'can_manage_settings')
  if (!allowed) return { error: 'Permission denied.' }

  // 1. Fetch redemption details to refund coins
  const { data: redemption, error: fetchErr } = await supabase
    .from('reward_redemptions')
    .select('user_id, coin_cost, status')
    .eq('id', redemptionId)
    .single()

  if (fetchErr || !redemption) return { error: 'Redemption not found.' }
  if (redemption.status !== 'pending') return { error: 'Redemption is already processed.' }

  // 2. Update status
  const { error } = await supabase
    .from('reward_redemptions')
    .update({ status: 'rejected', processed_by: user.id })
    .eq('id', redemptionId)

  if (error) return { error: error.message }

  // 3. Refund coins
  await supabase
    .from('coin_transactions')
    .insert({
      user_id: redemption.user_id,
      amount: redemption.coin_cost,
      reason: 'reward_refund',
      reference_id: redemptionId,
      processed_by: user.id,
    })

  revalidatePath('/admin/rewards')
  revalidateTag('rewards', 'max')
  return { success: true as const }
}
