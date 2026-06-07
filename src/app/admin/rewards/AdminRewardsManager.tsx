"use client";

import React, { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Gift, Loader2, Power, PlusCircle, XCircle, ClipboardList } from "lucide-react";
import { createReward, fulfilRedemption, rejectRedemption, toggleRewardActive } from "@/app/dashboard/rewards/actions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

type Reward = {
  id: string;
  title: string;
  description: string | null;
  coin_cost: number;
  quantity_available: number | null;
  is_active: boolean;
  inclusive_unit_ids?: string[] | null;
  exclusive_unit_ids?: string[] | null;
  custom_criteria?: any;
  created_at: string;
};

type PendingRedemption = {
  id: string;
  user_id: string;
  reward_id: string;
  coin_cost: number;
  status: "pending" | "fulfilled" | "cancelled";
  redeemed_at: string;
  profiles?: Array<{ full_name?: string | null }> | null;
};

export default function AdminRewardsManager({
  initialRewards,
  pendingRedemptions,
  units,
}: {
  initialRewards: Reward[];
  pendingRedemptions: PendingRedemption[];
  units: { id: string; name: string }[];
}) {
  const [rewards, setRewards] = useState<Reward[]>(initialRewards);
  const [pending, setPending] = useState<PendingRedemption[]>(pendingRedemptions);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coinCost, setCoinCost] = useState("50");
  const [quantity, setQuantity] = useState("");
  const [inclusiveUnitIds, setInclusiveUnitIds] = useState<string[]>([]);
  const [exclusiveUnitIds, setExclusiveUnitIds] = useState<string[]>([]);
  const [customCriteria, setCustomCriteria] = useState('{\n  "minAge": 0,\n  "minStreak": 0,\n  "coursesCompletedCount": 0,\n  "rankTier": "none"\n}');
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
      let parsedCriteria = null;
      try {
        parsedCriteria = JSON.parse(customCriteria);
      } catch (e) {
        setError("Invalid JSON format in custom criteria.");
        return;
      }

      const result = await createReward({
        title,
        description,
        coin_cost: parsedCost,
        quantity_available: Number.isNaN(parsedQty as number) ? null : parsedQty,
        inclusive_unit_ids: inclusiveUnitIds.length > 0 ? inclusiveUnitIds : null,
        exclusive_unit_ids: exclusiveUnitIds.length > 0 ? exclusiveUnitIds : null,
        custom_criteria: parsedCriteria,
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
      setInclusiveUnitIds([]);
      setExclusiveUnitIds([]);
      setCustomCriteria('{\n  "minAge": 0,\n  "minStreak": 0,\n  "coursesCompletedCount": 0,\n  "rankTier": "none"\n}');
      window.location.reload();
    });
  };

  const toggleUnit = (setter: React.Dispatch<React.SetStateAction<string[]>>, unitId: string) => {
    setter((prev) => prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]);
  };

  const unitNames = (ids?: string[] | null) => {
    if (!ids?.length) return null;
    const names = ids.map((id) => units.find((unit) => unit.id === id)?.name).filter(Boolean);
    return names.length > 0 ? names.join(", ") : null;
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

  const onReject = (id: string) => {
    startTransition(async () => {
      const result = await rejectRedemption(id);
      if (result.success) {
        setPending((prev) => prev.filter((p) => p.id !== id));
      }
    });
  };

  return (
    <Tabs defaultValue="catalog" className="space-y-6">
      <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
        <TabsList variant="line" className="border-none pb-0">
          <TabsTrigger value="catalog">
            <Gift size={16} className="mr-2" />
            Rewards Catalog
          </TabsTrigger>
          <TabsTrigger value="fulfillments">
            <ClipboardList size={16} className="mr-2" />
            Fulfillments
          </TabsTrigger>
        </TabsList>

        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-black transition-colors"
        >
          <PlusCircle size={16} />
          Add Reward
        </button>
      </div>

      <TabsContent value="catalog" className="space-y-6">
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
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">Quantity</label>
                <input
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm"
                  type="number"
                  min={1}
                  placeholder="Quantity (blank = unlimited)"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">Custom Criteria (JSON)</label>
              <textarea
                className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm font-mono bg-zinc-50"
                rows={5}
                value={customCriteria}
                onChange={(e) => setCustomCriteria(e.target.value)}
              />
            </div>

            {units.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border border-zinc-200 rounded-xl p-3 space-y-2">
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Available To</p>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {units.map((unit) => (
                      <label key={unit.id} className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                        <input
                          type="checkbox"
                          checked={inclusiveUnitIds.includes(unit.id)}
                          onChange={() => toggleUnit(setInclusiveUnitIds, unit.id)}
                          className="rounded border-zinc-300 text-[#0A9EDE]"
                        />
                        {unit.name}
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-400">Leave empty for all units.</p>
                </div>

                <div className="border border-zinc-200 rounded-xl p-3 space-y-2">
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Exclude Units</p>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {units.map((unit) => (
                      <label key={unit.id} className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                        <input
                          type="checkbox"
                          checked={exclusiveUnitIds.includes(unit.id)}
                          onChange={() => toggleUnit(setExclusiveUnitIds, unit.id)}
                          className="rounded border-zinc-300 text-[#DD0408]"
                        />
                        {unit.name}
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-400">Excluded units cannot redeem this reward.</p>
                </div>
              </div>
            )}

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
                {(unitNames(reward.inclusive_unit_ids) || unitNames(reward.exclusive_unit_ids)) && (
                  <p className="text-[10px] text-zinc-400 mt-1">
                    {unitNames(reward.inclusive_unit_ids) && `Available: ${unitNames(reward.inclusive_unit_ids)}`}
                    {unitNames(reward.inclusive_unit_ids) && unitNames(reward.exclusive_unit_ids) ? " | " : ""}
                    {unitNames(reward.exclusive_unit_ids) && `Excluded: ${unitNames(reward.exclusive_unit_ids)}`}
                  </p>
                )}
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
      </TabsContent>

      <TabsContent value="fulfillments" className="space-y-6">
        <section className="space-y-3">
          <div className="space-y-3">
            {pending.map((row) => (
              <div key={row.id} className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-900 truncate">
                    {row.profiles?.[0]?.full_name || "Member"} → {rewardNameById.get(row.reward_id) || "Reward"}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {row.coin_cost} coins • {new Date(row.redeemed_at).toLocaleDateString("en-US")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onReject(row.id)}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200"
                  >
                    <XCircle size={12} />
                    Reject & Refund
                  </button>
                  <button
                    onClick={() => onFulfil(row.id)}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0BA242] hover:bg-[#098C39]"
                  >
                    <CheckCircle2 size={12} />
                    Fulfil
                  </button>
                </div>
              </div>
            ))}
            {pending.length === 0 && (
              <div className="text-sm text-zinc-500 bg-white border border-dashed border-zinc-300 rounded-xl p-4">
                No pending redemptions.
              </div>
            )}
          </div>
        </section>
      </TabsContent>
    </Tabs>
  );
}
