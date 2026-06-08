import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext } from '@/lib/admin'
import EventDetailsClient from '@/components/admin/EventDetailsClient'

export const dynamic = 'force-dynamic'

export default async function AdminEventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const eventId = resolvedParams.id
  
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

  // Fetch rank tiers for custom criteria editing
  const { data: rankSettingsData } = await supabase.from('system_settings').select('value').eq('key', 'rank_tiers').single()
  let rankTiers: { name: string; threshold: number }[] = []
  if (rankSettingsData?.value) {
    try {
      rankTiers = JSON.parse(rankSettingsData.value)
    } catch (e) {}
  }

  // Fetch event
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()
    
  if (!event) {
    redirect('/admin/events')
  }

  // Fetch registrations
  const { data: registrations } = await supabase
    .from('event_registrations')
    .select(`
      id,
      event_id,
      user_id,
      ticket_code,
      attended,
      attended_at,
      status,
      leave_note,
      created_at,
      profiles (
        full_name,
        unit_id,
        qualification,
        units (name)
      )
    `)
    .eq('event_id', eventId)

  const mappedRegistrations = (registrations || []).map(r => ({
    ...r,
    profiles: {
      full_name: (r.profiles as any)?.full_name || 'Unknown',
      unit_name: Array.isArray((r.profiles as any)?.units) ? (r.profiles as any)?.units[0]?.name : (r.profiles as any)?.units?.name || 'No Unit',
      qualification: (r.profiles as any)?.qualification || 'None'
    }
  }))

  // Fetch unit members
  let unitMembersQuery = supabase
    .from('profiles')
    .select('id, full_name, unit_id, qualification, units(name)')
    .eq('role', 'volunteer')
    .order('full_name', { ascending: true })

  const { data: unitMembersData } = await unitMembersQuery
  
  const unitMembers = (unitMembersData || []).map(m => ({
    id: m.id,
    full_name: m.full_name,
    unit_id: m.unit_id,
    qualification: m.qualification,
    unit_name: Array.isArray(m.units) ? m.units[0]?.name : (m.units as any)?.name || 'No Unit'
  }))

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <EventDetailsClient 
        event={event}
        initialRegistrations={mappedRegistrations as any}
        unitMembers={unitMembers}
        permissions={permissions}
        rankTiers={rankTiers}
        backUrl="/admin/events"
      />
    </div>
  )
}
