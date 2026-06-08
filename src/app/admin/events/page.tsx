import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext } from '@/lib/admin'
import EventsManager from '@/components/admin/EventsManager'

export const dynamic = 'force-dynamic'

export default async function AdminEventsPage() {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Verify permission
  const { role, permissions } = await getAdminContext(user.id)
  const hasAccess = permissions.can_scan_tickets || permissions.can_manage_events
  if (!hasAccess) {
    redirect('/admin')
  }

  // Fetch active admin profile unit
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('unit_id, units(name)')
    .eq('id', user.id)
    .single()
  
  const adminUnitId = adminProfile?.unit_id;
  const adminUnitName = Array.isArray(adminProfile?.units) ? adminProfile?.units[0]?.name : (adminProfile?.units as any)?.name;

  // Fetch all units
  const { data: units } = await supabase.from('units').select('id, name').order('name');

  // Fetch rank tiers for criteria
  const { data: rankSettingsData } = await supabase.from('system_settings').select('value').eq('key', 'rank_tiers').single()
  let rankTiers: { name: string; threshold: number }[] = []
  if (rankSettingsData?.value) {
    try {
      rankTiers = JSON.parse(rankSettingsData.value)
    } catch (e) {}
  }

  let unitMembersQuery = supabase
    .from('profiles')
    .select('id, full_name, unit_id, qualification, units(name)')
    .eq('role', 'volunteer')
    .order('full_name', { ascending: true })

  if (role === 'president' && adminUnitId) {
    unitMembersQuery = unitMembersQuery.eq('unit_id', adminUnitId)
  }

  const { data: unitMembers } = await unitMembersQuery

  // 1. Fetch events (limited to unit if role is president)
  let eventsQuery = supabase.from('events').select('*')
  if (role === 'president' && adminUnitId) {
    eventsQuery = eventsQuery.eq('unit_id', adminUnitId).eq('is_archived', false)
  }
  const { data: events } = await eventsQuery.order('date', { ascending: false })

  // 2. Fetch registrations (limited to the admin's unit events if president)
  let registrationsQuery = supabase
    .from('event_registrations')
    .select('*, profiles(full_name, qualification, units(name))')
  
  if (role === 'president' && adminUnitId) {
    const eventIds = (events || []).map(e => e.id)
    if (eventIds.length > 0) {
      registrationsQuery = registrationsQuery.in('event_id', eventIds)
    } else {
      registrationsQuery = registrationsQuery.eq('event_id', '00000000-0000-0000-0000-000000000000')
    }
  }
  
  const { data: registrations } = await registrationsQuery.order('created_at', { ascending: false })

  // Format registrations data to prevent nested structural complexity client-side
  const mappedRegistrations = (registrations || []).map((reg) => ({
    id: reg.id,
    event_id: reg.event_id,
    user_id: reg.user_id,
    ticket_code: reg.ticket_code,
    attended: reg.attended,
    attended_at: reg.attended_at,
    status: reg.status || 'registered',
    leave_note: reg.leave_note || null,
    created_at: reg.created_at,
    profiles: {
      full_name: reg.profiles?.full_name || 'Anonymous Volunteer',
      unit_name: reg.profiles?.units?.name || 'Not specified',
      qualification: reg.profiles?.qualification || 'Not specified',
    },
  }))

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-zinc-950">Events & Ticket Scanning</h1>
        <p className="text-zinc-500 text-sm">
          Schedule upcoming events, manage volunteer check-in lists, and scan digital event tickets.
        </p>
      </div>

      <EventsManager 
        initialEvents={events || []} 
        initialRegistrations={mappedRegistrations}
        unitMembers={(unitMembers || []).map((member: any) => ({
          id: member.id,
          full_name: member.full_name || 'Anonymous Volunteer',
          unit_id: member.unit_id || null,
          qualification: member.qualification || 'Not specified',
          unit_name: Array.isArray(member.units) ? member.units[0]?.name || 'Not specified' : member.units?.name || 'Not specified',
        }))}
        permissions={permissions}
        adminRole={role}
        adminUnitId={adminUnitId}
        adminUnitName={adminUnitName}
        units={units || []}
        rankTiers={rankTiers}
      />
    </div>
  )
}
