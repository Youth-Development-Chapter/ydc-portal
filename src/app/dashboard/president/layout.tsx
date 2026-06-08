import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext } from '@/lib/admin'
import PresidentNav from '@/components/dashboard/PresidentNav'
import PageHeader from '@/components/ui/PageHeader'
import { Settings } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PresidentLayout({
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

  // Fetch role and permissions
  const { role, permissions } = await getAdminContext(user.id)
  
  // Only allow President, Superadmin, and legacy Admin roles
  if (!['president', 'superadmin', 'admin'].includes(role)) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1D1D1D] pb-24 relative overflow-hidden">
      <div className="fluid-top-gradient" />

      <main className="max-w-4xl mx-auto w-full px-4 py-6 space-y-6 relative z-10">
        <PageHeader
          title="President Console"
          backHref="/dashboard"
          rightElement={
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#E5E5E5] shadow-sm">
              <Settings size={18} className="text-zinc-400" />
            </div>
          }
        />

        {/* Navigation Tabs */}
        <PresidentNav permissions={permissions} />

        {/* Page Content */}
        <div className="animate-in fade-in duration-300">
          {children}
        </div>
      </main>
    </div>
  )
}
