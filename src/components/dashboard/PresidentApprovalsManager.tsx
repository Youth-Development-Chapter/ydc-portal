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
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { approveDeedSubmission, rejectDeedSubmission } from '@/app/admin/actions'
import { toast } from 'sonner'

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

export default function PresidentApprovalsManager({
  initialSubmissions,
}: {
  initialSubmissions: MappedSubmission[]
}) {
  const [submissions, setSubmissions] = useState<MappedSubmission[]>(initialSubmissions)
  const [activeDeed, setActiveDeed] = useState<MappedSubmission | null>(null)
  const [modalType, setModalType] = useState<'approve' | 'reject' | 'image' | null>(null)
  
  const [bonusCoins, setBonusCoins] = useState<number>(0)
  const [adminNotes, setAdminNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const openModal = (deed: MappedSubmission, type: 'approve' | 'reject' | 'image') => {
    setActiveDeed(deed)
    setModalType(type)
    setBonusCoins(0)
    setAdminNotes('')
  }

  const closeModal = () => {
    setActiveDeed(null)
    setModalType(null)
    setBonusCoins(0)
    setAdminNotes('')
  }

  const handleApprove = async () => {
    if (!activeDeed) return
    setIsSubmitting(true)

    try {
      const res = await approveDeedSubmission(activeDeed.id, bonusCoins, adminNotes)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(`Approved deed for ${activeDeed.profiles.full_name}!`)
        setSubmissions(prev => prev.filter(s => s.id !== activeDeed.id))
        closeModal()
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred during approval.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!activeDeed) return
    if (!adminNotes.trim()) {
      toast.error('A rejection reason is required.')
      return
    }
    setIsSubmitting(true)

    try {
      const res = await rejectDeedSubmission(activeDeed.id, adminNotes)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(`Rejected deed for ${activeDeed.profiles.full_name}.`)
        setSubmissions(prev => prev.filter(s => s.id !== activeDeed.id))
        closeModal()
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred during rejection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h2 className="text-lg font-bold text-zinc-900">Deed Approvals Queue</h2>
        <p className="text-xs text-zinc-500">
          Review daily good deeds and award bonus coins or reject with reasons.
        </p>
      </div>

      {submissions.length === 0 ? (
        <Card className="border-dashed border-zinc-200 bg-white">
          <CardContent className="p-12 text-center text-zinc-400">
            <Check size={40} className="mx-auto mb-3 text-[#0BA242] opacity-40 bg-[#0BA242]/10 p-2.5 rounded-full h-12 w-12" />
            <h3 className="font-bold text-zinc-700 text-sm mb-1">Queue is Clear!</h3>
            <p className="text-xs">There are no pending deeds to review right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((deed) => (
            <Card key={deed.id} className="shadow-sm border border-zinc-150 bg-white overflow-hidden rounded-2xl">
              <div className="p-4 bg-zinc-50/80 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-zinc-900">{deed.profiles.full_name}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500 font-medium">
                    <span>{deed.profiles.division}</span>
                    <span>•</span>
                    <span>{deed.profiles.qualification}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full shrink-0">
                  <Flame size={12} className="text-orange-500 fill-orange-500" />
                  <span className="font-extrabold text-[10px] text-orange-600">{deed.streak}</span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Submitted Deed Description</span>
                  <p className="text-xs text-zinc-700 leading-relaxed font-medium">
                    {deed.description}
                  </p>
                </div>

                {deed.proof_url && (
                  <div 
                    onClick={() => openModal(deed, 'image')}
                    className="group relative cursor-zoom-in aspect-video max-h-40 w-full rounded-xl overflow-hidden bg-zinc-100 border border-zinc-150"
                  >
                    <img 
                      src={deed.proof_url} 
                      alt="Deed Proof" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white gap-1.5 font-bold text-[10px]">
                      <ImageIcon size={14} />
                      View Full Proof Image
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-zinc-100">
                  <Button 
                    onClick={() => openModal(deed, 'approve')}
                    className="flex-1 h-9 text-xs bg-[#0BA242] border-[#0BA242] hover:bg-[#0BA242]/90 text-white"
                    leftIcon={<Check size={14} />}
                  >
                    Approve
                  </Button>
                  <Button 
                    onClick={() => openModal(deed, 'reject')}
                    variant="outline"
                    className="flex-1 h-9 text-xs border-[#DD0408] text-[#DD0408] hover:bg-[#DD0408]/5"
                    leftIcon={<X size={14} />}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* LIGHTBOX IMAGE MODAL */}
      {modalType === 'image' && activeDeed && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col justify-between p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex justify-end">
            <button 
              onClick={closeModal}
              className="w-9 h-9 rounded-full bg-black/60 text-white hover:bg-black flex items-center justify-center border border-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden my-4">
            <img 
              src={activeDeed.proof_url} 
              alt="Verification Proof" 
              className="max-h-[75vh] object-contain rounded-lg"
            />
          </div>
          <div className="bg-zinc-900 rounded-2xl p-4 text-white text-xs space-y-1">
            <p className="font-bold text-zinc-400">SUBMITTED BY: {activeDeed.profiles.full_name}</p>
            <p className="leading-relaxed">{activeDeed.description}</p>
          </div>
        </div>
      )}

      {/* APPROVAL CONFIGURATION MODAL */}
      {modalType === 'approve' && activeDeed && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-zinc-150 flex justify-between items-center bg-zinc-50">
              <h3 className="font-extrabold text-sm text-zinc-900 flex items-center gap-1.5">
                <Sparkles size={16} className="text-[#0BA242]" />
                Approve Deed
              </h3>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="space-y-0.5">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Volunteer</p>
                <p className="font-bold text-zinc-900 text-xs">{activeDeed.profiles.full_name}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex justify-between">
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
                  className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-[#0BA242]"
                />
                <div className="flex justify-between text-[8px] text-zinc-400 font-bold font-mono">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                </div>
              </div>

              <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-3.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-zinc-600">Total Coins Granted</p>
                  <p className="text-[10px] text-zinc-400">Base (10) + Bonus ({bonusCoins})</p>
                </div>
                <div className="flex items-center gap-1 bg-[#0BA242]/10 border border-[#0BA242]/20 px-3 py-1.5 rounded-lg">
                  <span className="font-extrabold text-[#0BA242]">{10 + bonusCoins}</span>
                  <span className="text-[8px] font-bold text-[#0BA242] uppercase">Coins</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare size={11} />
                  Approval Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Excellent job! Keep it up."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:border-[#0A9EDE]"
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-zinc-150 bg-zinc-50 flex justify-end gap-2">
              <Button onClick={closeModal} variant="outline" size="sm" className="h-8 text-xs">
                Cancel
              </Button>
              <Button 
                onClick={handleApprove}
                disabled={isSubmitting}
                isLoading={isSubmitting}
                className="h-8 text-xs bg-[#0BA242] border-[#0BA242] hover:bg-[#0BA242]/90 text-white"
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
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-zinc-150 flex justify-between items-center bg-zinc-50">
              <h3 className="font-extrabold text-sm text-[#DD0408] flex items-center gap-1.5">
                <AlertTriangle size={16} className="text-[#DD0408]" />
                Reject Deed
              </h3>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-0.5">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Volunteer</p>
                <p className="font-bold text-zinc-900 text-xs">{activeDeed.profiles.full_name}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare size={11} />
                  Rejection Reason (Required)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Explain why this submission is rejected."
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:border-[#DD0408]"
                  required
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-zinc-150 bg-zinc-50 flex justify-end gap-2">
              <Button onClick={closeModal} variant="outline" size="sm" className="h-8 text-xs">
                Cancel
              </Button>
              <Button 
                onClick={handleReject}
                disabled={isSubmitting || !adminNotes.trim()}
                isLoading={isSubmitting}
                className="h-8 text-xs bg-[#DD0408] border-[#DD0408] hover:bg-[#DD0408]/90 text-white"
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
