"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Smartphone, Shirt, Home, Baby, Sparkles, Dumbbell, BookOpen, ShoppingBasket,
} from "lucide-react";

interface Cat {
  label: string;
  href: string;
  icon: React.ReactNode;
  gradient: string;
}

const CATS: Cat[] = [
  { label: "Elektronik", icon: <Smartphone size={22} />, gradient: "from-blue-500 to-indigo-600", href: `/arama?kategori=${encodeURIComponent("Elektronik")}` },
  { label: "Moda", icon: <Shirt size={22} />, gradient: "from-rose-500 to-pink-600", href: `/arama?kategori=${encodeURIComponent("Moda")}` },
  { label: "Ev & Yaşam", icon: <Home size={22} />, gradient: "from-amber-500 to-orange-600", href: `/arama?kategori=${encodeURIComponent("Ev & Yaşam")}` },
  { label: "Kozmetik", icon: <Sparkles size={22} />, gradient: "from-fuchsia-500 to-purple-600", href: `/arama?kategori=${encodeURIComponent("Kozmetik")}` },
  { label: "Anne & Bebek", icon: <Baby size={22} />, gradient: "from-teal-500 to-emerald-600", href: `/arama?kategori=${encodeURIComponent("Anne & Bebek")}` },
  { label: "Spor & Outdoor", icon: <Dumbbell size={22} />, gradient: "from-lime-500 to-green-600", href: `/arama?kategori=${encodeURIComponent("Spor & Outdoor")}` },
  { label: "Kitap & Kırtasiye", icon: <BookOpen size={22} />, gradient: "from-cyan-500 to-sky-600", href: `/arama?kategori=${encodeURIComponent("Kitap & Kırtasiye")}` },
  { label: "Süpermarket", icon: <ShoppingBasket size={22} />, gradient: "from-red-500 to-rose-600", href: `/arama?kategori=${encodeURIComponent("Süpermarket")}` },
];

export const CategoryShowcase: React.FC = () => {
  return (
    <section className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-black text-slate-800 tracking-tight">Kategoriler</h2>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
        {CATS.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
          >
            <Link href={c.href} className="group flex flex-col items-center gap-2 text-center">
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white shadow-md group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300`}>
                {c.icon}
              </div>
              <span className="text-[11px] md:text-xs font-bold text-slate-600 group-hover:text-brand-orange transition-colors leading-tight">
                {c.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
