'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function signup(prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullname = formData.get('fullname') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const { error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullname,
      }
    }
  })

  if (authError) {
    return { error: authError.message }
  }

  return { success: 'Registration successful! Please check your email to verify your account.' }
}

export async function completeProfile(prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'You must be logged in to complete your profile.' }
  }

  const father_name = formData.get('father_name') as string
  const dob = formData.get('dob') as string
  const whatsapp = formData.get('whatsapp') as string
  const phone = formData.get('phone') as string
  const city = formData.get('city') as string
  const district = formData.get('district') as string
  const division = formData.get('division') as string
  const qualification = formData.get('qualification') as string
  const address = formData.get('address') as string
  const profile_pic = formData.get('profile_pic') as File | null

  let avatarUrl = null
  const userId = user.id

  if (profile_pic && profile_pic.size > 0) {
    const fileExt = profile_pic.name.split('.').pop()
    const fileName = `${userId}-${Math.random()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(`public/${fileName}`, profile_pic)

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(`public/${fileName}`)
      avatarUrl = publicUrlData.publicUrl
    }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      full_name: user.user_metadata.full_name,
      father_name,
      dob: dob || null,
      whatsapp,
      phone: phone || null,
      city,
      district,
      division,
      qualification,
      address,
      avatar_url: avatarUrl,
    })

  if (profileError) {
    return { error: profileError.message }
  }

  redirect('/dashboard')
}

export async function login(prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const rememberMe = formData.get('remember-me') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  // If they didn't check remember me, we set a temporary cookie flag to instruct our SSR client
  // to strip the expiration date off the auth cookies, making them session cookies.
  if (!rememberMe) {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    cookieStore.set('session_only', 'true', { path: '/' })
  } else {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    cookieStore.delete('session_only')
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function resetPassword(prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Email is required' }
  }

  // The redirect URL where the user will be sent after clicking the email link
  // Must match your Supabase configuration
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const redirectUrl = `${origin}/auth/callback?next=/auth/reset-password`

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Password reset link sent to your email.' }
}

export async function updatePassword(prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters long' }
  }

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}
