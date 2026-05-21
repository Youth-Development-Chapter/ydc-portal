"use client";

import React, { useState, useId } from "react";

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  id?: string;
}

export const Switch = ({
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  className = "",
  label,
  id,
  ...props
}: SwitchProps) => {
  const [localChecked, setLocalChecked] = useState(defaultChecked);
  const isChecked = checked !== undefined ? checked : localChecked;
  const generatedId = useId();
  const switchId = id || generatedId;

  const handleToggle = () => {
    if (disabled) return;
    const newChecked = !isChecked;
    if (checked === undefined) {
      setLocalChecked(newChecked);
    }
    if (onChange) {
      onChange(newChecked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={isChecked}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1D1D1D] focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
          isChecked 
            ? "bg-[#1D1D1D] shadow-sm dark:bg-white" 
            : "bg-[#E5E5E5] dark:bg-[#333333]"
        }`}
        {...props}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-[#111111] shadow-md ring-0 transition duration-300 ease-in-out ${
            isChecked 
              ? "translate-x-5" 
              : "translate-x-0"
          }`}
        />
      </button>
      
      {label && (
        <label
          htmlFor={switchId}
          className={`text-sm font-medium cursor-pointer ${
            disabled ? "text-[#A3A3A3] cursor-not-allowed" : "text-[#1D1D1D] dark:text-white"
          }`}
        >
          {label}
        </label>
      )}
    </div>
  );
};
