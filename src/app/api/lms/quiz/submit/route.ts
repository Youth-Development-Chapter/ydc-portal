import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/utils/supabase/api'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lessonId, answers, difficulty, language } = body

    if (!lessonId || !Array.isArray(answers) || !difficulty || !language) {
      return NextResponse.json(
        { error: 'lessonId, answers (array), difficulty, and language are required' },
        { status: 400 }
      )
    }

    if (!['beginner', 'advanced', 'expert'].includes(difficulty)) {
      return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 })
    }

    if (!['en', 'ur'].includes(language)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 })
    }

    const supabase = await createApiClient(request)

    // 1. Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch the answer key matching difficulty
    const { data: mcqs, error: mcqsError } = await supabase
      .from('mcqs')
      .select('correct_answer_index')
      .eq('lesson_id', lessonId)
      .eq('difficulty', difficulty)
      .order('created_at', { ascending: true }) // ensure stable order

    if (mcqsError) {
      console.error('API submitQuiz: failed to load mcqs', mcqsError)
      return NextResponse.json({ error: 'Could not load quiz' }, { status: 500 })
    }
    if (!mcqs || mcqs.length === 0) {
      return NextResponse.json(
        { error: `This lesson has no quiz for the selected difficulty level (${difficulty}).` },
        { status: 404 }
      )
    }

    if (answers.length !== mcqs.length) {
      return NextResponse.json(
        { error: 'Answered question count does not match the quiz.' },
        { status: 400 }
      )
    }

    // 3. Grade
    let allCorrect = true
    for (let i = 0; i < mcqs.length; i++) {
      if (answers[i] !== mcqs[i].correct_answer_index) {
        allCorrect = false
      }
    }

    // 4. Find the course this lesson belongs to
    const { data: lessonRow, error: lessonError } = await supabase
      .from('lessons')
      .select('module_id')
      .eq('id', lessonId)
      .single()

    if (lessonError || !lessonRow) {
      console.error('API submitQuiz: failed to find lesson', lessonError)
      return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 })
    }

    const { data: moduleRow, error: moduleError } = await supabase
      .from('modules')
      .select('course_id')
      .eq('id', lessonRow.module_id)
      .single()

    if (moduleError || !moduleRow) {
      console.error('API submitQuiz: failed to find module', moduleError)
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 })
    }

    const courseId = moduleRow.course_id as string

    // 5. On pass: record progress
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
          { onConflict: 'user_id,course_id,lesson_id,language,difficulty' }
        )
        .select('id')
        .single()

      if (progressError || !progressRow) {
        console.error('API submitQuiz: failed to save progress', progressError)
        return NextResponse.json({ error: 'Could not save your progress.' }, { status: 500 })
      }

      // Query verification data in parallel
      const [attemptsResult, allModulesResult, progressRowsResult, txnsResult] = await Promise.all([
        supabase
          .from('quiz_attempts')
          .select('failed_attempts')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .maybeSingle(),

        supabase
          .from('modules')
          .select('id')
          .eq('course_id', courseId),

        supabase
          .from('user_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .eq('language', language)
          .eq('completed', true),

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
      const completedCourseId = isCourseCompleted ? courseId : null
      const rewardCoins = (txns || []).reduce((sum, tx) => sum + (tx.amount || 0), 0)

      return NextResponse.json({
        ok: true,
        passed: true,
        total: mcqs.length,
        failedAttempts: attemptsRow?.failed_attempts ?? 0,
        completedCourseId,
        rewardCoins,
      })
    }

    // 6. On fail: increment the attempt counter
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
        { onConflict: 'user_id,lesson_id' }
      )

    if (attemptError) {
      console.error('API submitQuiz: failed to record attempt', attemptError)
    }

    return NextResponse.json({
      ok: true,
      passed: false,
      total: mcqs.length,
      failedAttempts: nextCount,
      completedCourseId: null,
      rewardCoins: 0,
    })
  } catch (error: unknown) {
    console.error('Unhandled server error in POST /api/lms/quiz/submit:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
