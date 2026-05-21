"use client";

import React, { forwardRef, useState, useId } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, leftIcon, rightIcon, containerClassName = "", id, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const reactId = useId();
    const inputId = id || reactId;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (onBlur) onBlur(e);
    };

    return (
      <div className={`flex flex-col w-full gap-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-bold tracking-wide uppercase text-[#555555] select-none px-1"
          >
            {label}
          </label>
        )}
        
        {/* Minimalist White Border Wrapper */}
        <div
          className={`relative flex items-center w-full transition-all duration-200 rounded-xl bg-white border ${
            isFocused 
              ? "border-[#1D1D1D] ring-1 ring-[#1D1D1D] scale-[1.01]" 
              : "border-[#E5E5E5] hover:border-[#A3A3A3]"
          } ${error ? "border-[#DD0408] hover:border-[#DD0408]" : ""}`}
        >
          {leftIcon && (
            <div className="flex items-center justify-center pl-4 text-[#A3A3A3] pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`w-full bg-transparent text-base font-normal py-3.5 px-4 outline-none text-[#1D1D1D] placeholder-[#A3A3A3] ${
              leftIcon ? "pl-2" : ""
            } ${rightIcon ? "pr-2" : ""} ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="flex items-center justify-center pr-4 text-[#A3A3A3] pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <span className="text-xs text-[#DD0408] px-1 font-medium mt-0.5 animate-fadeIn">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
