"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Smartphone, Shirt, Home, Baby, Sparkles, Dumbbell, BookOpen, ShoppingBasket,
} from "lucide-react";
import { CATEGORY_TREE, catHref } from "@/lib/categories";

const ICONS: Record<string, React.ReactNode> = {
  Smartphone: <Smartphone strokeWidth={1.5} size={28} />,
  Shirt: <Shirt strokeWidth={1.5} size={28} />,
  Home: <Home strokeWidth={1.5} size={28} />,
  Sparkles: <Sparkles strokeWidth={1.5} size={28} />,
  Baby: <Baby strokeWidth={1.5} size={28} />,
  Dumbbell: <Dumbbell strokeWidth={1.5} size={28} />,
  BookOpen: <BookOpen strokeWidth={1.5} size={28} />,
  ShoppingBasket: <ShoppingBasket strokeWidth={1.5} size={28} />,
};

export const CategoryShowcase: React.FC = () => {
  return (
    <section className="w-full py-6">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Kategoriler</h2>
        <span className="h-[0.5px] flex-1 bg-slate-200" />
      </div>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-4 md:gap-6">
        {CATEGORY_TREE.map((c, i) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.5, ease: "easeOut" }}
          >
            <Link 
              href={catHref(c.name)} 
              className="group flex flex-col items-center gap-3 text-center active:scale-[0.98] transition-all duration-200"
            >
              <div className="w-16 h-16 md:w-[84px] md:h-[84px] rounded-2xl bg-white border-[0.5px] border-slate-200 flex items-center justify-center text-slate-700 group-hover:border-slate-300 group-hover:shadow-sm transition-all duration-300 relative overflow-hidden">
                {/* Çok hafif bir arka plan parlaması (glow) efekti hover durumunda */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br ${c.gradient} transition-opacity duration-300`} />
                
                <div className="group-hover:scale-110 group-hover:-translate-y-0.5 transition-transform duration-300 ease-out relative z-10">
                  {ICONS[c.icon]}
                </div>
              </div>
              <span className="text-[12px] md:text-[13px] font-semibold text-slate-600 group-hover:text-slate-900 transition-colors leading-tight tracking-tight">
                {c.name}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
