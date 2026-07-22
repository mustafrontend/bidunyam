"use client";

import Link from "next/link";
import { Search, Store as StoreIcon, PackageOpen, ShieldCheck } from "lucide-react";
import { productPath } from "@/lib/productUrl";
import { CONDITION_LABEL, discountOf, tl, withAlpha, type StorefrontProps } from "./types";
import { EmptyState, StoreFooter } from "./AuroraStorefront";

/**
 * ATELIER — editoryal, serif başlıklar, ince çizgiler, sol kategori sütunu.
 * Takı, sanat, tasarım ve butik ürünler için sakin ve "pahalı" duran şablon.
 */
export function AtelierStorefront({
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
    <div className="min-h-screen bg-[#faf9f7] text-[#1c1917]">
      {/* İnce üst şerit */}
      <div className="border-b border-[#e7e2da] bg-[#f4f1ec]">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 md:px-6">
          <ShieldCheck size={12} style={{ color: accent }} />
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#78716c]">
            biDünyam onaylı mağaza · 14 gün iade hakkı
          </p>
        </div>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-[#e7e2da] bg-[#faf9f7]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-5 px-4 py-4 md:px-6">
          <Link href="#" className="flex items-center gap-3 shrink-0">
            <div
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-white"
              style={{ background: accent }}
            >
              {store.storeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.storeLogo} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <StoreIcon size={17} />
              )}
            </div>
            <span
              className="text-lg tracking-tight"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700 }}
            >
              {displayName}
            </span>
          </Link>

          <div className="relative ml-auto w-full max-w-[260px]">
            <Search className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#a8a29e]" />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Koleksiyonda ara"
              className="w-full border-b border-[#d6d3d1] bg-transparent py-2 pl-6 text-xs font-medium tracking-wide outline-none transition-colors placeholder:text-[#a8a29e] focus:border-[#1c1917]"
            />
          </div>
        </div>
      </header>

      {/* Hero — bölünmüş düzen */}
      <section className="border-b border-[#e7e2da]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:px-6 md:py-20">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#a8a29e]">Koleksiyon</p>
            <h1
              className="mt-4 text-4xl leading-[1.08] tracking-tight md:text-[56px]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700 }}
            >
              {displayName}
            </h1>
            <div className="mt-5 h-px w-20" style={{ background: accent }} />
            {store.storeBio && (
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#57534e]">{store.storeBio}</p>
            )}
            <a
              href="#urunler"
              className="mt-8 inline-block border-b-2 pb-1 text-xs font-black uppercase tracking-[0.16em] transition-opacity hover:opacity-60"
              style={{ borderColor: accent, color: "#1c1917" }}
            >
              Tümünü Gör ({totalProducts})
            </a>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden bg-[#f4f1ec]">
            {store.storeBanner ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.storeBanner} alt="" className="h-full w-full object-cover" />
            ) : products[0]?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={products[0].imageUrl} alt="" className="h-full w-full object-contain p-10" />
            ) : (
              <div
                className="h-full w-full"
                style={{
                  background: `linear-gradient(135deg, ${withAlpha(accent, 0.18)}, transparent 70%)`,
                }}
              />
            )}
          </div>
        </div>
      </section>

      {/* İçerik: sol kategori sütunu + ürün ızgarası */}
      <main id="urunler" className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-[190px_1fr]">
          <aside className="md:sticky md:top-24 md:self-start">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#a8a29e]">Kategoriler</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 md:flex-col md:gap-2">
              {categories.map((c) => {
                const active = activeCategory === c;
                return (
                  <button
                    key={c}
                    onClick={() => onCategoryChange(c)}
                    className="text-left text-[13px] transition-colors"
                    style={{
                      color: active ? "#1c1917" : "#78716c",
                      fontWeight: active ? 700 : 500,
                      textDecoration: active ? "underline" : "none",
                      textUnderlineOffset: "5px",
                      textDecorationColor: accent,
                      textDecorationThickness: "2px",
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </aside>

          <div>
            {products.length === 0 ? (
              <EmptyState accent={accent} />
            ) : (
              <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3">
                {products.map((p) => {
                  const disc = discountOf(p);
                  return (
                    <Link key={p.id} href={productPath(p)} className="group block">
                      <div className="relative aspect-[3/4] overflow-hidden bg-[#f4f1ec]">
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="h-full w-full object-contain p-6 transition-transform duration-700 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <PackageOpen className="m-auto text-[#d6d3d1]" />
                        )}
                        {p.condition && p.condition !== "SIFIR" && (
                          <span className="absolute left-0 top-4 bg-[#1c1917] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white">
                            {CONDITION_LABEL[p.condition]}
                          </span>
                        )}
                      </div>
                      <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a8a29e]">
                        {p.brandName || displayName}
                      </p>
                      <h3 className="mt-1.5 line-clamp-2 text-[13px] font-semibold leading-snug text-[#1c1917]">
                        {p.name}
                      </h3>
                      <p className="mt-2 text-[13px]">
                        {disc > 0 && (
                          <span className="mr-2 text-[11px] text-[#a8a29e] line-through">{tl(p.originalPrice)}</span>
                        )}
                        <span className="font-bold" style={{ color: disc > 0 ? accent : "#1c1917" }}>
                          {tl(p.price)}
                        </span>
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <StoreFooter store={store} accent={accent} displayName={displayName} />
    </div>
  );
}
