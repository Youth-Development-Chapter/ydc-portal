import { createClient } from '@supabase/supabase-js'

export function createPublicSupabaseServerClient() {
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables for server-side public client.')
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
