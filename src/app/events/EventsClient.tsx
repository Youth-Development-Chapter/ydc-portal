"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  Calendar, MapPin, Users, 
  Clock, CheckCircle2, ShieldCheck, AlertCircle, QrCode, X, CalendarOff,
  History, Sparkles, Layers, Undo2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { claimTicket, getEventsFromServer } from "@/app/actions";
import PageHeader from "@/components/ui/PageHeader";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

const QRCode = dynamic(() => import("react-qr-code"), { ssr: false });

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  is_compulsory: boolean;
  status: 'none' | 'registered' | 'present' | 'absent' | 'leave_pending' | 'leave_approved' | 'leave_rejected';
  isUpcoming?: boolean;
  poster_url?: string | null;
  poster_color?: string | null;
}

interface EventsClientProps {
  initialUpcomingEvents: Event[];
  initialPastEvents: Event[];
  initialCounts: {
    all: number;
    upcoming: number;
    past: number;
    compulsory: number;
    optional: number;
    checked_in: number;
    leave: number;
  };
  userId: string;
}

export default function EventsClient({ initialUpcomingEvents, initialPastEvents, initialCounts, userId }: EventsClientProps) {
  const router = useRouter();

  // Filters State
  type FilterType = "all" | "upcoming" | "past" | "compulsory" | "optional" | "checked_in" | "leave";
  const [activeFilter, setActiveFilter] = useState<FilterType>("upcoming");

  const [eventsCache, setEventsCache] = useState<Record<FilterType, {
    list: Event[];
    hasMore: boolean;
    offset: number;
  }>>({
    upcoming: { list: initialUpcomingEvents, hasMore: initialCounts.upcoming > initialUpcomingEvents.length, offset: initialUpcomingEvents.length },
    past: { list: initialPastEvents, hasMore: initialCounts.past > initialPastEvents.length, offset: initialPastEvents.length },
    compulsory: { list: [], hasMore: initialCounts.compulsory > 0, offset: 0 },
    optional: { list: [], hasMore: initialCounts.optional > 0, offset: 0 },
    checked_in: { list: [], hasMore: initialCounts.checked_in > 0, offset: 0 },
    leave: { list: [], hasMore: initialCounts.leave > 0, offset: 0 },
    all: { list: [], hasMore: initialCounts.all > 0, offset: 0 }
  });

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveEventId, setLeaveEventId] = useState<string | null>(null);
  const [leaveReason, setLeaveReason] = useState("");

  const [checkInStatus, setCheckInStatus] = useState<{
    status: 'success' | 'already_checked_in' | 'failed'
    userName: string
    eventTitle: string
    error?: string | null
  } | null>(null);

  // Sync state if initial lists change from server (e.g. ticket claimed / check-in success)
  useEffect(() => {
    setEventsCache(prev => ({
      ...prev,
      upcoming: { list: initialUpcomingEvents, hasMore: initialCounts.upcoming > initialUpcomingEvents.length, offset: initialUpcomingEvents.length },
      past: { list: initialPastEvents, hasMore: initialCounts.past > initialPastEvents.length, offset: initialPastEvents.length }
    }));
  }, [initialUpcomingEvents, initialPastEvents]);

  // Load dynamically when filter tab is selected
  useEffect(() => {
    const activeCache = eventsCache[activeFilter];
    if (activeCache.list.length === 0 && initialCounts[activeFilter] > 0) {
      loadEvents(activeFilter, 0);
    }
  }, [activeFilter]);

  const loadEvents = async (filter: FilterType, offset: number) => {
    setIsLoadingMore(true);
    try {
      const res = await getEventsFromServer(offset, 3, filter);
      if (res && 'error' in res) {
        toast.error(res.error);
      } else if (res) {
        setEventsCache(prev => {
          const current = prev[filter];
          const newList = offset === 0 ? res.events : [...current.list, ...res.events];
          return {
            ...prev,
            [filter]: {
              list: newList as Event[],
              hasMore: res.hasMore,
              offset: offset + 3
            }
          };
        });
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to load events");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const activeCache = eventsCache[activeFilter];
    loadEvents(activeFilter, activeCache.offset);
  };

  // Subscribe to real-time event check-ins
  useEffect(() => {
    if (!showQR) return;

    const supabase = createClient();
    const channel = supabase.channel(`checkin-${userId}`, {
      config: {
        broadcast: { self: true }
      }
    });

    channel.on('broadcast', { event: 'status' }, (payload) => {
      const data = payload.payload as {
        status: 'success' | 'already_checked_in' | 'failed'
        userName: string
        eventTitle: string
        error?: string | null
      };

      setCheckInStatus(data);

      if (data.status === 'success') {
        toast.success('Check-In Complete!', {
          description: `${data.userName}, you have successfully checked in for "${data.eventTitle}".`
        });
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      } else if (data.status === 'already_checked_in') {
        toast.warning('Already Checked In', {
          description: `${data.userName} is already checked in for "${data.eventTitle}".`
        });
      } else if (data.status === 'failed') {
        toast.error('Check-In Failed', {
          description: data.error || 'You are not eligible or registered for this event.'
        });
      }

      router.refresh();
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showQR, userId, router]);

  const handleJoin = (eventId: string) => {
    setError(null);
    startTransition(async () => {
      const res = await claimTicket(eventId);
      if (res && res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  const handleMarkLeave = (eventId: string) => {
    setLeaveEventId(eventId);
    setLeaveReason("");
    setShowLeaveModal(true);
  };

  const submitLeaveRequest = () => {
    if (!leaveEventId || !leaveReason.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch('/api/events/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: leaveEventId, leaveNote: leaveReason })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to request leave.');
        return;
      }
      setShowLeaveModal(false);
      setLeaveEventId(null);
      setLeaveReason("");
      toast.success("Leave requested successfully.");
      router.refresh();
    });
  };

  const handleRevokeLeave = (eventId: string) => {
    if (!confirm("Are you sure you want to revoke your leave request?")) return;

    setError(null);
    startTransition(async () => {
      const res = await fetch('/api/events/leave', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to revoke leave request.');
        return;
      }
      toast.success('Leave Request Revoked', {
        description: 'Your leave request has been successfully revoked.'
      });
      router.refresh();
    });
  };

  const renderEventList = (events: Event[]) => {
    if (events.length === 0) {
      const getEmptyMessage = () => {
        switch (activeFilter) {
          case "upcoming":
            return "There are no upcoming events.";
          case "past":
            return "There are no past events.";
          case "compulsory":
            return "There are no compulsory events.";
          case "optional":
            return "There are no optional events.";
          case "checked_in":
            return "You have not checked in to any events yet.";
          case "leave":
            return "You have no pending or approved leave requests.";
          case "all":
          default:
            return "There are no events scheduled.";
        }
      };

      return (
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-10 text-center space-y-4">
          <Calendar size={36} className="mx-auto text-[#A3A3A3]" />
          <div>
            <h3 className="font-bold text-lg text-[#1D1D1D]">No Events Found</h3>
            <p className="text-xs text-[#555555] mt-1">
              {getEmptyMessage()}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {events.map((event) => {
          const isExpected = event.is_compulsory || event.status === 'registered';
          const canJoin = !event.is_compulsory && event.status === 'none';
          const canLeave = isExpected && event.status !== 'leave_pending' && event.status !== 'leave_approved' && event.status !== 'present' && event.status !== 'absent';
          
          const hasPosterColor = !!event.poster_color;
          const cardBgColor = event.poster_color || '#FFFFFF';
          
          // YIQ contrast color checker
          const isDarkColor = (hex: string) => {
            if (!hex) return false;
            const color = hex.replace('#', '');
            if (color.length !== 6) return false;
            const r = parseInt(color.substring(0, 2), 16);
            const g = parseInt(color.substring(2, 4), 16);
            const b = parseInt(color.substring(4, 6), 16);
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            return yiq < 140;
          };

          const isDarkBg = hasPosterColor ? isDarkColor(cardBgColor) : false;

          // Define dynamic theme classes based on custom poster color
          const textPrimaryClass = hasPosterColor
            ? (isDarkBg ? "text-white" : "text-zinc-950 font-extrabold")
            : "text-[#1D1D1D]";

          const textSecondaryClass = hasPosterColor
            ? (isDarkBg ? "text-white/85" : "text-zinc-800 font-semibold")
            : "text-[#555555]";

          const borderClass = hasPosterColor
            ? (isDarkBg ? "border-white/15" : "border-black/10")
            : "border-[#F5F5F5]";

          const metaTextClass = hasPosterColor
            ? (isDarkBg ? "text-white/80" : "text-zinc-900 font-bold")
            : "text-[#555555]";

          const iconCalendarClass = hasPosterColor
            ? (isDarkBg ? "text-white" : "text-zinc-800")
            : "text-[#0A9EDE]";

          const iconClockClass = hasPosterColor
            ? (isDarkBg ? "text-white" : "text-zinc-800")
            : "text-[#DD0408]";

          const iconMapPinClass = hasPosterColor
            ? (isDarkBg ? "text-white" : "text-zinc-800")
            : "text-[#0BA242]";

          const iconUsersClass = hasPosterColor
            ? (isDarkBg ? "text-white" : "text-zinc-800")
            : "text-[#A3A3A3]";

          return (
            <div 
              key={event.id}
              className={`border rounded-3xl p-5 shadow-sm transition-all duration-300 relative overflow-hidden ${
                hasPosterColor
                  ? "border-transparent"
                  : isExpected 
                    ? "bg-white border-[#0A9EDE]/50 ring-1 ring-[#0A9EDE]/20" 
                    : "bg-white border-[#E5E5E5]"
              }`}
              style={hasPosterColor ? { backgroundColor: cardBgColor } : undefined}
            >
              {event.poster_url && (
                <div className="-mx-5 -mt-5 mb-4 overflow-hidden h-44 relative border-b border-black/10">
                  <img 
                    src={event.poster_url} 
                    alt={event.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className={`font-bold text-lg leading-tight flex items-center gap-2 ${textPrimaryClass}`}>
                      {event.title}
                      {event.is_compulsory && (
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          hasPosterColor
                            ? isDarkBg 
                              ? "bg-white/20 text-white border border-white/20" 
                              : "bg-zinc-950/15 text-zinc-950 border border-zinc-950/25"
                            : "bg-red-100 text-red-600 border border-red-200"
                        }`}>
                          Compulsory
                        </span>
                      )}
                    </h3>
                    
                    {event.status !== 'none' && (
                      <span className={`shrink-0 text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full flex items-center gap-1
                        ${event.status === 'present' 
                          ? hasPosterColor
                            ? isDarkBg 
                              ? 'bg-white/30 text-white border border-white/40' 
                              : 'bg-zinc-950/15 text-zinc-955 border border-zinc-955/25' 
                            : 'bg-[#0BA242]/10 text-[#0BA242] border border-[#0BA242]/20' 
                          : ''}
                        ${event.status === 'registered' 
                          ? hasPosterColor
                            ? isDarkBg 
                              ? 'bg-white/20 text-white border border-white/30' 
                              : 'bg-zinc-950/10 text-zinc-950 border border-zinc-950/20' 
                            : 'bg-[#0A9EDE]/10 text-[#0A9EDE] border border-[#0A9EDE]/20' 
                          : ''}
                        ${event.status === 'absent' 
                          ? hasPosterColor
                            ? isDarkBg 
                              ? 'bg-white/15 text-white border border-white/20' 
                              : 'bg-zinc-950/10 text-zinc-950 border border-zinc-950/20' 
                            : 'bg-red-100 text-red-655 border border-red-200' 
                          : ''}
                        ${event.status.startsWith('leave') 
                          ? hasPosterColor
                            ? isDarkBg 
                              ? 'bg-white/20 text-white border border-white/25' 
                              : 'bg-zinc-950/10 text-zinc-950 border border-zinc-950/20' 
                            : 'bg-orange-100 text-orange-600 border border-orange-200' 
                          : ''}
                      `}>
                        {event.status === 'present' && <CheckCircle2 size={10} />}
                        {event.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-1.5 leading-relaxed ${textSecondaryClass}`}>{event.description}</p>
                </div>

                <div className={`grid grid-cols-2 gap-3 text-xs border-t pt-3.5 ${borderClass} ${metaTextClass}`}>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className={iconCalendarClass} />
                    <span className="truncate">{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className={iconClockClass} />
                    <span className="truncate">{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className={iconMapPinClass} />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className={iconUsersClass} />
                    <span className="truncate">Capacity: {event.capacity} seats</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  {event.isUpcoming && canJoin && (
                    <Button
                      onClick={() => handleJoin(event.id)}
                      isLoading={isPending}
                      disabled={isPending}
                      className={`flex-1 min-w-[120px] ${
                        isDarkBg 
                          ? "bg-white text-zinc-900 hover:bg-white/95 border-transparent font-bold shadow-md" 
                          : "bg-[#0A9EDE] hover:bg-[#0A9EDE]/90 text-white"
                      }`}
                    >
                      Join Event
                    </Button>
                  )}
                  {event.isUpcoming && canLeave && (
                    <Button
                      onClick={() => handleMarkLeave(event.id)}
                      isLoading={isPending}
                      disabled={isPending}
                      variant="outline"
                      className={`flex-1 min-w-[120px] ${
                        isDarkBg 
                          ? "border-white/40 hover:bg-white/15 text-white hover:text-white" 
                          : ""
                      }`}
                    >
                      <CalendarOff size={14} className="mr-2" /> Mark Leave
                    </Button>
                  )}
                  {event.isUpcoming && event.status === 'leave_pending' && (
                    <Button
                      onClick={() => handleRevokeLeave(event.id)}
                      isLoading={isPending}
                      disabled={isPending}
                      variant="outline"
                      className={`flex-1 min-w-[120px] ${
                        isDarkBg 
                          ? "border-white/45 hover:bg-white/20 text-white hover:text-white" 
                          : "border-amber-200 hover:bg-amber-50 hover:text-amber-700 text-amber-600"
                      }`}
                    >
                      <Undo2 size={14} className="mr-2" /> Revoke Leave
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    );
  };

  const filterOptions = [
    { id: "upcoming" as const, label: "Upcoming", count: initialCounts.upcoming, icon: Clock },
    { id: "past" as const, label: "Past", count: initialCounts.past, icon: History },
    { id: "compulsory" as const, label: "Compulsory", count: initialCounts.compulsory, icon: AlertCircle },
    { id: "optional" as const, label: "Optional", count: initialCounts.optional, icon: Sparkles },
    { id: "checked_in" as const, label: "Checked In", count: initialCounts.checked_in, icon: CheckCircle2 },
    { id: "leave" as const, label: "Leave", count: initialCounts.leave, icon: CalendarOff },
    { id: "all" as const, label: "All", count: initialCounts.all, icon: Layers },
  ];

  const filteredEvents = eventsCache[activeFilter].list;

  return (
    <div className="space-y-6 pb-20">
      <PageHeader title="YDC Activities" backHref="/dashboard" />

      {/* Premium Header Banner */}
      <div className="bg-gradient-to-br from-[#1D1D1D] to-[#333333] text-white rounded-3xl p-6 shadow-lg relative overflow-hidden flex justify-between items-center">
        <div className="relative z-10 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A9EDE] bg-[#0A9EDE]/10 px-2.5 py-1 rounded-full border border-[#0A9EDE]/20">
            Camps & Gatherings
          </span>
          <h1 className="text-3xl font-extrabold relative z-10 font-coolvetica pt-2">
            YDC Events
          </h1>
        </div>
        <Button onClick={() => setShowQR(true)} className="bg-[#0BA242] hover:bg-[#0BA242]/90 text-white rounded-xl z-10 shadow-lg">
          <QrCode size={18} className="mr-2" /> My QR
        </Button>
      </div>

      {/* Scrolling Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none -mx-4 px-4 hide-scrollbar select-none">
        {filterOptions.map((opt) => {
          const isActive = activeFilter === opt.id;
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              onClick={() => setActiveFilter(opt.id)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 border ${
                isActive
                  ? "bg-gradient-to-r from-[#0A9EDE] to-[#0A9EDE]/80 text-white border-transparent shadow-md shadow-[#0A9EDE]/20 scale-[1.02]"
                  : "bg-white hover:bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-300 active:scale-[0.98]"
              }`}
            >
              <Icon size={14} className={isActive ? "text-white" : "text-zinc-400"} />
              <span>{opt.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors duration-300 ${
                isActive ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
              }`}>
                {opt.count}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2.5">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {isLoadingMore && filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-[#E5E5E5] rounded-3xl space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A9EDE]"></div>
          <p className="text-xs text-zinc-500 font-semibold">Loading events...</p>
        </div>
      ) : (
        renderEventList(filteredEvents)
      )}

      {eventsCache[activeFilter].hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleLoadMore}
            isLoading={isLoadingMore}
            disabled={isLoadingMore}
            className="px-6 py-2.5 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl shadow-sm text-xs font-bold transition duration-300"
          >
            Load More Events
          </Button>
        </div>
      )}

      {/* Master QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#0A9EDE]/30 rounded-3xl p-6 shadow-2xl text-center relative max-w-sm w-full animate-in zoom-in duration-300">
            <button onClick={() => { setShowQR(false); setCheckInStatus(null); }} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-800">
              <X size={24} />
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#0BA242]/20 bg-[#0BA242]/5 text-[10px] font-bold text-[#0BA242] uppercase tracking-wider mb-4">
              <CheckCircle2 size={12} className="animate-pulse" />
              Master QR ID
            </div>

            {checkInStatus && (checkInStatus.status === 'success' || checkInStatus.status === 'already_checked_in') ? (
              <div className="my-6 flex flex-col items-center justify-center py-4 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-24 h-24 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                  <CheckCircle2 size={56} className="stroke-[2.5px] animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-base text-zinc-900">Check-In Successful!</h4>
                  <p className="text-xs text-zinc-500 max-w-[240px] mx-auto leading-relaxed">
                    {checkInStatus.userName}, you are now marked as **Present** for the event &quot;{checkInStatus.eventTitle}&quot;.
                  </p>
                </div>
                {checkInStatus.status === 'already_checked_in' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Already checked in
                  </span>
                )}
              </div>
            ) : checkInStatus && checkInStatus.status === 'failed' ? (
              <div className="my-6 flex flex-col items-center justify-center py-4 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-24 h-24 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shadow-inner">
                  <AlertCircle size={56} className="stroke-[2.5px] animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-base text-red-600">Check-In Failed</h4>
                  <p className="text-xs text-zinc-500 max-w-[240px] mx-auto leading-relaxed">
                    {checkInStatus.error || 'You are not eligible or registered for this event.'}
                  </p>
                </div>
                <button
                  onClick={() => setCheckInStatus(null)}
                  className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl transition shadow-sm"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <div className="my-6 mx-auto w-48 aspect-square bg-[#FAFAFA] border border-[#E5E5E5] p-3 rounded-2xl flex flex-col items-center justify-center relative shadow-sm">
                  <QRCode value={userId} size={160} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
                  <div className="absolute -bottom-3 px-3 py-0.5 rounded-full bg-white border border-[#E5E5E5] text-[10px] font-mono text-[#555555] shadow-sm">
                    Member ID: YDC-{userId.substring(0, 8).toUpperCase()}
                  </div>
                </div>

                <div className="p-3 mt-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] flex items-start gap-3 text-left">
                  <ShieldCheck size={18} className="text-[#0A9EDE] shrink-0 mt-0.5" />
                  <p className="text-[10px] text-[#A3A3A3] leading-relaxed">
                    Present this QR code to the scanner agent at any YDC event you are eligible for to check in.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl text-left relative max-w-sm w-full animate-in zoom-in duration-300">
            <button 
              onClick={() => { setShowLeaveModal(false); setLeaveEventId(null); }} 
              className="absolute top-4 right-4 text-zinc-450 hover:text-zinc-800"
            >
              <X size={24} />
            </button>
            <h3 className="font-extrabold text-lg text-[#1D1D1D] mb-2">
              Apply for Leave
            </h3>
            <p className="text-xs text-[#555555] mb-4">
              Please provide a valid reason for missing this compulsory event. Leave requests are subject to approval.
            </p>
            
            <textarea
              className="w-full text-sm p-3 rounded-2xl border border-zinc-200 focus:outline-none focus:border-[#0A9EDE] bg-zinc-50/50 mb-4 font-medium"
              placeholder="Type your reason here..."
              rows={4}
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              disabled={isPending}
            />

            <div className="flex gap-2.5">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl"
                onClick={() => { setShowLeaveModal(false); setLeaveEventId(null); }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-[#0A9EDE] hover:bg-[#0A9EDE]/90 text-white rounded-xl"
                onClick={submitLeaveRequest}
                disabled={isPending || !leaveReason.trim()}
                isLoading={isPending}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
