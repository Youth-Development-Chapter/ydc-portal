"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, ShieldAlert, Check } from "lucide-react";
import { lockCourseLanguage } from "@/app/lms/courses/actions";
import { Button } from "@/components/ui/Button";

interface LanguageSelectModalProps {
  courseId: string;
  courseTitle: string;
  courseTitleUr?: string;
  onSuccess?: (lang: "en" | "ur") => void;
}

export default function LanguageSelectModal({
  courseId,
  courseTitle,
  courseTitleUr,
  onSuccess,
}: LanguageSelectModalProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<"en" | "ur" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleLock = () => {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const res = await lockCourseLanguage(courseId, selected);
      if (res.error) {
        setError(res.error);
      } else {
        if (onSuccess) {
          onSuccess(selected);
        }
        router.refresh();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1D1D1D]/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#1D1D1D] border border-[#333333] text-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden flex flex-col space-y-6 animate-in zoom-in-95 duration-300">
        {/* Glow decoration */}
        <div className="absolute -right-24 -top-24 w-48 h-48 rounded-full bg-[#0A9EDE]/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-48 h-48 rounded-full bg-[#DD0408]/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-br from-[#0A9EDE] to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#0A9EDE]/20">
            <Globe size={28} className="text-white animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-bold font-coolvetica tracking-tight">Select Course Language</h2>
          <p className="text-xs text-[#A3A3A3] font-medium leading-relaxed px-4">
            Pick your preferred track. This choice will lock until you complete all chapters of the course.
          </p>
        </div>

        {/* Warning Badge */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-2xl p-4 flex items-start gap-3 relative z-10">
          <ShieldAlert size={20} className="shrink-0 mt-0.5" />
          <div className="text-left space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider">Lock-in Warning</h4>
            <p className="text-[11px] text-yellow-500/80 leading-relaxed">
              Course progress and chapter unlocking are separated by language. Your progress will be tracked under the selected track.
            </p>
          </div>
        </div>

        {/* Language Options */}
        <div className="grid grid-cols-2 gap-4 relative z-10">
          {/* English Option */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => setSelected("en")}
            className={`relative p-5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-3 group ${
              selected === "en"
                ? "bg-[#0A9EDE]/10 border-[#0A9EDE] text-white shadow-lg shadow-[#0A9EDE]/10"
                : "bg-[#252525]/50 border-[#333333] text-[#A3A3A3] hover:border-[#555555] hover:text-white"
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              selected === "en" ? "bg-[#0A9EDE] text-white" : "bg-[#333333] text-[#555555]"
            }`}>
              <Check size={16} className={selected === "en" ? "scale-100" : "scale-0"} />
            </div>
            <div>
              <h3 className="font-bold text-sm">English Track</h3>
              <p className="text-[10px] text-[#A3A3A3] mt-0.5">Chapters & Quizzes</p>
            </div>
          </button>

          {/* Urdu Option */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => setSelected("ur")}
            className={`relative p-5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-3 group ${
              selected === "ur"
                ? "bg-[#0A9EDE]/10 border-[#0A9EDE] text-white shadow-lg shadow-[#0A9EDE]/10"
                : "bg-[#252525]/50 border-[#333333] text-[#A3A3A3] hover:border-[#555555] hover:text-white"
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              selected === "ur" ? "bg-[#0A9EDE] text-white" : "bg-[#333333] text-[#555555]"
            }`}>
              <Check size={16} className={selected === "ur" ? "scale-100" : "scale-0"} />
            </div>
            <div>
              <h3 className="font-bold text-sm font-nastaliq pt-1">اردو ٹریک</h3>
              <p className="text-[10px] text-[#A3A3A3] mt-0.5">اسباق اور کوئز</p>
            </div>
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl p-3 text-center relative z-10">
            {error}
          </div>
        )}

        {/* Submit */}
        <Button
          onClick={handleLock}
          disabled={!selected || isPending}
          isLoading={isPending}
          className="w-full bg-[#0A9EDE] hover:bg-[#0A9EDE]/90 text-white font-bold py-3.5 rounded-2xl relative z-10"
        >
          Confirm Track Selection
        </Button>
      </div>
    </div>
  );
}
