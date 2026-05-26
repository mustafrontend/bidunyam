"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, ChevronRight } from "lucide-react";
import { apiClient } from "@/lib/api";

type CategoryData = {
  name: string;
  subCategories: string[];
};

export const CategoriesMegaMenu: React.FC = () => {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiClient.get("/products/meta/options");
        const fetchedCats: CategoryData[] = res.data?.data?.categories || [];
        // Filter out categories without subcategories if needed, but we keep all for now
        setCategories(fetchedCats.slice(0, 15)); // Limit to first 15 main categories for UI
      } catch (error) {
        console.error("Failed to fetch categories for mega menu", error);
      }
    };
    fetchCategories();
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setActiveCategory(null);
    }, 150); // slight delay to allow smooth transition to the menu
  };

  const activeCategoryData = useMemo(() => {
    if (!activeCategory) return categories.length > 0 ? categories[0] : null;
    return categories.find((c) => c.name === activeCategory) || categories[0];
  }, [activeCategory, categories]);

  return (
    <div 
      className="relative z-50 flex items-center h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Kategoriler Butonu */}
      <button className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:text-orange-500 transition-colors font-semibold text-sm group">
        <Menu className="w-5 h-5 group-hover:scale-110 transition-transform" />
        Kategoriler
      </button>

      {/* Mega Menü Dropdown */}
      <AnimatePresence>
        {isOpen && categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border-[0.5px] border-slate-200 overflow-hidden flex"
            style={{ width: "900px", minHeight: "450px" }}
          >
            {/* Sol Taraf (Ana Kategoriler) */}
            <div className="w-1/3 bg-slate-50 border-r border-slate-100 py-4 flex flex-col h-[500px] overflow-y-auto custom-scrollbar">
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  onMouseEnter={() => setActiveCategory(cat.name)}
                  className={`flex items-center justify-between px-6 py-3 cursor-pointer transition-colors ${
                    (activeCategory || categories[0]?.name) === cat.name
                      ? "bg-white text-orange-500 font-bold border-l-4 border-orange-500 shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 font-medium border-l-4 border-transparent"
                  }`}
                >
                  <span className="text-sm truncate pr-2">{cat.name}</span>
                  <ChevronRight className={`w-4 h-4 ${
                    (activeCategory || categories[0]?.name) === cat.name ? "opacity-100" : "opacity-0"
                  } transition-opacity`} />
                </div>
              ))}
            </div>

            {/* Sağ Taraf (Alt Kategoriler) */}
            <div className="w-2/3 p-8 bg-white h-[500px] overflow-y-auto custom-scrollbar">
              <h3 className="text-xl font-black text-slate-800 mb-6 tracking-tight">
                {activeCategoryData?.name}
              </h3>
              
              <div className="columns-2 gap-8 space-y-4">
                {activeCategoryData?.subCategories.slice(0, 20).map((sub) => (
                  <Link 
                    href={`/arama?kategori=${encodeURIComponent(activeCategoryData.name)}&altkategori=${encodeURIComponent(sub)}`} 
                    key={sub} 
                    className="block text-sm text-slate-600 hover:text-orange-500 hover:underline transition-colors break-inside-avoid py-1"
                  >
                    {sub}
                  </Link>
                ))}
              </div>

              {(activeCategoryData?.subCategories?.length || 0) > 20 && (
                <div className="mt-8 pt-4 border-t border-slate-100">
                  <Link 
                    href={`/kategoriler/${encodeURIComponent(activeCategoryData?.name || '')}`}
                    className="inline-flex items-center text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors"
                  >
                    Tümünü Gör <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
