import React from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext } from '@/lib/admin'
import { 
  Users, 
  Flame, 
  CheckSquare, 
  Calendar, 
  Coins, 
  Award, 
  ArrowRight,
  TrendingUp,
  FileCheck
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardOverview() {
  const supabase = await createClient()

  // Fetch security context to verify permissions
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { permissions } = await getAdminContext(user.id)

  // 1. Fetch total users count
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // 2. Fetch active streaks (current_streak > 0)
  const { count: activeStreaks } = await supabase
    .from('streaks')
    .select('*', { count: 'exact', head: true })
    .gt('current_streak', 0)

  // 3. Fetch pending deeds count
  const { count: pendingDeeds } = await supabase
    .from('deed_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // 4. Fetch upcoming events count
  const todayStr = new Date().toISOString().split('T')[0]
  const { count: upcomingEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .gte('date', todayStr)

  // 5. Fetch recent deed submissions
  const { data: recentDeeds } = await supabase
    .from('deed_submissions')
    .select('*, profiles:user_id(full_name, role)')
    .order('created_at', { ascending: false })
    .limit(5)

  // 6. Fetch recent events
  const { data: recentEvents } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true })
    .gte('date', todayStr)
    .limit(3)

  // Summary Metrics
  const stats = [
    {
      name: 'Total Members',
      value: totalUsers || 0,
      description: 'Registered profiles',
      icon: Users,
      color: 'text-[#0A9EDE] bg-[#0A9EDE]/10',
    },
    {
      name: 'Active Streaks',
      value: activeStreaks || 0,
      description: 'Streaking volunteers',
      icon: Flame,
      color: 'text-orange-500 bg-orange-500/10',
    },
    {
      name: 'Pending Deeds',
      value: pendingDeeds || 0,
      description: 'Awaiting verification',
      icon: CheckSquare,
      color: pendingDeeds && pendingDeeds > 0 ? 'text-[#DD0408] bg-[#DD0408]/10' : 'text-[#0BA242] bg-[#0BA242]/10',
    },
    {
      name: 'Upcoming Events',
      value: upcomingEvents || 0,
      description: 'Scheduled activities',
      icon: Calendar,
      color: 'text-[#0BA242] bg-[#0BA242]/10',
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-3xl p-8 border border-zinc-800 shadow-xl relative overflow-hidden text-white">
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,#DD0408,transparent_60%)]"></div>
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Overview Dashboard</h1>
          <p className="text-zinc-400 text-sm max-w-xl">
            Welcome to the YDC Administration panel. Review volunteer deeds, check in event attendees, manage rewards, and customize permissions.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.name} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{stat.name}</span>
                  <h3 className="text-3xl font-extrabold text-zinc-950 mt-1">{stat.value}</h3>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color} shrink-0`}>
                  <Icon size={24} />
                </div>
              </CardHeader>
              <CardContent className="mt-1">
                <span className="text-xs text-zinc-400 font-medium">{stat.description}</span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Approvals Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-zinc-900">Recent Deed Activity</h2>
              <p className="text-xs text-zinc-400">Latest volunteer deed submissions</p>
            </div>
            {permissions.can_approve_deeds && (
              <Link href="/admin/approvals">
                <Button size="sm" variant="outline" rightIcon={<ArrowRight size={14} />}>
                  Go to Approvals
                </Button>
              </Link>
            )}
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-200">
                {recentDeeds && recentDeeds.length > 0 ? (
                  recentDeeds.map((deed) => (
                    <div key={deed.id} className="p-5 flex items-start justify-between gap-4 hover:bg-zinc-50 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-900">
                            {deed.profiles?.full_name || 'Anonymous User'}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            deed.status === 'approved' ? 'bg-[#0BA242]/10 text-[#0BA242]' :
                            deed.status === 'rejected' ? 'bg-[#DD0408]/10 text-[#DD0408]' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {deed.status}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 line-clamp-1">{deed.description}</p>
                        <span className="text-[10px] text-zinc-400 font-mono block">
                          Submitted on {new Date(deed.created_at).toLocaleDateString('en-US')}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs font-bold text-zinc-400">
                          Base: {deed.coin_reward || 10} C
                        </span>
                        {deed.bonus_coins > 0 && (
                          <span className="text-xs font-extrabold text-[#0BA242] block">
                            +{deed.bonus_coins} Bonus
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-zinc-400">
                    <FileCheck size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No recent deed submissions found.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Context */}
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-zinc-900">Upcoming Events</h2>
            <p className="text-xs text-zinc-400">Next event check-ins</p>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-4">
              {recentEvents && recentEvents.length > 0 ? (
                <div className="space-y-4">
                  {recentEvents.map((event) => (
                    <div key={event.id} className="p-4 bg-zinc-50 border border-zinc-150 rounded-xl space-y-2 hover:border-[#0A9EDE]/30 transition-colors">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-700 font-extrabold tracking-wider uppercase inline-block">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <h4 className="font-bold text-sm text-zinc-900 leading-tight">{event.title}</h4>
                      <p className="text-xs text-zinc-500 leading-normal truncate">{event.location}</p>
                    </div>
                  ))}
                  {(permissions.can_scan_tickets || permissions.can_manage_events) && (
                    <Link href="/admin/events" className="block">
                      <Button size="sm" className="w-full bg-[#1D1D1D] hover:bg-black text-white">
                        Manage Events
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-400">
                  <p className="text-xs">No upcoming events scheduled.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats Panel */}
          <Card className="shadow-sm bg-gradient-to-br from-[#0A9EDE]/5 to-[#0BA242]/5 border border-[#0A9EDE]/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp size={16} className="text-[#0A9EDE]" />
                LMS & Rewards Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-zinc-500 space-y-3">
              <p>
                LMS Course completion and volunteer deeds award coins automatically via PostgreSQL hooks.
              </p>
              <ul className="space-y-1 list-disc pl-4">
                <li>Daily Deed: 10 + optional Admin Bonus</li>
                <li>LMS Complete: Set per course (default 50)</li>
                <li>Event Attendance: 50 Coins</li>
              </ul>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
