import React from "react";
import { redirect } from "next/navigation";
import { Trophy, Medal, Flame, Coins } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { getLeaderboard } from "@/lib/perf-data";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // DB-side aggregation for top leaderboard entries
  const entries = (await getLeaderboard(50)).map((row) => ({
    id: row.user_id,
    full_name: row.full_name,
    division: row.division,
    coins: row.coins,
  }));

  const myRank = entries.findIndex((e) => e.id === user.id) + 1;

  const tierLabel = (coins: number) => {
    if (coins >= 1000) return { label: "Gold", color: "text-yellow-600 bg-yellow-50 border-yellow-200" };
    if (coins >= 300) return { label: "Silver", color: "text-zinc-500 bg-zinc-50 border-zinc-200" };
    return { label: "Bronze", color: "text-orange-700 bg-orange-50 border-orange-200" };
  };

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={18} className="text-yellow-500" />;
    if (rank === 2) return <Medal size={18} className="text-zinc-400" />;
    if (rank === 3) return <Medal size={18} className="text-orange-600" />;
    return <span className="text-sm font-bold text-[#A3A3A3]">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1D1D1D] pb-24 relative overflow-hidden">
      <div className="fluid-top-gradient"></div>
      <main className="max-w-lg mx-auto w-full px-4 py-6 space-y-6 relative z-10">

        {/* Header */}
        <PageHeader title="Leaderboard" backHref="/dashboard" />

        {/* Hero */}
        <div className="bg-gradient-to-br from-[#1D1D1D] to-[#333333] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
            <Trophy size={140} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#A3A3A3] mb-1">Top Members</p>
          <h2 className="text-2xl font-bold font-coolvetica mb-1">YDC Rankings</h2>
          <p className="text-sm text-[#A3A3A3]">
            {entries.length} members ranked by YDC Coins
          </p>
          {myRank > 0 && (
            <div className="mt-4 bg-white/10 border border-white/20 rounded-xl px-4 py-2 inline-flex items-center gap-2">
              <Flame size={14} className="text-orange-400" />
              <span className="text-sm font-semibold">Your rank: #{myRank}</span>
            </div>
          )}
        </div>

        {/* Podium - top 3 */}
        {entries.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 items-end">
            {/* 2nd place */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-zinc-200 flex items-center justify-center mx-auto text-xl font-bold text-zinc-600">
                {entries[1].full_name.charAt(0)}
              </div>
              <p className="text-xs font-semibold truncate">{entries[1].full_name.split(" ")[0]}</p>
              <div className="bg-zinc-100 rounded-xl py-3 flex flex-col items-center">
                <Medal size={20} className="text-zinc-400 mb-1" />
                <span className="text-xs font-bold text-[#555555]">{entries[1].coins} C</span>
              </div>
            </div>
            {/* 1st place */}
            <div className="text-center space-y-2 -mt-4">
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto text-xl font-bold text-yellow-700 ring-4 ring-yellow-200">
                {entries[0].full_name.charAt(0)}
              </div>
              <p className="text-xs font-semibold truncate">{entries[0].full_name.split(" ")[0]}</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl py-4 flex flex-col items-center">
                <Trophy size={22} className="text-yellow-500 mb-1" />
                <span className="text-xs font-bold text-yellow-700">{entries[0].coins} C</span>
              </div>
            </div>
            {/* 3rd place */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mx-auto text-xl font-bold text-orange-700">
                {entries[2].full_name.charAt(0)}
              </div>
              <p className="text-xs font-semibold truncate">{entries[2].full_name.split(" ")[0]}</p>
              <div className="bg-orange-50 rounded-xl py-3 flex flex-col items-center">
                <Medal size={20} className="text-orange-600 mb-1" />
                <span className="text-xs font-bold text-[#555555]">{entries[2].coins} C</span>
              </div>
            </div>
          </div>
        )}

        {/* Full list */}
        <div className="space-y-2">
          {entries.map((entry, idx) => {
            const rank = idx + 1;
            const isMe = entry.id === user.id;
            const tier = tierLabel(entry.coins);
            return (
              <div
                key={entry.id}
                className={`bg-white border rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm transition-colors ${
                  isMe ? "border-[#0A9EDE] bg-[#0A9EDE]/5" : "border-[#E5E5E5]"
                }`}
              >
                <div className="w-8 flex items-center justify-center shrink-0">
                  {rankIcon(rank)}
                </div>
                <div className="w-9 h-9 rounded-full bg-[#F5F5F5] flex items-center justify-center font-bold text-sm shrink-0">
                  {entry.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${isMe ? "text-[#0A9EDE]" : "text-[#1D1D1D]"}`}>
                    {entry.full_name} {isMe && <span className="text-[10px] text-[#0A9EDE]">(You)</span>}
                  </p>
                  <p className="text-xs text-[#A3A3A3] truncate">{entry.division}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.color}`}>
                    {tier.label}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-[#1D1D1D]">
                    <Coins size={12} className="text-yellow-500" />
                    {entry.coins}
                  </div>
                </div>
              </div>
            );
          })}

          {entries.length === 0 && (
            <div className="text-center py-12 text-[#555555]">
              <Trophy size={40} className="mx-auto mb-3 text-[#A3A3A3] opacity-50" />
              <p className="font-bold text-[#1D1D1D]">No rankings yet</p>
              <p className="text-sm mt-1">Be the first to earn YDC Coins!</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
