"use client";

import React, { createContext, useContext, useState } from "react";

interface TabsContextProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextProps | undefined>(undefined);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export const Tabs = ({
  defaultValue,
  value,
  onValueChange,
  children,
  className = "",
  ...props
}: TabsProps) => {
  const [localActiveTab, setLocalActiveTab] = useState(defaultValue);
  const activeTab = value !== undefined ? value : localActiveTab;

  const setActiveTab = (newValue: string) => {
    if (value === undefined) {
      setLocalActiveTab(newValue);
    }
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`w-full ${className}`} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "line" | "pill";
}

export const TabsList = ({ className = "", variant = "line", children, ...props }: TabsListProps) => {
  const baseListClass = "flex items-center gap-1 overflow-x-auto scrollbar-none select-none";
  
  const variantStyles = {
    line: "border-b border-[#E5E5E5] pb-[1px] w-full",
    pill: "bg-[#F5F5F5] border border-[#E5E5E5] p-1 rounded-xl w-fit",
  };

  return (
    <div className={`${baseListClass} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  variant?: "line" | "pill";
}

export const TabsTrigger = ({
  className = "",
  value,
  variant = "line",
  children,
  ...props
}: TabsTriggerProps) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used within a Tabs component");

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  const baseTriggerClass =
    "inline-flex items-center justify-center font-semibold text-sm transition-all duration-200 focus:outline-none shrink-0 cursor-pointer select-none active:scale-95";

  const variantTriggerStyles = {
    line: `relative px-4 py-3 text-[#555555] hover:text-[#1D1D1D] ${
      isActive ? "text-[#1D1D1D]" : ""
    }`,
    pill: `px-4 py-2 rounded-lg text-[#555555] hover:text-[#1D1D1D] ${
      isActive ? "bg-white text-[#1D1D1D] shadow-sm border border-[#E5E5E5]" : "border border-transparent"
    }`,
  };

  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={`${baseTriggerClass} ${variantTriggerStyles[variant]} ${className}`}
      {...props}
    >
      {children}
      
      {/* Black/White underline for active line tab */}
      {variant === "line" && isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1D1D1D] animate-fadeIn rounded-full" />
      )}
    </button>
  );
};

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = ({ className = "", value, children, ...props }: TabsContentProps) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used within a Tabs component");

  const { activeTab } = context;
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <div
      className={`py-4 animate-fadeIn focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
