import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/utils/supabase/api'
import { randomBytes } from 'crypto'
import { evaluateCriteria } from '@/lib/criteria'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId } = body

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 })
    }

    const supabase = await createApiClient(request)

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, unit_id, custom_criteria, is_compulsory')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
    }
    if (event.is_compulsory) {
      return NextResponse.json(
        { error: 'This compulsory event is already assigned to eligible members.' },
        { status: 400 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('unit_id')
      .eq('id', user.id)
      .single()

    if (event.unit_id && event.unit_id !== profile?.unit_id) {
      return NextResponse.json({ error: 'This event is not available for your unit.' }, { status: 403 })
    }
    if (event.custom_criteria && Object.keys(event.custom_criteria).length > 0) {
      const criteria = await evaluateCriteria(supabase, user.id, event.custom_criteria)
      if (!criteria.eligible) {
        return NextResponse.json(
          { error: criteria.reason || 'You are not eligible for this event yet.' },
          { status: 403 }
        )
      }
    }

    // 2. Generate a cryptographically random unique ticket code
    const randomHex = randomBytes(3).toString('hex').toUpperCase()
    const ticketCode = `TKT-${eventId.substring(0, 4).toUpperCase()}-${randomHex}`

    // 3. Register user for the event
    const { error } = await supabase
      .from('event_registrations')
      .insert({
        event_id: eventId,
        user_id: user.id,
        ticket_code: ticketCode,
        attended: false
      })

    if (error) {
      // Check if registration already exists
      if (error.code === '23505') { // Unique constraint violation code in PostgreSQL
        return NextResponse.json(
          { error: 'You are already registered for this event.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, ticketCode })
  } catch (error: unknown) {
    console.error('Unhandled server error in POST /api/events/ticket/claim:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
