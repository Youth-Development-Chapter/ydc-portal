import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getAdminContext } from "@/lib/admin";
import NotificationsManager from "./NotificationsManager";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage(props: { searchParams: Promise<{ page?: string }> }) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams?.page || "1", 10);
  const pageSize = 15;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { permissions } = await getAdminContext(user.id);
  if (!permissions.can_manage_settings) {
    redirect("/admin");
  }

  const { data: announcements, count } = await supabase
    .from("announcements")
    .select("id, title, content, is_pinned, created_at", { count: "exact" })
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-zinc-950">Notifications</h1>
        <p className="text-zinc-500 text-sm">
          Post notices and updates visible to all YDC members on their dashboard.
        </p>
      </div>

      <NotificationsManager initialAnnouncements={announcements || []} />

      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-4">
          {page > 1 ? (
            <a
              href={`?page=${page - 1}`}
              className="px-4 py-2 border border-zinc-200 rounded-lg text-sm font-semibold bg-white text-zinc-900 hover:bg-zinc-50"
            >
              Previous
            </a>
          ) : (
            <div />
          )}
          <span className="text-sm font-semibold text-zinc-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <a
              href={`?page=${page + 1}`}
              className="px-4 py-2 border border-zinc-200 rounded-lg text-sm font-semibold bg-white text-zinc-900 hover:bg-zinc-50"
            >
              Next
            </a>
          ) : (
            <div />
          )}
        </div>
      )}
    </div>
  );
}
