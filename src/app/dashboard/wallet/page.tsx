import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Coins, ArrowUpRight, ArrowDownLeft, Calendar } from "lucide-react";
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

  // Format reason to human-friendly text
  const formatReason = (reason: string) => {
    if (reason === "daily_deed") return "Approved Good Deed Submission";
    if (reason === "event_attendance") return "Checked in at YDC Event";
    if (reason === "reward_redeem") return "Redeemed Store Reward";
    if (reason.startsWith("course_completion:")) {
      const courseId = reason.split(":")[1] || "";
      // Capitalize first letter of course ID
      const courseTitle = courseId.charAt(0).toUpperCase() + courseId.slice(1);
      return `Completed Academy Course: ${courseTitle}`;
    }
    return reason;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1D1D1D] pb-24 relative overflow-hidden">
      <div className="fluid-top-gradient"></div>
      <main className="max-w-lg mx-auto w-full px-4 py-6 space-y-6 relative z-10">
        
        {/* Header */}
        <PageHeader title="YDC Wallet" backHref="/dashboard" />

        {/* Golden Shimmering Balance Card */}
        <div className="bg-gradient-to-br from-[#EAB308] via-[#CA8A04] to-[#854D0E] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[160px]">
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

        {/* Transaction History Ledger */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg text-[#1D1D1D] px-1 flex items-center gap-2">
            <Coins size={18} className="text-yellow-600" />
            Transaction History
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
                    className="bg-white border border-[#E5E5E5] rounded-2xl p-4 flex items-center justify-between shadow-sm transition-all duration-300"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Pill indicator */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isEarned ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"
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
