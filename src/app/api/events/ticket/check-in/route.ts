import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/utils/supabase/api'
import { evaluateCriteria } from '@/lib/criteria'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scannedId, eventId, bypassReason } = body

    if (!scannedId || !eventId) {
      return NextResponse.json({ error: 'scannedId and eventId are required' }, { status: 400 })
    }

    const supabase = await createApiClient(request)

    // 1. Authenticate user (Admin/Scanner)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch active user profile and verify scan permission
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, unit_id')
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
        .select('can_scan_tickets')
        .eq('admin_id', user.id)
        .single()
      
      if (permissions?.can_scan_tickets) {
        hasPermission = true
      }
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied. You cannot check in tickets.' }, { status: 403 })
    }

    // 3. Resolve Target Volunteer User
    let resolvedUserId = scannedId.trim()
    
    // Support visual member ID format (e.g. YDC-12345678)
    if (resolvedUserId.toUpperCase().startsWith('YDC-')) {
      const hexPart = resolvedUserId.substring(4).toLowerCase()
      const { data: matchProfile, error: matchError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .filter('id::text', 'like', `${hexPart}%`)
        .maybeSingle()

      if (matchError) {
        return NextResponse.json({ error: `Profile lookup failed: ${matchError.message}` }, { status: 500 })
      }
      if (matchProfile) {
        resolvedUserId = matchProfile.id
      } else {
        return NextResponse.json({ error: `No volunteer found with Member ID ${scannedId}` }, { status: 404 })
      }
    }

    // Fetch the target user's full_name for the response
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('full_name, unit_id')
      .eq('id', resolvedUserId)
      .single()

    if (!targetProfile) {
      return NextResponse.json({ error: 'Volunteer profile not found.' }, { status: 404 })
    }

    // 4. Fetch Event Details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('coin_reward, custom_criteria, is_compulsory, id, unit_id')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
    }

    if (role === 'president' && event.unit_id !== adminProfile.unit_id) {
      return NextResponse.json(
        { error: 'Permission denied. You can only scan events in your own unit.' },
        { status: 403 }
      )
    }
    if (event.unit_id && event.unit_id !== targetProfile.unit_id) {
      return NextResponse.json({ error: 'This volunteer belongs to a different unit.' }, { status: 403 })
    }

    // 5. Check if already attended
    const { data: existingReg } = await supabase
      .from('event_registrations')
      .select('id, attended, status')
      .eq('user_id', resolvedUserId)
      .eq('event_id', eventId)
      .maybeSingle()

    if (existingReg && existingReg.attended) {
      return NextResponse.json({ 
        error: 'Ticket already scanned.', 
        alreadyScanned: true,
        userName: targetProfile.full_name || 'Volunteer' 
      }, { status: 409 })
    }

    // 6. Evaluate Criteria Eligibility
    const evalResult = await evaluateCriteria(supabase, resolvedUserId, event.custom_criteria)
    if (!evalResult.eligible && !bypassReason) {
      return NextResponse.json({ 
        error: `Volunteer not eligible: ${evalResult.reason}. Provide a bypass reason to force check-in.` 
      }, { status: 403 })
    }

    // 7. Fetch reward (event-specific first, fallback to system settings)
    let attendanceReward = event.coin_reward
    if (typeof attendanceReward !== 'number') {
      const { data: attendanceSetting } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'event_attendance_reward')
        .single()
      attendanceReward = attendanceSetting ? parseInt(attendanceSetting.value, 10) : 50
    }

    // 8. Upsert Registration & Check-in
    let registrationId = existingReg?.id
    if (!registrationId) {
      // Create new registration dynamically
      const { data: newReg, error: insertError } = await supabase
        .from('event_registrations')
        .insert({
          user_id: resolvedUserId,
          event_id: eventId,
          ticket_code: `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`, // Dummy ticket code since it's required in schema
          status: 'present',
          attended: true,
          attended_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
      registrationId = newReg.id
    } else {
      // Update existing registration
      const { error: updateError } = await supabase
        .from('event_registrations')
        .update({
          status: 'present',
          attended: true,
          attended_at: new Date().toISOString()
        })
        .eq('id', registrationId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    // 9. Insert coin transaction
    const { error: coinError } = await supabase
      .from('coin_transactions')
      .insert({
        user_id: resolvedUserId,
        amount: attendanceReward,
        reason: 'event_attendance',
        reference_id: registrationId,
        credited_by: user.id
      })

    if (coinError) {
      console.error('Error crediting attendance coins in API:', coinError)
    }

    return NextResponse.json({ 
      success: true, 
      userName: targetProfile.full_name || 'Volunteer',
      coinsAwarded: attendanceReward
    })
  } catch (error: unknown) {
    console.error('Unhandled server error in POST /api/events/ticket/check-in:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
