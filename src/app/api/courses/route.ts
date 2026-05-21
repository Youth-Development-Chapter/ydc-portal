import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

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
    const modulesByCourse: Record<string, any[]> = {}
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
  } catch (error: any) {
    console.error('Unhandled server error in GET /api/courses:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
