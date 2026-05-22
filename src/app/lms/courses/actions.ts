'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function lockCourseLanguage(courseId: string, language: 'en' | 'ur') {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not signed in.' }
  }

  // Insert or update settings in user_course_settings
  const { error } = await supabase
    .from('user_course_settings')
    .upsert({
      user_id: user.id,
      course_id: courseId,
      language: language,
    }, {
      onConflict: 'user_id,course_id'
    })

  if (error) {
    console.error('lockCourseLanguage error:', error)
    return { error: `Failed to lock language: ${error.message}` }
  }

  revalidatePath(`/lms/courses/${courseId}`)
  revalidatePath('/lms/courses')
  revalidatePath('/dashboard')

  return { success: true }
}
