'use client'

import React, { useState, useMemo } from 'react'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Plus, 
  X, 
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createEvent, updateEventCoinReward } from '@/app/admin/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface Registration {
  id: string
  event_id: string
  user_id: string
  attended: boolean
}

interface EventItem {
  id: string
  title: string
  description: string
  date: string
  time: string;
  location: string;
  capacity: number;
  coin_reward?: number;
  unit_id?: string | null;
  is_compulsory?: boolean;
  is_archived?: boolean;
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

export default function EventsManager({
  initialEvents,
  initialRegistrations,
  permissions,
  adminRole,
  adminUnitId,
  adminUnitName,
  units,
  rankTiers,
}: {
  initialEvents: EventItem[]
  initialRegistrations: Registration[]
  unitMembers: any[]
  permissions: {
    can_scan_tickets: boolean
    can_manage_events: boolean
  }
  adminRole: string
  adminUnitId?: string | null
  adminUnitName?: string | null
  units: { id: string; name: string }[]
  rankTiers: { name: string; threshold: number }[]
}) {
  const router = useRouter()
  const [events, setEvents] = useState<EventItem[]>(initialEvents)

  // Create Event States
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newStartTime, setNewStartTime] = useState('09:00')
  const [newEndTime, setNewEndTime] = useState('17:00')
  const [newLocation, setNewLocation] = useState('')
  const [newCapacity, setNewCapacity] = useState('100')
  const [newCoinReward, setNewCoinReward] = useState('50')
  const [isCreating, setIsCreating] = useState(false)
  const [newUnitId, setNewUnitId] = useState('')
  const [newIsCompulsory, setNewIsCompulsory] = useState(false)
  
  // Poster Upload States
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterPreview, setPosterPreview] = useState<string>('')
  const [posterColor, setPosterColor] = useState<string>('')
  
  // Custom Criteria UI States
  const [newMinAge, setNewMinAge] = useState<number | ''>('')
  const [newMinStreak, setNewMinStreak] = useState<number | ''>('')
  const [newRequiredRank, setNewRequiredRank] = useState('none')

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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const capacityVal = parseInt(newCapacity, 10) || 100
      const coinRewardVal = parseInt(newCoinReward, 10) || 50
      
      const customCriteria: any = {}
      if (newMinAge !== '') customCriteria.min_age = newMinAge
      if (newMinStreak !== '') customCriteria.min_streak = newMinStreak
      if (newRequiredRank !== 'none') customCriteria.required_rank = newRequiredRank

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
        newTitle,
        newDescription,
        newDate,
        newStartTime,
        newEndTime,
        newLocation,
        capacityVal,
        coinRewardVal,
        adminRole === 'president' ? (adminUnitId || null) : (newUnitId || null),
        [], // excludedUnitIds
        newIsCompulsory,
        customCriteria,
        uploadedPosterUrl,
        posterColor || null
      )

      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Event scheduled successfully!')
        
        setShowCreateModal(false)
        setNewTitle('')
        setNewDescription('')
        setNewDate('')
        setNewStartTime('09:00')
        setNewEndTime('17:00')
        setNewLocation('')
        setNewCapacity('100')
        setNewCoinReward('50')
        setNewUnitId('')
        setNewIsCompulsory(false)
        setNewMinAge('')
        setNewMinStreak('')
        setNewRequiredRank('none')
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
    router.push(`/admin/events/${id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-2">
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
        {permissions.can_manage_events && (
          <Button 
            onClick={() => setShowCreateModal(true)}
            size="sm"
            className="bg-[#1D1D1D] hover:bg-black text-white py-2 rounded-lg font-semibold"
            leftIcon={<Plus size={16} />}
          >
            Create Event
          </Button>
        )}
      </div>

      <Card className="shadow-sm border border-zinc-200 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Event</th>
                <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Location</th>
                <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-center">Attendance</th>
                <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-center">Reward</th>
                <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-zinc-400 text-sm">
                    {searchQuery ? 'No events match your search.' : 'No events scheduled yet.'}
                  </td>
                </tr>
              ) : (
                paginatedEvents.map(event => {
                  const regCount = initialRegistrations.filter(r => r.event_id === event.id).length
                  const attCount = initialRegistrations.filter(r => r.event_id === event.id && r.attended).length
                  return (
                    <tr 
                      key={event.id} 
                      className="hover:bg-zinc-50 transition-colors cursor-pointer"
                      onClick={() => navigateToDetails(event.id)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900 text-sm">{event.title}</span>
                          {event.is_compulsory && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-bold uppercase tracking-wider border border-red-100">
                              Compulsory
                            </span>
                          )}
                          {event.is_archived && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-bold uppercase tracking-wider border border-amber-100">
                              Archived
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-600">
                        <div className="font-semibold">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div className="text-zinc-400 mt-0.5">{event.time}</div>
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-zinc-400" />
                          <span className="truncate max-w-[150px]">{event.location}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex flex-col items-center justify-center">
                          <span className="text-xs font-bold text-zinc-900">{attCount} / {regCount}</span>
                          <span className="text-[10px] text-zinc-400">Checked In</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-xs font-bold font-mono text-zinc-700">{event.coin_reward ?? 50} C</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full"
                        >
                          <ArrowRight size={16} />
                        </Button>
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
            <span className="text-xs text-zinc-500 font-medium">
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-150 flex justify-between items-center bg-zinc-50">
              <h3 className="font-extrabold text-zinc-900 flex items-center gap-2">
                <Calendar size={18} className="text-zinc-950" />
                Schedule New Event
              </h3>
              <button 
                type="button"
                onClick={() => setShowCreateModal(false)} 
                className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
              >
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
                    className="w-full text-sm p-3 rounded-lg border border-[#E5E5E5] focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">Event Poster</label>
                  <div className="flex flex-col gap-3">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePosterChange}
                      className="hidden"
                      id="admin-poster-upload"
                    />
                    <label 
                      htmlFor="admin-poster-upload"
                      className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-xl p-4 cursor-pointer hover:bg-zinc-50 transition-colors"
                    >
                      <Plus className="text-zinc-400 mb-1" size={20} />
                      <span className="text-xs text-zinc-600 font-semibold">
                        {posterFile ? posterFile.name : 'Upload Event Poster'}
                      </span>
                      <span className="text-[10px] text-zinc-400 mt-0.5">JPEG, PNG, WEBP up to 5MB</span>
                    </label>

                    {posterPreview && (
                      <div className="flex items-center gap-4 p-3 bg-zinc-50 border border-zinc-150 rounded-xl">
                        <img 
                          src={posterPreview} 
                          alt="Poster Preview" 
                          className="w-16 h-16 object-cover rounded-lg shadow-sm"
                        />
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Accent Color</span>
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
                            className="text-[10px] font-bold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                          >
                            <X size={12} /> Remove Poster
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Unit Scope Field */}
                {(adminRole === 'superadmin' || adminRole === 'admin') ? (
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block font-medium">Unit Scope</label>
                    <select
                      value={newUnitId}
                      onChange={(e) => setNewUnitId(e.target.value)}
                      className="w-full text-sm p-3 rounded-lg border border-zinc-200 focus:outline-none focus:border-zinc-900 bg-white"
                    >
                      <option value="">Overall (All Units)</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1 bg-zinc-50 border border-zinc-150 p-3 rounded-xl">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Unit Scope</span>
                    <span className="text-xs font-bold text-zinc-800 uppercase">
                      {adminUnitName || 'No Unit'} (Local Event)
                    </span>
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t border-zinc-100">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="isCompulsory"
                      checked={newIsCompulsory}
                      onChange={(e) => setNewIsCompulsory(e.target.checked)}
                      className="rounded border-zinc-300 text-[#0A9EDE] focus:ring-[#0A9EDE]"
                    />
                    <label htmlFor="isCompulsory" className="text-sm font-bold text-zinc-700">Is Compulsory?</label>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0">If checked, eligible members will be expected to attend and marked absent if they miss without a leave request.</p>
                </div>

                {/* Custom Eligibility Criteria (UI Version) */}
                <div className="space-y-3 pt-4 border-t border-zinc-100">
                  <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block font-medium mb-2">Custom Eligibility Criteria</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase">Minimum Age</label>
                      <Input 
                        type="number"
                        min="0"
                        placeholder="e.g. 15"
                        value={newMinAge}
                        onChange={(e) => setNewMinAge(e.target.value ? parseInt(e.target.value, 10) : '')}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase">Minimum Streak</label>
                      <Input 
                        type="number"
                        min="0"
                        placeholder="e.g. 7"
                        value={newMinStreak}
                        onChange={(e) => setNewMinStreak(e.target.value ? parseInt(e.target.value, 10) : '')}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase">Required Rank</label>
                    <select
                      value={newRequiredRank}
                      onChange={(e) => setNewRequiredRank(e.target.value)}
                      className="w-full text-sm p-2 rounded-lg border border-zinc-200 focus:outline-none focus:border-zinc-900 bg-white"
                    >
                      <option value="none">None (Open to all)</option>
                      {rankTiers.map(tier => (
                        <option key={tier.name} value={tier.name}>{tier.name} ({tier.threshold} Coins)</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block font-medium">Date</label>
                    <Input 
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block font-medium">Start Time</label>
                      <Input 
                        type="time"
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block font-medium">End Time</label>
                      <Input 
                        type="time"
                        value={newEndTime}
                        onChange={(e) => setNewEndTime(e.target.value)}
                        required
                      />
                    </div>
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

                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block font-medium">Attendance Coin Reward</label>
                  <Input 
                    type="number"
                    value={newCoinReward}
                    onChange={(e) => setNewCoinReward(e.target.value)}
                    min="0"
                    required
                  />
                  <p className="text-[10px] text-zinc-400">
                    Number of YDC Coins to award members checked in at this event.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-zinc-150 bg-zinc-50 flex justify-end gap-3">
                <Button type="button" onClick={() => setShowCreateModal(false)} variant="outline" size="sm">
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
    </div>
  )
}
