"use client";

import React, { useState } from "react";
import { Globe } from "lucide-react";
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
        className={`flex items-center gap-1.5 px-3 py-1.5 bg-[#E5E5E5] hover:bg-[#D5D5D5] transition-colors rounded-full text-xs font-bold text-[#1D1D1D] ${currentLanguage === "ur" ? "font-nastaliq text-sm" : ""}`}
      >
        <Globe size={14} />
        {currentLanguage === "ur" ? "ٹریک تبدیل کریں" : "Change Track"}
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
