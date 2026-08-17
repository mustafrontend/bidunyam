"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { apiClient } from "@/lib/api";
import { Product } from "@/components/molecules/ProductCard";
import { TrustBar } from "@/components/molecules/TrustBar";
import { MobileBottomNav } from "@/components/molecules/MobileBottomNav";

import { FlashDealsGrid } from "@/components/organisms/FlashDealsGrid";
import { ProductFeed } from "@/components/organisms/ProductFeed";
import { ErrorBoundary } from "@/components/atoms/ErrorBoundary";
import { CampaignGrid } from "@/components/organisms/CampaignGrid";
import { ProductCarouselSection } from "@/components/organisms/ProductCarouselSection";

import { GlobalSourcesHero } from "@/components/organisms/GlobalSourcesHero";
import { GlobalSourcesShowcaseGrid } from "@/components/organisms/GlobalSourcesShowcaseGrid";

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
      brand: (((p.brand as { name?: string })?.name) || p.brandName || (typeof p.brand === "string" ? p.brand : "") || "biDünyam") as string,
      barcode: p.barcode ? String(p.barcode) : undefined,
      category: (p.category || "Genel") as string,
      rating: Number(p.rating) || 4.2,
      reviewCount: Number(p.reviewCount) || 0,
      stock: Number(p.stock) ?? 99,
      condition: (p.condition as string) || "SIFIR",
      listingType: (p.listingType as string) || "KURUMSAL",
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

function useQueryParams() {
  const [params, setParams] = useState({ search: "", category: "", brand: "" });
  useEffect(() => {
    const read = () => {
      const sp = new URLSearchParams(window.location.search);
      setParams({
        search: sp.get("search") || "",
        category: sp.get("category") || "",
        brand: sp.get("brand") || "",
      });
    };
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);
  return params;
}

function HomeContent() {
  const { search: searchQuery, category: categoryQuery, brand: brandQuery } = useQueryParams();

  const timeLeft = useCountdown({ hours: 4, minutes: 22, seconds: 10 });

  const [selectedCategory] = useState<string>("Tümü");
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

    Promise.all([
      apiClient.get(`/products?${queryString}`),
      apiClient.get(`/products/xml/catalog?${queryString}&_t=${Date.now()}`).catch(() => null),
    ])
      .then(([dbRes, xmlRes]) => {
        const xmlData = xmlRes?.data;
        const db = normalizeProducts(dbRes?.data?.data?.products || []);
        const xmlProducts = xmlData?.data?.products ?? xmlData?.products ?? [];
        const xml = normalizeProducts(xmlProducts);
        const merged = mergeUnique([db, xml]);
        setProducts(merged);
        setHasMore(db.length === PAGE_SIZE || xml.length === PAGE_SIZE);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [searchQuery, categoryQuery, brandQuery]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const query = new URLSearchParams();
    query.set("limit", PAGE_SIZE.toString());
    query.set("page", (page + 1).toString());
    if (searchQuery) query.set("search", searchQuery);
    if (categoryQuery) query.set("category", categoryQuery);
    if (brandQuery) query.set("brand", brandQuery);

    const queryString = query.toString();

    Promise.all([
      apiClient.get(`/products?${queryString}`),
      apiClient.get(`/products/xml/catalog?${queryString}&_t=${Date.now()}`).catch(() => null),
    ])
      .then(([dbRes, xmlRes]) => {
        const db = normalizeProducts(dbRes?.data?.data?.products || []);
        const xml = normalizeProducts(xmlRes?.data?.data?.products || []);
        setProducts((prev) => mergeUnique([prev, db, xml]));
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
      .slice(0, 6),
    [products]
  );

  const bestSellers = useMemo(() =>
    [...products]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0))
      .slice(0, 10),
    [products]
  );

  const premiumPicks = useMemo(() =>
    [...products]
      .sort((a, b) => b.price - a.price)
      .slice(0, 10),
    [products]
  );

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen bg-slate-50 overflow-hidden">

        {/* Ambient Subtle Light White-Orange Wave Background */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
          {/* Radial Glow 1 - Top Left Orange Wave Aura */}
          <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-[#ff5000]/12 via-orange-300/8 to-transparent blur-[140px]" />
          
          {/* Radial Glow 2 - Top Right Soft Amber Wave Aura */}
          <div className="absolute top-32 -right-40 w-[750px] h-[750px] rounded-full bg-gradient-to-bl from-amber-400/10 via-[#ff5000]/6 to-transparent blur-[160px]" />

          {/* Radial Glow 3 - Mid Page Glow */}
          <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[900px] h-[550px] rounded-full bg-gradient-to-r from-orange-200/12 via-amber-100/15 to-orange-100/6 blur-[170px]" />

          {/* Subtle Ambient Radial Pattern Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#ff5000_0.75px,transparent_0.75px)] [background-size:28px_28px] opacity-[0.035]" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-[1600px] px-4 md:px-10 xl:px-14 py-6 md:py-8 space-y-10 md:space-y-14 mx-auto">

          {/* 1. Global Sources 3-Sütunlu Hero Layout (Sol: Kategoriler, Orta: Slider + 4 Kart, Sağ: En Popüler) */}
          <GlobalSourcesHero products={products} />

          {/* 2. Global Sources 3 Kartlı Seçki Izgarası (Editörün Seçimi, Hızlı Teslimat, Orijinal & Sertifikalı) */}
          <GlobalSourcesShowcaseGrid products={products} />

          {/* 3. Güven Barı */}
          <TrustBar />

          {/* 4. Flaş İndirimler (Geri Sayımlı) */}
          {flashDeals.length > 0 && <FlashDealsGrid products={flashDeals} timeLeft={timeLeft} />}

          {/* 5. Çok Satanlar Karuseli */}
          {bestSellers.length > 0 && (
            <ProductCarouselSection title="Çok Satanlar" products={bestSellers} />
          )}

          {/* 6. Kampanya Satırı */}
          <section className="w-full">
            <CampaignGrid startIndex={0} count={3} />
          </section>

          {/* 7. Öne Çıkan Seçkiler */}
          {premiumPicks.length > 0 && (
            <ProductCarouselSection title="Öne Çıkan Seçkiler" products={premiumPicks} />
          )}

          {/* 8. Tüm Ürün Akışı */}
          <ProductFeed
            products={filteredProducts}
            loading={loading}
            hasMore={hasMore}
            loadingMore={loadingMore}
            selectedCategory={selectedCategory}
            onLoadMore={loadMore}
          />
        </div>

        <MobileBottomNav />
      </div>
    </ErrorBoundary>
  );
}

export default function Home() {
  return <HomeContent />;
}
