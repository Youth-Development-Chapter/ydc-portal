import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/utils/supabase/api'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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

    // Verify event is optional
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('is_compulsory')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
    }

    if (event.is_compulsory) {
      return NextResponse.json({ error: 'Compulsory events require admin leave approval.' }, { status: 400 })
    }

    // Update status to 'not_going'
    const { error: updateError } = await supabase
      .from('event_registrations')
      .update({
        status: 'not_going'
      })
      .eq('user_id', user.id)
      .eq('event_id', eventId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Unhandled server error in POST /api/events/not-going:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
