'use client'

import React, { useState } from 'react'
import { Clock, CheckCircle2, XCircle, AlertCircle, ExternalLink } from "lucide-react"
import LocalTime from "@/components/ui/LocalTime"
import { Button } from '@/components/ui/Button'

export default function DeedHistoryClient({ submissions }: { submissions: any[] }) {
  const [visibleCount, setVisibleCount] = useState(5)
  
  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-8 text-[#A3A3A3] text-sm border border-dashed border-[#E5E5E5] rounded-2xl bg-slate-50/30">
        No good deeds logged yet. Start today!
      </div>
    )
  }

  const visibleSubmissions = submissions.slice(0, visibleCount)
  const hasMore = visibleCount < submissions.length

  return (
    <div className="space-y-4">
      {visibleSubmissions.map((submission) => {
        return (
          <div key={submission.id} className="border border-[#F0F0F0] rounded-2xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#1D1D1D] leading-tight">{submission.description}</p>
                <p className="text-[10px] text-[#8A8A8A] flex items-center gap-1">
                  <Clock size={10} />
                  <LocalTime dateStr={submission.created_at} />
                </p>
              </div>

              {/* Status Badges */}
              {submission.status === 'approved' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 shrink-0">
                  <CheckCircle2 size={12} className="text-green-600" />
                  Approved
                </span>
              )}
              {submission.status === 'rejected' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 shrink-0">
                  <XCircle size={12} className="text-red-600" />
                  Rejected
                </span>
              )}
              {submission.status === 'pending' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 shrink-0 animate-pulse">
                  <Clock size={12} className="text-amber-600" />
                  Pending
                </span>
              )}
            </div>

            {/* Proof Image Attachment */}
            {submission.proof_url && (
              <div className="flex items-center gap-3 pt-2 border-t border-[#F5F5F5]">
                <div className="relative w-12 h-12 rounded-lg bg-gray-100 border border-[#E5E5E5] overflow-hidden shrink-0">
                  <img 
                    src={submission.proof_url} 
                    alt="Proof thumbnail" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <a 
                    href={submission.proof_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[11px] font-semibold text-[#0A9EDE] hover:underline inline-flex items-center gap-1"
                  >
                    View Verification Proof
                    <ExternalLink size={10} />
                  </a>
                  <p className="text-[9px] text-[#A3A3A3] truncate">Uploaded via attachment</p>
                </div>
              </div>
            )}

            {/* Admin Feedback Notes */}
            {submission.admin_notes && (
              <div className={`border rounded-xl p-3 text-xs ${
                submission.status === 'approved' 
                  ? "bg-green-50/50 border-green-200/60 text-green-800" 
                  : submission.status === 'rejected'
                    ? "bg-red-50/70 border-red-100 text-red-800"
                    : "bg-amber-50/50 border-amber-100 text-amber-800"
              }`}>
                <p className="font-bold flex items-center gap-1 mb-0.5">
                  {submission.status === 'approved' ? (
                    <CheckCircle2 size={12} className="text-green-600" />
                  ) : submission.status === 'rejected' ? (
                    <XCircle size={12} className="text-red-600" />
                  ) : (
                    <AlertCircle size={12} className="text-amber-600" />
                  )}
                  Admin Feedback:
                </p>
                <p className="italic">&ldquo;{submission.admin_notes}&rdquo;</p>
              </div>
            )}

            {submission.status === 'approved' && (
              <div className="bg-green-50/40 border border-green-200 rounded-xl p-2 text-[10px] text-green-800 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                <span>Credited **+{(submission.coin_reward ?? 10) + (submission.bonus_coins ?? 0)} YDC Coins** to wallet</span>
              </div>
            )}
          </div>
        )
      })}

      {hasMore && (
        <div className="pt-2 flex justify-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setVisibleCount(prev => prev + 5)}
            className="w-full text-xs border-zinc-200 bg-white"
          >
            Load More Deeds
          </Button>
        </div>
      )}
    </div>
  )
}
