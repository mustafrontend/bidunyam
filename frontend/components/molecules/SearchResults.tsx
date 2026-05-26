"use client";

import React from "react";
import Link from "next/link";

interface SearchProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUrl: string;
  price: number;
}

interface SearchResultsProps {
  query?: string;
  results: SearchProduct[];
  categories?: string[];
  brands?: string[];
  recentSearches?: string[];
  recommended?: any[];
  onClose: () => void;
}

const POPULAR_SEARCHES = ["iphone 17", "erkek spor ayakkabı", "iphone 15", "iphone 16", "adidas", "şeffaf pvc hurç", "drone uçak", "iphone 17 pro max", "lego"];

export const SearchResults: React.FC<SearchResultsProps> = ({ 
  query = "", 
  results, 
  categories = [], 
  brands = [], 
  recentSearches = [],
  recommended = [],
  onClose 
}) => {
  if (!query.trim()) {
    return (
      <div className="absolute left-1/2 -translate-x-1/2 w-[95vw] md:w-[750px] top-full z-50 mt-2 overflow-hidden rounded-2xl border-[0.5px] border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 select-none flex">
        
        {/* Left Column: Recent and Popular Searches */}
        <div className="w-1/2 p-6 flex flex-col gap-6 max-h-[500px] overflow-y-auto">
          
          {/* Recent Searches */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-800">Geçmiş aramaların</h3>
              <button className="text-xs font-bold text-[#ff5000] hover:underline">Temizle</button>
            </div>
            <div className="space-y-1">
              {recentSearches.map((term, i) => (
                <Link 
                  key={`recent-${i}`} 
                  href={`/?search=${encodeURIComponent(term)}`} 
                  onClick={onClose}
                  className="flex items-center gap-3 px-2 py-2 hover:bg-slate-50 rounded-lg group transition-colors"
                >
                  <svg className="w-4 h-4 text-slate-400 group-hover:text-[#ff5000]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <span className="text-sm text-slate-700 font-medium">{term}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Popular Searches */}
          <div>
            <h3 className="text-sm font-black text-slate-800 mb-4">Popüler aramalar</h3>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map((term, i) => (
                <Link
                  key={`popular-${i}`}
                  href={`/?search=${encodeURIComponent(term)}`}
                  onClick={onClose}
                  className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-full hover:border-[#ff5000] hover:text-[#ff5000] transition-colors text-slate-600 bg-white text-xs font-medium"
                >
                  <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="w-[1px] bg-slate-100 my-6"></div>

        {/* Right Column: Recently Viewed Products */}
        <div className="w-1/2 p-6 max-h-[500px] overflow-y-auto">
          <h3 className="text-sm font-black text-slate-800 mb-4">Son gezdiğin ürünler</h3>
          <div className="flex flex-col gap-3">
            {/* Hardcoded placeholders for recently viewed if empty */}
            {(recommended.length > 0 ? recommended : [
              { id: "mock1", name: "Apple MacBook Air M4...", rating: 4.9, reviewCount: 201, price: 45875, imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=200&auto=format&fit=crop" },
              { id: "mock2", name: "Erkek Ön Cep Cüzdanı...", rating: 0, reviewCount: 0, price: 399, coupon: "Ek 30 TL Kupon", imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=200&auto=format&fit=crop" },
              { id: "mock3", name: "Trusador Valencia Hakiki Deri Cüzdan", rating: 0, reviewCount: 0, originalPrice: 1539, price: 1338.93, coupon: "Ek 30 TL Kupon", imageUrl: "https://images.unsplash.com/photo-1559564475-478a2f58be5b?q=80&w=200&auto=format&fit=crop", cartSpecial: true },
            ]).map((prod: any, idx) => (
              <div key={prod.id || `mock-${idx}`} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:shadow-md transition-shadow cursor-pointer bg-white group">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-lg overflow-hidden shrink-0 p-1 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="flex flex-col gap-1">
                    {prod.coupon && (
                      <span className="text-[9px] font-black text-[#ff5000] bg-orange-50 px-1.5 py-0.5 rounded self-start">
                        {prod.coupon}
                      </span>
                    )}
                    <p className="text-xs text-slate-800 line-clamp-1 group-hover:text-[#ff5000] transition-colors">{prod.name}</p>
                    {prod.rating > 0 && (
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className="text-[#ff5000]">★</span>
                        <span className="font-bold text-slate-700">{prod.rating}</span>
                        <span className="text-slate-400">({prod.reviewCount})</span>
                      </div>
                    )}
                    <div className="flex items-baseline gap-2 mt-0.5">
                      {prod.cartSpecial ? (
                        <div className="flex flex-col">
                          <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">Sepete özel</span>
                          <span className="text-sm font-black text-emerald-600">{prod.price.toLocaleString("tr-TR")} TL</span>
                        </div>
                      ) : (
                        <span className="text-sm font-black text-slate-900">{prod.price.toLocaleString("tr-TR")} TL</span>
                      )}
                    </div>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#ff5000] hover:border-[#ff5000] transition-all hover:bg-orange-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border-[0.5px] border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 select-none">
      {(results.length > 0 || categories.length > 0 || brands.length > 0) ? (
        <div className="py-2 max-h-[400px] overflow-y-auto divide-y divide-slate-100">
          
          {/* Categories Section */}
          {categories.length > 0 && (
            <div className="pb-2">
              <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50">
                Kategoriler
              </div>
              {categories.map((cat, idx) => (
                <Link
                  key={`cat-${idx}`}
                  href={`/?category=${encodeURIComponent(cat)}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50 text-xs font-bold text-slate-700"
                >
                  <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">📁</span>
                  {cat}
                </Link>
              ))}
            </div>
          )}

          {/* Brands Section */}
          {brands.length > 0 && (
            <div className="pb-2">
              <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50">
                Markalar
              </div>
              {brands.map((brand, idx) => (
                <Link
                  key={`brand-${idx}`}
                  href={`/?brand=${encodeURIComponent(brand)}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50 text-xs font-bold text-slate-700"
                >
                  <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">🏷️</span>
                  {brand}
                </Link>
              ))}
            </div>
          )}

          {/* Products Section */}
          {results.length > 0 && (
            <div>
              <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50">
                Ürünler
              </div>
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50"
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      className="h-10 w-10 rounded-xl bg-slate-100 object-cover shrink-0"
                      alt=""
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg shrink-0">
                      📦
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-1 text-xs font-black text-slate-800 tracking-tight">{product.name}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                      {product.brand} • {product.category}
                    </p>
                  </div>
                  <div className="text-xs font-black text-[#ff5000] shrink-0 pl-2">
                    {product.price.toLocaleString("tr-TR")} TL
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-xs font-bold text-slate-400 leading-none">
          Aradığınız kelimeye uygun sonuç bulunamadı.
        </div>
      )}
    </div>
  );
};
