"use client";

import React from "react";

interface LogoProps {
  className?: string;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "", light = false }) => {
  return (
    <div className={`flex items-center gap-3 select-none active:scale-[0.98] transition-transform duration-200 ${className}`}>
      
      {/* Logo Image */}
      <img 
        src="/logo.jpeg" 
        alt="BiDünyam Logo" 
        className="h-[103px] w-auto object-contain rounded-full shadow-sm shrink-0"
      />

      {/* Brand Text Section */}
      <div className="flex flex-col leading-none">
        <span className={`text-xl font-black tracking-tight font-sans ${
          light ? "text-white" : "text-[#2b1b1d]"
        }`}>
          Bi <span className={light ? "text-white" : "text-[#2b1b1d]"}>Dünyam</span>
        </span>
        <span className={`text-[8px] font-black uppercase tracking-[0.25em] mt-0.5 ${
          light ? "text-white/70" : "text-[#e35933]"
        }`}>
          SENİN DÜNYAN
        </span>
      </div>

    </div>
  );
};
