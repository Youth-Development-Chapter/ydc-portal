"use client";

import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "inverse";
}

export const Badge = ({
  className = "",
  variant = "default",
  children,
  ...props
}: BadgeProps) => {
  // Base style: small, rounded-full, pill-style tag
  const baseStyle = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold select-none border tracking-wider uppercase";

  const variants = {
    default:
      "bg-[#F5F5F5] border-[#E5E5E5] text-[#1D1D1D]",
    outline:
      "bg-transparent border-[#E5E5E5] text-[#1D1D1D]",
    inverse:
      "bg-[#1D1D1D] border-[#1D1D1D] text-white",
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};
