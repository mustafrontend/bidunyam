"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import type { Campaign } from "./CampaignCarousel";

const FALLBACK: Campaign[] = [
  {
    id: "fb-1",
    title: "Teknolojide biDünya Fırsat",
    description: "En yeni telefon, laptop ve akıllı cihazlarda net indirimler.",
    imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1200&q=80",
    discountType: "PERCENTAGE",
    discountValue: 30,
  } as Campaign,
  {
    id: "fb-2",
    title: "Yeni Sezon Moda",
    description: "Gardırobunu yenile, tarzını konuştur.",
    imageUrl: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1200&q=80",
    discountType: "PERCENTAGE",
    discountValue: 40,
  } as Campaign,
  {
    id: "fb-3",
    title: "Ev & Yaşam Şenliği",
    description: "Evine konfor kat, bütçeni koru.",
    imageUrl: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
    discountType: "PERCENTAGE",
    discountValue: 25,
  } as Campaign,
];

function badgeText(c: Campaign) {
  return c.discountType === "PERCENTAGE" ? `%${c.discountValue} İndirim` : `${c.discountValue} TL Avantaj`;
}

function resolveImg(img: string | null) {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `/api/products${img}`;
}

export const HeroSection: React.FC = () => {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    apiClient
      .get("/products/campaigns/active")
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setCampaigns(res.data.data);
        } else {
          setCampaigns(FALLBACK);
        }
      })
      .catch(() => setCampaigns(FALLBACK));
  }, []);

  const list = campaigns && campaigns.length > 0 ? campaigns : FALLBACK;
  const heroSlides = list.slice(0, 5);
  const sideCards = list.slice(5, 7).length === 2 ? list.slice(5, 7) : list.slice(0, 2);

  const next = useCallback(() => setCurrent((p) => (p + 1) % heroSlides.length), [heroSlides.length]);
  const prev = () => setCurrent((p) => (p - 1 + heroSlides.length) % heroSlides.length);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const t = setInterval(next, 5500);
    return () => clearInterval(t);
  }, [next, heroSlides.length]);

  // Kampanyalar yüklenene kadar skeleton (fallback→gerçek AnimatePresence swap'ını önler)
  if (campaigns === null) {
    return (
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
        <div className="lg:col-span-2 h-[280px] lg:h-[440px] rounded-3xl bg-slate-200 animate-pulse" />
        <div className="hidden lg:flex flex-col gap-4 lg:h-[440px]">
          <div className="flex-1 min-h-0 rounded-3xl bg-slate-200 animate-pulse" />
          <div className="flex-1 min-h-0 rounded-3xl bg-slate-200 animate-pulse" />
        </div>
      </section>
    );
  }

  const go = (c: Campaign) => router.push(`/arama?kampanya=${encodeURIComponent(c.id)}`);
  const slide = heroSlides[current] || heroSlides[0];
  if (!slide) return null;
  const slideImg = resolveImg(slide.imageUrl);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
      {/* Ana Büyük Vitrin (Carousel) */}
      <div className="lg:col-span-8 relative h-[360px] lg:h-[540px] rounded-[2.5rem] overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 cursor-pointer"
            onClick={() => go(slide)}
          >
            {slideImg ? (
              <img src={slideImg} alt={slide.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-brand-navy to-brand-blue" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 max-w-3xl">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-6"
              >
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[10px] md:text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-xl">
                  <Sparkles size={14} className="text-[#ff5000]" /> {badgeText(slide)}
                </span>
              </motion.div>
              
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tighter mb-4 drop-shadow-md"
              >
                {slide.title}
              </motion.h1>
              
              {slide.description && (
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-white/80 text-sm md:text-lg font-medium mb-8 line-clamp-2 max-w-xl leading-relaxed"
                >
                  {slide.description}
                </motion.p>
              )}
              
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                onClick={(e) => { e.stopPropagation(); go(slide); }}
                className="w-fit bg-white text-slate-900 px-8 py-3.5 rounded-full font-black text-sm hover:bg-[#ff5000] hover:text-white transition-all duration-300 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[#ff5000]/50 flex items-center gap-2 group/btn"
              >
                Keşfet <ArrowRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>

        {heroSlides.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Önceki"
              className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={next}
              aria-label="Sonraki"
              className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <ChevronRight size={24} />
            </button>
            <div className="absolute bottom-6 left-8 md:left-16 flex gap-2">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Slayt ${i + 1}`}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${i === current ? "w-10 bg-white" : "w-2 bg-white/40 hover:bg-white/60"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Yan Kampanyalar (Bento Grid) */}
      <div className="hidden lg:grid grid-rows-2 gap-5 lg:col-span-4 h-[540px]">
        {sideCards.map((c, idx) => {
          const img = resolveImg(c.imageUrl);
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.1, duration: 0.6 }}
              onClick={() => go(c)}
              className="relative rounded-[2.5rem] overflow-hidden cursor-pointer group shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            >
              {img ? (
                <img src={img} alt={c.title} className="w-full h-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-110" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent p-8 flex flex-col justify-end">
                <div className="transform transition-transform duration-500 group-hover:-translate-y-2">
                  <span className="inline-block bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[10px] font-black px-3 py-1.5 rounded-lg tracking-widest uppercase mb-3">
                    {badgeText(c)}
                  </span>
                  <h3 className="text-white font-black text-2xl leading-tight line-clamp-2 mb-2">{c.title}</h3>
                  <span className="text-[#ff5000] text-xs font-bold flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Fırsatı Gör <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
