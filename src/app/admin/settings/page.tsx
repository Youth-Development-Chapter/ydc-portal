import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext } from '@/lib/admin'
import SettingsManager from '@/components/admin/SettingsManager'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Verify permission
  const { permissions } = await getAdminContext(user.id)
  if (!permissions.can_manage_settings) {
    redirect('/admin')
  }

  // Fetch all system settings
  const { data: settings } = await supabase
    .from('system_settings')
    .select('*')
    .order('key')

  // Fetch all courses with their reward points
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, author, reward_points')
    .order('title')

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-zinc-950">Settings & Rewards</h1>
        <p className="text-zinc-500 text-sm">
          Configure global YDC coin rewards and customize rewards for completing individual courses.
        </p>
      </div>

      <SettingsManager 
        initialSettings={settings || []} 
        initialCourses={courses || []} 
      />
    </div>
  )
}
