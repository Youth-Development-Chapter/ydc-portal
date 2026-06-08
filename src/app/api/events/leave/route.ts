import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/utils/supabase/api'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, leaveNote } = body

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 })
    }

    const supabase = await createApiClient(request)

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if registration already exists
    const { data: existingReg } = await supabase
      .from('event_registrations')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .maybeSingle()

    if (existingReg) {
      if (existingReg.status === 'leave_pending' || existingReg.status === 'leave_approved') {
        return NextResponse.json({ error: 'Leave request already exists.' }, { status: 409 })
      }
      if (existingReg.status === 'present') {
        return NextResponse.json({ error: 'Cannot request leave for an event you attended.' }, { status: 409 })
      }

      // Update existing registration to leave_pending
      const { error: updateError } = await supabase
        .from('event_registrations')
        .update({
          status: 'leave_pending',
          leave_note: leaveNote || null
        })
        .eq('id', existingReg.id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    } else {
      // Create new registration for the leave request
      const { error: insertError } = await supabase
        .from('event_registrations')
        .insert({
          user_id: user.id,
          event_id: eventId,
          ticket_code: `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          status: 'leave_pending',
          leave_note: leaveNote || null
        })

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Unhandled server error in POST /api/events/leave:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId } = body

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 })
    }

    const supabase = await createApiClient(request)

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if registration exists with status = 'leave_pending'
    const { data: existingReg, error: regError } = await supabase
      .from('event_registrations')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .eq('status', 'leave_pending')
      .maybeSingle()

    if (regError || !existingReg) {
      return NextResponse.json({ error: 'No pending leave request found for this event.' }, { status: 404 })
    }

    // Fetch the event to see if it's compulsory
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('is_compulsory')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
    }

    if (event.is_compulsory) {
      // Compulsory events do not need registration. Delete the registration record entirely.
      const { error: deleteError } = await supabase
        .from('event_registrations')
        .delete()
        .eq('id', existingReg.id)

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }
    } else {
      // Optional events: revert status back to 'registered' and clear leave_note
      const { error: updateError } = await supabase
        .from('event_registrations')
        .update({
          status: 'registered',
          leave_note: null
        })
        .eq('id', existingReg.id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Unhandled server error in DELETE /api/events/leave:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
