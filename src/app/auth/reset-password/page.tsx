"use client";

import { Lock, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useActionState } from "react";
import { updatePassword } from "../actions";

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, null);

  return (
    <div className="min-h-screen bg-white text-[#1D1D1D] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-[#1D1D1D] selection:text-white overflow-hidden">
      <div className="fluid-bottom-gradient"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-6 relative z-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <img src="/logocolor.png" alt="YDC Logo" className="h-16 w-auto drop-shadow-sm" />
        </div>
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-[#1D1D1D]">
          Update Password
        </h2>
        <p className="mt-2 text-center text-sm text-[#555555]">
          Please enter your new password below.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-6 relative z-10">
        {/* Subtle accent line on top of the card */}
        <div className="absolute top-0 inset-x-6 h-1 bg-[#DD0408] rounded-t-2xl z-20"></div>
        <div className="bg-white border border-[#E5E5E5] py-8 px-4 shadow-2xl rounded-2xl sm:px-10">
          
          {state?.error && (
            <div className="mb-6 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex gap-3">
              <AlertCircle className="text-[#DC2626] shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-[#991B1B] leading-relaxed">
                <p className="font-bold mb-1">Error</p>
                <p>{state.error}</p>
              </div>
            </div>
          )}

          <form className="space-y-6" action={action}>
            <Input
              id="password"
              name="password"
              type="password"
              label="New Password"
              required
              placeholder="Enter at least 8 characters"
              leftIcon={<Lock size={18} />}
            />

            <div>
              <Button
                type="submit"
                disabled={pending}
                className="w-full bg-[#DD0408] hover:bg-[#B30306] text-white border-transparent shadow-md focus:ring-[#DD0408] text-base cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
                size="lg"
              >
                {pending && <Loader2 className="animate-spin" size={20} />}
                {pending ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
