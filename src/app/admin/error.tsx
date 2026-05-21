"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin panel error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle size={32} className="text-[#DD0408]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-zinc-900">Admin Panel Error</h2>
          <p className="text-zinc-500 text-sm">
            An error occurred while loading the admin panel. Please try again.
          </p>
          {error.digest && (
            <p className="text-xs text-zinc-400 font-mono">Ref: {error.digest}</p>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#DD0408] text-white rounded-xl font-semibold text-sm hover:bg-[#DD0408]/90 transition-colors"
          >
            <RefreshCw size={16} />
            Retry
          </button>
          <Link
            href="/admin"
            className="text-sm text-zinc-500 hover:underline font-semibold"
          >
            Back to Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
