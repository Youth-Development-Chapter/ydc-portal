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

  // Fetch active admin profile unit
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('unit_id')
    .eq('id', user.id)
    .single()

  const adminUnitId = adminProfile?.unit_id || undefined

  // Fetch all units for dropdown selection
  const { data: units } = await supabase
    .from('units')
    .select('id, name')
    .order('name')

  const { getPaginatedUsers } = await import('@/app/admin/actions')
  const { users } = await getPaginatedUsers(1, 50, '', 'all')

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-zinc-950">User Directory</h1>
        <p className="text-zinc-500 text-sm">
          Manage member details, manually adjust coin transactions, promote users to admin positions, and customize tier-3 granular permissions.
        </p>
      </div>

      <UserDirectory 
        initialUsers={users as any || []}
        activeAdminId={user.id}
        activeAdminRole={role}
        adminUnitId={adminUnitId}
        allUnits={units || []}
      />
    </div>
  )
}
