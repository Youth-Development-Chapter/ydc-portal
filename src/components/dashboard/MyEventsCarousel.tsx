'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'

interface EventCarouselItem {
  id: string
  title: string
  date: string
  time: string
  location: string
  ticketCode: string | null
  attended: boolean
  poster_url: string | null
  poster_color: string | null
}

export default function MyEventsCarousel({ events }: { events: EventCarouselItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startTimer = () => {
    if (events.length <= 1) return
    stopTimer()
    timerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % events.length)
    }, 2000)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    startTimer()
    return () => stopTimer()
  }, [events.length])

  if (events.length === 0) {
    return (
      <div className="bg-[#FAFAFA] border border-dashed border-[#E5E5E5] rounded-2xl p-6 text-center text-[#555555] text-xs">
        No events registered yet.{" "}
        <Link href="/events" className="text-[#0A9EDE] font-extrabold hover:underline">
          Find event
        </Link>
      </div>
    )
  }

  // YIQ contrast checker helper
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

  const activeEvent = events[currentIndex]
  const hasPosterColor = !!activeEvent.poster_color
  const cardBgColor = activeEvent.poster_color || '#FFFFFF'
  const isDarkBg = hasPosterColor ? isDarkColor(cardBgColor) : false

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex((prev) => (prev + 1) % events.length)
    startTimer()
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length)
    startTimer()
  }

  return (
    <div 
      className={`relative group w-full overflow-hidden rounded-3xl transition-all duration-300 ${
        hasPosterColor ? "border border-transparent" : "border border-[#E5E5E5]"
      }`}
      onMouseEnter={stopTimer}
      onMouseLeave={startTimer}
    >
      <div 
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {events.map((event) => {
          const localHasPosterColor = !!event.poster_color
          const localCardBgColor = event.poster_color || '#FFFFFF'
          const localIsDarkBg = localHasPosterColor ? isDarkColor(localCardBgColor) : false

          // High contrast style rules based on background type
          const textPrimaryClass = localHasPosterColor
            ? (localIsDarkBg ? "text-white" : "text-zinc-950 font-extrabold")
            : "text-[#1D1D1D]"

          const textSecondaryClass = localHasPosterColor
            ? (localIsDarkBg ? "text-white/80" : "text-zinc-800 font-semibold")
            : "text-[#555555]"

          const borderClass = localHasPosterColor
            ? (localIsDarkBg ? "border-white/15" : "border-black/10")
            : "border-[#F5F5F5]"

          const metaTextClass = localHasPosterColor
            ? (localIsDarkBg ? "text-white/90" : "text-zinc-900 font-bold")
            : "text-[#555555]"

          const iconCalendarClass = localHasPosterColor
            ? (localIsDarkBg ? "text-white" : "text-zinc-800")
            : "text-[#0BA242]"

          const iconClockClass = localHasPosterColor
            ? (localIsDarkBg ? "text-white" : "text-zinc-800")
            : "text-[#DD0408]"

          const iconMapPinClass = localHasPosterColor
            ? (localIsDarkBg ? "text-white" : "text-zinc-800")
            : "text-[#0A9EDE]"

          const badgeClass = localHasPosterColor
            ? (localIsDarkBg 
              ? "bg-white/20 text-white border border-white/20" 
              : "bg-zinc-950/10 text-zinc-950 border border-zinc-950/20")
            : "bg-emerald-50 text-emerald-600 border border-emerald-100"

          return (
            <div 
              key={event.id}
              className="w-full shrink-0 select-none"
              style={{ backgroundColor: localCardBgColor }}
            >
              <Link href="/events" className="block">
                <div 
                  className="relative min-h-[200px] flex flex-col justify-between"
                >
                  {/* Cover Poster */}
                  {event.poster_url && (
                    <div className="overflow-hidden h-36 w-full relative border-b border-black/10">
                      <img 
                        src={event.poster_url} 
                        alt={event.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />
                    </div>
                  )}

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h4 className={`font-bold text-sm leading-tight transition-colors duration-300 ${textPrimaryClass}`}>
                          {event.title}
                        </h4>
                        {event.attended && (
                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${badgeClass}`}>
                            Attended
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] leading-relaxed line-clamp-2 ${textSecondaryClass}`}>
                        Registered Ticket: {event.ticketCode || 'Default'}
                      </p>
                    </div>

                    {/* Event Meta Details */}
                    <div className={`grid grid-cols-2 gap-2 border-t pt-3 transition-colors duration-300 ${borderClass} ${metaTextClass}`}>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className={iconCalendarClass} />
                        <span className="truncate">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className={iconClockClass} />
                        <span className="truncate">{event.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <MapPin size={12} className={iconMapPinClass} />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )
        })}
      </div>

      {/* Navigation Controls (Floating Arrows for Multiple Events) */}
      {events.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer ${
              hasPosterColor
                ? isDarkBg 
                  ? "bg-white/15 hover:bg-white/25 border-white/20 text-white" 
                  : "bg-white/80 hover:bg-white/90 border-black/10 text-zinc-950"
                : "bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-600"
            }`}
            aria-label="Previous event"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={handleNext}
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer ${
              hasPosterColor
                ? isDarkBg 
                  ? "bg-white/15 hover:bg-white/25 border-white/20 text-white" 
                  : "bg-white/80 hover:bg-white/90 border-black/10 text-zinc-950"
                : "bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-600"
            }`}
            aria-label="Next event"
          >
            <ChevronRight size={14} />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-2.5 right-4 flex gap-1 z-10">
            {events.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setCurrentIndex(idx)
                  startTimer()
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex 
                    ? hasPosterColor
                      ? isDarkBg ? "bg-white w-3" : "bg-zinc-950 w-3"
                      : "bg-[#0A9EDE] w-3" 
                    : hasPosterColor
                      ? isDarkBg ? "bg-white/30" : "bg-black/20"
                      : "bg-neutral-250"
                }`}
                aria-label={`Go to event ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
