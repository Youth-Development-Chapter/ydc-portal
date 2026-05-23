"use client";

import React, { forwardRef } from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    // Base styles: Vercel-like premium styling, smooth scale, focus rings
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none border cursor-pointer";

    // Size variants
    const sizes = {
      sm: "text-xs px-3 py-1.5 gap-1.5 min-h-[2rem]",
      md: "text-sm px-4 py-2.5 gap-2 min-h-[2.5rem]",
      lg: "text-base px-6 py-3.5 gap-2 min-h-[3rem] rounded-xl", 
    };

    // Style variants - Strictly Black and White
    const variants = {
      primary:
        "bg-[#1D1D1D] border-[#1D1D1D] hover:bg-black hover:border-black text-white focus:ring-[#1D1D1D] shadow-sm",
      secondary:
        "bg-white border-[#E5E5E5] text-[#1D1D1D] hover:bg-[#F5F5F5] hover:border-[#D4D4D4] focus:ring-[#1D1D1D] shadow-sm",
      outline:
        "border-[#E5E5E5] text-[#1D1D1D] bg-white hover:bg-[#F5F5F5] focus:ring-[#1D1D1D]",
      ghost:
        "border-transparent text-[#1D1D1D] bg-transparent hover:bg-[#F5F5F5] focus:ring-[#1D1D1D]",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        <span className="overflow-visible">{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
