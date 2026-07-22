"use client";

import Link from "next/link";
import { Search, ShieldCheck, Store as StoreIcon, PackageOpen, Star, Sparkles, Truck, RotateCcw } from "lucide-react";
import { productPath } from "@/lib/productUrl";
import {
  ALL_CATEGORIES,
  CONDITION_LABEL,
  discountOf,
  tl,
  withAlpha,
  type StorefrontProps,
} from "./types";

/**
 * AURORA — yumuşak degradeler, cam efektli sticky navbar, geniş hero.
 * Moda / butik / el yapımı satıcılar için sıcak ve davetkâr bir görünüm.
 */
export function AuroraStorefront({
  store,
  products,
  totalProducts,
  categories,
  activeCategory,
  onCategoryChange,
  query,
  onQueryChange,
  accent,
  displayName,
}: StorefrontProps) {
  return (
    <div className="min-h-screen bg-[#fbfaff] font-sans text-slate-900">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3.5 md:px-6">
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl text-white shadow-sm"
              style={{ background: accent }}
            >
              {store.storeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.storeLogo} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <StoreIcon size={17} />
              )}
            </div>
            <span className="text-base font-black tracking-tight">{displayName}</span>
          </div>

          <nav className="ml-2 hidden flex-1 items-center gap-1 lg:flex">
            {categories.slice(0, 6).map((c) => (
              <button
                key={c}
                onClick={() => onCategoryChange(c)}
                className="rounded-full px-3 py-1.5 text-xs font-bold transition-colors"
                style={
                  activeCategory === c
                    ? { background: withAlpha(accent, 0.12), color: accent }
                    : { color: "#64748b" }
                }
              >
                {c}
              </button>
            ))}
          </nav>

          <div className="relative ml-auto w-full max-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Ürün ara..."
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-semibold outline-none transition focus:border-transparent focus:ring-2"
              style={{ boxShadow: "none", ["--tw-ring-color" as string]: withAlpha(accent, 0.35) }}
            />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(1000px 380px at 12% -20%, ${withAlpha(accent, 0.28)}, transparent 65%),
                         radial-gradient(800px 340px at 92% 0%, ${withAlpha(accent, 0.16)}, transparent 60%)`,
          }}
        />
        {store.storeBanner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.storeBanner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        )}
        <div className="relative mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider"
            style={{ background: withAlpha(accent, 0.14), color: accent }}
          >
            <Sparkles size={11} /> biDünyam onaylı mağaza
          </span>
          <h1 className="mt-4 max-w-2xl text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
            {displayName}
          </h1>
          {store.storeBio && (
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">{store.storeBio}</p>
          )}
          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <a
              href="#urunler"
              className="rounded-full px-6 py-3 text-xs font-black text-white shadow-lg transition-transform hover:-translate-y-0.5"
              style={{ background: accent, boxShadow: `0 12px 30px -12px ${withAlpha(accent, 0.9)}` }}
            >
              Ürünleri Keşfet
            </a>
            <span className="rounded-full border border-slate-200 bg-white/70 px-4 py-2.5 text-[11px] font-bold text-slate-500">
              {totalProducts} ürün
            </span>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {[
              { Icon: Truck, t: "Hızlı Kargo", s: "1-3 iş günü" },
              { Icon: RotateCcw, t: "14 Gün İade", s: "Koşulsuz" },
              { Icon: ShieldCheck, t: "Güvenli Ödeme", s: "biDünyam güvencesi" },
            ].map(({ Icon, t, s }) => (
              <div key={t} className="rounded-2xl border border-white bg-white/70 px-4 py-3 backdrop-blur">
                <Icon size={15} style={{ color: accent }} />
                <p className="mt-1.5 text-[11px] font-black text-slate-800">{t}</p>
                <p className="text-[10px] font-semibold text-slate-400">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kategori şeridi */}
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => onCategoryChange(c)}
              className="shrink-0 rounded-full border px-4 py-2 text-xs font-black transition-all"
              style={
                activeCategory === c
                  ? { background: accent, borderColor: accent, color: "#fff" }
                  : { background: "#fff", borderColor: "#e2e8f0", color: "#475569" }
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Ürünler */}
      <main id="urunler" className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        {products.length === 0 ? (
          <EmptyState accent={accent} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => {
              const disc = discountOf(p);
              return (
                <Link
                  key={p.id}
                  href={productPath(p)}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-24px_rgba(15,23,42,0.35)]"
                >
                  <div className="relative aspect-square overflow-hidden bg-slate-50 p-4">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <PackageOpen className="m-auto text-slate-300" />
                    )}
                    {disc > 0 && (
                      <span
                        className="absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-black text-white"
                        style={{ background: accent }}
                      >
                        %{disc}
                      </span>
                    )}
                    {p.condition && p.condition !== "SIFIR" && (
                      <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-black text-slate-600">
                        {CONDITION_LABEL[p.condition]}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      {p.brandName || displayName}
                    </span>
                    <h3 className="mt-1 line-clamp-2 text-[13px] font-bold leading-snug text-slate-800">{p.name}</h3>
                    <div className="mt-2 flex items-center gap-1">
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                      <span className="text-[10px] font-bold text-slate-400">{(p.rating || 4.5).toFixed(1)}</span>
                    </div>
                    <div className="mt-auto pt-3">
                      {disc > 0 && (
                        <span className="mr-1.5 text-[10px] font-semibold text-slate-300 line-through">
                          {tl(p.originalPrice)}
                        </span>
                      )}
                      <span className="text-base font-black" style={{ color: accent }}>
                        {tl(p.price)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <StoreFooter store={store} accent={accent} displayName={displayName} />
    </div>
  );
}

export function EmptyState({ accent }: { accent: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 py-20 text-center">
      <PackageOpen size={34} className="mx-auto mb-3 text-slate-300" />
      <p className="font-black text-slate-700">Aramanıza uygun ürün bulunamadı</p>
      <p className="mt-1 text-xs font-semibold text-slate-400">
        Farklı bir kategori veya arama terimi deneyin.
      </p>
      <div className="mx-auto mt-4 h-1 w-16 rounded-full" style={{ background: accent }} />
    </div>
  );
}

export function StoreFooter({
  store,
  accent,
  displayName,
}: {
  store: { storeSlug: string };
  accent: string;
  displayName: string;
}) {
  return (
    <footer className="border-t border-slate-100 bg-white py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center md:px-6">
        <p className="text-sm font-black" style={{ color: accent }}>
          {displayName}
        </p>
        <p className="text-[11px] font-semibold text-slate-400">bidunyam.com/magaza/{store.storeSlug}</p>
        <p className="text-[11px] font-semibold text-slate-400">
          <Link href="/" className="font-black text-slate-600 hover:underline">
            biDünyam
          </Link>{" "}
          güvencesiyle · Güvenli ödeme, 14 gün iade hakkı
        </p>
      </div>
    </footer>
  );
}
