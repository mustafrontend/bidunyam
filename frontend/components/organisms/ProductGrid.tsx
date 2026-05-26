"use client";

import React from "react";
import { ProductCard } from "../molecules/ProductCard";

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  saleStatus: string;
}

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  total: number;
  searchQuery?: string;
  categoryQuery?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, loading, total, searchQuery, categoryQuery }) => {
  // Arama veya kategori başlığı
  const title = searchQuery
    ? `"${searchQuery}" için sonuçlar`
    : categoryQuery
    ? `${categoryQuery} Ürünleri`
    : "Tüm Ürünler";

  if (loading) {
    return (
      <div className="w-full">
        <h1 className="text-xl font-bold text-slate-800 mb-6">{title}</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden h-[360px]">
              <div className="w-full h-56 bg-slate-200" />
              <div className="p-4 flex flex-col gap-3">
                <div className="w-3/4 h-4 bg-slate-200 rounded" />
                <div className="w-1/2 h-4 bg-slate-200 rounded" />
                <div className="w-full h-8 bg-slate-200 rounded mt-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 px-4 text-center bg-white border border-slate-200 rounded-xl">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">🛒</span>
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Aradığınız kriterlere uygun ürün bulunamadı.</h2>
        <p className="text-slate-500 max-w-md">Lütfen farklı filtreler deneyin veya aramanızı genişletin.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{total} ürün listeleniyor</p>
        </div>
        
        {/* Opsiyonel Sıralama (UI Only for now) */}
        <select className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-orange-500 transition-colors cursor-pointer shadow-sm">
          <option value="recommended">Önerilen Sıralama</option>
          <option value="price_asc">En Düşük Fiyat</option>
          <option value="price_desc">En Yüksek Fiyat</option>
          <option value="newest">En Yeniler</option>
          <option value="bestseller">En Çok Satanlar</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product as any} />
        ))}
      </div>
    </div>
  );
};
