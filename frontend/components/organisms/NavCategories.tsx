"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Zap, CheckCircle2, Truck, Percent, Sparkles, Recycle } from "lucide-react";

const NavCategoriesInner: React.FC = () => {
  const searchParams = useSearchParams();
  const isOnayliActive = searchParams.get("onayli") === "true";
  const isFlasActive = searchParams.get("kampanya") === "flas";

  // Kategoriler "Kategoriler" mega menüsünde; burada yalnızca hızlı filtre kısayolları
  return (
    <nav className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-slate-100 pt-3 text-xs font-medium text-slate-500 select-none scroll-smooth snap-x">
      {/* Flaş Fırsatlar */}
      <Link
        href="/arama?kampanya=flas"
        className={`snap-start group relative flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shrink-0 shadow-sm ${
          isFlasActive ? "bg-[#ff5000] text-white shadow-[#ff5000]/30 scale-[1.02]" : "bg-slate-950 text-white hover:bg-[#ff5000]"
        }`}
      >
        <div className="relative flex h-2 w-2 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"></span>
        </div>
        <Zap size={14} className={`fill-current shrink-0 ${isFlasActive ? "text-white fill-white" : "text-amber-400 fill-amber-400"}`} />
        <span>Flaş Fırsatlar</span>
      </Link>

      {/* Pazar (İkinci El) */}
      <Link
        href="/pazar"
        className="snap-start group flex items-center gap-1.5 rounded-xl bg-[#ff5000] px-4 py-2 font-semibold text-white shadow-sm shrink-0 transition-all hover:bg-[#e64a00] hover:scale-[1.02] active:scale-[0.98]"
      >
        <Recycle size={14} className="shrink-0" />
        <span>Pazar</span>
      </Link>

      {/* Sadece Onaylılar */}
      <Link
        href="/arama?onayli=true"
        className={`snap-start group flex items-center gap-1.5 px-4 py-2 rounded-xl border transition-all duration-300 shrink-0 ${
          isOnayliActive ? "border-emerald-300 bg-emerald-50 text-emerald-700 font-semibold" : "border-transparent hover:border-slate-100 hover:bg-slate-50/80 text-slate-600 hover:text-slate-900 font-medium"
        }`}
      >
        <CheckCircle2 size={14} className={`shrink-0 ${isOnayliActive ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500"}`} />
        <span>Sadece Onaylılar</span>
      </Link>

      {/* İndirimliler */}
      <Link href="/arama?indirim=true" className="snap-start group flex items-center gap-1.5 px-4 py-2 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/80 text-slate-600 hover:text-slate-900 font-medium transition-all shrink-0">
        <Percent size={14} className="shrink-0 text-slate-400 group-hover:text-rose-500" />
        <span>İndirimdekiler</span>
      </Link>

      {/* Çok Satanlar */}
      <Link href="/arama?sirala=cokSatan" className="snap-start group flex items-center gap-1.5 px-4 py-2 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/80 text-slate-600 hover:text-slate-900 font-medium transition-all shrink-0">
        <Sparkles size={14} className="shrink-0 text-slate-400 group-hover:text-amber-500" />
        <span>Çok Satanlar</span>
      </Link>

      {/* Hızlı Teslimat */}
      <Link href="/arama?hizli=true" className="snap-start group flex items-center gap-1.5 px-4 py-2 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/80 text-slate-600 hover:text-slate-900 font-medium transition-all shrink-0">
        <Truck size={14} className="shrink-0 text-slate-400 group-hover:text-blue-500" />
        <span>Hızlı Teslimat</span>
      </Link>
    </nav>
  );
};

// useSearchParams must be wrapped in Suspense
export const NavCategories: React.FC = () => (
  <Suspense
    fallback={
      <nav className="mt-3.5 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-slate-100 pt-3 h-10" />
    }
  >
    <NavCategoriesInner />
  </Suspense>
);
