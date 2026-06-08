'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Calendar, MapPin, Clock, Search, Check, Plus, Coins, Edit2, X } from 'lucide-react'
import { toggleManualAttendance, checkInTicket, processEventLeave, updateEvent } from '@/app/admin/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Registration {
  id: string
  event_id: string
  user_id: string
  ticket_code: string
  attended: boolean
  attended_at: string | null
  status: string
  leave_note: string | null
  created_at: string
  profiles: {
    full_name: string
    unit_name: string
    qualification: string
  }
}

interface UnitMember {
  id: string
  full_name: string
  unit_id: string | null
  qualification: string
  unit_name: string
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
  is_compulsory?: boolean
  custom_criteria?: any
}

interface RosterEntry {
  id: string
  user_id: string
  full_name: string
  unit_name: string
  qualification: string
  attended: boolean
  ticket_code: string | null
  status: string
  leave_note: string | null
  registration_id: string | null
  is_synthetic: boolean
}

export default function EventDetailsClient({
  event,
  initialRegistrations,
  unitMembers,
  permissions,
  backUrl,
}: {
  event: EventItem
  initialRegistrations: Registration[]
  unitMembers: UnitMember[]
  permissions: {
    can_manage_events: boolean
  }
  rankTiers: { name: string; threshold: number }[]
  backUrl: string
}) {
  const router = useRouter()
  const [registrations, setRegistrations] = useState<Registration[]>(initialRegistrations)
  const [isTogglingAttendance, setIsTogglingAttendance] = useState<string | null>(null)
  const [isProcessingLeave, setIsProcessingLeave] = useState<string | null>(null)
  
  // Edit Event States
  const [showEditModal, setShowEditModal] = useState(false)
  const [editTitle, setEditTitle] = useState(event.title)
  const [editDescription, setEditDescription] = useState(event.description || '')
  const [editDate, setEditDate] = useState(event.date)
  const [editTime, setEditTime] = useState(event.time)
  const [editLocation, setEditLocation] = useState(event.location)
  const [editCapacity, setEditCapacity] = useState(String(event.capacity || 100))
  const [editCoinReward, setEditCoinReward] = useState(String(event.coin_reward ?? 50))
  const [editIsCompulsory, setEditIsCompulsory] = useState(!!event.is_compulsory)
  const [isUpdating, setIsUpdating] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, checked_in, pending_leave

  const roster: RosterEntry[] = useMemo(() => {
    if (event.is_compulsory) {
      const leaveStatuses = new Set(['leave_pending', 'leave_approved'])
      const scopedMembers = unitMembers.filter((member) => {
        if (!event.unit_id) return true
        return member.unit_id === event.unit_id
      })
      const leaveApplicants = new Set(
        registrations
          .filter((reg) => leaveStatuses.has(reg.status))
          .map((reg) => reg.user_id)
      )
      const registrationByUser = new Map(registrations.map((reg) => [reg.user_id, reg]))

      return scopedMembers
        .filter((member) => !leaveApplicants.has(member.id))
        .map((member) => {
          const registration = registrationByUser.get(member.id)
          return {
            id: registration?.id || member.id,
            user_id: member.id,
            full_name: member.full_name,
            unit_name: member.unit_name,
            qualification: member.qualification,
            attended: registration?.attended || false,
            ticket_code: registration?.ticket_code || null,
            status: registration?.status || 'expected',
            leave_note: registration?.leave_note || null,
            registration_id: registration?.id || null,
            is_synthetic: !registration,
          }
        })
    } else {
      return registrations.map((reg) => ({
        id: reg.id,
        user_id: reg.user_id,
        full_name: reg.profiles.full_name,
        unit_name: reg.profiles.unit_name,
        qualification: reg.profiles.qualification,
        attended: reg.attended,
        ticket_code: reg.ticket_code,
        status: reg.status,
        leave_note: reg.leave_note,
        registration_id: reg.id,
        is_synthetic: false,
      }))
    }
  }, [event, registrations, unitMembers])

  const filteredRoster = useMemo(() => {
    return roster.filter(r => {
      const matchesSearch = r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (r.ticket_code && r.ticket_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            r.unit_name.toLowerCase().includes(searchQuery.toLowerCase())
                            
      let matchesStatus = true
      if (statusFilter === 'checked_in') matchesStatus = r.attended
      if (statusFilter === 'absent') matchesStatus = !r.attended && !r.is_synthetic
      if (statusFilter === 'pending_leave') matchesStatus = r.status === 'leave_pending'
      
      return matchesSearch && matchesStatus
    }).sort((a, b) => {
      if (a.status === 'leave_pending' && b.status !== 'leave_pending') return -1
      if (b.status === 'leave_pending' && a.status !== 'leave_pending') return 1
      return a.full_name.localeCompare(b.full_name)
    })
  }, [roster, searchQuery, statusFilter])

  const handleProcessLeave = async (regId: string, action: 'approve' | 'reject') => {
    setIsProcessingLeave(regId)
    try {
      const res = await processEventLeave(regId, action)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(`Leave ${action}d.`)
        setRegistrations(prev =>
          prev.map(reg => reg.id === regId ? { ...reg, status: action === 'approve' ? 'leave_approved' : 'leave_rejected' } : reg)
        )
      }
    } catch (err: any) {
      toast.error(err.message || 'Error processing leave')
    } finally {
      setIsProcessingLeave(null)
    }
  }

  const handleToggleAttendance = async (regId: string, currentStatus: boolean) => {
    setIsTogglingAttendance(regId)

    try {
      const res = await toggleManualAttendance(regId, !currentStatus)
      if (res?.error) {
        toast.error(res.error)
      } else {
        const reg = registrations.find(r => r.id === regId)
        const attendeeName = reg?.profiles.full_name || 'Attendee'
        
        toast.success(!currentStatus ? `${attendeeName} checked in successfully!` : `${attendeeName} checked out successfully!`)

        setRegistrations(prev =>
          prev.map(reg =>
            reg.id === regId ? { ...reg, attended: !currentStatus, attended_at: !currentStatus ? new Date().toISOString() : null } : reg
          )
        )
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error occurred.')
    } finally {
      setIsTogglingAttendance(null)
    }
  }

  const handleRosterCheckIn = async (userId: string) => {
    setIsTogglingAttendance(userId)
    try {
      const res = await checkInTicket(userId, event.id)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Check-in confirmed!')
        router.refresh()
        // Delay to allow server to re-fetch and pass new initialRegistrations
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setIsTogglingAttendance(null)
    }
  }

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)

    try {
      const capacityVal = parseInt(editCapacity, 10) || 100
      const coinRewardVal = parseInt(editCoinReward, 10) || 50
      
      const res = await updateEvent(
        event.id,
        editTitle,
        editDescription,
        editDate,
        editTime,
        editLocation,
        capacityVal,
        coinRewardVal,
        event.unit_id,
        null,
        editIsCompulsory
      )

      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Event updated successfully!')
        setShowEditModal(false)
        router.refresh()
        setTimeout(() => window.location.reload(), 800)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setIsUpdating(false)
    }
  }

  const checkedInCount = registrations.filter(r => r.attended).length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push(backUrl)}
          leftIcon={<ArrowLeft size={16} />}
        >
          Back to Events
        </Button>
        <h1 className="text-xl font-bold text-zinc-900">Event Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Event Summary */}
        <Card className="lg:col-span-1 shadow-sm border border-zinc-200">
          <CardHeader className="pb-4 border-b border-zinc-100 bg-zinc-50 rounded-t-xl">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {event.is_compulsory && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-bold uppercase tracking-wider border border-red-100">
                      Compulsory
                    </span>
                  )}
                  {permissions.can_manage_events && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-6 text-[10px] px-2 py-0 border-zinc-200 bg-white"
                      onClick={() => setShowEditModal(true)}
                    >
                      <Edit2 size={12} className="mr-1" /> Edit
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full w-fit ml-auto">
                  <Coins size={12} className="text-yellow-600" />
                  <span className="font-extrabold text-[10px] text-yellow-700 font-mono">{event.coin_reward ?? 50} Coins</span>
                </div>
              </div>
              <CardTitle className="text-lg leading-tight font-extrabold">{event.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <p className="text-sm text-zinc-600 leading-relaxed">{event.description}</p>
            
            <div className="space-y-3 pt-4 border-t border-zinc-100">
              <div className="flex items-center gap-3 text-sm text-zinc-700">
                <Calendar size={16} className="text-[#0A9EDE]" />
                <span className="font-semibold">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-700">
                <Clock size={16} className="text-[#0A9EDE]" />
                <span className="font-semibold">{event.time}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-700">
                <MapPin size={16} className="text-[#0A9EDE]" />
                <span className="font-semibold">{event.location}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 grid grid-cols-2 gap-4">
              <div className="p-3 bg-zinc-50 border border-zinc-150 rounded-xl text-center">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Registered</span>
                <span className="font-extrabold text-lg text-zinc-900">{registrations.length} <span className="text-sm text-zinc-400 font-medium">/ {event.capacity}</span></span>
              </div>
              <div className="p-3 bg-green-50 border border-green-150 rounded-xl text-center">
                <span className="text-[10px] text-green-600/70 font-bold uppercase tracking-wider block mb-1">Checked In</span>
                <span className="font-extrabold text-lg text-green-700">{checkedInCount}</span>
              </div>
            </div>

            {event.custom_criteria && Object.keys(event.custom_criteria).length > 0 && (
              <div className="pt-4 border-t border-zinc-100">
                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Custom Criteria</h4>
                <div className="flex flex-wrap gap-2">
                  {event.custom_criteria.min_age !== undefined && (
                    <span className="text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-700 font-medium">Age &ge; {event.custom_criteria.min_age}</span>
                  )}
                  {event.custom_criteria.min_streak !== undefined && (
                    <span className="text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-700 font-medium">Streak &ge; {event.custom_criteria.min_streak}</span>
                  )}
                  {event.custom_criteria.required_rank && event.custom_criteria.required_rank !== 'none' && (
                    <span className="text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-700 font-medium">Rank: {event.custom_criteria.required_rank}</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Attendees Roster */}
        <Card className="lg:col-span-2 shadow-sm border border-zinc-200">
          <CardHeader className="pb-4 border-b border-zinc-100 bg-zinc-50 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-t-xl">
            <div>
              <CardTitle className="text-sm font-extrabold text-zinc-900">Attendance Roster</CardTitle>
              <p className="text-[11px] text-zinc-500 mt-0.5">Manage check-ins and review leaves.</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={14} className="text-zinc-400" />
                </div>
                <Input 
                  placeholder="Search name, code, unit..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs border-zinc-200 focus:border-[#0A9EDE]"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 text-xs px-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-[#0A9EDE] bg-white"
              >
                <option value="all">All Status</option>
                <option value="checked_in">Checked In</option>
                <option value="absent">Absent</option>
                <option value="pending_leave">Pending Leaves</option>
              </select>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-150">
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Volunteer</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Unit</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredRoster.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-zinc-400 text-sm">
                      {searchQuery ? 'No volunteers match your search.' : 'No volunteers found for this event.'}
                    </td>
                  </tr>
                ) : (
                  filteredRoster.map(reg => {
                    const isToggling = isTogglingAttendance === reg.id || isTogglingAttendance === reg.user_id
                    return (
                      <tr key={reg.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-zinc-900 text-sm">{reg.full_name}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {reg.ticket_code ? reg.ticket_code : 'No Ticket Code'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-zinc-600 font-medium">
                          {reg.unit_name}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-1">
                            {reg.status === 'leave_pending' && (
                              <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-800">
                                Leave Pending
                              </span>
                            )}
                            {reg.status === 'leave_approved' && (
                              <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">
                                Leave Approved
                              </span>
                            )}
                            {reg.status === 'leave_rejected' && (
                              <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                                Leave Rejected
                              </span>
                            )}
                            {reg.attended && (
                              <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#0BA242]/10 text-[#0BA242]">
                                Checked In
                              </span>
                            )}
                            {!reg.attended && reg.status !== 'leave_pending' && reg.status !== 'leave_approved' && (
                              <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-500">
                                {reg.is_synthetic ? 'Expected' : 'Absent'}
                              </span>
                            )}
                            
                            {reg.status === 'leave_pending' && reg.leave_note && (
                              <div className="text-[10px] text-zinc-500 bg-white border border-yellow-200 p-2 rounded mt-1 max-w-xs">
                                <strong>Note:</strong> {reg.leave_note}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {reg.status === 'leave_pending' && permissions.can_manage_events && (
                              <div className="flex items-center gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 px-2 text-[10px] bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800" 
                                  onClick={() => handleProcessLeave(reg.registration_id || reg.id, 'approve')} 
                                  isLoading={isProcessingLeave === (reg.registration_id || reg.id)}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 px-2 text-[10px] bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800" 
                                  onClick={() => handleProcessLeave(reg.registration_id || reg.id, 'reject')} 
                                  isLoading={isProcessingLeave === (reg.registration_id || reg.id)}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}

                            {permissions.can_manage_events && (
                              reg.registration_id ? (
                                <Button
                                  onClick={() => handleToggleAttendance(reg.registration_id as string, reg.attended)}
                                  variant={reg.attended ? 'primary' : 'outline'}
                                  size="sm"
                                  className={`h-8 text-xs px-3 rounded-lg font-bold transition-all w-24 flex justify-center items-center group ${
                                    reg.attended
                                      ? 'bg-[#0BA242] hover:bg-[#DD0408] border-[#0BA242] hover:border-[#DD0408] text-white'
                                      : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                                  }`}
                                  isLoading={isToggling}
                                >
                                  {!isToggling && (
                                    <>
                                      {reg.attended ? (
                                        <>
                                          <Check size={12} className="mr-1 group-hover:hidden" />
                                          <span className="group-hover:hidden">Checked In</span>
                                          <span className="hidden group-hover:inline">Check Out</span>
                                        </>
                                      ) : (
                                        <>
                                          <Plus size={12} className="mr-1" />
                                          <span>Check In</span>
                                        </>
                                      )}
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => handleRosterCheckIn(reg.user_id)}
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs px-3 rounded-lg font-bold transition-all w-24 border-zinc-200 text-zinc-700 hover:bg-zinc-50 flex justify-center items-center"
                                  isLoading={isToggling}
                                >
                                  {!isToggling && (
                                    <>
                                      <Plus size={12} className="mr-1" />
                                      <span>Check In</span>
                                    </>
                                  )}
                                </Button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* EDIT EVENT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-zinc-200 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-zinc-150 flex justify-between items-center bg-zinc-50">
              <h3 className="font-extrabold text-sm text-zinc-900 flex items-center gap-1.5">
                <Edit2 size={15} className="text-[#0A9EDE]" />
                Edit Event
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditEvent} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Event Title</label>
                <Input 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:border-[#0A9EDE]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Date</label>
                  <Input 
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Time</label>
                  <Input 
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Location / Venue</label>
                <Input 
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Capacity</label>
                  <Input 
                    type="number"
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Coin Reward</label>
                  <Input 
                    type="number"
                    value={editCoinReward}
                    onChange={(e) => setEditCoinReward(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="editIsCompulsory"
                  checked={editIsCompulsory}
                  onChange={(e) => setEditIsCompulsory(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0A9EDE] border-zinc-300 focus:ring-[#0A9EDE] cursor-pointer"
                />
                <label htmlFor="editIsCompulsory" className="text-xs font-semibold text-zinc-700 cursor-pointer select-none">
                  Make this event Compulsory
                </label>
              </div>

              <div className="px-5 py-3 border-t border-zinc-150 bg-zinc-50 -mx-5 -mb-5 flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  onClick={() => setShowEditModal(false)} 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isUpdating}
                  isLoading={isUpdating}
                  className="h-8 text-xs bg-zinc-900 border-zinc-900 text-white"
                  size="sm"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
