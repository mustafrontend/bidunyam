"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Timer, Star, Sparkles, Percent, ShieldCheck, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api";
import { ProductCard, Product } from "@/components/molecules/ProductCard";
import { TrustBar } from "@/components/molecules/TrustBar";
import { Footer } from "@/components/organisms/Footer";
import { MobileBottomNav } from "@/components/molecules/MobileBottomNav";
import { CampaignBadges } from "@/components/molecules/CampaignBadges";
import { FlashDealsGrid } from "@/components/organisms/FlashDealsGrid";
import { ProductFeed } from "@/components/organisms/ProductFeed";
import { ErrorBoundary } from "@/components/atoms/ErrorBoundary";
import { useUiStore } from "@/stores/uiStore";

const CATEGORIES = [
  "Tümü", "Elektronik", "Moda", "Ev & Yaşam", "Anne & Bebek",
  "Kozmetik", "Spor & Outdoor", "Kitap & Kırtasiye", "Oyuncak", "Süpermarket",
];
const PAGE_SIZE = 20;

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

export default function Home() {
  const router = useRouter();
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
    Promise.all([
      apiClient.get(`/products?limit=${PAGE_SIZE}&page=1`),
      apiClient.get(`/products/xml/catalog?limit=${PAGE_SIZE}&page=1`).catch(() => null),
    ])
      .then(([dbRes, xmlRes]) => {
        const db = normalizeProducts(dbRes?.data?.data?.products || []);
        const xml = normalizeProducts(xmlRes?.data?.data?.products || []);
        setProducts(mergeUnique([xml, db]));
        setHasMore(db.length === PAGE_SIZE || xml.length === PAGE_SIZE);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    Promise.all([
      apiClient.get(`/products?limit=${PAGE_SIZE}&page=${page + 1}`),
      apiClient.get(`/products/xml/catalog?limit=${PAGE_SIZE}&page=${page + 1}`).catch(() => null),
    ])
      .then(([dbRes, xmlRes]) => {
        const db = normalizeProducts(dbRes?.data?.data?.products || []);
        const xml = normalizeProducts(xmlRes?.data?.data?.products || []);
        setProducts((prev) => mergeUnique([prev, xml, db]));
        setPage((p) => p + 1);
        setHasMore(db.length === PAGE_SIZE || xml.length === PAGE_SIZE);
      })
      .finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, page]);

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
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 space-y-8">

          {/* 1. Campaign Badges */}
          <CampaignBadges />

          {/* 2. Hero Banner */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.section
                key={userType}
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.35, ease: "easeInOut" }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full"
              >
                {userType === "bireysel" ? (
                  <BireyselBanner
                    timeLeft={timeLeft}
                    onCta={() => setSelectedCategory("Tümü")}
                    onSellerClick={() => router.push("/yonetim/urunler")}
                  />
                ) : (
                  <KurumsalBanner
                    onCta={() => setSelectedCategory("Tümü")}
                    onSellerClick={() => router.push("/yonetim/urunler")}
                  />
                )}
              </motion.section>
            </AnimatePresence>
          </div>

          {/* 3. Trust Bar */}
          <TrustBar />

          {/* 4. Showcase Products */}
          {showcaseProducts.length > 0 && (
            <ShowcaseSection products={showcaseProducts} />
          )}

          {/* 5. Flash Deals */}
          <FlashDealsGrid products={flashDeals} timeLeft={timeLeft} />

          {/* 6. Category Selector */}
          <section className="space-y-3 select-none">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              İlgini Çeken Kategorileri Keşfet
            </h2>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-[11px] font-black transition-all duration-200 active:scale-[0.97] cursor-pointer uppercase tracking-wider ${
                    selectedCategory === cat
                      ? "bg-[#001819] text-white border border-[#001819] shadow-sm"
                      : "bg-white text-slate-600 border-[0.5px] border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>

          {/* 7. Product Feed */}
          <ProductFeed
            products={filteredProducts}
            loading={loading}
            hasMore={hasMore}
            loadingMore={loadingMore}
            selectedCategory={selectedCategory}
            onLoadMore={loadMore}
          />
        </div>

        <Footer />
        <MobileBottomNav />
      </div>
    </ErrorBoundary>
  );
}

// ── Sub-components (kept in file since they are page-specific and < 50 lines each) ──

function BireyselBanner({ timeLeft, onCta, onSellerClick }: {
  timeLeft: { hours: number; minutes: number; seconds: number };
  onCta: () => void; onSellerClick: () => void;
}) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <>
      <div className="hidden md:block lg:col-span-8 relative h-[380px] rounded-2xl overflow-hidden border border-slate-100 group shadow-sm bg-slate-900">
        <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop"
          alt="New Season Banner" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/60 to-transparent flex flex-col justify-center p-8 md:p-12 text-white">
          <span className="bg-[#e35933] text-white text-[9px] font-black px-3 py-1.5 rounded-full w-fit uppercase tracking-widest mb-4 shadow-sm flex items-center gap-1">
            <Sparkles size={10} className="animate-pulse" /> ARACI YOK, KOMİSYON YOK
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white max-w-lg leading-tight tracking-tight mb-4 select-none">
            Komisyonsuz Fiyatlar, En Ucuz Alışveriş!
          </h1>
          <p className="text-slate-300 text-xs font-bold max-w-md mb-6 leading-relaxed select-none">
            biDunyam sıfıra yakın komisyon oranıyla çalışır. Satıcılar yüksek pazaryeri komisyonları ödemediği için, en trend tüm ürünler Türkiye&apos;nin en ucuz fiyatlarıyla doğrudan sana gelir!
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={onCta} className="bg-white hover:bg-[#e35933] hover:text-white text-slate-900 text-xs font-black uppercase tracking-wider px-8 py-3.5 rounded-full transition-all duration-300 active:scale-95 cursor-pointer shadow-md">
              Alışverişe Başla
            </button>
            <span className="text-[10px] font-black text-slate-300 bg-white/10 backdrop-blur-sm border border-white/20 px-3.5 py-2.5 rounded-full uppercase tracking-wider select-none">
              💡 Satıcı mısınız? <span className="text-[#fed65b] hover:underline cursor-pointer font-extrabold" onClick={onSellerClick}>Mağaza Açın</span>
            </span>
          </div>
        </div>
      </div>
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-[#e35933]/10 border-[0.5px] border-[#e35933]/30 p-6 rounded-2xl flex flex-col justify-between h-[178px] select-none">
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="font-black text-[#e35933] text-[10px] uppercase tracking-widest">Günün Fırsatı</p>
              <span className="bg-[#e35933] text-white text-[10px] font-black flex items-center gap-1 px-2.5 py-1 rounded-full animate-pulse">
                <Timer size={12} strokeWidth={2.5} />{pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
              </span>
            </div>
            <h3 className="font-black text-slate-800 text-base mt-2 tracking-tight">Flaş Fırsatlarda %70&apos;e Varan İndirim</h3>
            <p className="text-slate-500 text-[10px] font-bold mt-1">Sadece sınırlı bir süre için sepette net indirim!</p>
          </div>
          <button onClick={onCta} className="bg-slate-950 hover:bg-[#e35933] text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer active:scale-95">Fırsatları Yakala</button>
        </div>
        <div className="bg-slate-950 p-6 rounded-2xl flex flex-col justify-between h-[178px] select-none border-[0.5px] border-slate-800">
          <div>
            <p className="font-black text-orange-400 text-[10px] uppercase tracking-widest">Sana Özel Seçkiler</p>
            <h3 className="font-black text-white text-base mt-2 tracking-tight">Kişiselleştirilmiş Alışveriş</h3>
            <p className="text-slate-400 text-[10px] font-bold mt-1">İlgi alanlarına göre yapay zekanın senin için derlediği ürünler.</p>
          </div>
          <div className="flex items-center justify-between gap-2 mt-2">
            <button onClick={onCta} className="border border-white/20 hover:bg-white/10 text-white py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer active:scale-95 flex-1 text-center">Keşfe Başla</button>
            <span onClick={onSellerClick} className="text-[9px] font-bold text-slate-400 hover:text-white cursor-pointer underline whitespace-nowrap">Satıcı Ol</span>
          </div>
        </div>
      </div>
    </>
  );
}

function KurumsalBanner({ onCta, onSellerClick }: { onCta: () => void; onSellerClick: () => void }) {
  return (
    <>
      <div className="hidden md:block lg:col-span-8 relative h-[380px] rounded-2xl overflow-hidden border border-slate-100 group shadow-sm bg-slate-950">
        <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop"
          alt="Corporate Banner" className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#001819] via-slate-950/70 to-transparent flex flex-col justify-center p-8 md:p-12 text-white">
          <span className="bg-teal-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full w-fit uppercase tracking-widest mb-4 shadow-sm flex items-center gap-1">
            <ShieldCheck size={10} className="animate-pulse" /> TOPTAN ALIMDA KOMİSYON FARKINA SON
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white max-w-lg leading-tight tracking-tight mb-4 select-none">
            Sıfıra Yakın Komisyonla En Ekonomik Tedarik!
          </h1>
          <p className="text-slate-300 text-xs font-bold max-w-md mb-6 leading-relaxed select-none">
            Yüksek aracı komisyon masraflarını tamamen kaldırdık. KDV kolaylıkları ve sıfır komisyon avantajıyla doğrudan ilk elden!
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={onCta} className="bg-white hover:bg-teal-500 hover:text-white text-[#001819] text-xs font-black uppercase tracking-wider px-8 py-3.5 rounded-full transition-all duration-300 active:scale-95 cursor-pointer shadow-md">Tüzel Alışveriş</button>
            <span className="text-[10px] font-black text-slate-300 bg-white/10 backdrop-blur-sm border border-white/20 px-3.5 py-2.5 rounded-full uppercase tracking-wider select-none">
              🔌 <span className="text-teal-400 hover:underline cursor-pointer font-extrabold" onClick={onSellerClick}>ERP / XML Entegrasyonu</span>
            </span>
          </div>
        </div>
      </div>
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-teal-950/20 border-[0.5px] border-teal-500/30 p-6 rounded-2xl flex flex-col justify-between h-[178px] select-none">
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="font-black text-teal-400 text-[10px] uppercase tracking-widest">Toplu Alım / B2B</p>
              <span className="bg-teal-500 text-white text-[9px] font-black flex items-center gap-1 px-2.5 py-1 rounded-full">
                <Briefcase size={10} /> Firmanıza Özel
              </span>
            </div>
            <h3 className="font-black text-slate-800 text-base mt-2 tracking-tight">Hacimli Alımlarda Özel KDV Avantajları</h3>
            <p className="text-slate-500 text-[10px] font-bold mt-1">Toptan siparişlerinizde şirketinize özel net indirimler.</p>
          </div>
          <button onClick={onCta} className="bg-slate-950 hover:bg-teal-500 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer active:scale-95">Teklif İsteyin</button>
        </div>
        <div className="bg-slate-950 p-6 rounded-2xl flex flex-col justify-between h-[178px] select-none border-[0.5px] border-slate-800">
          <div>
            <p className="font-black text-teal-400 text-[10px] uppercase tracking-widest">Hızlı Sevkiyat</p>
            <h3 className="font-black text-white text-base mt-2 tracking-tight">Aynı Gün Ofise Teslim</h3>
            <p className="text-slate-400 text-[10px] font-bold mt-1">biDunyam Express güvencesiyle aynı gün kurye teslimatı.</p>
          </div>
          <div className="flex items-center justify-between gap-2 mt-2">
            <button onClick={onCta} className="border border-teal-500/20 hover:bg-teal-500/10 text-teal-400 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer active:scale-95 flex-1 text-center">Kurye Sorgula</button>
            <span onClick={onSellerClick} className="text-[9px] font-bold text-slate-400 hover:text-white cursor-pointer underline whitespace-nowrap">B2B Satıcı</span>
          </div>
        </div>
      </div>
    </>
  );
}

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
