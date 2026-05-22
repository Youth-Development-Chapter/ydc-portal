'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Settings,
  Users,
  Megaphone,
  BookOpen,
  Gift,
} from 'lucide-react'

// Define the structure for permissions
interface AdminPermissions {
  can_scan_tickets: boolean
  can_approve_deeds: boolean
  can_manage_events: boolean
  can_manage_courses: boolean
  can_manage_settings: boolean
  can_manage_admins: boolean
}

interface AdminNavProps {
  role: string
  permissions: AdminPermissions
  mobileOnly?: boolean
  desktopOnly?: boolean
}

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  permission?: string | null
  exact?: boolean
  requireExactRole?: string
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Overview',
    href: '/admin',
    icon: LayoutDashboard,
    permission: null,
    exact: true,
  },
  {
    name: 'Streaks',
    href: '/admin/approvals',
    icon: CheckSquare,
    permission: 'can_approve_deeds',
  },
  {
    name: 'Events & Scanning',
    href: '/admin/events',
    icon: Calendar,
    permission: 'can_scan_tickets', // checked specially
  },
  {
    name: 'User Directory',
    href: '/admin/users',
    icon: Users,
    permission: 'can_manage_admins',
  },
  {
    name: 'Courses & LMS',
    href: '/admin/courses',
    icon: BookOpen,
    permission: 'can_manage_courses',
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

export default function AdminNav({ role, permissions, mobileOnly, desktopOnly }: AdminNavProps) {
  const pathname = usePathname()

  // Filter items based on permissions
  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (item.requireExactRole && role !== item.requireExactRole) {
      return false
    }

    if (!item.permission) return true

    if (item.permission === 'can_scan_tickets') {
      return permissions.can_scan_tickets || permissions.can_manage_events
    }

    return permissions[item.permission as keyof AdminPermissions]
  })

  const getShortName = (name: string) => {
    if (name === 'Overview') return 'Overview'
    if (name === 'Deed Approvals') return 'Deeds'
    if (name === 'Events & Scanning') return 'Events'
    if (name === 'User Directory') return 'Users'
    if (name === 'Courses & LMS') return 'Courses'
    if (name === 'Settings & Rewards') return 'Settings'
    if (name === 'Announcements') return 'Alerts'
    if (name === 'Reward Shop') return 'Shop'
    return name
  }

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      {!mobileOnly && (
        <nav className="hidden lg:block flex-1 px-3 py-3 space-y-1.5 overflow-y-auto">
          <span className="text-[10px] text-zinc-500 font-bold tracking-wider px-3 uppercase block mb-2">
            Main Menu
          </span>
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group border-l-2 cursor-pointer ${
                  isActive
                    ? 'bg-red-50/80 text-[#DD0408] border-[#DD0408] font-semibold'
                    : 'border-transparent text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                <Icon
                  size={18}
                  className={`transition-colors duration-200 ${
                    isActive
                      ? 'text-[#DD0408]'
                      : 'text-zinc-400 group-hover:text-zinc-700'
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      )}

      {/* Mobile Bottom Tab Navigation */}
      {!desktopOnly && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-zinc-200 z-40 flex items-center justify-around px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] pb-safe">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 relative select-none cursor-pointer ${
                  isActive ? 'text-[#DD0408]' : 'text-zinc-400 hover:text-zinc-600'
                }`}
                title={item.name}
              >
                <Icon
                  size={20}
                  className={`transition-transform duration-200 ${
                    isActive ? 'scale-110 text-[#DD0408]' : 'text-zinc-400'
                  }`}
                />
                <span className="text-[9px] font-bold mt-1 tracking-tight truncate max-w-[56px] block">
                  {getShortName(item.name)}
                </span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] bg-[#DD0408] rounded-b-full animate-fadeIn" />
                )}
              </Link>
            )
          })}
        </nav>
      )}
    </>
  )
}
