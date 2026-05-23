'use client'

import React, { useState } from 'react'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Plus, 
  Check, 
  X, 
  UserCheck, 
  ClipboardList,
  Edit2,
  Clock,
  Coins,
  ScanLine
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { checkInTicket, createEvent, toggleManualAttendance, updateEvent } from '@/app/admin/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const QRScannerModal = dynamic(() => import('@/components/dashboard/QRScannerModal'), { ssr: false })

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

export default function PresidentEventsManager({
  initialEvents,
  initialRegistrations,
  adminRole,
  adminDivision,
}: {
  initialEvents: EventItem[]
  initialRegistrations: Registration[]
  adminRole: string
  adminDivision?: string | null
}) {
  const router = useRouter()
  const [events, setEvents] = useState<EventItem[]>(initialEvents)
  const [registrations, setRegistrations] = useState<Registration[]>(initialRegistrations)

  // Scanner/Check-In States
  const [ticketInput, setTicketInput] = useState('')
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [showCameraScanner, setShowCameraScanner] = useState(false)
  const [scanEventId, setScanEventId] = useState<string>(
    initialEvents.length > 0 ? initialEvents[0].id : ''
  )

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [showAttendeesModal, setShowAttendeesModal] = useState(false)

  // Create Form fields
  const [createTitle, setCreateTitle] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createDate, setCreateDate] = useState('')
  const [createTime, setCreateTime] = useState('')
  const [createLocation, setCreateLocation] = useState('')
  const [createCapacity, setCreateCapacity] = useState('100')
  const [createCoinReward, setCreateCoinReward] = useState('50')
  const [isCreating, setIsCreating] = useState(false)

  // Edit Form fields
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editCapacity, setEditCapacity] = useState('100')
  const [editCoinReward, setEditCoinReward] = useState('50')
  const [isUpdating, setIsUpdating] = useState(false)

  // Attendees list state
  const [isTogglingAttendance, setIsTogglingAttendance] = useState<string | null>(null)

  const handleTicketCheckIn = async (e?: React.FormEvent, overrideCode?: string) => {
    if (e) e.preventDefault()
    const code = overrideCode || ticketInput
    if (!code.trim()) return

    setIsCheckingIn(true)
    try {
      const res = await checkInTicket(code.trim(), scanEventId || undefined)
      if (res?.error) {
        if (res.alreadyScanned) {
          toast.warning(`Already Checked In`, {
            description: `Ticket was already scanned for user ${res.userName}.`,
          })
        } else {
          toast.error(res.error)
        }
      } else {
        toast.success(`Check-In Complete!`, {
          description: `Attendee: ${res.userName} | +${res.coinsAwarded} Coins Credited`,
        })
        
        // Update local registrations list
        const cleanCode = code.trim()
        setRegistrations(prev =>
          prev.map(reg => {
            const matches = scanEventId
              ? (reg.user_id === cleanCode && reg.event_id === scanEventId)
              : reg.ticket_code === cleanCode
            return matches
              ? { ...reg, attended: true, attended_at: new Date().toISOString() }
              : reg
          })
        )
        setTicketInput('')
        router.refresh()
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred during ticket scan.')
    } finally {
      setIsCheckingIn(false)
    }
  }

  // Called by camera scanner on successful QR scan
  const handleCameraScan = async (code: string) => {
    setShowCameraScanner(false)
    await handleTicketCheckIn(undefined, code)
  }

  // Handle Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const capacityVal = parseInt(createCapacity, 10) || 100
      const coinRewardVal = parseInt(createCoinReward, 10) || 50
      const res = await createEvent(
        createTitle,
        createDescription,
        createDate,
        createTime,
        createLocation,
        capacityVal,
        coinRewardVal,
        adminDivision || null
      )

      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Event scheduled successfully!')
        setShowCreateModal(false)
        
        // Reset fields
        setCreateTitle('')
        setCreateDescription('')
        setCreateDate('')
        setCreateTime('')
        setCreateLocation('')
        setCreateCapacity('100')
        setCreateCoinReward('50')
        
        router.refresh()
        // Wait briefly and update state
        setTimeout(() => {
          window.location.reload()
        }, 800)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setIsCreating(false)
    }
  }

  // Open Edit Modal and prefill
  const openEditModal = (event: EventItem) => {
    setSelectedEvent(event)
    setEditTitle(event.title)
    setEditDescription(event.description || '')
    setEditDate(event.date)
    setEditTime(event.time)
    setEditLocation(event.location)
    setEditCapacity(String(event.capacity || 100))
    setEditCoinReward(String(event.coin_reward || 50))
    setShowEditModal(true)
  }

  // Handle Edit Event
  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEvent) return
    setIsUpdating(true)

    try {
      const capacityVal = parseInt(editCapacity, 10) || 100
      const coinRewardVal = parseInt(editCoinReward, 10) || 50
      const res = await updateEvent(
        selectedEvent.id,
        editTitle,
        editDescription,
        editDate,
        editTime,
        editLocation,
        capacityVal,
        coinRewardVal,
        selectedEvent.division
      )

      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Event updated successfully!')
        setShowEditModal(false)
        router.refresh()
        // Force state reload
        setTimeout(() => {
          window.location.reload()
        }, 800)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setIsUpdating(false)
    }
  }

  // Open Attendees list
  const openAttendeesList = (event: EventItem) => {
    setSelectedEvent(event)
    setShowAttendeesModal(true)
  }

  // Toggle Attendance Checkbox
  const handleToggleAttendance = async (regId: string, currentAttended: boolean) => {
    setIsTogglingAttendance(regId)
    const targetStatus = !currentAttended

    try {
      const res = await toggleManualAttendance(regId, targetStatus)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(targetStatus ? 'Check-in confirmed!' : 'Check-in revoked!')
        
        // Update local state
        setRegistrations(prev =>
          prev.map(reg =>
            reg.id === regId ? { ...reg, attended: targetStatus, attended_at: targetStatus ? new Date().toISOString() : null } : reg
          )
        )
        router.refresh()
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setIsTogglingAttendance(null)
    }
  }

  // Get registrations for selected event
  const selectedEventAttendees = registrations.filter(r => r.event_id === selectedEvent?.id)

  return (
    <div className="space-y-4">
      {/* Camera QR Scanner Modal */}
      {showCameraScanner && (
        <QRScannerModal
          onScan={handleCameraScan}
          onClose={() => setShowCameraScanner(false)}
        />
      )}

      {/* Search/Ticket scanning input */}
      <Card className="shadow-sm border border-zinc-150 bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Quick Ticket Check-In</label>
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-400 font-bold block">Select Checkpoint Event</span>
            <select
              value={scanEventId}
              onChange={(e) => setScanEventId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:border-zinc-900 bg-white mb-2"
              disabled={isCheckingIn}
              required
            >
              <option value="">Select an Event...</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({new Date(ev.date).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
          <form onSubmit={handleTicketCheckIn} className="flex gap-2">
            <Input 
              placeholder="Scan QR or type User UUID / Member ID"
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              className="h-9 text-xs flex-1"
            />
            <Button
              type="button"
              onClick={() => setShowCameraScanner(true)}
              variant="outline"
              className="h-9 text-xs px-3 border-zinc-200"
              title="Scan QR with Camera"
            >
              <ScanLine size={16} className="text-[#0A9EDE]" />
            </Button>
            <Button
              type="submit"
              disabled={isCheckingIn || !ticketInput.trim()}
              isLoading={isCheckingIn}
              className="h-9 text-xs px-4 bg-zinc-950 text-white"
            >
              Verify
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Header and Add Button */}
      <div className="flex items-center justify-between px-1 pt-2">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">Events Directory</h2>
          <p className="text-xs text-zinc-500">List and manage events for {adminDivision || 'your division'}.</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="h-9 text-xs px-3 bg-[#0A9EDE] hover:bg-[#088abf] border-[#0A9EDE] text-white"
          leftIcon={<Plus size={14} />}
        >
          Create
        </Button>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <Card className="border-dashed border-zinc-200 bg-white">
            <CardContent className="p-12 text-center text-zinc-400">
              <Calendar size={40} className="mx-auto mb-3 text-zinc-300 bg-zinc-50 p-2.5 rounded-full h-12 w-12" />
              <h3 className="font-bold text-zinc-700 text-sm mb-1">No Events Found</h3>
              <p className="text-xs">Schedule your first division event using the Create button.</p>
            </CardContent>
          </Card>
        ) : (
          events.map(event => {
            const count = registrations.filter(r => r.event_id === event.id).length
            return (
              <Card key={event.id} className="shadow-sm border border-zinc-150 bg-white rounded-2xl overflow-hidden">
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-sm text-zinc-950 leading-tight">{event.title}</h3>
                    <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full shrink-0">
                      <Coins size={11} className="text-yellow-600" />
                      <span className="font-extrabold text-[9px] text-yellow-700 font-mono">{event.coin_reward ?? 50} C</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {event.description || 'No description provided.'}
                  </p>

                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 pt-2 border-t border-zinc-50 text-[11px] text-zinc-500 font-semibold">
                    <div className="flex items-center gap-1">
                      <Calendar size={13} className="text-[#0BA242]" />
                      <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={13} className="text-[#DD0408]" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-1 col-span-2">
                      <MapPin size={13} className="text-[#0A9EDE]" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-1 col-span-2 text-zinc-600 bg-zinc-50 border border-zinc-150 px-2 py-1 rounded-lg w-fit mt-1">
                      <Users size={12} className="text-zinc-500" />
                      <span>Capacity: {count} / {event.capacity} registered</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-zinc-100">
                    <Button 
                      onClick={() => openAttendeesList(event)}
                      variant="outline"
                      className="flex-1 h-9 text-xs border-zinc-200 hover:bg-zinc-50"
                      leftIcon={<ClipboardList size={14} />}
                    >
                      Attendees
                    </Button>
                    <Button 
                      onClick={() => openEditModal(event)}
                      variant="outline"
                      className="h-9 text-xs border-zinc-200 hover:bg-zinc-50 px-3"
                      leftIcon={<Edit2 size={14} />}
                    />
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* CREATE EVENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-zinc-200 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-zinc-150 flex justify-between items-center bg-zinc-50">
              <h3 className="font-extrabold text-sm text-zinc-900 flex items-center gap-1.5">
                <Calendar size={16} className="text-[#0A9EDE]" />
                Schedule Event
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Event Title</label>
                <Input 
                  placeholder="e.g. South Punjab Youth Convention"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Description</label>
                <textarea
                  placeholder="Provide event overview, schedule, or rules..."
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:border-[#0A9EDE]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Date</label>
                  <Input 
                    type="date"
                    value={createDate}
                    onChange={(e) => setCreateDate(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Time</label>
                  <Input 
                    placeholder="e.g. 10:00 AM - 1:00 PM"
                    value={createTime}
                    onChange={(e) => setCreateTime(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Location / Venue</label>
                <Input 
                  placeholder="e.g. YDC Central Office, Multan"
                  value={createLocation}
                  onChange={(e) => setCreateLocation(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Capacity</label>
                  <Input 
                    type="number"
                    value={createCapacity}
                    onChange={(e) => setCreateCapacity(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Coin Reward</label>
                  <Input 
                    type="number"
                    value={createCoinReward}
                    onChange={(e) => setCreateCoinReward(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="px-5 py-3 border-t border-zinc-150 bg-zinc-50 -mx-5 -mb-5 flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)} 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isCreating}
                  isLoading={isCreating}
                  className="h-8 text-xs bg-[#0A9EDE] border-[#0A9EDE] hover:bg-[#088abf] text-white"
                  size="sm"
                >
                  Create Event
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EVENT MODAL */}
      {showEditModal && selectedEvent && (
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

      {/* ATTENDEES DRAWER/MODAL */}
      {showAttendeesModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/55 z-55 flex flex-col justify-end backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col w-full border-t border-zinc-200 animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-150 flex justify-between items-center bg-zinc-50 rounded-t-3xl">
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 truncate max-w-[250px]" title={selectedEvent.title}>
                  {selectedEvent.title}
                </h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Attendee Check-in Management</p>
              </div>
              <button 
                onClick={() => setShowAttendeesModal(false)} 
                className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {selectedEventAttendees.length === 0 ? (
                <div className="text-center py-12 text-zinc-400">
                  <Users size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold">No volunteers registered yet.</p>
                </div>
              ) : (
                selectedEventAttendees.map(reg => (
                  <div 
                    key={reg.id} 
                    className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-150 rounded-2xl text-xs shadow-inner"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-zinc-950 truncate">{reg.profiles.full_name}</p>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{reg.ticket_code}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {reg.attended ? (
                        <div className="flex items-center gap-1 text-[10px] font-extrabold text-[#0BA242] bg-[#0BA242]/10 border border-[#0BA242]/20 px-2 py-1 rounded-full">
                          <UserCheck size={11} />
                          Checked In
                        </div>
                      ) : (
                        <div className="text-[10px] text-zinc-400 border border-zinc-200 bg-white px-2 py-1 rounded-full font-medium">
                          Absent
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleToggleAttendance(reg.id, reg.attended)}
                        disabled={isTogglingAttendance === reg.id}
                        className={`w-8 h-8 flex items-center justify-center rounded-xl border transition-all cursor-pointer ${
                          reg.attended
                            ? 'bg-red-50 border-red-150 text-[#DD0408] hover:bg-red-100/50'
                            : 'bg-green-50 border-green-150 text-[#0BA242] hover:bg-green-100/50'
                        }`}
                        title={reg.attended ? 'Mark Absent' : 'Mark Attended'}
                      >
                        {isTogglingAttendance === reg.id ? (
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        ) : reg.attended ? (
                          <X size={14} />
                        ) : (
                          <Check size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer summary */}
            <div className="p-5 border-t border-zinc-150 bg-zinc-50 flex items-center justify-between text-xs font-semibold text-zinc-500">
              <span>Total Registrations: {selectedEventAttendees.length}</span>
              <span className="text-[#0BA242]">
                Checked In: {selectedEventAttendees.filter(r => r.attended).length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
