import { unstable_cache } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createPublicSupabaseServerClient } from './public-supabase'
import { SupabaseClient } from '@supabase/supabase-js'

export async function getUserCoinBalance(userId: string): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_user_coin_balance', { p_user_id: userId })
  if (error) {
    console.error('getUserCoinBalance rpc error:', error)
    return 0
  }
  return Number(data || 0)
}

export interface LeaderboardEntry {
  user_id: string
  full_name: string
  unit_name: string
  avatar_url: string | null
  coins: number
}

export async function getLeaderboard(limit = 50, unitId: string | null = null): Promise<LeaderboardEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_leaderboard', { p_limit: limit, p_unit_id: unitId })
  if (error) {
    console.error('getLeaderboard rpc error:', error)
    return []
  }
  return (data || []).map((row: { user_id: string; full_name: string; unit_name: string; avatar_url: string | null; coins: number }) => ({
    user_id: row.user_id,
    full_name: row.full_name,
    unit_name: row.unit_name,
    avatar_url: row.avatar_url,
    coins: Number(row.coins || 0),
  }))
}

/**
 * Fetch recent announcements using an authenticated Supabase client.
 * Accepts the caller's authenticated client so RLS policies are satisfied.
 * Falls back to the public anon client if no client is provided (for caching use cases).
 */
export async function getRecentAnnouncements(supabase: SupabaseClient, unitId?: string | null): Promise<{
  id: string
  title: string
  content: string
  is_pinned: boolean
  created_at: string
  unit_id?: string | null
}[]> {
  interface AnnouncementRow {
    id: string
    title: string
    content: string
    is_pinned: boolean
    created_at: string
    unit_id?: string | null
    excluded_unit_ids?: string[] | null
    target_users?: string[] | null
  }

  const query = supabase
    .from('announcements')
    .select('id, title, content, is_pinned, created_at, unit_id, excluded_unit_ids, target_users')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(30)

  const { data, error } = await query

  if (error) {
    console.error('getRecentAnnouncements error:', error)
    return []
  }

  // Client-side unit filtering (announcements may be unit-scoped)
  const results = ((data as AnnouncementRow[]) || []).filter((ann) => {
    // If announcement is targeted at specific users, skip unit-level filter
    if (ann.target_users && ann.target_users.length > 0) return true
    // If unit-scoped, only show to that unit
    if (ann.unit_id && unitId && ann.unit_id !== unitId) return false
    // If excluded units, hide from excluded
    if (ann.excluded_unit_ids && unitId && ann.excluded_unit_ids.includes(unitId)) return false
    return true
  })

  return results
}

/**
 * Legacy cached getter — kept for backward compatibility in places that still use it.
 * Uses the anon client; will only work if RLS allows anon reads on announcements.
 * Prefer getRecentAnnouncements() with an authenticated client in server components.
 */
export const getRecentAnnouncementsCached = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseServerClient()
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, content, is_pinned, created_at')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) {
      console.error('getRecentAnnouncementsCached error:', error)
      return []
    }
    return data || []
  },
  ['announcements:list'],
  { revalidate: 60, tags: ['announcements'] },
)

export async function getUpcomingEventsForUnitCached(unitId: string | null) {
  const key = unitId ? `events:unit:${unitId}` : 'events:unit:none'
  const query = unstable_cache(
    async () => {
      const supabase = createPublicSupabaseServerClient()
      const eventsQuery = supabase
        .from('events')
        .select('id, title, description, date, time, location, capacity, unit_id, is_compulsory, poster_url, poster_color')
        .eq('is_archived', false)
      if (unitId) {
        const { data } = await eventsQuery.or(`unit_id.is.null,unit_id.eq.${unitId}`).order('date', { ascending: true })
        return data || []
      } else {
        const { data } = await eventsQuery.is('unit_id', null).order('date', { ascending: true })
        return data || []
      }
    },
    [key],
    { revalidate: 60, tags: ['events', key] },
  )
  return query()
}

export const getUpcomingEventsForDivisionCached = getUpcomingEventsForUnitCached
