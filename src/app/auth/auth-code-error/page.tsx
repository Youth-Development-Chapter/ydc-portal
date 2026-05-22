"use client";

import Link from "next/link";
import { ArrowLeft, AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-white text-[#1D1D1D] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-[#1D1D1D] selection:text-white overflow-hidden">
      <div className="fluid-bottom-gradient"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-6 relative z-10">
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-[#555555] hover:text-[#1D1D1D] mb-6 group transition-colors cursor-pointer">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </Link>
        <div className="flex items-center justify-center gap-3 mb-4">
          <img src="/logocolor.png" alt="YDC Logo" className="h-25 w-auto drop-shadow-sm" />
        </div>
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-red-600">
          Authentication Failed
        </h2>
        <p className="mt-2 text-center text-sm text-[#555555]">
          Something went wrong while logging you in with your social provider.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-6 relative z-10">
        {/* Accent warning line on top of the card */}
        <div className="absolute top-0 inset-x-6 h-1 bg-red-600 rounded-t-2xl z-20"></div>
        <div className="bg-white border border-[#E5E5E5] py-8 px-4 shadow-2xl rounded-2xl sm:px-10 space-y-6">
          
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex gap-3">
            <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-red-800 leading-relaxed">
              <p className="font-bold mb-1">OAuth Code Exchange Failure</p>
              <p>
                Supabase was unable to verify the authentication code provided by the social platform. This is usually caused by an administrative configuration error.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#1D1D1D]">Troubleshooting Checklist for Admins:</h3>
            <ul className="text-xs text-[#555555] space-y-2.5 list-disc pl-4 leading-relaxed font-semibold">
              <li>
                <strong className="text-[#1D1D1D]">Invalid Credentials:</strong> Verify that the Client ID and Client Secret in the Supabase Dashboard perfectly match your Google Cloud or Meta developer settings (no spaces).
              </li>
              <li>
                <strong className="text-[#1D1D1D]">Redirect URI:</strong> Ensure the Google/Facebook developer console has <code className="bg-[#F5F5F5] px-1 py-0.5 rounded border border-[#E5E5E5] text-red-600 text-[10px]">https://naevmdqjmhxylocjopmj.supabase.co/auth/v1/callback</code> added exactly.
              </li>
              <li>
                <strong className="text-[#1D1D1D]">Supabase Redirect Configuration:</strong> Ensure <code className="bg-[#F5F5F5] px-1 py-0.5 rounded border border-[#E5E5E5] text-red-600 text-[10px]">https://demo.rohanghalib.com/auth/callback</code> is explicitly added as an Additional Redirect URL in your Supabase Auth settings.
              </li>
            </ul>
          </div>

          <div className="pt-2">
            <Link href="/auth/login" className="w-full block">
              <Button
                type="button"
                className="w-full bg-[#1D1D1D] hover:bg-black text-white text-base cursor-pointer flex justify-center items-center gap-2"
                size="lg"
              >
                <RefreshCw size={18} />
                Try Login Again
              </Button>
            </Link>
          </div>

          <div className="border-t border-[#E5E5E5] pt-6">
            <div className="rounded-xl bg-[#F5F5F5] border border-[#E5E5E5] p-3 flex items-start gap-3">
              <ShieldCheck size={18} className="text-[#0A9EDE] shrink-0 mt-0.5" />
              <p className="text-xs text-[#555555] leading-relaxed">
                If the issue persists, please log in using your standard email address and password while developers resolve the credentials conflict.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
