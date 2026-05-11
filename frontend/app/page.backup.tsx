"use client";

import { useEffect, useState } from "react";
import { apiClient } from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { CategoryBar } from "@/components/molecules/CategoryBar";
import { ShoppingCart, Star } from "lucide-react";
import Link from "next/link";
import { HeroCarousel } from "@/components/organisms/HeroCarousel";
import { FeatureBar } from "@/components/molecules/FeatureBar";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  imageUrl: string;
  brand: string;
  category: string;
  rating: number;
  reviewCount: number;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await apiClient.get("/products");
        setProducts(res.data.data.products);
        setFilteredProducts(res.data.data.products);
      } catch (err) {
        console.error("Failed to fetch products", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (activeCategory) {
      setFilteredProducts(products.filter(p => p.category === activeCategory));
    } else {
      setFilteredProducts(products);
    }
  }, [activeCategory, products]);

  const token = useAuthStore(state => state.token);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, token);
  };

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <CategoryBar 
        activeCategory={activeCategory} 
        onSelectCategory={setActiveCategory} 
      />

      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 mt-4">
        {/* Top Section: Hero & Side Banner */}
        {!activeCategory && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <HeroCarousel />
              </div>
              <div className="hidden lg:flex flex-col gap-6">
                <div className="flex-1 bg-brand-navy rounded-2xl p-6 text-white flex flex-col justify-center relative overflow-hidden group">
                  <div className="relative z-10">
                    <h3 className="text-xl font-black italic tracking-tighter mb-2">Premium<br/>Deneyim</h3>
                    <p className="text-xs font-bold text-white/70 mb-4 uppercase tracking-widest leading-tight">Sadece biDünyam Üyelerine Özel</p>
                    <button className="text-[10px] font-black border-b border-white hover:pb-1 transition-all uppercase">Detaylı Bilgi</button>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-brand-orange/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                </div>
                <div className="flex-1 bg-white border-[0.5px] border-slate-200 rounded-2xl p-6 flex flex-col justify-center group cursor-pointer hover:border-brand-orange transition-all">
                  <span className="text-brand-orange font-black text-2xl mb-1 tracking-tighter">500 TL</span>
                  <p className="text-xs font-black text-slate-900 uppercase">Hediye Çeki Fırsatı</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 italic">Minimum 5000 TL alışverişlerde geçerli.</p>
                </div>
              </div>
            </div>

            <FeatureBar />
          </>
        )}

        {/* Main Content Area */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 uppercase">
                {activeCategory || "Sizin İçin Seçtiklerimiz"}
              </h2>
              <p className="text-slate-500 mt-1 text-sm md:text-base font-medium">Senin dünyan, senin tarzın. En iyileri bir araya getirdik.</p>
            </div>
            {activeCategory && (
              <button 
                onClick={() => setActiveCategory(null)}
                className="text-xs font-black text-brand-orange border-2 border-brand-orange/10 px-4 py-2 rounded-full hover:bg-brand-orange/5 transition-all"
              >
                TEMİZLE
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl h-[450px] border-[0.5px] border-slate-200 animate-pulse shadow-sm">
                  <div className="h-2/3 bg-slate-50 rounded-t-xl" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-slate-100 rounded w-1/4" />
                    <div className="h-4 bg-slate-100 rounded w-full" />
                    <div className="h-8 bg-slate-100 rounded w-1/3 mt-auto" />
                  </div>
                </div>
              ))
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, idx) => (
                  <Link href={`/product/${product._id}`} key={product._id}>
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="group bg-white rounded-2xl overflow-hidden border-[0.5px] border-slate-200 hover:border-brand-orange hover:shadow-2xl transition-all duration-500 cursor-pointer flex flex-col h-full"
                    >
                    {/* Image Area */}
                    <div className="relative aspect-[3/4] bg-slate-50 overflow-hidden">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                      
                      {product.discountPercent > 0 && (
                        <div className="absolute top-4 left-4 bg-brand-orange text-white text-[10px] md:text-xs font-black px-2.5 py-1.5 rounded-lg shadow-xl tracking-tighter z-10 animate-in fade-in slide-in-from-left-4 duration-500">
                          -{product.discountPercent}%
                        </div>
                      )}
                      
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-10">
                        <div className="bg-white/90 backdrop-blur-md p-2 rounded-full shadow-lg text-slate-400 hover:text-red-500 transition-colors">
                          <Star size={18} fill="none" />
                        </div>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-4 md:p-5 flex flex-col flex-1">
                      <div className="flex-1">
                        <div className="flex flex-col mb-2">
                          <span className="font-black text-brand-blue text-xs uppercase tracking-widest mb-1">{product.brand}</span>
                          <span className="text-slate-800 text-sm md:text-base font-bold line-clamp-2 leading-tight group-hover:text-brand-orange transition-colors">{product.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 mb-4">
                          <div className="flex items-center gap-0.5 text-yellow-400">
                            <Star size={14} fill="currentColor" />
                            <span className="text-[11px] md:text-xs font-black text-slate-800">{product.rating}</span>
                          </div>
                          <span className="text-[10px] md:text-xs text-slate-400 font-bold tracking-tight uppercase">({product.reviewCount} Değerlendirme)</span>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-brand-orange font-black text-xl md:text-2xl tracking-tighter">
                            {product.price.toLocaleString('tr-TR')} TL
                          </span>
                          {product.originalPrice > product.price && (
                            <span className="text-xs md:text-sm text-slate-300 line-through font-bold">
                              {product.originalPrice.toLocaleString('tr-TR')} TL
                            </span>
                          )}
                        </div>

                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          className="w-full bg-slate-900 text-white py-3.5 rounded-xl text-xs md:text-sm font-black active:scale-[0.97] hover:bg-brand-orange transition-all duration-300 flex items-center justify-center gap-2 group/btn shadow-lg shadow-slate-200 hover:shadow-orange-200"
                        >
                          <ShoppingCart size={18} className="group-hover/btn:scale-110 transition-transform" />
                          SEPETE EKLE
                        </button>
                      </div>
                    </div>
                    </motion.div>
                  </Link>
                ))}
              </AnimatePresence>
            )}
          </div>
          
          {!loading && filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-slate-100 p-8 rounded-full mb-6">
                <ShoppingCart size={48} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Kategoride ürün kalmadı</h3>
              <p className="text-slate-500 mt-2 font-medium max-w-xs">Aradığınız kriterlere uygun ürün bulamadık. Lütfen filtreleri kontrol edin.</p>
              <button 
                onClick={() => setActiveCategory(null)}
                className="mt-8 bg-brand-orange text-white px-8 py-3 rounded-full font-black text-sm shadow-xl hover:shadow-orange-200 active:scale-95 transition-all"
              >
                Tüm Dünyayı Gör
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
