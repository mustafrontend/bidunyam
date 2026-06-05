"use client";

import { useEffect, useMemo, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Timer, Star, Sparkles, Percent, ShieldCheck, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api";
import { ProductCard, Product } from "@/components/molecules/ProductCard";
import { TrustBar } from "@/components/molecules/TrustBar";
import { Footer } from "@/components/organisms/Footer";
import { MobileBottomNav } from "@/components/molecules/MobileBottomNav";

import { FlashDealsGrid } from "@/components/organisms/FlashDealsGrid";
import { ProductFeed } from "@/components/organisms/ProductFeed";
import { ErrorBoundary } from "@/components/atoms/ErrorBoundary";
import { useUiStore } from "@/stores/uiStore";
import { CampaignGrid } from "@/components/organisms/CampaignGrid";
import { ProductCarouselSection } from "@/components/organisms/ProductCarouselSection";

const CATEGORIES = [
  "Tümü", "Elektronik", "Moda", "Ev & Yaşam", "Anne & Bebek",
  "Kozmetik", "Spor & Outdoor", "Kitap & Kırtasiye", "Oyuncak", "Süpermarket",
];
const PAGE_SIZE = 24;

function normalizeProducts(data: unknown[]): Product[] {
  if (!Array.isArray(data)) return [];
  return data.map((item: unknown, idx) => {
    const p = item as Record<string, unknown>;
    return {
      _id: (p.id || p._id || `product-${idx}-${Date.now()}`) as string,
      name: (p.name || "Ürün Açıklaması Yok") as string,
      price: Number(p.price) || 0,
      originalPrice: Number(p.originalPrice) || Number(p.price) || 0,
      imageUrl: (p.imageUrl || "") as string,
      brand: (p.brand || "biDunyam") as string,
      barcode: p.barcode ? String(p.barcode) : undefined,
      category: (p.category || "Genel") as string,
      rating: Number(p.rating) || 4.2,
      reviewCount: Number(p.reviewCount) || 0,
      stock: Number(p.stock) ?? 99,
      discountPercent: 0,
    };
  });
}

function mergeUnique(arrays: Product[][]): Product[] {
  const map = new Map<string, Product>();
  arrays.flat().forEach((item) => map.set(item._id, item));
  return Array.from(map.values());
}

function useCountdown(initial: { hours: number; minutes: number; seconds: number }) {
  const [time, setTime] = useState(initial);
  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => {
        let s = prev.seconds - 1, m = prev.minutes, h = prev.hours;
        if (s < 0) { s = 59; m -= 1; }
        if (m < 0) { m = 59; h -= 1; }
        if (h < 0) h = 23;
        return { hours: h, minutes: m, seconds: s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return time;
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const categoryQuery = searchParams.get("category") || "";
  const brandQuery = searchParams.get("brand") || "";

  const { isBrandMode, setIsBrandMode } = useUiStore();
  const userType = isBrandMode ? "kurumsal" : "bireysel";
  const setUserType = (type: "bireysel" | "kurumsal") => setIsBrandMode(type === "kurumsal");
  const timeLeft = useCountdown({ hours: 4, minutes: 22, seconds: 10 });

  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    
    const query = new URLSearchParams();
    query.set("limit", PAGE_SIZE.toString());
    query.set("page", "1");
    if (searchQuery) query.set("search", searchQuery);
    if (categoryQuery) query.set("category", categoryQuery);
    if (brandQuery) query.set("brand", brandQuery);

    const queryString = query.toString();
    console.log(`[Home] Fetching products with params: ${queryString}`);
    
    Promise.all([
      apiClient.get(`/products?${queryString}`),
      apiClient.get(`/products/xml/catalog?${queryString}&_t=${Date.now()}`).catch((err) => {
        console.error("[Home] XML Catalog Fetch failed in browser:", err);
        return null;
      }),
    ])
      .then(([dbRes, xmlRes]) => {
        console.log("[Home] DB response:", dbRes?.data);
        const xmlData = xmlRes?.data;
        console.log("[Home] XML raw response:", JSON.stringify(xmlData)?.substring(0, 300));
        const db = normalizeProducts(dbRes?.data?.data?.products || []);
        // Handle both nested (data.data.products) and flat (data.products) response shapes
        const xmlProducts = xmlData?.data?.products ?? xmlData?.products ?? [];
        console.log("[Home] XML products array length:", xmlProducts.length);
        const xml = normalizeProducts(xmlProducts);
        console.log("[Home] Normalized DB count:", db.length);
        console.log("[Home] Normalized XML count:", xml.length);
        const merged = mergeUnique([xml, db]);
        console.log("[Home] Merged unique products count:", merged.length);
        setProducts(merged);
        setHasMore(db.length === PAGE_SIZE || xml.length === PAGE_SIZE);
      })
      .catch((err) => {
        console.error("[Home] Home page product fetch catch error:", err);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [searchQuery, categoryQuery, brandQuery]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    console.log(`[Home] Loading page ${page + 1} from DB and XML Catalog...`);
    const query = new URLSearchParams();
    query.set("limit", PAGE_SIZE.toString());
    query.set("page", (page + 1).toString());
    if (searchQuery) query.set("search", searchQuery);
    if (categoryQuery) query.set("category", categoryQuery);
    if (brandQuery) query.set("brand", brandQuery);

    const queryString = query.toString();
    
    Promise.all([
      apiClient.get(`/products?${queryString}`),
      apiClient.get(`/products/xml/catalog?${queryString}&_t=${Date.now()}`).catch((err) => {
        console.error(`[Home] XML loadMore page ${page + 1} failed:`, err);
        return null;
      }),
    ])
      .then(([dbRes, xmlRes]) => {
        const db = normalizeProducts(dbRes?.data?.data?.products || []);
        const xml = normalizeProducts(xmlRes?.data?.data?.products || []);
        console.log(`[Home] Loaded page ${page + 1}: Normalized DB count:`, db.length, "Normalized XML count:", xml.length);
        setProducts((prev) => {
          const next = mergeUnique([prev, xml, db]);
          console.log(`[Home] Total products count after loadMore:`, next.length);
          return next;
        });
        setPage((p) => p + 1);
        setHasMore(db.length === PAGE_SIZE || xml.length === PAGE_SIZE);
      })
      .finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, page, searchQuery, categoryQuery, brandQuery]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "Tümü") return products;
    return products.filter((p) => p.category?.toLowerCase() === selectedCategory.toLowerCase());
  }, [products, selectedCategory]);

  const flashDeals = useMemo(() =>
    products
      .filter((p) => p.originalPrice > p.price)
      .sort((a, b) => {
        const discA = (a.originalPrice - a.price) / a.originalPrice;
        const discB = (b.originalPrice - b.price) / b.originalPrice;
        return discB - discA;
      })
      .slice(0, 5),
    [products]
  );

  const showcaseProducts = useMemo(() =>
    [...products]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0))
      .slice(0, 5),
    [products]
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50">
        <div className="w-full max-w-full px-4 sm:px-6 md:px-10 xl:px-14 py-6 space-y-8 mx-auto">


          {/* 2. Hero Banner (Campaigns Grid) */}
          <section className="w-full">
            <CampaignGrid startIndex={0} count={3} />
          </section>

          {/* 2.5 Personalized Recommendations */}
          <ProductCarouselSection title="Sana özel öneriler" products={showcaseProducts} />

          {/* 3. Trust Bar */}
          <TrustBar />

          {/* 4. Showcase Products */}
          {showcaseProducts.length > 0 && (
            <>
              <section className="w-full">
                <CampaignGrid startIndex={3} count={3} />
              </section>
              <ShowcaseSection products={showcaseProducts} />
            </>
          )}

          {/* 5. Flash Deals */}
          <section className="w-full">
            <CampaignGrid startIndex={6} count={3} />
          </section>
          <FlashDealsGrid products={flashDeals} timeLeft={timeLeft} />

          {/* 7. Product Feed */}
          <section className="w-full">
            <CampaignGrid startIndex={9} count={3} />
          </section>
          <ProductFeed
            products={filteredProducts}
            loading={loading}
            hasMore={hasMore}
            loadingMore={loadingMore}
            selectedCategory={selectedCategory}
            onLoadMore={loadMore}
          />
        </div>

        {/* <Footer /> kaldırıldı */}
        <MobileBottomNav />
      </div>
    </ErrorBoundary>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Yükleniyor...</div>}>
      <HomeContent />
    </Suspense>
  );
}

// ── Sub-components ──

function ShowcaseSection({ products }: { products: Product[] }) {
  const router = useRouter();
  return (
    <section className="bg-white border-[0.5px] border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 select-none shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="bg-amber-500 text-white p-2 rounded-xl flex items-center justify-center shrink-0">
            <Star size={18} fill="currentColor" strokeWidth={0} />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Vitrindekiler</h2>
            <p className="text-slate-400 text-xs font-bold mt-0.5">En yüksek puanlı öne çıkan ürünler</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
          <Sparkles size={14} className="text-amber-500 animate-pulse" />
          <span className="text-xs font-black text-amber-700">Editörün Seçimi</span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {products.map((p) => {
          const discount = p.originalPrice > p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
          const popularityPercent = Math.min(98, Math.max(75, Math.round(((p.rating || 4.2) / 5) * 100)));
          return (
            <div key={`showcase-${p._id}`} onClick={() => router.push(`/product/${p._id}`)}
              className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col justify-between active:scale-[0.98]">
              <div>
                <div className="relative aspect-square mb-3 overflow-hidden rounded-xl bg-white flex items-center justify-center p-3 border border-slate-100">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center">
                      <Sparkles className="text-slate-300" size={24} />
                    </div>
                  )}
                  {discount > 0 ? (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">-%{discount}</div>
                  ) : (
                    <div className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <Star size={8} fill="currentColor" strokeWidth={0} /> {(p.rating || 4.2).toFixed(1)}
                    </div>
                  )}
                </div>
                <span className="text-[#e35933] font-black text-[9px] uppercase tracking-widest block">{p.brand}</span>
                <h4 className="text-xs font-black text-slate-800 line-clamp-1 mt-1 group-hover:text-[#e35933] transition-colors">{p.name}</h4>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-black text-slate-900">{p.price.toLocaleString("tr-TR")} TL</span>
                  {p.originalPrice > p.price && <span className="text-slate-400 line-through text-[10px] font-bold">{p.originalPrice.toLocaleString("tr-TR")} TL</span>}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <span>%{popularityPercent} İlgi Oranı</span>
                    <span className="text-amber-500 flex items-center gap-0.5 font-bold">
                      <Star size={8} fill="currentColor" strokeWidth={0} /> {(p.rating || 4.2).toFixed(1)}
                    </span>
                  </div>
                  <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${popularityPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
