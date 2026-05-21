"use client";

import React, { forwardRef, useState, useId } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  options?: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, containerClassName = "", id, options, children, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const reactId = useId();
    const selectId = id || reactId;

    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(false);
      if (onBlur) onBlur(e);
    };

    return (
      <div className={`flex flex-col w-full gap-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-bold tracking-wide uppercase text-[#555555] select-none px-1"
          >
            {label}
          </label>
        )}
        
        {/* Minimalist White Border Wrapper */}
        <div
          className={`relative flex items-center w-full transition-all duration-200 rounded-xl bg-white border cursor-pointer ${
            isFocused 
              ? "border-[#1D1D1D] ring-1 ring-[#1D1D1D] scale-[1.01]" 
              : "border-[#E5E5E5] hover:border-[#A3A3A3]"
          } ${error ? "border-[#DD0408] hover:border-[#DD0408]" : ""}`}
        >
          <select
            id={selectId}
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`w-full bg-transparent text-base font-normal py-3.5 pl-4 pr-10 outline-none text-[#1D1D1D] appearance-none cursor-pointer ${className}`}
            {...props}
          >
            {children}
            {options && options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="absolute right-4 text-[#A3A3A3] pointer-events-none flex items-center justify-center">
            <ChevronDown size={18} />
          </div>
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

Select.displayName = "Select";
