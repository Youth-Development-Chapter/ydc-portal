"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function LmsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("LMS error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle size={32} className="text-[#DD0408]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[#1D1D1D]">Couldn&apos;t load content</h2>
          <p className="text-[#555555] text-sm">
            There was a problem loading this page. Please try again.
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
            Try again
          </button>
          <Link
            href="/lms/courses"
            className="text-sm text-[#0A9EDE] hover:underline font-semibold"
          >
            Back to Courses
          </Link>
        </div>
      </div>
    </div>
  );
}
