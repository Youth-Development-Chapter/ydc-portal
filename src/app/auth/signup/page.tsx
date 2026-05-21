"use client";

import Link from "next/link";
import { 
  ArrowLeft, User, Mail, Lock, 
  Loader2, CheckCircle2, AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useActionState } from "react";
import { signup } from "../actions";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, null);

  return (
    <div className="min-h-screen bg-white text-[#1D1D1D] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-[#1D1D1D] selection:text-white overflow-hidden">
      <div className="fluid-bottom-gradient"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-6 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#555555] hover:text-[#1D1D1D] mb-6 group transition-colors cursor-pointer">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
        <div className="flex items-center justify-center gap-3 mb-4">
          <img src="/logocolor.png" alt="YDC Logo" className="h-16 w-auto drop-shadow-sm" />
        </div>
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-[#1D1D1D]">
          Join YDC Movement
        </h2>
        <p className="mt-2 text-center text-sm text-[#555555]">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-bold text-[#0BA242] hover:text-[#098235] transition-colors cursor-pointer">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-6 relative z-10">
        {/* Subtle accent line on top of the card */}
        <div className="absolute top-0 inset-x-6 h-1 bg-[#0BA242] rounded-t-2xl z-20"></div>
        <div className="bg-white border border-[#E5E5E5] py-8 px-4 shadow-2xl rounded-2xl sm:px-10">
          
          {state?.success && (
            <div className="mb-6 p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] flex gap-3">
              <CheckCircle2 className="text-[#0BA242] shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-[#166534] leading-relaxed">
                <p className="font-bold mb-1">Registration Successful!</p>
                <p>{state.success}</p>
              </div>
            </div>
          )}

          {state?.error && (
            <div className="mb-6 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex gap-3">
              <AlertCircle className="text-[#DC2626] shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-[#991B1B] leading-relaxed">
                <p className="font-bold mb-1">Registration Failed</p>
                <p>{state.error}</p>
              </div>
            </div>
          )}

          <form className="space-y-6" action={action}>
            
            <Input
              id="fullname"
              name="fullname"
              type="text"
              label="Full Name"
              required
              placeholder="Muhammad Ali"
              leftIcon={<User size={18} />}
            />

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

            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              required
              placeholder="Create password (min 6 characters)"
              leftIcon={<Lock size={18} />}
            />

            <div className="flex items-start pt-2">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 accent-[#0BA242] bg-[#F5F5F5] border-[#E5E5E5] rounded cursor-pointer mt-1"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-[#555555] cursor-pointer select-none leading-relaxed block">
                  I agree to the YDC Code of Conduct and vow to align with the core values of Character, Career, and Community.
                </label>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={pending}
                className="w-full bg-[#0BA242] hover:bg-[#098235] text-white border-transparent shadow-md focus:ring-[#0BA242] text-base cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
                size="lg"
              >
                {pending && <Loader2 className="animate-spin" size={20} />}
                {pending ? "Processing..." : "Create Account"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
