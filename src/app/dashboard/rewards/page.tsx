import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Gift, Coins } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import RewardsClient from "./RewardsClient";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Fetch active rewards and user's redemption history in parallel
  const [rewardsResult, txnsResult, redemptionsResult] = await Promise.all([
    supabase
      .from("rewards")
      .select("id, title, description, coin_cost, quantity_available")
      .eq("is_active", true)
      .order("coin_cost", { ascending: true }),

    supabase
      .from("coin_transactions")
      .select("amount")
      .eq("user_id", user.id),

    supabase
      .from("reward_redemptions")
      .select("reward_id")
      .eq("user_id", user.id)
      .neq("status", "cancelled"),
  ]);

  const userBalance = (txnsResult.data || []).reduce((sum, t) => sum + t.amount, 0);
  const redeemedIds = new Set((redemptionsResult.data || []).map((r) => r.reward_id));

  const rewards = (rewardsResult.data || []).map((r) => ({
    ...r,
    description: r.description ?? null,
    quantity_available: r.quantity_available ?? null,
    redeemed: redeemedIds.has(r.id),
  }));

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
            Reward Shop
          </span>
          <div className="w-10 h-10 opacity-0 pointer-events-none" />
        </div>

        {/* Balance pill */}
        <div className="bg-white border border-[#E5E5E5] rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-yellow-100 rounded-full flex items-center justify-center">
              <Coins size={18} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-[#A3A3A3] font-semibold">Your Balance</p>
              <p className="text-lg font-extrabold text-[#1D1D1D] font-coolvetica">
                {userBalance} <span className="text-sm font-bold text-[#A3A3A3]">coins</span>
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/wallet"
            className="text-xs font-semibold text-[#0A9EDE] hover:underline flex items-center gap-1"
          >
            View history
          </Link>
        </div>

        {/* Description */}
        <div className="bg-[#0BA242]/5 border border-[#0BA242]/20 rounded-2xl px-5 py-4">
          <div className="flex items-start gap-3">
            <Gift size={20} className="text-[#0BA242] shrink-0 mt-0.5" />
            <p className="text-sm text-[#555555]">
              Spend your earned YDC Coins on real rewards. Once redeemed, an admin will
              review and fulfil your request.
            </p>
          </div>
        </div>

        <RewardsClient rewards={rewards} userBalance={userBalance} />

      </main>
    </div>
  );
}
