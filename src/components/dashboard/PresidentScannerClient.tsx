'use client'

import React, { useState, useRef, useEffect } from 'react'
import { QrCode, Loader2, Calendar, MapPin, Search, Check, ChevronDown, ChevronUp, X } from 'lucide-react'
import QrScannerWidget from '@/components/admin/QrScannerWidget'
import { checkInTicket } from '@/app/admin/actions'
import { toast } from 'sonner'


interface ScannerEvent {
  id: string
  title: string
  date: string
  location?: string | null
}

export default function PresidentScannerClient({
  initialEvents,
}: {
  initialEvents: ScannerEvent[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Find event on the same date (today) as default, fallback to first event or empty string
  const getDefaultEventId = () => {
    if (initialEvents.length === 0) return ''
    const todayStr = new Date().toDateString()
    const match = initialEvents.find(ev => new Date(ev.date).toDateString() === todayStr)
    return match ? match.id : initialEvents[0].id
  }

  const [scanEventId, setScanEventId] = useState<string>(() => getDefaultEventId())
  const [ticketInput, setTicketInput] = useState('')
  const [isScanning, setIsScanning] = useState(false)

  // Search and dropdown state
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedEvent = initialEvents.find(ev => ev.id === scanEventId)

  const isEventToday = (dateStr: string) => {
    try {
      const todayStr = new Date().toDateString()
      const eventStr = new Date(dateStr).toDateString()
      return todayStr === eventStr
    } catch {
      return false
    }
  }

  const filteredEvents = initialEvents.filter(ev => {
    const matchQuery = searchQuery.toLowerCase().trim()
    if (!matchQuery) return true
    
    const titleMatch = ev.title.toLowerCase().includes(matchQuery)
    const locMatch = ev.location ? ev.location.toLowerCase().includes(matchQuery) : false
    const dateMatch = new Date(ev.date).toLocaleDateString().includes(matchQuery)
    
    return titleMatch || locMatch || dateMatch
  })

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
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.error(error?.message || 'Error occurred during check-in.')
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200 space-y-5">
      <div className="space-y-1">
        <h3 className="font-extrabold text-sm text-zinc-900 flex items-center gap-2">
          <QrCode size={16} className="text-[#0A9EDE]" />
          Ticket Scanner
        </h3>
        <p className="text-xs text-zinc-500">Scan a volunteer&apos;s QR code or enter their ID to check them in.</p>
      </div>

      {/* Dedicated Searchable Event Selector */}
      <div ref={containerRef} className="space-y-2 relative">
        <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">Event</label>
        
        {/* Selected Event Display Card */}
        {selectedEvent ? (
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between p-4 rounded-2xl border border-zinc-200 hover:border-zinc-300 bg-zinc-50/50 hover:bg-zinc-50 transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#0A9EDE]/10 border border-[#0A9EDE]/20 flex items-center justify-center shrink-0">
                <Calendar size={18} className="text-[#0A9EDE]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-zinc-900 truncate">{selectedEvent.title}</h4>
                  {isEventToday(selectedEvent.date) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 animate-pulse">
                      Today
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1.5">
                  <span className="truncate">{new Date(selectedEvent.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                  {selectedEvent.location && (
                    <>
                      <span className="text-zinc-300">•</span>
                      <span className="flex items-center gap-0.5 text-zinc-400 truncate">
                        <MapPin size={12} />
                        {selectedEvent.location}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="text-zinc-400 group-hover:text-zinc-600 shrink-0 ml-2">
              {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between p-4 rounded-2xl border border-dashed border-zinc-300 hover:border-zinc-400 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 transition-all text-sm font-semibold"
          >
            <span>Select an Event to Scan...</span>
            <ChevronDown size={18} />
          </button>
        )}

        {/* Search & Select Panel Popover */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[320px]">
            {/* Search Filter input */}
            <div className="p-3 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50">
              <Search size={16} className="text-zinc-400 shrink-0" />
              <input
                type="text"
                placeholder="Search events by title, date, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder-zinc-400 text-zinc-800"
                autoFocus
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-full hover:bg-zinc-200 text-zinc-400 hover:text-zinc-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* List items */}
            <div className="overflow-y-auto flex-1 divide-y divide-zinc-100">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((ev) => {
                  const isSelected = ev.id === scanEventId
                  const isToday = isEventToday(ev.date)
                  return (
                    <button
                      key={ev.id}
                      onClick={() => {
                        setScanEventId(ev.id)
                        setIsOpen(false)
                        setSearchQuery('')
                      }}
                      className={`w-full flex items-start gap-3 p-3 text-left transition-colors hover:bg-zinc-50 ${isSelected ? 'bg-sky-50/50' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#0A9EDE]/10 text-[#0A9EDE]' : 'bg-zinc-100 text-zinc-500'}`}>
                        {isSelected ? <Check size={16} /> : <Calendar size={16} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-sm font-semibold truncate ${isSelected ? 'text-[#0A9EDE]' : 'text-zinc-800'}`}>
                            {ev.title}
                          </span>
                          {isToday && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/15 shrink-0">
                              Today
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{new Date(ev.date).toLocaleDateString()}</span>
                          {ev.location && (
                            <>
                              <span className="text-zinc-300">•</span>
                              <span className="flex items-center gap-0.5 text-zinc-400 truncate max-w-[150px]">
                                <MapPin size={10} />
                                {ev.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="p-8 text-center text-zinc-400 text-sm">
                  No events found matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <QrScannerWidget
        onScan={(value) => {
          setTicketInput(value)
          if (value.trim() && scanEventId) {
            setTimeout(() => handleTicketScan(value), 300)
          }
        }}
        label="Scan QR Code"
      />

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
  )
}
