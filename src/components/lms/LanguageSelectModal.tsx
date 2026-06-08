"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, Check, X } from "lucide-react";
import { lockCourseLanguage } from "@/app/lms/courses/actions";

interface LanguageSelectModalProps {
  courseId: string;
  courseTitle: string;
  courseTitleUr?: string;
  onSuccess?: (lang: "en" | "ur") => void;
  closable?: boolean;
  onClose?: () => void;
}

export default function LanguageSelectModal({
  courseId,
  courseTitle,
  courseTitleUr,
  onSuccess,
  closable,
  onClose,
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
        if (closable && onClose) {
          onClose();
        }
        router.refresh();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E5E5] text-[#1D1D1D] rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden flex flex-col space-y-6 animate-in zoom-in-95 duration-200">

        {/* Close Button */}
        {closable && onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 text-[#A3A3A3] hover:text-[#1D1D1D] hover:bg-neutral-100 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        )}

        {/* Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-br from-[#0A9EDE] to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#0A9EDE]/25">
            <Globe size={28} className="text-white animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-bold font-coolvetica tracking-tight text-[#1D1D1D]">Change Language</h2>
          <p className="text-xs text-[#555555] font-medium leading-relaxed px-4">
            Pick your preferred one. Note: your progress will reset if you change the language.
          </p>
        </div>

        {/* Language Options */}
        <div className="grid grid-cols-2 gap-4 relative z-10">
          {/* English Option */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => setSelected("en")}
            className={`relative p-5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-3 group cursor-pointer ${
              selected === "en"
                ? "bg-[#0A9EDE]/5 border-[#0A9EDE] text-[#0A9EDE] shadow-md shadow-[#0A9EDE]/5"
                : "bg-[#FAFAFA] border-[#E5E5E5] text-[#555555] hover:border-[#A3A3A3] hover:text-[#1D1D1D]"
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              selected === "en" ? "bg-[#0A9EDE] text-white" : "bg-[#E5E5E5] text-transparent"
            }`}>
              <Check size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm">English</h3>
              <p className="text-[10px] text-[#A3A3A3] mt-0.5">Chapters & Quizzes</p>
            </div>
          </button>

          {/* Urdu Option */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => setSelected("ur")}
            className={`relative p-5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-3 group cursor-pointer ${
              selected === "ur"
                ? "bg-[#0A9EDE]/5 border-[#0A9EDE] text-[#0A9EDE] shadow-md shadow-[#0A9EDE]/5"
                : "bg-[#FAFAFA] border-[#E5E5E5] text-[#555555] hover:border-[#A3A3A3] hover:text-[#1D1D1D]"
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              selected === "ur" ? "bg-[#0A9EDE] text-white" : "bg-[#E5E5E5] text-transparent"
            }`}>
              <Check size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm font-nastaliq pt-1">اردو</h3>
              <p className="text-[10px] text-[#A3A3A3] mt-0.5">اسباق اور کوئز</p>
            </div>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl p-3 text-center relative z-10">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleLock}
          disabled={!selected || isPending}
          className="w-full bg-[#0A9EDE] hover:bg-[#0A9EDE]/95 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-white font-bold py-3.5 rounded-2xl relative z-10 transition-all duration-200 cursor-pointer text-sm shadow-sm flex items-center justify-center gap-2"
        >
          {isPending && (
            <svg className="animate-spin -ml-1 h-4 w-4 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <span>Change</span>
        </button>
      </div>
    </div>
  );
}
