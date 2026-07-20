"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Star, ShoppingCart, Check, Heart } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useFavoriteStore } from "@/stores/favoriteStore";
import { useUiStore } from "@/stores/uiStore";

export interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice: number;
  imageUrl?: string;
  brand?: string;
  barcode?: string;
  category?: string;
  rating: number;
  reviewCount: number;
  stock: number;
  condition?: string;    // SIFIR, AZ_KULLANILMIS, IKINCI_EL
  listingType?: string;  // KURUMSAL, BIREYSEL
}

const CONDITION_LABEL: Record<string, string> = {
  AZ_KULLANILMIS: "Az Kullanılmış",
  IKINCI_EL: "İkinci El",
};

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const addToCart = useCartStore((s) => s.addItem);
  const token = useAuthStore((s) => s.token);
  const { productIds: favs, toggleFavorite } = useFavoriteStore();
  const setLoginModalOpen = useUiStore((s) => s.setLoginModalOpen);
  
  const [added, setAdded] = useState(false);
  const isFav = favs.includes(product._id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart(
      {
        _id: product._id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl || "",
        brand: product.brand || "",
        barcode: product.barcode || "",
        category: product.category,
      },
      token
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (token) {
      toggleFavorite(product._id, token);
    } else {
      setLoginModalOpen(true);
    }
  };

  const hasDiscount = product.originalPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const simulatedSoldCount = product.reviewCount > 0 ? `${product.reviewCount * 7}+ satıldı` : "Yeni Ürün";

  // Fiyatları kuruş hanesi her zaman 2 basamak olacak şekilde formatlayan güvenli yardımcı fonksiyon
  const formatPrice = (num: number) => {
    return num.toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Link
      href={`/product/${product._id}`}
      className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-100 transition-all duration-500 hover:shadow-[0_16px_40px_rgba(0,0,0,0.04)] active:scale-[0.985]"
    >
      {/* 1. Image Container (image_257257.jpg'deki kırpılma p-5 ve bg-white ile tamamen çözüldü) */}
      <div className="relative overflow-hidden bg-white aspect-square flex items-center justify-center p-5 select-none">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-contain transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-slate-200 select-none">📦</div>
        )}

        {/* Absolute Badge: Discount (Sol üst köşeye, ürünü asla kapatmayacak şekilde zarifleştirildi) */}
        {hasDiscount && (
          <div className="absolute left-3 top-3 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1 bg-red-500/95 backdrop-blur-md text-white font-black text-[9px] px-2.5 py-1 rounded-full shadow-sm tracking-widest uppercase">
              %{discountPct} İndirim
            </span>
          </div>
        )}

        {/* Absolute Action: Heart Icon */}
        <button
          onClick={handleFavoriteToggle}
          aria-label="Favorilere Ekle"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md border border-slate-100 shadow-sm text-slate-400 hover:text-red-500 transition-all duration-300 hover:scale-110 active:scale-90"
        >
          <Heart size={14} className={isFav ? "fill-red-500 text-red-500" : "transition-colors"} strokeWidth={2.5} />
        </button>

        {/* Absolute Action: Quick Add to Cart Button (Desktop Desktop Hover) */}
        <div className="absolute inset-x-0 bottom-3 px-3 z-10 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hidden md:block">
          <button
            onClick={handleAddToCart}
            className={`w-full py-2 rounded-xl font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2 shadow-sm border ${
              added
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : "bg-white/95 backdrop-blur-sm text-slate-700 border-slate-200 hover:border-[#ff5000] hover:text-[#ff5000] active:scale-[0.98]"
            }`}
          >
            {added ? (
              <>
                <Check size={14} strokeWidth={3} />
                <span>Eklendi</span>
              </>
            ) : (
              <>
                <ShoppingCart size={14} strokeWidth={2.5} />
                <span>Sepete Ekle</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Product Meta & Info */}
      <div className="flex flex-1 flex-col p-4 bg-white">
        {/* Brand Label + Durum rozeti */}
        <div className="mb-1 flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
            {product.brand || "biDunyam"}
          </span>
          {(product.listingType === "BIREYSEL" || (product.condition && product.condition !== "SIFIR")) && (
            <span className="shrink-0 rounded bg-violet-100 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-violet-700">
              {CONDITION_LABEL[product.condition || ""] || "Pazar"}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-xs font-medium text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors min-h-[36px]">
          {product.name}
        </h3>
        
        {/* Ratings */}
        <div className="flex items-center gap-1.5 mt-2">
          <div className="flex items-center bg-amber-500/10 px-1.5 py-0.5 rounded text-amber-600 gap-1 text-[10px] font-bold">
            <Star size={10} fill="currentColor" className="stroke-none" />
            <span>{product.rating ? product.rating.toFixed(1) : "4.6"}</span>
          </div>
          {product.reviewCount > 0 ? (
            <span className="text-[11px] font-medium text-slate-400">({product.reviewCount} değerlendirme)</span>
          ) : (
            <span className="text-[11px] font-medium text-emerald-600">Yeni</span>
          )}
        </div>

        {/* Pricing & Mobile Action (Kuruş format hatası toLocaleString konfigürasyonu ile çözüldü) */}
        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
          <div className="flex flex-col justify-end">
            {hasDiscount && (
              <span className="text-[11px] font-medium text-slate-400 line-through leading-none mb-1">
                {formatPrice(product.originalPrice)} TL
              </span>
            )}
            <span className="text-[14px] md:text-[15px] font-bold text-slate-900 tracking-tight leading-none">
              {formatPrice(product.price)} TL
            </span>
          </div>

          {/* Mobile Only Floating Action */}
          <button
            onClick={handleAddToCart}
            aria-label="Sepete Ekle"
            className={`flex h-9 w-9 md:hidden items-center justify-center rounded-xl border border-slate-100 transition-all duration-300 shadow-sm ${
              added
                ? "bg-emerald-500 border-emerald-500 text-white"
                : "bg-slate-50 text-slate-700 hover:bg-[#ff5000] hover:text-white hover:border-[#ff5000] active:scale-90"
            }`}
          >
            {added ? <Check size={14} strokeWidth={3} /> : <ShoppingCart size={14} strokeWidth={2.2} />}
          </button>
        </div>

        {/* Footer info area */}
        <div className="mt-3 flex items-center justify-between text-[10px] font-medium text-slate-400 select-none">
          {product.reviewCount > 0 ? (
            <span className="bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-100/40">{simulatedSoldCount}</span>
          ) : (
            <span className="text-slate-300">Stokta</span>
          )}
          <span className="flex items-center gap-1 text-emerald-600 font-semibold uppercase tracking-wider text-[9px]">
            <Check size={9} strokeWidth={3} /> Hızlı Gönderi
          </span>
        </div>
      </div>
    </Link>
  );
};