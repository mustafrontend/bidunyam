"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Smartphone, Shirt, Home, Baby, Sparkles, Dumbbell, BookOpen, ShoppingBasket,
} from "lucide-react";
import { CATEGORY_TREE, catHref } from "@/lib/categories";

const ICONS: Record<string, React.ReactNode> = {
  Smartphone: <Smartphone size={22} />,
  Shirt: <Shirt size={22} />,
  Home: <Home size={22} />,
  Sparkles: <Sparkles size={22} />,
  Baby: <Baby size={22} />,
  Dumbbell: <Dumbbell size={22} />,
  BookOpen: <BookOpen size={22} />,
  ShoppingBasket: <ShoppingBasket size={22} />,
};

export const CategoryShowcase: React.FC = () => {
  return (
    <section className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-black text-slate-800 tracking-tight">Kategoriler</h2>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
        {CATEGORY_TREE.map((c, i) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
          >
            <Link href={catHref(c.name)} className="group flex flex-col items-center gap-2 text-center">
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white shadow-md group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300`}>
                {ICONS[c.icon]}
              </div>
              <span className="text-[11px] md:text-xs font-bold text-slate-600 group-hover:text-brand-orange transition-colors leading-tight">
                {c.name}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
