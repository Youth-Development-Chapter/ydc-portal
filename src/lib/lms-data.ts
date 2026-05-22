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

import sanitizeHtml from 'sanitize-html'
import { createClient } from '@/utils/supabase/server'
import type { Course, Lesson, LearnerLesson, LearnerMCQ } from './wellms'

/** Allowed HTML tags and attributes for lesson text content. */
const LESSON_HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'strong', 'em', 'b', 'i', 'u', 's',
    'a', 'blockquote', 'pre', 'code',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    '*': ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
}

function sanitizeLessonContent(html: string): string {
  return sanitizeHtml(html, LESSON_HTML_OPTIONS)
}

export async function getCourses(): Promise<Course[]> {
  const supabase = await createClient()

  const { data: coursesData, error: coursesError } = await supabase
    .from('courses')
    .select('id, title, title_ur, author, description, description_ur, image_url')
    .order('created_at', { ascending: true })

  if (coursesError) {
    console.error('Error fetching courses:', coursesError)
    return []
  }
  if (!coursesData || coursesData.length === 0) return []

  const { data: modulesData, error: modulesError } = await supabase
    .from('modules')
    .select('id, course_id, title, title_ur, duration')
    .order('order_index', { ascending: true })

  if (modulesError) {
    console.error('Error fetching modules:', modulesError)
    return []
  }

  const modulesByCourse: Record<string, { id: string; title: string; titleUr?: string; duration: string }[]> = {}
  for (const m of modulesData || []) {
    if (!modulesByCourse[m.course_id]) modulesByCourse[m.course_id] = []
    modulesByCourse[m.course_id].push({
      id: m.id,
      title: m.title,
      titleUr: m.title_ur || undefined,
      duration: m.duration
    })
  }

  return coursesData.map((c) => ({
    id: c.id,
    title: c.title,
    titleUr: c.title_ur || undefined,
    author: c.author,
    description: c.description || '',
    descriptionUr: c.description_ur || undefined,
    imageUrl: c.image_url || '',
    modules: modulesByCourse[c.id] || [],
  }))
}

export async function getCourseById(courseId: string): Promise<Course | undefined> {
  const supabase = await createClient()

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, title_ur, author, description, description_ur, image_url')
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
    .select('id, title, title_ur, duration')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })

  if (modulesError) {
    console.error(`Error fetching modules for course ${courseId}:`, modulesError)
    return undefined
  }

  return {
    id: course.id,
    title: course.title,
    titleUr: course.title_ur || undefined,
    author: course.author,
    description: course.description || '',
    descriptionUr: course.description_ur || undefined,
    imageUrl: course.image_url || '',
    modules: (modules || []).map((m) => ({
      id: m.id,
      title: m.title,
      titleUr: m.title_ur || undefined,
      duration: m.duration
    })),
  }
}

/**
 * Server-side version of getProgress: returns the lesson IDs and their difficulty
 * completed in a course for a given language.
 */
export async function getProgress(
  userId: string,
  courseId: string,
  language: 'en' | 'ur',
): Promise<{ lessonId: string; difficulty: string }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_progress')
    .select('lesson_id, difficulty')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('language', language)
    .eq('completed', true)

  if (error) {
    console.error(`Error in getProgress(${userId}, ${courseId}, ${language}):`, error)
    return []
  }
  return (data || []).map((row) => ({
    lessonId: row.lesson_id as string,
    difficulty: row.difficulty as string,
  }))
}

/**
 * Learner-facing lesson fetcher. Returns the lesson WITHOUT the
 * correct_answer_index on each MCQ.
 */
export async function getLessonForLearner(lessonId: string): Promise<LearnerLesson | undefined> {
  const full = await getLessonById(lessonId)
  if (!full) return undefined
  const safeMcq: LearnerMCQ[] = full.mcq.map((m) => ({
    question: m.question,
    questionUr: m.questionUr,
    options: m.options,
    optionsUr: m.optionsUr,
    difficulty: m.difficulty,
  }))
  return {
    id: full.id,
    moduleId: full.moduleId,
    courseId: full.courseId,
    title: full.title,
    titleUr: full.titleUr,
    videoUrl: full.videoUrl,
    videoUrlUr: full.videoUrlUr,
    textContent: full.textContent,
    textContentUr: full.textContentUr,
    mcq: safeMcq,
  }
}

export async function getLessonById(lessonId: string): Promise<Lesson | undefined> {
  const supabase = await createClient()

  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('id, module_id, title, title_ur, video_url, video_url_ur, text_content, text_content_ur')
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
    .select('question, question_ur, options, options_ur, correct_answer_index, difficulty')
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
    titleUr: lesson.title_ur || undefined,
    videoUrl: lesson.video_url || undefined,
    videoUrlUr: lesson.video_url_ur || undefined,
    // Sanitize HTML to prevent XSS
    textContent: sanitizeLessonContent(lesson.text_content || ''),
    textContentUr: lesson.text_content_ur ? sanitizeLessonContent(lesson.text_content_ur) : undefined,
    mcq: (mcqs || []).map((m) => ({
      question: m.question,
      questionUr: m.question_ur || undefined,
      options: Array.isArray(m.options)
        ? (m.options as string[])
        : typeof m.options === 'string'
          ? (JSON.parse(m.options) as string[])
          : [],
      optionsUr: m.options_ur 
        ? (Array.isArray(m.options_ur) ? (m.options_ur as string[]) : typeof m.options_ur === 'string' ? (JSON.parse(m.options_ur) as string[]) : undefined)
        : undefined,
      correctAnswerIndex: m.correct_answer_index,
      difficulty: (m.difficulty || 'beginner') as 'beginner' | 'advanced' | 'expert',
    })),
  }
}
