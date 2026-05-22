import React from 'react'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import CourseBuilder, {
  type CourseBuilderData,
  type ModuleNode,
  type LessonNode,
  type McqNode,
} from './CourseBuilder'

export const dynamic = 'force-dynamic'

export default async function AdminCourseEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Authenticate
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Authorize
  const { hasAdminPermission } = await import('@/lib/admin')
  const hasPermission = await hasAdminPermission(user.id, 'can_manage_courses')
  if (!hasPermission) {
    redirect('/admin')
  }

  // Fetch course
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, title_ur, author, description, description_ur, image_url, reward_points')
    .eq('id', id)
    .single()

  if (!course) {
    notFound()
  }

  // Fetch all modules for this course
  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, title_ur, duration, order_index')
    .eq('course_id', id)
    .order('order_index', { ascending: true })

  const moduleIds = (modules || []).map((m) => m.id)

  // Fetch all lessons for these modules in one shot
  type LessonRow = {
    id: string
    module_id: string
    title: string
    title_ur: string | null
    video_url: string | null
    video_url_ur: string | null
    text_content: string | null
    text_content_ur: string | null
    order_index: number
  }
  const { data: lessons } = moduleIds.length
    ? await supabase
        .from('lessons')
        .select('id, module_id, title, title_ur, video_url, video_url_ur, text_content, text_content_ur, order_index')
        .in('module_id', moduleIds)
        .order('order_index', { ascending: true })
    : { data: [] as LessonRow[] }

  const lessonIds = (lessons || []).map((l: LessonRow) => l.id)

  // Fetch all MCQs for these lessons in one shot
  type McqRow = {
    id: string
    lesson_id: string
    question: string
    question_ur: string | null
    options: unknown
    options_ur: unknown
    correct_answer_index: number
    difficulty: string
  }
  const { data: mcqs } = lessonIds.length
    ? await supabase
        .from('mcqs')
        .select('id, lesson_id, question, question_ur, options, options_ur, correct_answer_index, difficulty')
        .in('lesson_id', lessonIds)
    : { data: [] as McqRow[] }

  // Stitch the tree
  const mcqsByLesson: Record<string, McqNode[]> = {}
  for (const m of (mcqs || []) as McqRow[]) {
    const key = m.lesson_id
    if (!mcqsByLesson[key]) mcqsByLesson[key] = []
    mcqsByLesson[key].push({
      id: m.id,
      question: m.question,
      questionUr: m.question_ur || undefined,
      options: Array.isArray(m.options)
        ? (m.options as string[])
        : typeof m.options === 'string'
          ? (JSON.parse(m.options) as string[])
          : [],
      optionsUr: m.options_ur
        ? (Array.isArray(m.options_ur)
          ? (m.options_ur as string[])
          : typeof m.options_ur === 'string'
            ? (JSON.parse(m.options_ur) as string[])
            : undefined)
        : undefined,
      correctAnswerIndex: m.correct_answer_index,
      difficulty: (m.difficulty || 'beginner') as 'beginner' | 'advanced' | 'expert',
    })
  }

  const lessonsByModule: Record<string, LessonNode[]> = {}
  for (const l of lessons || []) {
    if (!lessonsByModule[l.module_id]) lessonsByModule[l.module_id] = []
    lessonsByModule[l.module_id].push({
      id: l.id,
      title: l.title,
      titleUr: l.title_ur || undefined,
      videoUrl: l.video_url || '',
      videoUrlUr: l.video_url_ur || '',
      textContent: l.text_content || '',
      textContentUr: l.text_content_ur || '',
      orderIndex: l.order_index,
      mcqs: mcqsByLesson[l.id] || [],
    })
  }

  const moduleTree: ModuleNode[] = (modules || []).map((m) => ({
    id: m.id,
    title: m.title,
    titleUr: m.title_ur || undefined,
    duration: m.duration,
    orderIndex: m.order_index,
    lessons: lessonsByModule[m.id] || [],
  }))

  const data: CourseBuilderData = {
    course: {
      id: course.id,
      title: course.title,
      titleUr: course.title_ur || undefined,
      author: course.author,
      description: course.description || '',
      descriptionUr: course.description_ur || '',
      imageUrl: course.image_url || '',
      rewardPoints: course.reward_points ?? 50,
    },
    modules: moduleTree,
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900"
        >
          <ChevronLeft size={16} /> Back to Courses
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-zinc-950">{course.title}</h1>
        <p className="text-zinc-500 text-sm font-mono">{course.id}</p>
      </div>

      <CourseBuilder initial={data} />
    </div>
  )
}
