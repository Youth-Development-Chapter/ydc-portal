import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Coins, ArrowUpRight, ArrowDownLeft, Calendar, BookOpen, Flame, Gift, TrendingUp } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import PageHeader from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const supabase = await createClient();

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Fetch all transactions for this user
  const { data: transactions } = await supabase
    .from("coin_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Calculate sum of coins
  const balance = transactions?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

  // Categorize transactions for stats breakdown
  let lmsCoins = 0;
  let deedCoins = 0;
  let eventCoins = 0;
  let otherCoins = 0;
  let redeemedCoins = 0;

  (transactions || []).forEach(txn => {
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

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1D1D1D] pb-24 relative overflow-hidden animate-fade-in">
      <div className="fluid-top-gradient"></div>
      <main className="max-w-lg mx-auto w-full px-4 py-6 space-y-6 relative z-10">
        
        {/* Header */}
        <PageHeader title="YDC Wallet" backHref="/dashboard" />

        {/* Golden Shimmering Balance Card */}
        <div className="bg-gradient-to-br from-[#EAB308] via-[#CA8A04] to-[#854D0E] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[160px] transition-all hover:shadow-black/25">
          {/* Decorative coins vector behind */}
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
            <Coins size={140} />
          </div>

          <div className="relative z-10 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-100 bg-white/10 px-2.5 py-1 rounded-full border border-white/20">
              YDC Coin Ledger
            </span>
            <p className="text-sm text-yellow-100/80 font-medium pt-3">Available Balance</p>
          </div>

          <div className="relative z-10 flex items-baseline gap-2 pt-2">
            <span className="text-4xl font-extrabold font-coolvetica tracking-tight">{balance}</span>
            <span className="text-sm font-bold text-yellow-100">YDC Coins</span>
          </div>
        </div>

        {/* QUICK ACTION CARDS (Spend / Earn more) */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/lms/courses" className="bg-white border border-[#E5E5E5] hover:border-indigo-500 rounded-2xl p-4 flex flex-col justify-between h-[100px] group transition duration-200 shadow-sm shadow-black/5">
            <BookOpen size={18} className="text-indigo-500 group-hover:scale-105 transition" />
            <div>
              <h4 className="font-bold text-xs text-[#1D1D1D]">Earn Academy Coins</h4>
              <p className="text-[9px] text-[#A3A3A3] mt-0.5">Study syllabus, pass quizzes</p>
            </div>
          </Link>

          <Link href="/dashboard/rewards" className="bg-white border border-[#E5E5E5] hover:border-green-500 rounded-2xl p-4 flex flex-col justify-between h-[100px] group transition duration-200 shadow-sm shadow-black/5">
            <Gift size={18} className="text-green-500 group-hover:scale-105 transition" />
            <div>
              <h4 className="font-bold text-xs text-[#1D1D1D]">Redeem Store Rewards</h4>
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
            <p className="text-xs text-[#A3A3A3] text-center py-4">No earnings breakdown available yet.</p>
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
            Transaction Ledger
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
        </div>

      </main>
    </div>
  );
}
