"use client";

import { Sparkles, Loader2, Inbox } from "lucide-react";
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
    /* Grid yapısı tam ekrana yayılacak şekilde genişletildi. xl ekranlarda yan yana 6 slot gösterilir. */
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 space-y-4">
          <div className="aspect-square w-full animate-pulse rounded-xl bg-slate-100" />
          <div className="space-y-2">
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="pt-2 flex justify-between items-center border-t border-slate-50">
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="h-8 w-8 animate-pulse rounded-xl bg-slate-100" />
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
    /* max-w-7xl kaldırıldı; px-4, md:px-12, 2xl:px-16 ile Navbar hizasıyla tam entegre bir genişlik kurgulandı */
    <section className="w-full max-w-full px-4 md:px-12 2xl:px-16 mx-auto space-y-6 md:space-y-8">
      
      {/* Feed Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 select-none">
        <div className="space-y-1">
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900">
            Sizin İçin Seçtiklerimiz
          </h2>
          <p className="text-xs text-slate-400 font-medium hidden sm:block">
            İlgi alanlarınıza göre anlık olarak güncellenir
          </p>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700 shadow-sm">
          <Sparkles size={13} className="text-amber-500 fill-amber-500 animate-pulse" />
          <span>Kişiselleştirilmiş Akış</span>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <SkeletonGrid />
      ) : products.length === 0 ? (
        /* Enhanced Empty State */
        <div className="py-20 flex flex-col items-center justify-center text-center select-none bg-white rounded-2xl border border-slate-100 shadow-sm max-w-xl mx-auto p-6">
          <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl mb-4 border border-slate-100/50">
            <Inbox size={32} strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Sonuç Bulunamadı</h3>
          <p className="font-medium text-slate-400 mt-1.5 text-xs max-w-xs leading-relaxed">
            {selectedCategory !== "Tümü"
              ? `"${selectedCategory}" kategorisinde şu an aktif ürünümüz bulunmuyor. Diğer kategorilere göz atmak ister misiniz?`
              : "Akışınız için henüz listelenebilecek bir ürün bulunamadı."}
          </p>
        </div>
      ) : (
        /* Expanded Fluid Product Matrix Grid */
        <div className="space-y-12">
          {/* Büyük masaüstü ekranlarında 6 ürün yan yana gelecek şekilde layout genişletildi */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>

          {/* Dynamic Load More Trigger */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={onLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-12 py-3.5 text-xs font-semibold text-white uppercase tracking-wider shadow-md shadow-slate-900/10 transition-all duration-300 hover:bg-[#ff5000] hover:shadow-lg disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none cursor-pointer active:scale-95"
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Ürünler Getiriliyor...</span>
                  </>
                ) : (
                  <span>Daha Fazla Keşfet</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}