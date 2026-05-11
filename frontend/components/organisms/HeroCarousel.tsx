"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    id: 1,
    image: '/images/hero/electronics.png',
    title: 'Teknolojinin Kalbi Burada Atıyor',
    subtitle: 'En yeni gadgetlar ve akıllı ev sistemlerinde biDünya fırsat.',
    cta: 'Keşfet',
    color: 'from-brand-blue/80'
  },
  {
    id: 2,
    image: '/images/hero/fashion.png',
    title: 'Stilini biDünyam ile Tamamla',
    subtitle: 'Yeni sezon koleksiyonları ve ikonik tasarımlar seni bekliyor.',
    cta: 'İncele',
    color: 'from-brand-orange/80'
  },
  {
    id: 3,
    image: '/images/hero/home.png',
    title: 'Evinizdeki biDünya Huzur',
    subtitle: 'Modern dekorasyon ve konforu bir araya getiren özel seçkiler.',
    cta: 'Alışverişe Başla',
    color: 'from-brand-navy/80'
  }
];

export const HeroCarousel: React.FC = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative w-full h-[300px] md:h-[500px] overflow-hidden rounded-2xl group">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <img
            src={slides[current].image}
            alt={slides[current].title}
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${slides[current].color} to-transparent flex flex-col justify-center px-8 md:px-16`}>
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="max-w-xl"
            >
              <h2 className="text-2xl md:text-5xl font-black text-white leading-tight mb-4 tracking-tighter uppercase">
                {slides[current].title}
              </h2>
              <p className="text-white/90 text-sm md:text-lg font-medium mb-8 leading-relaxed">
                {slides[current].subtitle}
              </p>
              <button className="bg-white text-brand-navy px-8 py-3 rounded-full font-black text-sm md:text-base hover:bg-brand-orange hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-xl">
                {slides[current].cta}
              </button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight size={24} />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? 'w-8 bg-white' : 'w-2 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
