"use client";

import { useRouter } from "next/navigation";
import { Timer, Percent, Sparkles, Star } from "lucide-react";
import { Product } from "@/components/molecules/ProductCard";

interface FlashDealsGridProps {
  products: Product[];
  timeLeft: { hours: number; minutes: number; seconds: number };
}

export function FlashDealsGrid({ products, timeLeft }: FlashDealsGridProps) {
  const router = useRouter();

  if (products.length === 0) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section className="bg-white border-[0.5px] border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 select-none shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="bg-red-500 text-white p-2 rounded-xl flex items-center justify-center shrink-0">
            <Percent size={18} strokeWidth={3} />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Flaş İndirimler</h2>
            <p className="text-slate-400 text-xs font-bold mt-0.5">En yüksek indirim oranına sahip popüler ürünler</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
          <Timer size={14} className="text-[#ff5000] animate-spin" />
          <span className="text-xs font-black text-slate-700">Kalan Süre:</span>
          <span className="text-[#ff5000] font-black text-xs">
            {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
          </span>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((p) => {
          const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
          const soldPercent = Math.min(95, Math.max(30, Math.round((p.price % 60) + 35)));
          return (
            <div
              key={p._id}
              onClick={() => router.push(`/product/${p._id}`)}
              className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col justify-between w-[160px] md:w-[240px] shrink-0 snap-start"
            >
              <div>
                <div className="relative aspect-square mb-3 overflow-hidden rounded-xl bg-white flex items-center justify-center p-3 border border-slate-100">
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                    -%{discount}
                  </div>
                </div>
                <span className="text-[#ff5000] font-black text-[9px] uppercase tracking-widest block">{p.brand}</span>
                <h4 className="text-xs font-black text-slate-800 line-clamp-1 mt-1 group-hover:text-[#ff5000] transition-colors">{p.name}</h4>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-black text-slate-900">{p.price.toLocaleString("tr-TR")} TL</span>
                  <span className="text-slate-400 line-through text-[10px] font-bold">{p.originalPrice.toLocaleString("tr-TR")} TL</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <span>%{soldPercent} Satıldı</span>
                    <span className="text-red-500">Tükeniyor!</span>
                  </div>
                  <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${soldPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Showcase section integrated */}
      <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
        <Star size={14} className="text-amber-500" fill="currentColor" strokeWidth={0} />
        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
          <Sparkles size={12} className="inline mr-1 text-amber-400 animate-pulse" />
          Editörün Seçimi — En yüksek puanlı ürünler üstte gösterilir
        </span>
      </div>
    </section>
  );
}
