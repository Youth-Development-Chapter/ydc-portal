'use client'

import React, { useState, useEffect, useCallback, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  ArrowLeft, Calendar, MapPin, Clock, Search, Check, 
  Plus, Coins, Edit2, X, ChevronLeft, ChevronRight, Loader2,
  CheckSquare, Square, Trash2, HelpCircle, Archive, RotateCcw
} from 'lucide-react'
import { 
  toggleManualAttendance, 
  checkInTicket, 
  processEventLeave, 
  updateEvent, 
  getEventRoster,
  bulkCheckInAttendees,
  bulkProcessLeaves,
  archiveEvent,
  deleteEvent
} from '@/app/admin/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

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
  poster_url?: string | null
  poster_color?: string | null
  is_archived?: boolean
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
  attended_at: string | null
}

export default function EventDetailsClient({
  event,
  permissions,
  backUrl,
}: {
  event: EventItem
  initialRegistrations: any[]
  unitMembers: any[]
  permissions: {
    can_manage_events: boolean
  }
  rankTiers: { name: string; threshold: number }[]
  backUrl: string
}) {
  const router = useRouter()
  
  const hasPosterColor = !!event.poster_color
  const cardBgColor = event.poster_color || '#FFFFFF'

  const isDarkColor = (hex: string) => {
    if (!hex) return false
    const color = hex.replace('#', '')
    if (color.length !== 6) return false
    const r = parseInt(color.substring(0, 2), 16)
    const g = parseInt(color.substring(2, 4), 16)
    const b = parseInt(color.substring(4, 6), 16)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
    return yiq < 140
  }

  const isDarkBg = hasPosterColor ? isDarkColor(cardBgColor) : false

  const textPrimaryClass = hasPosterColor
    ? (isDarkBg ? "text-white" : "text-zinc-950 font-extrabold")
    : "text-zinc-900";

  const textSecondaryClass = hasPosterColor
    ? (isDarkBg ? "text-white/85" : "text-zinc-800 font-semibold")
    : "text-zinc-500";

  const borderClass = hasPosterColor
    ? (isDarkBg ? "border-white/15" : "border-black/10")
    : "border-zinc-100";

  const metaTextClass = hasPosterColor
    ? (isDarkBg ? "text-white/90" : "text-zinc-900 font-bold")
    : "text-zinc-700";

  const iconCalendarClass = hasPosterColor
    ? (isDarkBg ? "text-white" : "text-zinc-800")
    : "text-[#0A9EDE]";

  const iconClockClass = hasPosterColor
    ? (isDarkBg ? "text-white" : "text-zinc-800")
    : "text-[#DD0408]";

  const iconMapPinClass = hasPosterColor
    ? (isDarkBg ? "text-white" : "text-zinc-800")
    : "text-[#0BA242]";

  const subBoxClass1 = hasPosterColor
    ? (isDarkBg ? "bg-white/10 border-white/10" : "bg-black/5 border-black/10")
    : "bg-zinc-50 border-zinc-100";

  const subBoxClass2 = hasPosterColor
    ? (isDarkBg ? "bg-white/20 border-white/20" : "bg-black/10 border-black/15")
    : "bg-emerald-50/50 border-emerald-100";

  const labelClass = hasPosterColor
    ? (isDarkBg ? "text-white/60" : "text-zinc-700 font-bold")
    : "text-zinc-400";

  const subTextLabelClass = hasPosterColor
    ? (isDarkBg ? "text-white/70" : "text-zinc-800 font-bold")
    : "text-zinc-400";


  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  
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
  
  const [editPosterFile, setEditPosterFile] = useState<File | null>(null)
  const [editPosterPreview, setEditPosterPreview] = useState<string>(event.poster_url || '')
  const [editPosterColor, setEditPosterColor] = useState<string>(event.poster_color || '')
  const [isPosterRemoved, setIsPosterRemoved] = useState(false)

  const [isArchiving, setIsArchiving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleArchiveToggle = async () => {
    const actionName = event.is_archived ? 'restore' : 'archive'
    if (!confirm(`Are you sure you want to ${actionName} this event?`)) return
    setIsArchiving(true)
    try {
      const res = await archiveEvent(event.id, !event.is_archived)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(`Event ${event.is_archived ? 'restored' : 'archived'} successfully!`)
        router.push(backUrl)
        setTimeout(() => window.location.reload(), 500)
      }
    } catch (err: any) {
      toast.error(err.message || `Failed to ${actionName} event.`)
    } finally {
      setIsArchiving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this event? This action cannot be undone and will delete all associated registrations.')) return
    setIsDeleting(true)
    try {
      const res = await deleteEvent(event.id)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Event deleted successfully!')
        router.push(backUrl)
        setTimeout(() => window.location.reload(), 500)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete event.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Selection & Bulk Action States
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [isTogglingAttendance, setIsTogglingAttendance] = useState<string | null>(null)
  const [isProcessingLeave, setIsProcessingLeave] = useState<string | null>(null)
  const [isBulkActionPending, setIsBulkActionPending] = useState(false)

  const itemsPerPage = 20

  const fetchRoster = useCallback(async (page: number, search: string, filter: string) => {
    setIsLoading(true)
    try {
      const res = await getEventRoster(event.id, page, itemsPerPage, search, filter)
      if (res.error) {
        toast.error(res.error)
      } else {
        setRoster(res.roster || [])
        setTotalCount(res.totalCount || 0)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch roster.')
    } finally {
      setIsLoading(false)
    }
  }, [event.id])

  useEffect(() => {
    fetchRoster(currentPage, searchQuery, statusFilter)
  }, [currentPage, searchQuery, statusFilter, fetchRoster])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
    setSelectedUserIds(new Set())
  }

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value)
    setCurrentPage(1)
    setSelectedUserIds(new Set())
  }

  const handleProcessLeave = async (regId: string, action: 'approve' | 'reject') => {
    setIsProcessingLeave(regId)
    try {
      const res = await processEventLeave(regId, action)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(`Leave request ${action}d successfully.`)
        fetchRoster(currentPage, searchQuery, statusFilter)
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
        toast.success(!currentStatus ? 'Checked in successfully!' : 'Checked out successfully!')
        fetchRoster(currentPage, searchQuery, statusFilter)
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating attendance.')
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
        toast.success('Attendee checked in successfully!')
        fetchRoster(currentPage, searchQuery, statusFilter)
      }
    } catch (err: any) {
      toast.error(err.message || 'Error checking in attendee.')
    } finally {
      setIsTogglingAttendance(null)
    }
  }

  // Bulk Actions
  const handleSelectRow = (userId: string) => {
    const next = new Set(selectedUserIds)
    if (next.has(userId)) {
      next.delete(userId)
    } else {
      next.add(userId)
    }
    setSelectedUserIds(next)
  }

  const handleSelectAll = () => {
    if (selectedUserIds.size === roster.length) {
      setSelectedUserIds(new Set())
    } else {
      const allIds = roster.map(r => r.user_id)
      setSelectedUserIds(new Set(allIds))
    }
  }

  const handleBulkCheckIn = async () => {
    if (selectedUserIds.size === 0) return
    setIsBulkActionPending(true)
    const uids = Array.from(selectedUserIds)
    try {
      const res = await bulkCheckInAttendees(event.id, uids)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Successfully checked in ${uids.length} volunteers!`)
        setSelectedUserIds(new Set())
        fetchRoster(currentPage, searchQuery, statusFilter)
      }
    } catch (err: any) {
      toast.error(err.message || 'Bulk check-in failed.')
    } finally {
      setIsBulkActionPending(false)
    }
  }

  const handleBulkProcessLeaves = async (action: 'approve' | 'reject') => {
    if (selectedUserIds.size === 0) return
    
    const selectedRegIds = roster
      .filter(r => selectedUserIds.has(r.user_id) && r.registration_id)
      .map(r => r.registration_id as string)

    if (selectedRegIds.length === 0) {
      toast.error('No registered leaf-request submissions selected.')
      return
    }

    setIsBulkActionPending(true)
    try {
      const res = await bulkProcessLeaves(selectedRegIds, action)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Successfully ${action}d ${selectedRegIds.length} leave requests!`)
        setSelectedUserIds(new Set())
        fetchRoster(currentPage, searchQuery, statusFilter)
      }
    } catch (err: any) {
      toast.error(err.message || 'Bulk leave processing failed.')
    } finally {
      setIsBulkActionPending(false)
    }
  }

  const handlePosterChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setEditPosterFile(file)
    setEditPosterPreview(URL.createObjectURL(file))
    setIsPosterRemoved(false)
    
    try {
      const color = await extractAccentColor(file)
      setEditPosterColor(color)
    } catch (err) {
      console.error('Failed to extract color:', err)
      setEditPosterColor('#0A9EDE')
    }
  }

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)

    try {
      const capacityVal = parseInt(editCapacity, 10) || 100
      const coinRewardVal = parseInt(editCoinReward, 10) || 50
      
      let finalPosterUrl = event.poster_url || null
      let finalPosterColor = event.poster_color || null

      if (isPosterRemoved) {
        finalPosterUrl = null
        finalPosterColor = null
      } else if (editPosterFile) {
        const supabase = createClient()
        const fileExt = editPosterFile.name.split('.').pop() || 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('event-posters')
          .upload(fileName, editPosterFile)

        if (uploadError) {
          throw new Error(`Poster upload failed: ${uploadError.message}`)
        }

        const { data: urlData } = supabase.storage
          .from('event-posters')
          .getPublicUrl(fileName)
        finalPosterUrl = urlData.publicUrl
        finalPosterColor = editPosterColor
      }

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
        editIsCompulsory,
        finalPosterUrl,
        finalPosterColor
      )

      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Event updated successfully!')
        setShowEditModal(false)
        router.refresh()
        setTimeout(() => window.location.reload(), 500)
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.')
    } finally {
      setIsUpdating(false)
    }
  }

  const checkedInCount = roster.filter(r => r.attended).length
  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push(backUrl)}
            leftIcon={<ArrowLeft size={16} />}
            className="border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50 rounded-xl shadow-sm"
          >
            Back to Events
          </Button>
          <h1 className="text-xl font-bold text-zinc-950 font-coolvetica">Event Console</h1>
        </div>
        
        {permissions.can_manage_events && (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl shadow-sm text-zinc-700 font-semibold"
              onClick={() => setShowEditModal(true)}
              leftIcon={<Edit2 size={14} />}
            >
              Edit Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl shadow-sm font-semibold ${
                event.is_archived ? "text-amber-600 border-amber-200 hover:bg-amber-50" : "text-zinc-700"
              }`}
              onClick={handleArchiveToggle}
              isLoading={isArchiving}
              disabled={isArchiving || isDeleting}
              leftIcon={event.is_archived ? <RotateCcw size={14} /> : <Archive size={14} />}
            >
              {event.is_archived ? 'Restore' : 'Archive'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 bg-red-50 hover:bg-red-100 rounded-xl shadow-sm text-red-600 font-semibold"
              onClick={handleDelete}
              isLoading={isDeleting}
              disabled={isArchiving || isDeleting}
              leftIcon={<Trash2 size={14} />}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Event Summary */}
        <Card 
          className={`lg:col-span-1 shadow-sm border overflow-hidden rounded-3xl transition-all duration-300 ${
            hasPosterColor
              ? "border-transparent"
              : "border-zinc-200 bg-white"
          }`}
          style={hasPosterColor ? { backgroundColor: cardBgColor } : undefined}
        >
          {event.poster_url && (
            <div className="overflow-hidden h-44 relative border-b border-black/10">
              <img 
                src={event.poster_url} 
                alt={event.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            </div>
          )}

          <CardHeader className={`pb-4 border-b ${
            hasPosterColor 
              ? isDarkBg ? "border-white/15 bg-black/10" : "border-black/10 bg-black/5" 
              : "border-zinc-100 bg-zinc-50/50"
          }`}>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                {event.is_compulsory ? (
                  <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wider border ${
                    hasPosterColor
                      ? isDarkBg 
                        ? "bg-white/20 text-white border-white/25" 
                        : "bg-black/10 text-zinc-955 border-black/15"
                      : "bg-red-100 text-red-600 border-red-200"
                  }`}>
                    Compulsory
                  </span>
                ) : (
                  <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wider border ${
                    hasPosterColor
                      ? isDarkBg 
                        ? "bg-white/15 text-white border-white/20" 
                        : "bg-black/5 text-zinc-955 border-black/10"
                      : "bg-sky-100 text-sky-700 border-sky-200"
                  }`}>
                    Optional
                  </span>
                )}
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full w-fit ml-auto border ${
                  hasPosterColor
                    ? isDarkBg 
                      ? "bg-white/20 text-white border-white/30" 
                      : "bg-black/10 text-zinc-950 border-black/15"
                    : "bg-yellow-50 text-yellow-700 border-yellow-250"
                }`}>
                  <Coins size={12} className={hasPosterColor ? (isDarkBg ? "text-white" : "text-zinc-950") : "text-yellow-600"} />
                  <span className="font-extrabold text-[10px] font-mono">{event.coin_reward ?? 50} C</span>
                </div>
              </div>
              <CardTitle className={`text-lg leading-tight font-extrabold ${textPrimaryClass}`}>
                {event.title}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <p className={`text-xs leading-relaxed font-medium ${textSecondaryClass}`}>
              {event.description || "No description provided."}
            </p>
            
            <div className={`space-y-3 pt-4 border-t ${borderClass} ${metaTextClass}`}>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <Calendar size={15} className={iconCalendarClass} />
                <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <Clock size={15} className={iconClockClass} />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <MapPin size={15} className={iconMapPinClass} />
                <span className="truncate max-w-[200px]">{event.location}</span>
              </div>
            </div>
 
            <div className={`pt-4 border-t grid grid-cols-2 gap-4 ${borderClass}`}>
              <div className={`p-3 rounded-2xl text-center border ${subBoxClass1}`}>
                <span className={`text-[9px] font-bold uppercase tracking-wider block mb-1 ${labelClass}`}>
                  Roster Limit
                </span>
                <span className={`font-extrabold text-base ${textPrimaryClass}`}>
                  {event.capacity}{" "}
                  <span className={`text-[10px] font-semibold ${subTextLabelClass}`}>
                    seats
                  </span>
                </span>
              </div>
              <div className={`p-3 rounded-2xl text-center border ${subBoxClass2}`}>
                <span className={`text-[9px] font-bold uppercase tracking-wider block mb-1 ${
                  hasPosterColor
                    ? (isDarkBg ? "text-white/80" : "text-zinc-900 font-extrabold")
                    : "text-emerald-600/70"
                }`}>
                  Checked In
                </span>
                <span className={`font-extrabold text-base ${
                  hasPosterColor
                    ? (isDarkBg ? "text-white" : "text-zinc-955")
                    : "text-emerald-700"
                }`}>{checkedInCount} <span className={`text-[10px] font-semibold ${
                  hasPosterColor
                    ? (isDarkBg ? "text-white/90" : "text-zinc-800")
                    : "text-emerald-600"
                }`}>here</span></span>
              </div>
            </div>
 
            {event.custom_criteria && Object.keys(event.custom_criteria).length > 0 && (
              <div className={`pt-4 border-t ${
                isDarkBg ? "border-white/10" : "border-zinc-100"
              }`}>
                <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${
                  isDarkBg ? "text-white/70" : "text-zinc-400"
                }`}>Target Criteria</h4>
                <div className="flex flex-wrap gap-1.5">
                  {event.custom_criteria.min_age !== undefined && (
                    <span className={`text-[10px] border px-2 py-0.5 rounded font-bold ${
                      isDarkBg 
                        ? "bg-white/15 border-white/20 text-white" 
                        : "bg-zinc-150 border-zinc-200 text-zinc-700"
                    }`}>Age &ge; {event.custom_criteria.min_age}</span>
                  )}
                  {event.custom_criteria.min_streak !== undefined && (
                    <span className={`text-[10px] border px-2 py-0.5 rounded font-bold ${
                      isDarkBg 
                        ? "bg-white/15 border-white/20 text-white" 
                        : "bg-zinc-150 border-zinc-200 text-zinc-700"
                    }`}>Streak &ge; {event.custom_criteria.min_streak}</span>
                  )}
                  {event.custom_criteria.required_rank && event.custom_criteria.required_rank !== 'none' && (
                    <span className={`text-[10px] border px-2 py-0.5 rounded font-bold ${
                      isDarkBg 
                        ? "bg-white/15 border-white/20 text-white" 
                        : "bg-zinc-150 border-zinc-200 text-zinc-700"
                    }`}>Rank: {event.custom_criteria.required_rank}</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Attendees Roster */}
        <Card className="lg:col-span-2 shadow-sm border border-zinc-200 bg-white rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="pb-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-extrabold text-zinc-950">Attendance Roster</CardTitle>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Filter, search, scan, and process leaves for this event.</p>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-56">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={14} className="text-zinc-400" />
                </div>
                <Input 
                  placeholder="Search name or ticket..." 
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-8 h-9 text-xs border-zinc-200 focus:border-[#0A9EDE] rounded-xl bg-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="h-9 text-xs px-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:border-[#0A9EDE] bg-white font-semibold text-zinc-700"
              >
                <option value="all">All Status</option>
                <option value="checked_in">Checked In</option>
                <option value="absent">Absent</option>
                <option value="pending_leave">Pending Leaves</option>
                <option value="leave_approved">Leave Approved</option>
                <option value="expected">Expected Attendees</option>
              </select>
            </div>
          </CardHeader>

          {/* Bulk Actions Bar */}
          {selectedUserIds.size > 0 && (
            <div className="bg-sky-50/70 border-b border-sky-100 px-5 py-2.5 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-200">
              <span className="text-xs font-bold text-sky-800">
                {selectedUserIds.size} attendee{selectedUserIds.size === 1 ? '' : 's'} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleBulkCheckIn}
                  disabled={isBulkActionPending}
                  className="h-8 text-[11px] px-3 font-extrabold bg-[#0BA242] hover:bg-[#0BA242]/90 text-white rounded-xl shadow-sm"
                >
                  Bulk Check-In
                </Button>
                {statusFilter === 'pending_leave' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleBulkProcessLeaves('approve')}
                      disabled={isBulkActionPending}
                      className="h-8 text-[11px] px-3 font-extrabold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm"
                    >
                      Approve Leaves
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkProcessLeaves('reject')}
                      disabled={isBulkActionPending}
                      className="h-8 text-[11px] px-3 font-extrabold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm"
                    >
                      Reject Leaves
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedUserIds(new Set())}
                  disabled={isBulkActionPending}
                  className="h-8 text-[11px] px-2 rounded-xl text-zinc-500 hover:bg-sky-100/50"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {/* Roster Table Container */}
          <div className="flex-1 relative min-h-[300px]">
            {isLoading ? (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-[#0A9EDE] animate-spin" />
                  <span className="text-xs font-bold text-zinc-500">Querying roster data...</span>
                </div>
              </div>
            ) : null}

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-150">
                    <th className="px-5 py-3 w-12 text-center">
                      <button 
                        onClick={handleSelectAll} 
                        className="text-zinc-400 hover:text-zinc-600 inline-flex items-center justify-center"
                      >
                        {selectedUserIds.size === roster.length && roster.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-sky-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-5 py-3 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Volunteer</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Unit / Division</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {roster.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-16 text-center text-zinc-400 text-xs font-semibold">
                        {searchQuery ? 'No attendees match your search filters.' : 'No attendees found.'}
                      </td>
                    </tr>
                  ) : (
                    roster.map(reg => {
                      const isSelected = selectedUserIds.has(reg.user_id)
                      const isToggling = isTogglingAttendance === reg.id || isTogglingAttendance === reg.user_id
                      return (
                        <tr 
                          key={reg.user_id} 
                          className={`hover:bg-zinc-50/50 transition-colors ${isSelected ? 'bg-sky-50/20' : ''}`}
                        >
                          <td className="px-5 py-3 text-center">
                            <button 
                              onClick={() => handleSelectRow(reg.user_id)} 
                              className="text-zinc-400 hover:text-zinc-600 inline-flex items-center justify-center"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-sky-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-zinc-800 text-xs">{reg.full_name}</span>
                              <span className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                {reg.ticket_code ? reg.ticket_code : 'No ticket generated'}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-[11px] text-zinc-600 font-semibold">
                            {reg.unit_name}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-col gap-1">
                              {reg.status === 'leave_pending' && (
                                <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-[9px] font-extrabold bg-yellow-100 text-yellow-800 border border-yellow-200">
                                  Leave Pending
                                </span>
                              )}
                              {reg.status === 'leave_approved' && (
                                <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-[9px] font-extrabold bg-green-150 text-green-800 border border-green-200">
                                  Leave Approved
                                </span>
                              )}
                              {reg.status === 'leave_rejected' && (
                                <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-[9px] font-extrabold bg-red-100 text-red-800 border border-red-200">
                                  Leave Rejected
                                </span>
                              )}
                              {reg.attended && (
                                <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-[9px] font-extrabold bg-[#0BA242]/10 text-[#0BA242] border border-[#0BA242]/20">
                                  Checked In
                                </span>
                              )}
                              {!reg.attended && reg.status !== 'leave_pending' && reg.status !== 'leave_approved' && (
                                <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-[9px] font-extrabold bg-zinc-100 text-zinc-400 border border-zinc-200">
                                  {reg.status === 'absent' ? 'Absent' : 'Expected'}
                                </span>
                              )}
                              
                              {reg.status === 'leave_pending' && reg.leave_note && (
                                <div className="text-[10px] text-zinc-500 bg-white border border-yellow-250 p-2 rounded-xl mt-1.5 max-w-xs shadow-sm">
                                  <strong className="text-yellow-750 font-bold block mb-0.5">Reason:</strong> 
                                  {reg.leave_note}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {reg.status === 'leave_pending' && permissions.can_manage_events && (
                                <div className="flex items-center gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-7 px-2.5 text-[10px] font-extrabold bg-green-50 text-green-700 border-green-200 hover:bg-green-100 rounded-lg" 
                                    onClick={() => handleProcessLeave(reg.registration_id || reg.id, 'approve')} 
                                    isLoading={isProcessingLeave === (reg.registration_id || reg.id)}
                                  >
                                    Approve
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-7 px-2.5 text-[10px] font-extrabold bg-red-50 text-red-700 border-red-200 hover:bg-red-100 rounded-lg" 
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
                                    className={`h-7 text-[10px] px-2.5 rounded-lg font-extrabold transition-all w-24 flex justify-center items-center group shadow-sm ${
                                      reg.attended
                                        ? 'bg-[#0BA242] border-[#0BA242] hover:bg-[#DD0408] hover:border-[#DD0408] text-white font-bold'
                                        : 'border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50'
                                    }`}
                                    isLoading={isToggling}
                                  >
                                    {!isToggling && (
                                      <>
                                        {reg.attended ? (
                                          <>
                                            <span className="group-hover:hidden">Present</span>
                                            <span className="hidden group-hover:inline">Check Out</span>
                                          </>
                                        ) : (
                                          <>
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
                                    className="h-7 text-[10px] px-2.5 rounded-lg font-extrabold transition-all w-24 border-zinc-250 text-zinc-700 bg-white hover:bg-zinc-50 flex justify-center items-center shadow-sm"
                                    isLoading={isToggling}
                                  >
                                    {!isToggling && (
                                      <>
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
          </div>

          {/* Roster Pagination Footer */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                Page {currentPage} of {totalPages} ({totalCount} total)
              </span>
              <div className="flex items-center gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-lg border-zinc-250 bg-white"
                  disabled={currentPage === 1 || isLoading}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft size={15} />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-lg border-zinc-250 bg-white"
                  disabled={currentPage === totalPages || isLoading}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* EDIT EVENT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full border border-zinc-200 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-zinc-150 flex justify-between items-center bg-zinc-50">
              <h3 className="font-extrabold text-sm text-zinc-950 flex items-center gap-1.5">
                <Edit2 size={14} className="text-[#0A9EDE]" />
                Edit Event Settings
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditEvent} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Event Title</label>
                <Input 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-3 rounded-2xl border border-zinc-200 focus:outline-none focus:border-[#0A9EDE]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Event Poster</label>
                <div className="flex flex-col gap-3">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePosterChange}
                    className="hidden"
                    id="edit-poster-upload"
                  />
                  <label 
                    htmlFor="edit-poster-upload"
                    className="flex flex-col items-center justify-center border border-dashed border-zinc-200 rounded-xl p-3 cursor-pointer hover:bg-zinc-50 transition-colors"
                  >
                    <Plus className="text-zinc-400 mb-0.5" size={18} />
                    <span className="text-[11px] text-zinc-600 font-semibold">
                      {editPosterFile ? editPosterFile.name : 'Upload New Poster'}
                    </span>
                    <span className="text-[9px] text-zinc-400 mt-0.5">JPEG, PNG, WEBP up to 5MB</span>
                  </label>

                  {editPosterPreview && (
                    <div className="flex items-center gap-3 p-2.5 bg-zinc-50 border border-zinc-150 rounded-xl">
                      <img 
                        src={editPosterPreview} 
                        alt="Poster Preview" 
                        className="w-14 h-14 object-cover rounded-lg shadow-sm"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Accent Color</span>
                          <div 
                            className="w-3.5 h-3.5 rounded-full border border-zinc-300"
                            style={{ backgroundColor: editPosterColor }}
                          />
                          <span className="text-xs font-mono font-bold text-zinc-700">{editPosterColor}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditPosterFile(null)
                            setEditPosterPreview('')
                            setEditPosterColor('')
                            setIsPosterRemoved(true)
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Date</label>
                  <Input 
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Time</label>
                  <Input 
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Location / Venue</label>
                <Input 
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Capacity</label>
                  <Input 
                    type="number"
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Coin Reward</label>
                  <Input 
                    type="number"
                    value={editCoinReward}
                    onChange={(e) => setEditCoinReward(e.target.value)}
                    className="h-9 text-xs rounded-xl"
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
                  className="h-8 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isUpdating}
                  isLoading={isUpdating}
                  className="h-8 text-xs bg-zinc-950 border-zinc-950 text-white rounded-xl"
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
