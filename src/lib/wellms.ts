// Shared LMS types + browser-only data calls.
//
// Server-side fetchers (used by Server Components) live in `./lms-data.ts`
// and query Supabase directly. The functions in this file are safe to call
// from client components — they use the Supabase browser client, which
// authenticates as the logged-in user via cookies.
//
// We intentionally do not import 'server-only' here so this file can be
// pulled into client bundles.

import { createClient as createBrowserSupabase } from '@/utils/supabase/client'

export interface MCQ {
  question: string
  questionUr?: string
  options: string[]
  optionsUr?: string[]
  correctAnswerIndex: number
  difficulty: 'beginner' | 'advanced' | 'expert'
}

export interface Lesson {
  id: string
  moduleId: string
  courseId: string
  title: string
  titleUr?: string
  videoUrl?: string
  videoUrlUr?: string
  textContent: string
  textContentUr?: string
  mcq: MCQ[]
}

/**
 * Learner-facing MCQ. NEVER includes correctAnswerIndex — the answer key
 * stays on the server, so users can't bypass the quiz via DevTools.
 */
export interface LearnerMCQ {
  question: string
  questionUr?: string
  options: string[]
  optionsUr?: string[]
  difficulty: 'beginner' | 'advanced' | 'expert'
}

export interface LearnerLesson {
  id: string
  moduleId: string
  courseId: string
  title: string
  titleUr?: string
  videoUrl?: string
  videoUrlUr?: string
  textContent: string
  textContentUr?: string
  mcq: LearnerMCQ[]
}

export interface Course {
  id: string
  title: string
  titleUr?: string
  author: string
  description: string
  descriptionUr?: string
  imageUrl: string
  modules: { id: string; title: string; titleUr?: string; duration: string }[]
}

/**
 * Fetch the lesson IDs the user has completed in a given course.
 * Safe to call from Client Components.
 */
export async function getProgress(
  userId: string,
  courseId: string,
  language: 'en' | 'ur',
): Promise<{ lessonId: string; difficulty: string }[]> {
  const supabase = createBrowserSupabase()
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
 * Mark a lesson as completed for the current user.
 * Safe to call from Client Components.
 */
export async function saveProgress(
  userId: string,
  courseId: string,
  lessonId: string,
  language: 'en' | 'ur',
  difficulty: 'beginner' | 'advanced' | 'expert',
): Promise<boolean> {
  const supabase = createBrowserSupabase()
  const { error } = await supabase
    .from('user_progress')
    .upsert(
      {
        user_id: userId,
        course_id: courseId,
        lesson_id: lessonId,
        language: language,
        difficulty: difficulty,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,course_id,lesson_id,language,difficulty' },
    )

  if (error) {
    console.error('Error in saveProgress:', error)
    return false
  }
  return true
}
