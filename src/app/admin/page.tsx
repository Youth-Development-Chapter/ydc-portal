import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext } from '@/lib/admin'
import AdminDashboardConsole from '@/components/admin/AdminDashboardConsole'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardOverview() {
  const supabase = await createClient()

  // Fetch security context to verify permissions
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { permissions } = await getAdminContext(user.id)

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 7)
  const sevenDaysAgoIso = sevenDaysAgo.toISOString()
  const fourteenDaysAgo = new Date(now)
  fourteenDaysAgo.setDate(now.getDate() - 14)
  const fourteenDaysAgoIso = fourteenDaysAgo.toISOString()

  // 1. Core counters
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: activeStreaks } = await supabase
    .from('streaks')
    .select('*', { count: 'exact', head: true })
    .gt('current_streak', 0)

  const { count: pendingDeeds } = await supabase
    .from('deed_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: upcomingEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .gte('date', todayStr)

  const { count: newMembers7d } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgoIso)

  const { count: approvedDeeds7d } = await supabase
    .from('deed_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')
    .gte('verified_at', sevenDaysAgoIso)

  const { count: attendance7d } = await supabase
    .from('event_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('attended', true)
    .gte('attended_at', sevenDaysAgoIso)

  // 2. Recent operational data
  const { data: recentDeeds } = await supabase
    .from('deed_submissions')
    .select('*, profiles:user_id(full_name, role)')
    .order('created_at', { ascending: false })
    .limit(30)

  const { data: recentEvents } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true })
    .gte('date', todayStr)
    .limit(6)

  const { data: recentApprovals } = await supabase
    .from('deed_submissions')
    .select('id,status,verified_at')
    .in('status', ['approved', 'rejected'])
    .gte('verified_at', fourteenDaysAgoIso)

  const trendByDay = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(fourteenDaysAgo)
    date.setDate(fourteenDaysAgo.getDate() + index)
    const isoDay = date.toISOString().slice(0, 10)
    const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' })

    const dayItems = (recentApprovals || []).filter((item) => {
      if (!item.verified_at) return false
      return item.verified_at.slice(0, 10) === isoDay
    })

    const approved = dayItems.filter((item) => item.status === 'approved').length
    const rejected = dayItems.filter((item) => item.status === 'rejected').length

    return {
      dayLabel,
      approved,
      rejected,
    }
  })

  return (
    <AdminDashboardConsole
      permissions={permissions}
      metrics={{
        totalUsers: totalUsers || 0,
        activeStreaks: activeStreaks || 0,
        pendingDeeds: pendingDeeds || 0,
        upcomingEvents: upcomingEvents || 0,
        newMembers7d: newMembers7d || 0,
        approvedDeeds7d: approvedDeeds7d || 0,
        attendance7d: attendance7d || 0,
      }}
      recentDeeds={recentDeeds || []}
      recentEvents={recentEvents || []}
      deedTrendByDay={trendByDay}
    />
  )
}
