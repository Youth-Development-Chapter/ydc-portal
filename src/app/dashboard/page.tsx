import React from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import { Award, Coins, Flame, MapPin, GraduationCap, Calendar, Clock, ChevronRight, LogOut, BookOpen, AlertTriangle } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function UserDashboard() {
  const supabase = await createClient();
  
  // Fetch secure user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Fetch real profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Map real data to UI (fallback to defaults if fields don't exist yet)
  const name = profile?.full_name || user.user_metadata?.full_name || "YDC Member";
  
  const division = profile?.division || "Multan";
  const memberId = profile?.id ? `YDC-${profile.id.substring(0, 8).toUpperCase()}` : "YDC-UNKNOWN";
  
  // Mocked Metrics for now since these tables don't exist yet
  const tier = "Silver Tier";
  const coins = 450;
  const streak = 12;
  const education = "BS-CS";

  const upcomingEvents = [
    { id: 1, title: "Pioneers Camp 2026", date: "May 25, 2026", time: "09:00 AM", location: "Bahauddin Zakariya University" },
    { id: 2, title: "Khidmat: Tree Plantation", date: "June 2, 2026", time: "04:00 PM", location: "Qila Kohna Qasim Bagh" }
  ];

  // Dynamic Flashcard State Simulator
  // Options: 'course_progress', 'streak_warning', 'upcoming_event'
  const flashcardState: string = 'course_progress'; 

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1D1D1D] pb-24">
      {/* HERO SECTION */}
      <div className="relative pt-6 pb-32 px-4 bg-gradient-to-r from-[#DD0408] via-[#0A9EDE] to-[#0BA242] bg-[length:200%_100%] animate-[fluid-flow_15s_linear_infinite] rounded-b-[40px] shadow-lg overflow-hidden">
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-10 pointer-events-none mix-blend-overlay">
          <img src="/icontransparent.png" alt="" className="w-full max-w-[500px] h-auto scale-150" />
        </div>

        <div className="relative z-10 flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-white font-bold text-xl tracking-tight drop-shadow-sm">Dashboard</h1>
          <Link href="/auth/login" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition">
            <LogOut size={18} />
          </Link>
        </div>
      </div>

      {/* MEMBERSHIP CARD */}
      <div className="relative z-20 max-w-lg mx-auto px-4 -mt-24">
        <div className="bg-[#1D1D1D] rounded-3xl p-6 shadow-2xl shadow-black/20 border border-[#333333] relative overflow-hidden text-white">
          <div className="absolute -right-12 -top-12 opacity-5 pointer-events-none">
            <img src="/icontransparent.png" alt="" className="w-64 h-auto" />
          </div>

          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl">
              <img src="/icontransparent.png" alt="YDC Icon" className="h-8 w-auto brightness-0 invert" />
            </div>

            <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 px-3 py-1.5 rounded-full shadow-inner">
              <Flame size={16} className="text-orange-500 animate-pulse" />
              <span className="font-extrabold text-sm text-orange-400">{streak}</span>
            </div>
          </div>

          <div className="flex items-end justify-between relative z-10">
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-[#A3A3A3] text-xs font-semibold uppercase tracking-wider mb-1">Official Member</p>
              <h2 className="text-2xl font-bold mb-1 truncate" title={name}>{name}</h2>
              <div className="flex items-center gap-2 text-[#0A9EDE] font-semibold text-sm">
                <Award size={16} />
                {tier}
              </div>
              <p className="text-[#555555] text-[10px] font-mono mt-4 tracking-widest">{memberId}</p>
            </div>

            <div className="bg-white p-2 rounded-xl shadow-inner shrink-0 ml-2">
              <QRCode 
                value={memberId} 
                size={80}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC FLASHCARD ALERT */}
      <div className="max-w-lg mx-auto px-4 mt-6">
        {flashcardState === 'course_progress' && (
          <Link href="/lms" className="block bg-gradient-to-r from-[#0A9EDE]/10 to-blue-500/5 border border-[#0A9EDE]/20 rounded-2xl p-4 flex items-center justify-between group hover:border-[#0A9EDE]/40 transition-colors shadow-sm cursor-pointer">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-full bg-[#0A9EDE]/10 flex items-center justify-center shrink-0">
                <BookOpen size={20} className="text-[#0A9EDE]" />
              </div>
              <div className="flex-1 pr-4">
                <p className="text-xs text-[#0A9EDE] font-bold uppercase tracking-wider mb-0.5">Resume Course</p>
                <h4 className="font-bold text-sm text-[#1D1D1D] mb-2 truncate">Ethics & Character Building</h4>
                <div className="w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#0A9EDE] h-full w-[60%] rounded-full"></div>
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#A3A3A3] group-hover:text-[#0A9EDE] transition-colors" />
          </Link>
        )}

        {flashcardState === 'streak_warning' && (
          <div className="bg-gradient-to-r from-[#DD0408]/10 to-red-500/5 border border-[#DD0408]/20 rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:border-[#DD0408]/40 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#DD0408]/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-[#DD0408] animate-pulse" />
              </div>
              <div>
                <p className="text-xs text-[#DD0408] font-bold uppercase tracking-wider mb-0.5">Action Required</p>
                <h4 className="font-bold text-sm text-[#1D1D1D]">Streak expires in 2 hours!</h4>
                <p className="text-xs text-[#555555] mt-0.5">Log a daily deed to keep your fire alive.</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#DD0408]" />
          </div>
        )}

        {flashcardState === 'upcoming_event' && (
          <div className="bg-gradient-to-r from-[#0BA242]/10 to-green-500/5 border border-[#0BA242]/20 rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:border-[#0BA242]/40 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#0BA242]/10 flex items-center justify-center shrink-0">
                <Calendar size={20} className="text-[#0BA242]" />
              </div>
              <div>
                <p className="text-xs text-[#0BA242] font-bold uppercase tracking-wider mb-0.5">Tomorrow</p>
                <h4 className="font-bold text-sm text-[#1D1D1D]">Pioneers Camp 2026</h4>
                <p className="text-xs text-[#555555] mt-0.5">Check your email for the QR ticket.</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#0BA242]" />
          </div>
        )}
      </div>

      {/* MAIN CONTENT / ORGANIZED INFO */}
      <div className="max-w-lg mx-auto px-4 mt-8 space-y-8">
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <Coins size={20} className="text-yellow-500 mb-2" />
            <span className="text-xs text-[#555555] font-semibold">YDC Coins</span>
            <span className="font-bold text-lg">{coins}</span>
          </div>
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <MapPin size={20} className="text-[#0A9EDE] mb-2" />
            <span className="text-xs text-[#555555] font-semibold">Division</span>
            <span className="font-bold text-sm leading-tight mt-0.5 truncate w-full px-1">{division}</span>
          </div>
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <GraduationCap size={20} className="text-[#0BA242] mb-2" />
            <span className="text-xs text-[#555555] font-semibold">Education</span>
            <span className="font-bold text-xs leading-tight mt-0.5 truncate w-full px-1">{education}</span>
          </div>
        </div>

        {/* Registered Events */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">My Events</h3>
            <Link href="/events" className="text-sm text-[#0A9EDE] font-semibold hover:underline">View All</Link>
          </div>

          <div className="space-y-3">
            {upcomingEvents.map(event => (
              <div key={event.id} className="bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-sm flex items-center justify-between group cursor-pointer hover:border-[#0A9EDE] transition-colors">
                <div>
                  <h4 className="font-bold text-sm mb-2">{event.title}</h4>
                  <div className="flex items-center gap-4 text-xs text-[#555555]">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} className="text-[#0BA242]" />
                      {event.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-[#DD0408]" />
                      {event.time}
                    </div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center group-hover:bg-[#F0F9FF] transition-colors shrink-0 ml-2">
                  <ChevronRight size={16} className="text-[#555555] group-hover:text-[#0A9EDE]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Blocks */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-[#1D1D1D] to-[#333333] text-white rounded-2xl p-5 shadow-lg relative overflow-hidden cursor-pointer group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Award size={48} />
            </div>
            <h4 className="font-bold mb-1 relative z-10">LMS Portal</h4>
            <p className="text-xs text-[#A3A3A3] relative z-10">All Courses</p>
          </div>
          
          <div className="bg-gradient-to-br from-[#0A9EDE] to-[#088abf] text-white rounded-2xl p-5 shadow-lg relative overflow-hidden cursor-pointer group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Flame size={48} />
            </div>
            <h4 className="font-bold mb-1 relative z-10">Log Deed</h4>
            <p className="text-xs text-white/80 relative z-10">Keep your streak</p>
          </div>
        </div>

      </div>
    </div>
  );
}
