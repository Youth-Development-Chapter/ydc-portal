'use server'

import { randomUUID } from 'crypto'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

/** 5 MB upload limit for avatar images */
const MAX_AVATAR_SIZE = 5 * 1024 * 1024

/** Accepted image MIME types */
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
])

export async function signup(prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullname = formData.get('fullname') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters long' }
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const { error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
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

  const next = (formData.get('next') as string) || '/dashboard'

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
    // Server-side file validation
    if (profile_pic.size > MAX_AVATAR_SIZE) {
      return { error: 'Profile picture must be smaller than 5 MB.' }
    }
    if (!ALLOWED_IMAGE_TYPES.has(profile_pic.type)) {
      return { error: 'Profile picture must be a JPEG, PNG, WEBP, GIF, or HEIC file.' }
    }

    const fileExt = profile_pic.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${userId}/${randomUUID()}.${fileExt}`
    
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
      email: user.email,
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

  redirect(next)
}

export async function login(prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const rememberMe = formData.get('remember-me') as string
  const next = (formData.get('next') as string) || '/dashboard'

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  // If they didn't check remember me, we set a temporary cookie flag to instruct our SSR client
  // to strip the expiration date off the auth cookies, making them session cookies.
  if (!rememberMe) {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    cookieStore.set('session_only', 'true', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
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

  redirect(next)
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

  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters long' }
  }

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

