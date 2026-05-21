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
): Promise<SubmitQuizResult | SubmitQuizError> {
  const supabase = await createClient()

  // 1. Authenticate
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  if (!Array.isArray(answers)) {
    return { ok: false, error: 'Invalid submission.' }
  }

  // 2. Fetch the answer key + the lesson's course (for completion detection).
  const { data: mcqs, error: mcqsError } = await supabase
    .from('mcqs')
    .select('correct_answer_index')
    .eq('lesson_id', lessonId)

  if (mcqsError) {
    console.error('submitQuiz: failed to load mcqs', mcqsError)
    return { ok: false, error: 'Could not load quiz.' }
  }
  if (!mcqs || mcqs.length === 0) {
    return { ok: false, error: 'This lesson has no quiz.' }
  }

  if (answers.length !== mcqs.length) {
    return { ok: false, error: 'Answered question count does not match the quiz.' }
  }

  // 3. Grade — order in `mcqs` must match the order the client saw. We
  // rely on Supabase returning rows in insertion order for a given lesson.
  // (If we ever add reorderable MCQs we will need an explicit order column.)
  let allCorrect = true
  for (let i = 0; i < mcqs.length; i++) {
    if (answers[i] !== mcqs[i].correct_answer_index) {
      allCorrect = false
      // No early return — we never tell the user which one was wrong,
      // but exhausting the loop also doesn't help an attacker since we
      // only ever return the total + pass/fail bit.
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

  // 5. On pass: record progress (triggers course-completion reward in DB).
  if (allCorrect) {
    const { error: progressError } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,course_id,lesson_id' },
      )

    if (progressError) {
      console.error('submitQuiz: failed to save progress', progressError)
      return { ok: false, error: 'Could not save your progress.' }
    }

    // Read existing attempts so we can report failedAttempts honestly
    // even on a winning attempt.
    const { data: attemptsRow } = await supabase
      .from('quiz_attempts')
      .select('failed_attempts')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .maybeSingle()

    // Check whether the database trigger just awarded course-completion
    // coins for this course. The trigger is fire-and-forget so we have
    // to look the result up.
    const completionReason = `course_completion:${courseId}`
    const { data: completionTxn } = await supabase
      .from('coin_transactions')
      .select('amount, created_at')
      .eq('user_id', user.id)
      .eq('reason', completionReason)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let completedCourseId: string | null = null
    let rewardCoins = 0
    if (completionTxn) {
      // Treat the course as "just completed" if the txn is fresh — within
      // 30 seconds of this request. Otherwise it was already awarded on a
      // prior submission and we should not double-celebrate.
      const txnTime = new Date(completionTxn.created_at as string).getTime()
      if (Date.now() - txnTime < 30_000) {
        completedCourseId = courseId
        rewardCoins = (completionTxn.amount as number) || 0
      }
    }

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

  // 6. On fail: increment the attempt counter. Upsert handles the
  // first-attempt case where no row exists yet.
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
    // Non-fatal — log but still tell the user they failed so they don't
    // get stuck on the test.
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
