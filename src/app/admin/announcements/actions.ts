'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { hasAdminPermission } from '@/lib/admin'

export async function createAnnouncement(data: {
  title: string
  content: string
  is_pinned: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  const allowed = await hasAdminPermission(user.id, 'can_manage_settings')
  if (!allowed) return { error: 'Permission denied.' }

  if (!data.title.trim()) return { error: 'Title is required.' }
  if (!data.content.trim()) return { error: 'Content is required.' }

  const { error } = await supabase.from('announcements').insert({
    title: data.title.trim(),
    content: data.content.trim(),
    is_pinned: data.is_pinned,
    created_by: user.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/announcements')
  revalidatePath('/admin/announcements')
  revalidateTag('announcements', 'max')
  return { success: true as const }
}

export async function deleteAnnouncement(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  const allowed = await hasAdminPermission(user.id, 'can_manage_settings')
  if (!allowed) return { error: 'Permission denied.' }

  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/announcements')
  revalidatePath('/admin/announcements')
  revalidateTag('announcements', 'max')
  return { success: true as const }
}

export async function togglePinAnnouncement(id: string, isPinned: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  const allowed = await hasAdminPermission(user.id, 'can_manage_settings')
  if (!allowed) return { error: 'Permission denied.' }

  const { error } = await supabase
    .from('announcements')
    .update({ is_pinned: isPinned, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/announcements')
  revalidatePath('/admin/announcements')
  revalidateTag('announcements', 'max')
  return { success: true as const }
}
