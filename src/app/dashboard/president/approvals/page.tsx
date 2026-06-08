import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext } from '@/lib/admin'
import PresidentApprovalsManager from '@/components/dashboard/PresidentApprovalsManager'

export const dynamic = 'force-dynamic'

export default async function PresidentApprovalsPage() {
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
  const unitMap = new Map((unitsData || []).map(u => [u.id, u.name]))

  const { data: submissions } = await supabase
    .from('deed_submissions')
    .select('*, profiles:user_id(*)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  const { data: streaks } = await supabase.from('streaks').select('*')
  const streakMap = new Map(streaks?.map((s) => [s.user_id, s.current_streak]) || [])

  let mappedSubmissions = (submissions || [])
    .filter(sub => {
      if (role === 'president' && adminUnitId) {
        return sub.profiles?.unit_id === adminUnitId
      }
      return true
    })
    .map((sub) => ({
      id: sub.id,
      user_id: sub.user_id,
      description: sub.description,
      proof_url: sub.proof_url,
      created_at: sub.created_at,
      profiles: {
        full_name: sub.profiles?.full_name || 'Anonymous Member',
        unit_name: sub.profiles?.unit_id ? (unitMap.get(sub.profiles.unit_id) || 'Unknown Unit') : 'Not specified',
        qualification: sub.profiles?.qualification || 'Not specified',
        id: sub.profiles?.id,
      },
      streak: streakMap.get(sub.user_id) || 0,
    }))

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-zinc-900">Pending Approvals</h2>
        <p className="text-xs text-zinc-500">Review volunteer submissions from your division.</p>
      </div>
      <PresidentApprovalsManager initialSubmissions={mappedSubmissions} />
    </div>
  )
}
