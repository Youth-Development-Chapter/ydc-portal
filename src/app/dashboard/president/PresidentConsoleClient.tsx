'use client'

import React, { useState, useTransition } from 'react'
import { CheckSquare, Calendar, Settings, QrCode, Megaphone, Users, Pin, X, Loader2 } from 'lucide-react'
import PresidentApprovalsManager from '@/components/dashboard/PresidentApprovalsManager'
import PresidentEventsManager from '@/components/dashboard/PresidentEventsManager'
import UserDirectory from '@/components/admin/UserDirectory'
import QrScannerWidget from '@/components/admin/QrScannerWidget'
import PageHeader from '@/components/ui/PageHeader'
import { createAnnouncement, deleteAnnouncement, togglePinAnnouncement } from '@/app/admin/announcements/actions'
import { checkInTicket } from '@/app/admin/actions'
import { toast } from 'sonner'

interface MappedSubmission {
  id: string
  user_id: string
  description: string
  proof_url: string
  created_at: string
  profiles: {
    full_name: string
    unit_name: string
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
  unit_id?: string | null
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
    unit_name: string
    qualification: string
  }
}

interface Announcement {
  id: string
  title: string
  content: string
  is_pinned: boolean
  created_at: string
}

type ActiveTab = 'approvals' | 'events' | 'scanner' | 'announcements' | 'users'

export default function PresidentConsoleClient({
  submissions,
  events,
  registrations,
  adminRole,
  adminDivision,
  adminUnitId,
  adminId,
  users,
  units,
  initialPage,
  totalPages,
  searchTerm,
  permissions,
  announcements: initialAnnouncements = [],
}: {
  submissions: MappedSubmission[]
  events: EventItem[]
  registrations: Registration[]
  adminRole: string
  adminDivision?: string | null  // legacy compat
  adminUnitId?: string | null
  adminId: string
  users: any[]
  units: { id: string; name: string }[]
  initialPage: number
  totalPages: number
  searchTerm: string
  permissions: any
  announcements?: Announcement[]
}) {
  // Resolve the actual unit ID (support both prop names for backward compat)
  const resolvedUnitId = adminUnitId || adminDivision || null

  const [activeTab, setActiveTab] = useState<ActiveTab>('approvals')
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements)

  // Scanner states
  const [scanEventId, setScanEventId] = useState<string>(events.length > 0 ? events[0].id : '')
  const [ticketInput, setTicketInput] = useState('')
  const [isScanning, setIsScanning] = useState(false)

  // Announcements states
  const [annTitle, setAnnTitle] = useState('')
  const [annContent, setAnnContent] = useState('')
  const [annPinned, setAnnPinned] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Handle ticket check-in
  const handleTicketScan = async (code?: string) => {
    const input = (code || ticketInput).trim()
    if (!input || !scanEventId) return
    setIsScanning(true)
    try {
      const res = await checkInTicket(input, scanEventId)
      if (res?.error) {
        if (res.alreadyScanned) {
          toast.warning('Already Checked In', { description: `Ticket was already scanned for ${res.userName}.` })
        } else {
          toast.error(res.error)
        }
      } else {
        toast.success('Check-In Complete!', { description: `${res.userName} · +${res.coinsAwarded} Coins` })
        setTicketInput('')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error occurred during check-in.')
    } finally {
      setIsScanning(false)
    }
  }

  // Handle new announcement
  const handleCreateAnnouncement = () => {
    if (!annTitle.trim() || !annContent.trim()) { toast.error('Title and content are required.'); return }
    startTransition(async () => {
      const res = await createAnnouncement({
        title: annTitle.trim(),
        content: annContent.trim(),
        is_pinned: annPinned,
        unit_id: resolvedUnitId,
      })
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Announcement posted!')
        setAnnTitle('')
        setAnnContent('')
        setAnnPinned(false)
        // Refresh by reload since we can't refetch easily from client
        window.location.reload()
      }
    })
  }

  // Handle delete announcement
  const handleDeleteAnnouncement = (id: string) => {
    startTransition(async () => {
      const res = await deleteAnnouncement(id)
      if (res?.error) { toast.error(res.error); return }
      setAnnouncements(prev => prev.filter(a => a.id !== id))
      toast.success('Announcement deleted.')
    })
  }

  // Handle pin toggle
  const handleTogglePin = (id: string, current: boolean) => {
    startTransition(async () => {
      const res = await togglePinAnnouncement(id, !current)
      if (res?.error) { toast.error(res.error); return }
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_pinned: !current } : a))
    })
  }

  const tabConfig: { id: ActiveTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'approvals', label: 'Approvals', icon: <CheckSquare size={15} />, count: submissions.length },
    { id: 'events', label: 'Events', icon: <Calendar size={15} />, count: events.length },
    ...(permissions?.can_scan_tickets ? [{ id: 'scanner' as ActiveTab, label: 'Scanner', icon: <QrCode size={15} /> }] : []),
    { id: 'announcements', label: 'Announce', icon: <Megaphone size={15} /> },
    { id: 'users', label: 'Users', icon: <Users size={15} /> },
  ]

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1D1D1D] pb-24 relative overflow-hidden">
      <div className="fluid-top-gradient" />

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
        <div className="bg-white border border-zinc-200/80 p-1.5 rounded-2xl flex gap-1 shadow-sm overflow-x-auto">
          {tabConfig.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-extrabold rounded-xl transition duration-200 cursor-pointer whitespace-nowrap min-w-0 px-2 ${
                activeTab === tab.id
                  ? 'bg-zinc-950 text-white shadow-md'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {tab.icon}
              <span className="truncate">{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[9px] font-black rounded-full px-1.5 py-0.5 leading-none ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in duration-300">
          {activeTab === 'approvals' && (
            <PresidentApprovalsManager initialSubmissions={submissions} />
          )}

          {activeTab === 'events' && (
            <PresidentEventsManager 
              initialEvents={events} 
              initialRegistrations={registrations}
              adminRole={adminRole}
              adminDivision={resolvedUnitId}
            />
          )}

          {activeTab === 'scanner' && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200 space-y-5">
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-zinc-900 flex items-center gap-2">
                  <QrCode size={16} className="text-[#0A9EDE]" />
                  Ticket Scanner
                </h3>
                <p className="text-xs text-zinc-500">Scan a volunteer's QR code or enter their ID to check them in.</p>
              </div>

              {/* Event selector */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">Event</label>
                <select
                  value={scanEventId}
                  onChange={(e) => setScanEventId(e.target.value)}
                  className="w-full text-sm p-3 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-900 bg-white"
                >
                  <option value="">Select an Event…</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({new Date(ev.date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Camera scanner */}
              <QrScannerWidget
                onScan={(value) => {
                  setTicketInput(value)
                  if (value.trim() && scanEventId) {
                    setTimeout(() => handleTicketScan(value), 300)
                  }
                }}
                label="Scan QR Code"
              />

              {/* Manual entry */}
              <div className="border-t border-zinc-100 pt-4 space-y-3">
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">Or Enter Manually</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-center uppercase focus:outline-none focus:border-[#0A9EDE]"
                    placeholder="User ID or Member ID"
                    value={ticketInput}
                    onChange={(e) => setTicketInput(e.target.value)}
                    disabled={isScanning}
                  />
                  <button
                    onClick={() => handleTicketScan()}
                    disabled={isScanning || !ticketInput.trim() || !scanEventId}
                    className="px-4 py-2.5 bg-[#0BA242] text-white text-sm font-bold rounded-xl disabled:opacity-50 hover:bg-[#098C39] transition-colors"
                  >
                    {isScanning ? <Loader2 size={16} className="animate-spin" /> : 'Check In'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="space-y-4">
              {/* Create new announcement */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200 space-y-4">
                <h3 className="font-extrabold text-sm text-zinc-900 flex items-center gap-2">
                  <Megaphone size={16} className="text-[#0A9EDE]" />
                  New Announcement
                </h3>
                <input
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A9EDE]"
                  placeholder="Title"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                />
                <textarea
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm min-h-[80px] focus:outline-none focus:border-[#0A9EDE]"
                  placeholder="Content…"
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={annPinned}
                      onChange={(e) => setAnnPinned(e.target.checked)}
                      className="accent-[#0A9EDE]"
                    />
                    Pin this announcement
                  </label>
                  <button
                    onClick={handleCreateAnnouncement}
                    disabled={isPending || !annTitle.trim() || !annContent.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-sm font-semibold disabled:opacity-50 hover:bg-black transition-colors"
                  >
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                    Post
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400">This announcement will be visible to all members of your unit.</p>
              </div>

              {/* Existing announcements */}
              <div className="space-y-3">
                {announcements.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center text-zinc-400 text-sm border border-dashed border-zinc-200">
                    No announcements yet. Create one above.
                  </div>
                ) : announcements.map(ann => (
                  <div key={ann.id} className={`bg-white border rounded-2xl p-4 shadow-sm space-y-2 ${ann.is_pinned ? 'border-[#0A9EDE]/30' : 'border-zinc-200'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-zinc-900 line-clamp-1">{ann.title}</h4>
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{ann.content}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleTogglePin(ann.id, ann.is_pinned)}
                          disabled={isPending}
                          className={`p-1.5 rounded-lg transition-colors ${ann.is_pinned ? 'text-[#0A9EDE] bg-[#0A9EDE]/10' : 'text-zinc-400 hover:text-zinc-600'}`}
                          title={ann.is_pinned ? 'Unpin' : 'Pin'}
                        >
                          <Pin size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-semibold">
                      {new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-zinc-200">
              <UserDirectory 
                initialUsers={users}
                activeAdminId={adminId}
                activeAdminRole={adminRole}
                adminUnitId={resolvedUnitId || undefined}
                allUnits={units}
              />
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
