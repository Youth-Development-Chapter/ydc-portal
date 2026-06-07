import React from "react";
import Link from "next/link";
import Image from "next/image";
import QRCode from "react-qr-code";
import { Award, Coins, Flame, Calendar, Clock, ChevronRight, LogOut, BookOpen, Settings, Gift, Megaphone, Trophy, Check, ShieldAlert } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/actions";
import { getCourses } from "@/lib/lms-data";
import DashboardFlashcards from "@/components/dashboard/DashboardFlashcards";
import { Flashcard } from "@/components/dashboard/DashboardFlashcards";
import {
  getRecentAnnouncements,
  getUpcomingEventsForUnitCached,
  getUserCoinBalance,
} from "@/lib/perf-data";


export default async function UserDashboard() {
  const extractEvent = (registration: { events?: unknown }) => {
    if (Array.isArray(registration.events)) return registration.events[0] || null;
    return (registration.events as { id: string; title: string; date: string; time: string; location: string } | null) || null;
  };

  const supabase = await createClient();

  // Fetch secure user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }


  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const [
    profileResult,
    streakResult,
    registrationsResult,
    todayDeedsResult,
    coins,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, unit_id, qualification, role, avatar_url')
      .eq('id', user.id)
      .single(),
    supabase.from('streaks').select('current_streak').eq('user_id', user.id).single(),
    supabase
      .from('event_registrations')
      .select('id, event_id, ticket_code, attended, events(id, title, date, time, location)')
      .eq('user_id', user.id),
    supabase.from('deed_submissions').select('id, status').eq('user_id', user.id).eq('local_date', todayStr),
    getUserCoinBalance(user.id),
  ]);

  if (profileResult.error) {
    console.error('[Dashboard] Error fetching user profile:', profileResult.error);
  }

  const profile = profileResult.data;

  // If no profile exists, redirect to onboarding
  if (!profile) {
    redirect("/onboarding");
  }

  // Map real data to UI
  const name = profile?.full_name || user.user_metadata?.full_name || "YDC Member";
  const memberId = profile?.id ? `YDC-${profile.id.substring(0, 8).toUpperCase()}` : "YDC-UNKNOWN";
  
  // Determine Tier dynamically
  const tier = coins >= 1000 ? "Gold Tier" : coins >= 300 ? "Silver Tier" : "Bronze Tier";

  const streakRecord = streakResult.data;
  const streak = streakRecord?.current_streak || 0;

  const registrations = registrationsResult.data;

  // Find if there is an upcoming registered event starting in < 48 hours
  const now = new Date();
  const upcomingEvent48h = (registrations || []).find(reg => {
    const event = extractEvent(reg);
    if (!event) return false;
    const eventDate = new Date(`${event.date}T${event.time.split(' - ')[0] || '00:00:00'}`);
    const diffMs = eventDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 48;
  });

  // Check if today a deed was submitted using local_date
  const todayDeeds = todayDeedsResult.data;

  const hasLoggedDeedToday = todayDeeds && todayDeeds.some(d => d.status === 'approved' || d.status === 'pending');

  // Calculate LMS progress percentage
  let progressPercentage = 0;
  let activeCourseTitle = "Ethics & Character Building";
  let activeCourseId = "";
  const lockedLanguages = new Map<string, 'en' | 'ur'>();

  try {
    const courses = await getCourses();
    if (courses && courses.length > 0) {
      const courseIds = courses.map(c => c.id);

      // Fetch locked course settings
      const { data: settings } = await supabase
        .from('user_course_settings')
        .select('course_id, language')
        .eq('user_id', user.id);

      for (const row of settings || []) {
        lockedLanguages.set(row.course_id, row.language as 'en' | 'ur');
      }

      // Fetch ALL progress for this user across all courses in ONE query
      // instead of N sequential queries (N+1 elimination).
      const { data: allProgress } = await supabase
        .from('user_progress')
        .select('course_id, lesson_id, language')
        .eq('user_id', user.id)
        .in('course_id', courseIds)
        .eq('completed', true);

      // Build a per-course set of completed lesson ids matching the locked language
      const progressByCourse = new Map<string, Set<string>>();
      for (const row of allProgress || []) {
        const lockedLang = lockedLanguages.get(row.course_id) || 'en';
        if (row.language === lockedLang) {
          if (!progressByCourse.has(row.course_id)) {
            progressByCourse.set(row.course_id, new Set());
          }
          progressByCourse.get(row.course_id)!.add(row.lesson_id);
        }
      }

      let selectedCourse = courses[0];
      let selectedProgress = 0;
      let foundIncomplete = false;

      for (const course of courses) {
        const completed = progressByCourse.get(course.id)?.size ?? 0;
        const total = course.modules?.length || 1;
        const pct = Math.min(100, Math.round((completed / total) * 100));

        if (pct < 100) {
          selectedCourse = course;
          selectedProgress = pct;
          foundIncomplete = true;
          break;
        }
      }

      // If all are completed, show the first course as completed
      if (!foundIncomplete) {
        const completed = progressByCourse.get(courses[0].id)?.size ?? 0;
        const total = courses[0].modules?.length || 1;
        selectedProgress = Math.min(100, Math.round((completed / total) * 100));
      }

      const activeLockedLang = lockedLanguages.get(selectedCourse.id) || 'en';
      activeCourseTitle = (activeLockedLang === 'ur' && selectedCourse.titleUr) ? selectedCourse.titleUr : selectedCourse.title;
      activeCourseId = selectedCourse.id;
      progressPercentage = selectedProgress;
    }
  } catch (err) {
    console.error("Failed to fetch LMS progress:", err);
  }

  // Compile Dynamic Flashcards
  const flashcards: Flashcard[] = [];
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toISOString();

  // 1. Fetch recent approved deeds
  const { data: recentApprovedDeeds } = await supabase
    .from('deed_submissions')
    .select('id, description, coin_reward, bonus_coins, verified_at')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .gte('verified_at', twoDaysAgoStr)
    .order('verified_at', { ascending: false });

  // 2. Fetch recent reward redemptions
  const { data: recentRedemptions } = await supabase
    .from('reward_redemptions')
    .select('id, coin_cost, redeemed_at, rewards(title)')
    .eq('user_id', user.id)
    .gte('redeemed_at', twoDaysAgoStr)
    .order('redeemed_at', { ascending: false });

  // 3 + 4. Fetch announcements with auth client (respects RLS) and upcoming events via short-lived cache
  const userUnitId = profile?.unit_id || null
  const [announcementsResult, allUpcomingEventsCached] = await Promise.all([
    getRecentAnnouncements(supabase, userUnitId),
    getUpcomingEventsForUnitCached(userUnitId),
  ]);
  const recentAnnouncements = announcementsResult.filter((a) => a.created_at >= twoDaysAgoStr);
  const allUpcomingEvents = allUpcomingEventsCached
    .filter((e) => e.date >= todayStr)
    .slice(0, 5);

  // Compile Streak Warning (Highest priority if they haven't logged today)
  if (!hasLoggedDeedToday) {
    flashcards.push({
      id: "streak-warning",
      type: "streak_warning",
      title: "Action Required",
      titleUr: "عمل کی ضرورت ہے",
      description: "Keep your streak! Log a daily deed to keep your fire alive.",
      descriptionUr: "اپنی اسٹریک برقرار رکھیں! فائر کو زندہ رکھنے کے لیے روزانہ کا عمل لاگ کریں۔",
      link: "/dashboard/log-deed",
      badgeText: "Streak Alert",
      badgeTextUr: "اسٹریک الرٹ",
      badgeColor: "red",
      iconName: "alert"
    });
  }

  // Compile Registered Event Starting Soon (< 48 hours)
  if (upcomingEvent48h) {
    const event = extractEvent(upcomingEvent48h);
    if (event) {
    flashcards.push({
      id: `reg-event-48h-${event.id}`,
      type: "upcoming_event",
      title: "Event Tomorrow!",
      titleUr: "تقریب شروع ہونے والی ہے",
      description: `"${event.title}" starts soon. Your entry ticket is ready!`,
      descriptionUr: `"${event.title}" اگلے 48 گھنٹوں میں شروع ہو رہی ہے۔ آپ کا انٹری ٹکٹ تیار ہے!`,
      link: "/events",
      badgeText: "Starting Soon",
      badgeTextUr: "جلد شروع ہو رہا ہے",
      badgeColor: "green",
      iconName: "calendar"
    });
    }
  }

  // Compile Unregistered Upcoming Events (so they can join)
  const registeredEventIds = new Set((registrations || []).map(r => r.event_id));
  const unregisteredEvents = (allUpcomingEvents || []).filter(e => !registeredEventIds.has(e.id));
  unregisteredEvents.forEach(event => {
    flashcards.push({
      id: `unreg-event-${event.id}`,
      type: "unregistered_event",
      title: "Upcoming Event",
      titleUr: "تقریب آرہی ہے",
      description: `Claim entry ticket for "${event.title}" (${new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${event.time}).`,
      descriptionUr: `ٹکٹ حاصل کریں: "${event.title}"، (${new Date(event.date).toLocaleDateString('ur-PK', { month: 'short', day: 'numeric' })} بوقت ${event.time})۔`,
      link: "/events",
      badgeText: "Claim Ticket",
      badgeTextUr: "ٹکٹ حاصل کریں",
      badgeColor: "blue",
      iconName: "calendar"
    });
  });

  // Compile Recent Deed Approvals (within 48 hours)
  (recentApprovedDeeds || []).forEach(deed => {
    const totalCoins = deed.coin_reward + deed.bonus_coins;
    flashcards.push({
      id: `deed-approved-${deed.id}`,
      type: "deed_approval",
      title: "Deed Approved! 🎉",
      titleUr: "عمل منظور ہو گیا! 🎉",
      description: `Your submission for "${deed.description}" was approved. +${totalCoins} Coins added!`,
      descriptionUr: `آپ کا بھیجا ہوا عمل "${deed.description}" منظور کر لیا گیا ہے۔ +${totalCoins} کوائنز شامل کر دیے گئے ہیں!`,
      link: "/dashboard",
      badgeText: "Deed Approved",
      badgeTextUr: "منظور شدہ عمل",
      badgeColor: "green",
      iconName: "check"
    });
  });

  // Compile Recent Reward Redemptions (within 48 hours)
  (recentRedemptions || []).forEach(red => {
    const rewardTitle = (red.rewards as any)?.title || "Reward";
    flashcards.push({
      id: `reward-redeemed-${red.id}`,
      type: "reward_redemption",
      title: "Reward Redeemed! 🎁",
      titleUr: "انعام حاصل کر لیا! 🎁",
      description: `You successfully redeemed "${rewardTitle}" for ${red.coin_cost} coins.`,
      descriptionUr: `آپ نے ${red.coin_cost} کوائنز کے عوض کامیابی کے ساتھ "${rewardTitle}" حاصل کر لیا ہے۔`,
      link: "/dashboard/rewards",
      badgeText: "Redeemed",
      badgeTextUr: "حاصل کیا",
      badgeColor: "purple",
      iconName: "gift"
    });
  });

  // Compile Recent Announcements (within 48 hours)
  (recentAnnouncements || []).forEach(ann => {
    flashcards.push({
      id: `announcement-${ann.id}`,
      type: "announcement",
      title: "New Announcement",
      titleUr: "نیا اعلان",
      description: ann.title,
      descriptionUr: ann.title,
      link: "/dashboard/announcements",
      badgeText: "Announcement",
      badgeTextUr: "اعلان",
      badgeColor: "blue",
      iconName: "bell"
    });
  });

  // Compile Course Progress (Resume, In-Progress only, NOT completed)
  if (progressPercentage > 0 && progressPercentage < 100) {
    const courseLang = lockedLanguages.get(activeCourseId) || 'en';
    const isUrduCourse = courseLang === 'ur';
    flashcards.push({
      id: `course-progress-${activeCourseId}`,
      type: "course_progress",
      title: "Resume Course",
      titleUr: "کورس جاری رکھیں",
      description: `Continue your progress in "${activeCourseTitle}" (${progressPercentage}% completed).`,
      descriptionUr: `کورس جاری رکھیں جہاں سے آپ نے چھوڑا تھا: "${activeCourseTitle}" (${progressPercentage}% مکمل)۔`,
      link: `/lms/courses/${activeCourseId}`,
      badgeText: "Resume Course",
      badgeTextUr: "کورس جاری رکھیں",
      badgeColor: "blue",
      iconName: "book",
      progress: progressPercentage,
      isUrdu: isUrduCourse
    });
  }

  // Fallback card if empty
  if (flashcards.length === 0) {
    flashcards.push({
      id: "all-caught-up",
      type: "fallback",
      title: "All Caught Up! ✨",
      titleUr: "سب کچھ مکمل ہے! ✨",
      description: "You are up to date with all events, courses, and announcements. Great job!",
      descriptionUr: "آپ تمام تقاریب، کورسز اور اعلانات کے ساتھ اپ ٹو ڈیٹ ہیں۔ بہت خوب!",
      link: "/dashboard",
      badgeText: "Status Normal",
      badgeTextUr: "حالت نارمل",
      badgeColor: "green",
      iconName: "check"
    });
  }

  const myEvents = (registrations || [])
    .map((reg) => ({ reg, event: extractEvent(reg) }))
    .filter(({ event }) => !!event)
    .map(reg => ({
      id: reg.event!.id,
      title: reg.event!.title,
      date: new Date(reg.event!.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: reg.event!.time,
      location: reg.event!.location,
      ticketCode: reg.reg.ticket_code,
      attended: reg.reg.attended
    })); 

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1D1D1D] pb-24 relative overflow-hidden animate-fade-in">
      {/* Soft Background Gradient emanating from top */}
      <div className="fluid-top-gradient"></div>

      {/* HERO SECTION */}
      <div className="relative pt-6 pb-32 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <Image src="/icontransparent.png" alt="" width={500} height={500} className="w-full max-w-[500px] h-auto scale-150" priority={false} />
        </div>

        <div className="relative z-10 flex items-center justify-between max-w-lg mx-auto">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-extrabold tracking-widest text-neutral-700">Volunteer Portal</span>
            <h1 className="text-[#1D1D1D] font-bold text-lg tracking-tight font-coolvetica mt-0.5">
              Asalam-o-Alaikum, <span className="text-[#0A9EDE]">{name.split(" ")[0]}</span>!
            </h1>
            <span className="text-[9px] text-neutral-600 mt-0.5 font-bold">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {profile && ['president', 'superadmin', 'admin'].includes(profile.role) && (
              <Link 
                href="/dashboard/president" 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-[#DD0408] border border-red-100 text-[10px] font-extrabold uppercase tracking-wider hover:bg-red-100 transition shadow-sm"
                title="President Console"
              >
                <ShieldAlert size={12} className="text-[#DD0408] animate-pulse" />
                <span>Console</span>
              </Link>
            )}
            <Link href="/dashboard/settings" className="w-9 h-9 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center text-[#1D1D1D] hover:bg-[#F5F5F5] transition shadow-sm overflow-hidden" title="Settings">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <Settings size={16} />
              )}
            </Link>
            <form action={logout}>
              <button type="submit" className="w-9 h-9 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center text-[#1D1D1D] hover:bg-[#F5F5F5] transition shadow-sm cursor-pointer" title="Logout">
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* MEMBERSHIP CARD */}
      <div className="relative z-20 max-w-lg mx-auto px-4 -mt-24">
        <div className="bg-[#1D1D1D] rounded-3xl p-6 shadow-2xl shadow-black/20 border border-[#333333] relative overflow-hidden text-white transition-all duration-300 hover:shadow-black/35 hover:-translate-y-0.5">
          <div className="absolute -right-12 -top-12 opacity-5 pointer-events-none">
            <Image src="/icontransparent.png" alt="" width={256} height={256} className="w-64 h-auto" />
          </div>

          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl">
              <Image src="/icontransparent.png" alt="YDC Icon" width={128} height={32} className="h-8 w-auto brightness-0 invert" />
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
                value={profile.id} 
                size={80}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC FLASHCARD ALERT CAROUSEL */}
      <div className="max-w-lg mx-auto px-4 mt-6">
        <DashboardFlashcards flashcards={flashcards} />
      </div>

      {/* MAIN CONTENT / ORGANIZED INFO */}
      <div className="max-w-lg mx-auto px-4 mt-6 space-y-6">
        
        {/* REDESIGNED QUICK HUB ACTIONS (Interactive & Practical) */}
        <div className="grid grid-cols-3 gap-3">
          {/* 1. Coins Wallet Card */}
          <Link href="/dashboard/wallet" className="bg-white border border-[#E5E5E5] rounded-2xl p-3 flex flex-col items-center justify-between text-center shadow-sm hover:border-yellow-500 hover:shadow-md transition duration-300 cursor-pointer group min-h-[120px]">
            <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-500 group-hover:scale-110 transition duration-300">
              <Coins size={18} />
            </div>
            <div className="flex flex-col items-center justify-center my-1">
              <span className="text-[9px] text-[#737373] font-extrabold uppercase tracking-wider">YDC Coins</span>
              <span className="font-extrabold text-base text-[#1D1D1D] mt-0.5">{coins}</span>
            </div>
            <span className="text-[8px] text-yellow-600 font-extrabold uppercase tracking-wide bg-yellow-50 px-2 py-0.5 rounded-full">
              View Wallet
            </span>
          </Link>

          {/* 2. LMS Academy Card */}
          <Link href="/lms/courses" className="bg-white border border-[#E5E5E5] rounded-2xl p-3 flex flex-col items-center justify-between text-center shadow-sm hover:border-indigo-500 hover:shadow-md transition duration-300 cursor-pointer group min-h-[120px]">
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition duration-300">
              <BookOpen size={18} />
            </div>
            <div className="flex flex-col items-center justify-center my-1">
              <span className="text-[9px] text-[#737373] font-extrabold uppercase tracking-wider">Academy LMS</span>
              <span className="font-extrabold text-base text-[#1D1D1D] mt-0.5">{progressPercentage}%</span>
            </div>
            <span className="text-[8px] text-indigo-600 font-extrabold uppercase tracking-wide bg-indigo-50 px-2 py-0.5 rounded-full truncate max-w-full">
              {progressPercentage === 100 ? "Completed" : progressPercentage > 0 ? "Resume" : "Start"}
            </span>
          </Link>

          {/* 3. Daily Deed Status Card */}
          <Link href="/dashboard/log-deed" className="bg-white border border-[#E5E5E5] rounded-2xl p-3 flex flex-col items-center justify-between text-center shadow-sm hover:border-orange-500 hover:shadow-md transition duration-300 cursor-pointer group min-h-[120px]">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition duration-300 group-hover:scale-110 ${
              hasLoggedDeedToday ? "bg-green-50 text-[#0BA242]" : "bg-orange-50 text-orange-500"
            }`}>
              {hasLoggedDeedToday ? <Check size={18} /> : <Flame size={18} />}
            </div>
            <div className="flex flex-col items-center justify-center my-1">
              <span className="text-[9px] text-[#737373] font-extrabold uppercase tracking-wider">Daily Deed</span>
              <span className={`font-extrabold text-xs leading-none mt-1 truncate max-w-full px-1 ${
                hasLoggedDeedToday ? "text-[#0BA242]" : "text-orange-500"
              }`}>
                {hasLoggedDeedToday ? "Logged" : "Pending"}
              </span>
            </div>
            <span className={`text-[8px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full ${
              hasLoggedDeedToday ? "bg-green-50 text-[#0BA242]" : "bg-orange-50 text-orange-500"
            }`}>
              {hasLoggedDeedToday ? "Streak Safe" : "Log Now"}
            </span>
          </Link>
        </div>

        {/* ACTIVE ACADEMY TRACK */}
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-600" />
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#1D1D1D]">Active Academy Track</h3>
            </div>
            <Link href="/lms/courses" className="text-xs font-bold text-[#0A9EDE] hover:underline">
              View LMS
            </Link>
          </div>

          <div className="bg-[#FAFAFA] border border-[#F0F0F0] rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#A3A3A3] font-mono">Current Course</span>
              <h4 className="font-bold text-sm text-[#1D1D1D] mt-1 line-clamp-1">{activeCourseTitle}</h4>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-[#555555]">Syllabus Completed</span>
                <span className="text-[#1D1D1D] font-bold">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-[#E5E5E5] h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Link 
                href={activeCourseId ? `/lms/courses/${activeCourseId}` : "/lms/courses"}
                className="w-full text-center bg-[#1D1D1D] text-white hover:bg-neutral-800 py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                {progressPercentage === 100 ? "Review Lessons" : progressPercentage > 0 ? "Resume Learning" : "Start Course"}
              </Link>
            </div>
          </div>
        </div>

        {/* MY REGISTERED EVENTS */}
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-[#0A9EDE]" />
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#1D1D1D]">My Registered Events</h3>
            </div>
            <Link href="/events" className="text-xs font-bold text-[#0A9EDE] hover:underline">
              Browse Events
            </Link>
          </div>

          <div className="space-y-3">
            {myEvents.length > 0 ? (
              myEvents.map(event => (
                <Link key={event.id} href="/events" className="block">
                  <div className="bg-[#FAFAFA] border border-[#F0F0F0] hover:border-[#0A9EDE] rounded-2xl p-4 flex items-center justify-between group cursor-pointer transition-colors duration-200">
                    <div>
                      <h4 className="font-bold text-sm text-[#1D1D1D] mb-2 group-hover:text-[#0A9EDE] transition-colors">{event.title}</h4>
                      <div className="flex items-center gap-4 text-[10px] text-[#555555] font-semibold">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-[#0BA242]" />
                          {event.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-[#DD0408]" />
                          {event.time}
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center shrink-0 group-hover:bg-[#F0F9FF] group-hover:border-[#0A9EDE]/25 transition-colors duration-200">
                      <ChevronRight size={16} className="text-[#555555] group-hover:text-[#0A9EDE]" />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="bg-[#FAFAFA] border border-dashed border-[#E5E5E5] rounded-2xl p-6 text-center text-[#555555] text-xs">
                No events registered yet.{" "}
                <Link href="/events" className="text-[#0A9EDE] font-extrabold hover:underline">
                  Find event
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* REWARDS & SHOP PERKS */}
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Gift size={18} className="text-[#0BA242]" />
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#1D1D1D]">Rewards & Perks</h3>
          </div>

          <Link href="/dashboard/rewards" className="block">
            <div className="bg-gradient-to-br from-green-500/5 to-[#0BA242]/5 border border-[#0BA242]/20 hover:border-[#0BA242]/40 rounded-2xl p-4 flex items-center justify-between group cursor-pointer transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0BA242]/10 text-[#0BA242] flex items-center justify-center shrink-0 group-hover:scale-105 transition duration-300">
                  <Gift size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1D1D1D]">Redeem YDC Rewards</h4>
                  <p className="text-[10px] text-[#555555] mt-0.5">Use your {coins} YDC coins to claim exclusive rewards</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-[#E5E5E5] group-hover:bg-green-50 group-hover:border-[#0BA242]/25 transition duration-200">
                <ChevronRight size={16} className="text-[#555555] group-hover:text-[#0BA242]" />
              </div>
            </div>
          </Link>
        </div>

        {/* COMMUNITY HUB */}
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-yellow-600" />
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#1D1D1D]">Community Hub</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Announcements Card */}
            <Link href="/dashboard/announcements" className="block">
              <div className="bg-[#FAFAFA] border border-[#F0F0F0] hover:border-[#0A9EDE] rounded-2xl p-4 flex flex-col justify-between h-[110px] group cursor-pointer transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition duration-300">
                    <Megaphone size={16} />
                  </div>
                  <ChevronRight size={14} className="text-[#A3A3A3] group-hover:text-[#0A9EDE] transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#1D1D1D]">Announcements</h4>
                  <p className="text-[9px] text-[#A3A3A3] mt-0.5">Read latest portal updates</p>
                </div>
              </div>
            </Link>

            {/* Leaderboard Card */}
            <Link href="/leaderboard" className="block">
              <div className="bg-[#FAFAFA] border border-[#F0F0F0] hover:border-yellow-500 rounded-2xl p-4 flex flex-col justify-between h-[110px] group cursor-pointer transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition duration-300">
                    <Trophy size={16} />
                  </div>
                  <ChevronRight size={14} className="text-[#A3A3A3] group-hover:text-yellow-500 transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#1D1D1D]">Leaderboard</h4>
                  <p className="text-[9px] text-[#A3A3A3] mt-0.5">Check volunteer standings</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* President / Admin Quick Access Console */}
        {profile && ['president', 'superadmin', 'admin'].includes(profile.role) && (
          <Link href="/dashboard/president" className="block pt-2">
            <div className="bg-[#1D1D1D] text-white rounded-3xl p-5 border border-[#333333] hover:border-red-500 shadow-xl relative overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-black/25">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
                <Settings size={48} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 border border-red-500/20">
                    <Award size={18} />
                  </div>
                  <div>
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-red-500">Administrative Portal</span>
                    <h3 className="font-bold text-sm font-coolvetica text-white mt-0.5">President Admin Console</h3>
                    <p className="text-[10px] text-[#A3A3A3] mt-0.5">Manage approvals, unit events, and scan registrations</p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-[#262626] border border-[#333333] flex items-center justify-center shrink-0 group-hover:bg-red-950 group-hover:border-red-500/30 transition duration-200">
                  <ChevronRight size={14} className="text-[#A3A3A3] group-hover:text-red-500" />
                </div>
              </div>
            </div>
          </Link>
        )}

      </div>
    </div>
  );
}
