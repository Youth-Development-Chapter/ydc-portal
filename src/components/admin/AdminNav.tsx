'use client'

import React, { useState } from 'react'
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
  ChevronDown,
  ChevronRight,
  MapPin,
  MessageSquare,
} from 'lucide-react'

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

interface NavSection {
  title: string
  id: string
  items: NavItem[]
}

const SECTIONS: NavSection[] = [
  {
    title: 'Academy & LMS',
    id: 'lms',
    items: [
      {
        name: 'Courses & LMS',
        href: '/admin/courses',
        icon: BookOpen,
        permission: 'can_manage_courses',
      },
    ],
  },
  {
    title: 'Operations',
    id: 'operations',
    items: [
      {
        name: 'Streaks Approval',
        href: '/admin/approvals',
        icon: CheckSquare,
        permission: 'can_approve_deeds',
      },
      {
        name: 'Events & Scanning',
        href: '/admin/events',
        icon: Calendar,
        permission: 'can_scan_tickets', // Checked specially
      },
      {
        name: 'User Directory',
        href: '/admin/users',
        icon: Users,
        permission: 'can_manage_admins',
      },
    ],
  },
  {
    title: 'System Settings',
    id: 'settings',
    items: [
      {
        name: 'Global Settings',
        href: '/admin/settings',
        icon: Settings,
        permission: 'can_manage_settings',
      },
      {
        name: 'Unit Management',
        href: '/admin/units',
        icon: MapPin,
        permission: 'can_manage_settings',
      },
      {
        name: 'Notifications',
        href: '/admin/notifications',
        icon: Megaphone,
        permission: 'can_manage_settings',
      },
      {
        name: 'Reward Shop',
        href: '/admin/rewards',
        icon: Gift,
        permission: 'can_manage_settings',
      },
      {
        name: 'WhatsApp Agent',
        href: '/admin/whatsapp',
        icon: MessageSquare,
        permission: 'can_manage_settings',
      },
    ],
  },
]

// Root/flat items that show up above the sections
const ROOT_ITEMS: NavItem[] = [
  {
    name: 'Overview',
    href: '/admin',
    icon: LayoutDashboard,
    permission: null,
    exact: true,
  },
]

export default function AdminNav({ role, permissions, mobileOnly, desktopOnly }: AdminNavProps) {
  const pathname = usePathname()
  
  // Section toggle state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    lms: true,
    operations: true,
    settings: false,
  })

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Helper to check item permission
  const hasItemPermission = (item: NavItem) => {
    if (item.requireExactRole && role !== item.requireExactRole) {
      return false
    }
    if (!item.permission) return true

    if (item.permission === 'can_scan_tickets') {
      return permissions.can_scan_tickets || permissions.can_manage_events
    }

    return permissions[item.permission as keyof AdminPermissions]
  }

  // Filter root items
  const filteredRootItems = ROOT_ITEMS.filter(hasItemPermission)

  // Filter sections and their items
  const filteredSections = SECTIONS.map((sec) => ({
    ...sec,
    items: sec.items.filter(hasItemPermission),
  })).filter((sec) => sec.items.length > 0)

  // Flat list of all accessible items for mobile layout
  const flatMobileItems = [
    ...ROOT_ITEMS.filter(hasItemPermission),
    ...SECTIONS.flatMap((sec) => sec.items).filter(hasItemPermission),
  ]

  const getShortName = (name: string) => {
    if (name === 'Overview') return 'Overview'
    if (name === 'Streaks Approval') return 'Streaks'
    if (name === 'Events & Scanning') return 'Events'
    if (name === 'User Directory') return 'Users'
    if (name === 'Courses & LMS') return 'Courses'
    if (name === 'Global Settings') return 'Settings'
    if (name === 'Unit Management') return 'Units'
    if (name === 'Notifications') return 'Alerts'
    if (name === 'Reward Shop') return 'Shop'
    return name
  }

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      {!mobileOnly && (
        <nav className="hidden lg:block flex-1 px-3 py-3 space-y-4 overflow-y-auto">
          {/* Root Items */}
          <div className="space-y-1">
            {filteredRootItems.map((item) => {
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
                      isActive ? 'text-[#DD0408]' : 'text-zinc-400 group-hover:text-zinc-700'
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Section Categories */}
          {filteredSections.map((sec) => {
            const isOpen = openSections[sec.id] ?? false
            return (
              <div key={sec.id} className="space-y-1">
                {/* Section Header (Toggle Button) */}
                <button
                  onClick={() => toggleSection(sec.id)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] text-zinc-400 font-bold tracking-wider uppercase hover:text-zinc-600 transition-colors cursor-pointer select-none"
                >
                  <span>{sec.title}</span>
                  {isOpen ? <ChevronDown size={12} className="text-zinc-400" /> : <ChevronRight size={12} className="text-zinc-400" />}
                </button>

                {/* Section Items */}
                {isOpen && (
                  <div className="space-y-1 pl-1 border-l border-zinc-100 ml-3.5 animate-in fade-in duration-200">
                    {sec.items.map((item) => {
                      const Icon = item.icon
                      const isActive = item.exact
                        ? pathname === item.href
                        : pathname.startsWith(item.href)

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 group border-l-2 cursor-pointer ${
                            isActive
                              ? 'bg-zinc-50 text-zinc-950 border-zinc-900 font-semibold shadow-sm'
                              : 'border-transparent text-zinc-500 hover:bg-zinc-50/50 hover:text-zinc-900'
                          }`}
                        >
                          <Icon
                            size={16}
                            className={`transition-colors duration-200 ${
                              isActive ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-600'
                            }`}
                          />
                          <span>{item.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      )}

      {/* Mobile Bottom Tab Navigation (Max 5 items to prevent crowding) */}
      {!desktopOnly && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-zinc-200 z-40 flex items-center justify-around px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] pb-safe">
          {flatMobileItems.slice(0, 5).map((item) => {
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
