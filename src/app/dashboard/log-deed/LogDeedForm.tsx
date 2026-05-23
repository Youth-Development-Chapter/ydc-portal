"use client";

import React, { useActionState, useEffect, useRef } from "react";
import { Camera, Heart, Award, AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { logDeed } from "../../actions";

export default function LogDeedForm({ submissions = [] }: { submissions?: any[] }) {
  const [state, action, pending] = useActionState(logDeed, null);
  const [submissionsTodayCount, setSubmissionsTodayCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    
    const count = submissions.filter(
      (sub: any) => sub.local_date === todayStr && (sub.status === 'approved' || sub.status === 'pending')
    ).length;
    
    setSubmissionsTodayCount(count);
    setIsLoading(false);
  }, [submissions]);

  // Reset the form when deed is submitted successfully
  useEffect(() => {
    if (state && (state as any).success) {
      formRef.current?.reset();
    }
  }, [state]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#E5E5E5] h-64 animate-pulse"></div>
    );
  }

  if (submissionsTodayCount >= 3) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#E5E5E5] relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#0BA242] to-emerald-400"></div>
        <div className="absolute -right-24 -top-24 w-48 h-48 bg-[#0BA242]/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#0BA242]/10 flex items-center justify-center text-[#0BA242]">
            <CheckCircle2 size={24} className="fill-[#0BA242]/20" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0BA242] flex items-center gap-1.5">
              Daily Limit Reached
            </h2>
            <p className="text-xs text-[#555555]">Your daily streak is locked in and protected.</p>
          </div>
        </div>

        <div className="border border-[#F0F0F0] rounded-2xl p-4 bg-slate-50/50 space-y-3">
          <p className="text-xs text-[#8A8A8A] font-semibold uppercase tracking-wider">Incredible Work!</p>
          <p className="text-sm font-semibold text-[#1D1D1D] italic">You have submitted 3 deeds today. Thank you for your amazing contributions!</p>
        </div>

        <p className="text-[10px] text-[#8A8A8A] mt-4 text-center leading-relaxed">
          Limit 3 submissions per day. Check back tomorrow to log your next deed and keep your fire active!
        </p>
      </div>
    );
  }

  const isSuccess = state && (state as any).success;
  const isError = state && (state as any).error;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#E5E5E5] relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#0A9EDE] to-[#0BA242]"></div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#0BA242]/10 flex items-center justify-center text-[#0BA242]">
          <Heart size={24} className="fill-[#0BA242]/20" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Goodness Tracker</h2>
          <p className="text-xs text-[#555555]">Log a daily good deed to keep your active streak burning! ({submissionsTodayCount}/3 logged today)</p>
        </div>
      </div>

      {/* Success Banner */}
      {isSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 flex gap-3 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-green-800">
            <p className="font-bold mb-0.5">Deed Submitted! ✅</p>
            <p>Your good deed is under review. You will receive +10 YDC Coins once approved by an admin.</p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {isError && (
        <div className="mb-6 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex gap-3">
          <AlertCircle className="text-[#DC2626] shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-[#991B1B]">
            <p className="font-bold mb-0.5">Submission Error</p>
            <p>{(state as any).error}</p>
          </div>
        </div>
      )}

      <form ref={formRef} action={action} className="space-y-6">
        <input type="hidden" name="local_date" value={new Date().toLocaleDateString('en-CA')} />
        <div>
          <Input
            id="description"
            name="description"
            type="text"
            label="What did you do?"
            required
            placeholder="Briefly describe your good deed (e.g. helped someone, planted a tree)..."
          />
        </div>

        <div>
          <Input
            id="proof_pic"
            name="proof_pic"
            type="file"
            accept="image/*"
            label="Proof Picture (Camera / Image Upload)"
            required
            leftIcon={<Camera size={18} />}
            className="pt-3 pb-2 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#F5F5F5] file:text-[#1D1D1D] hover:file:bg-[#E5E5E5] cursor-pointer"
          />
          <p className="text-[10px] text-[#A3A3A3] mt-1.5 pl-1 leading-relaxed">
            Take a quick photo or upload a screenshot to verify your good deed. Once approved by an admin, you will receive +10 YDC Coins.
          </p>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            isLoading={pending}
            size="lg"
            leftIcon={<Award size={18} />}
            className="w-full bg-[#0BA242] hover:bg-[#098235] text-white border-transparent shadow-md focus:ring-[#0BA242] font-semibold cursor-pointer disabled:opacity-75"
          >
            {pending ? "Submitting Deed..." : "Submit Good Deed"}
          </Button>
        </div>
      </form>
    </div>
  );
}
