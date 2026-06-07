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

  // Fetch the active units
  const { data: units } = await supabase
    .from('units')
    .select('id, name, province')
    .order('name');

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1D1D1D] pb-24 relative overflow-hidden">
      <div className="fluid-top-gradient"></div>
      <main className="max-w-lg mx-auto w-full px-4 py-6 relative z-10">
        <SettingsForm initialProfile={profile} units={units || []} />
      </main>
    </div>
  );
}
