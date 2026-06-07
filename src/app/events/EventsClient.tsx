"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  Calendar, MapPin, Users, Ticket, 
  Clock, CheckCircle2, ShieldCheck, AlertCircle, QrCode, X, CalendarOff
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { claimTicket } from "@/app/actions";
import PageHeader from "@/components/ui/PageHeader";

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
}

interface EventsClientProps {
  upcomingEvents: Event[];
  pastEvents: Event[];
  userId: string;
}

export default function EventsClient({ upcomingEvents, pastEvents, userId }: EventsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [showQR, setShowQR] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
    const reason = prompt("Please provide a reason for your leave:");
    if (!reason) return;

    setError(null);
    startTransition(async () => {
      const res = await fetch('/api/events/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, leaveNote: reason })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to request leave.');
        return;
      }
      router.refresh();
    });
  };

  const renderEventList = (events: Event[]) => {
    if (events.length === 0) {
      return (
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-10 text-center space-y-4">
          <Calendar size={36} className="mx-auto text-[#A3A3A3]" />
          <div>
            <h3 className="font-bold text-lg text-[#1D1D1D]">No Events Found</h3>
            <p className="text-xs text-[#555555] mt-1">
              There are no events in this category.
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
          
          return (
            <div 
              key={event.id}
              className={`bg-white border rounded-3xl p-5 shadow-sm transition-all duration-300 relative overflow-hidden ${
                isExpected ? "border-[#0A9EDE]/50 ring-1 ring-[#0A9EDE]/20" : "border-[#E5E5E5]"
              }`}
            >
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-[#1D1D1D] text-lg leading-tight flex items-center gap-2">
                      {event.title}
                      {event.is_compulsory && (
                        <span className="text-[9px] font-extrabold uppercase bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Compulsory</span>
                      )}
                    </h3>
                    
                    {event.status !== 'none' && (
                      <span className={`shrink-0 text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full flex items-center gap-1
                        ${event.status === 'present' ? 'bg-[#0BA242]/10 text-[#0BA242] border border-[#0BA242]/20' : ''}
                        ${event.status === 'registered' ? 'bg-[#0A9EDE]/10 text-[#0A9EDE] border border-[#0A9EDE]/20' : ''}
                        ${event.status === 'absent' ? 'bg-red-100 text-red-600 border border-red-200' : ''}
                        ${event.status.startsWith('leave') ? 'bg-orange-100 text-orange-600 border border-orange-200' : ''}
                      `}>
                        {event.status === 'present' && <CheckCircle2 size={10} />}
                        {event.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#555555] mt-1.5 leading-relaxed">{event.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-[#555555] border-t border-[#F5F5F5] pt-3.5">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-[#0A9EDE]" />
                    <span className="truncate">{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-[#DD0408]" />
                    <span className="truncate">{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-[#0BA242]" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-[#A3A3A3]" />
                    <span className="truncate">Capacity: {event.capacity} seats</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  {activeTab === "upcoming" && canJoin && (
                    <Button
                      onClick={() => handleJoin(event.id)}
                      isLoading={isPending}
                      disabled={isPending}
                      className="flex-1 bg-[#0A9EDE] hover:bg-[#0A9EDE]/90 text-white"
                    >
                      Join Event
                    </Button>
                  )}
                  {activeTab === "upcoming" && canLeave && (
                    <Button
                      onClick={() => handleMarkLeave(event.id)}
                      isLoading={isPending}
                      disabled={isPending}
                      variant="outline"
                      className="flex-1"
                    >
                      <CalendarOff size={14} className="mr-2" /> Mark Leave
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

      <div className="flex bg-[#F5F5F5] p-1.5 rounded-2xl border border-[#E5E5E5] gap-1">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "upcoming"
              ? "bg-white text-[#1D1D1D] shadow-sm border border-[#E5E5E5]"
              : "text-[#555555] hover:text-[#1D1D1D]"
          }`}
        >
          Upcoming ({upcomingEvents.length})
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "past"
              ? "bg-white text-[#1D1D1D] shadow-sm border border-[#E5E5E5]"
              : "text-[#555555] hover:text-[#1D1D1D]"
          }`}
        >
          Past ({pastEvents.length})
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2.5">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {renderEventList(activeTab === "upcoming" ? upcomingEvents : pastEvents)}

      {/* Master QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#0A9EDE]/30 rounded-3xl p-6 shadow-2xl text-center relative max-w-sm w-full animate-in zoom-in duration-300">
            <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-800">
              <X size={24} />
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#0BA242]/20 bg-[#0BA242]/5 text-[10px] font-bold text-[#0BA242] uppercase tracking-wider mb-4">
              <CheckCircle2 size={12} className="animate-pulse" />
              Master QR ID
            </div>

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
          </div>
        </div>
      )}
    </div>
  );
}
