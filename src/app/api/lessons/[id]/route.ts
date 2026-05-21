import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

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

    // Fetch the MCQs for this lesson
    const { data: mcqs, error: mcqsError } = await supabase
      .from('mcqs')
      .select('question, options, correct_answer_index')
      .eq('lesson_id', id)

    if (mcqsError) {
      console.error(`Error fetching MCQs for lesson ${id}:`, mcqsError)
      return NextResponse.json({ error: mcqsError.message }, { status: 500 })
    }

    // Map MCQs options to array of strings (it is JSONB, so it's already an array in JS)
    const mappedMcqs = (mcqs || []).map((m: any) => ({
      question: m.question,
      options: typeof m.options === 'string' ? JSON.parse(m.options) : m.options,
      correctAnswerIndex: m.correct_answer_index,
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
  } catch (error: any) {
    console.error('Unhandled server error in GET /api/lessons/[id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
