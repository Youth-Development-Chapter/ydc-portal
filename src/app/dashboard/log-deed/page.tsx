import React from "react";
import Link from "next/link";
import { Clock, CheckCircle2, XCircle, AlertCircle, ExternalLink, Flame, Heart, Award, Sparkles } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import LogDeedForm from "./LogDeedForm";
import DeedHistoryClient from "./DeedHistoryClient";
import LocalTime from "@/components/ui/LocalTime";
import WeeklyActivity from "@/components/ui/WeeklyActivity";
import PageHeader from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function LogDeedPage() {
  const supabase = await createClient();
  
  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Fetch deed submissions sorted by created_at descending
  const { data: submissions } = await supabase
    .from('deed_submissions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch streak metrics
  const { data: streakRecord } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const currentStreak = streakRecord?.current_streak || 0;
  const longestStreak = streakRecord?.longest_streak || 0;

  // Query total approved deeds count
  const { count: totalApproved } = await supabase
    .from('deed_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'approved');

  // Determine next milestone
  const milestones = [3, 7, 14, 30, 50, 100, 365];
  const nextMilestone = milestones.find(m => m > currentStreak) || 365;
  const progressPercent = Math.min(100, Math.round((currentStreak / nextMilestone) * 100));
  const daysRemaining = nextMilestone - currentStreak;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1D1D1D] pb-24 relative overflow-hidden">
      {/* Soft Background Gradient emanating from top */}
      <div className="fluid-top-gradient"></div>

      {/* HEADER SECTION */}
      <div className="relative pt-6 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <img src="/icontransparent.png" alt="" className="w-full max-w-[500px] h-auto scale-150" />
        </div>

        <div className="relative z-10 max-w-lg mx-auto">
          <PageHeader title="Log Daily Deed" backHref="/dashboard" />        
        </div>
      </div>

      {/* FORM & HISTORY CONTAINER */}
      <div className="max-w-lg mx-auto px-4 -mt-10 relative z-20 space-y-6">
        
        {/* STREAK METER CARD */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#E5E5E5] relative overflow-hidden text-[#1D1D1D]">
          <div className="absolute -right-24 -top-24 w-48 h-48 bg-[#0BA242]/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-24 -bottom-24 w-48 h-48 bg-[#0A9EDE]/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#DD0408] to-[#FF4D4D] flex items-center justify-center text-white shadow-lg shadow-[#DD0408]/20">
                <Flame size={28} className="animate-pulse" />
              </div>
              <div>
                <p className="text-[#555555] text-xs font-semibold uppercase tracking-wider">Current Streak</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-coolvetica leading-none text-[#DD0408]">{currentStreak}</span>
                  <span className="text-sm font-bold text-[#555555]">days</span>
                </div>
              </div>
            </div>
            
            <div className="text-right border-l border-[#E5E5E5] pl-6">
              <p className="text-[#555555] text-xs font-semibold uppercase tracking-wider">Personal Best</p>
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-xl font-bold font-coolvetica text-[#0A9EDE]">{longestStreak}</span>
                <span className="text-xs text-[#555555]">days</span>
              </div>
              <p className="text-[10px] text-[#8A8A8A] mt-0.5">{totalApproved || 0} approved deeds</p>
            </div>
          </div>

          {/* 7-DAY STEPS TRACKER */}
          <div className="border-t border-[#F0F0F0] pt-5 pb-2">
            <p className="text-xs font-semibold text-[#555555] mb-4 uppercase tracking-wider">Weekly Activity</p>
            <WeeklyActivity submissions={submissions || []} />
          </div>

          {/* MILESTONE PROGRESS */}
          <div className="border-t border-[#F0F0F0] pt-5 mt-4 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[#555555] uppercase tracking-wider">Flame Milestone</span>
              <span className="text-[#DD0408] font-bold">{currentStreak} / {nextMilestone} Days</span>
            </div>
            
            <div className="w-full bg-[#F5F5F5] h-2.5 rounded-full overflow-hidden border border-[#E5E5E5] p-[1px]">
              <div 
                className="bg-gradient-to-r from-[#DD0408] via-orange-500 to-[#0BA242] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(221,4,8,0.1)]" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            
            <p className="text-[10px] text-[#8A8A8A] text-right">
              {daysRemaining === 0 
                ? "Milestone completed! Keep logging." 
                : `${daysRemaining} day${daysRemaining > 1 ? "s" : ""} away from the ${nextMilestone}-Day Flame!`}
            </p>
          </div>
        </div>

        {/* Client-Side Input Form or Completed/Pending Alert Cards */}
        <LogDeedForm submissions={submissions || []} />

        {/* Deed History Card */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#E5E5E5] relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#0A9EDE] via-[#0BA242] to-[#DD0408]"></div>

          <h3 className="text-lg font-bold mb-4 font-coolvetica text-[#1D1D1D]">My Deed History</h3>

          <DeedHistoryClient submissions={submissions || []} />
        </div>
      </div>
    </div>
  );
}
