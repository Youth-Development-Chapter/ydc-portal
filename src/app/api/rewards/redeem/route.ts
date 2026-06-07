import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/utils/supabase/api'
import { evaluateCriteria } from '@/lib/criteria'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rewardId } = body

    if (!rewardId) {
      return NextResponse.json({ error: 'rewardId is required' }, { status: 400 })
    }

    const supabase = await createApiClient(request)

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch the reward
    const { data: reward, error: rewardErr } = await supabase
      .from('rewards')
      .select('id, title, coin_cost, quantity_available, is_active, inclusive_unit_ids, exclusive_unit_ids, custom_criteria')
      .eq('id', rewardId)
      .single()

    if (rewardErr || !reward) {
      return NextResponse.json({ error: 'Reward not found.' }, { status: 404 })
    }
    if (!reward.is_active) {
      return NextResponse.json({ error: 'This reward is no longer available.' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('unit_id')
      .eq('id', user.id)
      .single()

    const userUnitId = profile?.unit_id || null
    if (reward.inclusive_unit_ids?.length && (!userUnitId || !reward.inclusive_unit_ids.includes(userUnitId))) {
      return NextResponse.json({ error: 'This reward is not available for your unit.' }, { status: 403 })
    }
    if (reward.exclusive_unit_ids?.length && userUnitId && reward.exclusive_unit_ids.includes(userUnitId)) {
      return NextResponse.json({ error: 'This reward is not available for your unit.' }, { status: 403 })
    }
    if (reward.custom_criteria && Object.keys(reward.custom_criteria).length > 0) {
      const criteria = await evaluateCriteria(supabase, user.id, reward.custom_criteria)
      if (!criteria.eligible) {
        return NextResponse.json(
          { error: criteria.reason || 'You are not eligible for this reward yet.' },
          { status: 403 }
        )
      }
    }

    // 3. Check if quantity is exhausted
    if (reward.quantity_available !== null) {
      const { count } = await supabase
        .from('reward_redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('reward_id', rewardId)
        .neq('status', 'cancelled')

      if (count !== null && count >= reward.quantity_available) {
        return NextResponse.json({ error: 'This reward is out of stock.' }, { status: 400 })
      }
    }

    // 4. Calculate user coin balance using the RPC
    const { data: balance, error: balanceErr } = await supabase
      .rpc('get_user_coin_balance', { p_user_id: user.id })

    if (balanceErr) {
      console.error('API redeemReward: failed to fetch coin balance', balanceErr)
      return NextResponse.json({ error: 'Could not fetch coin balance.' }, { status: 500 })
    }

    const coinBalance = Number(balance || 0)
    if (coinBalance < reward.coin_cost) {
      return NextResponse.json(
        { error: `Insufficient coins. You have ${coinBalance} coins but this costs ${reward.coin_cost}.` },
        { status: 400 }
      )
    }

    // 5. Insert redemption record
    const { data: redemption, error: redemptionErr } = await supabase
      .from('reward_redemptions')
      .insert({
        user_id: user.id,
        reward_id: rewardId,
        coin_cost: reward.coin_cost,
        status: 'pending',
      })
      .select()
      .single()

    if (redemptionErr) {
      return NextResponse.json({ error: redemptionErr.message }, { status: 500 })
    }

    // 6. Deduct coins from the ledger (inserts transaction record)
    // Note: Due to standard RLS settings, volunteers cannot write to coin_transactions.
    // Like the web client server action, this is treated as non-fatal on the server.
    const { error: txnErr } = await supabase
      .from('coin_transactions')
      .insert({
        user_id: user.id,
        amount: -reward.coin_cost,
        reason: 'reward_redeem',
        reference_id: rewardId,
      })

    if (txnErr) {
      console.warn('API redeemReward: failed to deduct coins (non-fatal, requires admin manual deduction):', txnErr.message)
    }

    return NextResponse.json({ success: true, redemption })
  } catch (error: unknown) {
    console.error('Unhandled server error in POST /api/rewards/redeem:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
