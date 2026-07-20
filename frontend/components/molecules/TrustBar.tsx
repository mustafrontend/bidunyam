"use client";

import React from "react";
import { ShieldCheck, CreditCard, Truck, RotateCcw } from "lucide-react";

const BENEFITS = [
  { icon: ShieldCheck, label: "Güvenli Alışveriş", desc: "256-bit SSL koruması", color: "text-emerald-600", bg: "bg-emerald-50" },
  { icon: CreditCard, label: "Taksitli Ödeme", desc: "Tüm kartlara taksit imkanı", color: "text-indigo-600", bg: "bg-indigo-50" },
  { icon: Truck, label: "Hızlı Teslimat", desc: "Kapına kadar güvenle", color: "text-blue-600", bg: "bg-blue-50" },
  { icon: RotateCcw, label: "Kolay İade", desc: "14 gün içinde ücretsiz iade", color: "text-rose-600", bg: "bg-rose-50" },
];

export const TrustBar: React.FC = () => {
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4 select-none">
      {BENEFITS.map((item, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 transition-shadow hover:shadow-sm"
        >
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.bg} ${item.color}`}>
            <item.icon size={20} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-800 leading-tight">{item.label}</p>
            <p className="text-[11px] font-medium text-slate-400 leading-tight mt-0.5">{item.desc}</p>
          </div>
        </div>
      ))}
    </section>
  );
};
