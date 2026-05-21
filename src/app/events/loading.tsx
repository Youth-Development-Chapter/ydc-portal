import React from "react";

export default function EventsLoading() {
  return (
    <div className="max-w-lg mx-auto w-full px-4 py-6 space-y-6 animate-pulse">
      {/* Header Back button skeleton */}
      <div className="flex justify-between items-center h-10">
        <div className="w-10 h-10 rounded-full bg-gray-200"></div>
        <div className="w-24 h-4 bg-gray-200 rounded"></div>
        <div className="w-10 h-10 opacity-0"></div>
      </div>

      {/* Hero Banner skeleton */}
      <div className="bg-gray-200 rounded-3xl p-6 h-40 space-y-3">
        <div className="w-24 h-4 bg-white/30 rounded"></div>
        <div className="w-36 h-8 bg-white/30 rounded-md"></div>
        <div className="w-56 h-4 bg-white/30 rounded"></div>
      </div>

      {/* Tabs Selector skeleton */}
      <div className="flex bg-gray-150 p-1 rounded-2xl border border-gray-200 h-14">
        <div className="flex-1 bg-white rounded-xl shadow-sm m-0.5"></div>
        <div className="flex-1 m-0.5"></div>
      </div>

      {/* Event Cards skeleton */}
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white border border-gray-250 rounded-3xl p-5 h-44 space-y-4">
            <div className="space-y-2">
              <div className="w-48 h-6 bg-gray-200 rounded-md"></div>
              <div className="w-full h-3 bg-gray-200 rounded"></div>
              <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="h-4 w-28 bg-gray-200 rounded"></div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
