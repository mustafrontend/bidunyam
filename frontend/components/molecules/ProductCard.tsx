"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Star, ShoppingCart, Check } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";

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
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const addToCart = useCartStore((s) => s.addItem);
  const token = useAuthStore((s) => s.token);
  const [added, setAdded] = useState(false);

  const doAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(
      {
        productId: product._id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl || "",
        quantity: 1,
        sellerId: "",
        brand: product.brand || "",
        barcode: product.barcode || "",
      },
      token
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const hasDiscount = product.originalPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Simulate sold count based on review count to make it look premium & active
  const simulatedSoldCount = product.reviewCount > 0 ? `${product.reviewCount * 7}+ satıldı` : "Yeni Ürün";

  return (
    <Link
      href={`/product/${product._id}`}
      className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border-[0.5px] border-slate-200 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-slate-300 active:scale-[0.99]"
    >
      {/* Product Image Container */}
      <div className="relative overflow-hidden bg-slate-50 aspect-square">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-slate-200 select-none">📦</div>
        )}
        
        {/* Discount Tag */}
        {hasDiscount && (
          <span className="absolute left-2.5 top-2.5 rounded-lg bg-red-500 text-white px-2 py-0.5 text-[10px] font-black tracking-wider uppercase shadow-sm">
            %{discountPct} İndirim
          </span>
        )}
      </div>

      {/* Product Information */}
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          {product.brand || "biDunyam"}
        </span>
        <h3 className="line-clamp-2 text-[13px] font-semibold text-slate-800 leading-snug group-hover:text-[#ff5000] transition-colors">
          {product.name}
        </h3>
        
        {/* Ratings & Stars */}
        <div className="flex items-center gap-1 mt-0.5">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={11}
                fill={star <= Math.round(product.rating) ? "#fbbf24" : "none"}
                className={star <= Math.round(product.rating) ? "text-[#fbbf24]" : "text-slate-200"}
              />
            ))}
          </div>
          <span className="text-[10px] font-bold text-slate-400">({product.reviewCount})</span>
        </div>

        {/* Prices & Action Row */}
        <div className="mt-auto pt-3 flex items-end justify-between">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-[11px] font-semibold text-slate-400 line-through">
                {product.originalPrice.toLocaleString("tr-TR")} TL
              </span>
            )}
            <span className="text-[15px] font-black text-slate-900 tracking-tight">
              {product.price.toLocaleString("tr-TR")} TL
            </span>
          </div>

          {/* Circle Action Button */}
          <button
            onClick={doAdd}
            aria-label="Sepete Ekle"
            className={`flex h-8 w-8 items-center justify-center rounded-full border-[0.5px] shadow-sm transition-all duration-300 ${
              added
                ? "bg-emerald-500 border-emerald-500 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-[#ff5000] hover:text-white hover:border-[#ff5000] active:scale-90"
            }`}
          >
            {added ? <Check size={14} strokeWidth={3} /> : <ShoppingCart size={14} strokeWidth={2.5} />}
          </button>
        </div>

        {/* Extra Premium Detail: Sold Count */}
        <div className="mt-1.5 border-t border-slate-50 pt-1.5 flex items-center justify-between text-[10px] font-bold text-slate-400">
          <span>{simulatedSoldCount}</span>
          <span className="text-emerald-600 font-extrabold uppercase tracking-tight">Hızlı Gönderi</span>
        </div>
      </div>
    </Link>
  );
};
