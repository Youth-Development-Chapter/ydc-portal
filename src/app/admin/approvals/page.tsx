import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext } from '@/lib/admin'
import ApprovalsQueue from '@/components/admin/ApprovalsQueue'

export const dynamic = 'force-dynamic'

export default async function AdminApprovalsPage() {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Verify permission
  const { role, permissions } = await getAdminContext(user.id)
  if (!permissions.can_approve_deeds) {
    redirect('/admin')
  }

  // Fetch active admin profile — use unit_id (new) for scoping
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('unit_id')
    .eq('id', user.id)
    .single()
  
  const adminUnitId = adminProfile?.unit_id || null

  // Fetch pending submissions with profile details (include unit info)
  const { data: submissions } = await supabase
    .from('deed_submissions')
    .select('*, profiles:user_id(id, full_name, unit_id, qualification, units(name))')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  // Fetch resolved submissions for history tab (last 50)
  const { data: resolvedSubmissions } = await supabase
    .from('deed_submissions')
    .select('*, profiles:user_id(id, full_name, unit_id, qualification, units(name)), verifier:verified_by(full_name)')
    .in('status', ['approved', 'rejected', 'flagged'])
    .order('verified_at', { ascending: false })
    .limit(50)

  // Fetch streaks to map them
  const { data: streaks } = await supabase
    .from('streaks')
    .select('*')

  const streakMap = new Map(
    streaks?.map((s) => [s.user_id, s.current_streak]) || []
  )

  // Helper to map a submission with unit data
  const mapSubmission = (sub: any) => ({
    id: sub.id,
    user_id: sub.user_id,
    description: sub.description,
    proof_url: sub.proof_url,
    created_at: sub.created_at,
    profiles: {
      full_name: sub.profiles?.full_name || 'Anonymous Member',
      unit_id: sub.profiles?.unit_id || null,
      unit_name: (Array.isArray(sub.profiles?.units) ? sub.profiles.units[0]?.name : sub.profiles?.units?.name) || 'Not specified',
      qualification: sub.profiles?.qualification || 'Not specified',
      id: sub.profiles?.id,
    },
    streak: streakMap.get(sub.user_id) || 0,
  })

  let mappedSubmissions = (submissions || []).map(mapSubmission)

  // President: filter by unit_id
  if (role === 'president' && adminUnitId) {
    mappedSubmissions = mappedSubmissions.filter(
      (sub) => sub.profiles.unit_id === adminUnitId
    )
  }

  // Map resolved submissions for history tab
  const mapResolved = (sub: any) => ({
    id: sub.id,
    user_id: sub.user_id,
    description: sub.description,
    proof_url: sub.proof_url,
    created_at: sub.created_at,
    status: sub.status,
    admin_notes: sub.admin_notes || null,
    verified_at: sub.verified_at || null,
    verifier_name: (Array.isArray(sub.verifier) ? sub.verifier[0]?.full_name : sub.verifier?.full_name) || null,
    profiles: {
      full_name: sub.profiles?.full_name || 'Anonymous Member',
      unit_id: sub.profiles?.unit_id || null,
      unit_name: (Array.isArray(sub.profiles?.units) ? sub.profiles.units[0]?.name : sub.profiles?.units?.name) || 'Not specified',
      qualification: sub.profiles?.qualification || 'Not specified',
      id: sub.profiles?.id,
    },
  })

  let mappedResolved = (resolvedSubmissions || []).map(mapResolved)

  if (role === 'president' && adminUnitId) {
    mappedResolved = mappedResolved.filter(
      (sub) => sub.profiles.unit_id === adminUnitId
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-zinc-950">Deed Approvals</h1>
        <p className="text-zinc-500 text-sm">
          Review daily deeds submitted by volunteers, award bonus points, flag inappropriate content, or reject submissions with comments.
        </p>
      </div>

      <ApprovalsQueue 
        initialSubmissions={mappedSubmissions} 
        resolvedSubmissions={mappedResolved}
        adminRole={role}
      />
    </div>
  )
}
