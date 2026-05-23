import React from "react";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1D1D1D] pb-24 animate-pulse relative overflow-hidden">
      {/* Soft Background Gradient skeleton */}
      <div className="fluid-top-gradient"></div>

      {/* Hero header skeleton */}
      <div className="relative pt-6 pb-32 px-4 overflow-hidden h-[180px]">
        <div className="relative z-10 flex items-center justify-between max-w-lg mx-auto">
          <div className="h-6 w-28 bg-gray-200 rounded-lg"></div>
          <div className="w-10 h-10 rounded-full bg-gray-200"></div>
        </div>
      </div>

      {/* Membership Card skeleton */}
      <div className="relative z-20 max-w-lg mx-auto px-4 -mt-24">
        <div className="bg-gray-800 rounded-3xl p-6 shadow-xl h-[170px] space-y-4">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-white/10 rounded-xl"></div>
            <div className="w-12 h-6 bg-white/10 rounded-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-white/10 rounded"></div>
            <div className="h-6 w-48 bg-white/10 rounded-md"></div>
          </div>
        </div>
      </div>

      {/* Stats and alerts list skeleton */}
      <div className="max-w-lg mx-auto px-4 mt-8 space-y-6">
        {/* Flashcard Alert skeleton */}
        <div className="h-20 w-full bg-gray-200 rounded-2xl"></div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 h-24 flex flex-col items-center justify-center space-y-2">
            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            <div className="h-3 w-12 bg-gray-200 rounded"></div>
            <div className="h-4 w-8 bg-gray-200 rounded"></div>
          </div>
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 h-24 flex flex-col items-center justify-center space-y-2">
            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            <div className="h-3 w-12 bg-gray-200 rounded"></div>
            <div className="h-4 w-8 bg-gray-200 rounded"></div>
          </div>
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 h-24 flex flex-col items-center justify-center space-y-2">
            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            <div className="h-3 w-12 bg-gray-200 rounded"></div>
            <div className="h-4 w-8 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Events skeleton */}
        <div className="space-y-3">
          <div className="h-5 w-24 bg-gray-250 rounded"></div>
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 h-20"></div>
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 h-20"></div>
        </div>
      </div>
    </div>
  );
}
