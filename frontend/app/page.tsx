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
import { HeroSection } from "@/components/organisms/HeroSection";
import { CategoryShowcase } from "@/components/organisms/CategoryShowcase";

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

  // Öne çıkanlarla çakışmasın diye farklı bir dilim (fiyatı yüksek premium ürünler)
  const premiumPicks = useMemo(() =>
    [...products]
      .sort((a, b) => b.price - a.price)
      .slice(0, 10),
    [products]
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50">
        <div className="w-full max-w-[1600px] px-4 sm:px-6 md:px-10 xl:px-14 py-6 space-y-10 mx-auto">

          {/* 1. Hero + yan kampanyalar */}
          <HeroSection />

          {/* 2. Kategori vitrini */}
          <CategoryShowcase />

          {/* 3. Güven barı */}
          <TrustBar />

          {/* 4. Flaş indirimler (geri sayımlı) */}
          {flashDeals.length > 0 && <FlashDealsGrid products={flashDeals} timeLeft={timeLeft} />}

          {/* 5. Çok satanlar */}
          {bestSellers.length > 0 && (
            <ProductCarouselSection title="Çok satanlar" products={bestSellers} />
          )}

          {/* 6. Tek kampanya satırı */}
          <section className="w-full">
            <CampaignGrid startIndex={0} count={3} />
          </section>

          {/* 7. Öne çıkan premium ürünler */}
          {premiumPicks.length > 0 && (
            <ProductCarouselSection title="Öne çıkan seçkiler" products={premiumPicks} />
          )}

          {/* 8. Tüm ürün akışı */}
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
