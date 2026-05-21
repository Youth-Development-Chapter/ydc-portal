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

  // Authorize: LMS RLS requires literal profiles.role = 'admin'.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/admin')
  }

  // Fetch course
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, author, description, image_url')
    .eq('id', id)
    .single()

  if (!course) {
    notFound()
  }

  // Fetch all modules for this course
  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, duration, order_index')
    .eq('course_id', id)
    .order('order_index', { ascending: true })

  const moduleIds = (modules || []).map((m) => m.id)

  // Fetch all lessons for these modules in one shot
  type LessonRow = {
    id: string
    module_id: string
    title: string
    video_url: string | null
    text_content: string | null
    order_index: number
  }
  const { data: lessons } = moduleIds.length
    ? await supabase
        .from('lessons')
        .select('id, module_id, title, video_url, text_content, order_index')
        .in('module_id', moduleIds)
        .order('order_index', { ascending: true })
    : { data: [] as LessonRow[] }

  const lessonIds = (lessons || []).map((l: LessonRow) => l.id)

  // Fetch all MCQs for these lessons in one shot
  type McqRow = {
    id: string
    lesson_id: string
    question: string
    options: unknown
    correct_answer_index: number
  }
  const { data: mcqs } = lessonIds.length
    ? await supabase
        .from('mcqs')
        .select('id, lesson_id, question, options, correct_answer_index')
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
      options: Array.isArray(m.options)
        ? (m.options as string[])
        : typeof m.options === 'string'
          ? (JSON.parse(m.options) as string[])
          : [],
      correctAnswerIndex: m.correct_answer_index,
    })
  }

  const lessonsByModule: Record<string, LessonNode[]> = {}
  for (const l of lessons || []) {
    if (!lessonsByModule[l.module_id]) lessonsByModule[l.module_id] = []
    lessonsByModule[l.module_id].push({
      id: l.id,
      title: l.title,
      videoUrl: l.video_url || '',
      textContent: l.text_content || '',
      orderIndex: l.order_index,
      mcqs: mcqsByLesson[l.id] || [],
    })
  }

  const moduleTree: ModuleNode[] = (modules || []).map((m) => ({
    id: m.id,
    title: m.title,
    duration: m.duration,
    orderIndex: m.order_index,
    lessons: lessonsByModule[m.id] || [],
  }))

  const data: CourseBuilderData = {
    course: {
      id: course.id,
      title: course.title,
      author: course.author,
      description: course.description || '',
      imageUrl: course.image_url || '',
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
