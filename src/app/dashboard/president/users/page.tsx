import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext } from '@/lib/admin'
import { getPaginatedUsers } from '@/app/admin/actions'
import UserDirectory from '@/components/admin/UserDirectory'

export const dynamic = 'force-dynamic'

export default async function PresidentUsersPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { role } = await getAdminContext(user.id)

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('unit_id')
    .eq('id', user.id)
    .single()
  
  const adminUnitId = adminProfile?.unit_id || null

  const { data: unitsData } = await supabase.from('units').select('id, name')

  const searchParams = await props.searchParams
  const page = parseInt(searchParams.page || '1', 10)
  const limit = 50
  const search = searchParams.search || ''
  const roleFilter = searchParams.role || 'all'
  
  const { users } = await getPaginatedUsers(page, limit, search, roleFilter)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-zinc-900">User Directory</h2>
        <p className="text-xs text-zinc-500">Manage volunteers in your division.</p>
      </div>
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-zinc-200">
        <UserDirectory 
          initialUsers={users || []}
          activeAdminId={user.id}
          activeAdminRole={role}
          adminUnitId={adminUnitId || undefined}
          allUnits={unitsData || []}
          isPresidentConsole={true}
        />
      </div>
    </div>
  )
}
