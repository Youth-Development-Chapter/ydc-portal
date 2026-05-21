"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Lock, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useActionState } from "react";
import { login } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);

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
          <span className="font-bold text-2xl tracking-tight text-[#1D1D1D]">
            YDC Portal
          </span>
        </div>
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-[#1D1D1D]">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-[#555555]">
          Or{" "}
          <Link href="/auth/signup" className="font-bold text-[#0A9EDE] hover:text-[#087EB1] transition-colors cursor-pointer">
            create a new volunteer account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-6 relative z-10">
        {/* Subtle accent line on top of the card */}
        <div className="absolute top-0 inset-x-6 h-1 bg-[#0A9EDE] rounded-t-2xl z-20"></div>
        <div className="bg-white border border-[#E5E5E5] py-8 px-4 shadow-2xl rounded-2xl sm:px-10">
          
          {state?.error && (
            <div className="mb-6 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex gap-3">
              <AlertCircle className="text-[#DC2626] shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-[#991B1B] leading-relaxed">
                <p className="font-bold mb-1">Sign In Failed</p>
                <p>{state.error}</p>
              </div>
            </div>
          )}

          <form className="space-y-6" action={action}>
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
              autoComplete="current-password"
              required
              placeholder="••••••••"
              leftIcon={<Lock size={18} />}
            />

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 accent-[#0A9EDE] bg-[#F5F5F5] border-[#E5E5E5] rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-[#555555] cursor-pointer select-none">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/auth/forgot-password" className="font-bold text-[#0A9EDE] hover:text-[#087EB1] transition-colors cursor-pointer">
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={pending}
                className="w-full bg-[#0A9EDE] hover:bg-[#087EB1] text-white border-transparent shadow-md focus:ring-[#0A9EDE] text-base cursor-pointer disabled:opacity-70 flex justify-center items-center gap-2"
                size="lg"
              >
                {pending && <Loader2 className="animate-spin" size={20} />}
                {pending ? "Signing in..." : "Sign In"}
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-[#E5E5E5] pt-6">
            <div className="rounded-xl bg-[#F5F5F5] border border-[#E5E5E5] p-3 flex items-start gap-3">
              <ShieldCheck size={18} className="text-[#0A9EDE] shrink-0 mt-0.5" />
              <p className="text-xs text-[#555555] leading-relaxed">
                Login sessions are securely processed using Supabase JWT tokens. Unauthorized administrative attempts are monitored.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
