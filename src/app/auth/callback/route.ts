import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin: requestOrigin } = new URL(request.url)
  console.log('[Auth Callback] GET invoked with URL:', request.url)
  
  // Reconstruct origin from forwarding headers if behind a reverse proxy
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const reconstructedOrigin = forwardedHost && forwardedProto 
    ? `${forwardedProto}://${forwardedHost}` 
    : null

  const origin = process.env.NEXT_PUBLIC_SITE_URL || reconstructedOrigin || requestOrigin
  const code = searchParams.get('code')
  
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'
  console.log('[Auth Callback] Code present:', !!code, 'Origin:', origin, 'Next path:', next)

  // Construct the redirect response first
  const response = NextResponse.redirect(`${origin}${next}`)

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              const isSessionOnly = cookieStore.get('session_only')?.value === 'true'
              console.log('[Auth Callback] cookies.setAll invoked with cookies:', cookiesToSet.map(c => c.name))
              
              cookiesToSet.forEach(({ name, value, options }) => {
                if (isSessionOnly) {
                  delete options.maxAge
                  delete options.expires
                }
                // Write to request cookies context
                cookieStore.set(name, value, options)
                // Write directly to returned response cookies to ensure browser stores it
                response.cookies.set(name, value, options)
              })
            } catch (e) {
              console.error('[Auth Callback] setAll failed in auth callback route handler:', e)
            }
          },
        },
      }
    )

    console.log('[Auth Callback] Exchanging code for session...')
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('[Auth Callback] exchangeCodeForSession failed:', error)
    } else {
      console.log('[Auth Callback] Code exchange successful. User ID:', data.user?.id)
      return response
    }
  }

  // return the user to an error page with instructions
  console.log('[Auth Callback] Authentication failed, redirecting to error page.')
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}


