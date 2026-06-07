import { SupabaseClient } from '@supabase/supabase-js'

export interface CustomCriteria {
  minAge?: number
  min_age?: number
  minStreak?: number
  min_streak?: number
  unitId?: string
  unit_id?: string
  coursesCompletedCount?: number
  courses_completed_count?: number
  rankTier?: string
  rank_tier?: string
  required_rank?: string
}

export async function evaluateCriteria(supabase: SupabaseClient, userId: string, criteria: CustomCriteria): Promise<{ eligible: boolean, reason?: string }> {
  if (!criteria || Object.keys(criteria).length === 0) {
    return { eligible: true }
  }

  const normalized = {
    minAge: criteria.minAge ?? criteria.min_age,
    minStreak: criteria.minStreak ?? criteria.min_streak,
    unitId: criteria.unitId ?? criteria.unit_id,
    coursesCompletedCount: criteria.coursesCompletedCount ?? criteria.courses_completed_count,
    rankTier: criteria.rankTier ?? criteria.rank_tier ?? criteria.required_rank,
  }

  // Fetch basic profile info
  const { data: profile } = await supabase
    .from('profiles')
    .select('date_of_birth, unit_id')
    .eq('id', userId)
    .single()
    
  if (!profile) return { eligible: false, reason: 'Profile not found' }

  if (normalized.unitId && normalized.unitId !== profile.unit_id) {
    return { eligible: false, reason: 'Does not match required unit' }
  }

  if (normalized.minAge && profile.date_of_birth) {
    const dob = new Date(profile.date_of_birth)
    const ageDifMs = Date.now() - dob.getTime()
    const ageDate = new Date(ageDifMs)
    const age = Math.abs(ageDate.getUTCFullYear() - 1970)
    if (age < normalized.minAge) {
      return { eligible: false, reason: `Minimum age of ${normalized.minAge} required` }
    }
  }

  if (normalized.minStreak) {
    const { data: streakData } = await supabase
      .from('streaks')
      .select('current_streak')
      .eq('user_id', userId)
      .single()
      
    const currentStreak = streakData?.current_streak || 0
    if (currentStreak < normalized.minStreak) {
      return { eligible: false, reason: `Minimum streak of ${normalized.minStreak} required` }
    }
  }

  if (normalized.coursesCompletedCount) {
    const { count: completedCourses } = await supabase
      .from('coin_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .like('reason', 'course_completion:%')
      
    const cc = completedCourses || 0
    if (cc < normalized.coursesCompletedCount) {
      return { eligible: false, reason: `Requires ${normalized.coursesCompletedCount} courses completed` }
    }
  }

  if (normalized.rankTier && normalized.rankTier !== 'none') {
    // Fetch total coins to determine rank
    const { data: txns } = await supabase
      .from('coin_transactions')
      .select('amount')
      .eq('user_id', userId)
      
    const totalCoins = txns?.reduce((acc: number, t: any) => acc + t.amount, 0) || 0
    
    const { data: settingsData } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'rank_tiers')
      .single()
      
    let currentTier = 'Bronze Tier'
    if (settingsData && settingsData.value) {
      try {
        const tiers = JSON.parse(settingsData.value)
        // sort descending by threshold
        tiers.sort((a: any, b: any) => b.threshold - a.threshold)
        for (const tier of tiers) {
          if (totalCoins >= tier.threshold) {
            currentTier = tier.name
            break
          }
        }
      } catch (e) {}
    }
    
    if (currentTier !== normalized.rankTier) {
      return { eligible: false, reason: `Requires rank tier: ${normalized.rankTier} (Current: ${currentTier})` }
    }
  }

  return { eligible: true }
}
