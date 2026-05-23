"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Lock, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useActionState } from "react";
import { login } from "../actions";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);

  const handleOAuthLogin = async (provider: "google" | "facebook") => {
    const supabase = createClient();
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-white text-[#1D1D1D] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-[#1D1D1D] selection:text-white overflow-hidden">
      <div className="fluid-bottom-gradient"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-6 relative z-10">
        <a href="https://ydc.org.pk" className="inline-flex items-center gap-2 text-sm text-[#555555] hover:text-[#1D1D1D] mb-6 group transition-colors cursor-pointer">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </a>
        <div className="flex items-center justify-center gap-3 mb-4">
          <img src="/logocolor.png" alt="YDC Logo" className="h-25 w-auto drop-shadow-sm" />
          
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

          {/* Social login divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-[#E5E5E5]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-[#737373] font-semibold">Or continue with</span>
            </div>
          </div>

          {/* Social login buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthLogin('google')}
              className="w-full font-bold text-sm h-11"
              leftIcon={
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
              }
            >
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthLogin('facebook')}
              className="w-full font-bold text-sm h-11"
              leftIcon={
                <svg className="w-5 h-5 shrink-0 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              }
            >
              Facebook
            </Button>
          </div>

          <div className="mt-6 border-t border-[#E5E5E5] pt-6">
            <div className="rounded-xl bg-[#F5F5F5] border border-[#E5E5E5] p-3 flex items-start gap-3">
              <ShieldCheck size={18} className="text-[#0BA242] shrink-0 mt-0.5" />
              <p className="text-xs text-[#555555] leading-relaxed">
                Your security is our priority. Your session is fully encrypted and protected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
