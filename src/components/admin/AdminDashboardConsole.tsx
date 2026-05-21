'use client'

import React, { useEffect, useMemo, useReducer } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  CircleAlert,
  Clock3,
  Copy,
  Flame,
  RefreshCw,
  Search,
  Sparkles,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

type AdminPermissions = {
  can_scan_tickets: boolean
  can_approve_deeds: boolean
  can_manage_events: boolean
  can_manage_courses: boolean
  can_manage_settings: boolean
  can_manage_admins: boolean
}

type DashboardMetrics = {
  totalUsers: number
  activeStreaks: number
  pendingDeeds: number
  upcomingEvents: number
  newMembers7d: number
  approvedDeeds7d: number
  attendance7d: number
}

type DeedItem = {
  id: string
  description: string | null
  status: 'pending' | 'approved' | 'rejected' | string
  created_at: string
  coin_reward: number | null
  bonus_coins: number | null
  profiles: {
    full_name: string | null
    role: string | null
  } | null
}

type EventItem = {
  id: string
  title: string
  date: string
  time: string | null
  location: string | null
  capacity: number | null
}

type DeedTrendItem = {
  dayLabel: string
  approved: number
  rejected: number
}

type Toast = {
  id: number
  title: string
  message: string
  tone: 'success' | 'info'
}

type State = {
  deedStatus: 'all' | 'pending' | 'approved' | 'rejected'
  search: string
  period: '7d' | '14d'
  onlyHighPriority: boolean
  toasts: Toast[]
}

type Action =
  | { type: 'setStatus'; payload: State['deedStatus'] }
  | { type: 'setSearch'; payload: string }
  | { type: 'setPeriod'; payload: State['period'] }
  | { type: 'toggleHighPriority' }
  | { type: 'addToast'; payload: Omit<Toast, 'id'> }
  | { type: 'dismissToast'; payload: number }

const initialState: State = {
  deedStatus: 'all',
  search: '',
  period: '7d',
  onlyHighPriority: false,
  toasts: [],
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setStatus':
      return { ...state, deedStatus: action.payload }
    case 'setSearch':
      return { ...state, search: action.payload }
    case 'setPeriod':
      return { ...state, period: action.payload }
    case 'toggleHighPriority':
      return { ...state, onlyHighPriority: !state.onlyHighPriority }
    case 'addToast':
      return {
        ...state,
        toasts: [...state.toasts, { id: Date.now() + Math.random(), ...action.payload }],
      }
    case 'dismissToast':
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.payload),
      }
    default:
      return state
  }
}

export default function AdminDashboardConsole({
  permissions,
  metrics,
  recentDeeds,
  recentEvents,
  deedTrendByDay,
}: {
  permissions: AdminPermissions
  metrics: DashboardMetrics
  recentDeeds: DeedItem[]
  recentEvents: EventItem[]
  deedTrendByDay: DeedTrendItem[]
}) {
  const router = useRouter()
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    if (!state.toasts.length) return
    const timers = state.toasts.map((toast) =>
      window.setTimeout(() => {
        dispatch({ type: 'dismissToast', payload: toast.id })
      }, 2800)
    )
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [state.toasts])

  const filteredDeeds = useMemo(() => {
    return recentDeeds.filter((deed) => {
      if (state.deedStatus !== 'all' && deed.status !== state.deedStatus) return false
      if (state.onlyHighPriority && deed.status !== 'pending') return false
      if (!state.search.trim()) return true
      const query = state.search.toLowerCase()
      return (
        deed.description?.toLowerCase().includes(query) ||
        deed.profiles?.full_name?.toLowerCase().includes(query)
      )
    })
  }, [recentDeeds, state.deedStatus, state.onlyHighPriority, state.search])

  const statusBreakdown = useMemo(() => {
    const tally = { pending: 0, approved: 0, rejected: 0 }
    for (const deed of recentDeeds) {
      if (deed.status === 'pending') tally.pending += 1
      if (deed.status === 'approved') tally.approved += 1
      if (deed.status === 'rejected') tally.rejected += 1
    }
    return tally
  }, [recentDeeds])

  const visibleTrend = useMemo(() => {
    return state.period === '7d' ? deedTrendByDay.slice(-7) : deedTrendByDay
  }, [deedTrendByDay, state.period])

  const maxTrendValue = Math.max(
    1,
    ...visibleTrend.flatMap((entry) => [entry.approved, entry.rejected])
  )

  const statCards = [
    {
      title: 'Total Members',
      value: metrics.totalUsers,
      subtitle: `+${metrics.newMembers7d} joined in 7 days`,
      icon: Users,
      tone: 'from-sky-500/15 to-blue-500/10 text-sky-700',
    },
    {
      title: 'Active Streaks',
      value: metrics.activeStreaks,
      subtitle: 'Volunteers with current momentum',
      icon: Flame,
      tone: 'from-orange-500/15 to-amber-500/10 text-orange-700',
    },
    {
      title: 'Pending Approvals',
      value: metrics.pendingDeeds,
      subtitle: metrics.pendingDeeds > 0 ? 'Needs review today' : 'Queue is clear',
      icon: CheckSquare,
      tone: 'from-rose-500/15 to-red-500/10 text-rose-700',
    },
    {
      title: 'Upcoming Events',
      value: metrics.upcomingEvents,
      subtitle: `${metrics.attendance7d} check-ins in 7 days`,
      icon: CalendarClock,
      tone: 'from-emerald-500/15 to-teal-500/10 text-emerald-700',
    },
  ]

  const topActions = [
    permissions.can_approve_deeds && { href: '/admin/approvals', label: 'Review deed queue' },
    (permissions.can_scan_tickets || permissions.can_manage_events) && {
      href: '/admin/events',
      label: 'Open events control',
    },
    permissions.can_manage_admins && { href: '/admin/users', label: 'Manage admin access' },
    permissions.can_manage_settings && { href: '/admin/settings', label: 'Tune rewards & settings' },
    permissions.can_manage_courses && { href: '/admin/courses', label: 'Manage LMS courses' },
  ].filter(Boolean) as { href: string; label: string }[]

  const pendingRate = recentDeeds.length
    ? Math.round((statusBreakdown.pending / recentDeeds.length) * 100)
    : 0

  return (
    <div className="space-y-6 pb-16">
      <div className="relative overflow-hidden rounded-3xl border border-[#202535] bg-gradient-to-br from-[#101624] via-[#1B2438] to-[#232946] p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles size={14} />
              Admin command center
            </span>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Operations dashboard rebuilt for speed
            </h1>
            <p className="max-w-2xl text-sm text-slate-200/90">
              Monitor approvals, events, member activity, and control links in one responsive board.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              leftIcon={<RefreshCw size={14} />}
              onClick={() => {
                router.refresh()
                dispatch({
                  type: 'addToast',
                  payload: {
                    title: 'Dashboard refreshed',
                    message: 'Live stats were refreshed from the latest server state.',
                    tone: 'success',
                  },
                })
              }}
            >
              Refresh live data
            </Button>
            <Button
              variant="secondary"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              leftIcon={<Copy size={14} />}
              onClick={async () => {
                const snapshot = `Members: ${metrics.totalUsers}, Pending deeds: ${metrics.pendingDeeds}, Upcoming events: ${metrics.upcomingEvents}`
                await navigator.clipboard.writeText(snapshot)
                dispatch({
                  type: 'addToast',
                  payload: {
                    title: 'Snapshot copied',
                    message: 'Status summary copied to clipboard for reporting.',
                    tone: 'info',
                  },
                })
              }}
            >
              Copy status snapshot
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="border-zinc-200/80 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      {card.title}
                    </p>
                    <h3 className="mt-1 text-3xl font-black text-zinc-900">{card.value}</h3>
                  </div>
                  <div className={`rounded-2xl bg-gradient-to-br p-3 ${card.tone}`}>
                    <Icon size={20} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs font-medium text-zinc-500">{card.subtitle}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Deed approvals trend</CardTitle>
                <CardDescription>Approvals vs rejections for the selected period</CardDescription>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
                {(['7d', '14d'] as const).map((period) => (
                  <button
                    key={period}
                    className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                      state.period === period ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
                    }`}
                    onClick={() => dispatch({ type: 'setPeriod', payload: period })}
                  >
                    {period.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-7 gap-2 sm:grid-cols-14">
              {visibleTrend.map((entry, idx) => (
                <div key={`${entry.dayLabel}-${idx}`} className="flex flex-col items-center gap-2">
                  <div className="flex h-24 w-full items-end justify-center gap-1 rounded-lg bg-zinc-50 p-2">
                    <div
                      className="w-2 rounded-full bg-emerald-500"
                      style={{ height: `${Math.max(6, (entry.approved / maxTrendValue) * 100)}%` }}
                    />
                    <div
                      className="w-2 rounded-full bg-rose-500"
                      style={{ height: `${Math.max(6, (entry.rejected / maxTrendValue) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase text-zinc-500">{entry.dayLabel}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-medium text-zinc-500">
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Approved
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                Rejected
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle className="text-base">Queue health</CardTitle>
            <CardDescription>Live distribution from recent deed flow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'pending', label: 'Pending', value: statusBreakdown.pending, tone: 'bg-amber-500' },
              { key: 'approved', label: 'Approved', value: statusBreakdown.approved, tone: 'bg-emerald-500' },
              { key: 'rejected', label: 'Rejected', value: statusBreakdown.rejected, tone: 'bg-rose-500' },
            ].map((item) => {
              const percentage = recentDeeds.length ? Math.round((item.value / recentDeeds.length) * 100) : 0
              return (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-600">
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100">
                    <div
                      className={`h-2 rounded-full ${item.tone}`}
                      style={{ width: `${Math.max(4, percentage)}%` }}
                    />
                  </div>
                </div>
              )
            })}

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
              <p className="font-semibold text-zinc-900">Priority signal</p>
              <p className="mt-1">
                {pendingRate >= 40
                  ? 'High pending ratio detected. Prioritize approvals now.'
                  : 'Queue pressure is stable. Maintain regular review cadence.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">Operational deed queue</CardTitle>
                <CardDescription>Filter by status, search volunteers, and prioritize urgent work</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                  <button
                    key={status}
                    className={`rounded-full px-3 py-1 text-xs font-bold capitalize transition ${
                      state.deedStatus === status
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                    onClick={() => dispatch({ type: 'setStatus', payload: status })}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative flex-1">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  value={state.search}
                  onChange={(event) => dispatch({ type: 'setSearch', payload: event.target.value })}
                  placeholder="Search by volunteer or deed text"
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none ring-zinc-700 focus:ring-2"
                />
              </label>
              <button
                className={`h-10 rounded-lg px-3 text-xs font-bold transition ${
                  state.onlyHighPriority
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
                onClick={() => dispatch({ type: 'toggleHighPriority' })}
              >
                High priority only
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-200">
              <div className="max-h-[420px] overflow-auto">
                <div className="divide-y divide-zinc-200">
                  {filteredDeeds.length ? (
                    filteredDeeds.map((deed) => (
                      <div key={deed.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-zinc-900">
                              {deed.profiles?.full_name || 'Anonymous Member'}
                            </p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                deed.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : deed.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {deed.status}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-xs text-zinc-600">
                            {deed.description || 'No description provided'}
                          </p>
                          <p className="text-[11px] font-medium text-zinc-400">
                            {new Date(deed.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="text-xs font-semibold text-zinc-500">
                          Base {deed.coin_reward || 10} • Bonus {deed.bonus_coins || 0}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-sm text-zinc-500">
                      No deed entries match your current filter set.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 xl:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Control actions</CardTitle>
              <CardDescription>Fast links to common admin operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {topActions.length ? (
                topActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                    onClick={() =>
                      dispatch({
                        type: 'addToast',
                        payload: {
                          title: 'Opening module',
                          message: action.label,
                          tone: 'info',
                        },
                      })
                    }
                  >
                    {action.label}
                    <ArrowRight size={14} />
                  </Link>
                ))
              ) : (
                <p className="text-xs text-zinc-500">No elevated actions available for your role.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming event window</CardTitle>
              <CardDescription>Next events and turnout prep</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentEvents.length ? (
                recentEvents.map((event) => (
                  <div key={event.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{event.title}</p>
                        <p className="text-xs text-zinc-500">{event.location || 'Location TBD'}</p>
                      </div>
                      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-black uppercase text-zinc-700">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {event.time || 'TBA'} • Capacity {event.capacity || 0}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-500">No events are currently scheduled.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex w-[min(92vw,360px)] flex-col gap-2">
        {state.toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2 rounded-xl border px-3 py-2 shadow-lg ${
              toast.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-sky-200 bg-sky-50 text-sky-900'
            }`}
          >
            {toast.tone === 'success' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <BellRing size={16} className="mt-0.5 shrink-0" />}
            <div className="min-w-0">
              <p className="text-xs font-black">{toast.title}</p>
              <p className="text-xs">{toast.message}</p>
            </div>
            <button
              className="ml-auto text-xs font-bold opacity-70 hover:opacity-100"
              onClick={() => dispatch({ type: 'dismissToast', payload: toast.id })}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-700">
            <Clock3 size={14} />
            Next shift suggestion
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {metrics.pendingDeeds > 12
              ? 'Assign another reviewer for deed approvals during peak hours.'
              : 'Current approval staffing looks balanced.'}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-700">
            <CircleAlert size={14} />
            Alert monitor
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {metrics.upcomingEvents > 2
              ? 'Multiple events upcoming. Prepare extra scanning operators.'
              : 'Event load is manageable this cycle.'}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-700">
            <CheckCircle2 size={14} />
            Weekly KPI
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {metrics.approvedDeeds7d} deeds approved and {metrics.attendance7d} attendance check-ins this week.
          </p>
        </div>
      </div>
    </div>
  )
}
