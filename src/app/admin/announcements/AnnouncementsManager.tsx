"use client";

import React, { useState, useTransition } from "react";
import { Trash2, Pin, PinOff, Plus, Loader2, AlertCircle } from "lucide-react";
import {
  createAnnouncement,
  deleteAnnouncement,
  togglePinAnnouncement,
} from "./actions";

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
}

export default function AnnouncementsManager({
  initialAnnouncements,
}: {
  initialAnnouncements: Announcement[];
}) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    setFormError(null);
    startTransition(async () => {
      const result = await createAnnouncement({ title, content, is_pinned: isPinned });
      if (!result.success) {
        setFormError(result.error ?? "Unknown error");
        return;
      }
      setAnnouncements((prev) => [
        {
          id: crypto.randomUUID(),
          title,
          content,
          is_pinned: isPinned,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setTitle("");
      setContent("");
      setIsPinned(false);
      setShowForm(false);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteAnnouncement(id);
      if (result.success) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      }
    });
  }

  function handleTogglePin(id: string, current: boolean) {
    startTransition(async () => {
      const result = await togglePinAnnouncement(id, !current);
      if (result.success) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === id ? { ...a, is_pinned: !current } : a))
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A9EDE] text-white rounded-xl font-semibold text-sm hover:bg-[#0A9EDE]/90 transition-colors"
        >
          <Plus size={16} />
          New Announcement
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-zinc-900">Post Announcement</h3>
          {formError && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle size={16} className="shrink-0" />
              {formError}
            </div>
          )}
          <input
            className="w-full border border-zinc-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0A9EDE]"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A9EDE] min-h-[120px] resize-none"
            placeholder="Write your announcement here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="accent-[#0A9EDE]"
            />
            Pin this announcement to the top
          </label>
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={isPending || !title.trim() || !content.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#0A9EDE] text-white rounded-xl font-semibold text-sm hover:bg-[#0A9EDE]/90 transition-colors disabled:opacity-60"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Post
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2 border border-zinc-200 rounded-xl text-sm font-medium hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {announcements.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <p className="font-bold text-zinc-700">No announcements yet.</p>
          <p className="text-sm mt-1">Click &ldquo;New Announcement&rdquo; to post one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((item) => (
            <div
              key={item.id}
              className={`bg-white border rounded-2xl p-5 flex items-start gap-4 shadow-sm ${
                item.is_pinned ? "border-[#0A9EDE]/30" : "border-zinc-200"
              }`}
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  {item.is_pinned && <Pin size={12} className="text-[#0A9EDE] shrink-0" />}
                  <h4 className="font-bold text-sm text-zinc-900 truncate">{item.title}</h4>
                </div>
                <p className="text-sm text-zinc-500 line-clamp-2">{item.content}</p>
                <p className="text-[10px] text-zinc-400 font-mono">
                  {new Date(item.created_at).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleTogglePin(item.id, item.is_pinned)}
                  disabled={isPending}
                  title={item.is_pinned ? "Unpin" : "Pin"}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-[#0A9EDE]"
                >
                  {item.is_pinned ? <PinOff size={15} /> : <Pin size={15} />}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={isPending}
                  title="Delete"
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors text-zinc-400 hover:text-[#DD0408]"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
