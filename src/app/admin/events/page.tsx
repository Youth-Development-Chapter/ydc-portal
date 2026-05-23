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

  // Fetch active admin profile division
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('division')
    .eq('id', user.id)
    .single()
  
  const adminDivision = adminProfile?.division

  // 1. Fetch events (limited to division if role is president)
  let eventsQuery = supabase.from('events').select('*')
  if (role === 'president' && adminDivision) {
    eventsQuery = eventsQuery.eq('division', adminDivision)
  }
  const { data: events } = await eventsQuery.order('date', { ascending: false })

  // 2. Fetch registrations (limited to the admin's division events if president)
  let registrationsQuery = supabase
    .from('event_registrations')
    .select('*, profiles(full_name, division, qualification)')
  
  if (role === 'president' && adminDivision) {
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
    created_at: reg.created_at,
    profiles: {
      full_name: reg.profiles?.full_name || 'Anonymous Volunteer',
      division: reg.profiles?.division || 'Not specified',
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
        permissions={permissions}
        adminRole={role}
        adminDivision={adminDivision}
      />
    </div>
  )
}
