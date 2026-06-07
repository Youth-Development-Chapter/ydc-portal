import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getAdminContext } from "@/lib/admin";
import AdminRewardsManager from "./AdminRewardsManager";

export const dynamic = "force-dynamic";

export default async function AdminRewardsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { permissions } = await getAdminContext(user.id);
  if (!permissions.can_manage_settings) redirect("/admin");

  const [rewardsResult, pendingResult, unitsResult] = await Promise.all([
    supabase
      .from("rewards")
      .select("id, title, description, coin_cost, quantity_available, is_active, inclusive_unit_ids, exclusive_unit_ids, custom_criteria, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("reward_redemptions")
      .select("id, user_id, reward_id, coin_cost, status, redeemed_at, profiles:user_id(full_name)")
      .eq("status", "pending")
      .order("redeemed_at", { ascending: true }),
    supabase
      .from("units")
      .select("id, name")
      .order("name", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-zinc-950">Reward Shop</h1>
        <p className="text-zinc-500 text-sm">
          Create and manage redeemable rewards. Fulfil pending member redemption requests.
        </p>
      </div>

      <AdminRewardsManager
        initialRewards={rewardsResult.data || []}
        pendingRedemptions={pendingResult.data || []}
        units={unitsResult.data || []}
      />
    </div>
  );
}
