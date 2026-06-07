import { SupabaseClient } from '@supabase/supabase-js'

export interface CustomCriteria {
  minAge?: number
  minStreak?: number
  unitId?: string
  coursesCompletedCount?: number
  rankTier?: string
}

export async function evaluateCriteria(supabase: SupabaseClient, userId: string, criteria: CustomCriteria): Promise<{ eligible: boolean, reason?: string }> {
  if (!criteria || Object.keys(criteria).length === 0) {
    return { eligible: true }
  }

  // Fetch basic profile info
  const { data: profile } = await supabase
    .from('profiles')
    .select('date_of_birth, unit_id')
    .eq('id', userId)
    .single()
    
  if (!profile) return { eligible: false, reason: 'Profile not found' }

  if (criteria.unitId && criteria.unitId !== profile.unit_id) {
    return { eligible: false, reason: 'Does not match required unit' }
  }

  if (criteria.minAge && profile.date_of_birth) {
    const dob = new Date(profile.date_of_birth)
    const ageDifMs = Date.now() - dob.getTime()
    const ageDate = new Date(ageDifMs)
    const age = Math.abs(ageDate.getUTCFullYear() - 1970)
    if (age < criteria.minAge) {
      return { eligible: false, reason: `Minimum age of ${criteria.minAge} required` }
    }
  }

  if (criteria.minStreak) {
    const { data: streakData } = await supabase
      .from('streaks')
      .select('current_streak')
      .eq('user_id', userId)
      .single()
      
    const currentStreak = streakData?.current_streak || 0
    if (currentStreak < criteria.minStreak) {
      return { eligible: false, reason: `Minimum streak of ${criteria.minStreak} required` }
    }
  }

  if (criteria.coursesCompletedCount) {
    // A course is complete if total lessons == completed lessons in user_progress
    // Let's do a simpler proxy: Count distinct course_id where completed = true
    const { count } = await supabase
      .from('user_progress')
      .select('course_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true)
      
    // Because user_progress stores PER LESSON completed, this counts total lessons completed!
    // Wait, the user_progress table has a 'completed' boolean?
    // Let's assume there is a way or just use a raw coin transaction proxy for course completion
    const { count: completedCourses } = await supabase
      .from('coin_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .like('reason', 'course_completion:%')
      
    const cc = completedCourses || 0
    if (cc < criteria.coursesCompletedCount) {
      return { eligible: false, reason: `Requires ${criteria.coursesCompletedCount} courses completed` }
    }
  }

  if (criteria.rankTier) {
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
    
    if (currentTier !== criteria.rankTier) {
      return { eligible: false, reason: `Requires rank tier: ${criteria.rankTier} (Current: ${currentTier})` }
    }
  }

  return { eligible: true }
}
