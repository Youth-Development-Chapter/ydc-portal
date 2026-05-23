import React from "react";
import PageHeader from "@/components/ui/PageHeader";

export default function LmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1D1D1D] pb-24 relative overflow-hidden">
      {/* Same soft gradient as Dashboard and all other pages */}
      <div className="fluid-top-gradient"></div>

      {/* MOBILE-FIRST CONTAINER */}
      <main className="max-w-lg mx-auto w-full relative z-10 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
