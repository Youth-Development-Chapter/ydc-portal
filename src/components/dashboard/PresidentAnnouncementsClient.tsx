'use client'

import React, { useState, useTransition } from 'react'
import { Megaphone, Pin, X, Loader2 } from 'lucide-react'
import { createAnnouncement, deleteAnnouncement, togglePinAnnouncement } from '@/app/admin/announcements/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function PresidentAnnouncementsClient({
  initialAnnouncements,
  adminRole,
  adminUnitId,
}: {
  initialAnnouncements: any[]
  adminRole: string
  adminUnitId: string | null
}) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [annTitle, setAnnTitle] = useState('')
  const [annContent, setAnnContent] = useState('')
  const [annPinned, setAnnPinned] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleCreateAnnouncement = () => {
    if (!annTitle.trim() || !annContent.trim()) { toast.error('Title and content are required.'); return }
    startTransition(async () => {
      const res = await createAnnouncement({
        title: annTitle.trim(),
        content: annContent.trim(),
        is_pinned: annPinned,
        unit_id: adminUnitId,
      })
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Announcement posted!')
        setAnnTitle('')
        setAnnContent('')
        setAnnPinned(false)
        router.refresh()
      }
    })
  }

  const handleDeleteAnnouncement = (id: string) => {
    startTransition(async () => {
      const res = await deleteAnnouncement(id)
      if (res?.error) { toast.error(res.error); return }
      setAnnouncements(prev => prev.filter(a => a.id !== id))
      toast.success('Announcement deleted.')
    })
  }

  const handleTogglePin = (id: string, current: boolean) => {
    startTransition(async () => {
      const res = await togglePinAnnouncement(id, !current)
      if (res?.error) { toast.error(res.error); return }
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_pinned: !current } : a))
    })
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200 space-y-4">
        <h3 className="font-extrabold text-sm text-zinc-900 flex items-center gap-2">
          <Megaphone size={16} className="text-[#0A9EDE]" />
          New Announcement
        </h3>
        <input
          className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A9EDE]"
          placeholder="Title"
          value={annTitle}
          onChange={(e) => setAnnTitle(e.target.value)}
        />
        <textarea
          className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm min-h-[80px] focus:outline-none focus:border-[#0A9EDE]"
          placeholder="Content…"
          value={annContent}
          onChange={(e) => setAnnContent(e.target.value)}
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-semibold text-zinc-600 cursor-pointer">
            <input
              type="checkbox"
              checked={annPinned}
              onChange={(e) => setAnnPinned(e.target.checked)}
              className="accent-[#0A9EDE]"
            />
            Pin this announcement
          </label>
          <button
            onClick={handleCreateAnnouncement}
            disabled={isPending || !annTitle.trim() || !annContent.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-sm font-semibold disabled:opacity-50 hover:bg-black transition-colors"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            Post
          </button>
        </div>
        <p className="text-[10px] text-zinc-400">This announcement will be visible to all members of your unit.</p>
      </div>

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-zinc-400 text-sm border border-dashed border-zinc-200">
            No announcements yet. Create one above.
          </div>
        ) : announcements.map(ann => (
          <div key={ann.id} className={`bg-white border rounded-2xl p-4 shadow-sm space-y-2 ${ann.is_pinned ? 'border-[#0A9EDE]/30' : 'border-zinc-200'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-zinc-900 line-clamp-1">{ann.title}</h4>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{ann.content}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {(adminRole === 'superadmin' || adminRole === 'admin' || (adminRole === 'president' && ann.unit_id === adminUnitId)) && (
                  <>
                    <button
                      onClick={() => handleTogglePin(ann.id, ann.is_pinned)}
                      disabled={isPending}
                      className={`p-1.5 rounded-lg transition-colors ${ann.is_pinned ? 'text-[#0A9EDE] bg-[#0A9EDE]/10' : 'text-zinc-400 hover:text-zinc-600'}`}
                      title={ann.is_pinned ? 'Unpin' : 'Pin'}
                    >
                      <Pin size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <X size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 font-semibold">
              {new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
