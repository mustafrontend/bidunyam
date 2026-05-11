"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { motion } from "framer-motion";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { Star, ShoppingCart, ArrowLeft, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import Link from "next/link";

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

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  
  const addItem = useCartStore((state) => state.addItem);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await apiClient.get(`/products/${id}`);
        setProduct(res.data.data);
      } catch (err) {
        console.error("Failed to fetch product", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2 aspect-square bg-slate-200 rounded-2xl" />
          <div className="w-full md:w-1/2 space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/4" />
            <div className="h-12 bg-slate-200 rounded w-3/4" />
            <div className="h-24 bg-slate-200 rounded w-full" />
            <div className="h-12 bg-slate-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return <div className="text-center py-20 font-black">Ürün bulunamadı.</div>;

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Navigation */}
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-brand-orange font-bold text-sm mb-8 transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Geri Dön
        </button>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 bg-white rounded-3xl p-6 md:p-10 border-[0.5px] border-slate-200 shadow-sm">
          {/* Left: Image Container */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full md:w-1/2 aspect-square rounded-2xl overflow-hidden bg-slate-50 relative"
          >
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.discountPercent > 0 && (
              <div className="absolute top-6 left-6 bg-brand-orange text-white text-sm font-black px-4 py-2 rounded-xl shadow-xl">
                -{product.discountPercent}% İndirim
              </div>
            )}
          </motion.div>

          {/* Right: Info Container */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full md:w-1/2 flex flex-col"
          >
            <div className="mb-6">
              <span className="text-brand-orange font-black uppercase tracking-widest text-sm mb-2 block">{product.brand}</span>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-4 tracking-tight">{product.name}</h1>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star fill="currentColor" size={20} />
                  <span className="text-slate-900 font-black text-lg">{product.rating}</span>
                </div>
                <span className="text-slate-400 font-bold border-l pl-4">{product.reviewCount} Değerlendirme</span>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-slate-600 leading-relaxed font-medium">
                {product.description}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 mb-8 flex items-center justify-between">
              <div>
                {product.originalPrice > product.price && (
                  <span className="text-slate-400 line-through font-bold text-lg block mb-1">
                    {product.originalPrice.toLocaleString('tr-TR')} TL
                  </span>
                )}
                <span className="text-brand-orange text-4xl font-black tracking-tighter">
                  {product.price.toLocaleString('tr-TR')} TL
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kategori</span>
                <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter">
                  {product.category}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4 mb-10">
              <button 
                onClick={() => addItem(product, token)}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl text-base font-black hover:bg-brand-orange active:scale-[0.98] transition-all duration-300 shadow-xl flex items-center justify-center gap-3 group"
              >
                <ShoppingCart size={22} className="group-hover:animate-bounce" />
                SEPETE EKLE
              </button>
            </div>

            {/* Features/Trust Badges */}
            <div className="grid grid-cols-3 gap-4 border-t pt-8">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                  <Truck size={20} />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Hızlı Teslimat</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                  <ShieldCheck size={20} />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Güvenli Ödeme</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                  <RotateCcw size={20} />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Kolay İade</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
