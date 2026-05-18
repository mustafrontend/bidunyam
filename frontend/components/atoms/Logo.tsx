"use client";

import React from "react";

interface LogoProps {
  className?: string;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "", light = false }) => {
  return (
    <div className={`flex items-center gap-3 select-none active:scale-[0.98] transition-transform duration-200 ${className}`}>
      
      {/* Premium SVG Vector Replication of the Custom Brand Logo */}
      <svg 
        viewBox="0 0 40 40" 
        className="w-10 h-10 shrink-0" 
        fill="none" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        {/* Top Semicircle Handle */}
        <path 
          d="M16,13 C16,9 24,9 24,13" 
          stroke={light ? "#ffffff" : "#e35933"} 
        />
        
        {/* Sloped Shopping Bag Body with Curved Corners */}
        <path 
          d="M15.5,13.5 L24.5,13.5 C26.5,13.5 27.5,14.5 27.8,16.5 L29.8,28.5 C30.2,30.5 28.5,32.5 26.5,32.5 L13.5,32.5 C11.5,32.5 9.8,30.5 10.2,28.5 L12.2,16.5 C12.5,14.5 13.5,13.5 15.5,13.5 Z" 
          stroke={light ? "#ffffff" : "#e35933"} 
        />
        
        {/* Custom Target Circular Indicator */}
        <circle 
          cx="17.5" 
          cy="26.5" 
          r="2.5" 
          stroke={light ? "#ffffff" : "#e35933"} 
          fill={light ? "rgba(255,255,255,0.2)" : "rgba(227,89,51,0.12)"}
        />
        
        {/* Cursor Click Pointer Line Arrow */}
        <path 
          d="M12.5,31.5 L16.2,27.8 M16.2,27.8 L14,27.2 M16.2,27.8 L16.8,30" 
          stroke={light ? "#ffffff" : "#e35933"} 
          strokeWidth="2.5"
        />
      </svg>

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
