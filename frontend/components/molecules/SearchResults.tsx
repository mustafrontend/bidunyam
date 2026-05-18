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
  results: SearchProduct[];
  onClose: () => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ results, onClose }) => {
  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border-[0.5px] border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 select-none">
      {results.length > 0 ? (
        <div className="py-2 max-h-[360px] overflow-y-auto divide-y divide-slate-100">
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
      ) : (
        <div className="p-8 text-center text-xs font-bold text-slate-400 leading-none">
          Aradığınız ürün bulunamadı.
        </div>
      )}
    </div>
  );
};
