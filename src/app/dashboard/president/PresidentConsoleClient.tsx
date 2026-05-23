'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { CheckSquare, Calendar, Settings } from 'lucide-react'
import PresidentApprovalsManager from '@/components/dashboard/PresidentApprovalsManager'
import PresidentEventsManager from '@/components/dashboard/PresidentEventsManager'
import PageHeader from '@/components/ui/PageHeader'

interface MappedSubmission {
  id: string
  user_id: string
  description: string
  proof_url: string
  created_at: string
  profiles: {
    full_name: string
    division: string
    qualification: string
    id: string
  }
  streak: number
}

interface EventItem {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  capacity: number
  coin_reward?: number
  division?: string | null
}

interface Registration {
  id: string
  event_id: string
  user_id: string
  ticket_code: string
  attended: boolean
  attended_at: string | null
  created_at: string
  profiles: {
    full_name: string
    division: string
    qualification: string
  }
}

export default function PresidentConsoleClient({
  submissions,
  events,
  registrations,
  adminRole,
  adminDivision,
}: {
  submissions: MappedSubmission[]
  events: EventItem[]
  registrations: Registration[]
  adminRole: string
  adminDivision?: string | null
}) {
  const [activeTab, setActiveTab] = useState<'approvals' | 'events'>('approvals')

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1D1D1D] pb-24 relative overflow-hidden">
      {/* Top Gradient */}
      <div className="fluid-top-gradient"></div>

      <main className="max-w-lg mx-auto w-full px-4 py-6 space-y-6 relative z-10">
        
        {/* Header */}
        <PageHeader
          title="President Console"
          backHref="/dashboard"
          rightElement={
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#E5E5E5] shadow-sm">
              <Settings size={18} className="text-red-600 animate-spin-slow" />
            </div>
          }
        />

        {/* Tab Buttons */}
        <div className="bg-white border border-zinc-200/80 p-1.5 rounded-2xl flex shadow-sm">
          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-extrabold rounded-xl transition duration-200 cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-zinc-950 text-white shadow-md'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <CheckSquare size={16} />
            Approvals ({submissions.length})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-extrabold rounded-xl transition duration-200 cursor-pointer ${
              activeTab === 'events'
                ? 'bg-zinc-950 text-white shadow-md'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Calendar size={16} />
            Events ({events.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in duration-300">
          {activeTab === 'approvals' ? (
            <PresidentApprovalsManager initialSubmissions={submissions} />
          ) : (
            <PresidentEventsManager 
              initialEvents={events} 
              initialRegistrations={registrations}
              adminRole={adminRole}
              adminDivision={adminDivision}
            />
          )}
        </div>

      </main>
    </div>
  )
}
