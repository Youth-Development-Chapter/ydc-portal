import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext } from '@/lib/admin'
import { getRecentAnnouncements } from '@/lib/perf-data'
import PresidentAnnouncementsClient from '@/components/dashboard/PresidentAnnouncementsClient'

export const dynamic = 'force-dynamic'

export default async function PresidentAnnouncementsPage() {
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
  const announcements = await getRecentAnnouncements(supabase, adminUnitId)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-zinc-900">Announcements</h2>
        <p className="text-xs text-zinc-500">Post announcements to the members in your division.</p>
      </div>
      <PresidentAnnouncementsClient 
        initialAnnouncements={announcements || []} 
        adminRole={role}
        adminUnitId={adminUnitId}
      />
    </div>
  )
}
