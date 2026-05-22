"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root route error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAFAFA]">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-[#1D1D1D]">Something went wrong</h1>
        <p className="text-sm text-[#555555]">
          Please retry. If this continues, refresh the page or contact support.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-[#0A9EDE] text-white text-sm font-semibold"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

