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
    <section className="w-full py-2">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Kategorileri Keşfet</h2>
        <span className="h-[1px] flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
      </div>
      <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-3 pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        {CATEGORY_TREE.map((c, i) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
            className="snap-start shrink-0"
          >
            <Link 
              href={catHref(c.name)} 
              className="group flex items-center gap-3 bg-white border-[0.5px] border-slate-200/80 rounded-full px-6 py-3.5 shadow-sm hover:shadow-md hover:border-[#ff5000]/30 transition-all duration-300 active:scale-[0.97]"
            >
              <div className="text-slate-400 group-hover:text-[#ff5000] group-hover:scale-110 transition-all duration-300">
                {React.cloneElement(ICONS[c.icon] as React.ReactElement, { size: 20, strokeWidth: 2.5 })}
              </div>
              <span className="text-[13px] font-bold text-slate-700 group-hover:text-slate-900 tracking-wide">
                {c.name}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
