import Link from "next/link";
import { 
  ArrowLeft, Calendar, MapPin, Users, Ticket, 
  Clock, CheckCircle2, ShieldCheck, AlertCircle 
} from "lucide-react";
import QRCode from "react-qr-code";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { claimTicket } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const supabase = await createClient();

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Fetch upcoming events from Supabase ordered by date
  const { data: dbEvents } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });

  // Fetch current user registrations
  const { data: registrations } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('user_id', user.id);

  const registeredMap = new Map();
  registrations?.forEach(reg => {
    registeredMap.set(reg.event_id, reg);
  });

  const events = (dbEvents || []).map(event => {
    const reg = registeredMap.get(event.id);
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      date: new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      time: event.time,
      location: event.location,
      capacity: event.capacity,
      joined: !!reg,
      ticketCode: reg ? reg.ticket_code : null,
      attended: reg ? reg.attended : false
    };
  });

  // Find active registration for QR code display
  const activeRegWithEvent = (registrations || [])
    .filter(reg => !reg.attended)
    .map(reg => {
      const ev = (dbEvents || []).find(e => e.id === reg.event_id);
      return {
        ...reg,
        event: ev
      };
    })
    .find(reg => reg.event);

  // Server Action handler for form submission
  const handleClaim = async (formData: FormData) => {
    "use server";
    const eventId = formData.get("eventId") as string;
    if (eventId) {
      await claimTicket(eventId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-6 h-6 flex items-center justify-center">
              <span className="absolute top-0 w-2 h-2 rounded-full bg-ydc-red"></span>
              <span className="absolute bottom-0 left-0 w-2 h-2 rounded-full bg-ydc-blue"></span>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-ydc-green"></span>
            </div>
            <span className="font-bold text-lg tracking-tight text-white font-coolvetica">YDC Events</span>
          </div>

          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 border border-slate-850 rounded-xl hover:bg-slate-900 transition-colors"
          >
            <ArrowLeft size={16} />
            My Dashboard
          </Link>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Events List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6 font-coolvetica">
            <Calendar size={22} className="text-ydc-blue" />
            Upcoming Activities & Camps
          </h2>

          {events.length > 0 ? (
            events.map((event) => (
              <div 
                key={event.id} 
                className={`p-6 rounded-2xl border bg-slate-900/30 flex flex-col md:flex-row justify-between gap-6 transition-all duration-300 ${
                  event.joined ? 'border-ydc-blue/40 shadow-lg shadow-ydc-blue/5' : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{event.title}</h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-xl">{event.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-500" />
                      {event.date}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-500" />
                      {event.time}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-slate-500" />
                      {event.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-slate-500" />
                      Capacity: {event.capacity} seats
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end shrink-0 md:border-l md:border-slate-850 md:pl-6">
                  {event.joined ? (
                    <div className="text-center w-full md:w-auto">
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded bg-ydc-green/10 border border-ydc-green/20 text-ydc-green mb-3 w-full justify-center">
                        <CheckCircle2 size={12} />
                        {event.attended ? "Attended" : "Registered"}
                      </span>
                      <div className="text-xs font-mono text-slate-500 border border-slate-850 rounded-xl px-4 py-2 bg-slate-950">
                        {event.ticketCode}
                      </div>
                    </div>
                  ) : (
                    <form action={handleClaim} className="w-full">
                      <input type="hidden" name="eventId" value={event.id} />
                      <button 
                        type="submit" 
                        className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-ydc-blue to-ydc-blue/80 font-bold text-white shadow-lg hover:shadow-ydc-blue/15 hover:scale-105 active:scale-95 transition-all text-xs cursor-pointer"
                      >
                        Claim Ticket
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 text-slate-400">
              No upcoming events found. Check back later!
            </div>
          )}
        </div>

        {/* Right Column: Ticket QR Display */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6 font-coolvetica">
            <Ticket size={22} className="text-ydc-green" />
            Active Ticket
          </h2>

          {activeRegWithEvent && activeRegWithEvent.event ? (
            <div className="p-6 rounded-2xl border border-ydc-blue/30 bg-slate-900/50 text-center relative overflow-hidden shadow-xl shadow-ydc-blue/5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-ydc-blue/5 rounded-full blur-xl pointer-events-none"></div>
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-ydc-green/20 bg-ydc-green/10 text-[10px] font-bold text-ydc-green mb-6 uppercase tracking-wider">
                <CheckCircle2 size={12} className="animate-pulse" />
                Valid Pass
              </div>

              <h3 className="font-bold text-white text-base leading-tight">{activeRegWithEvent.event.title}</h3>
              <p className="text-xs text-slate-400 mt-1.5">
                {new Date(activeRegWithEvent.event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &bull; {activeRegWithEvent.event.location}
              </p>

              {/* QR Code */}
              <div className="my-8 mx-auto w-44 aspect-square bg-white border-8 border-slate-950 p-2 rounded-xl flex flex-col items-center justify-center relative shadow-lg">
                <QRCode 
                  value={activeRegWithEvent.ticket_code} 
                  size={120}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
                <div className="absolute -bottom-3 px-3 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300">
                  {activeRegWithEvent.ticket_code}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-6 space-y-3 text-xs text-slate-400 text-left">
                <p>&bull; Present this QR ticket at the entrance scan checkpoint.</p>
                <p>&bull; The scanning agent will instantly check you in and credit **50 YDC Coins** to your ledger.</p>
              </div>

              <div className="mt-6 p-3 rounded-xl bg-slate-950 border border-slate-850 flex items-start gap-3 text-left">
                <ShieldCheck size={18} className="text-ydc-blue shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Tickets are cryptographically linked to your user token. Attempted sharing or double-scanning will lock the ticket automatically.
                </p>
              </div>

            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl border border-slate-800 bg-slate-900/10 text-slate-400">
              <Ticket size={36} className="mx-auto text-slate-650 mb-3 opacity-50" />
              <p className="text-sm font-semibold">No active tickets</p>
              <p className="text-xs text-slate-550 mt-1">Claim a ticket for an upcoming event to generate a QR entry pass.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
