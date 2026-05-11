"use client";

import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`flex flex-col leading-none ${className}`}>
      <span className="text-[#ff6000] font-black text-2xl md:text-3xl tracking-tight">bidunyam</span>
      <span className="text-[9px] md:text-[10px] font-bold text-[#ff6000] tracking-wide">Premium'u kesfet</span>
    </div>
  );
};
