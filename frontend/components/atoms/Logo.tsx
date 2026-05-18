"use client";

import React from "react";
import { ShoppingBag } from "lucide-react";

interface LogoProps {
  className?: string;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "", light = false }) => {
  return (
    <div className={`flex items-center gap-2 select-none active:scale-[0.98] transition-transform duration-200 ${className}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${
        light ? "bg-white/10 text-white" : "bg-[#001819] text-white shadow-sm"
      }`}>
        <ShoppingBag size={20} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`text-xl font-extrabold tracking-tight md:text-2xl font-sans ${
          light ? "text-white" : "text-slate-900"
        }`}>
          bi<span className="text-[#001819]">Dunyam</span>
        </span>
        <span className={`text-[9px] font-bold uppercase tracking-wider ${
          light ? "text-white/60" : "text-slate-400"
        }`}>
          Senin Dünyan
        </span>
      </div>
    </div>
  );
};
