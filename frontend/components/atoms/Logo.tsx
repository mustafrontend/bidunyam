"use client";

import React from "react";

interface LogoProps {
  className?: string;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "", light = false }) => {
  return (
    <div className={`flex items-center select-none active:scale-[0.98] transition-transform duration-200 ${className}`}>
      
      {/* Logo Image */}
      <img 
        src="/logo.jpeg" 
        alt="BiDünyam Logo" 
        className="h-14 md:h-16 lg:h-[72px] w-auto object-contain shrink-0 mix-blend-multiply"
      />

    </div>
  );
};
