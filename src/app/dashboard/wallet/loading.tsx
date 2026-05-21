import React from "react";

export default function WalletLoading() {
  return (
    <div className="max-w-lg mx-auto w-full px-4 py-6 space-y-6 animate-pulse">
      {/* Header Back button skeleton */}
      <div className="flex justify-between items-center h-10">
        <div className="w-10 h-10 rounded-full bg-gray-200"></div>
        <div className="w-24 h-4 bg-gray-200 rounded"></div>
        <div className="w-10 h-10 opacity-0"></div>
      </div>

      {/* Balance Card skeleton */}
      <div className="bg-gray-200 rounded-3xl p-6 h-40 space-y-3 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="w-24 h-4 bg-white/30 rounded"></div>
          <div className="w-16 h-3 bg-white/20 rounded"></div>
        </div>
        <div className="w-40 h-10 bg-white/30 rounded-md"></div>
      </div>

      {/* Transaction History Header skeleton */}
      <div className="h-6 w-36 bg-gray-200 rounded"></div>

      {/* Transactions List skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-250 rounded-2xl p-4 flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
              <div className="space-y-2">
                <div className="w-36 h-4 bg-gray-200 rounded"></div>
                <div className="w-24 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="w-12 h-8 bg-gray-200 rounded-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
