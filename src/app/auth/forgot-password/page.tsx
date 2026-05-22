"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { resetPassword } from "../actions";

export default function ForgotPasswordPage() {
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<{ success?: string; error?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setState(null);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await resetPassword(null, formData);
      setState(res);
      if (res?.success) {
        (e.target as HTMLFormElement).reset();
      }
    } catch (err: any) {
      setState({ error: err?.message || "An unexpected error occurred." });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1D1D1D] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-[#1D1D1D] selection:text-white overflow-hidden">
      <div className="fluid-bottom-gradient"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-6 relative z-10">
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-[#555555] hover:text-[#1D1D1D] mb-6 group transition-colors cursor-pointer">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </Link>
        <div className="flex items-center justify-center gap-3 mb-4">
          <img src="/logocolor.png" alt="YDC Logo" className="h-16 w-auto drop-shadow-sm" />
        </div>
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-[#1D1D1D]">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-[#555555]">
          Enter your email and we&apos;ll send you a recovery link
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-6 relative z-10">
        {/* Subtle accent line on top of the card */}
        <div className="absolute top-0 inset-x-6 h-1 bg-[#0A9EDE] rounded-t-2xl z-20"></div>
        <div className="bg-white border border-[#E5E5E5] py-8 px-4 shadow-2xl rounded-2xl sm:px-10">
          
          {state?.success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-[#F0FDF4] p-3 border border-[#BBF7D0]">
                  <CheckCircle2 className="text-[#0BA242]" size={32} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#1D1D1D]">Email Sent!</h3>
              <p className="text-sm text-[#555555] leading-relaxed">
                {state.success}
              </p>
              <div className="pt-4">
                <Link href="/auth/login" className="inline-block">
                  <Button type="button" className="bg-[#F5F5F5] hover:bg-[#E5E5E5] text-[#1D1D1D] border-transparent cursor-pointer">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {state?.error && (
                <div className="mb-6 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex gap-3">
                  <AlertCircle className="text-[#DC2626] shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-[#991B1B] leading-relaxed">
                    <p className="font-bold mb-1">Error</p>
                    <p>{state.error}</p>
                  </div>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Email address"
                  autoComplete="email"
                  required
                  placeholder="name@example.com"
                  leftIcon={<Mail size={18} />}
                />

                <div>
                  <Button
                    type="submit"
                    disabled={pending}
                    className="w-full bg-[#0A9EDE] hover:bg-[#087EB1] text-white border-transparent shadow-md focus:ring-[#0A9EDE] text-base cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
                    size="lg"
                  >
                    {pending && <Loader2 className="animate-spin" size={20} />}
                    {pending ? "Sending link..." : "Send Reset Link"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
