"use client";

import { useEffect, useMemo, useState } from "react";
// Kampanya badge verileri
const CAMPAIGN_BADGES = [
  { label: "Bugün Fiyatı Düşenler", color: "bg-purple-100", icon: <Timer className="text-purple-500" size={22} /> },
  { label: "Web Sitesi Açıldı", color: "bg-orange-100", icon: <Sparkles className="text-orange-500" size={22} /> },
  { label: "trendyol plus", color: "bg-pink-100", icon: <Star className="text-pink-500" size={22} /> },
  { label: "Kampanya Detayları", color: "bg-yellow-100", icon: <Percent className="text-yellow-500" size={22} /> },
  { label: "Sen De Al!", color: "bg-blue-100", icon: <Plus className="text-blue-500" size={22} /> },
  { label: "Avantajlı Ürünler", color: "bg-green-100", icon: <Briefcase className="text-green-500" size={22} /> },
  { label: "İndirim Kuponlarım", color: "bg-red-100", icon: <ShieldCheck className="text-red-500" size={22} /> },
  { label: "Krediler", color: "bg-slate-100", icon: <Cpu className="text-slate-500" size={22} /> },
];
import { useRouter } from "next/navigation";
import { Timer, Star, ChevronRight, Sparkles, Plus, Percent, Briefcase, ShieldCheck, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { ProductCard, Product } from "@/components/molecules/ProductCard";
import { TrustBar } from "@/components/molecules/TrustBar";
import { Footer } from "@/components/organisms/Footer";
import { MobileBottomNav } from "@/components/molecules/MobileBottomNav";
import { useUiStore } from "@/stores/uiStore";

const CATEGORIES = [
  "Tümü", "Elektronik", "Moda", "Ev & Yaşam", "Anne & Bebek",
  "Kozmetik", "Spor & Outdoor", "Kitap & Kırtasiye", "Oyuncak", "Süpermarket"
];
const PAGE_SIZE = 20;

function normalizeProducts(data: any[]): Product[] {
  if (!Array.isArray(data)) return [];
  return data.map((item, idx) => ({
    _id: item._id || `product-${idx}-${Date.now()}`,
    name: item.name || "Ürün Açıklaması Yok",
    price: Number(item.price) || 0,
    originalPrice: Number(item.originalPrice) || Number(item.price) || 0,
    imageUrl: item.imageUrl || "",
    brand: item.brand || "biDunyam",
    barcode: item.barcode ? String(item.barcode) : undefined,
    category: item.category || "Genel",
    rating: Number(item.rating) || 4.2,
    reviewCount: Number(item.reviewCount) || 0,
    stock: Number(item.stock) ?? 99,
  }));
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border-[0.5px] border-slate-200 bg-white">
          <div className="aspect-square animate-pulse bg-slate-100" />
          <div className="space-y-3 p-4">
            <div className="h-2 w-1/4 animate-pulse rounded bg-slate-100" />
            <div className="h-3 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
            <div className="mt-4 flex justify-between items-center">
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
              <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { isBrandMode, setIsBrandMode } = useUiStore();
  const userType = isBrandMode ? "kurumsal" : "bireysel";
  const setUserType = (type: "bireysel" | "kurumsal") => setIsBrandMode(type === "kurumsal");

  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Ticking countdown timer state for Flash Deals
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 22, seconds: 10 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let s = prev.seconds - 1;
        let m = prev.minutes;
        let h = prev.hours;
        if (s < 0) {
          s = 59;
          m -= 1;
        }
        if (m < 0) {
          m = 59;
          h -= 1;
        }
        if (h < 0) {
          h = 23;
        }
        return { hours: h, minutes: m, seconds: s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mergeUnique = (arrays: Product[][]): Product[] => {
    const map = new Map<string, Product>();
    arrays.flat().forEach((item) => map.set(item._id, item));
    return Array.from(map.values());
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiClient.get(`/products?limit=${PAGE_SIZE}&page=1`),
      apiClient.get(`/products/xml/catalog?limit=${PAGE_SIZE}&page=1`).catch(() => null),
    ])
      .then(([dbRes, xmlRes]) => {
        const dbProducts = normalizeProducts(dbRes?.data?.data?.products || []);
        const xmlProducts = normalizeProducts(xmlRes?.data?.data?.products || []);
        setProducts(mergeUnique([xmlProducts, dbProducts]));
        setHasMore(dbProducts.length === PAGE_SIZE || xmlProducts.length === PAGE_SIZE);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    Promise.all([
      apiClient.get(`/products?limit=${PAGE_SIZE}&page=${page + 1}`),
      apiClient.get(`/products/xml/catalog?limit=${PAGE_SIZE}&page=${page + 1}`).catch(() => null),
    ])
      .then(([dbRes, xmlRes]) => {
        const dbProducts = normalizeProducts(dbRes?.data?.data?.products || []);
        const xmlProducts = normalizeProducts(xmlRes?.data?.data?.products || []);
        setProducts((prev) => mergeUnique([prev, xmlProducts, dbProducts]));
        setPage((prev) => prev + 1);
        setHasMore(dbProducts.length === PAGE_SIZE || xmlProducts.length === PAGE_SIZE);
      })
      .finally(() => setLoadingMore(false));
  };

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "Tümü") return products;
    return products.filter((p) => p.category?.toLowerCase() === selectedCategory.toLowerCase());
  }, [products, selectedCategory]);

  // Extract top items with actual discounts for Lightning Deals
  const flashDeals = useMemo(() => {
    return products
      .filter((p) => p.originalPrice > p.price)
      .sort((a, b) => {
        const discA = Math.round(((a.originalPrice - a.price) / a.originalPrice) * 100);
        const discB = Math.round(((b.originalPrice - b.price) / b.originalPrice) * 100);
        return discB - discA;
      })
      .slice(0, 5);
  }, [products]);

  // Extract top showcase/featured products for Vitrindekiler (highest rating and review count)
  const showcaseProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0))
      .slice(0, 5);
  }, [products]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 space-y-8">

        {/* 1. Kampanyalar - Badge/ikonlar */}
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {CAMPAIGN_BADGES.map((b, i) => (
            <div key={i} className={`flex flex-col items-center min-w-[90px] px-2 py-1 rounded-2xl ${b.color} shadow-sm`}>
              {b.icon}
              <span className="text-[11px] font-black text-slate-700 text-center mt-1 whitespace-nowrap">{b.label}</span>
            </div>
          ))}
        </div>

        {/* 2. Sana Özel Vitrin/Önerilenler */}
        <section>
          <h2 className="text-lg font-black text-slate-800 mb-3">Mustafa, Sana Özel Ürünler</h2>
          {loading ? <SkeletonGrid /> : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {filteredProducts.slice(0, 12).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* 3. Vitrin/Öne Çıkanlar */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black text-slate-800">Vitrindekiler</h2>
            <span className="text-xs font-bold text-[#ff5000] cursor-pointer">Tümünü Gör</span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {showcaseProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>

        {/* 4. İndirim Kampanyaları - Renkli kutular */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {flashDeals.map((p, i) => {
            const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
            return (
              <div key={p._id} className="rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-200 p-5 flex flex-col items-center justify-center shadow-sm">
                <span className="text-2xl font-black text-orange-500 mb-2">%{discount} İndirim</span>
                <span className="text-xs font-bold text-slate-700 mb-1 text-center">{p.name}</span>
                <span className="text-lg font-black text-slate-900">{p.price.toLocaleString("tr-TR")} TL</span>
                <span className="text-xs font-bold text-slate-400 line-through">{p.originalPrice.toLocaleString("tr-TR")} TL</span>
              </div>
            );
          })}
        </section>

        {/* ...eski ana içerik ve gridler burada devam edecek... */}

        {/* Dynamic Bento Hero Banner & Promo Grid */}
        <div className="overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.section
              key={userType}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full"
            >
              {userType === "bireysel" ? (
                <>
                  {/* Main Hero Card (2/3 width) - Bireysel (Customer Focus + Subtle Seller Badge) */}
                  <div className="hidden md:block lg:col-span-8 relative h-[380px] rounded-2xl overflow-hidden border border-slate-100 group shadow-sm bg-slate-900">
                    <img
                      src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop"
                      alt="New Season Banner"
                      className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/60 to-transparent flex flex-col justify-center p-8 md:p-12 text-white">
                      <span className="bg-[#e35933] text-white text-[9px] font-black px-3 py-1.5 rounded-full w-fit uppercase tracking-widest mb-4 shadow-sm flex items-center gap-1">
                        <Sparkles size={10} className="animate-pulse" />
                        ARACI YOK, KOMİSYON YOK: EN HESAPLI ALIŞVERİŞ
                      </span>
                      <h1 className="text-2xl sm:text-4xl font-black text-white max-w-lg leading-tight tracking-tight mb-4 select-none">
                        Komisyonsuz Fiyatlar, En Ucuz Alışveriş!
                      </h1>
                      <p className="text-slate-300 text-xs font-bold max-w-md mb-6 leading-relaxed select-none">
                        biDunyam sıfıra yakın komisyon oranıyla çalışır. Satıcılar yüksek pazaryeri komisyonları ödemediği için, en trend tüm ürünler Türkiye'nin en ucuz fiyatlarıyla doğrudan sana gelir!
                      </p>
                      <div className="flex flex-wrap items-center gap-4">
                        <button
                          onClick={() => setSelectedCategory("Tümü")}
                          className="bg-white hover:bg-[#e35933] hover:text-white text-slate-900 text-xs font-black uppercase tracking-wider px-8 py-3.5 rounded-full w-fit transition-all duration-300 active:scale-95 cursor-pointer shadow-md"
                        >
                          Alışverişe Başla
                        </button>
                        <span className="text-[10px] font-black text-slate-300 bg-white/10 backdrop-blur-sm border border-white/20 px-3.5 py-2.5 rounded-full uppercase tracking-wider select-none">
                          💡 Satıcı mısınız? Sıfır Komisyonla <span className="text-[#fed65b] hover:underline cursor-pointer font-extrabold" onClick={() => router.push("/yonetim/urunler")}>Mağaza Açın</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stacked Conversions Cards (1/3 width) - Bireysel */}
                  <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Flash Deal Promo */}
                    <div className="bg-[#e35933]/10 border-[0.5px] border-[#e35933]/30 p-6 rounded-2xl flex flex-col justify-between h-[178px] relative overflow-hidden group select-none">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-black text-[#e35933] text-[10px] uppercase tracking-widest">Günün Fırsatı</p>
                          <span className="bg-[#e35933] text-white text-[10px] font-black flex items-center gap-1 px-2.5 py-1 rounded-full border border-orange-300 shadow-sm animate-pulse">
                            <Timer size={12} strokeWidth={2.5} />
                            {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
                          </span>
                        </div>
                        <h3 className="font-black text-slate-800 text-base mt-2 tracking-tight">Flaş Fırsatlarda %70'e Varan İndirim</h3>
                        <p className="text-slate-500 text-[10px] font-bold mt-1">Sadece sınırlı bir süre için sepette net indirim ve ücretsiz kargo avantajı!</p>
                      </div>
                      <button
                        onClick={() => setSelectedCategory("Tümü")}
                        className="bg-slate-950 hover:bg-[#e35933] text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer active:scale-95"
                      >
                        Fırsatları Yakala
                      </button>
                    </div>

                    {/* Personalized Shopping Card */}
                    <div className="bg-slate-950 p-6 rounded-2xl flex flex-col justify-between h-[178px] select-none border-[0.5px] border-slate-800">
                      <div>
                        <p className="font-black text-orange-400 text-[10px] uppercase tracking-widest">Sana Özel Seçkiler</p>
                        <h3 className="font-black text-white text-base mt-2 tracking-tight">Kişiselleştirilmiş Alışveriş</h3>
                        <p className="text-slate-400 text-[10px] font-bold mt-1">İlgi alanlarına ve geçmiş favorilerine göre yapay zekanın senin için derlediği ürünler.</p>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <button
                          onClick={() => setSelectedCategory("Tümü")}
                          className="border border-white/20 hover:bg-white/10 text-white py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer active:scale-95 flex-1 text-center"
                        >
                          Keşfe Başla
                        </button>
                        <span 
                          onClick={() => router.push("/yonetim/urunler")}
                          className="text-[9px] font-bold text-slate-400 hover:text-white cursor-pointer underline whitespace-nowrap"
                        >
                          Satıcı Ol
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Main Hero Card (2/3 width) - Kurumsal (Customer Focus + Subtle Seller Integration Badge) */}
                  <div className="hidden md:block lg:col-span-8 relative h-[380px] rounded-2xl overflow-hidden border border-slate-100 group shadow-sm bg-slate-950">
                    <img
                      src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop"
                      alt="Corporate Banner"
                      className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#001819] via-slate-950/70 to-transparent flex flex-col justify-center p-8 md:p-12 text-white">
                      <span className="bg-teal-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full w-fit uppercase tracking-widest mb-4 shadow-sm flex items-center gap-1">
                        <ShieldCheck size={10} className="animate-pulse" />
                        TOPTAN ALIMDA KOMİSYON FARKINA SON
                      </span>
                      <h1 className="text-2xl sm:text-4xl font-black text-white max-w-lg leading-tight tracking-tight mb-4 select-none">
                        Sıfıra Yakın Komisyonla En Ekonomik Tedarik!
                      </h1>
                      <p className="text-slate-300 text-xs font-bold max-w-md mb-6 leading-relaxed select-none">
                        Yüksek aracı komisyon masraflarını tamamen kaldırdık. Şirketinizin tüm hammadde ve ofis tedarik ihtiyaçlarını en ucuz fiyatlar, KDV kolaylıkları ve sıfır komisyon avantajıyla doğrudan ilk elden tamamlayın!
                      </p>
                      <div className="flex flex-wrap items-center gap-4">
                        <button
                          onClick={() => setSelectedCategory("Tümü")}
                          className="bg-white hover:bg-teal-500 hover:text-white text-[#001819] text-xs font-black uppercase tracking-wider px-8 py-3.5 rounded-full w-fit transition-all duration-300 active:scale-95 cursor-pointer shadow-md"
                        >
                          Tüzel Alışveriş
                        </button>
                        <span className="text-[10px] font-black text-slate-300 bg-white/10 backdrop-blur-sm border border-white/20 px-3.5 py-2.5 rounded-full uppercase tracking-wider select-none">
                          🔌 Kurumsal Satıcı: <span className="text-teal-400 hover:underline cursor-pointer font-extrabold" onClick={() => router.push("/yonetim/urunler")}>ERP / XML Entegrasyonu</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stacked Conversions Cards (1/3 width) - Kurumsal */}
                  <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* B2B Toptan / Toplu Satınalma */}
                    <div className="bg-teal-950/20 border-[0.5px] border-teal-500/30 p-6 rounded-2xl flex flex-col justify-between h-[178px] relative overflow-hidden group select-none border-[0.5px] border-teal-950">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-black text-teal-400 text-[10px] uppercase tracking-widest">Toplu Alım / B2B</p>
                          <span className="bg-teal-500 text-white text-[9px] font-black flex items-center gap-1 px-2.5 py-1 rounded-full border border-teal-300 shadow-sm">
                            <Briefcase size={10} />
                            Firmanıza Özel
                          </span>
                        </div>
                        <h3 className="font-black text-slate-800 text-base mt-2 tracking-tight">Hacimli Alımlarda Özel KDV Avantajları</h3>
                        <p className="text-slate-500 text-[10px] font-bold mt-1">Toptan siparişlerinizde şirketinize özel net indirimler, KDV kolaylıkları ve e-arşiv fatura.</p>
                      </div>
                      <button
                        onClick={() => setSelectedCategory("Tümü")}
                        className="bg-slate-950 hover:bg-teal-500 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer active:scale-95"
                      >
                        Teklif İsteyin
                      </button>
                    </div>

                    {/* Fast Express Delivery */}
                    <div className="bg-slate-950 p-6 rounded-2xl flex flex-col justify-between h-[178px] select-none border-[0.5px] border-slate-800">
                      <div>
                        <p className="font-black text-teal-400 text-[10px] uppercase tracking-widest">Hızlı Sevkiyat</p>
                        <h3 className="font-black text-white text-base mt-2 tracking-tight">Aynı Gün Ofise Teslim</h3>
                        <p className="text-slate-400 text-[10px] font-bold mt-1">biDunyam Express güvencesiyle İstanbul, Ankara ve İzmir'de iş yerinize aynı gün kurye teslimatı.</p>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <button
                          onClick={() => setSelectedCategory("Tümü")}
                          className="border border-teal-500/20 hover:bg-teal-500/10 text-teal-400 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer active:scale-95 flex-1 text-center"
                        >
                          Kurye Sorgula
                        </button>
                        <span 
                          onClick={() => router.push("/yonetim/urunler")}
                          className="text-[9px] font-bold text-slate-400 hover:text-white cursor-pointer underline whitespace-nowrap"
                        >
                          B2B Satıcı
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.section>
          </AnimatePresence>
        </div>

        {/* Global Value Trust Propositions */}
        <TrustBar />

        {/* Showcase / Vitrindekiler Section */}
        {showcaseProducts.length > 0 && (
          <section className="bg-white border-[0.5px] border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 select-none shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="bg-amber-500 text-white p-2 rounded-xl flex items-center justify-center shrink-0">
                  <Star size={18} fill="currentColor" strokeWidth={0} />
                </span>
                <div>
                  <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Vitrindekiler</h2>
                  <p className="text-slate-400 text-xs font-bold mt-0.5">En çok tercih edilen ve en yüksek puanlı öne çıkan ürünler</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start md:self-auto bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                <Sparkles size={14} className="text-amber-500 animate-pulse" />
                <span className="text-xs font-black text-amber-700">Editörün Seçimi</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {showcaseProducts.map((p) => {
                const discount = p.originalPrice > p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
                const popularityPercent = Math.min(98, Math.max(75, Math.round(((p.rating || 4.2) / 5) * 100)));
                return (
                  <div
                    key={`showcase-${p._id}`}
                    onClick={() => router.push(`/product/${p._id}`)}
                    className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col justify-between active:scale-[0.98]"
                  >
                    <div>
                      <div className="relative aspect-square mb-3 overflow-hidden rounded-xl bg-white flex items-center justify-center p-3 border border-slate-100">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center">
                            <Sparkles className="text-slate-300" size={24} />
                          </div>
                        )}
                        {discount > 0 ? (
                          <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                            -%{discount}
                          </div>
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
                        {p.originalPrice > p.price && (
                          <span className="text-slate-400 line-through text-[10px] font-bold">{p.originalPrice.toLocaleString("tr-TR")} TL</span>
                        )}
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
        )}

        {/* Dynamic Flash / Lightning Deals section */}
        {flashDeals.length > 0 && (
          <section className="bg-white border-[0.5px] border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 select-none shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="bg-red-500 text-white p-2 rounded-xl flex items-center justify-center shrink-0">
                  <Percent size={18} strokeWidth={3} />
                </span>
                <div>
                  <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Flaş İndirimler</h2>
                  <p className="text-slate-400 text-xs font-bold mt-0.5">En yüksek indirim oranına sahip popüler ürünler</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start md:self-auto bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
                <Timer size={14} className="text-[#ff5000] animate-spin" />
                <span className="text-xs font-black text-slate-700">Kalan Süre:</span>
                <span className="text-[#ff5000] font-black text-xs">
                  {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {flashDeals.map((p) => {
                const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
                // dynamic progression
                const soldPercent = Math.min(95, Math.max(30, Math.round((p.price % 60) + 35)));
                return (
                  <div
                    key={p._id}
                    onClick={() => router.push(`/product/${p._id}`)}
                    className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-square mb-3 overflow-hidden rounded-xl bg-white flex items-center justify-center p-3 border border-slate-100">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                          -%{discount}
                        </div>
                      </div>
                      <span className="text-[#ff5000] font-black text-[9px] uppercase tracking-widest block">{p.brand}</span>
                      <h4 className="text-xs font-black text-slate-800 line-clamp-1 mt-1 group-hover:text-[#ff5000] transition-colors">{p.name}</h4>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-black text-slate-900">{p.price.toLocaleString("tr-TR")} TL</span>
                        <span className="text-slate-400 line-through text-[10px] font-bold">{p.originalPrice.toLocaleString("tr-TR")} TL</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <span>%{soldPercent} Satıldı</span>
                          <span className="text-red-500">Tükeniyor!</span>
                        </div>
                        <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${soldPercent}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Bento Category Scroll Slider Selector (Clean Flex Wrap Layout) */}
        <section className="space-y-3 select-none">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                İlgini Çeken Kategorileri Keşfet
              </h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-[11px] font-black transition-all duration-200 active:scale-[0.97] cursor-pointer uppercase tracking-wider ${
                  selectedCategory === cat
                    ? "bg-[#001819] text-white border border-[#001819] shadow-sm shadow-[#001819]/10"
                    : "bg-white text-slate-600 border-[0.5px] border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Main Infinite Product Feed Showcase */}
        <section className="space-y-6">
          <div className="flex justify-between items-center select-none">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 md:text-2xl">
              Sizin İçin Seçtiklerimiz
            </h2>
            <div className="flex items-center gap-1.5 text-xs font-black text-[#001819]">
              <Sparkles size={14} className="animate-pulse" />
              <span>Kişiselleştirilmiş Akış</span>
            </div>
          </div>
          
          {loading ? (
            <SkeletonGrid />
          ) : filteredProducts.length === 0 ? (
            <div className="py-24 text-center select-none bg-white rounded-2xl border-[0.5px] border-slate-200 shadow-sm">
              <span className="text-3xl">🔍</span>
              <p className="font-bold text-slate-400 mt-3 text-sm">Aradığınız kategoride ürün bulunamadı.</p>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredProducts.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>

              {/* Dynamic load more CTA button */}
              {hasMore && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="rounded-full bg-slate-900 px-12 py-4 text-xs font-black text-white uppercase tracking-widest shadow-sm transition-all duration-300 hover:bg-[#ff5000] hover:shadow-lg disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    {loadingMore ? "Yükleniyor..." : "Daha Fazla Keşfet"}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Global Footer & Mobile Navigation */}
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
