import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/utils/supabase/api'

// Kept for backward compatibility. In-app pages use `lib/lms-data.ts`.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createApiClient(request)

    // Fetch the lesson
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single()

    if (lessonError) {
      if (lessonError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
      }
      console.error(`Error fetching lesson ${id}:`, lessonError)
      return NextResponse.json({ error: lessonError.message }, { status: 500 })
    }

    // Fetch the parent module so callers know which course this lesson belongs to.
    const { data: moduleRow, error: moduleError } = await supabase
      .from('modules')
      .select('id, course_id')
      .eq('id', lesson.module_id)
      .single()

    if (moduleError) {
      console.error(`Error fetching module for lesson ${id}:`, moduleError)
      return NextResponse.json({ error: moduleError.message }, { status: 500 })
    }

    // Fetch the MCQs for this lesson — answer key is intentionally omitted
    // so it never leaves the server. Quiz grading goes through the
    // submitQuiz server action.
    const { data: mcqs, error: mcqsError } = await supabase
      .from('mcqs')
      .select('question, options')
      .eq('lesson_id', id)

    if (mcqsError) {
      console.error(`Error fetching MCQs for lesson ${id}:`, mcqsError)
      return NextResponse.json({ error: mcqsError.message }, { status: 500 })
    }

    // Map MCQs options to array of strings (it is JSONB, so it's already an array in JS)
    const mappedMcqs = (mcqs || []).map((m: { question: string; options: unknown }) => ({
      question: m.question,
      options: typeof m.options === 'string' ? JSON.parse(m.options) : m.options,
    }))

    const response = {
      id: lesson.id,
      moduleId: moduleRow.id,
      courseId: moduleRow.course_id,
      title: lesson.title,
      videoUrl: lesson.video_url || undefined,
      textContent: lesson.text_content,
      mcq: mappedMcqs,
    }

    return NextResponse.json(response)
  } catch (error: unknown) {
    console.error('Unhandled server error in GET /api/lessons/[id]:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
