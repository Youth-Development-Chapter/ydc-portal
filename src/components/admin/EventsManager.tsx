'use client'

import React, { useState } from 'react'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Plus, 
  Check, 
  X, 
  QrCode, 
  UserCheck, 
  AlertTriangle,
  Sparkles,
  ClipboardList
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { checkInTicket, createEvent, toggleManualAttendance } from '@/app/admin/actions'

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
}

export default function EventsManager({
  initialEvents,
  initialRegistrations,
  permissions,
}: {
  initialEvents: EventItem[]
  initialRegistrations: Registration[]
  permissions: {
    can_scan_tickets: boolean
    can_manage_events: boolean
  }
}) {
  const [events, setEvents] = useState<EventItem[]>(initialEvents)
  const [registrations, setRegistrations] = useState<Registration[]>(initialRegistrations)

  // Scanner Tab States
  const [ticketInput, setTicketInput] = useState('')
  const [scanResult, setScanResult] = useState<{
    type: 'success' | 'error' | 'already'
    message: string
    userName?: string
    coinsAwarded?: number
  } | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  // Create Event States
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newCapacity, setNewCapacity] = useState('100')
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Manage Attendees States
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [isTogglingAttendance, setIsTogglingAttendance] = useState<string | null>(null)

  // Handle Scanning / Manual Ticket Check-in
  const handleTicketScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!ticketInput.trim()) return

    setIsScanning(true)
    setScanResult(null)

    try {
      const res = await checkInTicket(ticketInput.trim())
      if (res?.error) {
        if (res.alreadyScanned) {
          setScanResult({
            type: 'already',
            message: `Ticket was already scanned for user ${res.userName}.`,
            userName: res.userName,
          })
        } else {
          setScanResult({
            type: 'error',
            message: res.error,
          })
        }
      } else {
        setScanResult({
          type: 'success',
          message: `Check-in successful!`,
          userName: res.userName,
          coinsAwarded: res.coinsAwarded,
        })
        
        // Update local attendance status
        setRegistrations(prev =>
          prev.map(reg =>
            reg.ticket_code === ticketInput.trim() ? { ...reg, attended: true, attended_at: new Date().toISOString() } : reg
          )
        )
        setTicketInput('')
      }
    } catch (err: unknown) {
      setScanResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'An error occurred during ticket scan.',
      })
    } finally {
      setIsScanning(false)
    }
  }

  // Handle Event Creation
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setCreateError(null)

    try {
      const capacityVal = parseInt(newCapacity, 10) || 100
      const res = await createEvent(
        newTitle,
        newDescription,
        newDate,
        newTime,
        newLocation,
        capacityVal
      )

      if (res?.error) {
        setCreateError(res.error)
      } else {
        // Close modal and reset fields
        setShowCreateModal(false)
        setNewTitle('')
        setNewDescription('')
        setNewDate('')
        setNewTime('')
        setNewLocation('')
        setNewCapacity('100')

        // Fetch events again or update local state
        // To be safe, let's create a temporary object or notify success
        // In Next.js, actions run revalidatePath, so a soft refresh could work,
        // but for immediate UI response let's append it locally
        const newEvt: EventItem = {
          id: Math.random().toString(36).substring(2, 9), // temp id, path will refresh
          title: newTitle,
          description: newDescription,
          date: newDate,
          time: newTime,
          location: newLocation,
          capacity: capacityVal,
        }
        setEvents(prev => [newEvt, ...prev])
      }
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setIsCreating(false)
    }
  }

  // Handle Manual Attendance Toggle
  const handleToggleAttendance = async (regId: string, currentStatus: boolean) => {
    setIsTogglingAttendance(regId)

    try {
      const res = await toggleManualAttendance(regId, !currentStatus)
      if (res?.error) {
        alert(res.error)
      } else {
        setRegistrations(prev =>
          prev.map(reg =>
            reg.id === regId ? { ...reg, attended: !currentStatus, attended_at: !currentStatus ? new Date().toISOString() : null } : reg
          )
        )
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error occurred.')
    } finally {
      setIsTogglingAttendance(null)
    }
  }

  const selectedEventRegistrations = selectedEvent 
    ? registrations.filter(r => r.event_id === selectedEvent.id)
    : []

  return (
    <Tabs defaultValue={permissions.can_scan_tickets ? 'scanner' : 'events'}>
      <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
        <TabsList variant="line" className="border-none pb-0">
          {permissions.can_scan_tickets && (
            <TabsTrigger value="scanner">
              <QrCode size={16} className="mr-2" />
              Ticket Scanner
            </TabsTrigger>
          )}
          <TabsTrigger value="events">
            <ClipboardList size={16} className="mr-2" />
            Events Listing
          </TabsTrigger>
        </TabsList>

        {permissions.can_manage_events && (
          <Button 
            onClick={() => setShowCreateModal(true)}
            size="sm"
            className="bg-[#1D1D1D] hover:bg-black text-white"
            leftIcon={<Plus size={16} />}
          >
            Create Event
          </Button>
        )}
      </div>

      {/* TICKET SCANNING TAB */}
      {permissions.can_scan_tickets && (
        <TabsContent value="scanner" className="space-y-6 pt-6">
          <div className="max-w-md mx-auto">
            <Card className="shadow-md">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#0A9EDE]/10 text-[#0A9EDE] flex items-center justify-center mx-auto mb-3">
                  <QrCode size={32} />
                </div>
                <CardTitle className="text-xl">Scan Volunteer Ticket</CardTitle>
                <p className="text-xs text-zinc-400 mt-1">
                  Type or scan the unique ticket code from the volunteer&apos;s mobile app.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleTicketScan} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">
                      Ticket Code
                    </label>
                    <Input 
                      placeholder="e.g. TKT-PION-XXXXXXXX"
                      value={ticketInput}
                      onChange={(e) => setTicketInput(e.target.value.toUpperCase())}
                      className="text-center font-bold tracking-widest font-mono h-11 border-zinc-300 uppercase"
                      disabled={isScanning}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#0BA242] border-[#0BA242] hover:bg-[#0BA242]/90 text-white font-bold h-11"
                    isLoading={isScanning}
                  >
                    Check In Ticket
                  </Button>
                </form>

                {/* Scan Results Panel */}
                {scanResult && (
                  <div className={`p-4 border rounded-2xl animate-in fade-in zoom-in-95 duration-200 ${
                    scanResult.type === 'success' ? 'bg-[#0BA242]/5 border-[#0BA242]/20 text-[#0BA242]' :
                    scanResult.type === 'already' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                    'bg-red-50 border-red-100 text-red-600'
                  }`}>
                    <div className="flex gap-3">
                      {scanResult.type === 'success' && <Sparkles size={20} className="shrink-0 animate-bounce" />}
                      {scanResult.type === 'already' && <AlertTriangle size={20} className="shrink-0" />}
                      {scanResult.type === 'error' && <X size={20} className="shrink-0" />}
                      <div className="space-y-1">
                        <span className="font-extrabold text-sm block">
                          {scanResult.type === 'success' ? 'Check-In Complete!' :
                           scanResult.type === 'already' ? 'Already Checked In' : 'Error Occurred'}
                        </span>
                        <p className="text-xs">{scanResult.message}</p>
                        {scanResult.userName && (
                          <p className="text-xs font-semibold text-zinc-800 mt-1">
                            Attendee: {scanResult.userName}
                          </p>
                        )}
                        {scanResult.coinsAwarded && (
                          <div className="inline-flex items-center gap-1 bg-[#0BA242]/10 border border-[#0BA242]/20 px-2 py-0.5 rounded-full text-[10px] font-extrabold text-[#0BA242] mt-2">
                            +{scanResult.coinsAwarded} Coins Credited
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Mock Ticket Codes For Testing */}
                <div className="border-t border-zinc-150 pt-4 space-y-2">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                    Quick Testing Codes
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {registrations.slice(0, 4).map(reg => (
                      <button
                        key={reg.id}
                        onClick={() => {
                          setTicketInput(reg.ticket_code)
                          setScanResult(null)
                        }}
                        className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                          reg.attended 
                            ? 'bg-zinc-100 border-zinc-200 text-zinc-400 line-through' 
                            : 'bg-white border-zinc-250 text-zinc-700 hover:border-zinc-950'
                        }`}
                      >
                        {reg.ticket_code.slice(0, 12)}...
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      )}

      {/* EVENTS LISTING TAB */}
      <TabsContent value="events" className="pt-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main events catalog */}
          <div className="lg:col-span-2 space-y-4">
            {events.length === 0 ? (
              <Card className="border-dashed border-zinc-250">
                <CardContent className="py-16 text-center text-zinc-400">
                  <Calendar size={48} className="mx-auto mb-4 opacity-30" />
                  <h3 className="font-bold text-zinc-700">No Events Found</h3>
                  <p className="text-xs mt-1">Get started by creating a new event above.</p>
                </CardContent>
              </Card>
            ) : (
              events.map((event) => {
                const regCount = registrations.filter(r => r.event_id === event.id).length
                const attCount = registrations.filter(r => r.event_id === event.id && r.attended).length
                return (
                  <Card key={event.id} className="shadow-sm hover:border-[#0A9EDE]/20 transition-all duration-300">
                    <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-255 text-zinc-700 font-extrabold tracking-wider uppercase">
                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 font-extrabold tracking-wider uppercase">
                            {event.time}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-base text-zinc-900 leading-tight">{event.title}</h3>
                        <p className="text-xs text-zinc-500 leading-relaxed max-w-xl">{event.description}</p>

                        <div className="flex flex-wrap gap-4 text-xs font-semibold text-zinc-500 pt-1">
                          <div className="flex items-center gap-1">
                            <MapPin size={14} className="text-zinc-400" />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users size={14} className="text-zinc-400" />
                            <span>{regCount} / {event.capacity} registered</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex md:flex-col items-stretch gap-2.5">
                        <div className="text-left md:text-right px-2 py-1.5 bg-zinc-50 border border-zinc-150 rounded-xl">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Attendance</span>
                          <span className="font-extrabold text-xs text-zinc-800">{attCount} checked in</span>
                        </div>
                        <Button 
                          onClick={() => setSelectedEvent(event)}
                          variant="outline" 
                          size="sm"
                          leftIcon={<UserCheck size={14} />}
                        >
                          Manage Attendees
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          {/* Attendee Roster Drawer / Detail side panel */}
          <div className="lg:col-span-1">
            {selectedEvent ? (
              <Card className="shadow-md sticky top-24 border-[#0A9EDE]/10">
                <CardHeader className="bg-zinc-50 border-b border-zinc-100 flex flex-row items-center justify-between p-5">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm font-extrabold truncate" title={selectedEvent.title}>
                      {selectedEvent.title}
                    </CardTitle>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Attendee Roster</p>
                  </div>
                  <button 
                    onClick={() => setSelectedEvent(null)}
                    className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </CardHeader>
                <CardContent className="p-0 max-h-[60vh] overflow-y-auto divide-y divide-zinc-150">
                  {selectedEventRegistrations.length === 0 ? (
                    <div className="p-8 text-center text-zinc-400 text-xs">
                      No registrations for this event yet.
                    </div>
                  ) : (
                    selectedEventRegistrations.map((reg) => {
                      const isToggling = isTogglingAttendance === reg.id
                      return (
                        <div key={reg.id} className="p-4 flex items-center justify-between gap-3 hover:bg-zinc-50 transition-colors">
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-xs text-zinc-800 block truncate">
                              {reg.profiles.full_name}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono block">
                              Code: {reg.ticket_code.slice(0, 15)}...
                            </span>
                            <span className="text-[10px] text-zinc-400 block">
                              Division: {reg.profiles.division}
                            </span>
                          </div>

                          <Button
                            onClick={() => handleToggleAttendance(reg.id, reg.attended)}
                            variant={reg.attended ? 'primary' : 'outline'}
                            size="sm"
                            className={`h-7 text-[10px] px-2.5 rounded-md font-bold uppercase tracking-wider shrink-0 ${
                              reg.attended 
                                ? 'bg-[#0BA242] border-[#0BA242] hover:bg-[#DD0408] hover:border-[#DD0408] text-white hover:before:content-["Check_Out"] before:content-["Checked_In"] flex items-center justify-center w-24'
                                : 'w-24'
                            }`}
                            isLoading={isToggling}
                            leftIcon={!isToggling && (reg.attended ? <Check size={10} /> : <Plus size={10} />)}
                          >
                            {reg.attended ? '' : 'Check In'}
                          </Button>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm border-dashed border-zinc-200">
                <CardContent className="p-12 text-center text-zinc-400 text-xs">
                  <UserCheck size={36} className="mx-auto mb-3 opacity-20" />
                  <p>Select an event to manage registrations and manual check-ins.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </TabsContent>

      {/* CREATE EVENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-150 flex justify-between items-center bg-zinc-50">
              <h3 className="font-extrabold text-zinc-900 flex items-center gap-2">
                <Calendar size={18} className="text-zinc-950" />
                Schedule New Event
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateEvent}>
              <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">Event Title</label>
                  <Input 
                    placeholder="e.g. Quran Camp 2026"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">Description</label>
                  <textarea
                    placeholder="Provide details about activities, schedule, prerequisites, etc."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={3}
                    className="w-full text-sm p-3 rounded-lg border border-zinc-200 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block font-medium">Date</label>
                    <Input 
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block font-medium">Time (Duration)</label>
                    <Input 
                      placeholder="e.g. 9:00 AM - 5:00 PM"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block font-medium">Location</label>
                    <Input 
                      placeholder="e.g. YDC Central Mosque"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block font-medium">Capacity</label>
                    <Input 
                      type="number"
                      value={newCapacity}
                      onChange={(e) => setNewCapacity(e.target.value)}
                      min="1"
                      required
                    />
                  </div>
                </div>

                {createError && (
                  <div className="flex gap-2 p-3 bg-red-50 border border-red-100 text-xs text-red-600 rounded-lg font-medium">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-zinc-150 bg-zinc-50 flex justify-end gap-3">
                <Button onClick={() => setShowCreateModal(false)} variant="outline" size="sm">
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isCreating}
                  isLoading={isCreating}
                  className="bg-zinc-900 border-zinc-900 hover:bg-black text-white"
                  size="sm"
                >
                  Create Event
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Tabs>
  )
}
