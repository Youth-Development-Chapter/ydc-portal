import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext } from '@/lib/admin'
import PresidentConsoleClient from './PresidentConsoleClient'
import { getRecentAnnouncements } from '@/lib/perf-data'

export const dynamic = 'force-dynamic'

export default async function PresidentConsolePage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
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

  // 3. Fetch admin unit_id
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('unit_id')
    .eq('id', user.id)
    .single()
  
  const adminUnitId = adminProfile?.unit_id || null

  // Fetch units early for mapping unit_id to division name
  const { data: unitsData } = await supabase.from('units').select('id, name').order('name')
  const unitMap = new Map((unitsData || []).map(u => [u.id, u.name]))

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

  // Map user streaks to submissions and filter by unit_id if president
  let mappedSubmissions = (submissions || []).map((sub) => ({
    id: sub.id,
    user_id: sub.user_id,
    description: sub.description,
    proof_url: sub.proof_url,
    created_at: sub.created_at,
    profiles: {
      full_name: sub.profiles?.full_name || 'Anonymous Member',
      unit_name: sub.profiles?.unit_id ? (unitMap.get(sub.profiles.unit_id) || 'Unknown Unit') : 'Not specified',
      qualification: sub.profiles?.qualification || 'Not specified',
      id: sub.profiles?.id,
    },
    streak: streakMap.get(sub.user_id) || 0,
  }))

  if (role === 'president' && adminUnitId) {
    mappedSubmissions = mappedSubmissions.filter(
      (sub) => sub.profiles.id && sub.profiles.id !== '' // keep all for now but filter by unit_id below
    );
    // Actually we filter by the resolved profiles.unit_id from sub
    mappedSubmissions = (submissions || [])
      .filter((sub) => sub.profiles?.unit_id === adminUnitId)
      .map((sub) => ({
        id: sub.id,
        user_id: sub.user_id,
        description: sub.description,
        proof_url: sub.proof_url,
        created_at: sub.created_at,
        profiles: {
          full_name: sub.profiles?.full_name || 'Anonymous Member',
          unit_name: sub.profiles?.unit_id ? (unitMap.get(sub.profiles.unit_id) || 'Unknown Unit') : 'Not specified',
          qualification: sub.profiles?.qualification || 'Not specified',
          id: sub.profiles?.id,
        },
        streak: streakMap.get(sub.user_id) || 0,
      }));
  }

  // 6. Fetch events
  let eventsQuery = supabase.from('events').select('*')
  if (role === 'president' && adminUnitId) {
    eventsQuery = eventsQuery.eq('unit_id', adminUnitId)
  }
  const { data: events } = await eventsQuery.order('date', { ascending: false })

  // 7. Fetch registrations for these events
  const eventIds = (events || []).map(e => e.id)
  let regsQuery = supabase
    .from('event_registrations')
    .select('*, profiles:user_id(full_name, unit_id, qualification)')
  
  if (eventIds.length > 0) {
    regsQuery = regsQuery.in('event_id', eventIds)
  } else {
    // If no events exist, query a non-existent UUID to return empty array safely
    regsQuery = regsQuery.eq('event_id', '00000000-0000-0000-0000-000000000000')
  }
  const { data: registrations } = await regsQuery.order('created_at', { ascending: false })

  const mappedRegistrations = (registrations || []).map(reg => {
    const regProfile = reg.profiles as any;
    return {
      ...reg,
      profiles: regProfile ? {
        full_name: regProfile.full_name || 'Anonymous Member',
        unit_name: regProfile.unit_id ? (unitMap.get(regProfile.unit_id) || 'Unknown Unit') : 'Not specified',
        qualification: regProfile.qualification || 'Not specified',
      } : null
    };
  });

  // 8. Fetch Paginated Users (Delegating to admin action but scoped)
  const { getPaginatedUsers } = await import('@/app/admin/actions')
  const searchParams = await props.searchParams
  const page = parseInt(searchParams.page || '1', 10)
  const limit = 50
  const search = searchParams.search || ''
  const roleFilter = searchParams.role || 'all'
  
  const { users, totalCount } = await getPaginatedUsers(page, limit, search, roleFilter)
  const totalPages = Math.ceil((totalCount || 0) / limit)

  // 9. Fetch unit-scoped announcements
  const announcements = await getRecentAnnouncements(supabase, adminUnitId)

  return (
    <PresidentConsoleClient 
      submissions={mappedSubmissions}
      events={events || []}
      registrations={mappedRegistrations as any}
      adminRole={role}
      adminDivision={adminUnitId}
      adminUnitId={adminUnitId}
      adminId={user.id}
      users={users || []}
      units={unitsData || []}
      initialPage={page}
      totalPages={totalPages}
      searchTerm={search}
      permissions={permissions}
      announcements={announcements}
    />
  )
}
