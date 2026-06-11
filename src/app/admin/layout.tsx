import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext } from '@/lib/admin'
import AdminNav from '@/components/admin/AdminNav'
import {
  ArrowLeft,
  Shield,
  User,
} from 'lucide-react'
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch admin context
  const { role, permissions } = await getAdminContext(user.id)
  
  if (role === 'volunteer') {
    redirect('/dashboard')
  }

  // Format user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()
  
  const adminName = profile?.full_name || 'Admin Member'

  const roleLabels: Record<string, string> = {
    superadmin: 'Super Admin',
    president: 'President Admin',
    'tier-3': 'Tier 3 Admin',
    admin: 'Administrator',
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-zinc-200 text-zinc-700 flex-col fixed inset-y-0 left-0 z-30 shrink-0">
        {/* Brand Logo Header */}
        <div className="h-16 px-6 border-b border-zinc-200 flex items-center gap-3">
          <img src="/logocolor.png" alt="YDC Logo" className="h-9 w-auto object-contain" />
          <div className="min-w-0">
            <span className="font-bold text-zinc-900 tracking-tight text-sm block leading-tight">YDC Portal</span>
            <span className="text-[9px] text-[#DD0408] font-bold tracking-widest uppercase">Admin Panel</span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-4 bg-zinc-50 rounded-xl border border-zinc-200/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-600 shadow-inner">
            <User size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-900 truncate" title={adminName}>{adminName}</p>
            <div className="flex items-center gap-1 mt-0.5 text-zinc-500 font-bold text-[10px] uppercase tracking-wider">
              <Shield size={10} className="text-[#DD0408]" />
              <span>{roleLabels[role] || 'Admin'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <AdminNav role={role} permissions={permissions} desktopOnly />

        {/* Footer Actions */}
        <div className="p-3 border-t border-zinc-200">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-all duration-150"
          >
            <ArrowLeft size={18} className="text-zinc-400" />
            <span>Volunteer Portal</span>
          </Link>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="pl-0 lg:pl-64 pb-16 lg:pb-0 flex-1 flex flex-col min-h-screen">
        {/* TOP NAVBAR */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile Header brand */}
            <div className="lg:hidden flex items-center gap-2">
              <img src="/logocolor.png" alt="YDC Logo" className="h-8 w-auto object-contain" />
              <span className="font-bold text-zinc-900 tracking-tight text-sm">YDC Admin</span>
            </div>
            {/* Desktop Header brand */}
            <h2 className="hidden lg:block text-lg font-bold text-zinc-900 tracking-tight">
              YDC Administration System
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-100 rounded-full text-[11px] font-extrabold text-red-600">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
              <span>LIVE<span className="hidden sm:inline"> ADMIN MODE</span></span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 p-4 md:p-8 bg-zinc-50">
          {children}
        </main>
      </div>
      
      {/* Mobile Bottom Tab Navigation */}
      <AdminNav role={role} permissions={permissions} mobileOnly />
    </div>
  )
}
