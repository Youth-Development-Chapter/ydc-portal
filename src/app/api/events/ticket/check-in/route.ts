import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/utils/supabase/api'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scannedId, eventId } = body

    if (!scannedId) {
      return NextResponse.json({ error: 'scannedId is required' }, { status: 400 })
    }

    const supabase = await createApiClient(request)

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch active user profile and verify scan permission
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

    // 3. Resolve ticket registration
    let registration = null
    let fetchError = null

    if (eventId) {
      let resolvedUserId = scannedId.trim()
      
      // Support visual member ID format (e.g. YDC-12345678)
      if (resolvedUserId.toUpperCase().startsWith('YDC-')) {
        const hexPart = resolvedUserId.substring(4).toLowerCase()
        const { data: matchProfile, error: matchError } = await supabase
          .from('profiles')
          .select('id')
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

      const { data: reg, error } = await supabase
        .from('event_registrations')
        .select('*, profiles(full_name), events(coin_reward, division)')
        .eq('user_id', resolvedUserId)
        .eq('event_id', eventId)
        .maybeSingle()
      
      registration = reg
      fetchError = error
    } else {
      // Fallback: scannedId is the ticket code
      const { data: reg, error } = await supabase
        .from('event_registrations')
        .select('*, profiles(full_name), events(coin_reward, division)')
        .eq('ticket_code', scannedId.trim())
        .maybeSingle()
      
      registration = reg
      fetchError = error
    }

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!registration) {
      return NextResponse.json({ error: 'Ticket not found. This user is not registered for the event.' }, { status: 404 })
    }

    // 4. Verify division scoping for President role
    if (role === 'president') {
      const eventDivision = (registration.events as any)?.division
      if (eventDivision && eventDivision !== adminProfile.division) {
        return NextResponse.json(
          { error: 'Permission denied. This event belongs to a different division.' },
          { status: 403 }
        )
      }
    }

    if (registration.attended) {
      return NextResponse.json({ 
        error: 'Ticket already scanned.', 
        alreadyScanned: true,
        userName: registration.profiles?.full_name || 'Volunteer' 
      }, { status: 409 })
    }

    // 5. Fetch reward (event-specific first, fallback to system settings)
    let attendanceReward = (registration.events as any)?.coin_reward
    if (typeof attendanceReward !== 'number') {
      const { data: attendanceSetting } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'event_attendance_reward')
        .single()
      attendanceReward = attendanceSetting ? parseInt(attendanceSetting.value, 10) : 50
    }

    // 6. Update registration status
    const { error: updateError } = await supabase
      .from('event_registrations')
      .update({
        attended: true,
        attended_at: new Date().toISOString()
      })
      .eq('id', registration.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // 7. Insert coin transaction
    const { error: coinError } = await supabase
      .from('coin_transactions')
      .insert({
        user_id: registration.user_id,
        amount: attendanceReward,
        reason: 'event_attendance',
        reference_id: registration.id
      })

    if (coinError) {
      console.error('Error crediting attendance coins in API:', coinError)
    }

    return NextResponse.json({ 
      success: true, 
      userName: registration.profiles?.full_name || 'Volunteer',
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
