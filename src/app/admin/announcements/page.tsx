import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getAdminContext } from "@/lib/admin";
import AnnouncementsManager from "./AnnouncementsManager";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { permissions } = await getAdminContext(user.id);
  if (!permissions.can_manage_settings) {
    redirect("/admin");
  }

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, content, is_pinned, created_at")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-zinc-950">Announcements</h1>
        <p className="text-zinc-500 text-sm">
          Post notices and updates visible to all YDC members on their dashboard.
        </p>
      </div>

      <AnnouncementsManager initialAnnouncements={announcements || []} />
    </div>
  );
}
