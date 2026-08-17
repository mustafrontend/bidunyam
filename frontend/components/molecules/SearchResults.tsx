"use client";

import React from "react";
import Link from "next/link";
import { useSearchSessionStore } from "@/stores/searchSessionStore";
import { useRecentlyViewedStore } from '@/stores/recentlyViewedStore';
import { productPath } from "@/lib/productUrl";

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
  subCategories?: string[];
  brands?: string[];
  recommended?: any[];
  onClose: () => void;
}

const POPULAR_SEARCHES = ["iphone 17", "erkek spor ayakkabı", "iphone 15", "iphone 16", "adidas", "şeffaf pvc hurç", "drone uçak", "iphone 17 pro max", "lego"];

export const SearchResults: React.FC<SearchResultsProps> = ({ 
  query = "", 
  results, 
  categories = [], 
  subCategories = [],
  brands = [], 
  recommended = [],
  onClose 
}) => {
  const { setSearchSession, lastSearchedCategory, recentSearches, clearRecentSearches } = useSearchSessionStore();
  const { products: recentlyViewed, clearAll: clearRecentlyViewed } = useRecentlyViewedStore();

  if (!query.trim()) {
    return (
      <div className="absolute left-1/2 -translate-x-1/2 w-[95vw] md:w-[750px] top-full z-50 mt-2 overflow-hidden rounded-2xl border-[0.5px] border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 select-none flex">
        
        {/* Left Column: Recent and Popular Searches */}
        <div className="w-1/2 p-6 flex flex-col gap-6 max-h-[500px] overflow-y-auto">
          
          {/* Recent Searches */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-800">Geçmiş aramaların</h3>
              {recentSearches.length > 0 && (
                <button onClick={clearRecentSearches} className="text-xs font-bold text-[#ff5000] hover:underline">Temizle</button>
              )}
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-800">Son gezdiğin ürünler</h3>
            {recentlyViewed.length > 0 && (
              <button onClick={clearRecentlyViewed} className="text-xs font-bold text-[#ff5000] hover:underline">Temizle</button>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {recentlyViewed.length > 0 ? recentlyViewed.map((prod, idx) => (
              <Link href={productPath(prod)} key={prod.id || `rv-${idx}`} onClick={onClose}>
                <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:shadow-md transition-shadow cursor-pointer bg-white group">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-lg overflow-hidden shrink-0 p-1 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-slate-800 line-clamp-1 group-hover:text-[#ff5000] transition-colors">{prod.name}</p>
                      {prod.rating > 0 && (
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="text-[#ff5000]">★</span>
                          <span className="font-bold text-slate-700">{prod.rating}</span>
                          <span className="text-slate-400">({prod.reviewCount})</span>
                        </div>
                      )}
                      <div className="flex items-baseline gap-2 mt-0.5">
                        {prod.originalPrice && prod.originalPrice > prod.price ? (
                          <>
                            <span className="text-sm font-black text-slate-900">{prod.price.toLocaleString("tr-TR")} TL</span>
                            <span className="text-[10px] text-slate-400 line-through">{prod.originalPrice.toLocaleString("tr-TR")} TL</span>
                          </>
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
              </Link>
            )) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                </div>
                <p className="text-sm font-bold text-slate-500">Henüz ürün gezmediniz</p>
                <p className="text-xs text-slate-400 mt-1">Gezdiğiniz ürünler burada görünecek</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const displayCategories = Array.from(
    new Set([
      ...(categories || []),
      ...results.map((r) => r.category).filter(Boolean),
    ])
  );

  const displayBrands = Array.from(
    new Set([
      ...(brands || []),
      ...results.map((r) => r.brand).filter(Boolean),
    ])
  );

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border-[0.5px] border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 select-none">
      {(results.length > 0 || displayCategories.length > 0 || subCategories.length > 0 || displayBrands.length > 0) ? (
        <div className="py-2 max-h-[400px] overflow-y-auto divide-y divide-slate-100">
          
          {/* Categories Section */}
          {displayCategories.length > 0 && (
            <div className="pb-2">
              <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50">
                Kategoriler
              </div>
              {displayCategories.map((cat, idx) => (
                <Link
                  key={`cat-${idx}`}
                  href={`/arama?kategori=${encodeURIComponent(cat)}`}
                  onClick={() => {
                    setSearchSession(cat, null);
                    onClose();
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50 text-xs font-bold text-slate-700"
                >
                  <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">📂</span>
                  <span className="flex-1">{cat}</span>
                  <span className="text-[10px] text-slate-400">Kategorisinde Ara</span>
                </Link>
              ))}
            </div>
          )}

          {/* SubCategories Section */}
          {subCategories.length > 0 && (
            <div className="pb-2">
              <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50">
                Alt Kategoriler
              </div>
              {subCategories.map((sub, idx) => (
                <Link
                  key={`subcat-${idx}`}
                  href={`/arama?altkategori=${encodeURIComponent(sub)}`}
                  onClick={() => {
                    setSearchSession(null, sub);
                    onClose();
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50 text-xs font-bold text-slate-700 pl-8 relative"
                >
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 w-3 h-[1px] bg-slate-200"></div>
                  <div className="absolute left-5 top-0 h-1/2 w-[1px] bg-slate-200"></div>
                  <span className="flex-1">{sub}</span>
                  <span className="text-[10px] text-slate-400">İçinde Ara</span>
                </Link>
              ))}
            </div>
          )}

          {/* Brands Section */}
          {displayBrands.length > 0 && (
            <div className="pb-2">
              <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50">
                Markalar
              </div>
              {displayBrands.map((brand, idx) => (
                <Link
                  key={`brand-${idx}`}
                  href={`/arama?brand=${encodeURIComponent(brand)}`}
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
                  href={productPath(product)}
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
