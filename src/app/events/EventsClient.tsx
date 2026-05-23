"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Calendar, MapPin, Users, Ticket, 
  Clock, CheckCircle2, ShieldCheck, AlertCircle
} from "lucide-react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/Button";
import { claimTicket } from "@/app/actions";
import PageHeader from "@/components/ui/PageHeader";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  joined: boolean;
  ticketCode: string | null;
  attended: boolean;
}

interface ActiveTicket {
  ticket_code: string;
  attended: boolean;
  event: {
    title: string;
    date: string;
    location: string;
  };
}

interface EventsClientProps {
  events: Event[];
  activeTicket: ActiveTicket | null;
}

export default function EventsClient({ events, activeTicket }: EventsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"discover" | "tickets">("discover");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const registeredEvents = events.filter((e) => e.joined);

  const handleClaim = (eventId: string) => {
    setError(null);
    startTransition(async () => {
      const res = await claimTicket(eventId);
      if (res && res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
      setActiveTab("tickets");
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with standard Back button */}
      <PageHeader title="YDC Activities" backHref="/dashboard" />

      {/* Premium Header Banner */}
      <div className="bg-gradient-to-br from-[#1D1D1D] to-[#333333] text-white rounded-3xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <Ticket size={140} />
        </div>
        <div className="relative z-10 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A9EDE] bg-[#0A9EDE]/10 px-2.5 py-1 rounded-full border border-[#0A9EDE]/20">
            Camps & Gatherings
          </span>
          <h1 className="text-3xl font-extrabold relative z-10 font-coolvetica pt-2">
            YDC Events
          </h1>
          <p className="text-sm text-[#A3A3A3] relative z-10 max-w-[85%] leading-relaxed pt-1">
            Register for official Camps, Workshops, and local Activities.
          </p>
        </div>
      </div>

      {/* Modern Glassmorphic Tab Selector */}
      <div className="flex bg-[#F5F5F5] p-1.5 rounded-2xl border border-[#E5E5E5] gap-1">
        <button
          onClick={() => setActiveTab("discover")}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "discover"
              ? "bg-white text-[#1D1D1D] shadow-sm border border-[#E5E5E5]"
              : "text-[#555555] hover:text-[#1D1D1D]"
          }`}
        >
          <Calendar size={16} className={activeTab === "discover" ? "text-[#0A9EDE]" : ""} />
          Discover ({events.length})
        </button>
        <button
          onClick={() => setActiveTab("tickets")}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "tickets"
              ? "bg-white text-[#1D1D1D] shadow-sm border border-[#E5E5E5]"
              : "text-[#555555] hover:text-[#1D1D1D]"
          }`}
        >
          <Ticket size={16} className={activeTab === "tickets" ? "text-[#0BA242]" : ""} />
          My Passes ({registeredEvents.length})
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2.5">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Content Renderer */}
      <div className="space-y-4">
        {activeTab === "discover" ? (
          /* Discover Events Tab */
          events.length === 0 ? (
            <div className="bg-white border border-[#E5E5E5] rounded-3xl p-10 text-center space-y-4">
              <Calendar size={36} className="mx-auto text-[#A3A3A3]" />
              <div>
                <h3 className="font-bold text-lg text-[#1D1D1D]">No Upcoming Events</h3>
                <p className="text-xs text-[#555555] mt-1">
                  Check back later! We are cooking up some exciting activities for you.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div 
                  key={event.id}
                  className={`bg-white border rounded-3xl p-5 shadow-sm transition-all duration-300 relative overflow-hidden ${
                    event.joined ? "border-[#0A9EDE]/50 ring-1 ring-[#0A9EDE]/20" : "border-[#E5E5E5]"
                  }`}
                >
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-[#1D1D1D] text-lg leading-tight">{event.title}</h3>
                        {event.joined && (
                          <span className="shrink-0 text-[9px] font-extrabold uppercase tracking-wide bg-[#0BA242]/10 text-[#0BA242] border border-[#0BA242]/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 size={10} /> {event.attended ? "Attended" : "Claimed"}
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

                    {!event.joined && (
                      <div className="pt-2">
                        <Button
                          onClick={() => handleClaim(event.id)}
                          isLoading={isPending}
                          disabled={isPending}
                          className="w-full bg-[#0A9EDE] hover:bg-[#0A9EDE]/90 text-white"
                        >
                          Claim Entry Ticket
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* My Tickets Tab */
          registeredEvents.length === 0 ? (
            <div className="bg-white border border-[#E5E5E5] rounded-3xl p-10 text-center space-y-4">
              <div className="w-16 h-16 bg-[#F5F5F5] text-[#A3A3A3] rounded-full flex items-center justify-center mx-auto">
                <Ticket size={28} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#1D1D1D]">No Passes Found</h3>
                <p className="text-xs text-[#555555] mt-1">
                  You haven&apos;t claimed any event tickets yet. Head over to the discover tab to claim one!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* If there is an active QR pass, show it prominently */}
              {activeTicket ? (
                <div className="bg-white border border-[#0A9EDE]/30 rounded-3xl p-6 shadow-md text-center relative overflow-hidden space-y-5 animate-in zoom-in duration-300">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#0BA242]/20 bg-[#0BA242]/5 text-[10px] font-bold text-[#0BA242] uppercase tracking-wider">
                    <CheckCircle2 size={12} className="animate-pulse" />
                    Valid QR Entry Pass
                  </div>

                  <div>
                    <h3 className="font-bold text-[#1D1D1D] text-lg leading-tight">{activeTicket.event.title}</h3>
                    <p className="text-xs text-[#555555] mt-1">
                      {new Date(activeTicket.event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &bull; {activeTicket.event.location}
                    </p>
                  </div>

                  {/* QR Box */}
                  <div className="my-6 mx-auto w-44 aspect-square bg-[#FAFAFA] border border-[#E5E5E5] p-3 rounded-2xl flex flex-col items-center justify-center relative shadow-sm">
                    <QRCode 
                      value={activeTicket.ticket_code} 
                      size={140}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    />
                    <div className="absolute -bottom-3 px-3 py-0.5 rounded-full bg-white border border-[#E5E5E5] text-[10px] font-mono text-[#555555] shadow-sm">
                      {activeTicket.ticket_code}
                    </div>
                  </div>

                  <div className="border-t border-[#F5F5F5] pt-5 space-y-3.5 text-xs text-[#555555] text-left">
                    <div className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0BA242] shrink-0 mt-1.5" />
                      <p>Present this QR pass at the activity scan checkpoint.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0BA242] shrink-0 mt-1.5" />
                      <p>The checking agent will scan this pass to credit <strong className="text-[#0A9EDE] font-extrabold">+50 Coins</strong> to your ledger.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] flex items-start gap-3 text-left">
                    <ShieldCheck size={18} className="text-[#0A9EDE] shrink-0 mt-0.5" />
                    <p className="text-[10px] text-[#A3A3A3] leading-relaxed">
                      Tickets are securely tied to your YDC Profile. Sharing, duplicating, or double-scanning this ticket code will lock it automatically.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* List of other registered tickets */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-[#1D1D1D] px-1">Registration History</h4>
                {registeredEvents.map((tkt) => (
                  <div key={tkt.id} className="bg-white border border-[#E5E5E5] rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div>
                      <h5 className="font-bold text-sm text-[#1D1D1D] mb-1">{tkt.title}</h5>
                      <span className="text-[10px] font-mono text-[#A3A3A3] bg-[#FAFAFA] border border-[#E5E5E5] px-2 py-0.5 rounded">
                        {tkt.ticketCode}
                      </span>
                    </div>
                    <div>
                      {tkt.attended ? (
                        <span className="text-[9px] font-extrabold uppercase bg-gray-100 text-gray-500 px-2 py-1 rounded-full border border-gray-200">
                          Attended
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold uppercase bg-[#0BA242]/10 text-[#0BA242] px-2 py-1 rounded-full border border-[#0BA242]/20">
                          Confirmed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
