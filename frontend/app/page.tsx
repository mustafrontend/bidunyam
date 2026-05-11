"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useFavoriteStore } from "@/stores/favoriteStore";
import { useUiStore } from "@/stores/uiStore";

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  imageUrl: string;
  brand: string;
  category: string;
  rating: number;
  reviewCount: number;
  stock?: number;
}

function normalizeProducts(data: Product[]): Product[] {
  if (!Array.isArray(data) || !data.length) return [];
  return data.map((item, i) => ({
    _id: item._id || `p-${i}`,
    name: item.name || "Ürün",
    price: item.price || 0,
    originalPrice: item.originalPrice || item.price || 0,
    discountPercent: item.discountPercent || 0,
    imageUrl: item.imageUrl || "",
    brand: item.brand || "Marka",
    category: item.category || "Genel",
    rating: item.rating || 4.0,
    reviewCount: item.reviewCount || 0,
    stock: item.stock ?? 99,
  }));
}

/* ─── Star Rating ───────────────────────────────────────────── */
function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`h-3 w-3 ${s <= full ? "text-amber-400" : "text-slate-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

/* ─── Product Card ──────────────────────────────────────────── */
function ProductCard({ product, badge }: { product: Product; badge?: "hot" | "new" | "sale" }) {
  const addToCart = useCartStore((s) => s.addItem);
  const token = useAuthStore((s) => s.token);
  const toggleFavoriteInStore = useFavoriteStore((s) => s.toggleFavorite);
  const isFavorite = useFavoriteStore((s) => s.isFavorite(product._id));
  const setLoginModalOpen = useUiStore((s) => s.setLoginModalOpen);
  const [added, setAdded] = useState(false);

  const doAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ productId: product._id, name: product.name, price: product.price, imageUrl: product.imageUrl, quantity: 1, sellerId: "" }, token);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) {
      setLoginModalOpen(true);
      return;
    }

    await toggleFavoriteInStore(product._id, token);
  };

  const hasDiscount = product.originalPrice > product.price;
  const pct = hasDiscount ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
  const saved = product.originalPrice - product.price;
  const lowStock = (product.stock ?? 99) < 10;

  return (
    <Link href={`/product/${product._id}`} className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-100 transition-all duration-200 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100">
      {/* Image */}
      <div className="relative overflow-hidden bg-slate-50" style={{ aspectRatio: "1/1" }}>
        {product.imageUrl
          ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          : <div className="flex h-full w-full items-center justify-center text-4xl text-slate-200">📦</div>
        }

        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {pct >= 20 && <span className="rounded-lg bg-brand-orange px-2 py-0.5 text-[11px] font-bold text-white">%{pct} İNDİRİM</span>}
          {badge === "hot" && <span className="rounded-lg bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white">🔥 ÇOK SATAN</span>}
          {badge === "new" && <span className="rounded-lg bg-emerald-500 px-2 py-0.5 text-[11px] font-bold text-white">✦ YENİ</span>}
          {lowStock && <span className="rounded-lg bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">⚡ Son {product.stock} adet</span>}
        </div>

        <button
          onClick={toggleFavorite}
          aria-label="Favoriye ekle"
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 shadow-sm transition-colors hover:text-rose-500"
        >
          <svg className={`h-4 w-4 ${isFavorite ? "fill-rose-500 text-rose-500" : "fill-none"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12.001 20.729l-.321-.294C6.4 15.6 3 12.5 3 8.7 3 5.72 5.42 3.3 8.4 3.3c1.73 0 3.39.81 4.45 2.09A6.03 6.03 0 0117.3 3.3C20.28 3.3 22.7 5.72 22.7 8.7c0 3.8-3.4 6.9-8.68 11.74l-.319.289z" />
          </svg>
        </button>

        {/* Hover overlay CTA */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-200 group-hover:translate-y-0">
          <button
            onClick={doAdd}
            className={`w-full py-3 text-sm font-bold transition-colors ${added ? "bg-emerald-500 text-white" : "bg-slate-900 text-white hover:bg-brand-orange"}`}
          >
            {added ? "✓ Sepete Eklendi" : "Sepete Ekle"}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3.5">
        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{product.brand}</p>
        <p className="mb-2 line-clamp-2 flex-1 text-[13px] font-medium leading-snug text-slate-800">{product.name}</p>

        {product.reviewCount > 0 && (
          <div className="mb-2.5 flex items-center gap-1.5">
            <Stars rating={product.rating} />
            <span className="text-[11px] text-slate-400">{product.rating.toFixed(1)} ({product.reviewCount})</span>
          </div>
        )}

        <div className="flex items-end justify-between gap-1">
          <div>
            {hasDiscount && <p className="text-xs text-slate-400 line-through">{product.originalPrice.toLocaleString("tr-TR")} TL</p>}
            <p className="text-base font-bold text-slate-900">{product.price.toLocaleString("tr-TR")} <span className="text-sm font-semibold text-slate-500">TL</span></p>
          </div>
          {hasDiscount && saved >= 10 && (
            <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
              {saved.toLocaleString("tr-TR")} TL tasarruf
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-2.5 py-2">
          <div className="min-w-0 pr-2">
            <p className="text-[10px] font-bold text-emerald-600">Sepete özel</p>
            <div className="flex items-center gap-2">
              {hasDiscount && <span className="text-xs font-semibold text-slate-400 line-through">{product.originalPrice.toLocaleString("tr-TR")} TL</span>}
              <span className="text-[28px] leading-none font-extrabold tracking-tight text-emerald-600">{product.price.toLocaleString("tr-TR")}</span>
              <span className="text-sm font-bold text-emerald-700">TL</span>
            </div>
          </div>

          <button
            onClick={doAdd}
            aria-label="Sepete ekle"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${added ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-brand-orange hover:text-brand-orange"}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3c-.6.6-.2 1.7.7 1.7H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}

/* ─── Horizontal scroll shelf ──────────────────────────────── */
function Shelf({ title, label, products, badge }: { title: string; label?: string; products: Product[]; badge?: "hot" | "new" | "sale" }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  if (!products.length) return null;
  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl font-bold text-slate-900 md:text-2xl">{title}</h2>
          {label && <span className="rounded-full bg-brand-orange/10 px-3 py-0.5 text-xs font-bold text-brand-orange">{label}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll(-1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-slate-400 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => scroll(1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-slate-400 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      <div ref={ref} className="flex gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((p) => (
          <div key={p._id} className="w-52 shrink-0 md:w-56">
            <ProductCard product={p} badge={badge} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Skeleton ──────────────────────────────────────────────── */
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <div className="aspect-square animate-pulse bg-slate-100" />
          <div className="space-y-2.5 p-4">
            <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-slate-100" />
            <div className="h-3.5 animate-pulse rounded-full bg-slate-100" />
            <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-slate-100" />
            <div className="mt-3 h-5 w-1/2 animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Trust bar ─────────────────────────────────────────────── */
const PERKS = [
  { icon: "🚀", title: "Aynı Gün Kargo", desc: "14:00'a kadar siparişlerde" },
  { icon: "🛡️", title: "Güvenli Ödeme", desc: "256-bit SSL koruması" },
  { icon: "↩️", title: "30 Gün İade", desc: "Koşulsuz, ücretsiz" },
  { icon: "🎧", title: "7/24 Destek", desc: "Her zaman yanınızdayız" },
];

/* ─── Stats ─────────────────────────────────────────────────── */
const STATS = [
  { value: "500K+", label: "Mutlu müşteri" },
  { value: "50K+", label: "Ürün çeşidi" },
  { value: "4.8★", label: "Ortalama puan" },
  { value: "1 gün", label: "Ortalama teslimat" },
];

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Tümü");
  const filterRef = useRef<HTMLElement>(null);
  const token = useAuthStore((s) => s.token);
  const fetchFavorites = useFavoriteStore((s) => s.fetchFavorites);

  useEffect(() => {
    apiClient
      .get("/products?limit=100")
      .then((res) => setProducts(normalizeProducts(res?.data?.data?.products || [])))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (token) {
      fetchFavorites(token);
    }
  }, [token, fetchFavorites]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return ["Tümü", ...unique.slice(0, 14)];
  }, [products]);

  const filtered = useMemo(
    () => activeCategory === "Tümü" ? products : products.filter((p) => p.category === activeCategory),
    [products, activeCategory]
  );

  const deals = useMemo(
    () => [...products].filter((p) => p.originalPrice > p.price).sort((a, b) => (b.originalPrice - b.price) - (a.originalPrice - a.price)).slice(0, 16),
    [products]
  );

  const topRated = useMemo(
    () => [...products].sort((a, b) => b.rating - a.rating).slice(0, 16),
    [products]
  );

  const newArrivals = useMemo(() => [...products].reverse().slice(0, 16), [products]);

  const scrollToProducts = () => filterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
          <div className="grid gap-12 md:grid-cols-[1fr_auto] md:items-center">

            {/* Left */}
            <div className="max-w-xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-orange/20 bg-brand-orange/5 px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-orange animate-pulse" />
                <span className="text-xs font-semibold text-brand-orange">Yeni Sezon Ürünleri Geldi</span>
              </div>

              <h1 className="mb-5 text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                Alışverişin<br />
                <span className="text-brand-orange">en akıllı</span><br />
                adresi.
              </h1>

              <p className="mb-8 text-base leading-relaxed text-slate-500">
                Binlerce marka, milyonlarca ürün. Güvenli ödeme, hızlı teslimat, kolay iade.
              </p>

              <div className="flex flex-wrap gap-3">
                <button onClick={scrollToProducts} className="rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-orange hover:scale-[1.02] active:scale-100">
                  Keşfet →
                </button>
                <Link href="/cart" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  Sepetim
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-10 grid grid-cols-4 gap-4 border-t border-slate-100 pt-8">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <p className="text-xl font-bold text-slate-900 md:text-2xl">{s.value}</p>
                    <p className="text-xs text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — top 3 featured cards mini-preview */}
            {!loading && products.slice(0, 3).length > 0 && (
              <div className="hidden md:flex md:flex-col md:gap-3 md:w-72">
                {products.slice(0, 3).map((p, i) => (
                  <Link key={p._id} href={`/product/${p._id}`} className={`flex items-center gap-3 rounded-2xl border bg-white p-3 transition-shadow hover:shadow-md ${i === 0 ? "border-brand-orange/30 shadow-sm" : "border-slate-100"}`}>
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                      {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-800">{p.name}</p>
                      <p className="text-sm font-bold text-slate-900">{p.price.toLocaleString("tr-TR")} TL</p>
                    </div>
                    {i === 0 && <span className="shrink-0 rounded-full bg-brand-orange/10 px-2 py-0.5 text-[10px] font-bold text-brand-orange">#1</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────────────────── */}
      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {PERKS.map((perk, i) => (
              <div key={perk.title} className={`flex items-center gap-3.5 py-4 px-5 ${i < 3 ? "border-r border-slate-100" : ""} ${i >= 2 ? "border-t border-slate-100 md:border-t-0" : ""}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-lg">{perk.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{perk.title}</p>
                  <p className="text-xs text-slate-400">{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Content ──────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 pb-24 md:px-8">

        {/* Flash deals */}
        {!loading && deals.length > 0 && (
          <div className="mt-12 md:mt-16">
            <Shelf title="Fırsat Ürünleri" label="Sınırlı stok" products={deals} badge="sale" />
          </div>
        )}

        {/* Top rated */}
        {!loading && topRated.length > 0 && (
          <div className="mt-12 border-t border-slate-100 pt-12 md:mt-16 md:pt-16">
            <Shelf title="En Çok Beğenilenler" label="Müşteri favorisi" products={topRated} badge="hot" />
          </div>
        )}

        {/* New arrivals */}
        {!loading && newArrivals.length > 0 && (
          <div className="mt-12 border-t border-slate-100 pt-12 md:mt-16 md:pt-16">
            <Shelf title="Yeni Gelenler" label="Bu hafta eklendi" products={newArrivals} badge="new" />
          </div>
        )}

        {/* ── All products ─────────────────────────────────── */}
        <section ref={filterRef} id="products" className="mt-12 border-t border-slate-100 pt-12 md:mt-16 md:pt-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 md:text-2xl">Tüm Ürünler</h2>
              <p className="mt-1 text-sm text-slate-400">
                {loading ? "Yükleniyor..." : `${filtered.length} ürün`}
              </p>
            </div>
          </div>

          {/* Sticky category filter */}
          <div className="sticky top-16 z-30 mb-6 -mx-4 bg-slate-50 px-4 py-3 md:-mx-8 md:px-8">
            <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-150 ${
                    activeCategory === cat
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <SkeletonGrid />
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="mb-2 text-3xl">🔍</p>
              <p className="font-medium text-slate-400">Bu kategoride ürün bulunamadı.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filtered.map((p, i) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  badge={i < 3 ? "hot" : p.originalPrice > p.price ? "sale" : undefined}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Back to top ───────────────────────────────────────── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-all hover:bg-brand-orange hover:scale-110 active:scale-100"
        aria-label="Başa dön"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}

