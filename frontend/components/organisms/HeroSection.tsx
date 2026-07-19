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
        <div className="lg:col-span-2 h-[280px] md:h-[420px] rounded-3xl bg-slate-200 animate-pulse" />
        <div className="hidden lg:flex flex-col gap-4">
          <div className="flex-1 rounded-3xl bg-slate-200 animate-pulse" />
          <div className="flex-1 rounded-3xl bg-slate-200 animate-pulse" />
        </div>
      </section>
    );
  }

  const go = (c: Campaign) => router.push(`/arama?kampanya=${encodeURIComponent(c.id)}`);
  const slide = heroSlides[current] || heroSlides[0];
  if (!slide) return null;
  const slideImg = resolveImg(slide.imageUrl);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
      {/* Ana büyük banner */}
      <div className="lg:col-span-2 relative h-[280px] md:h-[420px] rounded-3xl overflow-hidden group shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 cursor-pointer"
            onClick={() => go(slide)}
          >
            {slideImg ? (
              <img src={slideImg} alt={slide.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-brand-navy to-brand-blue" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/45 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-14 max-w-2xl">
              <motion.span
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="inline-flex w-fit items-center gap-1.5 bg-brand-orange text-white text-[11px] md:text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wide mb-4 shadow-lg"
              >
                <Sparkles size={13} /> {badgeText(slide)}
              </motion.span>
              <motion.h1
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-2xl md:text-5xl font-black text-white leading-[1.05] tracking-tight mb-3"
              >
                {slide.title}
              </motion.h1>
              {slide.description && (
                <motion.p
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="text-white/85 text-sm md:text-base font-medium mb-6 line-clamp-2 max-w-md"
                >
                  {slide.description}
                </motion.p>
              )}
              <motion.button
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.55 }}
                onClick={(e) => { e.stopPropagation(); go(slide); }}
                className="w-fit bg-white text-brand-navy px-7 py-3 rounded-full font-black text-sm hover:bg-brand-orange hover:text-white transition-all active:scale-95 shadow-xl flex items-center gap-2"
              >
                Fırsatları Keşfet <ArrowRight size={16} />
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>

        {heroSlides.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Önceki"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/15 hover:bg-white/35 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={next}
              aria-label="Sonraki"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/15 hover:bg-white/35 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight size={22} />
            </button>
            <div className="absolute bottom-5 left-8 md:left-14 flex gap-1.5">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Slayt ${i + 1}`}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all ${i === current ? "w-7 bg-white" : "w-2 bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Yan kampanya kartları */}
      <div className="hidden lg:flex flex-col gap-4">
        {sideCards.map((c) => {
          const img = resolveImg(c.imageUrl);
          return (
            <div
              key={c.id}
              onClick={() => go(c)}
              className="relative flex-1 rounded-3xl overflow-hidden cursor-pointer group shadow-sm"
            >
              {img ? (
                <img src={img} alt={c.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent p-5 flex flex-col justify-end">
                <span className="inline-flex w-fit items-center bg-white/15 backdrop-blur-md border border-white/20 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider mb-1.5">
                  {badgeText(c)}
                </span>
                <h3 className="text-white font-black text-base leading-tight line-clamp-2">{c.title}</h3>
                <span className="text-white/80 text-[11px] font-bold flex items-center gap-1 mt-1">
                  Keşfet <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
