'use client'

import React, { useState, useMemo } from 'react'
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
  ScanLine,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { checkInTicket, createEvent, updateEvent } from '@/app/admin/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/utils/supabase/client'

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
    unit_name: string
    qualification: string
  }
}

interface EventItem {
  id: string
  title: string
  description: string
  date: string
  time?: string
  start_time: string
  end_time: string
  location: string
  capacity: number
  coin_reward?: number
  unit_id?: string | null
  is_compulsory?: boolean
}

// Accent color extractor function using client-side canvas
const extractAccentColor = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('#0A9EDE');
          return;
        }
        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(img, 0, 0, 50, 50);
        const imageData = ctx.getImageData(0, 0, 50, 50).data;
        
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        let bestColor = { r: 10, g: 158, b: 222 };
        let maxSaturation = -1;
        
        for (let i = 0; i < imageData.length; i += 4) {
          const r = imageData[i];
          const g = imageData[i+1];
          const b = imageData[i+2];
          const a = imageData[i+3];
          if (a < 200) continue;
          
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const delta = max - min;
          const l = (max + min) / 510;
          const s = l > 0 && l < 1 ? delta / (255 * (1 - Math.abs(2 * l - 1))) : 0;
          
          if (s > maxSaturation && l > 0.15 && l < 0.85) {
            maxSaturation = s;
            bestColor = { r, g, b };
          }
          
          rSum += r;
          gSum += g;
          bSum += b;
          count++;
        }
        
        if (maxSaturation < 0.1 && count > 0) {
          const r = Math.round(rSum / count);
          const g = Math.round(gSum / count);
          const b = Math.round(bSum / count);
          bestColor = { r, g, b };
        }
        
        const rgbToHex = (r: number, g: number, b: number) => 
          '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
          }).join('');
          
        resolve(rgbToHex(bestColor.r, bestColor.g, bestColor.b));
      };
      img.onerror = () => resolve('#0A9EDE');
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve('#0A9EDE');
    reader.readAsDataURL(file);
  });
};

export default function PresidentEventsManager({
  initialEvents,
  initialRegistrations,
  adminRole,
  adminDivision,
  adminUnitName,
  rankTiers,
}: {
  initialEvents: EventItem[]
  initialRegistrations: Registration[]
  adminRole: string
  adminDivision?: string | null
  adminUnitName?: string | null
  rankTiers: { name: string; threshold: number }[]
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

  // Search, Pagination, Sort
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredEvents = useMemo(() => {
    return events.filter(e => 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      e.location.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [events, searchQuery])

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage)
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Create Form fields
  const [createTitle, setCreateTitle] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createDate, setCreateDate] = useState('')
  const [createStartTime, setCreateStartTime] = useState('09:00')
  const [createEndTime, setCreateEndTime] = useState('17:00')
  const [createLocation, setCreateLocation] = useState('')
  const [createCapacity, setCreateCapacity] = useState('100')
  const [createCoinReward, setCreateCoinReward] = useState('50')
  const [createIsCompulsory, setCreateIsCompulsory] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // Poster Upload States
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterPreview, setPosterPreview] = useState<string>('')
  const [posterColor, setPosterColor] = useState<string>('')
  
  // Custom Criteria
  const [createMinAge, setCreateMinAge] = useState<number | ''>('')
  const [createMinStreak, setCreateMinStreak] = useState<number | ''>('')
  const [createRequiredRank, setCreateRequiredRank] = useState('none')

  // Edit Form fields
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editCapacity, setEditCapacity] = useState('100')
  const [editCoinReward, setEditCoinReward] = useState('50')
  const [editIsCompulsory, setEditIsCompulsory] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

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

  const handlePosterChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPosterFile(file)
    setPosterPreview(URL.createObjectURL(file))
    
    try {
      const color = await extractAccentColor(file)
      setPosterColor(color)
    } catch (err) {
      console.error('Failed to extract color:', err)
      setPosterColor('#0A9EDE')
    }
  }

  // Handle Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const capacityVal = parseInt(createCapacity, 10) || 100
      const coinRewardVal = parseInt(createCoinReward, 10) || 50
      
      const customCriteria: any = {}
      if (createMinAge !== '') customCriteria.min_age = createMinAge
      if (createMinStreak !== '') customCriteria.min_streak = createMinStreak
      if (createRequiredRank !== 'none') customCriteria.required_rank = createRequiredRank

      let uploadedPosterUrl = null
      if (posterFile) {
        const supabase = createClient()
        const fileExt = posterFile.name.split('.').pop() || 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('event-posters')
          .upload(fileName, posterFile)

        if (uploadError) {
          throw new Error(`Poster upload failed: ${uploadError.message}`)
        }

        const { data: urlData } = supabase.storage
          .from('event-posters')
          .getPublicUrl(fileName)
        uploadedPosterUrl = urlData.publicUrl
      }

      const res = await createEvent(
        createTitle,
        createDescription,
        createDate,
        createStartTime,
        createEndTime,
        createLocation,
        capacityVal,
        coinRewardVal,
        adminDivision || null,
        null,
        createIsCompulsory,
        customCriteria,
        uploadedPosterUrl,
        posterColor || null
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
        setCreateStartTime('09:00')
        setCreateEndTime('17:00')
        setCreateLocation('')
        setCreateCapacity('100')
        setCreateCoinReward('50')
        setCreateIsCompulsory(false)
        setCreateMinAge('')
        setCreateMinStreak('')
        setCreateRequiredRank('none')
        setPosterFile(null)
        setPosterPreview('')
        setPosterColor('')
        
        router.refresh()
        setTimeout(() => window.location.reload(), 800)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setIsCreating(false)
    }
  }

  const navigateToDetails = (id: string) => {
    router.push(`/dashboard/president/events/${id}`)
  }

  return (
    <div className="space-y-6">
      {/* Camera QR Scanner Modal */}
      {showCameraScanner && (
        <QRScannerModal
          onScan={handleCameraScan}
          onClose={() => setShowCameraScanner(false)}
        />
      )}

      {/* Search/Ticket scanning input */}
      <Card className="shadow-sm border border-zinc-200 bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <label className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider block">Quick Ticket Check-In</label>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <span className="text-[10px] text-zinc-400 font-bold block">Select Checkpoint Event</span>
              <select
                value={scanEventId}
                onChange={(e) => setScanEventId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:border-zinc-900 bg-zinc-50"
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
            <div className="flex-1 space-y-2">
              <span className="text-[10px] text-zinc-400 font-bold block">Enter Code</span>
              <form onSubmit={handleTicketCheckIn} className="flex gap-2">
                <Input 
                  placeholder="Scan QR or type User UUID / Ticket"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  className="h-10 text-xs flex-1 border-zinc-200"
                />
                <Button
                  type="button"
                  onClick={() => setShowCameraScanner(true)}
                  variant="outline"
                  className="h-10 px-3 border-zinc-200 text-[#0A9EDE]"
                  title="Scan QR with Camera"
                >
                  <ScanLine size={18} />
                </Button>
                <Button
                  type="submit"
                  disabled={isCheckingIn || !ticketInput.trim() || !scanEventId}
                  isLoading={isCheckingIn}
                  className="h-10 px-6 bg-zinc-950 text-white font-bold rounded-xl"
                >
                  Verify
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header and Add Button */}
      <div className="flex items-center justify-between pt-2">
        <div className="relative max-w-xs w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-zinc-400" />
          </div>
          <Input 
            placeholder="Search events..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9 h-10 border-zinc-200 focus:border-[#0A9EDE]"
          />
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="h-10 text-xs px-4 bg-[#0A9EDE] hover:bg-[#088abf] border-[#0A9EDE] text-white rounded-xl"
          leftIcon={<Plus size={16} />}
        >
          Create Event
        </Button>
      </div>

      {/* Events List as a Table */}
      <Card className="shadow-sm border border-zinc-200 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Event</th>
                <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Location</th>
                <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-center">Attendance</th>
                <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-zinc-400 text-sm">
                    {searchQuery ? 'No events match your search.' : 'No events scheduled yet.'}
                  </td>
                </tr>
              ) : (
                paginatedEvents.map(event => {
                  const regCount = registrations.filter(r => r.event_id === event.id).length
                  const attCount = registrations.filter(r => r.event_id === event.id && r.attended).length
                  return (
                    <tr 
                      key={event.id} 
                      className="hover:bg-zinc-50 transition-colors cursor-pointer"
                      onClick={() => navigateToDetails(event.id)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-zinc-900 text-sm">{event.title}</span>
                          <div className="flex items-center gap-2">
                            {event.is_compulsory && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-bold uppercase tracking-wider border border-red-100">
                                Compulsory
                              </span>
                            )}
                            <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full w-fit">
                              <Coins size={10} className="text-yellow-600" />
                              <span className="font-extrabold text-[9px] text-yellow-700 font-mono">{event.coin_reward ?? 50} C</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-600">
                        <div className="font-semibold">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div className="text-zinc-400 mt-0.5 flex items-center gap-1">
                          <Clock size={12}/>
                          {(() => {
                            const formatTime = (t: string) => {
                              if (!t) return ''
                              const [h, m] = t.split(':')
                              const hour = parseInt(h, 10)
                              const ampm = hour >= 12 ? 'PM' : 'AM'
                              const displayHour = hour % 12 || 12
                              return `${displayHour}:${m} ${ampm}`
                            }
                            return `${formatTime(event.start_time)} - ${formatTime(event.end_time)}`
                          })()}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-[#0A9EDE]" />
                          <span className="truncate max-w-[150px]">{event.location}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex flex-col items-center justify-center">
                          <span className="text-xs font-bold text-zinc-900">{attCount} / {regCount}</span>
                          <span className="text-[10px] text-zinc-400">Checked In</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-[#0A9EDE] hover:bg-[#0A9EDE]/10 rounded-full"
                            title="View Details"
                          >
                            <ArrowRight size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-zinc-200 flex items-center justify-between bg-zinc-50">
            <span className="text-xs text-zinc-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredEvents.length)} of {filteredEvents.length} events
            </span>
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft size={16} />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </Card>

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

              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Event Poster</label>
                <div className="flex flex-col gap-3">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePosterChange}
                    className="hidden"
                    id="president-poster-upload"
                  />
                  <label 
                    htmlFor="president-poster-upload"
                    className="flex flex-col items-center justify-center border border-dashed border-zinc-200 rounded-xl p-3 cursor-pointer hover:bg-zinc-50 transition-colors"
                  >
                    <Plus className="text-zinc-400 mb-0.5" size={18} />
                    <span className="text-[11px] text-zinc-600 font-semibold">
                      {posterFile ? posterFile.name : 'Upload Event Poster'}
                    </span>
                    <span className="text-[9px] text-zinc-400 mt-0.5">JPEG, PNG, WEBP up to 5MB</span>
                  </label>

                  {posterPreview && (
                    <div className="flex items-center gap-3 p-2.5 bg-zinc-50 border border-zinc-150 rounded-xl">
                      <img 
                        src={posterPreview} 
                        alt="Poster Preview" 
                        className="w-14 h-14 object-cover rounded-lg shadow-sm"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Accent Color</span>
                          <div 
                            className="w-3.5 h-3.5 rounded-full border border-zinc-300"
                            style={{ backgroundColor: posterColor }}
                          />
                          <span className="text-xs font-mono font-bold text-zinc-700">{posterColor}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPosterFile(null)
                            setPosterPreview('')
                            setPosterColor('')
                          }}
                          className="text-[9px] font-bold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                        >
                          <X size={10} /> Remove Poster
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Eligibility Criteria (UI Version) */}
              <div className="space-y-3 pt-3 border-t border-zinc-100">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Custom Eligibility Criteria</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase">Minimum Age</label>
                    <Input 
                      type="number"
                      min="0"
                      placeholder="e.g. 15"
                      value={createMinAge}
                      onChange={(e) => setCreateMinAge(e.target.value ? parseInt(e.target.value, 10) : '')}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase">Minimum Streak</label>
                    <Input 
                      type="number"
                      min="0"
                      placeholder="e.g. 7"
                      value={createMinStreak}
                      onChange={(e) => setCreateMinStreak(e.target.value ? parseInt(e.target.value, 10) : '')}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">Required Rank</label>
                  <select
                    value={createRequiredRank}
                    onChange={(e) => setCreateRequiredRank(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-zinc-200 focus:outline-none focus:border-[#0A9EDE] bg-white"
                  >
                    <option value="none">None (Open to all)</option>
                    {rankTiers.map(tier => (
                      <option key={tier.name} value={tier.name}>{tier.name} ({tier.threshold} Coins)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-100">
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
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block font-medium">Start Time</label>
                    <Input 
                      type="time"
                      value={createStartTime}
                      onChange={(e) => setCreateStartTime(e.target.value)}
                      className="h-9 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block font-medium">End Time</label>
                    <Input 
                      type="time"
                      value={createEndTime}
                      onChange={(e) => setCreateEndTime(e.target.value)}
                      className="h-9 text-xs"
                      required
                    />
                  </div>
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

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="createIsCompulsory"
                  checked={createIsCompulsory}
                  onChange={(e) => setCreateIsCompulsory(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0A9EDE] border-zinc-300 focus:ring-[#0A9EDE] cursor-pointer"
                />
                <label htmlFor="createIsCompulsory" className="text-xs font-semibold text-zinc-700 cursor-pointer select-none">
                  Make this event Compulsory
                </label>
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
    </div>
  )
}
