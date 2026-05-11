"use client";

import React from 'react';
import { Zap, CreditCard, RotateCcw, Truck, ShieldCheck, Tag } from 'lucide-react';

const features = [
  { icon: Zap, label: 'Flaş İndirimler', color: 'bg-orange-50 text-orange-500' },
  { icon: CreditCard, label: 'Taksit İmkanı', color: 'bg-blue-50 text-blue-500' },
  { icon: RotateCcw, label: 'Kolay İade', color: 'bg-green-50 text-green-500' },
  { icon: Truck, label: 'Hızlı Teslimat', color: 'bg-purple-50 text-purple-500' },
  { icon: ShieldCheck, label: 'Güvenli Ödeme', color: 'bg-emerald-50 text-emerald-500' },
  { icon: Tag, label: 'Özel Kuponlar', color: 'bg-pink-50 text-pink-500' },
];

export const FeatureBar: React.FC = () => {
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-4 py-8">
      {features.map((feature, i) => (
        <button
          key={i}
          className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border-[0.5px] border-slate-200 hover:shadow-lg hover:border-brand-orange transition-all group active:scale-95"
        >
          <div className={`p-3 rounded-xl ${feature.color} group-hover:scale-110 transition-transform`}>
            <feature.icon size={24} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] md:text-xs font-black text-slate-700 uppercase tracking-tight">
            {feature.label}
          </span>
        </button>
      ))}
    </div>
  );
};
