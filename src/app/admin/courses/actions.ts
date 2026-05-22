'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// LMS RLS policies allow writes only when profiles.role = 'admin' literally.
// Other admin roles (superadmin/president/tier-3) would be rejected at the
// database layer, so we mirror that gate here for a clean error message.
async function requireCourseAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' as const, supabase: null, user: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return {
      error: "Permission denied. Only users with role='admin' can manage courses." as const,
      supabase: null,
      user: null,
    }
  }
  return { error: null, supabase, user }
}

function revalidateCourse(courseId?: string) {
  revalidatePath('/admin/courses')
  revalidatePath('/lms/courses')
  if (courseId) {
    revalidatePath(`/admin/courses/${courseId}`)
    revalidatePath(`/lms/courses/${courseId}`)
  }
}

// ─────────────────────────── Courses ───────────────────────────

export async function createCourse(data: {
  id: string
  title: string
  author: string
  description: string
  imageUrl: string
  rewardPoints: number
}) {
  const ctx = await requireCourseAdmin()
  if (ctx.error) return { error: ctx.error }
  const { supabase } = ctx

  const trimmedId = data.id.trim()
  if (!trimmedId || !data.title.trim() || !data.author.trim()) {
    return { error: 'id, title, and author are required.' }
  }
  if (!/^[a-z0-9_-]+$/i.test(trimmedId)) {
    return { error: 'Course id must contain only letters, digits, dashes, or underscores.' }
  }
  if (!Number.isInteger(data.rewardPoints) || data.rewardPoints < 0) {
    return { error: 'Reward points must be a non-negative integer.' }
  }

  const { error } = await supabase!.from('courses').insert({
    id: trimmedId,
    title: data.title,
    author: data.author,
    description: data.description,
    image_url: data.imageUrl || null,
    reward_points: data.rewardPoints,
  })

  if (error) return { error: error.message }
  revalidateCourse(trimmedId)
  return { success: true as const, id: trimmedId }
}

export async function updateCourse(
  id: string,
  data: {
    title: string
    author: string
    description: string
    imageUrl: string
    rewardPoints: number
  },
) {
  const ctx = await requireCourseAdmin()
  if (ctx.error) return { error: ctx.error }
  const { supabase } = ctx

  if (!Number.isInteger(data.rewardPoints) || data.rewardPoints < 0) {
    return { error: 'Reward points must be a non-negative integer.' }
  }

  const { error } = await supabase!
    .from('courses')
    .update({
      title: data.title,
      author: data.author,
      description: data.description,
      image_url: data.imageUrl || null,
      reward_points: data.rewardPoints,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidateCourse(id)
  return { success: true as const }
}

export async function deleteCourse(id: string) {
  const ctx = await requireCourseAdmin()
  if (ctx.error) return { error: ctx.error }
  const { supabase } = ctx

  // ON DELETE CASCADE on modules→lessons→mcqs handles the cleanup.
  const { error } = await supabase!.from('courses').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateCourse()
  return { success: true as const }
}

// ─────────────────────────── Modules ───────────────────────────

export async function createModule(data: {
  id: string
  courseId: string
  title: string
  duration: string
  orderIndex: number
}) {
  const ctx = await requireCourseAdmin()
  if (ctx.error) return { error: ctx.error }
  const { supabase } = ctx

  const trimmedId = data.id.trim()
  if (!trimmedId || !data.title.trim()) {
    return { error: 'id and title are required.' }
  }
  if (!/^[a-z0-9_-]+$/i.test(trimmedId)) {
    return { error: 'Module id must contain only letters, digits, dashes, or underscores.' }
  }

  const { error } = await supabase!.from('modules').insert({
    id: trimmedId,
    course_id: data.courseId,
    title: data.title,
    duration: data.duration || '',
    order_index: data.orderIndex,
  })

  if (error) return { error: error.message }
  revalidateCourse(data.courseId)
  return { success: true as const, id: trimmedId }
}

export async function updateModule(
  id: string,
  data: { title: string; duration: string; orderIndex: number; courseId: string },
) {
  const ctx = await requireCourseAdmin()
  if (ctx.error) return { error: ctx.error }
  const { supabase } = ctx

  const { error } = await supabase!
    .from('modules')
    .update({
      title: data.title,
      duration: data.duration,
      order_index: data.orderIndex,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidateCourse(data.courseId)
  return { success: true as const }
}

export async function deleteModule(id: string, courseId: string) {
  const ctx = await requireCourseAdmin()
  if (ctx.error) return { error: ctx.error }
  const { supabase } = ctx

  const { error } = await supabase!.from('modules').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateCourse(courseId)
  return { success: true as const }
}

// ─────────────────────────── Lessons ───────────────────────────

export async function createLesson(data: {
  id: string
  moduleId: string
  courseId: string
  title: string
  videoUrl: string
  textContent: string
  orderIndex: number
}) {
  const ctx = await requireCourseAdmin()
  if (ctx.error) return { error: ctx.error }
  const { supabase } = ctx

  const trimmedId = data.moduleId.trim()
  if (!trimmedId || !data.title.trim()) {
    return { error: 'moduleId and title are required.' }
  }
  if (!/^[a-z0-9_-]+$/i.test(trimmedId)) {
    return { error: 'Module id must contain only letters, digits, dashes, or underscores.' }
  }

  const { error } = await supabase!.from('lessons').insert({
    id: trimmedId,
    module_id: data.moduleId,
    title: data.title,
    video_url: data.videoUrl || null,
    text_content: data.textContent || '',
    order_index: data.orderIndex,
  })

  if (error) return { error: error.message }
  revalidateCourse(data.courseId)
  return { success: true as const, id: trimmedId }
}

export async function updateLesson(
  id: string,
  data: {
    title: string
    videoUrl: string
    textContent: string
    orderIndex: number
    courseId: string
  },
) {
  const ctx = await requireCourseAdmin()
  if (ctx.error) return { error: ctx.error }
  const { supabase } = ctx

  const { error } = await supabase!
    .from('lessons')
    .update({
      title: data.title,
      video_url: data.videoUrl || null,
      text_content: data.textContent || '',
      order_index: data.orderIndex,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidateCourse(data.courseId)
  return { success: true as const }
}

export async function deleteLesson(id: string, courseId: string) {
  const ctx = await requireCourseAdmin()
  if (ctx.error) return { error: ctx.error }
  const { supabase } = ctx

  const { error } = await supabase!.from('lessons').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateCourse(courseId)
  return { success: true as const }
}

// ─────────────────────────── MCQs ───────────────────────────

export async function createMcq(data: {
  lessonId: string
  courseId: string
  question: string
  options: string[]
  correctAnswerIndex: number
}) {
  const ctx = await requireCourseAdmin()
  if (ctx.error) return { error: ctx.error }
  const { supabase } = ctx

  if (!data.question.trim()) return { error: 'Question is required.' }
  if (!Array.isArray(data.options) || data.options.length < 2) {
    return { error: 'At least two options are required.' }
  }
  if (
    data.correctAnswerIndex < 0 ||
    data.correctAnswerIndex >= data.options.length
  ) {
    return { error: 'correctAnswerIndex is out of range.' }
  }

  const { data: inserted, error } = await supabase!
    .from('mcqs')
    .insert({
      lesson_id: data.lessonId,
      question: data.question,
      options: data.options,
      correct_answer_index: data.correctAnswerIndex,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidateCourse(data.courseId)
  return { success: true as const, id: inserted!.id as string }
}

export async function updateMcq(
  id: string,
  data: {
    courseId: string
    question: string
    options: string[]
    correctAnswerIndex: number
  },
) {
  const ctx = await requireCourseAdmin()
  if (ctx.error) return { error: ctx.error }
  const { supabase } = ctx

  if (!data.question.trim()) return { error: 'Question is required.' }
  if (!Array.isArray(data.options) || data.options.length < 2) {
    return { error: 'At least two options are required.' }
  }
  if (
    data.correctAnswerIndex < 0 ||
    data.correctAnswerIndex >= data.options.length
  ) {
    return { error: 'correctAnswerIndex is out of range.' }
  }

  const { error } = await supabase!
    .from('mcqs')
    .update({
      question: data.question,
      options: data.options,
      correct_answer_index: data.correctAnswerIndex,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidateCourse(data.courseId)
  return { success: true as const }
}

export async function deleteMcq(id: string, courseId: string) {
  const ctx = await requireCourseAdmin()
  if (ctx.error) return { error: ctx.error }
  const { supabase } = ctx

  const { error } = await supabase!.from('mcqs').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateCourse(courseId)
  return { success: true as const }
}

// ─────────────────────────── JSON Import Schema & Action ───────────────────────────

const mcqImportSchema = z.object({
  question: z.string().min(1, 'MCQ question cannot be empty'),
  options: z.array(z.string()).min(2, 'MCQ must have at least 2 options'),
  correctAnswerIndex: z.number().int().nonnegative('correctAnswerIndex must be non-negative'),
})

const lessonImportSchema = z.object({
  id: z.string().regex(/^[a-z0-9_-]+$/i, 'Lesson ID must contain only letters, numbers, dashes, or underscores'),
  title: z.string().min(1, 'Lesson title cannot be empty'),
  videoUrl: z.string().url('Invalid URL').or(z.string().length(0)).or(z.null()).optional(),
  textContent: z.string().optional().default(''),
  orderIndex: z.number().int().default(0),
  mcqs: z.array(mcqImportSchema).optional().default([]),
})

const moduleImportSchema = z.object({
  id: z.string().regex(/^[a-z0-9_-]+$/i, 'Module ID must contain only letters, numbers, dashes, or underscores'),
  title: z.string().min(1, 'Module title cannot be empty'),
  duration: z.string().optional().default(''),
  orderIndex: z.number().int().default(0),
  lessons: z.array(lessonImportSchema)
    .min(1, 'Each module must have at least one lesson')
    .max(1, 'Each module must have exactly one lesson in this version of the LMS'),
})

const courseImportSchema = z.object({
  id: z.string().regex(/^[a-z0-9_-]+$/i, 'Course ID must contain only letters, numbers, dashes, or underscores'),
  title: z.string().min(1, 'Course title cannot be empty'),
  author: z.string().min(1, 'Author cannot be empty'),
  description: z.string().optional().default(''),
  imageUrl: z.string().url('Invalid URL').or(z.string().length(0)).or(z.null()).optional(),
  rewardPoints: z.number().int().nonnegative().default(50),
  modules: z.array(moduleImportSchema).optional().default([]),
})

export async function importCourseFromJson(jsonText: string) {
  const ctx = await requireCourseAdmin()
  if (ctx.error) return { error: ctx.error }
  const { supabase } = ctx

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    return { error: `Invalid JSON syntax: ${errMsg}` }
  }

  const result = courseImportSchema.safeParse(parsed)
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    return { error: `Schema validation failed: ${issues}` }
  }

  const courseData = result.data
  const courseId = courseData.id

  // 1. Check if course exists
  const { data: existing } = await supabase!
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .maybeSingle()

  if (existing) {
    return { error: `A course with ID "${courseId}" already exists.` }
  }

  // Helper cleanup in case of nested failure
  const rollback = async () => {
    await supabase!.from('courses').delete().eq('id', courseId)
  }

  // 2. Insert Course
  const { error: courseError } = await supabase!.from('courses').insert({
    id: courseId,
    title: courseData.title,
    author: courseData.author,
    description: courseData.description,
    image_url: courseData.imageUrl || null,
    reward_points: courseData.rewardPoints,
  })

  if (courseError) {
    return { error: `Failed to insert course: ${courseError.message}` }
  }

  // 3. Insert Modules, Lessons, MCQs
  try {
    for (const mod of courseData.modules) {
      const { error: modError } = await supabase!.from('modules').insert({
        id: mod.id,
        course_id: courseId,
        title: mod.title,
        duration: mod.duration,
        order_index: mod.orderIndex,
      })

      if (modError) {
        throw new Error(`Failed to insert module "${mod.title}" (${mod.id}): ${modError.message}`)
      }

      // Since each module has exactly one lesson, we map the lesson's ID to match the module ID.
      // This is required to satisfy the LMS's 1-to-1 routing (/lms/lessons/[id] where id is the module ID)
      // and progress tracking (module completion check).
      const les = mod.lessons[0]
      const lessonId = mod.id

      const { error: lesError } = await supabase!.from('lessons').insert({
        id: lessonId,
        module_id: mod.id,
        title: les.title,
        video_url: les.videoUrl || null,
        text_content: les.textContent,
        order_index: les.orderIndex,
      })

      if (lesError) {
        throw new Error(`Failed to insert lesson "${les.title}" (${lessonId}): ${lesError.message}`)
      }

      for (const mcq of les.mcqs) {
        if (mcq.correctAnswerIndex < 0 || mcq.correctAnswerIndex >= mcq.options.length) {
          throw new Error(`Lesson "${les.title}" quiz: correctAnswerIndex ${mcq.correctAnswerIndex} is out of bounds for options array of size ${mcq.options.length}.`)
        }
        const { error: mcqError } = await supabase!.from('mcqs').insert({
          lesson_id: lessonId,
          question: mcq.question,
          options: mcq.options,
          correct_answer_index: mcq.correctAnswerIndex,
        })

        if (mcqError) {
          throw new Error(`Failed to insert MCQ for lesson "${les.title}": ${mcqError.message}`)
        }
      }
    }
  } catch (err) {
    // Rollback completely
    await rollback()
    const errMsg = err instanceof Error ? err.message : String(err)
    return { error: errMsg }
  }

  revalidateCourse(courseId)
  return { success: true, id: courseId }
}
