"use client";

import React from "react";
import { Truck, Package, Award } from "lucide-react";

export const DeliverySidebar: React.FC = () => {
  return (
    <div className="space-y-6 select-none">
      {/* Delivery & Returns card */}
      <div className="p-6 border border-slate-200 bg-white rounded-xl space-y-4">
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Teslimat & İade</h4>
        
        <div className="space-y-4">
          <div className="flex gap-3">
            <Truck className="text-[#ff5000] shrink-0" size={20} strokeWidth={2.5} />
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-800 leading-tight">Yarın Kapında, 24 Mayıs</span>
              <span className="text-[10px] text-slate-400 font-bold mt-0.5">Sonraki 2 saat 14 dakika içinde sipariş verirseniz</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Package className="text-[#ff5000] shrink-0" size={20} strokeWidth={2.5} />
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-800 leading-tight">Ücretsiz İade</span>
              <span className="text-[10px] text-slate-400 font-bold mt-0.5">30 gün koşulsuz, şartsız kolay iade politikası</span>
            </div>
          </div>
        </div>
      </div>

      {/* Member benefits box */}
      <div className="p-6 bg-orange-500/5 border border-orange-500/10 rounded-xl flex flex-col gap-3.5">
        <div className="flex items-center gap-2 text-[#ff5000]">
          <Award size={18} strokeWidth={2.5} />
          <span className="text-xs font-black uppercase tracking-wider">Üyelik Avantajı</span>
        </div>
        <p className="text-xs font-bold text-slate-500 leading-relaxed">
          Bu satın alımdan tam <span className="text-[#ff5000] font-black">52 biDunyam Puanı</span> kazanın.
        </p>
        <button className="w-full py-2.5 bg-slate-900 hover:bg-[#ff5000] text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95">
          Şimdi Katıl
        </button>
      </div>
    </div>
  );
};
