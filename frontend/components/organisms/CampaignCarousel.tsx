"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { apiClient } from "@/lib/api";

export interface CampaignProduct {
  id: string;
  productId: string;
  sellerId: string;
  campaignPrice: number;
  product: {
    _id: string;
    name: string;
    brand: string;
    price: number;
    originalPrice: number;
    imageUrl: string;
  };
}

export interface Campaign {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  startDate: string;
  endDate: string;
  status: string;
  products?: CampaignProduct[];
}

// Highly aesthetic pre-seeded campaigns matching Photo 1 and Photo 2
const FALLBACK_SLIDES = [
  {
    id: "fallback-1",
    title: "Her Gün Yenilenen Elektronik Fırsatları",
    description: "En son teknoloji ev aletleri, akıllı telefonlar ve bilgisayarlarda kaçırılmayacak biDünya indirimler!",
    badgeText: "Elektronik Fırsatlar",
    discountBadge: "%50'ye Varan",
    gradient: "from-teal-400 via-emerald-400 to-cyan-500",
    textColor: "text-white",
    badgeColor: "bg-[#e11d48] text-white", // Pink/red badge matching Photo 1
    // Photo 1 mock images
    images: [
      "https://images.unsplash.com/photo-1588854337236-6889d631faa8?q=80&w=300&auto=format&fit=crop", // Smart TV
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=300&auto=format&fit=crop", // Smartwatch / Phone
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=300&auto=format&fit=crop", // Laptop
    ],
  },
  {
    id: "fallback-2",
    title: "Bebek Bakım, Kozmetik ve Sağlık Ürünlerinde İndirimler",
    description: "Miniklerin hassas cildine özel bakım paketleri ve en sevilen sağlık markalarında sepette ek avantajlar.",
    badgeText: "Bebek & Bakım",
    discountBadge: "%40'a Varan",
    gradient: "from-purple-500 via-fuchsia-500 to-pink-500", // Purple/pink gradient matching Photo 2
    textColor: "text-white",
    badgeColor: "bg-white text-fuchsia-600 font-black",
    // Photo 2 mock images (baby products)
    images: [
      "https://images.unsplash.com/photo-1522850959074-b7c11f71f5c1?q=80&w=300&auto=format&fit=crop", // Baby care
      "https://images.unsplash.com/photo-1515488042361-404e9250afef?q=80&w=300&auto=format&fit=crop", // Baby toys
      "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=300&auto=format&fit=crop", // Baby bottle
    ],
  },
  {
    id: "fallback-3",
    title: "Mutfak & Ev Yaşamında Kaçırılmayacak Sezon Fırsatı",
    description: "Kahve makineleri, pratik mutfak yardımcıları ve evinizi güzelleştirecek biDünya şık detaylar.",
    badgeText: "Ev & Yaşam",
    discountBadge: "Sepette Net %30",
    gradient: "from-amber-400 via-orange-400 to-red-500",
    textColor: "text-white",
    badgeColor: "bg-slate-900 text-amber-400",
    images: [
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=300&auto=format&fit=crop", // Coffee
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=300&auto=format&fit=crop", // Kitchenware
    ],
  },
];

export const CampaignCarousel: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await apiClient.get("/products/campaigns/active");
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setCampaigns(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load active campaigns on homepage", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  // Total slides is campaigns count + fallback count (if campaigns is empty, just use fallback slides)
  const isDbEmpty = campaigns.length === 0;
  const activeSlides = isDbEmpty ? FALLBACK_SLIDES : campaigns;

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % activeSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeSlides.length]);

  const handleNext = () => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % activeSlides.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 350, damping: 30 },
        opacity: { duration: 0.35 },
      },
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
      transition: {
        x: { type: "spring", stiffness: 350, damping: 30 },
        opacity: { duration: 0.25 },
      },
    }),
  };

  if (loading) {
    return (
      <div className="w-full h-[280px] rounded-3xl bg-white border border-slate-100 animate-pulse flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Sparkles className="text-slate-300 animate-spin" size={24} />
          <span className="text-xs font-bold text-slate-400">Kampanyalar Yükleniyor...</span>
        </div>
      </div>
    );
  }

  const slide = activeSlides[current];

  // Helper to determine image URL for DB campaign
  const getDbImageUrl = (img: string | null) => {
    if (!img) return null;
    if (img.startsWith("http")) return img;
    return `/api/products${img}`;
  };

  return (
    <div className="relative w-full h-[280px] rounded-3xl overflow-hidden border border-slate-200/60 shadow-sm bg-slate-50 select-none group">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 w-full h-full flex flex-col md:flex-row overflow-hidden"
        >
          {/* Dynamic DB Campaign Layout */}
          {!isDbEmpty ? (
            (() => {
              const dbCamp = slide as Campaign;
              const hasImage = !!dbCamp.imageUrl;
              const hasProducts = dbCamp.products && dbCamp.products.length > 0;
              const productImages = dbCamp.products?.map((p) => p.product.imageUrl).filter(Boolean) || [];

              if (hasImage) {
                // If the super admin uploaded a full campaign banner image, show it beautifully!
                return (
                  <div className="relative w-full h-full">
                    <img
                      src={getDbImageUrl(dbCamp.imageUrl) || ""}
                      alt={dbCamp.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Dark gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/40 to-transparent p-8 md:p-12 flex flex-col justify-center text-white">
                      <span className="bg-[#ff5000] text-white text-[9px] font-black px-3 py-1.5 rounded-full w-fit uppercase tracking-widest mb-4 shadow-sm flex items-center gap-1">
                        <Sparkles size={10} className="animate-pulse" /> AKTİF KAMPANYA
                      </span>
                      <h2 className="text-2xl sm:text-4xl font-black text-white max-w-lg leading-tight tracking-tight mb-3">
                        {dbCamp.title}
                      </h2>
                      {dbCamp.description && (
                        <p className="text-slate-200 text-xs font-bold max-w-md mb-6 leading-relaxed">
                          {dbCamp.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4">
                        <span className="px-4 py-2 bg-white text-slate-950 text-xs font-black rounded-full uppercase tracking-wider">
                          İndirim:{" "}
                          <span className="text-[#ff5000]">
                            {dbCamp.discountType === "PERCENTAGE"
                              ? `%${dbCamp.discountValue}`
                              : `${dbCamp.discountValue} TL`}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Otherwise, render our high-fidelity custom split card for DB campaigns using their products!
              return (
                <>
                  {/* Left Side: Overlapping Product Images Mockup */}
                  <div className="w-full md:w-1/2 h-1/2 md:h-full bg-[#f8fafc] border-r border-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
                    {hasProducts ? (
                      <div className="flex items-center justify-center gap-4 relative">
                        {productImages.slice(0, 3).map((img, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ scale: 0.85, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                            className={`w-[120px] h-[120px] md:w-[150px] md:h-[150px] bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-center shadow-md shadow-slate-100 relative group-hover:scale-105 transition-transform duration-300 ${
                              idx === 1
                                ? "z-20 -translate-y-4 border-[#ff5000]/20"
                                : idx === 2
                                ? "z-10 -ml-10 rotate-6"
                                : "z-10 -mr-10 -rotate-6"
                            }`}
                          >
                            <img
                              src={img}
                              alt="product"
                              className="w-full h-full object-contain"
                            />
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-slate-400 space-y-2">
                        <Sparkles size={36} className="mx-auto text-slate-300 animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-wider">biDunyam Kampanya</p>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Editorial Campaign Context */}
                  <div className="w-full md:w-1/2 h-1/2 md:h-full bg-gradient-to-br from-slate-900 to-slate-950 p-8 md:p-12 text-white flex flex-col justify-center">
                    <span className="bg-[#ff5000] text-white text-[9px] font-black px-3 py-1.5 rounded-full w-fit uppercase tracking-widest mb-4 shadow-sm flex items-center gap-1">
                      <Sparkles size={10} className="animate-pulse" /> SÜPER FIRSAT
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight mb-3">
                      {dbCamp.title}
                    </h2>
                    {dbCamp.description && (
                      <p className="text-slate-300 text-[11px] font-bold mb-6 line-clamp-2 leading-relaxed">
                        {dbCamp.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider">
                        {dbCamp.discountType === "PERCENTAGE"
                          ? `%${dbCamp.discountValue} Net İndirim`
                          : `${dbCamp.discountValue} TL Sepet İndirimi`}
                      </span>
                    </div>
                  </div>
                </>
              );
            })()
          ) : (
            /* Pre-seeded Backup / Fallback Campaign Layout (Matches Photo 1 & 2 design) */
            (() => {
              const fallback = slide as typeof FALLBACK_SLIDES[number];
              return (
                <>
                  {/* Left Side: Overlapping Mockup Products inside a Frame */}
                  <div className="w-full md:w-1/2 h-[180px] md:h-full bg-[#f1f5f9] flex items-center justify-center p-6 relative overflow-hidden">
                    {/* Background visual geometry */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] [background-size:16px_16px]" />

                    <div className="flex items-center justify-center gap-4 relative z-10">
                      {fallback.images.map((img, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ scale: 0.8, opacity: 0, x: idx === 0 ? -40 : idx === 2 ? 40 : 0 }}
                          animate={{ scale: 1, opacity: 1, x: 0 }}
                          className={`w-[110px] h-[110px] md:w-[140px] md:h-[140px] bg-white border-[0.5px] border-slate-200 rounded-2xl p-3 flex items-center justify-center shadow-lg shadow-slate-200/50 hover:scale-110 transition-transform duration-300 ${
                            idx === 1
                              ? "z-20 -translate-y-4 scale-105 shadow-xl shadow-slate-300/40"
                              : idx === 2
                              ? "z-10 -ml-12 rotate-6 opacity-90"
                              : "z-10 -mr-12 -rotate-6 opacity-90"
                          }`}
                        >
                          <img
                            src={img}
                            alt="campaign product"
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Right Side: Cyan/Teal or Purple/Pink Gradient Editorial content matching Photo 1 / 2 */}
                  <div className={`w-full md:w-1/2 h-[200px] md:h-full bg-gradient-to-r ${fallback.gradient} p-8 md:p-12 ${fallback.textColor} flex flex-col justify-center relative`}>
                    <div className="space-y-4">
                      {/* Pink/Red Title badge */}
                      <span className={`text-[9px] font-black px-3.5 py-2 rounded-full w-fit uppercase tracking-widest mb-2 shadow-sm ${fallback.badgeColor}`}>
                        {fallback.badgeText}
                      </span>
                      <h2 className="text-2xl md:text-3xl font-black leading-tight tracking-tight uppercase">
                        {fallback.title}
                      </h2>
                      <p className="text-[11px] font-bold text-white/95 leading-relaxed max-w-sm line-clamp-2">
                        {fallback.description}
                      </p>
                      <div className="flex items-center gap-3 pt-2">
                        <span className="bg-white/20 backdrop-blur-sm border border-white/25 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider">
                          {fallback.discountBadge} Fırsat
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrow Left - White Circle styled like Photo 1 & 2 */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer opacity-0 group-hover:opacity-100 z-30 duration-300"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>

          {/* Navigation Arrow Right - White Circle styled like Photo 1 & 2 */}
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer opacity-0 group-hover:opacity-100 z-30 duration-300"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* Slide Indicator Capsule bottom-right - Like Photo 1 & 2 (Pill tag `11 / 15`) */}
      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[10px] font-black text-white/95 uppercase tracking-widest shadow-sm select-none z-30">
        {current + 1} / {activeSlides.length}
      </div>
    </div>
  );
};
