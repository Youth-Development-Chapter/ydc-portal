import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext } from '@/lib/admin'
import PresidentConsoleClient from './PresidentConsoleClient'

export const dynamic = 'force-dynamic'

export default async function PresidentConsolePage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // 2. Fetch role and permissions
  const { role, permissions } = await getAdminContext(user.id)
  
  // Only allow President, Superadmin, and legacy Admin roles
  if (!['president', 'superadmin', 'admin'].includes(role)) {
    redirect('/dashboard')
  }

  // 3. Fetch admin division
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('division')
    .eq('id', user.id)
    .single()
  
  const adminDivision = adminProfile?.division || null

  // 4. Fetch pending deeds submissions
  const { data: submissions } = await supabase
    .from('deed_submissions')
    .select('*, profiles:user_id(*)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  // 5. Fetch user streaks
  const { data: streaks } = await supabase
    .from('streaks')
    .select('*')

  const streakMap = new Map(
    streaks?.map((s) => [s.user_id, s.current_streak]) || []
  )

  // Map user streaks to submissions and filter by division if president
  let mappedSubmissions = (submissions || []).map((sub) => ({
    id: sub.id,
    user_id: sub.user_id,
    description: sub.description,
    proof_url: sub.proof_url,
    created_at: sub.created_at,
    profiles: {
      full_name: sub.profiles?.full_name || 'Anonymous Member',
      division: sub.profiles?.division || 'Not specified',
      qualification: sub.profiles?.qualification || 'Not specified',
      id: sub.profiles?.id,
    },
    streak: streakMap.get(sub.user_id) || 0,
  }))

  if (role === 'president' && adminDivision) {
    mappedSubmissions = mappedSubmissions.filter(
      (sub) => sub.profiles.division?.toLowerCase() === adminDivision.toLowerCase()
    )
  }

  // 6. Fetch events
  let eventsQuery = supabase.from('events').select('*')
  if (role === 'president' && adminDivision) {
    eventsQuery = eventsQuery.eq('division', adminDivision)
  }
  const { data: events } = await eventsQuery.order('date', { ascending: false })

  // 7. Fetch registrations for these events
  const eventIds = (events || []).map(e => e.id)
  let regsQuery = supabase
    .from('event_registrations')
    .select('*, profiles:user_id(full_name, division, qualification)')
  
  if (eventIds.length > 0) {
    regsQuery = regsQuery.in('event_id', eventIds)
  } else {
    // If no events exist, query a non-existent UUID to return empty array safely
    regsQuery = regsQuery.eq('event_id', '00000000-0000-0000-0000-000000000000')
  }
  const { data: registrations } = await regsQuery.order('created_at', { ascending: false })

  return (
    <PresidentConsoleClient 
      submissions={mappedSubmissions}
      events={events || []}
      registrations={(registrations || []) as any}
      adminRole={role}
      adminDivision={adminDivision}
    />
  )
}
