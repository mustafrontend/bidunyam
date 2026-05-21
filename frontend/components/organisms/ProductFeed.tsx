"use client";

import { Sparkles } from "lucide-react";
import { ProductCard, Product } from "@/components/molecules/ProductCard";

interface ProductFeedProps {
  products: Product[];
  loading: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  selectedCategory: string;
  onLoadMore: () => void;
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border-[0.5px] border-slate-200 bg-white">
          <div className="aspect-square animate-pulse bg-slate-100" />
          <div className="space-y-3 p-4">
            <div className="h-2 w-1/4 animate-pulse rounded bg-slate-100" />
            <div className="h-3 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
            <div className="mt-4 flex justify-between items-center">
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
              <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductFeed({
  products,
  loading,
  hasMore,
  loadingMore,
  selectedCategory,
  onLoadMore,
}: ProductFeedProps) {
  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center select-none">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 md:text-2xl">
          Sizin İçin Seçtiklerimiz
        </h2>
        <div className="flex items-center gap-1.5 text-xs font-black text-[#001819]">
          <Sparkles size={14} className="animate-pulse" />
          <span>Kişiselleştirilmiş Akış</span>
        </div>
      </div>

      {loading ? (
        <SkeletonGrid />
      ) : products.length === 0 ? (
        <div className="py-24 text-center select-none bg-white rounded-2xl border-[0.5px] border-slate-200 shadow-sm">
          <span className="text-3xl">🔍</span>
          <p className="font-bold text-slate-400 mt-3 text-sm">
            {selectedCategory !== "Tümü"
              ? `"${selectedCategory}" kategorisinde ürün bulunamadı.`
              : "Henüz ürün bulunmamaktadır."}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={onLoadMore}
                disabled={loadingMore}
                className="rounded-full bg-slate-900 px-12 py-4 text-xs font-black text-white uppercase tracking-widest shadow-sm transition-all duration-300 hover:bg-[#ff5000] hover:shadow-lg disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {loadingMore ? "Yükleniyor..." : "Daha Fazla Keşfet"}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
