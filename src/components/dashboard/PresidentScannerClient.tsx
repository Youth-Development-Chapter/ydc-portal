'use client'

import React, { useState } from 'react'
import { QrCode, Loader2 } from 'lucide-react'
import QrScannerWidget from '@/components/admin/QrScannerWidget'
import { checkInTicket } from '@/app/admin/actions'
import { toast } from 'sonner'

export default function PresidentScannerClient({
  initialEvents,
}: {
  initialEvents: any[]
}) {
  const [scanEventId, setScanEventId] = useState<string>(initialEvents.length > 0 ? initialEvents[0].id : '')
  const [ticketInput, setTicketInput] = useState('')
  const [isScanning, setIsScanning] = useState(false)

  const handleTicketScan = async (code?: string) => {
    const input = (code || ticketInput).trim()
    if (!input || !scanEventId) return
    setIsScanning(true)
    try {
      const res = await checkInTicket(input, scanEventId)
      if (res?.error) {
        if (res.alreadyScanned) {
          toast.warning('Already Checked In', { description: `Ticket was already scanned for ${res.userName}.` })
        } else {
          toast.error(res.error)
        }
      } else {
        toast.success('Check-In Complete!', { description: `${res.userName} · +${res.coinsAwarded} Coins` })
        setTicketInput('')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error occurred during check-in.')
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200 space-y-5">
      <div className="space-y-1">
        <h3 className="font-extrabold text-sm text-zinc-900 flex items-center gap-2">
          <QrCode size={16} className="text-[#0A9EDE]" />
          Ticket Scanner
        </h3>
        <p className="text-xs text-zinc-500">Scan a volunteer's QR code or enter their ID to check them in.</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">Event</label>
        <select
          value={scanEventId}
          onChange={(e) => setScanEventId(e.target.value)}
          className="w-full text-sm p-3 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-900 bg-white"
        >
          <option value="">Select an Event…</option>
          {initialEvents.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title} ({new Date(ev.date).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      <QrScannerWidget
        onScan={(value) => {
          setTicketInput(value)
          if (value.trim() && scanEventId) {
            setTimeout(() => handleTicketScan(value), 300)
          }
        }}
        label="Scan QR Code"
      />

      <div className="border-t border-zinc-100 pt-4 space-y-3">
        <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">Or Enter Manually</label>
        <div className="flex gap-2">
          <input
            className="flex-1 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-center uppercase focus:outline-none focus:border-[#0A9EDE]"
            placeholder="User ID or Member ID"
            value={ticketInput}
            onChange={(e) => setTicketInput(e.target.value)}
            disabled={isScanning}
          />
          <button
            onClick={() => handleTicketScan()}
            disabled={isScanning || !ticketInput.trim() || !scanEventId}
            className="px-4 py-2.5 bg-[#0BA242] text-white text-sm font-bold rounded-xl disabled:opacity-50 hover:bg-[#098C39] transition-colors"
          >
            {isScanning ? <Loader2 size={16} className="animate-spin" /> : 'Check In'}
          </button>
        </div>
      </div>
    </div>
  )
}
