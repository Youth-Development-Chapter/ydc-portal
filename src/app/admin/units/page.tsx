import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext } from '@/lib/admin'
import UnitsManager from '@/components/admin/UnitsManager'

export const dynamic = 'force-dynamic'

export default async function AdminUnitsPage() {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Verify permission
  const { role, permissions } = await getAdminContext(user.id)
  if (!permissions.can_manage_settings) {
    redirect('/admin')
  }

  // Fetch all units from the database
  const { data: units, error } = await supabase
    .from('units')
    .select('*')
    .order('name')

  if (error) {
    console.error('Failed to fetch units:', error.message)
  }

  // Only superadmins can create, edit, delete units
  const isSuperadmin = role === 'superadmin'

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-zinc-950">City Unit Management</h1>
        <p className="text-zinc-500 text-sm">
          Define and manage localized city branches (units) like Multan, Bahawalpur, and D.G. Khan.
        </p>
      </div>

      <UnitsManager 
        initialUnits={units || []} 
        isAdmin={isSuperadmin}
      />
    </div>
  )
}
