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
  AlertTriangle,
  Flag,
  History,
  ClipboardList,
  RotateCcw,
  ExternalLink,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { approveDeedSubmission, rejectDeedSubmission, flagDeedSubmission, overrideDeedDecision } from '@/app/admin/actions'
import { toast } from 'sonner'

interface MappedSubmission {
  id: string
  user_id: string
  description: string
  proof_url: string
  created_at: string
  profiles: {
    full_name: string
    unit_id: string | null
    unit_name: string
    qualification: string
    id: string
  }
  streak: number
}

interface ResolvedSubmission {
  id: string
  user_id: string
  description: string
  proof_url: string
  created_at: string
  status: 'approved' | 'rejected' | 'flagged'
  admin_notes: string | null
  verified_at: string | null
  verifier_name: string | null
  profiles: {
    full_name: string
    unit_id: string | null
    unit_name: string
    qualification: string
    id: string
  }
}

type ModalType = 'approve' | 'reject' | 'flag' | 'image' | 'override' | null

export default function ApprovalsQueue({
  initialSubmissions,
  resolvedSubmissions = [],
  adminRole = 'admin',
}: {
  initialSubmissions: MappedSubmission[]
  resolvedSubmissions?: ResolvedSubmission[]
  adminRole?: string
}) {
  const [submissions, setSubmissions] = useState<MappedSubmission[]>(initialSubmissions)
  const [history, setHistory] = useState<ResolvedSubmission[]>(resolvedSubmissions)
  
  // Modals state
  const [activeDeed, setActiveDeed] = useState<MappedSubmission | null>(null)
  const [activeResolved, setActiveResolved] = useState<ResolvedSubmission | null>(null)
  const [modalType, setModalType] = useState<ModalType>(null)
  
  // Input fields state
  const [bonusCoins, setBonusCoins] = useState<number>(0)
  const [coinDeduction, setCoinDeduction] = useState<number>(10)
  const [adminNotes, setAdminNotes] = useState<string>('')
  const [overrideStatus, setOverrideStatus] = useState<'approved' | 'rejected' | 'flagged'>('rejected')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const openModal = (deed: MappedSubmission, type: 'approve' | 'reject' | 'flag' | 'image') => {
    setActiveDeed(deed)
    setModalType(type)
    setBonusCoins(0)
    setCoinDeduction(10)
    setAdminNotes('')
  }

  const openOverrideModal = (resolved: ResolvedSubmission) => {
    setActiveResolved(resolved)
    setOverrideStatus('rejected')
    setCoinDeduction(0)
    setAdminNotes('')
    setModalType('override')
  }

  const closeModal = () => {
    setActiveDeed(null)
    setActiveResolved(null)
    setModalType(null)
    setBonusCoins(0)
    setCoinDeduction(10)
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
    if (!adminNotes.trim()) { toast.error('A rejection reason is required.'); return }
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

  const handleFlag = async () => {
    if (!activeDeed) return
    if (!adminNotes.trim()) { toast.error('A reason is required when flagging.'); return }
    setIsSubmitting(true)
    try {
      const res = await flagDeedSubmission(activeDeed.id, coinDeduction, adminNotes)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(`Deed flagged for ${activeDeed.profiles.full_name}. ${coinDeduction > 0 ? `-${coinDeduction} coins deducted.` : ''}`)
        setSubmissions(prev => prev.filter(s => s.id !== activeDeed.id))
        closeModal()
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred during flagging.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOverride = async () => {
    if (!activeResolved) return
    if (!adminNotes.trim()) { toast.error('Notes are required for overriding.'); return }
    setIsSubmitting(true)
    try {
      const res = await overrideDeedDecision(activeResolved.id, overrideStatus, adminNotes, coinDeduction)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(`Decision overridden successfully.`)
        setHistory(prev => prev.map(h => h.id === activeResolved.id ? { ...h, status: overrideStatus, admin_notes: adminNotes } : h))
        closeModal()
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred during override.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusBadge = (status: string) => {
    if (status === 'approved') return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200"><Check size={10} />Approved</span>
    if (status === 'rejected') return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200"><X size={10} />Rejected</span>
    if (status === 'flagged') return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200"><Flag size={10} />Flagged</span>
    return null
  }

  const canOverride = ['superadmin', 'admin'].includes(adminRole)

  return (
    <Tabs defaultValue="pending" className="space-y-6">
      <TabsList variant="line">
        <TabsTrigger value="pending">
          <ClipboardList size={15} className="mr-1.5" />
          Pending
          {submissions.length > 0 && (
            <span className="ml-2 bg-[#0A9EDE] text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
              {submissions.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="history">
          <History size={15} className="mr-1.5" />
          History
        </TabsTrigger>
      </TabsList>

      {/* PENDING QUEUE */}
      <TabsContent value="pending" className="space-y-6">
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
                  {/* Header */}
                  <CardHeader className="bg-zinc-50 border-b border-zinc-100 p-5 flex flex-row items-center justify-between">
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{deed.profiles.full_name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500">
                          <MapPin size={12} className="text-zinc-400" />
                          <span>{deed.profiles.unit_name}</span>
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

                  {/* Content */}
                  <div className="p-5 space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Submitted Deed</span>
                      <p className="text-sm text-zinc-700 leading-relaxed font-medium">{deed.description}</p>
                    </div>
                    {deed.proof_url && (
                      <div 
                        onClick={() => openModal(deed, 'image')}
                        className="group relative cursor-zoom-in aspect-video max-h-48 w-full rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200"
                      >
                        <img src={deed.proof_url} alt="Deed Proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity gap-1.5 font-bold text-xs">
                          <ImageIcon size={16} /> View Proof Image
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Footer */}
                <div className="p-5 pt-0 flex gap-2 mt-auto">
                  <Button 
                    onClick={() => openModal(deed, 'approve')}
                    className="flex-1 bg-[#0BA242] border-[#0BA242] hover:bg-[#0BA242]/90 text-white text-xs"
                    leftIcon={<Check size={14} />}
                    size="sm"
                  >
                    Approve
                  </Button>
                  <Button 
                    onClick={() => openModal(deed, 'reject')}
                    variant="outline"
                    className="flex-1 border-[#DD0408] text-[#DD0408] hover:bg-[#DD0408]/5 text-xs"
                    leftIcon={<X size={14} />}
                    size="sm"
                  >
                    Reject
                  </Button>
                  <Button 
                    onClick={() => openModal(deed, 'flag')}
                    variant="outline"
                    className="border-amber-500 text-amber-600 hover:bg-amber-50 text-xs px-3"
                    size="sm"
                    title="Flag as inappropriate"
                  >
                    <Flag size={14} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      {/* HISTORY TAB */}
      <TabsContent value="history" className="space-y-4">
        {history.length === 0 ? (
          <div className="text-sm text-zinc-500 bg-white border border-dashed border-zinc-300 rounded-xl p-8 text-center">
            No resolved deed submissions yet.
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-zinc-900 text-sm truncate">{item.profiles.full_name}</p>
                      {statusBadge(item.status)}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{item.description}</p>
                    {item.admin_notes && (
                      <p className="text-xs text-zinc-400 mt-1 italic line-clamp-1">Note: {item.admin_notes}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-400 font-semibold">
                      <span>{item.profiles.unit_name}</span>
                      {item.verifier_name && <span>· By {item.verifier_name}</span>}
                      {item.verified_at && <span>· {new Date(item.verified_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.proof_url && (
                      <a href={item.proof_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-zinc-400 hover:text-zinc-700 transition-colors" title="View proof">
                        <ExternalLink size={14} />
                      </a>
                    )}
                    {canOverride && (
                      <button
                        onClick={() => openOverrideModal(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors"
                        title="Override this decision"
                      >
                        <RotateCcw size={12} />
                        Override
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      {/* LIGHTBOX IMAGE MODAL */}
      {modalType === 'image' && activeDeed && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full max-h-[85vh] flex flex-col bg-zinc-950 rounded-2xl overflow-hidden">
            <button onClick={closeModal} className="absolute right-4 top-4 z-10 w-10 h-10 rounded-full bg-black/60 text-white hover:bg-black flex items-center justify-center border border-white/10 transition-colors cursor-pointer">
              <X size={20} />
            </button>
            <div className="flex-1 overflow-hidden p-6 flex items-center justify-center">
              <img src={activeDeed.proof_url} alt="Verification Proof" className="max-h-[70vh] object-contain rounded-lg" />
            </div>
            <div className="bg-zinc-900 px-6 py-4 border-t border-zinc-800 text-white">
              <p className="text-xs font-semibold text-zinc-400">SUBMITTED BY: {activeDeed.profiles.full_name}</p>
              <p className="text-sm mt-1">{activeDeed.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL MODAL */}
      {modalType === 'approve' && activeDeed && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <h3 className="font-extrabold text-zinc-900 flex items-center gap-2"><Sparkles size={18} className="text-[#0BA242]" />Approve Submission</h3>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-1">
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Volunteer</p>
                <p className="font-bold text-zinc-900 text-sm">{activeDeed.profiles.full_name}</p>
              </div>
              <div className="space-y-3">
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider flex justify-between">
                  <span>Bonus Coins</span>
                  <span className="text-[#0BA242] font-extrabold">+{bonusCoins} Coins</span>
                </label>
                <input type="range" min="0" max="50" step="5" value={bonusCoins} onChange={(e) => setBonusCoins(parseInt(e.target.value, 10))} className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-[#0BA242]" />
                <div className="flex justify-between text-[10px] text-zinc-400 font-bold font-mono">
                  <span>0 (No Bonus)</span><span>25</span><span>50 (Max)</span>
                </div>
              </div>
              <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500 font-bold">Total Award</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Base (10) + Bonus ({bonusCoins})</p>
                </div>
                <div className="flex items-center gap-1 bg-[#0BA242]/10 border border-[#0BA242]/20 px-3.5 py-2 rounded-xl">
                  <span className="font-extrabold text-xl text-[#0BA242]">{10 + bonusCoins}</span>
                  <span className="text-[10px] font-bold text-[#0BA242]/80 uppercase">Coins</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1"><MessageSquare size={12} />Approval Notes (Optional)</label>
                <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="e.g. Inspiring initiative! Keep up the amazing work." rows={3} className="w-full text-sm p-3 rounded-lg border border-zinc-200 focus:outline-none focus:border-[#0A9EDE]" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3">
              <Button onClick={closeModal} variant="outline" size="sm">Cancel</Button>
              <Button onClick={handleApprove} disabled={isSubmitting} isLoading={isSubmitting} className="bg-[#0BA242] hover:bg-[#0BA242]/90 border-[#0BA242] text-white" size="sm">Confirm Approval</Button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION MODAL */}
      {modalType === 'reject' && activeDeed && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <h3 className="font-extrabold text-zinc-900 flex items-center gap-2"><AlertTriangle size={18} className="text-[#DD0408]" />Reject Submission</h3>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Volunteer</p>
                <p className="font-bold text-zinc-900 text-sm">{activeDeed.profiles.full_name}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1"><MessageSquare size={12} />Rejection Reason (Required)</label>
                <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Explain why this submission is rejected (e.g. proof image is blurry, description is irrelevant)." rows={4} className="w-full text-sm p-3 rounded-lg border border-zinc-200 focus:outline-none focus:border-[#DD0408]" required />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3">
              <Button onClick={closeModal} variant="outline" size="sm">Cancel</Button>
              <Button onClick={handleReject} disabled={isSubmitting || !adminNotes.trim()} isLoading={isSubmitting} className="bg-[#DD0408] hover:bg-[#DD0408]/90 border-[#DD0408] text-white" size="sm">Confirm Rejection</Button>
            </div>
          </div>
        </div>
      )}

      {/* FLAG MODAL */}
      {modalType === 'flag' && activeDeed && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-amber-50">
              <h3 className="font-extrabold text-zinc-900 flex items-center gap-2"><Flag size={18} className="text-amber-600" />Flag as Inappropriate</h3>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Volunteer</p>
                <p className="font-bold text-zinc-900 text-sm">{activeDeed.profiles.full_name}</p>
              </div>
              <div className="space-y-3">
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider flex justify-between">
                  <span>Coin Deduction</span>
                  <span className="text-amber-600 font-extrabold">-{coinDeduction} Coins</span>
                </label>
                <input type="range" min="0" max="50" step="5" value={coinDeduction} onChange={(e) => setCoinDeduction(parseInt(e.target.value, 10))} className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                <div className="flex justify-between text-[10px] text-zinc-400 font-bold font-mono">
                  <span>0 (No deduction)</span><span>25</span><span>50 (Max)</span>
                </div>
                <p className="text-[11px] text-zinc-400">Balance can go negative. This is recorded in the coin ledger.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1"><MessageSquare size={12} />Reason for Flagging (Required)</label>
                <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Describe why this content is inappropriate (e.g. offensive image, false claim, spam)." rows={4} className="w-full text-sm p-3 rounded-lg border border-zinc-200 focus:outline-none focus:border-amber-500" required />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3">
              <Button onClick={closeModal} variant="outline" size="sm">Cancel</Button>
              <Button onClick={handleFlag} disabled={isSubmitting || !adminNotes.trim()} isLoading={isSubmitting} className="bg-amber-500 hover:bg-amber-600 border-amber-500 text-white" size="sm">Confirm Flag</Button>
            </div>
          </div>
        </div>
      )}

      {/* OVERRIDE MODAL (admin/superadmin only) */}
      {modalType === 'override' && activeResolved && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <h3 className="font-extrabold text-zinc-900 flex items-center gap-2"><RotateCcw size={18} className="text-[#0A9EDE]" />Override Decision</h3>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 font-medium">
                ⚠️ This will reverse a past decision and automatically adjust the coin ledger.
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Volunteer</p>
                <p className="font-bold text-zinc-900 text-sm">{activeResolved.profiles.full_name}</p>
                <p className="text-xs text-zinc-500">{activeResolved.description}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">New Status</label>
                <div className="flex gap-2">
                  {(['approved', 'rejected', 'flagged'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setOverrideStatus(s)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-colors capitalize ${overrideStatus === s ? (s === 'approved' ? 'bg-green-100 border-green-400 text-green-700' : s === 'rejected' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-amber-100 border-amber-400 text-amber-700') : 'bg-zinc-50 border-zinc-200 text-zinc-500'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {overrideStatus === 'flagged' && (
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider flex justify-between">
                    <span>Coin Deduction</span>
                    <span className="text-amber-600 font-extrabold">-{coinDeduction} Coins</span>
                  </label>
                  <input type="range" min="0" max="50" step="5" value={coinDeduction} onChange={(e) => setCoinDeduction(parseInt(e.target.value, 10))} className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1"><MessageSquare size={12} />Override Notes (Required)</label>
                <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Explain the reason for this override." rows={3} className="w-full text-sm p-3 rounded-lg border border-zinc-200 focus:outline-none focus:border-[#0A9EDE]" required />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3">
              <Button onClick={closeModal} variant="outline" size="sm">Cancel</Button>
              <Button onClick={handleOverride} disabled={isSubmitting || !adminNotes.trim()} isLoading={isSubmitting} className="bg-[#0A9EDE] hover:bg-[#0A9EDE]/90 border-[#0A9EDE] text-white" size="sm">Apply Override</Button>
            </div>
          </div>
        </div>
      )}
    </Tabs>
  )
}
