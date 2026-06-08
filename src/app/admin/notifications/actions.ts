'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { hasAdminPermission } from '@/lib/admin'

export async function createAnnouncement(data: {
  title: string
  content: string
  is_pinned: boolean
  unit_id?: string | null
  excluded_unit_ids?: string[] | null
  target_users?: string[] | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, unit_id')
    .eq('id', user.id)
    .single()

  const allowed = await hasAdminPermission(user.id, 'can_manage_settings')
  if (!allowed && profile?.role !== 'president') return { error: 'Permission denied.' }

  if (!data.title.trim()) return { error: 'Title is required.' }
  if (!data.content.trim()) return { error: 'Content is required.' }

  let finalUnitId = data.unit_id
  if (profile?.role === 'president') {
    finalUnitId = profile.unit_id
  }

  const { error } = await supabase.from('announcements').insert({
    title: data.title.trim(),
    content: data.content.trim(),
    is_pinned: data.is_pinned,
    unit_id: finalUnitId || null,
    excluded_unit_ids: data.excluded_unit_ids || null,
    target_users: data.target_users || null,
    created_by: user.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/notifications')
  revalidatePath('/admin/notifications')
  revalidatePath('/dashboard/president/notifications')
  revalidateTag('announcements', 'max')
  return { success: true as const }
}

export async function deleteAnnouncement(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, unit_id')
    .eq('id', user.id)
    .single()

  const allowed = await hasAdminPermission(user.id, 'can_manage_settings')
  if (!allowed && profile?.role !== 'president') return { error: 'Permission denied.' }

  if (profile?.role === 'president') {
    const { data: announcement } = await supabase
      .from('announcements')
      .select('unit_id')
      .eq('id', id)
      .single()
    if (!announcement || announcement.unit_id !== profile.unit_id) {
      return { error: 'Permission denied. You can only manage announcements in your unit.' }
    }
  }

  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/notifications')
  revalidatePath('/admin/notifications')
  revalidatePath('/dashboard/president/notifications')
  revalidateTag('announcements', 'max')
  return { success: true as const }
}

export async function togglePinAnnouncement(id: string, isPinned: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, unit_id')
    .eq('id', user.id)
    .single()

  const allowed = await hasAdminPermission(user.id, 'can_manage_settings')
  if (!allowed && profile?.role !== 'president') return { error: 'Permission denied.' }

  if (profile?.role === 'president') {
    const { data: announcement } = await supabase
      .from('announcements')
      .select('unit_id')
      .eq('id', id)
      .single()
    if (!announcement || announcement.unit_id !== profile.unit_id) {
      return { error: 'Permission denied. You can only manage announcements in your unit.' }
    }
  }

  const { error } = await supabase
    .from('announcements')
    .update({ is_pinned: isPinned, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/notifications')
  revalidatePath('/admin/notifications')
  revalidatePath('/dashboard/president/notifications')
  revalidateTag('announcements', 'max')
  return { success: true as const }
}
