import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin: requestOrigin } = new URL(request.url)
  
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

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Successfully exchanged code for session
      // Redirect to the intended page (or dashboard)
      // Our middleware will automatically catch them and send them to /onboarding if needed
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
