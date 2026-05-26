"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Product } from "@/components/molecules/ProductCard";

interface DealsShowcaseProps {
  products: Product[];
}

export const DealsShowcase: React.FC<DealsShowcaseProps> = ({ products }) => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter items that have real discount, fallback to top products if none are discounted
  const dealProducts = useMemo(() => {
    const discounted = products.filter((p) => p.originalPrice > p.price);
    if (discounted.length > 0) return discounted;
    // Fallback to top products if no active discount
    return products.slice(0, 5);
  }, [products]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (dealProducts.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % dealProducts.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (dealProducts.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + dealProducts.length) % dealProducts.length);
  };

  const currentProduct = dealProducts[currentIndex];

  const discountPercent = useMemo(() => {
    if (!currentProduct) return 0;
    if (currentProduct.originalPrice <= currentProduct.price) {
      // Fake a sleek sepette indirim percentage for showcase products
      return 20;
    }
    return Math.round(
      ((currentProduct.originalPrice - currentProduct.price) / currentProduct.originalPrice) * 100
    );
  }, [currentProduct]);

  return (
    <div className="w-full h-[380px] rounded-3xl overflow-hidden border-[1.5px] border-[#ff5a00] bg-white flex flex-col justify-between select-none shadow-sm relative group">
      
      {/* 1. Header: Orange themed box area resembling Photo 2 exactly */}
      <div className="bg-gradient-to-r from-[#ff5a00] to-[#ff7a00] px-6 py-4 flex items-center justify-between text-white relative overflow-hidden h-[95px] shrink-0">
        {/* Background boxed illustrative assets */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none scale-105">
          <div className="flex gap-1.5 rotate-12">
            <div className="w-9 h-9 bg-white rounded-lg" />
            <div className="w-10 h-10 bg-white rounded-lg -translate-y-2" />
          </div>
        </div>

        <div className="space-y-0.5 relative z-10">
          <span className="bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider block w-fit">
            Büyük Fırsat
          </span>
          <h2 className="text-xl font-black tracking-tight uppercase">
            Fırsatları Kaçırma
          </h2>
        </div>
        <Sparkles size={20} className="text-white/80 animate-pulse relative z-10 shrink-0" />
      </div>

      {/* 2. Micro Carousel Container */}
      <div className="flex-1 p-5 flex flex-col justify-between min-h-0 bg-white">
        {currentProduct ? (
          <div 
            onClick={() => router.push(`/product/${currentProduct._id}`)} 
            className="flex-1 flex flex-col justify-between cursor-pointer group/item"
          >
            {/* Interactive Image */}
            <div className="relative aspect-[3/2] w-full max-h-[120px] bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center p-3 overflow-hidden shrink-0">
              {currentProduct.imageUrl ? (
                <img
                  src={currentProduct.imageUrl}
                  alt={currentProduct.name}
                  className="max-h-full max-w-full object-contain group-hover/item:scale-105 transition-transform duration-300"
                />
              ) : (
                <AlertCircle className="text-slate-300" size={32} />
              )}

              {/* Slider Prev Navigation Arrow */}
              {dealProducts.length > 1 && (
                <button
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-slate-50 border border-slate-100 text-slate-700 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer opacity-0 group-hover:opacity-100 z-10 duration-200"
                >
                  <ChevronLeft size={16} strokeWidth={2.5} />
                </button>
              )}

              {/* Slider Next Navigation Arrow */}
              {dealProducts.length > 1 && (
                <button
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-slate-50 border border-slate-100 text-slate-700 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer opacity-0 group-hover:opacity-100 z-10 duration-200"
                >
                  <ChevronRight size={16} strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* Product Meta: Title and Green Discount Text */}
            <div className="mt-3 space-y-1 select-none flex-1 flex flex-col justify-center">
              <span className="text-[9px] font-black text-[#ff5a00] uppercase tracking-widest block">
                {currentProduct.brand}
              </span>
              <h3 className="text-xs font-black text-slate-800 line-clamp-1 leading-snug tracking-tight">
                {currentProduct.name}
              </h3>
              {/* Green bold text like Photo 2 */}
              <p className="text-[#10b981] text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                <span>Sepette %{discountPercent} Net İndirim</span>
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xs font-black text-slate-900">
                  {currentProduct.price.toLocaleString("tr-TR")} TL
                </span>
                {currentProduct.originalPrice > currentProduct.price && (
                  <span className="text-slate-400 line-through text-[9px] font-bold">
                    {currentProduct.originalPrice.toLocaleString("tr-TR")} TL
                  </span>
                )}
              </div>
            </div>

            {/* Discover/CTA Button */}
            <div className="mt-3 shrink-0">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/product/${currentProduct._id}`);
                }}
                className="w-full py-2.5 bg-white border border-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-center select-none active:scale-[0.98]"
              >
                Kampanyalı ürünleri keşfet
              </button>
            </div>

          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center text-slate-400 py-4 gap-2">
            <AlertCircle size={28} className="text-slate-300 animate-bounce" />
            <p className="text-[10px] font-black uppercase tracking-widest">Fırsat bulunamadı</p>
          </div>
        )}
      </div>

    </div>
  );
};
