"use client";

import React, { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Gift, Loader2, Power, PlusCircle } from "lucide-react";
import { createReward, fulfilRedemption, toggleRewardActive } from "@/app/dashboard/rewards/actions";

type Reward = {
  id: string;
  title: string;
  description: string | null;
  coin_cost: number;
  quantity_available: number | null;
  is_active: boolean;
  created_at: string;
};

type PendingRedemption = {
  id: string;
  user_id: string;
  reward_id: string;
  coin_cost: number;
  status: "pending" | "fulfilled" | "cancelled";
  redeemed_at: string;
  profiles?: { full_name?: string | null } | null;
};

export default function AdminRewardsManager({
  initialRewards,
  pendingRedemptions,
}: {
  initialRewards: Reward[];
  pendingRedemptions: PendingRedemption[];
}) {
  const [rewards, setRewards] = useState<Reward[]>(initialRewards);
  const [pending, setPending] = useState<PendingRedemption[]>(pendingRedemptions);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coinCost, setCoinCost] = useState("50");
  const [quantity, setQuantity] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const rewardNameById = useMemo(() => {
    const map = new Map<string, string>();
    rewards.forEach((r) => map.set(r.id, r.title));
    return map;
  }, [rewards]);

  const submitCreate = () => {
    setError(null);
    startTransition(async () => {
      const parsedCost = Number.parseInt(coinCost, 10);
      const parsedQty = quantity.trim() === "" ? null : Number.parseInt(quantity, 10);
      const result = await createReward({
        title,
        description,
        coin_cost: parsedCost,
        quantity_available: Number.isNaN(parsedQty as number) ? null : parsedQty,
      });
      if (!result.success) {
        setError(result.error ?? "Could not create reward.");
        return;
      }

      setOpen(false);
      setTitle("");
      setDescription("");
      setCoinCost("50");
      setQuantity("");
      window.location.reload();
    });
  };

  const onToggleActive = (id: string, current: boolean) => {
    startTransition(async () => {
      const result = await toggleRewardActive(id, !current);
      if (result.success) {
        setRewards((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: !current } : r)));
      }
    });
  };

  const onFulfil = (id: string) => {
    startTransition(async () => {
      const result = await fulfilRedemption(id);
      if (result.success) {
        setPending((prev) => prev.filter((p) => p.id !== id));
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-black transition-colors"
        >
          <PlusCircle size={16} />
          Add Reward
        </button>
      </div>

      {open && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-3 shadow-sm">
          <h3 className="font-bold text-zinc-900">Create Reward</h3>
          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
          <input
            className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm"
            placeholder="Reward title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm min-h-[90px]"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm"
              type="number"
              min={1}
              placeholder="Coin cost"
              value={coinCost}
              onChange={(e) => setCoinCost(e.target.value)}
            />
            <input
              className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm"
              type="number"
              min={1}
              placeholder="Quantity (blank = unlimited)"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={submitCreate}
              disabled={isPending || !title.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0BA242] text-white text-sm font-semibold disabled:opacity-60"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Save
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-xl border border-zinc-200 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <h3 className="font-bold text-zinc-900">Rewards</h3>
        <div className="space-y-3">
          {rewards.map((reward) => (
            <div key={reward.id} className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-zinc-900 flex items-center gap-2">
                  <Gift size={14} className="text-[#0A9EDE]" />
                  <span className="truncate">{reward.title}</span>
                </p>
                {reward.description && (
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{reward.description}</p>
                )}
                <p className="text-xs text-zinc-400 mt-1">
                  {reward.coin_cost} coins • {reward.quantity_available ?? "Unlimited"} qty
                </p>
              </div>
              <button
                onClick={() => onToggleActive(reward.id, reward.is_active)}
                disabled={isPending}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  reward.is_active
                    ? "text-[#0BA242] border-[#0BA242]/30 bg-[#0BA242]/5"
                    : "text-zinc-500 border-zinc-300 bg-zinc-50"
                }`}
              >
                <Power size={12} />
                {reward.is_active ? "Active" : "Inactive"}
              </button>
            </div>
          ))}
          {rewards.length === 0 && (
            <div className="text-sm text-zinc-500 bg-white border border-dashed border-zinc-300 rounded-xl p-4">
              No rewards yet.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-bold text-zinc-900">Pending Redemptions</h3>
        <div className="space-y-3">
          {pending.map((row) => (
            <div key={row.id} className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-zinc-900 truncate">
                  {row.profiles?.full_name || "Member"} → {rewardNameById.get(row.reward_id) || "Reward"}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {row.coin_cost} coins • {new Date(row.redeemed_at).toLocaleDateString("en-US")}
                </p>
              </div>
              <button
                onClick={() => onFulfil(row.id)}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-zinc-900 hover:bg-black"
              >
                <CheckCircle2 size={12} />
                Fulfil
              </button>
            </div>
          ))}
          {pending.length === 0 && (
            <div className="text-sm text-zinc-500 bg-white border border-dashed border-zinc-300 rounded-xl p-4">
              No pending redemptions.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
