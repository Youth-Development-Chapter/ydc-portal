"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
  /** Title shown centered in the header */
  title: string;
  /** If true, renders a back button on the left. Default: true */
  showBack?: boolean;
  /**
   * Optional explicit href for the back button.
   * If omitted, clicking back calls router.back() (browser history).
   */
  backHref?: string;
  /** If true, renders a Home (dashboard) icon button on the right */
  showHome?: boolean;
  /** Optional extra element rendered on the right side (overrides showHome icon) */
  rightElement?: React.ReactNode;
}

export default function PageHeader({
  title,
  showBack = true,
  backHref,
  showHome = false,
  rightElement,
}: PageHeaderProps) {
  const router = useRouter();

  const BackButton = () => (
    <button
      onClick={backHref ? undefined : () => router.back()}
      aria-label="Go back"
      className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#E5E5E5] hover:bg-[#F5F5F5] active:scale-95 transition-all shadow-sm cursor-pointer"
    >
      <ArrowLeft size={20} className="text-[#1D1D1D]" />
    </button>
  );

  const leftSlot = showBack ? (
    backHref ? (
      <Link
        href={backHref}
        aria-label="Go back"
        className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#E5E5E5] hover:bg-[#F5F5F5] active:scale-95 transition-all shadow-sm"
      >
        <ArrowLeft size={20} className="text-[#1D1D1D]" />
      </Link>
    ) : (
      <BackButton />
    )
  ) : (
    <div className="w-10 h-10 opacity-0 pointer-events-none" />
  );

  const rightSlot = rightElement ? (
    rightElement
  ) : showHome ? (
    <Link
      href="/dashboard"
      aria-label="Go to Dashboard"
      className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#E5E5E5] hover:bg-[#F5F5F5] active:scale-95 transition-all shadow-sm"
    >
      <Home size={18} className="text-[#1D1D1D]" />
    </Link>
  ) : (
    <div className="w-10 h-10 opacity-0 pointer-events-none" />
  );

  return (
    <div className="flex items-center justify-between">
      {leftSlot}
      <span className="font-extrabold text-base tracking-tight text-[#1D1D1D] font-coolvetica">
        {title}
      </span>
      {rightSlot}
    </div>
  );
}
