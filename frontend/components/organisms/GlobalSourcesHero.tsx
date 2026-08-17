"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  ChevronLeft, 
  ArrowRight, 
  Sparkles, 
  Smartphone, 
  Shirt, 
  Home, 
  Cpu, 
  Wrench, 
  Car, 
  ShoppingBag, 
  HeartHandshake, 
  Package, 
  Sparkle, 
  Baby, 
  Utensils, 
  Factory, 
  Play,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { Product } from "@/components/molecules/ProductCard";

interface Campaign {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  discountType?: string;
  discountValue?: number;
}

const FALLBACK_CAMPAIGNS: Campaign[] = [
  {
    id: "fb-1",
    title: "Global Sources & biDünyam Teknoloji Fuarı",
    description: "Elektronik, mobil aksesuar ve akıllı ev teknolojilerinde %40'a varan özel fuar fiyatları.",
    imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1200&q=80",
    discountType: "PERCENTAGE",
    discountValue: 40,
  },
  {
    id: "fb-2",
    title: "Yeni Sezon Moda & Tekstil Koleksiyonu",
    description: "Trend kıyafetler, ayakkabılar ve aksesuar ürünlerinde toptan & perakende avantajlar.",
    imageUrl: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1200&q=80",
    discountType: "PERCENTAGE",
    discountValue: 35,
  },
  {
    id: "fb-3",
    title: "Ev & Donanım Şenliği",
    description: "Yapı market, hırdavat ve ev dekorasyonunda üreticiden direkt teslim imkânı.",
    imageUrl: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
    discountType: "PERCENTAGE",
    discountValue: 25,
  },
];

const CATEGORIES_LIST = [
  { name: "Oto & Araç Aksesuarları", icon: Car, slug: "Otomobil" },
  { name: "Güzellik & Kişisel Bakım", icon: Sparkle, slug: "Kozmetik" },
  { name: "Tüketici Elektroniği", icon: Smartphone, slug: "Elektronik" },
  { name: "Elektronik Bileşenler", icon: Cpu, slug: "Elektronik" },
  { name: "Moda & Aksesuar", icon: ShoppingBag, slug: "Moda" },
  { name: "Giyim & Tekstil", icon: Shirt, slug: "Moda" },
  { name: "Gıda & İçecek", icon: Utensils, slug: "Gida" },
  { name: "Ev & Dekorasyon", icon: Home, slug: "Ev & Yaşam" },
  { name: "Hobi & Hediyelik", icon: HeartHandshake, slug: "Hobi" },
  { name: "Yapı Market & Hırdavat", icon: Wrench, slug: "Yapi Market" },
  { name: "Anne, Bebek & Oyuncak", icon: Baby, slug: "Anne & Bebek" },
  { name: "Sanayi & Endüstriyel", icon: Factory, slug: "Sanayi" },
];

const FEATURED_CARDS = [
  { title: "Elektronik", img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80", category: "Elektronik" },
  { title: "Moda x Yaşam", img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80", category: "Moda" },
  { title: "Yapı x Donanım", img: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80", category: "Yapi Market" },
  { title: "Flaş Fırsatlar", img: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=400&q=80", category: "flas" },
];

interface GlobalSourcesHeroProps {
  products?: Product[];
}

export const GlobalSourcesHero: React.FC<GlobalSourcesHeroProps> = ({ products = [] }) => {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>(FALLBACK_CAMPAIGNS);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    apiClient
      .get("/products/campaigns/active")
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setCampaigns(res.data.data);
        }
      })
      .catch(() => setCampaigns(FALLBACK_CAMPAIGNS));
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % campaigns.length);
  }, [campaigns.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + campaigns.length) % campaigns.length);
  };

  useEffect(() => {
    if (campaigns.length <= 1) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide, campaigns.length]);

  // Çok satanlar listesi (Sağ Sütun "Most Popular" için)
  const popularProducts = (products.length > 0 ? products : [
    {
      _id: "pop-1",
      name: "Yenilenmiş iPhone Akıllı Telefonlar",
      price: 3499.00,
      originalPrice: 4200.00,
      imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80",
      rating: 4.8,
      reviewCount: 142,
      stock: 100,
    },
    {
      _id: "pop-2",
      name: "Toptan Yüksek Kaliteli Kablosuz Kulaklık",
      price: 450.00,
      originalPrice: 600.00,
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80",
      rating: 4.7,
      reviewCount: 89,
      stock: 50,
    },
    {
      _id: "pop-3",
      name: "Orijinal Ekran & Çip Seti Modülü",
      price: 222.00,
      originalPrice: 300.00,
      imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=300&q=80",
      rating: 4.9,
      reviewCount: 210,
      stock: 30,
    },
    {
      _id: "pop-4",
      name: "Elektrikli Bisiklet & Akıllı Scooter",
      price: 18500.00,
      originalPrice: 21000.00,
      imageUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=300&q=80",
      rating: 4.6,
      reviewCount: 64,
      stock: 15,
    },
  ] as Product[]).slice(0, 4);

  const slide = campaigns[currentSlide] || campaigns[0];

  return (
    <section className="w-full">
      {/* 3-Sütunlu Global Sources Stili Ana Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">

        {/* 1. Sol Sütun: Dikey Kategoriler Menüsü (Global Sources Style Categories) */}
        <div className="hidden lg:block lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between py-2">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm text-slate-900 tracking-tight">
              <span className="text-lg leading-none text-[#ff5000]">≡</span>
              <span>Kategoriler</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tümü</span>
          </div>

          <div className="flex-1 divide-y divide-slate-50 overflow-y-auto max-h-[460px] no-scrollbar">
            {CATEGORIES_LIST.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={idx}
                  href={`/arama?kategori=${encodeURIComponent(cat.slug)}`}
                  className="group flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors duration-150 text-xs font-medium text-slate-700 hover:text-[#ff5000]"
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <Icon size={15} className="text-slate-400 group-hover:text-[#ff5000] shrink-0 transition-colors duration-150" />
                    <span className="truncate group-hover:font-semibold">{cat.name}</span>
                  </div>
                  <ChevronRight size={13} className="text-slate-300 group-hover:text-[#ff5000] group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* 2. Orta Sütun: Ana Kampanya Banner Slider + 4 Hızlı Kart */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* Main Hero Slider */}
          <div className="relative h-[280px] sm:h-[340px] lg:h-[360px] rounded-2xl overflow-hidden bg-slate-900 group shadow-sm border border-slate-200/60">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 cursor-pointer"
                onClick={() => router.push(`/arama?kampanya=${slide.id}`)}
              >
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-transparent" />
                
                <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 max-w-lg">
                  <span className="inline-flex items-center gap-1.5 bg-[#ff5000] text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider w-fit mb-3 shadow-md shadow-[#ff5000]/30">
                    <Sparkles size={12} /> {slide.discountValue ? `%${slide.discountValue} İndirim Fırsatı` : "Fuar Özel"}
                  </span>
                  
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight mb-2 drop-shadow-sm">
                    {slide.title}
                  </h2>
                  
                  <p className="text-slate-200 text-xs sm:text-sm font-medium mb-6 line-clamp-2 leading-relaxed">
                    {slide.description}
                  </p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/arama?kampanya=${slide.id}`);
                    }}
                    className="w-fit bg-[#ff5000] hover:bg-[#e04500] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 active:scale-95 flex items-center gap-2 shadow-md shadow-[#ff5000]/25"
                  >
                    Hemen İncele <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slider Nav Controls */}
            {campaigns.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-[#ff5000] text-white backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-[#ff5000] text-white backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight size={18} />
                </button>

                {/* Slider Indicators */}
                <div className="absolute bottom-3 right-4 flex gap-1.5 z-10">
                  {campaigns.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === currentSlide ? "w-6 bg-[#ff5000]" : "w-1.5 bg-white/50 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sub Quick Navigation Cards (4 Grid Cards under Slider) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FEATURED_CARDS.map((card, i) => (
              <Link
                key={i}
                href={card.category === "flas" ? "/arama?kampanya=flas" : `/arama?kategori=${encodeURIComponent(card.category)}`}
                className="group relative flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:border-[#ff5000]/40 hover:shadow-md transition-all duration-200 text-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 mb-2 overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center p-1">
                  <img
                    src={card.img}
                    alt={card.title}
                    className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-[#ff5000] tracking-tight truncate w-full">
                  {card.title}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* 3. Sağ Sütun: "En Popüler / Most Popular" Ranking Card (Global Sources Style) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={16} className="text-[#ff5000]" />
              <h3 className="font-black text-sm text-slate-900 tracking-tight">En Popüler</h3>
            </div>
            <Link href="/arama?sirala=cokSatan" className="text-[11px] font-bold text-slate-400 hover:text-[#ff5000] transition-colors">
              Tümünü Gör
            </Link>
          </div>

          {/* Rank Items List */}
          <div className="space-y-3">
            {popularProducts.map((prod, index) => {
              const rankNum = index + 1;
              return (
                <Link
                  key={prod._id}
                  href={`/product/${prod._id}`}
                  className="group flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition-colors duration-150 border border-transparent hover:border-slate-100"
                >
                  {/* Rank Badge */}
                  <div className={`w-5 h-5 shrink-0 rounded flex items-center justify-center text-[10px] font-black ${
                    rankNum === 1 ? "bg-amber-500 text-white" :
                    rankNum === 2 ? "bg-slate-300 text-slate-800" :
                    rankNum === 3 ? "bg-amber-700 text-white" : "bg-slate-100 text-slate-600"
                  }`}>
                    {rankNum}
                  </div>

                  {/* Thumbnail */}
                  <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 p-1 flex items-center justify-center">
                    <img
                      src={prod.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=200&q=80"}
                      alt={prod.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-800 truncate group-hover:text-[#ff5000] transition-colors">
                      {prod.name}
                    </h4>
                    <div className="text-xs font-bold text-slate-900 tracking-tight mt-0.5">
                      ₺ {prod.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] font-medium text-slate-400">
                      {prod.stock ? `${prod.stock} Adet (Stokta)` : "Hızlı Gönderi"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
