'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CheckSquare, Calendar, QrCode, Megaphone, Users } from 'lucide-react'

interface PresidentNavProps {
  permissions: any
}

export default function PresidentNav({ permissions }: PresidentNavProps) {
  const pathname = usePathname()

  const tabs = [
    { id: 'approvals', label: 'Approvals', href: '/dashboard/president/approvals', icon: <CheckSquare size={16} /> },
    { id: 'events', label: 'Events', href: '/dashboard/president/events', icon: <Calendar size={16} /> },
    ...(permissions?.can_scan_tickets || permissions?.can_manage_events ? [{ id: 'scanner', label: 'Scanner', href: '/dashboard/president/scanner', icon: <QrCode size={16} /> }] : []),
    { id: 'notifications', label: 'Notifications', href: '/dashboard/president/notifications', icon: <Megaphone size={16} /> },
    { id: 'users', label: 'Users', href: '/dashboard/president/users', icon: <Users size={16} /> },
  ]

  return (
    <div className="bg-white border border-zinc-200/80 p-1.5 rounded-2xl flex gap-1 shadow-sm overflow-x-auto w-full max-w-full hide-scrollbar">
      {tabs.map(tab => {
        const isActive = pathname.startsWith(tab.href)
        
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-xl transition duration-200 whitespace-nowrap ${
              isActive
                ? 'bg-zinc-950 text-white shadow-md'
                : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'
            }`}
          >
            {tab.icon}
            <span className="truncate">{tab.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
