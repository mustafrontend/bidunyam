"use client";

import Link from "next/link";
import { Search, Store as StoreIcon, PackageOpen, Zap, ShieldCheck, Truck } from "lucide-react";
import { productPath } from "@/lib/productUrl";
import { CONDITION_LABEL, discountOf, tl, withAlpha, type StorefrontProps } from "./types";

/**
 * PULSE — koyu zemin, yüksek kontrast, iri tipografi ve neon vurgular.
 * Sneaker, teknoloji, streetwear ve genç kitleye satış yapan mağazalar için.
 */
export function PulseStorefront({
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
    <div className="min-h-screen bg-[#08080c] text-white">
      {/* Kayan duyuru şeridi */}
      <div className="overflow-hidden border-b border-white/10 py-2" style={{ background: accent }}>
        <div className="flex whitespace-nowrap text-[10px] font-black uppercase tracking-[0.25em] text-white/90">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="px-6">
              ⚡ biDünyam onaylı mağaza · hızlı kargo · 14 gün iade
            </span>
          ))}
        </div>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#08080c]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3.5 md:px-6">
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg text-black"
              style={{ background: accent }}
            >
              {store.storeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.storeLogo} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <StoreIcon size={17} />
              )}
            </div>
            <span className="text-base font-black uppercase tracking-tight">{displayName}</span>
          </div>

          <nav className="ml-3 hidden flex-1 items-center gap-1 lg:flex">
            {categories.slice(0, 6).map((c) => (
              <button
                key={c}
                onClick={() => onCategoryChange(c)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-wide transition-colors ${
                  activeCategory === c ? "text-black" : "text-white/50 hover:text-white"
                }`}
                style={activeCategory === c ? { background: accent } : undefined}
              >
                {c}
              </button>
            ))}
          </nav>

          <div className="relative ml-auto w-full max-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="ARA..."
              className="w-full rounded-lg border border-white/15 bg-white/5 py-2 pl-9 pr-3 text-xs font-bold uppercase tracking-wide text-white outline-none transition placeholder:text-white/30 focus:border-white/40"
            />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(700px 420px at 78% 10%, ${withAlpha(accent, 0.5)}, transparent 62%),
                         radial-gradient(560px 340px at 8% 90%, ${withAlpha(accent, 0.22)}, transparent 60%)`,
          }}
        />
        {store.storeBanner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.storeBanner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        )}
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black"
            style={{ background: accent }}
          >
            <Zap size={11} /> Yeni sezon
          </span>
          <h1 className="mt-5 max-w-3xl text-5xl font-black uppercase leading-[0.92] tracking-tighter md:text-7xl">
            {displayName}
          </h1>
          {store.storeBio && (
            <p className="mt-5 max-w-lg text-sm font-semibold leading-relaxed text-white/60">{store.storeBio}</p>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#urunler"
              className="rounded-lg px-7 py-3.5 text-xs font-black uppercase tracking-widest text-black transition-transform hover:-translate-y-0.5"
              style={{ background: accent }}
            >
              Koleksiyonu Gör
            </a>
            <span className="rounded-lg border border-white/15 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-white/50">
              {totalProducts} ürün
            </span>
          </div>

          <div className="mt-12 flex flex-wrap gap-6">
            {[
              { Icon: Truck, t: "1-3 gün kargo" },
              { Icon: ShieldCheck, t: "Güvenli ödeme" },
              { Icon: Zap, t: "Anında stok" },
            ].map(({ Icon, t }) => (
              <div key={t} className="flex items-center gap-2">
                <Icon size={14} style={{ color: accent }} />
                <span className="text-[11px] font-black uppercase tracking-wider text-white/60">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kategori şeridi */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 md:px-6">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => onCategoryChange(c)}
              className={`shrink-0 rounded-lg border px-4 py-2 text-[11px] font-black uppercase tracking-wide transition-all ${
                activeCategory === c ? "text-black" : "border-white/15 text-white/50 hover:text-white"
              }`}
              style={activeCategory === c ? { background: accent, borderColor: accent } : undefined}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Ürünler */}
      <main id="urunler" className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 py-20 text-center">
            <PackageOpen size={34} className="mx-auto mb-3 text-white/25" />
            <p className="font-black uppercase tracking-wide text-white/70">Ürün bulunamadı</p>
            <p className="mt-1 text-xs font-semibold text-white/35">Başka bir kategori veya arama deneyin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => {
              const disc = discountOf(p);
              return (
                <Link
                  key={p.id}
                  href={productPath(p)}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] transition-all duration-300 hover:border-white/25 hover:bg-white/[0.07]"
                >
                  <div className="relative aspect-square overflow-hidden bg-white p-3">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <PackageOpen className="m-auto text-slate-300" />
                    )}
                    {disc > 0 && (
                      <span
                        className="absolute left-0 top-3 px-2 py-0.5 text-[10px] font-black text-black"
                        style={{ background: accent }}
                      >
                        -%{disc}
                      </span>
                    )}
                    {p.condition && p.condition !== "SIFIR" && (
                      <span className="absolute right-2 top-2 rounded bg-black/85 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white">
                        {CONDITION_LABEL[p.condition]}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3.5">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/35">
                      {p.brandName || displayName}
                    </span>
                    <h3 className="mt-1 line-clamp-2 text-[12px] font-bold leading-snug text-white/90">{p.name}</h3>
                    <div className="mt-auto flex items-baseline gap-2 pt-3">
                      <span className="text-[15px] font-black" style={{ color: accent }}>
                        {tl(p.price)}
                      </span>
                      {disc > 0 && (
                        <span className="text-[10px] font-bold text-white/30 line-through">{tl(p.originalPrice)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center md:px-6">
          <p className="text-sm font-black uppercase tracking-wide" style={{ color: accent }}>
            {displayName}
          </p>
          <p className="text-[11px] font-bold text-white/35">bidunyam.com/magaza/{store.storeSlug}</p>
          <p className="text-[11px] font-bold text-white/35">
            <Link href="/" className="text-white/70 hover:underline">
              biDünyam
            </Link>{" "}
            güvencesiyle · Güvenli ödeme, 14 gün iade hakkı
          </p>
        </div>
      </footer>
    </div>
  );
}
