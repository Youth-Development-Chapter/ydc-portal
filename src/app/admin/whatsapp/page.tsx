import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext } from '@/lib/admin'
import WhatsAppManager from '@/components/admin/WhatsAppManager'

export const dynamic = 'force-dynamic'

export default async function AdminWhatsAppPage() {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Verify permission
  const { permissions } = await getAdminContext(user.id)
  if (!permissions.can_manage_settings) {
    redirect('/admin')
  }

  // Fetch all system settings
  const { data: settings } = await supabase
    .from('system_settings')
    .select('*')

  // Fetch current live status
  const currentStatus = (globalThis as any).whatsappStatus || {
    status: 'disconnected',
    error: 'Not initialized',
    updatedAt: new Date().toISOString(),
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-zinc-950">WhatsApp Integration Agent</h1>
        <p className="text-zinc-500 text-sm">
          Link the portal with your WhatsApp Business number, monitor connection status, and configure authorized numbers/roles.
        </p>
      </div>

      <WhatsAppManager 
        initialSettings={settings || []} 
        initialStatus={currentStatus} 
      />
    </div>
  )
}
