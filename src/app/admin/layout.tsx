import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext } from '@/lib/admin'
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Settings,
  Users,
  ArrowLeft,
  Shield,
  User,
  BookOpen,
  Megaphone,
  Gift,
} from 'lucide-react'

// Define the nav items with their corresponding permissions.
// `requireExactRole: 'admin'` is used when the underlying RLS only matches
// profiles.role = 'admin' literally — showing the link to other admin roles
// would be misleading because their writes would 403.
const NAV_ITEMS: Array<{
  name: string
  href: string
  icon: typeof LayoutDashboard
  permission: string | null
  requireExactRole?: 'admin'
}> = [
  {
    name: 'Overview',
    href: '/admin',
    icon: LayoutDashboard,
    permission: null, // accessible to all admins
  },
  {
    name: 'Deed Approvals',
    href: '/admin/approvals',
    icon: CheckSquare,
    permission: 'can_approve_deeds',
  },
  {
    name: 'Events & Scanning',
    href: '/admin/events',
    icon: Calendar,
    permission: 'can_scan_tickets', // accessible if they can scan or manage events
  },
  {
    name: 'User Directory',
    href: '/admin/users',
    icon: Users,
    permission: 'can_manage_admins', // accessible to superadmin/president (who manage admins)
  },
  {
    name: 'Courses & LMS',
    href: '/admin/courses',
    icon: BookOpen,
    permission: 'can_manage_courses',
    requireExactRole: 'admin',
  },
  {
    name: 'Settings & Rewards',
    href: '/admin/settings',
    icon: Settings,
    permission: 'can_manage_settings',
  },
  {
    name: 'Announcements',
    href: '/admin/announcements',
    icon: Megaphone,
    permission: 'can_manage_settings',
  },
  {
    name: 'Reward Shop',
    href: '/admin/rewards',
    icon: Gift,
    permission: 'can_manage_settings',
  },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch admin context
  const { role, permissions } = await getAdminContext(user.id)
  
  if (role === 'volunteer') {
    redirect('/dashboard')
  }

  // Filter nav items based on granular permissions
  const filteredNavItems = NAV_ITEMS.filter((item) => {
    // Some items require a specific underlying profiles.role because their
    // tables' RLS policies only allow that exact role.
    if (item.requireExactRole && role !== item.requireExactRole) {
      return false
    }

    if (!item.permission) return true

    // Custom check for events: visible if they can scan tickets OR manage events
    if (item.permission === 'can_scan_tickets') {
      return permissions.can_scan_tickets || permissions.can_manage_events
    }

    return permissions[item.permission as keyof typeof permissions]
  })

  // Format user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()
  
  const adminName = profile?.full_name || 'Admin Member'

  const roleLabels: Record<string, string> = {
    superadmin: 'Super Admin',
    president: 'President Admin',
    'tier-3': 'Tier 3 Admin',
    admin: 'Administrator',
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 text-zinc-300 flex flex-col fixed inset-y-0 left-0 z-30 shrink-0">
        {/* Brand Logo Header */}
        <div className="h-16 px-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-red-950/50">
            Y
          </div>
          <div>
            <span className="font-bold text-white tracking-wide text-sm block">YDC Portal</span>
            <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Admin Panel</span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-4 bg-zinc-800/40 rounded-xl border border-zinc-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 shadow-inner">
            <User size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate" title={adminName}>{adminName}</p>
            <div className="flex items-center gap-1 mt-0.5 text-red-500 font-bold text-[10px] uppercase tracking-wider">
              <Shield size={10} />
              <span>{roleLabels[role] || 'Admin'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-800/80 hover:text-white transition-all duration-150 group"
              >
                <Icon size={18} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-zinc-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all duration-150"
          >
            <ArrowLeft size={18} />
            <span>Volunteer Portal</span>
          </Link>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="pl-64 flex-1 flex flex-col min-h-screen">
        {/* TOP NAVBAR */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
              YDC Administration System
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-100 rounded-full text-[11px] font-extrabold text-red-600">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
              <span>LIVE ADMIN MODE</span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 p-8 bg-zinc-50">
          {children}
        </main>
      </div>
    </div>
  )
}
