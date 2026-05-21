"use client";

import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "interactive";
  interactive?: boolean;
}

export const Card = ({
  className = "",
  variant = "default",
  interactive = false,
  children,
  ...props
}: CardProps) => {
  // Base card styling: strictly B&W, crisp thin border
  const baseCardClass = "relative overflow-hidden rounded-2xl bg-white border border-[#E5E5E5] dark:bg-[#111111] dark:border-[#333333] transition-all duration-300";
  
  // Interactive styling
  const interactiveClass = interactive || variant === "interactive"
    ? "hover:-translate-y-1 hover:shadow-xl hover:border-[#1D1D1D] dark:hover:border-white cursor-pointer"
    : "";

  return (
    <div className={`${baseCardClass} ${interactiveClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`p-6 pb-4 flex flex-col space-y-1 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ className = "", children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h3 className={`text-lg font-bold tracking-tight text-[#1D1D1D] dark:text-white ${className}`} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ className = "", children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => {
  return (
    <p className={`text-sm text-[#555555] dark:text-[#A3A3A3] leading-normal ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent = ({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`p-6 pt-0 text-sm leading-relaxed text-[#333333] dark:text-[#CCCCCC] ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`p-6 pt-0 border-t border-[#F5F5F5] dark:border-[#222222] mt-4 flex items-center gap-4 ${className}`} {...props}>
      {children}
    </div>
  );
};
