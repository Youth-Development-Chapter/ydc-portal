import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext } from '@/lib/admin'
import PresidentEventsManager from '@/components/dashboard/PresidentEventsManager'

export const dynamic = 'force-dynamic'

export default async function PresidentEventsPage() {
  const supabase = await createClient()

  const { data: rankSettingsData } = await supabase.from('system_settings').select('value').eq('key', 'rank_tiers').single()
  let rankTiers: { name: string; threshold: number }[] = []
  if (rankSettingsData?.value) {
    try {
      rankTiers = JSON.parse(rankSettingsData.value)
    } catch (e) {}
  }

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
  const unitMap = new Map((unitsData || []).map(u => [u.id, u.name]))
  const adminUnitName = unitsData?.find(u => u.id === adminUnitId)?.name || null

  let eventsQuery = supabase.from('events').select('*')
  if (role === 'president' && adminUnitId) {
    eventsQuery = eventsQuery.eq('unit_id', adminUnitId).eq('is_archived', false)
  }
  const { data: events } = await eventsQuery.order('date', { ascending: false })

  const eventIds = (events || []).map(e => e.id)
  let regsQuery = supabase
    .from('event_registrations')
    .select('*, profiles:user_id(full_name, unit_id, qualification)')
  
  if (eventIds.length > 0) {
    regsQuery = regsQuery.in('event_id', eventIds)
  } else {
    regsQuery = regsQuery.eq('event_id', '00000000-0000-0000-0000-000000000000')
  }
  const { data: registrations } = await regsQuery.order('created_at', { ascending: false })

  const mappedRegistrations = (registrations || []).map(reg => {
    const regProfile = reg.profiles as any
    return {
      ...reg,
      profiles: regProfile ? {
        full_name: regProfile.full_name || 'Anonymous Member',
        unit_name: regProfile.unit_id ? (unitMap.get(regProfile.unit_id) || 'Unknown Unit') : 'Not specified',
        qualification: regProfile.qualification || 'Not specified',
      } : null
    }
  })

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-zinc-900">Events Management</h2>
        <p className="text-xs text-zinc-500">Manage events and monitor registrations.</p>
      </div>
      <PresidentEventsManager 
        initialEvents={events || []} 
        initialRegistrations={mappedRegistrations as any}
        adminRole={role}
        adminDivision={adminUnitId}
        adminUnitName={adminUnitName}
        rankTiers={rankTiers}
      />
    </div>
  )
}
