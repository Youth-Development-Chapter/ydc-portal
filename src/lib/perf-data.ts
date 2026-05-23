import { unstable_cache } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createPublicSupabaseServerClient } from './public-supabase'

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
  division: string
  coins: number
}

export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_leaderboard', { p_limit: limit })
  if (error) {
    console.error('getLeaderboard rpc error:', error)
    return []
  }
  return (data || []).map((row: { user_id: string; full_name: string; division: string; coins: number }) => ({
    user_id: row.user_id,
    full_name: row.full_name,
    division: row.division,
    coins: Number(row.coins || 0),
  }))
}

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

export async function getUpcomingEventsForDivisionCached(division: string | null) {
  const key = division ? `events:division:${division}` : 'events:division:none'
  const query = unstable_cache(
    async () => {
      const supabase = createPublicSupabaseServerClient()
      let eventsQuery = supabase.from('events').select('id, title, description, date, time, location, capacity, division')
      if (division) {
        eventsQuery = eventsQuery.or(`division.is.null,division.eq.${division}`)
      } else {
        eventsQuery = eventsQuery.is('division', null)
      }
      const { data, error } = await eventsQuery.order('date', { ascending: true })
      if (error) {
        console.error('getUpcomingEventsForDivisionCached error:', error)
        return []
      }
      return data || []
    },
    [key],
    { revalidate: 60, tags: ['events', key] },
  )
  return query()
}
