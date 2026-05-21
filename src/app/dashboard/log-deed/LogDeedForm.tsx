"use client";

import React, { useActionState } from "react";
import { Camera, Heart, Award, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { logDeed } from "../../actions";

export default function LogDeedForm() {
  const [state, action, pending] = useActionState(logDeed, null);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#E5E5E5] relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#0A9EDE] to-[#0BA242]"></div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#0BA242]/10 flex items-center justify-center text-[#0BA242]">
          <Heart size={24} className="fill-[#0BA242]/20" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Goodness Tracker</h2>
          <p className="text-xs text-[#555555]">Log a daily good deed to keep your active streak burning!</p>
        </div>
      </div>

      {state?.error && (
        <div className="mb-6 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex gap-3">
          <AlertCircle className="text-[#DC2626] shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-[#991B1B]">
            <p className="font-bold mb-0.5">Submission Error</p>
            <p>{state.error}</p>
          </div>
        </div>
      )}

      <form action={action} className="space-y-6">
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
