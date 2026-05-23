'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { hasAdminPermission, AdminPermissions } from '@/lib/admin'

/**
 * Approve a volunteer deed submission.
 * Awards base coins + optional bonus coins, updates user streak.
 */
export async function approveDeedSubmission(
  deedId: string,
  bonusCoins: number,
  adminNotes: string
) {
  const supabase = await createClient()

  // 1. Authenticate admin user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  // 2. Verify permission
  const allowed = await hasAdminPermission(user.id, 'can_approve_deeds')
  if (!allowed) return { error: 'Permission denied. You cannot approve deeds.' }

  // Verify division scoping for President role
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, division')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role === 'president') {
    const { data: submission } = await supabase
      .from('deed_submissions')
      .select('*, profiles:user_id(division)')
      .eq('id', deedId)
      .single()
    
    if (!submission || (submission.profiles as any)?.division !== adminProfile.division) {
      return { error: 'Permission denied. This user belongs to a different division.' }
    }
  }

  // 3. Fetch base daily deed reward setting
  const { data: baseSetting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'daily_deed_reward')
    .single()
  const baseReward = baseSetting ? parseInt(baseSetting.value, 10) : 10

  // 4. Update deed submission status
  const { error } = await supabase
    .from('deed_submissions')
    .update({
      status: 'approved',
      coin_reward: baseReward,
      bonus_coins: bonusCoins,
      admin_notes: adminNotes || null,
      verified_by: user.id,
      verified_at: new Date().toISOString()
    })
    .eq('id', deedId)

  if (error) {
    return { error: error.message }
  }

  // 5. Revalidate paths
  revalidatePath('/admin/approvals')
  revalidatePath('/admin')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Reject a volunteer deed submission.
 */
export async function rejectDeedSubmission(deedId: string, adminNotes: string) {
  if (!adminNotes) return { error: 'Rejection reason is required.' }

  const supabase = await createClient()

  // 1. Authenticate admin user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  // 2. Verify permission
  const allowed = await hasAdminPermission(user.id, 'can_approve_deeds')
  if (!allowed) return { error: 'Permission denied. You cannot reject deeds.' }

  // Verify division scoping for President role
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, division')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role === 'president') {
    const { data: submission } = await supabase
      .from('deed_submissions')
      .select('*, profiles:user_id(division)')
      .eq('id', deedId)
      .single()
    
    if (!submission || (submission.profiles as any)?.division !== adminProfile.division) {
      return { error: 'Permission denied. This user belongs to a different division.' }
    }
  }

  // 3. Update deed submission status
  const { error } = await supabase
    .from('deed_submissions')
    .update({
      status: 'rejected',
      admin_notes: adminNotes,
      verified_by: user.id,
      verified_at: new Date().toISOString()
    })
    .eq('id', deedId)

  if (error) {
    return { error: error.message }
  }

  // 4. Revalidate paths
  revalidatePath('/admin/approvals')
  revalidatePath('/admin')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Update global system settings.
 */
export async function updateSystemSetting(key: string, value: string) {
  const supabase = await createClient()

  // 1. Authenticate admin user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  // 2. Verify permission
  const allowed = await hasAdminPermission(user.id, 'can_manage_settings')
  if (!allowed) return { error: 'Permission denied. You cannot manage settings.' }

  // 3. Upsert system settings
  const { error } = await supabase
    .from('system_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/settings')
  return { success: true }
}

/**
 * Update LMS course reward points.
 */
export async function updateCourseReward(courseId: string, rewardPoints: number) {
  const supabase = await createClient()

  // 1. Authenticate admin user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  // 2. Verify permission
  const allowed = await hasAdminPermission(user.id, 'can_manage_settings')
  if (!allowed) return { error: 'Permission denied. You cannot edit course rewards.' }

  // 3. Update courses table
  const { error } = await supabase
    .from('courses')
    .update({ reward_points: rewardPoints })
    .eq('id', courseId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/settings')
  return { success: true }
}

/**
 * Manually adjust user coins (grant or revoke).
 */
export async function adjustUserCoins(userId: string, amount: number, reason: string) {
  if (!reason) return { error: 'Reason is required.' }

  const supabase = await createClient()

  // 1. Authenticate admin user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  // 2. Verify permission (only superadmins, presidents, or settings managers can touch ledger)
  const allowed = await hasAdminPermission(user.id, 'can_manage_settings')
  if (!allowed) return { error: 'Permission denied. You cannot manually adjust coins.' }

  // 3. Insert transaction into ledger
  const { error } = await supabase
    .from('coin_transactions')
    .insert({
      user_id: userId,
      amount,
      reason: `manual_adjustment: ${reason}`,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/users')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Manage admin roles and customized permissions.
 * Superadmin and President only.
 */
export async function updateUserAdminRole(
  targetUserId: string,
  role: string,
  permissions: AdminPermissions
) {
  const supabase = await createClient()

  // 1. Authenticate active admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  // 2. Verify permission (can_manage_admins is true for Superadmin/President)
  const allowed = await hasAdminPermission(user.id, 'can_manage_admins')
  if (!allowed) return { error: 'Permission denied. Only Superadmins or Presidents can manage admin accounts.' }

  // 3. Prevent self-demotion or self-modification
  if (user.id === targetUserId) {
    return { error: 'You cannot modify your own administrative roles or permissions.' }
  }

  // Fetch active admin profile
  const { data: activeAdminProfile } = await supabase
    .from('profiles')
    .select('role, division')
    .eq('id', user.id)
    .single()

  if (!activeAdminProfile) {
    return { error: 'Admin profile not found.' }
  }

  const activeAdminRole = activeAdminProfile.role

  if (role === 'superadmin' && activeAdminRole !== 'superadmin') {
    return { error: 'Only Superadmins can promote users to Superadmin.' }
  }

  // Enforce President specific restrictions
  if (activeAdminRole === 'president') {
    // 1. Fetch target user profile
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('role, division')
      .eq('id', targetUserId)
      .single()

    if (!targetProfile || targetProfile.division !== activeAdminProfile?.division) {
      return { error: 'Permission denied. You can only manage members of your own division.' }
    }

    // 2. Presidents can only assign volunteer or tier-3 roles
    if (role !== 'tier-3' && role !== 'volunteer') {
      return { error: 'Permission denied. You can only assign Volunteer or Event Scanner roles.' }
    }

    // 3. Presidents can only assign scan tickets permission
    if (role === 'tier-3') {
      if (
        permissions.can_approve_deeds ||
        permissions.can_manage_events ||
        permissions.can_manage_courses ||
        permissions.can_manage_settings ||
        permissions.can_manage_admins
      ) {
        return { error: 'Permission denied. You can only grant Ticket Scanning permission to an Event Scanner.' }
      }
      if (!permissions.can_scan_tickets) {
        return { error: 'Ticket Scanning permission must be enabled for an Event Scanner.' }
      }

      // 4. Limit check: max 2 scanners per division
      const { data: tier3Profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('division', activeAdminProfile?.division)
        .eq('role', 'tier-3')

      if (tier3Profiles && tier3Profiles.length > 0) {
        const otherScannerIds = tier3Profiles.map(p => p.id).filter(id => id !== targetUserId)
        if (otherScannerIds.length > 0) {
          const { count, error: countError } = await supabase
            .from('admin_permissions')
            .select('*', { count: 'exact', head: true })
            .in('admin_id', otherScannerIds)
            .eq('can_scan_tickets', true)

          if (!countError && count !== null && count >= 2) {
            return { error: 'Limit reached. You can only assign Event Scanner access to at most 2 users in your division.' }
          }
        }
      }
    }
  }

  // 5. Update profiles role
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', targetUserId)

  if (profileError) {
    return { error: profileError.message }
  }

  // 6. Handle permissions table
  if (role === 'tier-3') {
    const { error: permError } = await supabase
      .from('admin_permissions')
      .upsert({
        admin_id: targetUserId,
        can_scan_tickets: !!permissions.can_scan_tickets,
        can_approve_deeds: !!permissions.can_approve_deeds,
        can_manage_events: !!permissions.can_manage_events,
        can_manage_courses: !!permissions.can_manage_courses,
        can_manage_settings: !!permissions.can_manage_settings,
        can_manage_admins: !!permissions.can_manage_admins,
        updated_at: new Date().toISOString()
      })

    if (permError) {
      return { error: permError.message }
    }
  } else {
    // If no longer tier-3, delete admin_permissions row to clean up
    await supabase
      .from('admin_permissions')
      .delete()
      .eq('admin_id', targetUserId)
  }

  revalidatePath('/admin/users')
  return { success: true }
}

/**
 * Scan event tickets to record volunteer attendance and award coins.
 */
export async function checkInTicket(scannedId: string, eventId?: string) {
  const supabase = await createClient()

  // 1. Authenticate admin user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  // 2. Verify permission
  const allowed = await hasAdminPermission(user.id, 'can_scan_tickets')
  if (!allowed) return { error: 'Permission denied. You cannot check in tickets.' }

  // 3. Resolve ticket code/user ID
  let registration = null
  let fetchError = null

  if (eventId) {
    let resolvedUserId = scannedId.trim()
    
    // Support visual member ID format (e.g. YDC-12345678)
    if (resolvedUserId.toUpperCase().startsWith('YDC-')) {
      const hexPart = resolvedUserId.substring(4).toLowerCase()
      const { data: matchProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .filter('id::text', 'like', `${hexPart}%`)
        .maybeSingle()

      if (profileError) {
        return { error: `Profile lookup failed: ${profileError.message}` }
      }
      if (matchProfile) {
        resolvedUserId = matchProfile.id
      } else {
        return { error: `No volunteer found with Member ID ${scannedId}` }
      }
    }

    const { data: reg, error } = await supabase
      .from('event_registrations')
      .select('*, profiles(full_name), events(coin_reward)')
      .eq('user_id', resolvedUserId)
      .eq('event_id', eventId)
      .maybeSingle()
    
    registration = reg
    fetchError = error
  } else {
    // Fallback: scannedId is the ticket code
    const { data: reg, error } = await supabase
      .from('event_registrations')
      .select('*, profiles(full_name), events(coin_reward)')
      .eq('ticket_code', scannedId.trim())
      .maybeSingle()
    
    registration = reg
    fetchError = error
  }

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (!registration) {
    return { error: 'Ticket not found. This user is not registered for the event.' }
  }

  if (registration.attended) {
    return { 
      error: 'Ticket already scanned.', 
      alreadyScanned: true,
      userName: registration.profiles?.full_name || 'Volunteer' 
    }
  }

  // 4. Fetch reward (event-specific first, fallback to system settings)
  let attendanceReward = (registration.events as any)?.coin_reward
  if (typeof attendanceReward !== 'number') {
    const { data: attendanceSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'event_attendance_reward')
      .single()
    attendanceReward = attendanceSetting ? parseInt(attendanceSetting.value, 10) : 50
  }

  // 5. Update registration status
  const { error: updateError } = await supabase
    .from('event_registrations')
    .update({
      attended: true,
      attended_at: new Date().toISOString()
    })
    .eq('id', registration.id)

  if (updateError) {
    return { error: updateError.message }
  }

  // 6. Insert coin transaction
  const { error: coinError } = await supabase
    .from('coin_transactions')
    .insert({
      user_id: registration.user_id,
      amount: attendanceReward,
      reason: 'event_attendance',
      reference_id: registration.id
    })

  if (coinError) {
    console.error('Error crediting attendance coins:', coinError)
  }

  revalidatePath('/admin/events')
  revalidatePath('/dashboard')
  
  return { 
    success: true, 
    userName: registration.profiles?.full_name || 'Volunteer',
    coinsAwarded: attendanceReward
  }
}


/**
 * Create a new event.
 */
export async function createEvent(
  title: string,
  description: string,
  date: string,
  time: string,
  location: string,
  capacity: number,
  coinReward: number,
  division?: string | null
) {
  const supabase = await createClient()

  // 1. Authenticate admin user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  // 2. Verify permission
  const allowed = await hasAdminPermission(user.id, 'can_manage_events')
  if (!allowed) return { error: 'Permission denied. You cannot manage events.' }

  if (!title || !date || !time || !location) {
    return { error: 'Missing required event fields.' }
  }

  // Retrieve active admin profile to enforce division restrictions
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, division')
    .eq('id', user.id)
    .single()

  let eventDivision: string | null = null

  if (adminProfile?.role === 'president') {
    eventDivision = adminProfile.division || null
    if (!eventDivision) {
      return { error: 'Active president is not assigned to a division.' }
    }
  } else {
    eventDivision = division || null
  }

  // 3. Insert event
  const { error } = await supabase
    .from('events')
    .insert({
      title,
      description,
      date,
      time,
      location,
      capacity: capacity || 100,
      coin_reward: coinReward,
      division: eventDivision,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/events')
  revalidatePath('/events')
  return { success: true }
}

/**
 * Toggle volunteer event attendance manually.
 * Awards or revokes event attendance coins.
 */
export async function toggleManualAttendance(registrationId: string, attended: boolean) {
  const supabase = await createClient()

  // 1. Authenticate admin user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  // 2. Verify permission
  const allowed = await hasAdminPermission(user.id, 'can_scan_tickets')
  if (!allowed) return { error: 'Permission denied. You cannot check in attendees.' }

  // Fetch caller profile for division verification
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, division')
    .eq('id', user.id)
    .single()

  // 3. Fetch registration with events division
  const { data: registration, error: fetchError } = await supabase
    .from('event_registrations')
    .select('*, events(division, coin_reward)')
    .eq('id', registrationId)
    .single()

  if (fetchError || !registration) {
    return { error: 'Registration record not found.' }
  }

  // Verify division if caller is a President
  if (adminProfile?.role === 'president') {
    const eventDivision = (registration.events as any)?.division
    if (eventDivision !== adminProfile.division) {
      return { error: 'Permission denied. You can only manage attendees for events in your own division.' }
    }
  }

  if (fetchError || !registration) {
    return { error: 'Registration record not found.' }
  }

  // If status is unchanged, skip
  if (registration.attended === attended) {
    return { success: true }
  }

  // 4. Fetch reward (event-specific first, fallback to system settings)
  let attendanceReward = (registration.events as any)?.coin_reward
  if (typeof attendanceReward !== 'number') {
    const { data: attendanceSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'event_attendance_reward')
      .single()
    attendanceReward = attendanceSetting ? parseInt(attendanceSetting.value, 10) : 50
  }

  // 5. Update registration status
  const { error: updateError } = await supabase
    .from('event_registrations')
    .update({
      attended,
      attended_at: attended ? new Date().toISOString() : null
    })
    .eq('id', registrationId)

  if (updateError) {
    return { error: updateError.message }
  }

  // 6. Record transaction (positive for check-in, negative for check-out)
  const { error: coinError } = await supabase
    .from('coin_transactions')
    .insert({
      user_id: registration.user_id,
      amount: attended ? attendanceReward : -attendanceReward,
      reason: attended ? 'event_attendance' : 'event_attendance_revocation',
      reference_id: registration.id
    })

  if (coinError) {
    console.error('Error modifying attendance coins:', coinError)
  }

  revalidatePath('/admin/events')
  revalidatePath('/dashboard')
  return { success: true, coinsModified: attended ? attendanceReward : -attendanceReward }
}

/**
 * Update an event's coin reward value.
 */
export async function updateEventCoinReward(eventId: string, coinReward: number) {
  const supabase = await createClient()

  // 1. Authenticate admin user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  // 2. Verify permission
  const allowed = await hasAdminPermission(user.id, 'can_manage_events')
  if (!allowed) return { error: 'Permission denied. You cannot edit event rewards.' }

  // Fetch caller profile for division verification
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, division')
    .eq('id', user.id)
    .single()

  // Verify event division for President
  if (adminProfile?.role === 'president') {
    const { data: event } = await supabase
      .from('events')
      .select('division')
      .eq('id', eventId)
      .single()
    
    if (!event || event.division !== adminProfile.division) {
      return { error: 'Permission denied. You can only edit rewards for events in your own division.' }
    }
  }

  // 3. Update events table
  const { error } = await supabase
    .from('events')
    .update({ coin_reward: coinReward })
    .eq('id', eventId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/events')
  revalidatePath('/events')
  return { success: true }
}

/**
 * Update an existing event.
 */
export async function updateEvent(
  eventId: string,
  title: string,
  description: string,
  date: string,
  time: string,
  location: string,
  capacity: number,
  coinReward: number,
  division?: string | null
) {
  const supabase = await createClient()

  // 1. Authenticate admin user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  // 2. Verify permission
  const allowed = await hasAdminPermission(user.id, 'can_manage_events')
  if (!allowed) return { error: 'Permission denied. You cannot manage events.' }

  if (!title || !date || !time || !location) {
    return { error: 'Missing required event fields.' }
  }

  // Retrieve active admin profile to enforce division restrictions
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, division')
    .eq('id', user.id)
    .single()

  let eventDivision: string | null = null

  if (adminProfile?.role === 'president') {
    eventDivision = adminProfile.division || null
    if (!eventDivision) {
      return { error: 'Active president is not assigned to a division.' }
    }
    
    // Check if the event to edit is in the president's division
    const { data: event } = await supabase
      .from('events')
      .select('division')
      .eq('id', eventId)
      .single()
      
    if (!event || event.division !== eventDivision) {
      return { error: 'Permission denied. You can only edit events in your own division.' }
    }
  } else {
    eventDivision = division || null
  }

  // 3. Update event
  const { error } = await supabase
    .from('events')
    .update({
      title,
      description,
      date,
      time,
      location,
      capacity: capacity || 100,
      coin_reward: coinReward,
      division: eventDivision,
    })
    .eq('id', eventId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/events')
  revalidatePath('/events')
  revalidatePath('/dashboard/president')
  return { success: true }
}

/**
 * Fetch a single user's detailed profile and histories.
 */
export async function getUserFullHistory(targetUserId: string) {
  const supabase = await createClient()

  // 1. Authenticate admin user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  // 2. Verify permission
  const allowed = await hasAdminPermission(user.id, 'can_manage_admins')
  if (!allowed) return { error: 'Permission denied. You cannot view user details.' }

  // 3. Verify division scoping for President role
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, division')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role === 'president') {
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('division')
      .eq('id', targetUserId)
      .single()
    
    if (!targetProfile || targetProfile.division !== adminProfile.division) {
      return { error: 'Permission denied. This user belongs to a different division.' }
    }
  }

  // 4. Fetch profiles (full profile details)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', targetUserId)
    .single()

  if (profileError || !profile) {
    return { error: 'User profile not found.' }
  }

  // 5. Fetch streaks
  const { data: streak } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', targetUserId)
    .single()

  // 6. Fetch coin transactions
  const { data: coinTransactions } = await supabase
    .from('coin_transactions')
    .select('*')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false })

  // 7. Fetch event registrations with event details
  const { data: registrations } = await supabase
    .from('event_registrations')
    .select('*, events(title, date, location, coin_reward)')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false })

  // 8. Fetch user progress with course and lesson details
  const { data: progress } = await supabase
    .from('user_progress')
    .select('*, courses(title, title_ur), lessons(title, title_ur)')
    .eq('user_id', targetUserId)
    .order('completed_at', { ascending: false })

  // Calculate sum of coins from ledger transactions
  const totalCoins = (coinTransactions || []).reduce((sum, tx) => sum + tx.amount, 0)

  return {
    success: true,
    data: {
      profile: {
        ...profile,
        coins: totalCoins,
      },
      streak: streak || { current_streak: 0, longest_streak: 0, last_deed_date: null },
      coinTransactions: coinTransactions || [],
      registrations: registrations || [],
      progress: progress || []
    }
  }
}

/**
 * Update user profile from the admin console.
 */
export async function updateUserProfileAdmin(
  targetUserId: string,
  profileData: {
    father_name: string
    dob: string
    whatsapp: string
    phone: string
    city: string
    district: string
    division: string
    qualification: string
    address: string
  }
) {
  const supabase = await createClient()

  // 1. Authenticate admin user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  // 2. Verify permission
  const allowed = await hasAdminPermission(user.id, 'can_manage_admins')
  if (!allowed) return { error: 'Permission denied. You cannot modify user profiles.' }

  // Fetch caller profile for division verification
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, division')
    .eq('id', user.id)
    .single()

  if (!adminProfile) {
    return { error: 'Admin profile not found.' }
  }

  // Fetch target profile division
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('division')
    .eq('id', targetUserId)
    .single()

  if (!targetProfile) {
    return { error: 'Target user profile not found.' }
  }

  // Enforce President division scoping
  if (adminProfile.role === 'president') {
    if (targetProfile.division !== adminProfile.division) {
      return { error: 'Permission denied. You can only manage members of your own division.' }
    }
    // President cannot move user to another division
    if (profileData.division !== adminProfile.division) {
      return { error: 'Permission denied. You cannot assign a user to another division.' }
    }
  }

  // Update profile
  const { error } = await supabase
    .from('profiles')
    .update({
      father_name: profileData.father_name || null,
      dob: profileData.dob || null,
      whatsapp: profileData.whatsapp || null,
      phone: profileData.phone || null,
      city: profileData.city || null,
      district: profileData.district || null,
      division: profileData.division || null,
      qualification: profileData.qualification || null,
      address: profileData.address || null
    })
    .eq('id', targetUserId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/users')
  return { success: true }
}

/**
 * Delete a user profile (RLS triggers cascading cleanups).
 */
export async function deleteUserProfile(targetUserId: string) {
  const supabase = await createClient()

  // 1. Authenticate admin user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  // 2. Verify permission
  const allowed = await hasAdminPermission(user.id, 'can_manage_admins')
  if (!allowed) return { error: 'Permission denied. You cannot delete users.' }

  // Prevent self deletion
  if (user.id === targetUserId) {
    return { error: 'You cannot delete your own administrative account.' }
  }

  // Fetch caller profile for division verification
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, division')
    .eq('id', user.id)
    .single()

  if (!adminProfile) {
    return { error: 'Admin profile not found.' }
  }

  // Fetch target user profile division
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('role, division')
    .eq('id', targetUserId)
    .single()

  if (!targetProfile) {
    return { error: 'Target user profile not found.' }
  }

  // Enforce President division scoping
  if (adminProfile.role === 'president') {
    if (targetProfile.division !== adminProfile.division) {
      return { error: 'Permission denied. You can only delete members of your own division.' }
    }
  }

  // Delete profile row
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', targetUserId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/users')
  return { success: true }
}


