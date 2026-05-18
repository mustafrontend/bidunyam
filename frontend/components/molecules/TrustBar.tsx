"use client";

import React from "react";
import { ShieldCheck, Lock, CreditCard, Truck } from "lucide-react";

const BENEFITS = [
  {
    icon: Lock,
    label: "Güvenli Gizlilik Koruması",
    desc: "Kişisel verileriniz 256-bit SSL ile korunur",
  },
  {
    icon: CreditCard,
    label: "Güvenli Ödeme",
    desc: "Tüm banka kartlarına taksit imkanı",
  },
  {
    icon: Truck,
    label: "Teslimat Garantisi",
    desc: "Hasarsız ve zamanında kargo güvencesi",
  },
];

export const TrustBar: React.FC = () => {
  return (
    <section className="bg-emerald-50/40 border border-emerald-100/80 rounded-2xl p-4 md:p-5 flex flex-wrap justify-between items-center gap-4 select-none">
      <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm md:text-base">
        <ShieldCheck size={20} className="text-emerald-600 shrink-0" strokeWidth={2.5} />
        <span>Neden Bi Dünyam?</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs md:text-sm text-emerald-700">
        {BENEFITS.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 group hover:text-emerald-900 transition-colors duration-150">
            <div className="h-6 w-6 rounded-lg bg-emerald-100/50 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-105 transition-transform duration-150">
              <item.icon size={14} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold leading-none">{item.label}</span>
              <span className="text-[10px] text-emerald-600/70 hidden sm:inline">{item.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
