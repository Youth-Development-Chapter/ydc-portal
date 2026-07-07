'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { hasAdminPermission, AdminPermissions, getAdminContext } from '@/lib/admin'
import { evaluateCriteria } from '@/lib/criteria'
import { randomBytes } from 'crypto'

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

  // Verify unit scoping for President role
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, unit_id')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role === 'president') {
    const { data: submission } = await supabase
      .from('deed_submissions')
      .select('*, profiles:user_id(unit_id)')
      .eq('id', deedId)
      .single()
    
    if (!submission || (submission.profiles as any)?.unit_id !== adminProfile.unit_id) {
      return { error: 'Permission denied. This user belongs to a different unit.' }
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
      verified_at: new Date().toISOString(),
      status_updated_by: user.id
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

  // Verify unit scoping for President role
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, unit_id')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role === 'president') {
    const { data: submission } = await supabase
      .from('deed_submissions')
      .select('*, profiles:user_id(unit_id)')
      .eq('id', deedId)
      .single()
    
    if (!submission || (submission.profiles as any)?.unit_id !== adminProfile.unit_id) {
      return { error: 'Permission denied. This user belongs to a different unit.' }
    }
  }

  // 3. Update deed submission status
  const { error } = await supabase
    .from('deed_submissions')
    .update({
      status: 'rejected',
      admin_notes: adminNotes,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
      status_updated_by: user.id
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
      credited_by: user.id,
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
    .select('role, unit_id')
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
      .select('role, unit_id')
      .eq('id', targetUserId)
      .single()

    if (!targetProfile || targetProfile.unit_id !== activeAdminProfile?.unit_id) {
      return { error: 'Permission denied. You can only manage members of your own unit.' }
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

      // 4. Limit check: max 2 scanners per unit
      const { data: tier3Profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('unit_id', activeAdminProfile?.unit_id)
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
            return { error: 'Limit reached. You can only assign Event Scanner access to at most 2 users in your unit.' }
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

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, unit_id')
    .eq('id', user.id)
    .single()

  // 3. Resolve ticket code/user ID
  let registration = null
  let fetchError = null
  let eventForCheckIn: any = null

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
      .select('*, profiles(full_name, unit_id), events(id, title, unit_id, coin_reward, custom_criteria)')
      .eq('user_id', resolvedUserId)
      .eq('event_id', eventId)
      .maybeSingle()
    
    registration = reg
    fetchError = error

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, unit_id, coin_reward, custom_criteria')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return { error: 'Event not found.', userId: resolvedUserId }
    }
    eventForCheckIn = event

    if (adminProfile?.role === 'president' && event.unit_id !== adminProfile.unit_id) {
      return { error: 'Permission denied. You can only scan events in your own unit.', userId: resolvedUserId }
    }

    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id, full_name, unit_id')
      .eq('id', resolvedUserId)
      .single()

    if (!targetProfile) {
      return { error: 'Volunteer profile not found.', userId: resolvedUserId }
    }
    if (event.unit_id && event.unit_id !== targetProfile.unit_id) {
      return { error: 'This volunteer belongs to a different unit.', userId: resolvedUserId }
    }
    if (event.custom_criteria && Object.keys(event.custom_criteria).length > 0) {
      const criteria = await evaluateCriteria(supabase, resolvedUserId, event.custom_criteria)
      if (!criteria.eligible) {
        return { error: criteria.reason || 'Volunteer is not eligible for this event.', userId: resolvedUserId }
      }
    }

    if (!registration && !fetchError) {
      const ticketCode = `TKT-${eventId.substring(0, 4).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`
      const { data: newReg, error: insertError } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: resolvedUserId,
          ticket_code: ticketCode,
          attended: false,
          status: 'registered',
        })
        .select('*, profiles(full_name, unit_id), events(id, title, unit_id, coin_reward, custom_criteria)')
        .single()

      if (insertError) {
        return { error: insertError.message, userId: resolvedUserId }
      }
      registration = newReg
    }
  } else {
    // Fallback: scannedId is the ticket code
    const { data: reg, error } = await supabase
      .from('event_registrations')
      .select('*, profiles(full_name, unit_id), events(id, title, unit_id, coin_reward, custom_criteria)')
      .eq('ticket_code', scannedId.trim())
      .maybeSingle()
    
    registration = reg
    fetchError = error
    eventForCheckIn = (reg?.events as any) || null

    if (adminProfile?.role === 'president' && eventForCheckIn?.unit_id !== adminProfile.unit_id) {
      return { error: 'Permission denied. You can only scan events in your own unit.' }
    }
  }

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (!registration) {
    return { 
      error: 'Ticket not found. This user is not registered for the event.',
      userId: !scannedId.trim().startsWith('TKT-') ? scannedId.trim() : null
    }
  }

  if (registration.attended) {
    return { 
      error: 'Ticket already scanned.', 
      alreadyScanned: true,
      userName: registration.profiles?.full_name || 'Volunteer',
      userId: registration.user_id
    }
  }

  // 4. Fetch reward (event-specific first, fallback to system settings)
  let attendanceReward = eventForCheckIn?.coin_reward ?? (registration.events as any)?.coin_reward
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
      attended_at: new Date().toISOString(),
      status: 'present',
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
      reference_id: registration.id,
      credited_by: user.id
    })

  if (coinError) {
    console.error('Error crediting attendance coins:', coinError)
  }

  // Note: the volunteer-facing realtime broadcast is sent from the scanner's browser
  // (PresidentScannerClient) which reliably reaches the user's <CheckInListener>.
  // We intentionally do NOT broadcast from this server action — opening a websocket
  // here raced the client broadcast and produced duplicate/none-at-all popups.

  revalidatePath('/admin/events')
  revalidatePath('/dashboard')

  return {
    success: true,
    userName: registration.profiles?.full_name || 'Volunteer',
    coinsAwarded: attendanceReward,
    userId: registration.user_id
  }
}


/**
 * Create a new event.
 */
export async function createEvent(
  title: string,
  description: string,
  date: string,
  startTime: string,
  endTime: string,
  location: string,
  capacity: number,
  coinReward: number,
  unitId?: string | null,
  excludedUnitIds?: string[] | null,
  isCompulsory?: boolean,
  customCriteria?: any,
  posterUrl?: string | null,
  posterColor?: string | null
) {
  const supabase = await createClient()

  // 1. Authenticate admin user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  // 2. Verify permission
  const allowed = await hasAdminPermission(user.id, 'can_manage_events')
  if (!allowed) return { error: 'Permission denied. You cannot manage events.' }

  if (!title || !date || !startTime || !endTime || !location) {
    return { error: 'Missing required event fields.' }
  }

  // Retrieve active admin profile to enforce unit restrictions
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, unit_id')
    .eq('id', user.id)
    .single()

  let eventUnitId: string | null = null

  if (adminProfile?.role === 'president') {
    eventUnitId = adminProfile.unit_id || null
    if (!eventUnitId) {
      return { error: 'Active president is not assigned to a unit.' }
    }
  } else {
    eventUnitId = unitId || null
  }

  // 3. Insert event
  const { error } = await supabase
    .from('events')
    .insert({
      title,
      description,
      date,
      start_time: startTime,
      end_time: endTime,
      location,
      capacity,
      coin_reward: coinReward,
      unit_id: eventUnitId,
      excluded_unit_ids: excludedUnitIds || [],
      is_compulsory: isCompulsory || false,
      custom_criteria: customCriteria || null,
      poster_url: posterUrl || null,
      poster_color: posterColor || null
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/events')
  revalidatePath('/events')
  revalidateTag('events', 'max')
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

  // Fetch caller profile for unit verification
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, unit_id')
    .eq('id', user.id)
    .single()

  // 3. Fetch registration with events unit
  const { data: registration, error: fetchError } = await supabase
    .from('event_registrations')
    .select('*, events(title, unit_id, coin_reward), profiles(full_name)')
    .eq('id', registrationId)
    .single()

  if (fetchError || !registration) {
    return { error: 'Registration record not found.' }
  }

  // Verify unit if caller is a President
  if (adminProfile?.role === 'president') {
    const eventUnit = (registration.events as any)?.unit_id
    if (eventUnit !== adminProfile.unit_id) {
      return { error: 'Permission denied. You can only manage attendees for events in your own unit.' }
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
      reference_id: registration.id,
      credited_by: user.id
    })

  if (coinError) {
    console.error('Error modifying attendance coins:', coinError)
  }

  revalidatePath('/admin/events')
  revalidatePath('/dashboard')
  revalidateTag('events', 'max')
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

  // Fetch caller profile for unit verification
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, unit_id')
    .eq('id', user.id)
    .single()

  // Verify event unit for President
  if (adminProfile?.role === 'president') {
    const { data: event } = await supabase
      .from('events')
      .select('unit_id')
      .eq('id', eventId)
      .single()
    
    if (!event || event.unit_id !== adminProfile.unit_id) {
      return { error: 'Permission denied. You can only edit rewards for events in your own unit.' }
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
  revalidateTag('events', 'max')
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
  startTime: string,
  endTime: string,
  location: string,
  capacity: number,
  coinReward: number,
  unitId?: string | null,
  excludedUnitIds?: string[] | null,
  isCompulsory?: boolean,
  posterUrl?: string | null,
  posterColor?: string | null
) {
  const supabase = await createClient()

  // 1. Authenticate admin user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  // 2. Verify permission
  const allowed = await hasAdminPermission(user.id, 'can_manage_events')
  if (!allowed) return { error: 'Permission denied. You cannot manage events.' }

  if (!title || !date || !startTime || !endTime || !location) {
    return { error: 'Missing required event fields.' }
  }

  // Retrieve active admin profile to enforce unit restrictions
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, unit_id')
    .eq('id', user.id)
    .single()

  let eventUnitId: string | null = null

  if (adminProfile?.role === 'president') {
    eventUnitId = adminProfile.unit_id || null
    if (!eventUnitId) {
      return { error: 'Active president is not assigned to a unit.' }
    }
    
    // Check if the event to edit is in the president's unit
    const { data: event } = await supabase
      .from('events')
      .select('unit_id')
      .eq('id', eventId)
      .single()
      
    if (!event || event.unit_id !== eventUnitId) {
      return { error: 'Permission denied. You can only edit events in your own unit.' }
    }
  } else {
    eventUnitId = unitId || null
  }

  // 3. Update event
  const { error } = await supabase
    .from('events')
    .update({
      title,
      description,
      date,
      start_time: startTime,
      end_time: endTime,
      location,
      capacity: capacity || 100,
      coin_reward: coinReward,
      unit_id: eventUnitId,
      excluded_unit_ids: excludedUnitIds || [],
      is_compulsory: isCompulsory !== undefined ? isCompulsory : false,
      poster_url: posterUrl,
      poster_color: posterColor
    })
    .eq('id', eventId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/events')
  revalidatePath('/events')
  revalidatePath('/dashboard/president')
  revalidateTag('events', 'max')
  return { success: true }
}

/**
 * Archive or restore an event.
 */
export async function archiveEvent(eventId: string, isArchived: boolean) {
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  // 2. Verify permission
  const allowed = await hasAdminPermission(user.id, 'can_manage_events')
  if (!allowed) return { error: 'Permission denied. You cannot manage events.' }

  // Check role restrictions
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, unit_id')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role === 'president') {
    const eventUnitId = adminProfile.unit_id || null
    if (!eventUnitId) return { error: 'Active president is not assigned to a unit.' }

    // Check if the event is in the president's unit
    const { data: event } = await supabase
      .from('events')
      .select('unit_id')
      .eq('id', eventId)
      .single()

    if (!event || event.unit_id !== eventUnitId) {
      return { error: 'Permission denied. You can only archive events in your own unit.' }
    }
  }

  // Update event is_archived status
  const { error } = await supabase
    .from('events')
    .update({ is_archived: isArchived })
    .eq('id', eventId)

  if (error) return { error: error.message }

  revalidatePath('/admin/events')
  revalidatePath('/events')
  revalidatePath('/dashboard/president')
  revalidateTag('events', 'max')
  return { success: true }
}

/**
 * Permanently delete an event.
 */
export async function deleteEvent(eventId: string) {
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  // 2. Verify permission
  const allowed = await hasAdminPermission(user.id, 'can_manage_events')
  if (!allowed) return { error: 'Permission denied. You cannot manage events.' }

  // Check role restrictions
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, unit_id')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role === 'president') {
    const eventUnitId = adminProfile.unit_id || null
    if (!eventUnitId) return { error: 'Active president is not assigned to a unit.' }

    // Check if the event is in the president's unit
    const { data: event } = await supabase
      .from('events')
      .select('unit_id')
      .eq('id', eventId)
      .single()

    if (!event || event.unit_id !== eventUnitId) {
      return { error: 'Permission denied. You can only delete events in your own unit.' }
    }
  }

  // Delete event
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (error) return { error: error.message }

  revalidatePath('/admin/events')
  revalidatePath('/events')
  revalidatePath('/dashboard/president')
  revalidateTag('events', 'max')
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

  // 3. Verify unit scoping for President role
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, unit_id')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role === 'president') {
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('unit_id')
      .eq('id', targetUserId)
      .single()
    
    if (!targetProfile || targetProfile.unit_id !== adminProfile.unit_id) {
      return { error: 'Permission denied. This user belongs to a different unit.' }
    }
  }

  // 4. Fetch profiles (full profile details)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*, units(name)')
    .eq('id', targetUserId)
    .single()

  if (profileError || !profile) {
    return { error: 'User profile not found.' }
  }

  // Resolve unit name
  let unitName = ''
  if (profile.units) {
    if (Array.isArray(profile.units)) {
      unitName = profile.units[0]?.name || ''
    } else if (typeof profile.units === 'object') {
      unitName = (profile.units as any).name || ''
    }
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
    .select('*, credited_by_profile:profiles!credited_by(full_name)')
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

  // 9. Fetch deed submissions
  const { data: deedSubmissions } = await supabase
    .from('deed_submissions')
    .select('*')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false })

  // Calculate sum of coins from ledger transactions
  const totalCoins = (coinTransactions || []).reduce((sum, tx) => sum + tx.amount, 0)

  return {
    success: true,
    data: {
      profile: {
        ...profile,
        unit_name: unitName,
        coins: totalCoins,
      },
      streak: streak || { current_streak: 0, longest_streak: 0, last_deed_date: null },
      coinTransactions: coinTransactions || [],
      registrations: registrations || [],
      progress: progress || [],
      deedSubmissions: deedSubmissions || []
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
    unit_id: string
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

  // Fetch caller profile for unit verification
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, unit_id')
    .eq('id', user.id)
    .single()

  if (!adminProfile) {
    return { error: 'Admin profile not found.' }
  }

  // Fetch target profile unit
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('unit_id')
    .eq('id', targetUserId)
    .single()

  if (!targetProfile) {
    return { error: 'Target user profile not found.' }
  }

  // Enforce President unit scoping
  if (adminProfile.role === 'president') {
    if (targetProfile.unit_id !== adminProfile.unit_id) {
      return { error: 'Permission denied. You can only manage members of your own unit.' }
    }
    // President cannot move user to another unit
    if (profileData.unit_id !== adminProfile.unit_id) {
      return { error: 'Permission denied. You cannot assign a user to another unit.' }
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
      unit_id: profileData.unit_id || null,
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

  // Fetch caller profile for unit verification
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, unit_id')
    .eq('id', user.id)
    .single()

  if (!adminProfile) {
    return { error: 'Admin profile not found.' }
  }

  // Fetch target user profile unit
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('role, unit_id')
    .eq('id', targetUserId)
    .single()

  if (!targetProfile) {
    return { error: 'Target user profile not found.' }
  }

  // Enforce President unit scoping
  if (adminProfile.role === 'president') {
    if (targetProfile.unit_id !== adminProfile.unit_id) {
      return { error: 'Permission denied. You can only delete members of your own unit.' }
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


/**
 * ==========================================
 * UNIT MANAGEMENT
 * ==========================================
 */

/**
 * Create a new Unit.
 * Superadmin only.
 */
export async function createUnit(name: string, province: string | null) {
  if (!name) return { error: 'Unit name is required.' }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'superadmin') {
    return { error: 'Permission denied. Only Superadmins can create Units.' }
  }

  const { error } = await supabase
    .from('units')
    .insert({ name, province: province || null })

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

/**
 * Update a Unit.
 * Superadmin only.
 */
export async function updateUnit(unitId: string, name: string, province: string | null) {
  if (!name) return { error: 'Unit name is required.' }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'superadmin') {
    return { error: 'Permission denied. Only Superadmins can update Units.' }
  }

  const { error } = await supabase
    .from('units')
    .update({ name, province: province || null })
    .eq('id', unitId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

/**
 * Delete a Unit.
 * Superadmin only.
 */
export async function deleteUnit(unitId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'superadmin') {
    return { error: 'Permission denied. Only Superadmins can delete Units.' }
  }

  const { error } = await supabase
    .from('units')
    .delete()
    .eq('id', unitId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

export async function getPaginatedUsers(page: number, limit: number, searchTerm: string, roleFilter: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { role, permissions } = await getAdminContext(user.id)
  if (!permissions.can_manage_admins) return { error: 'Permission denied' }

  let query = supabase.from('profiles').select('id, full_name, email, role, unit_id, units(name), qualification, avatar_url, created_at', { count: 'exact' })

  if (role === 'president') {
    const { data: adminProfile } = await supabase.from('profiles').select('unit_id').eq('id', user.id).single()
    if (adminProfile?.unit_id) {
      query = query.eq('unit_id', adminProfile.unit_id)
    }
  }

  if (searchTerm) {
    query = query.ilike('full_name', `%${searchTerm}%`)
  }
  if (roleFilter && roleFilter !== 'all') {
    query = query.eq('role', roleFilter)
  }

  const { data: profiles, count, error } = await query
    .range((page - 1) * limit, page * limit - 1)
    .order('full_name')

  if (error || !profiles) return { error: error?.message || 'Error fetching users' }

  const userIds = profiles.map(p => p.id)
  const [{ data: streaks }, { data: txns }, { data: adminPerms }] = await Promise.all([
    supabase.from('streaks').select('user_id, current_streak, longest_streak').in('user_id', userIds),
    supabase.from('coin_transactions').select('user_id, amount').in('user_id', userIds),
    supabase.from('admin_permissions').select('*').in('admin_id', userIds)
  ])

  const streakMap = new Map(streaks?.map(s => [s.user_id, s]) || [])
  const coinMap = new Map()
  txns?.forEach(t => {
    const current = coinMap.get(t.user_id) || 0
    coinMap.set(t.user_id, current + t.amount)
  })

  const permissionMap = new Map(adminPerms?.map(p => [p.admin_id, p]) || [])

  const enrichedUsers = profiles.map(p => {
    let unitName = 'No Unit Assigned'
    if (p.units) {
      if (Array.isArray(p.units)) {
        unitName = p.units[0]?.name || 'No Unit Assigned'
      } else if (typeof p.units === 'object') {
        unitName = (p.units as any).name || 'No Unit Assigned'
      }
    }
    return {
      ...p,
      unit_name: unitName,
      coins: coinMap.get(p.id) || 0,
      streak: {
        current: streakMap.get(p.id)?.current_streak || 0,
        longest: streakMap.get(p.id)?.longest_streak || 0,
      },
      permissions: permissionMap.get(p.id) || {
        can_scan_tickets: false,
        can_approve_deeds: false,
        can_manage_events: false,
        can_manage_courses: false,
        can_manage_settings: false,
        can_manage_admins: false,
      }
    }
  })

  return { users: enrichedUsers, totalCount: count || 0 }
}

export async function processEventLeave(registrationId: string, action: 'approve' | 'reject') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check admin perms
  const { role, permissions } = await getAdminContext(user.id)
  if (!permissions.can_manage_events) return { error: 'Permission denied' }

  const status = action === 'approve' ? 'leave_approved' : 'leave_rejected'
  
  const { error } = await supabase
    .from('event_registrations')
    .update({ status })
    .eq('id', registrationId)

  if (error) return { error: error.message }
  return { success: true }
}

/**
 * Flag a deed submission as inappropriate content.
 * Deducts coins from the volunteer's balance (can go negative).
 */
export async function flagDeedSubmission(
  deedId: string,
  coinDeduction: number,
  adminNotes: string
) {
  if (!adminNotes?.trim()) return { error: 'A reason is required when flagging a deed.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  const allowed = await hasAdminPermission(user.id, 'can_approve_deeds')
  if (!allowed) return { error: 'Permission denied.' }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, unit_id')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role === 'president') {
    const { data: submission } = await supabase
      .from('deed_submissions')
      .select('*, profiles:user_id(unit_id)')
      .eq('id', deedId)
      .single()
    if (!submission || (submission.profiles as any)?.unit_id !== adminProfile.unit_id) {
      return { error: 'Permission denied. This user belongs to a different unit.' }
    }
  }

  const { data: deed, error: deedError } = await supabase
    .from('deed_submissions')
    .update({
      status: 'flagged',
      admin_notes: adminNotes.trim(),
      verified_by: user.id,
      verified_at: new Date().toISOString(),
      status_updated_by: user.id,
    })
    .eq('id', deedId)
    .select('user_id')
    .single()

  if (deedError || !deed) return { error: deedError?.message || 'Failed to flag deed.' }

  if (coinDeduction > 0) {
    await supabase.from('coin_transactions').insert({
      user_id: deed.user_id,
      amount: -Math.abs(coinDeduction),
      reason: 'flagged_deed',
      reference_id: deedId,
      credited_by: user.id,
    })
  }

  revalidatePath('/admin/approvals')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Override a past deed decision. Only superadmin/admin (not president) can override.
 */
export async function overrideDeedDecision(
  deedId: string,
  newStatus: 'approved' | 'rejected' | 'flagged',
  adminNotes: string,
  coinDeduction?: number
) {
  if (!adminNotes?.trim()) return { error: 'Notes are required for overriding a decision.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!adminProfile || !['superadmin', 'admin'].includes(adminProfile.role)) {
    return { error: 'Permission denied. Only admins can override past decisions.' }
  }

  const { data: existingDeed, error: fetchError } = await supabase
    .from('deed_submissions')
    .select('status, coin_reward, bonus_coins, user_id')
    .eq('id', deedId)
    .single()

  if (fetchError || !existingDeed) return { error: 'Deed not found.' }

  const wasApproved = existingDeed.status === 'approved'
  const willBeApproved = newStatus === 'approved'

  const { error: updateError } = await supabase
    .from('deed_submissions')
    .update({
      status: newStatus,
      admin_notes: adminNotes.trim(),
      status_updated_by: user.id,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    })
    .eq('id', deedId)

  if (updateError) return { error: updateError.message }

  if (wasApproved && !willBeApproved) {
    const totalPrev = (existingDeed.coin_reward || 0) + (existingDeed.bonus_coins || 0)
    if (totalPrev > 0) {
      await supabase.from('coin_transactions').insert({
        user_id: existingDeed.user_id, amount: -totalPrev,
        reason: 'deed_approval_revoked', reference_id: deedId, credited_by: user.id,
      })
    }
  }

  if (!wasApproved && willBeApproved) {
    const { data: baseSetting } = await supabase.from('system_settings').select('value').eq('key', 'daily_deed_reward').single()
    const baseReward = baseSetting ? parseInt(baseSetting.value, 10) : 10
    await supabase.from('coin_transactions').insert({
      user_id: existingDeed.user_id, amount: baseReward,
      reason: 'daily_deed', reference_id: deedId, credited_by: user.id,
    })
  }

  if (newStatus === 'flagged' && coinDeduction && coinDeduction > 0) {
    await supabase.from('coin_transactions').insert({
      user_id: existingDeed.user_id, amount: -Math.abs(coinDeduction),
      reason: 'flagged_deed', reference_id: deedId, credited_by: user.id,
    })
  }

  revalidatePath('/admin/approvals')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getEventRoster(
  eventId: string,
  page: number = 1,
  limit: number = 20,
  search: string = '',
  statusFilter: string = 'all'
) {
  const supabase = await createClient()

  // 1. Authenticate admin user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  // 2. Verify permission
  const { role, permissions } = await getAdminContext(user.id)
  const hasAccess = permissions.can_scan_tickets || permissions.can_manage_events
  if (!hasAccess) return { error: 'Permission denied.' }

  // 3. Fetch admin profile unit if president
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('unit_id')
    .eq('id', user.id)
    .single()
  const adminUnitId = adminProfile?.unit_id || null

  // 4. Fetch event detail
  const { data: event } = await supabase
    .from('events')
    .select('id, unit_id, is_compulsory, date')
    .eq('id', eventId)
    .single()

  if (!event) return { error: 'Event not found.' }

  // Presidents can only view events in their own unit
  if (role === 'president' && adminUnitId && event.unit_id !== adminUnitId) {
    return { error: 'Permission denied. This event belongs to a different unit.' }
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const isPast = event.date < todayStr

  // 5. Query roster entries
  // If it's compulsory, we fetch from profiles table and left join event_registrations
  if (event.is_compulsory) {
    let query = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        qualification,
        unit_id,
        units:unit_id(name),
        event_registrations(
          id,
          attended,
          attended_at,
          status,
          leave_note,
          ticket_code,
          event_id
        )
      `)
      .eq('role', 'volunteer')
      .eq('event_registrations.event_id', eventId)
      
    if (event.unit_id) {
      query = query.eq('unit_id', event.unit_id)
    } else if (role === 'president' && adminUnitId) {
      query = query.eq('unit_id', adminUnitId)
    }

    if (search) {
      query = query.ilike('full_name', `%${search}%`)
    }

    // Also fetch all registrations for this event to find any registered/attended non-volunteers
    let regsQuery = supabase
      .from('event_registrations')
      .select(`
        id,
        attended,
        attended_at,
        status,
        leave_note,
        ticket_code,
        profiles!inner(
          id,
          full_name,
          qualification,
          unit_id,
          units:unit_id(name),
          role
        )
      `)
      .eq('event_id', eventId)

    if (event.unit_id) {
      regsQuery = regsQuery.eq('profiles.unit_id', event.unit_id)
    } else if (role === 'president' && adminUnitId) {
      regsQuery = regsQuery.eq('profiles.unit_id', adminUnitId)
    }

    if (search) {
      regsQuery = regsQuery.ilike('profiles.full_name', `%${search}%`)
    }

    const [profilesRes, regsRes] = await Promise.all([
      query,
      regsQuery
    ])

    if (profilesRes.error) return { error: profilesRes.error.message }
    const profiles = profilesRes.data || []
    const registrations = regsRes.data || []

    const helperGetUnitName = (units: any) => {
      if (Array.isArray(units)) return units[0]?.name || 'Not specified'
      if (units && typeof units === 'object') return units.name || 'Not specified'
      return 'Not specified'
    }

    const volunteerIds = new Set(profiles.map((p: any) => p.id))

    // Map and filter status in JS
    let roster: any[] = profiles.map((p: any) => {
      const reg = Array.isArray(p.event_registrations)
        ? p.event_registrations[0] // Since user_id & event_id is UNIQUE, there will be max 1 row
        : null

      let status = reg?.status || 'expected'
      if (isPast && status === 'expected') {
        status = 'absent'
      }

      return {
        id: reg?.id || p.id,
        user_id: p.id,
        full_name: p.full_name || 'Anonymous Volunteer',
        unit_name: helperGetUnitName(p.units),
        qualification: p.qualification || 'Not specified',
        attended: reg?.attended || false,
        ticket_code: reg?.ticket_code || null,
        status,
        leave_note: reg?.leave_note || null,
        registration_id: reg?.id || null,
        is_synthetic: !reg,
        attended_at: reg?.attended_at || null
      }
    })

    // Include registered non-volunteers
    for (const reg of registrations) {
      const rawProfile = reg.profiles
      const p: any = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile
      if (p && !volunteerIds.has(p.id)) {
        let status = reg.status || 'registered'
        if (status === 'registered' && reg.attended) {
          status = 'present'
        }
        if (isPast && status === 'registered' && !reg.attended) {
          status = 'absent'
        }

        roster.push({
          id: reg.id,
          user_id: p.id,
          full_name: p.full_name || 'Anonymous User',
          unit_name: helperGetUnitName(p.units),
          qualification: p.qualification || 'Not specified',
          attended: reg.attended || false,
          ticket_code: reg.ticket_code || null,
          status,
          leave_note: reg.leave_note || null,
          registration_id: reg.id,
          is_synthetic: false,
          attended_at: reg.attended_at || null
        })
      }
    }

    // Apply status filter in JS
    if (statusFilter !== 'all') {
      roster = roster.filter(r => {
        if (statusFilter === 'checked_in') return r.attended
        if (statusFilter === 'absent') return r.status === 'absent'
        if (statusFilter === 'pending_leave') return r.status === 'leave_pending'
        if (statusFilter === 'leave_approved') return r.status === 'leave_approved'
        if (statusFilter === 'leave_rejected') return r.status === 'leave_rejected'
        if (statusFilter === 'expected') return r.status === 'expected' || r.status === 'registered'
        return true
      })
    }

    const totalCount = roster.length
    // Paginate roster
    const paginatedRoster = roster.slice((page - 1) * limit, page * limit)

    return {
      success: true,
      roster: paginatedRoster,
      totalCount,
      page,
      limit
    }
  } else {
    // If optional event, we only fetch registered people from event_registrations
    let query = supabase
      .from('event_registrations')
      .select(`
        id,
        attended,
        attended_at,
        status,
        leave_note,
        ticket_code,
        profiles!inner(
          id,
          full_name,
          qualification,
          unit_id,
          units:unit_id(name)
        )
      `, { count: 'exact' })
      .eq('event_id', eventId)

    if (search) {
      query = query.ilike('profiles.full_name', `%${search}%`)
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'checked_in') {
        query = query.eq('attended', true)
      } else if (statusFilter === 'absent') {
        query = query.eq('attended', false).eq('status', 'absent')
      } else if (statusFilter === 'pending_leave') {
        query = query.eq('status', 'leave_pending')
      } else if (statusFilter === 'leave_approved') {
        query = query.eq('status', 'leave_approved')
      } else if (statusFilter === 'leave_rejected') {
        query = query.eq('status', 'leave_rejected')
      } else if (statusFilter === 'expected') {
        query = query.eq('attended', false).eq('status', 'registered')
      } else if (statusFilter === 'not_going') {
        query = query.eq('status', 'not_going')
      }
    } else {
      query = query.neq('status', 'not_going')
    }

    // Sort: show leave_pending first
    query = query
      .order('status', { ascending: true })
      .range((page - 1) * limit, page * limit - 1)

    const { data: registrations, count, error } = await query

    if (error) return { error: error.message }

    const roster: any[] = (registrations || []).map((reg: any) => {
      const p = reg.profiles
      return {
        id: reg.id,
        user_id: p.id,
        full_name: p.full_name || 'Anonymous Volunteer',
        unit_name: p.units?.name || 'Not specified',
        qualification: p.qualification || 'Not specified',
        attended: reg.attended,
        ticket_code: reg.ticket_code,
        status: reg.status || 'registered',
        leave_note: reg.leave_note,
        registration_id: reg.id,
        is_synthetic: false,
        attended_at: reg.attended_at
      }
    })

    return {
      success: true,
      roster,
      totalCount: count || 0,
      page,
      limit
    }
  }
}

export async function bulkCheckInAttendees(eventId: string, userIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized. Please log in.' }

  const allowed = await hasAdminPermission(user.id, 'can_scan_tickets')
  if (!allowed) return { error: 'Permission denied. You cannot check in attendees.' }

  const results = []
  for (const uid of userIds) {
    const res = await checkInTicket(uid, eventId)
    results.push({ userId: uid, ...res })
  }

  revalidatePath('/admin/events')
  return { success: true, results }
}

export async function bulkProcessLeaves(registrationIds: string[], action: 'approve' | 'reject') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized.' }

  const { permissions } = await getAdminContext(user.id)
  if (!permissions.can_manage_events) return { error: 'Permission denied.' }

  const status = action === 'approve' ? 'leave_approved' : 'leave_rejected'

  const { error } = await supabase
    .from('event_registrations')
    .update({ status })
    .in('id', registrationIds)

  if (error) return { error: error.message }

  revalidatePath('/admin/events')
  return { success: true }
}

