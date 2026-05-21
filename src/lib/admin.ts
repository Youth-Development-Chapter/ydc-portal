import { createClient } from '@/utils/supabase/server'

export interface AdminPermissions {
  can_scan_tickets: boolean
  can_approve_deeds: boolean
  can_manage_events: boolean
  can_manage_courses: boolean
  can_manage_settings: boolean
  can_manage_admins: boolean
}

export type AdminRole = 'superadmin' | 'president' | 'tier-3' | 'admin' | 'volunteer'

/**
 * Checks if a role is administrative.
 */
export function isAdminRole(role: string): boolean {
  return ['superadmin', 'president', 'tier-3', 'admin'].includes(role)
}

/**
 * Checks if a user has a specific administrative permission.
 * - Superadmins and Presidents have all permissions automatically.
 * - Tier-3 admins are verified against their row in `admin_permissions`.
 * - Other users have no administrative permissions.
 */
export async function hasAdminPermission(
  userId: string,
  permission: keyof AdminPermissions
): Promise<boolean> {
  const supabase = await createClient()

  // 1. Fetch user's role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return false
  }

  const role = profile.role as AdminRole

  // Superadmin and President bypass all checks
  if (role === 'superadmin' || role === 'president') {
    return true
  }

  // Legacy admin role has full permissions for backward compatibility
  if (role === 'admin') {
    return true
  }

  // Tier-3 admins must have the specific permission checked in the DB
  if (role === 'tier-3') {
    const { data: permissions, error: permError } = await supabase
      .from('admin_permissions')
      .select('*')
      .eq('admin_id', userId)
      .single()

    if (permError || !permissions) {
      return false
    }

    return !!permissions[permission]
  }

  // Volunteers have no admin privileges
  return false
}

/**
 * Fetches the user's role and all their permissions.
 */
export async function getAdminContext(userId: string): Promise<{
  role: AdminRole
  permissions: AdminPermissions
}> {
  const supabase = await createClient()

  const defaultPermissions: AdminPermissions = {
    can_scan_tickets: false,
    can_approve_deeds: false,
    can_manage_events: false,
    can_manage_courses: false,
    can_manage_settings: false,
    can_manage_admins: false,
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (!profile) {
    return { role: 'volunteer', permissions: defaultPermissions }
  }

  const role = profile.role as AdminRole

  if (role === 'superadmin' || role === 'president' || role === 'admin') {
    return {
      role,
      permissions: {
        can_scan_tickets: true,
        can_approve_deeds: true,
        can_manage_events: true,
        can_manage_courses: true,
        can_manage_settings: true,
        can_manage_admins: role === 'superadmin' || role === 'president',
      },
    }
  }

  if (role === 'tier-3') {
    const { data: permissions } = await supabase
      .from('admin_permissions')
      .select('*')
      .eq('admin_id', userId)
      .single()

    if (permissions) {
      return {
        role,
        permissions: {
          can_scan_tickets: !!permissions.can_scan_tickets,
          can_approve_deeds: !!permissions.can_approve_deeds,
          can_manage_events: !!permissions.can_manage_events,
          can_manage_courses: !!permissions.can_manage_courses,
          can_manage_settings: !!permissions.can_manage_settings,
          can_manage_admins: !!permissions.can_manage_admins,
        },
      }
    }
  }

  return { role: 'volunteer', permissions: defaultPermissions }
}
