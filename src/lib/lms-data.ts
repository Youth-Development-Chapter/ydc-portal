// Server-only data access for the LMS.
//
// These functions are imported by Server Components (lms/courses pages,
// lms/lessons pages) and query Supabase directly — no HTTP hop to our own
// /api/* routes. On Vercel that avoids a second cold-start serverless
// invocation + a public-internet roundtrip per page load.
//
// Importing this from a Client Component will fail at build/runtime because
// `@/utils/supabase/server` pulls in `next/headers`, which throws outside
// a server context.

import { createClient } from '@/utils/supabase/server'
import type { Course, Lesson } from './wellms'

export async function getCourses(): Promise<Course[]> {
  const supabase = await createClient()

  const { data: coursesData, error: coursesError } = await supabase
    .from('courses')
    .select('id, title, author, description, image_url')
    .order('created_at', { ascending: true })

  if (coursesError) {
    console.error('Error fetching courses:', coursesError)
    return []
  }
  if (!coursesData || coursesData.length === 0) return []

  const { data: modulesData, error: modulesError } = await supabase
    .from('modules')
    .select('id, course_id, title, duration')
    .order('order_index', { ascending: true })

  if (modulesError) {
    console.error('Error fetching modules:', modulesError)
    return []
  }

  const modulesByCourse: Record<string, { id: string; title: string; duration: string }[]> = {}
  for (const m of modulesData || []) {
    if (!modulesByCourse[m.course_id]) modulesByCourse[m.course_id] = []
    modulesByCourse[m.course_id].push({ id: m.id, title: m.title, duration: m.duration })
  }

  return coursesData.map((c) => ({
    id: c.id,
    title: c.title,
    author: c.author,
    description: c.description || '',
    imageUrl: c.image_url || '',
    modules: modulesByCourse[c.id] || [],
  }))
}

export async function getCourseById(courseId: string): Promise<Course | undefined> {
  const supabase = await createClient()

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, author, description, image_url')
    .eq('id', courseId)
    .single()

  if (courseError || !course) {
    if (courseError && courseError.code !== 'PGRST116') {
      console.error(`Error fetching course ${courseId}:`, courseError)
    }
    return undefined
  }

  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('id, title, duration')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })

  if (modulesError) {
    console.error(`Error fetching modules for course ${courseId}:`, modulesError)
    return undefined
  }

  return {
    id: course.id,
    title: course.title,
    author: course.author,
    description: course.description || '',
    imageUrl: course.image_url || '',
    modules: modules || [],
  }
}

/**
 * Server-side version of getProgress: returns the lesson IDs the user has
 * completed in a course. RLS uses the authenticated cookie session.
 */
export async function getProgress(userId: string, courseId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('completed', true)

  if (error) {
    console.error(`Error in getProgress(${userId}, ${courseId}):`, error)
    return []
  }
  return (data || []).map((row) => row.lesson_id as string)
}

export async function getLessonById(lessonId: string): Promise<Lesson | undefined> {
  const supabase = await createClient()

  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('id, module_id, title, video_url, text_content')
    .eq('id', lessonId)
    .single()

  if (lessonError || !lesson) {
    if (lessonError && lessonError.code !== 'PGRST116') {
      console.error(`Error fetching lesson ${lessonId}:`, lessonError)
    }
    return undefined
  }

  const { data: moduleRow, error: moduleError } = await supabase
    .from('modules')
    .select('id, course_id')
    .eq('id', lesson.module_id)
    .single()

  if (moduleError || !moduleRow) {
    console.error(`Error fetching module for lesson ${lessonId}:`, moduleError)
    return undefined
  }

  const { data: mcqs, error: mcqsError } = await supabase
    .from('mcqs')
    .select('question, options, correct_answer_index')
    .eq('lesson_id', lessonId)

  if (mcqsError) {
    console.error(`Error fetching MCQs for lesson ${lessonId}:`, mcqsError)
    return undefined
  }

  return {
    id: lesson.id,
    moduleId: moduleRow.id,
    courseId: moduleRow.course_id,
    title: lesson.title,
    videoUrl: lesson.video_url || undefined,
    textContent: lesson.text_content || '',
    mcq: (mcqs || []).map((m) => ({
      question: m.question,
      options: Array.isArray(m.options)
        ? (m.options as string[])
        : typeof m.options === 'string'
          ? (JSON.parse(m.options) as string[])
          : [],
      correctAnswerIndex: m.correct_answer_index,
    })),
  }
}
