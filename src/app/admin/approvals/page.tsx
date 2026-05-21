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
  const { permissions } = await getAdminContext(user.id)
  if (!permissions.can_approve_deeds) {
    redirect('/admin')
  }

  // Fetch pending submissions with profile details
  const { data: submissions } = await supabase
    .from('deed_submissions')
    .select('*, profiles:user_id(*)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  // Fetch streaks to map them
  const { data: streaks } = await supabase
    .from('streaks')
    .select('*')

  const streakMap = new Map(
    streaks?.map((s) => [s.user_id, s.current_streak]) || []
  )

  // Map user streaks to submissions
  const mappedSubmissions = (submissions || []).map((sub) => ({
    id: sub.id,
    user_id: sub.user_id,
    description: sub.description,
    proof_url: sub.proof_url,
    created_at: sub.created_at,
    profiles: {
      full_name: sub.profiles?.full_name || 'Anonymous Member',
      division: sub.profiles?.division || 'Not specified',
      qualification: sub.profiles?.qualification || 'Not specified',
      id: sub.profiles?.id,
    },
    streak: streakMap.get(sub.user_id) || 0,
  }))

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-zinc-950">Deed Approvals</h1>
        <p className="text-zinc-500 text-sm">
          Review daily deeds submitted by volunteers, award bonus points, or reject submissions with comments.
        </p>
      </div>

      <ApprovalsQueue initialSubmissions={mappedSubmissions} />
    </div>
  )
}
