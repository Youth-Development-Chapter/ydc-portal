import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import CoursesAdminClient, { type CourseRow } from './CoursesAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminCoursesPage() {
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

  // Fetch courses + module counts
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, author, description, image_url, created_at')
    .order('created_at', { ascending: true })

  const { data: modules } = await supabase.from('modules').select('id, course_id')

  const moduleCountByCourse: Record<string, number> = {}
  for (const m of modules || []) {
    moduleCountByCourse[m.course_id] = (moduleCountByCourse[m.course_id] || 0) + 1
  }

  const rows: CourseRow[] = (courses || []).map((c) => ({
    id: c.id,
    title: c.title,
    author: c.author,
    description: c.description || '',
    imageUrl: c.image_url || '',
    moduleCount: moduleCountByCourse[c.id] || 0,
  }))

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-zinc-950">Courses & LMS</h1>
        <p className="text-zinc-500 text-sm">
          Create and manage courses, modules, lessons, and quizzes used in the Academy.
        </p>
      </div>

      <CoursesAdminClient initialCourses={rows} />
    </div>
  )
}
