"use client";

import React from "react";

// İyzico ödeme yöntemleri logo şeridi (inline SVG — dış kaynağa bağımlı değil)

const Visa = () => (
  <div className="flex h-7 w-11 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm">
    <span className="text-[13px] font-black italic tracking-tight text-[#1434CB]">VISA</span>
  </div>
);

const Mastercard = () => (
  <div className="flex h-7 w-11 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm">
    <svg viewBox="0 0 32 20" className="h-4">
      <circle cx="12" cy="10" r="7" fill="#EB001B" />
      <circle cx="20" cy="10" r="7" fill="#F79E1B" />
      <path d="M16 4.5a7 7 0 0 1 0 11 7 7 0 0 1 0-11z" fill="#FF5F00" />
    </svg>
  </div>
);

const Amex = () => (
  <div className="flex h-7 w-11 items-center justify-center rounded-md bg-[#006FCF] shadow-sm">
    <span className="text-[8px] font-black uppercase leading-none tracking-tight text-white text-center">AMEX</span>
  </div>
);

const Troy = () => (
  <div className="flex h-7 w-11 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm">
    <span className="text-[12px] font-black lowercase italic tracking-tighter text-[#00A0D2]">troy</span>
  </div>
);

const Iyzico = () => (
  <div className="flex h-7 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 shadow-sm">
    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#1E64FF] text-[9px] font-black text-white">i</span>
    <span className="text-[12px] font-black lowercase tracking-tight text-[#0B1B3F]">iyzico</span>
  </div>
);

interface PaymentLogosProps {
  showLabel?: boolean;
  className?: string;
}

export const PaymentLogos: React.FC<PaymentLogosProps> = ({ showLabel = true, className = "" }) => {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Güvenli Ödeme</span>
      )}
      <Iyzico />
      <Visa />
      <Mastercard />
      <Amex />
      <Troy />
    </div>
  );
};
