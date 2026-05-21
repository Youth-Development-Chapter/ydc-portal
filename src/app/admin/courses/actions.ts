'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

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

  const { error } = await supabase!.from('courses').insert({
    id: trimmedId,
    title: data.title,
    author: data.author,
    description: data.description,
    image_url: data.imageUrl || null,
  })

  if (error) return { error: error.message }
  revalidateCourse(trimmedId)
  return { success: true as const, id: trimmedId }
}

export async function updateCourse(
  id: string,
  data: { title: string; author: string; description: string; imageUrl: string },
) {
  const ctx = await requireCourseAdmin()
  if (ctx.error) return { error: ctx.error }
  const { supabase } = ctx

  const { error } = await supabase!
    .from('courses')
    .update({
      title: data.title,
      author: data.author,
      description: data.description,
      image_url: data.imageUrl || null,
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

  const trimmedId = data.id.trim()
  if (!trimmedId || !data.title.trim()) {
    return { error: 'id and title are required.' }
  }
  if (!/^[a-z0-9_-]+$/i.test(trimmedId)) {
    return { error: 'Lesson id must contain only letters, digits, dashes, or underscores.' }
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
