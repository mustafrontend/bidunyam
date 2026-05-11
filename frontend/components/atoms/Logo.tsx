"use client";

import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-[#F06543] rounded-full overflow-hidden shadow-lg shadow-orange-200">
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 md:w-6 md:h-6 text-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-[#F06543]" />
      </div>
      <div className="flex flex-col -space-y-1">
        <div className="flex items-baseline">
          <span className="text-[#3F4095] font-black text-xl md:text-2xl tracking-tighter">bi</span>
          <span className="text-[#F06543] font-black text-2xl md:text-3xl tracking-tighter mx-0.5 italic">D</span>
          <span className="text-[#3F4095] font-black text-xl md:text-2xl tracking-tighter">unyam</span>
        </div>
        <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Senin dünyan, senin mağazan</span>
      </div>
    </div>
  );
};
