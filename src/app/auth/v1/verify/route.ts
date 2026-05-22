import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  
  // Retrieve the public Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    console.error('Verify Route: NEXT_PUBLIC_SUPABASE_URL environment variable is missing')
    return new Response('Supabase URL is not configured on the portal application.', { status: 500 })
  }

  if (!token || !type) {
    console.error('Verify Route: Missing token or type in verification request')
    return new Response('Invalid verification request: token and type are required.', { status: 400 })
  }

  // Construct the target URL on the local/public Supabase instance
  const targetUrl = new URL(`${supabaseUrl}/auth/v1/verify`)
  targetUrl.searchParams.set('token', token)
  targetUrl.searchParams.set('type', type)
  
  // Redirect back to Next.js auth callback on the origin that handled this request
  targetUrl.searchParams.set('redirect_to', `${origin}/auth/callback`)

  console.log(`Verify Route: Redirecting user to Supabase Auth at: ${targetUrl.toString()}`)
  return NextResponse.redirect(targetUrl.toString())
}
