"use client";

import React, { useState } from "react";
import { Languages } from "lucide-react";
import LanguageSelectModal from "./LanguageSelectModal";

interface ChangeLanguageButtonProps {
  courseId: string;
  courseTitle: string;
  courseTitleUr?: string;
  currentLanguage: "en" | "ur";
}

export default function ChangeLanguageButton({
  courseId,
  courseTitle,
  courseTitleUr,
  currentLanguage,
}: ChangeLanguageButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-all rounded-full text-[10px] font-extrabold text-[#1D1D1D] shadow-sm uppercase tracking-wider shrink-0 cursor-pointer"
        title="Change Course Language"
      >
        <Languages size={12} className="text-[#0A9EDE]" />
        <span>{currentLanguage === "ur" ? "Urdu" : "English"}</span>
      </button>

      {isOpen && (
        <LanguageSelectModal
          courseId={courseId}
          courseTitle={courseTitle}
          courseTitleUr={courseTitleUr}
          closable={true}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
