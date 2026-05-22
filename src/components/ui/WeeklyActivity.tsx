"use client";

import React, { useEffect, useState } from "react";
import { Flame } from "lucide-react";

export default function WeeklyActivity({ submissions }: { submissions: any[] }) {
  const [last7Days, setLast7Days] = useState<any[]>([]);

  useEffect(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const isToday = i === 0;

      const hasDeed = (submissions || []).some(
        (sub: any) => sub.local_date === dateStr && (sub.status === 'approved' || sub.status === 'pending')
      );

      days.push({
        dateStr,
        dayName,
        dayNum,
        isToday,
        hasDeed
      });
    }
    setLast7Days(days);
  }, [submissions]);

  if (last7Days.length === 0) {
    return (
      <div className="flex justify-between items-center relative opacity-50 animate-pulse">
        <div className="absolute top-5 left-4 right-4 h-[2px] bg-[#E5E5E5] -z-10"></div>
        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
          <div key={num} className="flex flex-col items-center flex-1">
            <div className="w-10 h-10 rounded-full bg-[#F5F5F5] border border-[#E5E5E5]"></div>
            <div className="w-6 h-2 bg-[#F5F5F5] mt-2 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center relative">
      <div className="absolute top-5 left-4 right-4 h-[2px] bg-[#E5E5E5] -z-10"></div>
      
      {last7Days.map((day) => (
        <div key={day.dateStr} className="flex flex-col items-center flex-1">
          <div 
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
              day.hasDeed 
                ? "bg-gradient-to-br from-[#0BA242] to-emerald-600 border-[#0BA242] shadow-md shadow-emerald-500/10 text-white" 
                : day.isToday
                  ? "bg-[#F0F9FF] border-[#0A9EDE] text-[#0A9EDE] animate-pulse shadow-inner"
                  : "bg-[#F5F5F5] border-[#E5E5E5] text-[#8A8A8A]"
            }`}
          >
            {day.hasDeed ? (
              <Flame size={18} className="fill-white/20" />
            ) : (
              <span className="text-xs font-bold font-mono">{day.dayNum}</span>
            )}
          </div>
          <span className={`text-[10px] mt-2 font-semibold ${day.isToday ? "text-[#0A9EDE] font-bold" : "text-[#8A8A8A]"}`}>
            {day.isToday ? "Today" : day.dayName}
          </span>
        </div>
      ))}
    </div>
  );
}
