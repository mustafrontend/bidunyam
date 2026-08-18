"use client";

import React from "react";
import { Truck, Package, Award } from "lucide-react";

interface DeliverySidebarProps {
  preparationDays?: number;
}

export const DeliverySidebar: React.FC<DeliverySidebarProps> = ({ preparationDays = 1 }) => {
  // Tahmini teslim tarihini gerçek zaman üzerinden hesapla (hazırlık + 1-2 gün kargo)
  const estimated = new Date();
  estimated.setDate(estimated.getDate() + Math.max(1, preparationDays) + 2);
  const teslimTarihi = estimated.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" });

  return (
    <div className="space-y-6 select-none">
      {/* Delivery & Returns card */}
      <div className="p-6 border border-slate-200 bg-white rounded-xl space-y-4">
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Teslimat & İade</h4>

        <div className="space-y-4">
          <div className="flex gap-3">
            <Truck className="text-[#ff5000] shrink-0" size={20} strokeWidth={2.5} />
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-800 leading-tight">Tahmini Teslim: {teslimTarihi}</span>
              <span className="text-[10px] text-slate-400 font-bold mt-0.5">Kargo teslimden itibaren 1-3 iş günü</span>
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

      {/* Güvenli alışveriş güvencesi */}
      <div className="p-6 bg-orange-500/5 border border-orange-500/10 rounded-xl flex flex-col gap-3.5">
        <div className="flex items-center gap-2 text-[#ff5000]">
          <Award size={18} strokeWidth={2.5} />
          <span className="text-xs font-black uppercase tracking-wider">Güvenli Alışveriş</span>
        </div>
        <p className="text-xs font-bold text-slate-500 leading-relaxed">
          Ödemeniz <span className="text-[#ff5000] font-black">256-bit SSL</span> ve 3D Secure ile korunur. Ürün elinize ulaşana kadar tutar güvence altındadır.
        </p>
      </div>
    </div>
  );
};
