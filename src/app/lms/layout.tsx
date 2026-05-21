import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function LmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1D1D1D] pb-24">
      {/* NATIVE HEADER */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E5E5E5] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F5F5F5] hover:bg-[#E5E5E5] transition-colors">
            <ChevronLeft size={20} className="text-[#1D1D1D]" />
          </Link>
          <div className="flex items-center gap-2">
            <img src="/logocolor.png" alt="YDC" className="h-6 w-auto" />
            <span className="font-bold text-sm text-[#555555]">LMS</span>
          </div>
        </div>
      </div>

      {/* MOBILE-FIRST CONTAINER */}
      <main className="max-w-lg mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
