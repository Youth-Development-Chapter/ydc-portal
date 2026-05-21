import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Kept for backward compatibility. In-app pages use `lib/lms-data.ts`.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Fetch the specific course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single()

    if (courseError) {
      if (courseError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }
      console.error(`Error fetching course ${id}:`, courseError)
      return NextResponse.json({ error: courseError.message }, { status: 500 })
    }

    // Fetch the modules for this course
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, title, duration')
      .eq('course_id', id)
      .order('order_index', { ascending: true })

    if (modulesError) {
      console.error(`Error fetching modules for course ${id}:`, modulesError)
      return NextResponse.json({ error: modulesError.message }, { status: 500 })
    }

    const response = {
      id: course.id,
      title: course.title,
      author: course.author,
      description: course.description,
      imageUrl: course.image_url,
      modules: modules || [],
    }

    return NextResponse.json(response)
  } catch (error: unknown) {
    console.error('Unhandled server error in GET /api/courses/[id]:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
