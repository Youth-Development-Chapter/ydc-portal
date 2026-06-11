import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext } from '@/lib/admin'
import { redirect } from 'next/navigation'
import PresidentScannerClient from '@/components/dashboard/PresidentScannerClient'

export const dynamic = 'force-dynamic'

export default async function PresidentScannerPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { role, permissions } = await getAdminContext(user.id)
  if (!permissions?.can_scan_tickets && !permissions?.can_manage_events && role !== 'president') {
    redirect('/dashboard/president')
  }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('unit_id')
    .eq('id', user.id)
    .single()
  
  const adminUnitId = adminProfile?.unit_id || null

  // Only surface today's and upcoming events in the scanner picker — past events
  // just create confusion when choosing which event to check volunteers into.
  const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD (local)
  let eventsQuery = supabase
    .from('events')
    .select('id, title, date')
    .eq('is_archived', false)
    .gte('date', todayStr)
  if (role === 'president' && adminUnitId) {
    eventsQuery = eventsQuery.eq('unit_id', adminUnitId)
  }
  const { data: events } = await eventsQuery.order('date', { ascending: true })

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-zinc-900">QR Scanner</h2>
        <p className="text-xs text-zinc-500">Scan volunteer tickets</p>
      </div>
      <PresidentScannerClient initialEvents={events || []} />
    </div>
  )
}
