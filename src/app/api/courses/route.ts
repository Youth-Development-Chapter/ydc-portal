import { NextResponse } from 'next/server'
import { createApiClient } from '@/utils/supabase/api'

// Note: This route is kept for backward compatibility / external callers.
// In-app pages query Supabase directly via `lib/lms-data.ts` to avoid an
// extra server-to-server HTTP hop on Vercel.

export async function GET(request: Request) {
  try {
    const supabase = await createApiClient(request)

    // Fetch all courses
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: true })

    if (coursesError) {
      console.error('Error fetching courses:', coursesError)
      return NextResponse.json({ error: coursesError.message }, { status: 500 })
    }

    if (!coursesData || coursesData.length === 0) {
      return NextResponse.json([])
    }

    // Fetch all modules grouped by course
    const { data: modulesData, error: modulesError } = await supabase
      .from('modules')
      .select('*')
      .order('order_index', { ascending: true })

    if (modulesError) {
      console.error('Error fetching modules:', modulesError)
      return NextResponse.json({ error: modulesError.message }, { status: 500 })
    }

    // Group modules by course_id
    const modulesByCourse: Record<string, { id: string; title: string; duration: string }[]> = {}
    modulesData?.forEach((mod) => {
      if (!modulesByCourse[mod.course_id]) {
        modulesByCourse[mod.course_id] = []
      }
      modulesByCourse[mod.course_id].push({
        id: mod.id,
        title: mod.title,
        duration: mod.duration,
      })
    })

    // Map modules into courses
    const response = coursesData.map((course) => ({
      id: course.id,
      title: course.title,
      author: course.author,
      description: course.description,
      imageUrl: course.image_url,
      modules: modulesByCourse[course.id] || [],
    }))

    return NextResponse.json(response)
  } catch (error: unknown) {
    console.error('Unhandled server error in GET /api/courses:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
