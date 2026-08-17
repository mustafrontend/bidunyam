"use client";

import React from "react";

interface LogoProps {
  className?: string;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "", light = false }) => {
  return (
    <div className={`flex items-center select-none active:scale-[0.98] transition-transform duration-200 ${className}`}>
      <img 
        src="/logo.jpeg" 
        alt="biDünyam Logo" 
        className="h-8 sm:h-9 md:h-10 lg:h-[42px] max-h-11 w-auto object-contain shrink-0 mix-blend-multiply transition-all duration-200"
      />
    </div>
  );
};
