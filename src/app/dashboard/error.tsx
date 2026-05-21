"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 pb-24">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle size={32} className="text-[#DD0408]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[#1D1D1D]">Dashboard error</h2>
          <p className="text-[#555555] text-sm">
            We couldn&apos;t load your dashboard. Please try again.
          </p>
          {error.digest && (
            <p className="text-xs text-[#A3A3A3] font-mono">Ref: {error.digest}</p>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0A9EDE] text-white rounded-xl font-semibold text-sm hover:bg-[#0A9EDE]/90 transition-colors"
          >
            <RefreshCw size={16} />
            Retry
          </button>
          <Link
            href="/auth/login"
            className="text-sm text-[#0A9EDE] hover:underline font-semibold"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
