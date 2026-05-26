"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard, Product } from "@/components/molecules/ProductCard";

interface ProductCarouselSectionProps {
  title: string;
  products: Product[];
}

export const ProductCarouselSection: React.FC<ProductCarouselSectionProps> = ({ title, products }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="w-full space-y-4 select-none relative group mt-8">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
          {title}
        </h2>
      </div>

      <div className="relative">
        <button
          onClick={() => scroll("left")}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-slate-200 text-slate-600 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all opacity-0 group-hover:opacity-100 hover:text-slate-900 disabled:opacity-0 cursor-pointer hidden md:flex"
        >
          <ChevronLeft size={20} strokeWidth={3} />
        </button>

        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4 px-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product) => (
            <div key={product._id} className="snap-start shrink-0 w-[180px] md:w-[220px]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-slate-200 text-slate-600 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all opacity-0 group-hover:opacity-100 hover:text-slate-900 disabled:opacity-0 cursor-pointer hidden md:flex"
        >
          <ChevronRight size={20} strokeWidth={3} />
        </button>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};
