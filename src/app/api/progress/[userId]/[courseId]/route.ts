import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; courseId: string }> }
) {
  try {
    const { userId, courseId } = await params
    const supabase = await createClient()

    // Verify the caller is the same user whose progress is being requested.
    // Admins who need any user's progress should use a server action instead.
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch progress for this user and course
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('completed', true)

    if (progressError) {
      console.error(`Error fetching progress for user ${userId} and course ${courseId}:`, progressError)
      return NextResponse.json({ error: progressError.message }, { status: 500 })
    }

    const completedLessonIds = (progress || []).map((row) => row.lesson_id)
    return NextResponse.json(completedLessonIds)
  } catch (error: unknown) {
    console.error('Unhandled server error in GET /api/progress/[userId]/[courseId]:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
