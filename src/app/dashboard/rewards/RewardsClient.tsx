"use client";

import React, { useState, useTransition } from "react";
import { Gift, Loader2, CheckCircle, AlertCircle, Coins } from "lucide-react";
import { redeemReward } from "./actions";

interface Reward {
  id: string;
  title: string;
  description: string | null;
  coin_cost: number;
  quantity_available: number | null;
  redeemed: boolean;
}

export default function RewardsClient({
  rewards,
  userBalance,
}: {
  rewards: Reward[];
  userBalance: number;
}) {
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [isPending, startTransition] = useTransition();

  function handleRedeem(id: string, cost: number) {
    if (userBalance < cost) {
      setResults((prev) => ({
        ...prev,
        [id]: { ok: false, msg: `You need ${cost - userBalance} more coins.` },
      }));
      return;
    }
    setRedeemingId(id);
    startTransition(async () => {
      const result = await redeemReward(id);
      setResults((prev) => ({
        ...prev,
        [id]: result.success
          ? { ok: true, msg: "Redeemed! An admin will fulfil your request." }
          : { ok: false, msg: result.error ?? "Something went wrong." },
      }));
      setRedeemingId(null);
    });
  }

  if (rewards.length === 0) {
    return (
      <div className="text-center py-16">
        <Gift size={40} className="mx-auto mb-3 text-[#A3A3A3] opacity-50" />
        <p className="font-bold text-[#1D1D1D]">No rewards available</p>
        <p className="text-sm text-[#555555] mt-1">Check back later — the admin team will add items soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rewards.map((reward) => {
        const canAfford = userBalance >= reward.coin_cost;
        const result = results[reward.id];
        const isLoading = isPending && redeemingId === reward.id;

        return (
          <div
            key={reward.id}
            className={`bg-white border rounded-2xl p-5 shadow-sm space-y-3 transition-colors ${
              canAfford ? "border-[#E5E5E5]" : "border-[#E5E5E5] opacity-70"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-[#1D1D1D]">{reward.title}</h3>
                {reward.description && (
                  <p className="text-xs text-[#555555] mt-1">{reward.description}</p>
                )}
                {reward.quantity_available !== null && (
                  <p className="text-[10px] text-[#A3A3A3] font-semibold mt-1">
                    {reward.quantity_available} available
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-full">
                <Coins size={14} className="text-yellow-600" />
                <span className="text-sm font-bold text-yellow-700">{reward.coin_cost}</span>
              </div>
            </div>

            {result && (
              <div
                className={`flex items-center gap-2 text-xs rounded-xl px-3 py-2 ${
                  result.ok
                    ? "bg-green-50 text-[#0BA242] border border-green-200"
                    : "bg-red-50 text-[#DD0408] border border-red-200"
                }`}
              >
                {result.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {result.msg}
              </div>
            )}

            {!result?.ok && (
              <button
                onClick={() => handleRedeem(reward.id, reward.coin_cost)}
                disabled={!canAfford || isLoading || reward.redeemed}
                className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                  canAfford && !reward.redeemed
                    ? "bg-[#0BA242] text-white hover:bg-[#098235]"
                    : "bg-[#F5F5F5] text-[#A3A3A3] cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Redeeming...
                  </>
                ) : reward.redeemed ? (
                  "Already Redeemed"
                ) : canAfford ? (
                  "Redeem Reward"
                ) : (
                  `Need ${reward.coin_cost - userBalance} more coins`
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
