import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Megaphone, Pin, Clock } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getRecentAnnouncementsCached } from "@/lib/perf-data";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const announcements = await getRecentAnnouncementsCached();

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1D1D1D] pb-24">
      <main className="max-w-lg mx-auto w-full px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-colors shadow-sm"
          >
            <ArrowLeft size={20} className="text-[#1D1D1D]" />
          </Link>
          <span className="font-extrabold text-base tracking-tight text-[#1D1D1D] font-coolvetica">
            Announcements
          </span>
          <div className="w-10 h-10 opacity-0 pointer-events-none" />
        </div>

        {/* List */}
        {!announcements || announcements.length === 0 ? (
          <div className="text-center py-20">
            <Megaphone size={40} className="mx-auto mb-3 text-[#A3A3A3] opacity-50" />
            <p className="font-bold text-[#1D1D1D]">No announcements yet</p>
            <p className="text-sm text-[#555555] mt-1">Check back later for updates from the YDC team.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((item) => (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl p-5 shadow-sm space-y-2 ${
                  item.is_pinned ? "border-[#0A9EDE]/30 bg-[#0A9EDE]/5" : "border-[#E5E5E5]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-[#1D1D1D] leading-snug">{item.title}</h3>
                  {item.is_pinned && (
                    <Pin size={14} className="text-[#0A9EDE] shrink-0 mt-0.5" />
                  )}
                </div>
                <p className="text-sm text-[#555555] leading-relaxed whitespace-pre-wrap">{item.content}</p>
                <div className="flex items-center gap-1 text-[10px] text-[#A3A3A3] font-semibold pt-1">
                  <Clock size={10} />
                  {new Date(item.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
