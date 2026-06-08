import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Coins, ArrowUpRight, ArrowDownLeft, Calendar, BookOpen, Gift, TrendingUp } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { getUserCoinBalance } from "@/lib/perf-data";

export const dynamic = "force-dynamic";

export default async function WalletPage(props: { searchParams: Promise<{ page?: string }> }) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams?.page || "1", 10);
  const pageSize = 15;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Fetch all transactions for this user for stats, and paginated for display
  const [paginatedResult, allResult] = await Promise.all([
    supabase
      .from("coin_transactions")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to),
    supabase
      .from("coin_transactions")
      .select("amount, reason")
      .eq("user_id", user.id)
  ]);

  const transactions = paginatedResult.data;
  const totalCount = paginatedResult.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Fetch rank tiers
  const { data: rankTiersSetting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'rank_tiers')
    .single();
  
  const rankTiers = rankTiersSetting?.value ? JSON.parse(rankTiersSetting.value) : [
    { name: "Bronze", min_coins: 0, color: "#CD7F32" },
    { name: "Silver", min_coins: 500, color: "#C0C0C0" },
    { name: "Gold", min_coins: 2000, color: "#FFD700" },
    { name: "Platinum", min_coins: 5000, color: "#E5E4E2" },
    { name: "Diamond", min_coins: 10000, color: "#007690" }
  ];

  // Calculate sum of coins
  const balance = await getUserCoinBalance(user.id);

  // Categorize transactions for stats breakdown
  let lmsCoins = 0;
  let deedCoins = 0;
  let eventCoins = 0;
  let otherCoins = 0;
  let redeemedCoins = 0;

  (allResult.data || []).forEach(txn => {
    if (txn.amount < 0) {
      redeemedCoins += Math.abs(txn.amount);
    } else {
      if (txn.reason === "daily_deed") {
        deedCoins += txn.amount;
      } else if (txn.reason === "event_attendance") {
        eventCoins += txn.amount;
      } else if (txn.reason.startsWith("course_completion:")) {
        lmsCoins += txn.amount;
      } else {
        otherCoins += txn.amount;
      }
    }
  });

  const totalEarned = lmsCoins + deedCoins + eventCoins + otherCoins;

  // Format reason to human-friendly text
  const formatReason = (reason: string) => {
    if (reason === "daily_deed") return "Approved Good Deed Submission";
    if (reason === "event_attendance") return "Checked in at YDC Event";
    if (reason === "reward_redeem") return "Redeemed Store Reward";
    if (reason.startsWith("course_completion:")) {
      const parts = reason.split(":");
      const courseId = parts[1] || "";
      const courseTitle = courseId.charAt(0).toUpperCase() + courseId.slice(1);
      return `Completed Academy Course: ${courseTitle}`;
    }
    return reason;
  };

  // Calculate current and next rank
  let currentRank = rankTiers[0];
  let nextRank = null;
  for (let i = 0; i < rankTiers.length; i++) {
    if (totalEarned >= rankTiers[i].min_coins) {
      currentRank = rankTiers[i];
      if (i + 1 < rankTiers.length) {
        nextRank = rankTiers[i + 1];
      } else {
        nextRank = null;
      }
    }
  }

  const rankProgress = nextRank ? ((totalEarned - currentRank.min_coins) / (nextRank.min_coins - currentRank.min_coins)) * 100 : 100;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1D1D1D] pb-24 relative overflow-hidden animate-fade-in">
      <div className="fluid-top-gradient"></div>
      <main className="max-w-lg mx-auto w-full px-4 py-6 space-y-6 relative z-10">
        
        {/* Header */}
        <PageHeader title="YDC Coins" backHref="/dashboard" />

        {/* Golden Shimmering Balance Card */}
        <div className="bg-gradient-to-br from-[#EAB308] via-[#CA8A04] to-[#854D0E] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[160px] transition-all hover:shadow-black/25">
          {/* Decorative coins vector behind */}
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
            <Coins size={140} />
          </div>

          <div className="relative z-10 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-100 bg-white/10 px-2.5 py-1 rounded-full border border-white/20">
              YDC Coins Wallet
            </span>
            <p className="text-sm text-yellow-100/80 font-medium pt-3">Available Balance</p>
          </div>

          <div className="relative z-10 flex items-baseline gap-2 pt-2">
            <span className="text-4xl font-extrabold font-coolvetica tracking-tight">{balance}</span>
            <span className="text-sm font-bold text-yellow-100">YDC Coins</span>
          </div>
        </div>

        {/* RANK PROGRESS BAR */}
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h4 className="font-bold text-sm text-[#1D1D1D] uppercase tracking-wider">Current Rank</h4>
              <p className="text-2xl font-black font-coolvetica" style={{ color: currentRank.color || '#EAB308' }}>{currentRank.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-[#555555]">Lifetime Earnings</p>
              <p className="text-sm font-bold text-[#1D1D1D]">{totalEarned} YDC</p>
            </div>
          </div>
          
          {nextRank && (
            <div className="space-y-1.5 pt-2 border-t border-[#F5F5F5]">
              <div className="flex justify-between text-[10px] font-bold text-[#A3A3A3]">
                <span>{currentRank.min_coins}</span>
                <span className="text-[#1D1D1D]">Next Rank: {nextRank.name}</span>
                <span>{nextRank.min_coins}</span>
              </div>
              <div className="w-full bg-[#FAFAFA] border border-[#E5E5E5] h-3 rounded-full overflow-hidden relative">
                <div 
                  className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, rankProgress))}%`, backgroundColor: currentRank.color || '#EAB308' }}
                ></div>
              </div>
              <p className="text-[10px] text-center text-[#555555]">
                {nextRank.min_coins - totalEarned} more coins needed to reach {nextRank.name}
              </p>
            </div>
          )}
        </div>

        {/* QUICK ACTION CARDS (Spend / Earn more) */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/lms/courses" className="bg-white border border-[#E5E5E5] hover:border-indigo-500 rounded-2xl p-4 flex flex-col justify-between h-[100px] group transition duration-200 shadow-sm shadow-black/5">
            <BookOpen size={18} className="text-indigo-500 group-hover:scale-105 transition" />
            <div>
              <h4 className="font-bold text-xs text-[#1D1D1D]">Complete Courses</h4>
              <p className="text-[9px] text-[#A3A3A3] mt-0.5">Study syllabus, pass quizzes</p>
            </div>
          </Link>

          <Link href="/dashboard/rewards" className="bg-white border border-[#E5E5E5] hover:border-green-500 rounded-2xl p-4 flex flex-col justify-between h-[100px] group transition duration-200 shadow-sm shadow-black/5">
            <Gift size={18} className="text-green-500 group-hover:scale-105 transition" />
            <div>
              <h4 className="font-bold text-xs text-[#1D1D1D]">Go To Shop</h4>
              <p className="text-[9px] text-[#A3A3A3] mt-0.5">Trade coins for rewards</p>
            </div>
          </Link>
        </div>

        {/* EARNINGS SOURCE BREAKDOWN */}
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-sm text-[#1D1D1D] flex items-center gap-2 uppercase tracking-wider">
            <TrendingUp size={16} className="text-[#0A9EDE]" />
            Earnings Breakdown
          </h2>

          {totalEarned === 0 ? (
            <p className="text-xs text-[#A3A3A3] text-center py-4">No Coins Claimed.</p>
          ) : (
            <div className="space-y-3.5">
              {/* LMS Progress Bar */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-[#555555] mb-1">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>Academy Quizzes</span>
                  <span className="text-[#1D1D1D] font-bold">{lmsCoins} YDC ({Math.round((lmsCoins / totalEarned) * 100)}%)</span>
                </div>
                <div className="w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${(lmsCoins / totalEarned) * 100}%` }}></div>
                </div>
              </div>

              {/* Deeds Progress Bar */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-[#555555] mb-1">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>Good Deeds</span>
                  <span className="text-[#1D1D1D] font-bold">{deedCoins} YDC ({Math.round((deedCoins / totalEarned) * 100)}%)</span>
                </div>
                <div className="w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${(deedCoins / totalEarned) * 100}%` }}></div>
                </div>
              </div>

              {/* Events Progress Bar */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-[#555555] mb-1">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0A9EDE] inline-block"></span>Event Attendance</span>
                  <span className="text-[#1D1D1D] font-bold">{eventCoins} YDC ({Math.round((eventCoins / totalEarned) * 100)}%)</span>
                </div>
                <div className="w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#0A9EDE] h-full rounded-full transition-all duration-500" style={{ width: `${(eventCoins / totalEarned) * 100}%` }}></div>
                </div>
              </div>

              {/* Other Progress Bar */}
              {otherCoins > 0 && (
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-[#555555] mb-1">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-neutral-400 inline-block"></span>Other Actions</span>
                    <span className="text-[#1D1D1D] font-bold">{otherCoins} YDC ({Math.round((otherCoins / totalEarned) * 100)}%)</span>
                  </div>
                  <div className="w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-neutral-400 h-full rounded-full transition-all duration-500" style={{ width: `${(otherCoins / totalEarned) * 100}%` }}></div>
                  </div>
                </div>
              )}

              {/* Redeemed Summary */}
              {redeemedCoins > 0 && (
                <div className="pt-2 border-t border-[#F0F0F0] flex justify-between items-center text-xs font-bold text-red-500">
                  <span>Total Redeemed / Spent</span>
                  <span>-{redeemedCoins} YDC</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transaction History Ledger */}
        <div className="space-y-4">
          <h2 className="font-bold text-sm text-[#1D1D1D] px-1 flex items-center gap-2 uppercase tracking-wider">
            <Coins size={18} className="text-yellow-600" />
            History
          </h2>

          <div className="space-y-3">
            {!transactions || transactions.length === 0 ? (
              <div className="bg-white border border-[#E5E5E5] border-dashed rounded-3xl p-10 text-center text-[#555555]">
                <Coins size={36} className="mx-auto text-[#A3A3A3] mb-3 opacity-60" />
                <h3 className="font-bold text-base text-[#1D1D1D]">No Transactions Yet</h3>
                <p className="text-xs text-[#555555] mt-1 max-w-xs mx-auto">
                  Earn YDC Coins by taking LMS courses, attending events, or logging daily good deeds!
                </p>
              </div>
            ) : (
              transactions.map((txn) => {
                const isEarned = txn.amount > 0;
                
                return (
                  <div 
                    key={txn.id}
                    className="bg-white border border-[#E5E5E5] rounded-2xl p-4 flex items-center justify-between shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Pill indicator */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                        isEarned ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                      }`}>
                        {isEarned ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-[#1D1D1D] truncate pr-2">
                          {formatReason(txn.reason)}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#A3A3A3] mt-1 font-semibold">
                          <Calendar size={11} />
                          <span>
                            {new Date(txn.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`text-sm font-extrabold shrink-0 border px-3 py-1.5 rounded-full ${
                      isEarned 
                        ? "bg-green-50/50 text-[#0BA242] border-[#0BA242]/20" 
                        : "bg-red-50/50 text-[#DD0408] border-[#DD0408]/20"
                    }`}>
                      {isEarned ? `+${txn.amount}` : txn.amount}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              {page > 1 ? (
                <Link
                  href={`?page=${page - 1}`}
                  className="px-4 py-2 border border-zinc-200 rounded-lg text-sm font-semibold bg-white text-zinc-900 hover:bg-zinc-50"
                >
                  Previous
                </Link>
              ) : (
                <div />
              )}
              <span className="text-sm font-semibold text-zinc-500">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={`?page=${page + 1}`}
                  className="px-4 py-2 border border-zinc-200 rounded-lg text-sm font-semibold bg-white text-zinc-900 hover:bg-zinc-50"
                >
                  Next
                </Link>
              ) : (
                <div />
              )}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
