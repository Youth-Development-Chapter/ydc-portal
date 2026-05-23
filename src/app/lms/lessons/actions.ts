'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface SubmitQuizResult {
  ok: true
  passed: boolean
  /** Total number of questions in the quiz */
  total: number
  /**
   * The number of failed attempts so far for this lesson (post-update).
   * We surface this so the UI can show "Attempt 3" badges later if desired,
   * but we deliberately do not return which questions were wrong.
   */
  failedAttempts: number
  /**
   * Set to the course id when this submission was the one that completed
   * the entire course. The DB trigger awards coins separately.
   */
  completedCourseId: string | null
  /** Reward coins granted, when completedCourseId is set. */
  rewardCoins: number
}

export interface SubmitQuizError {
  ok: false
  error: string
}

/**
 * Server-side quiz grading.
 *
 * We never trust the client with the answer key. The client sends only
 * its chosen option indexes; we fetch the correct answers here, grade,
 * and return a binary pass/fail along with the question count. We
 * intentionally do NOT return which individual answers were wrong —
 * users would otherwise just probe the API to learn the key.
 *
 * On pass: upsert into user_progress, which triggers
 * handle_course_completion() on the database side. If that ended up
 * crediting a course-completion coin transaction, we surface that to
 * the client so the UI can show a "Course complete + reward" screen.
 *
 * On fail: increment quiz_attempts.failed_attempts for this lesson.
 * No user_progress row is written, so the chapter stays "not done" and
 * the user has to redo it.
 */
export async function submitQuiz(
  lessonId: string,
  answers: number[],
  difficulty: 'beginner' | 'advanced' | 'expert',
  language: 'en' | 'ur',
): Promise<SubmitQuizResult | SubmitQuizError> {
  const supabase = await createClient()

  // 1. Authenticate
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  if (!Array.isArray(answers)) {
    return { ok: false, error: 'Invalid submission.' }
  }

  // 2. Fetch the answer key + the lesson's course (for completion detection) matching difficulty
  const { data: mcqs, error: mcqsError } = await supabase
    .from('mcqs')
    .select('correct_answer_index')
    .eq('lesson_id', lessonId)
    .eq('difficulty', difficulty)
    .order('created_at', { ascending: true }) // ensure stable order

  if (mcqsError) {
    console.error('submitQuiz: failed to load mcqs', mcqsError)
    return { ok: false, error: 'Could not load quiz.' }
  }
  if (!mcqs || mcqs.length === 0) {
    return { ok: false, error: `This lesson has no quiz for the selected difficulty level (${difficulty}).` }
  }

  if (answers.length !== mcqs.length) {
    return { ok: false, error: 'Answered question count does not match the quiz.' }
  }

  // 3. Grade — order in `mcqs` must match the order the client saw.
  let allCorrect = true
  for (let i = 0; i < mcqs.length; i++) {
    if (answers[i] !== mcqs[i].correct_answer_index) {
      allCorrect = false
    }
  }

  // 4. Find the course this lesson belongs to.
  const { data: lessonRow, error: lessonError } = await supabase
    .from('lessons')
    .select('module_id')
    .eq('id', lessonId)
    .single()

  if (lessonError || !lessonRow) {
    console.error('submitQuiz: failed to find lesson', lessonError)
    return { ok: false, error: 'Lesson not found.' }
  }

  const { data: moduleRow, error: moduleError } = await supabase
    .from('modules')
    .select('course_id')
    .eq('id', lessonRow.module_id)
    .single()

  if (moduleError || !moduleRow) {
    console.error('submitQuiz: failed to find module', moduleError)
    return { ok: false, error: 'Course not found.' }
  }

  const courseId = moduleRow.course_id as string

  // 5. On pass: record progress (triggers course-completion and chapter reward in DB).
  if (allCorrect) {
    const { data: progressRow, error: progressError } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
          language: language,
          difficulty: difficulty,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,course_id,lesson_id,language,difficulty' },
      )
      .select('id')
      .single()

    if (progressError || !progressRow) {
      console.error('submitQuiz: failed to save progress', progressError)
      return { ok: false, error: 'Could not save your progress.' }
    }

    // Run queries in parallel
    const [attemptsResult, allModulesResult, progressRowsResult, txnsResult] = await Promise.all([
      // Read attempts
      supabase
        .from('quiz_attempts')
        .select('failed_attempts')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle(),

      // Get all modules
      supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId),

      // Get all progress for this language to count unique completed lessons
      supabase
        .from('user_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('language', language)
        .eq('completed', true),

      // Fetch the coin transactions created by this progress update
      supabase
        .from('coin_transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('reference_id', progressRow.id),
    ])

    const attemptsRow = attemptsResult.data
    const allModules = allModulesResult.data
    const progressRows = progressRowsResult.data
    const txns = txnsResult.data

    const completedLessonsCount = new Set((progressRows || []).map(r => r.lesson_id)).size

    const moduleIds = allModules?.map(m => m.id) || []
    let totalLessonsCount = 0
    if (moduleIds.length > 0) {
      const { count } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .in('module_id', moduleIds)
      totalLessonsCount = count || 0
    }

    const isCourseCompleted = totalLessonsCount !== 0 && completedLessonsCount >= totalLessonsCount

    let completedCourseId: string | null = null
    if (isCourseCompleted) {
      completedCourseId = courseId
    }

    const rewardCoins = (txns || []).reduce((sum, tx) => sum + (tx.amount || 0), 0)

    revalidatePath(`/lms/courses/${courseId}`)
    revalidatePath('/lms/courses')
    revalidatePath('/dashboard')

    return {
      ok: true,
      passed: true,
      total: mcqs.length,
      failedAttempts: attemptsRow?.failed_attempts ?? 0,
      completedCourseId,
      rewardCoins,
    }
  }

  // 6. On fail: increment the attempt counter.
  const { data: existing } = await supabase
    .from('quiz_attempts')
    .select('failed_attempts')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  const nextCount = (existing?.failed_attempts ?? 0) + 1

  const { error: attemptError } = await supabase
    .from('quiz_attempts')
    .upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        failed_attempts: nextCount,
        last_attempt_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_id' },
    )

  if (attemptError) {
    console.error('submitQuiz: failed to record attempt', attemptError)
  }

  return {
    ok: true,
    passed: false,
    total: mcqs.length,
    failedAttempts: nextCount,
    completedCourseId: null,
    rewardCoins: 0,
  }
}
