'use client'

import React, { useState } from 'react'
import { 
  Flame, 
  MapPin, 
  GraduationCap, 
  Check, 
  X, 
  Image as ImageIcon,
  MessageSquare,
  Sparkles,
  AlertTriangle
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { approveDeedSubmission, rejectDeedSubmission } from '@/app/admin/actions'

interface MappedSubmission {
  id: string
  user_id: string
  description: string
  proof_url: string
  created_at: string
  profiles: {
    full_name: string
    division: string
    qualification: string
    id: string
  }
  streak: number
}

export default function ApprovalsQueue({
  initialSubmissions,
}: {
  initialSubmissions: MappedSubmission[]
}) {
  const [submissions, setSubmissions] = useState<MappedSubmission[]>(initialSubmissions)
  
  // Modals state
  const [activeDeed, setActiveDeed] = useState<MappedSubmission | null>(null)
  const [modalType, setModalType] = useState<'approve' | 'reject' | 'image' | null>(null)
  
  // Input fields state
  const [bonusCoins, setBonusCoins] = useState<number>(0)
  const [adminNotes, setAdminNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const openModal = (deed: MappedSubmission, type: 'approve' | 'reject' | 'image') => {
    setActiveDeed(deed)
    setModalType(type)
    setBonusCoins(0)
    setAdminNotes('')
    setActionError(null)
  }

  const closeModal = () => {
    setActiveDeed(null)
    setModalType(null)
    setBonusCoins(0)
    setAdminNotes('')
    setActionError(null)
  }

  const handleApprove = async () => {
    if (!activeDeed) return
    setIsSubmitting(true)
    setActionError(null)

    try {
      const res = await approveDeedSubmission(activeDeed.id, bonusCoins, adminNotes)
      if (res?.error) {
        setActionError(res.error)
      } else {
        // Success: remove from local list
        setSubmissions(prev => prev.filter(s => s.id !== activeDeed.id))
        closeModal()
      }
    } catch (err: any) {
      setActionError(err.message || 'An error occurred during approval.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!activeDeed) return
    if (!adminNotes.trim()) {
      setActionError('A rejection reason is required.')
      return
    }
    setIsSubmitting(true)
    setActionError(null)

    try {
      const res = await rejectDeedSubmission(activeDeed.id, adminNotes)
      if (res?.error) {
        setActionError(res.error)
      } else {
        // Success: remove from local list
        setSubmissions(prev => prev.filter(s => s.id !== activeDeed.id))
        closeModal()
      }
    } catch (err: any) {
      setActionError(err.message || 'An error occurred during rejection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {submissions.length === 0 ? (
        <Card className="border-dashed border-zinc-200">
          <CardContent className="p-16 text-center text-zinc-400">
            <Check size={48} className="mx-auto mb-4 text-[#0BA242] opacity-40 bg-[#0BA242]/10 p-3 rounded-full h-14 w-14" />
            <h3 className="font-bold text-zinc-700 text-lg mb-1">Queue is Clear!</h3>
            <p className="text-sm">There are no pending deeds to review right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {submissions.map((deed) => (
            <Card key={deed.id} className="shadow-sm flex flex-col justify-between hover:border-[#0A9EDE]/20 transition-all duration-300">
              <div>
                {/* Header card with volunteer context */}
                <CardHeader className="bg-zinc-50 border-b border-zinc-100 p-5 flex flex-row items-center justify-between">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{deed.profiles.full_name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500">
                        <MapPin size={12} className="text-zinc-400" />
                        <span>{deed.profiles.division}</span>
                      </div>
                      <span className="text-zinc-300">•</span>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500">
                        <GraduationCap size={12} className="text-zinc-400" />
                        <span>{deed.profiles.qualification}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full shadow-inner shrink-0">
                    <Flame size={14} className="text-orange-500 fill-orange-500" />
                    <span className="font-extrabold text-xs text-orange-600">{deed.streak}</span>
                  </div>
                </CardHeader>

                {/* Content area: deed details */}
                <div className="p-5 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Submitted Deed Description</span>
                    <p className="text-sm text-zinc-700 leading-relaxed font-medium">
                      {deed.description}
                    </p>
                  </div>

                  {deed.proof_url && (
                    <div 
                      onClick={() => openModal(deed, 'image')}
                      className="group relative cursor-zoom-in aspect-video max-h-48 w-full rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200"
                    >
                      <img 
                        src={deed.proof_url} 
                        alt="Deed Proof" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity gap-1.5 font-bold text-xs">
                        <ImageIcon size={16} />
                        View Proof Image
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-5 pt-0 flex gap-3 mt-auto">
                <Button 
                  onClick={() => openModal(deed, 'approve')}
                  className="flex-1 bg-[#0BA242] border-[#0BA242] hover:bg-[#0BA242]/90 text-white"
                  leftIcon={<Check size={16} />}
                >
                  Approve
                </Button>
                <Button 
                  onClick={() => openModal(deed, 'reject')}
                  variant="outline"
                  className="flex-1 border-[#DD0408] text-[#DD0408] hover:bg-[#DD0408]/5"
                  leftIcon={<X size={16} />}
                >
                  Reject
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* LIGHTBOX IMAGE MODAL */}
      {modalType === 'image' && activeDeed && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full max-h-[85vh] flex flex-col bg-zinc-950 rounded-2xl overflow-hidden">
            <button 
              onClick={closeModal}
              className="absolute right-4 top-4 z-10 w-10 h-10 rounded-full bg-black/60 text-white hover:bg-black flex items-center justify-center border border-white/10 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="flex-1 overflow-hidden p-6 flex items-center justify-center">
              <img 
                src={activeDeed.proof_url} 
                alt="Verification Proof" 
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>
            <div className="bg-zinc-900 px-6 py-4 border-t border-zinc-800 text-white">
              <p className="text-xs font-semibold text-zinc-400">SUBMITTED BY: {activeDeed.profiles.full_name}</p>
              <p className="text-sm mt-1">{activeDeed.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL CONFIGURATION MODAL */}
      {modalType === 'approve' && activeDeed && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-150 flex justify-between items-center bg-zinc-50">
              <h3 className="font-extrabold text-zinc-900 flex items-center gap-2">
                <Sparkles size={18} className="text-[#0BA242]" />
                Approve Submission
              </h3>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-6">
              <div className="space-y-1">
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Volunteer</p>
                <p className="font-bold text-zinc-900 text-sm">{activeDeed.profiles.full_name}</p>
              </div>

              {/* Bonus Coins configuration */}
              <div className="space-y-3">
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider flex justify-between">
                  <span>Bonus Coins</span>
                  <span className="text-[#0BA242] font-extrabold">+{bonusCoins} Coins</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  step="5"
                  value={bonusCoins}
                  onChange={(e) => setBonusCoins(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-[#0BA242]"
                />
                <div className="flex justify-between text-[10px] text-zinc-400 font-bold font-mono">
                  <span>0 (No Bonus)</span>
                  <span>25</span>
                  <span>50 (Max Bonus)</span>
                </div>
              </div>

              {/* Ledger Summary */}
              <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500 font-bold">Total Award Summary</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Base (10) + Bonus ({bonusCoins})</p>
                </div>
                <div className="flex items-center gap-1 bg-[#0BA242]/10 border border-[#0BA242]/20 px-3.5 py-2 rounded-xl text-right">
                  <span className="font-extrabold text-xl text-[#0BA242]">{10 + bonusCoins}</span>
                  <span className="text-[10px] font-bold text-[#0BA242]/80 uppercase">Coins</span>
                </div>
              </div>

              {/* Comments Notes */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare size={12} />
                  Approval Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Inspiring initiative! Keep up the amazing work."
                  rows={3}
                  className="w-full text-sm p-3 rounded-lg border border-zinc-200 focus:outline-none focus:border-[#0A9EDE]"
                />
              </div>

              {actionError && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-100 text-xs text-red-600 rounded-lg font-medium">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-zinc-150 bg-zinc-50 flex justify-end gap-3">
              <Button onClick={closeModal} variant="outline" size="sm">
                Cancel
              </Button>
              <Button 
                onClick={handleApprove}
                disabled={isSubmitting}
                isLoading={isSubmitting}
                className="bg-[#0BA242] hover:bg-[#0BA242]/90 border-[#0BA242] text-white"
                size="sm"
              >
                Confirm Approval
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION CONFIGURATION MODAL */}
      {modalType === 'reject' && activeDeed && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-150 flex justify-between items-center bg-zinc-50">
              <h3 className="font-extrabold text-zinc-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-[#DD0408]" />
                Reject Submission
              </h3>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Volunteer</p>
                <p className="font-bold text-zinc-900 text-sm">{activeDeed.profiles.full_name}</p>
              </div>

              {/* Rejection Notes */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare size={12} />
                  Rejection Reason (Required)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Explain why this submission is rejected (e.g. proof image is blurry, description is irrelevant)."
                  rows={4}
                  className="w-full text-sm p-3 rounded-lg border border-zinc-200 focus:outline-none focus:border-[#DD0408]"
                  required
                />
              </div>

              {actionError && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-100 text-xs text-red-600 rounded-lg font-medium">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-zinc-150 bg-zinc-50 flex justify-end gap-3">
              <Button onClick={closeModal} variant="outline" size="sm">
                Cancel
              </Button>
              <Button 
                onClick={handleReject}
                disabled={isSubmitting || !adminNotes.trim()}
                isLoading={isSubmitting}
                className="bg-[#DD0408] hover:bg-[#DD0408]/90 border-[#DD0408] text-white"
                size="sm"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
