import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/utils/supabase/api'
import { randomBytes } from 'crypto'

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
