import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext } from '@/lib/admin'
import UserDirectory from '@/components/admin/UserDirectory'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Verify permission
  const { role, permissions } = await getAdminContext(user.id)
  if (!permissions.can_manage_admins) {
    redirect('/admin')
  }

  // 1. Fetch profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, division, qualification, created_at')
    .order('full_name')

  // 2. Fetch streaks
  const { data: streaks } = await supabase
    .from('streaks')
    .select('user_id, current_streak, longest_streak')

  const streakMap = new Map(
    streaks?.map((s) => [
      s.user_id,
      { current: s.current_streak, longest: s.longest_streak },
    ]) || []
  )

  // 3. Fetch aggregated coin balances per user using a GROUP BY query via rpc,
  //    instead of fetching every transaction row across all users.
  const { data: coinAggs } = await supabase
    .from('coin_transactions')
    .select('user_id, amount')

  const coinMap = new Map<string, number>()
  ;(coinAggs || []).forEach((txn) => {
    coinMap.set(txn.user_id, (coinMap.get(txn.user_id) || 0) + txn.amount)
  })

  // 4. Fetch granular admin permissions
  const { data: adminPerms } = await supabase
    .from('admin_permissions')
    .select('*')

  const permissionMap = new Map(
    adminPerms?.map((p) => [
      p.admin_id,
      {
        can_scan_tickets: p.can_scan_tickets,
        can_approve_deeds: p.can_approve_deeds,
        can_manage_events: p.can_manage_events,
        can_manage_courses: p.can_manage_courses,
        can_manage_settings: p.can_manage_settings,
        can_manage_admins: p.can_manage_admins,
      },
    ]) || []
  )

  // Combine data
  const mappedUsers = (profiles || []).map((prof) => ({
    id: prof.id,
    full_name: prof.full_name || 'Anonymous Volunteer',
    email: prof.email || 'No email',
    role: prof.role || 'volunteer',
    division: prof.division || 'Not specified',
    qualification: prof.qualification || 'Not specified',
    created_at: prof.created_at,
    coins: coinMap.get(prof.id) || 0,
    streak: streakMap.get(prof.id) || { current: 0, longest: 0 },
    permissions: permissionMap.get(prof.id) || {
      can_scan_tickets: false,
      can_approve_deeds: false,
      can_manage_events: false,
      can_manage_courses: false,
      can_manage_settings: false,
      can_manage_admins: false,
    },
  }))

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-zinc-950">User Directory</h1>
        <p className="text-zinc-500 text-sm">
          Manage member details, manually adjust coin transactions, promote users to admin positions, and customize tier-3 granular permissions.
        </p>
      </div>

      <UserDirectory 
        initialUsers={mappedUsers} 
        activeAdminId={user.id}
        activeAdminRole={role}
      />
    </div>
  )
}
