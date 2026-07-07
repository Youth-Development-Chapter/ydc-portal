'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'

type CheckInPayload = {
  status: 'success' | 'already_checked_in' | 'failed'
  userName: string
  eventTitle: string
  error?: string | null
}

/**
 * App-wide listener for event check-in broadcasts. Subscribes to the
 * `checkin-${userId}` channel whenever the user is logged in (regardless of
 * which screen they are on or whether their QR modal is open). On a successful
 * scan it shows a WhatsApp-style success overlay, then redirects to /dashboard.
 *
 * The broadcast contract (channel name, event name, payload shape) matches the
 * scanner in PresidentScannerClient and the check-in API route.
 */
export default function CheckInListener({ userId }: { userId: string }) {
  const router = useRouter()
  const [checkInStatus, setCheckInStatus] = useState<CheckInPayload | null>(null)

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    const channel = supabase
      .channel('volunteer-checkin-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'event_registrations',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const newRow = payload.new as any
          if (newRow.status === 'present' && newRow.attended) {
            // Fetch event title
            const { data: eventData } = await supabase
              .from('events')
              .select('title')
              .eq('id', newRow.event_id)
              .single()

            // Fetch profile name
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', userId)
              .single()

            const eventTitle = eventData?.title || 'YDC Event'
            const userName = profileData?.full_name || 'Volunteer'

            setCheckInStatus({
              status: 'success',
              userName,
              eventTitle
            })

            toast.success('Check-In Complete!', {
              description: `${userName}, you are checked in for "${eventTitle}".`,
            })

            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([100, 50, 100])
            }
            
            router.refresh()
            setTimeout(() => {
              setCheckInStatus(null)
              router.push('/dashboard')
            }, 2200)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, router])

  if (!checkInStatus) return null

  const isPositive =
    checkInStatus.status === 'success' || checkInStatus.status === 'already_checked_in'

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 shadow-2xl text-center relative max-w-sm w-full animate-in zoom-in-95 fade-in duration-300">
        {isPositive ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
              <CheckCircle2 size={56} className="stroke-[2.5px] animate-bounce" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-base text-zinc-900">Check-In Successful!</h4>
              <p className="text-xs text-zinc-500 max-w-[240px] mx-auto leading-relaxed">
                {checkInStatus.userName}, you are now marked as <strong>Present</strong> for &quot;{checkInStatus.eventTitle}&quot;.
              </p>
            </div>
            {checkInStatus.status === 'already_checked_in' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Already checked in
              </span>
            )}
            {checkInStatus.status === 'success' && (
              <p className="text-[10px] text-zinc-400">Taking you to your dashboard…</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shadow-inner">
              <AlertCircle size={56} className="stroke-[2.5px] animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-base text-red-600">Check-In Failed</h4>
              <p className="text-xs text-zinc-500 max-w-[240px] mx-auto leading-relaxed">
                {checkInStatus.error || 'You are not eligible or registered for this event.'}
              </p>
            </div>
            <button
              onClick={() => setCheckInStatus(null)}
              className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl transition shadow-sm"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
