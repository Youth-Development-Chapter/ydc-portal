import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/utils/supabase/api'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { description, proofUrl, localDate } = body

    if (!description) {
      return NextResponse.json({ error: 'Description is required.' }, { status: 400 })
    }
    if (!proofUrl) {
      return NextResponse.json({ error: 'Proof URL is required.' }, { status: 400 })
    }
    if (!localDate || !/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
      return NextResponse.json({ error: 'Invalid or missing local date.' }, { status: 400 })
    }

    const supabase = await createApiClient(request)

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    // 2. Enforce daily limit of 3 deeds (approved or pending status only)
    const { data: existingDeeds, error: queryError } = await supabase
      .from('deed_submissions')
      .select('id, status')
      .eq('user_id', userId)
      .eq('local_date', localDate)

    if (queryError) {
      return NextResponse.json(
        { error: `Database error checking existing deeds: ${queryError.message}` },
        { status: 500 }
      )
    }

    const validDeeds = existingDeeds ? existingDeeds.filter(d => d.status === 'approved' || d.status === 'pending') : []
    if (validDeeds.length >= 3) {
      return NextResponse.json(
        { error: 'Daily limit reached: You can only submit up to 3 deeds per day.' },
        { status: 429 }
      )
    }

    // 3. Insert deed submission record
    const { data, error: insertError } = await supabase
      .from('deed_submissions')
      .insert({
        user_id: userId,
        description,
        proof_url: proofUrl,
        status: 'pending',
        local_date: localDate
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, deed: data })
  } catch (error: unknown) {
    console.error('Unhandled server error in POST /api/deeds/submit:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
