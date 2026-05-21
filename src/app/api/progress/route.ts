import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, courseId, lessonId } = body

    if (!userId || !courseId || !lessonId) {
      return NextResponse.json(
        { error: 'userId, courseId, and lessonId are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Upsert into user_progress table
    const { data, error } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id: userId,
          course_id: courseId,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,course_id,lesson_id',
        }
      )
      .select()

    if (error) {
      console.error('Error saving progress:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, progress: data })
  } catch (error: unknown) {
    console.error('Unhandled server error in POST /api/progress:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
