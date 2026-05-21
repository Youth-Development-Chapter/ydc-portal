import React from "react";

export default function LmsCoursesLoading() {
  return (
    <div className="px-4 py-6 space-y-4">
      {/* Header skeleton */}
      <div className="h-7 w-36 bg-[#E5E5E5] rounded-lg animate-pulse" />

      {/* Course card skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-[#E5E5E5] rounded-2xl p-4 space-y-3 animate-pulse">
          <div className="h-4 w-3/4 bg-[#E5E5E5] rounded" />
          <div className="h-3 w-1/2 bg-[#E5E5E5] rounded" />
          <div className="h-2 w-full bg-[#E5E5E5] rounded-full" />
        </div>
      ))}
    </div>
  );
}
