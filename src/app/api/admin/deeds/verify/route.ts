import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/utils/supabase/api'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deedId, status, bonusCoins, adminNotes } = body

    if (!deedId || !status) {
      return NextResponse.json({ error: 'deedId and status are required' }, { status: 400 })
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Status must be approved or rejected' }, { status: 400 })
    }

    if (status === 'rejected' && !adminNotes) {
      return NextResponse.json({ error: 'Rejection reason is required in adminNotes' }, { status: 400 })
    }

    const supabase = await createApiClient(request)

    // 1. Authenticate admin user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch active admin profile and verify permission
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, division')
      .eq('id', user.id)
      .single()

    if (profileError || !adminProfile) {
      return NextResponse.json({ error: 'Permission denied. Profile not found.' }, { status: 403 })
    }

    const role = adminProfile.role
    let hasPermission = false

    if (['superadmin', 'president', 'admin'].includes(role)) {
      hasPermission = true
    } else if (role === 'tier-3') {
      const { data: permissions } = await supabase
        .from('admin_permissions')
        .select('can_approve_deeds')
        .eq('admin_id', user.id)
        .single()
      
      if (permissions?.can_approve_deeds) {
        hasPermission = true
      }
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied. You cannot verify deeds.' }, { status: 403 })
    }

    // 3. Verify division scoping for President role
    if (role === 'president') {
      const { data: submission } = await supabase
        .from('deed_submissions')
        .select('*, profiles:user_id(division)')
        .eq('id', deedId)
        .single()
      
      if (!submission) {
        return NextResponse.json({ error: 'Deed submission not found' }, { status: 404 })
      }
      
      const targetDivision = (submission.profiles as any)?.division
      if (targetDivision !== adminProfile.division) {
        return NextResponse.json(
          { error: 'Permission denied. This user belongs to a different division.' },
          { status: 403 }
        )
      }
    }

    // 4. Handle approval or rejection
    if (status === 'approved') {
      // Fetch base daily deed reward setting
      const { data: baseSetting } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'daily_deed_reward')
        .single()
      const baseReward = baseSetting ? parseInt(baseSetting.value, 10) : 10

      // Update deed submission status (triggers streak update and coin transaction automatically via DB trigger)
      const { error: updateError } = await supabase
        .from('deed_submissions')
        .update({
          status: 'approved',
          coin_reward: baseReward,
          bonus_coins: bonusCoins || 0,
          admin_notes: adminNotes || null,
          verified_by: user.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', deedId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    } else {
      // Rejection
      const { error: updateError } = await supabase
        .from('deed_submissions')
        .update({
          status: 'rejected',
          admin_notes: adminNotes,
          verified_by: user.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', deedId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Unhandled server error in POST /api/admin/deeds/verify:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
