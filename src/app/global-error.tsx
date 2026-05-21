"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={32} className="text-[#DD0408]" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-[#1D1D1D]">Something went wrong</h1>
              <p className="text-[#555555] text-sm">
                An unexpected error occurred. Please try again.
              </p>
              {error.digest && (
                <p className="text-xs text-[#A3A3A3] font-mono">Error ID: {error.digest}</p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A9EDE] text-white rounded-xl font-semibold text-sm hover:bg-[#0A9EDE]/90 transition-colors"
              >
                <RefreshCw size={16} />
                Try again
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-white border border-[#E5E5E5] text-[#1D1D1D] rounded-xl font-semibold text-sm hover:bg-[#F5F5F5] transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
