import React from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Query current profile details from public.profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1D1D1D] pb-24">
      <main className="max-w-lg mx-auto w-full px-4 py-6">
        <SettingsForm initialProfile={profile} />
      </main>
    </div>
  );
}
