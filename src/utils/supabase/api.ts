import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from './server'

/**
 * Creates a Supabase client that can authenticate via either:
 * 1. An 'Authorization: Bearer <JWT>' HTTP header (ideal for mobile apps & REST clients)
 * 2. Next.js Cookie Session (ideal for web pages & Server Actions)
 * 
 * @param req Optional request object to extract authorization headers from
 */
export async function createApiClient(req?: Request) {
  const authHeader = req?.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim()
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )
  }

  // Fallback to standard cookie-based server client for web requests
  return await createServerClient()
}
