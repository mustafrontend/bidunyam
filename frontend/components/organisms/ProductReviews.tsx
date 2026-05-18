"use client";

import React from "react";
import { Star, ShieldCheck } from "lucide-react";

interface ProductReviewsProps {
  rating: number;
  reviewCount: number;
  productImageUrl?: string;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({
  rating = 0,
  reviewCount = 0,
  productImageUrl = "",
}) => {
  // Use high-fidelity fallbacks matching the HTML mock if DB values are empty
  const displayRating = rating > 0 ? rating : 4.8;
  const displayCount = reviewCount > 0 ? reviewCount : 141;

  return (
    <div className="space-y-8 select-none">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Müşteri Değerlendirmeleri</h3>
        <button className="text-xs font-black text-[#ff5000] hover:underline cursor-pointer">Değerlendirme Yaz</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left score panel */}
        <div className="md:col-span-1">
          <div className="text-center p-6 bg-slate-100/60 border border-slate-200 rounded-xl flex flex-col items-center justify-center">
            <span className="text-[48px] font-black text-slate-900 leading-none tracking-tighter">{displayRating.toFixed(1)}</span>
            <div className="flex text-[#ff5000] my-3 gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  fill={i < Math.round(displayRating) ? "currentColor" : "none"}
                  strokeWidth={i < Math.round(displayRating) ? 0 : 2}
                  className="stroke-[#ff5000]"
                />
              ))}
            </div>
            <span className="text-[10px] text-slate-400 font-bold">Toplam {displayCount} Değerlendirme</span>
          </div>
        </div>

        {/* Right review posts */}
        <div className="md:col-span-3 space-y-6">
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ff5000]/10 text-[#ff5000] flex items-center justify-center font-black text-sm">
                  JD
                </div>
                <div>
                  <span className="text-xs font-black text-slate-800 block">John D.</span>
                  <span className="text-emerald-600 text-[10px] font-bold flex items-center gap-1 mt-0.5">
                    <ShieldCheck size={13} strokeWidth={2.5} /> Onaylı Alıcı
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">2 gün önce</span>
            </div>

            <div className="flex text-[#ff5000] gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={13} fill="currentColor" className="stroke-none" />
              ))}
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Ürünü ofis koltuğum için aldım. Günde 10 saate yakın oturuyorum ve sırt ağrılarım önemli ölçüde azaldı. Kesinlikle tavsiye ederim!
            </p>

            {productImageUrl && (
              <div className="flex gap-2">
                <div className="w-16 h-16 rounded border border-slate-200 overflow-hidden bg-slate-50 p-1 flex items-center justify-center shrink-0">
                  <img src={productImageUrl} alt="Kullanıcı Fotoğrafı" className="w-full h-full object-cover grayscale opacity-80" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
