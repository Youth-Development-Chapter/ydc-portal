import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  ArrowLeft, Megaphone, Pin, Clock, Bell, CheckCircle2, 
  XCircle, Coins, Award, Calendar, AlertTriangle, ChevronRight, BookOpen
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getRecentAnnouncements, getUpcomingEventsForUnitCached } from "@/lib/perf-data";
import { getCourses } from "@/lib/lms-data";

export const dynamic = "force-dynamic";

interface NotificationItem {
  id: string;
  type: 'announcement' | 'deed' | 'transaction';
  title: string;
  content: string;
  is_pinned?: boolean;
  created_at: string;
  badgeText: string;
  badgeColor: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'indigo';
}

interface ActiveAlert {
  id: string;
  title: string;
  description: string;
  link: string;
  badgeText: string;
  badgeColor: 'red' | 'blue' | 'green' | 'purple';
  icon: React.ReactNode;
}

export default async function NotificationsPage(props: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const searchParams = await props.searchParams;
  const activeFilter = searchParams.filter || "all";
  
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Fetch user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, unit_id')
    .eq('id', user.id)
    .single();

  const userUnitId = profile?.unit_id || null;

  // 1. Fetch system announcements (respecting RLS and caching)
  const announcements = await getRecentAnnouncements(supabase, userUnitId);

  // 2. Fetch user's deed submissions (past 50)
  const { data: deeds } = await supabase
    .from('deed_submissions')
    .select('id, description, status, coin_reward, bonus_coins, created_at, verified_at, admin_notes')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  // 3. Fetch user's coin transactions (past 50)
  const { data: transactions } = await supabase
    .from('coin_transactions')
    .select('id, amount, reason, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  // 4. Fetch additional info for active alerts (streak, lms, event registrations)
  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const [
    streakResult,
    registrationsResult,
    todayDeedsResult,
    upcomingEventsResult
  ] = await Promise.all([
    supabase.from('streaks').select('current_streak').eq('user_id', user.id).maybeSingle(),
    supabase.from('event_registrations').select('event_id, attended, events(id, title, date, start_time, end_time, location)').eq('user_id', user.id),
    supabase.from('deed_submissions').select('id, status').eq('user_id', user.id).eq('local_date', todayStr),
    getUpcomingEventsForUnitCached(userUnitId)
  ]);

  const streak = streakResult.data?.current_streak || 0;
  const registrations = registrationsResult.data || [];
  const todayDeeds = todayDeedsResult.data || [];
  const hasLoggedDeedToday = todayDeeds.some(d => d.status === 'approved' || d.status === 'pending');
  const allUpcomingEvents = upcomingEventsResult || [];

  // ==========================================
  // COMPILE ACTIVE ALERTS (Action Items)
  // ==========================================
  const activeAlerts: ActiveAlert[] = [];

  // A. Streak Warning
  if (!hasLoggedDeedToday) {
    activeAlerts.push({
      id: "streak-warning",
      title: "Streak Warning ⚠️",
      description: "Keep your streak active! Log a daily deed today to maintain your streak fire.",
      link: "/dashboard/log-deed",
      badgeText: "Deed Needed",
      badgeColor: "red",
      icon: <AlertTriangle className="text-red-500 shrink-0" size={20} />
    });
  }

  // B. LMS Progress Check
  try {
    const courses = await getCourses();
    if (courses && courses.length > 0) {
      const courseIds = courses.map(c => c.id);
      
      const { data: settings } = await supabase
        .from('user_course_settings')
        .select('course_id, language')
        .eq('user_id', user.id);
      
      const lockedLanguages = new Map(settings?.map(s => [s.course_id, s.language]) || []);
      
      const { data: progress } = await supabase
        .from('user_progress')
        .select('course_id, lesson_id')
        .eq('user_id', user.id)
        .in('course_id', courseIds)
        .eq('completed', true);

      const progressByCourse = new Map<string, Set<string>>();
      for (const row of progress || []) {
        if (!progressByCourse.has(row.course_id)) {
          progressByCourse.set(row.course_id, new Set());
        }
        progressByCourse.get(row.course_id)!.add(row.lesson_id);
      }

      for (const course of courses) {
        const completed = progressByCourse.get(course.id)?.size ?? 0;
        const total = course.modules?.length || 1;
        const pct = Math.min(100, Math.round((completed / total) * 100));

        if (pct > 0 && pct < 100) {
          const lockedLang = lockedLanguages.get(course.id) || 'en';
          const title = (lockedLang === 'ur' && course.titleUr) ? course.titleUr : course.title;
          activeAlerts.push({
            id: `course-${course.id}`,
            title: "Continue Learning 📚",
            description: `You are ${pct}% through "${title}". Complete the next quiz to earn coins!`,
            link: `/lms/courses/${course.id}`,
            badgeText: `${pct}% Done`,
            badgeColor: "blue",
            icon: <BookOpen className="text-indigo-500 shrink-0" size={20} />
          });
          break; // Show only one in-progress course
        }
      }
    }
  } catch (err) {
    console.error("Failed compiling LMS notification alert:", err);
  }

  // C. Upcoming Event Checklist
  const now = new Date();
  const registeredEventIds = new Set(registrations.map(r => r.event_id));
  
  registrations.forEach(reg => {
    const event = reg.events as any;
    if (!event || reg.attended) return;
    const eventDate = new Date(`${event.date}T${event.start_time || '00:00:00'}`);
    const diffHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours > 0 && diffHours <= 48) {
      activeAlerts.push({
        id: `event-soon-${event.id}`,
        title: "Event Starting Soon! 🎟️",
        description: `"${event.title}" is in less than 48 hours. Show your ticket QR code on the dashboard to check in.`,
        link: "/dashboard",
        badgeText: "Reminder",
        badgeColor: "green",
        icon: <Calendar className="text-green-500 shrink-0" size={20} />
      });
    }
  });

  // D. Event Tickets to Claim
  const unregisteredEvents = allUpcomingEvents.filter(e => e.date >= todayStr && !registeredEventIds.has(e.id)).slice(0, 2);
  unregisteredEvents.forEach(event => {
    activeAlerts.push({
      id: `claim-ticket-${event.id}`,
      title: "Claim Event Ticket! 🤝",
      description: `Join other volunteers at "${event.title}" on ${new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. RSVP now!`,
      link: "/events",
      badgeText: "Events Center",
      badgeColor: "purple",
      icon: <Calendar className="text-purple-500 shrink-0" size={20} />
    });
  });

  // ==========================================
  // COMPILE HISTORY NOTIFICATIONS
  // ==========================================
  
  // 1. Announcements
  const announcementNotifications: NotificationItem[] = (announcements || []).map(ann => ({
    id: `ann-${ann.id}`,
    type: 'announcement',
    title: ann.title || 'System Announcement',
    content: ann.content,
    is_pinned: ann.is_pinned,
    created_at: ann.created_at,
    badgeText: 'Announcement',
    badgeColor: 'blue',
  }));

  // 2. Deeds
  const deedNotifications: NotificationItem[] = (deeds || []).map(deed => {
    let title = '';
    let content = '';
    let badgeColor: NotificationItem['badgeColor'] = 'orange';
    let badgeText = '';
    
    if (deed.status === 'approved') {
      title = 'Deed Approved! 🎉';
      content = `Your submission for "${deed.description}" was approved. +${deed.coin_reward + deed.bonus_coins} Coins added!`;
      badgeText = 'Approved';
      badgeColor = 'green';
    } else if (deed.status === 'rejected') {
      title = 'Deed Rejected ❌';
      content = `Your submission for "${deed.description}" was rejected.${deed.admin_notes ? ' Reason: ' + deed.admin_notes : ''}`;
      badgeText = 'Rejected';
      badgeColor = 'red';
    } else if (deed.status === 'flagged') {
      title = 'Deed Flagged ⚠️';
      content = `Your submission for "${deed.description}" was flagged. -10 Coins deducted.`;
      badgeText = 'Flagged';
      badgeColor = 'yellow';
    } else {
      title = 'Deed Logged 📝';
      content = `Your submission for "${deed.description}" is pending review.`;
      badgeText = 'Pending';
      badgeColor = 'orange';
    }
    
    return {
      id: `deed-${deed.id}`,
      type: 'deed',
      title,
      content,
      is_pinned: false,
      created_at: deed.verified_at || deed.created_at,
      badgeText,
      badgeColor,
    };
  });

  // 3. Transactions (excluding deed rewards to avoid duplicates)
  const transactionNotifications: NotificationItem[] = (transactions || [])
    .filter(tx => !['daily_deed', 'deed_flagged'].includes(tx.reason))
    .map(tx => {
      let title = 'Coins Updated';
      let content = '';
      let badgeText = 'Coins';
      let badgeColor: NotificationItem['badgeColor'] = 'yellow';
      
      if (tx.reason.startsWith('chapter_completion') || tx.reason.startsWith('course_completion')) {
        title = 'Academy Progress! 📚';
        content = `You completed a lesson chapter. +${tx.amount} Coins awarded!`;
        badgeText = 'Academy';
        badgeColor = 'indigo';
      } else if (tx.reason === 'event_attendance') {
        title = 'Event Attendance Credit! 🎟️';
        content = `Thank you for participating! +${tx.amount} Coins awarded for attendance.`;
        badgeText = 'Event';
        badgeColor = 'green';
      } else if (tx.reason === 'reward_redeem') {
        title = 'Reward Redeemed! 🎁';
        content = `You spent ${Math.abs(tx.amount)} Coins to claim a reward. Check shop redemptions.`;
        badgeText = 'Redemption';
        badgeColor = 'purple';
      } else {
        title = 'Coins Balance Updated ⚙️';
        content = `${tx.amount > 0 ? '+' : ''}${tx.amount} Coins adjusted. Reason: ${tx.reason}`;
        badgeText = 'System';
        badgeColor = 'yellow';
      }
      
      return {
        id: `tx-${tx.id}`,
        type: 'transaction',
        title,
        content,
        is_pinned: false,
        created_at: tx.created_at,
        badgeText,
        badgeColor,
      };
    });

  // Merge and Sort
  let notificationsFeed = [
    ...announcementNotifications,
    ...deedNotifications,
    ...transactionNotifications,
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Apply Filters
  if (activeFilter === "announcements") {
    notificationsFeed = notificationsFeed.filter(n => n.type === 'announcement');
  } else if (activeFilter === "activity") {
    notificationsFeed = notificationsFeed.filter(n => n.type === 'deed' || n.type === 'transaction');
  }

  const getBadgeClass = (color: string) => {
    switch (color) {
      case 'green': return 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]';
      case 'red': return 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]';
      case 'blue': return 'bg-[#F0F9FF] text-[#075985] border-[#BAE6FD]';
      case 'yellow': return 'bg-[#FEFCE8] text-[#854D0E] border-[#FEF08A]';
      case 'purple': return 'bg-[#FDF4FF] text-[#701A75] border-[#F5D0FE]';
      case 'indigo': return 'bg-[#EEF2FF] text-[#3730A3] border-[#C7D2FE]';
      case 'orange': return 'bg-[#FFF7ED] text-[#9A3412] border-[#FFEDD5]';
      default: return 'bg-[#F5F5F5] text-[#525252] border-[#E5E5E5]';
    }
  };

  const getIcon = (type: string, color: string) => {
    if (type === 'announcement') return <Megaphone className="text-[#0A9EDE]" size={18} />;
    if (color === 'green') return <CheckCircle2 className="text-[#0BA242]" size={18} />;
    if (color === 'red') return <XCircle className="text-[#DD0408]" size={18} />;
    if (color === 'purple') return <Award className="text-purple-600" size={18} />;
    return <Coins className="text-yellow-600" size={18} />;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1D1D1D] pb-24">
      <main className="max-w-lg mx-auto w-full px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-colors shadow-sm"
          >
            <ArrowLeft size={20} className="text-[#1D1D1D]" />
          </Link>
          <span className="font-extrabold text-base tracking-tight text-[#1D1D1D] font-coolvetica">
            Notifications Center
          </span>
          <div className="w-10 h-10 opacity-0 pointer-events-none" />
        </div>

        {/* 1. ACTIVE ALERTS SECTION (Action Items) */}
        {activeAlerts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#737373] px-1">
              Action Required
            </h3>
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <Link key={alert.id} href={alert.link} className="block">
                  <div className={`bg-white border rounded-2xl p-4 shadow-sm flex items-start gap-4 transition-all duration-200 hover:shadow-md border-l-4 ${
                    alert.badgeColor === 'red' ? 'border-l-red-500 border-[#E5E5E5]' :
                    alert.badgeColor === 'blue' ? 'border-l-indigo-500 border-[#E5E5E5]' :
                    alert.badgeColor === 'green' ? 'border-l-green-500 border-[#E5E5E5]' :
                    'border-l-purple-500 border-[#E5E5E5]'
                  }`}>
                    {alert.icon}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-[#1D1D1D] truncate">{alert.title}</h4>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                          alert.badgeColor === 'red' ? 'bg-red-50 text-red-600' :
                          alert.badgeColor === 'blue' ? 'bg-indigo-50 text-indigo-600' :
                          alert.badgeColor === 'green' ? 'bg-green-50 text-green-600' :
                          'bg-purple-50 text-purple-600'
                        }`}>
                          {alert.badgeText}
                        </span>
                      </div>
                      <p className="text-xs text-[#555555] mt-1 leading-relaxed">{alert.description}</p>
                    </div>
                    <ChevronRight size={16} className="text-[#A3A3A3] mt-2 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 2. HISTORY FEED SECTION */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#737373] px-1">
              Notifications History
            </h3>
            
            {/* Filter Tabs */}
            <div className="flex bg-white border border-[#E5E5E5] p-1 rounded-xl shadow-sm gap-0.5">
              <Link
                href="?filter=all"
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-colors ${
                  activeFilter === "all" ? "bg-[#1D1D1D] text-white" : "text-[#555555] hover:bg-neutral-100"
                }`}
              >
                All
              </Link>
              <Link
                href="?filter=announcements"
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-colors ${
                  activeFilter === "announcements" ? "bg-[#1D1D1D] text-white" : "text-[#555555] hover:bg-neutral-100"
                }`}
              >
                Updates
              </Link>
              <Link
                href="?filter=activity"
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-colors ${
                  activeFilter === "activity" ? "bg-[#1D1D1D] text-white" : "text-[#555555] hover:bg-neutral-100"
                }`}
              >
                Activity
              </Link>
            </div>
          </div>

          {/* List */}
          {notificationsFeed.length === 0 ? (
            <div className="text-center py-20 bg-white border border-[#E5E5E5] rounded-3xl p-6 shadow-sm">
              <Bell size={40} className="mx-auto mb-3 text-[#A3A3A3] opacity-50" />
              <p className="font-bold text-[#1D1D1D]">No notifications yet</p>
              <p className="text-sm text-[#555555] mt-1">Updates and activity logs will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notificationsFeed.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white border rounded-2xl p-5 shadow-sm space-y-3 transition-all duration-200 border-[#E5E5E5] hover:border-zinc-300 relative overflow-hidden ${
                    item.is_pinned ? "bg-[#0A9EDE]/5 border-[#0A9EDE]/30" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                        {getIcon(item.type, item.badgeColor)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#1D1D1D] leading-snug">{item.title}</h4>
                        <div className="flex items-center gap-1 text-[10px] text-[#A3A3A3] font-semibold mt-0.5">
                          <Clock size={10} />
                          {new Date(item.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.is_pinned && (
                        <Pin size={12} className="text-[#0A9EDE] shrink-0" />
                      )}
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 border rounded-full uppercase shrink-0 ${getBadgeClass(item.badgeColor)}`}>
                        {item.badgeText}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-[#555555] leading-relaxed whitespace-pre-wrap pl-[38px]">{item.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
