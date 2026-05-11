"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { CheckoutModal } from "@/components/molecules/CheckoutModal";
import { LoginModal } from "@/components/molecules/LoginModal";
import Link from "next/link";

export default function CartPage() {
  const { items, addItem, removeItem, getTotalPrice, getTotalItems } = useCartStore();
  const { token, isAuthenticated } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleCheckoutClick = () => {
    if (isAuthenticated()) {
      setIsCheckoutOpen(true);
    } else {
      setIsLoginOpen(true);
    }
  };

  if (!isMounted) return null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
        <div className="bg-slate-100 p-8 rounded-full mb-6">
          <ShoppingBag size={48} className="text-slate-400" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Sepetiniz şu an boş</h1>
        <p className="text-slate-500 font-medium mb-8">Sepetinizde ürün bulunamadı. Hemen alışverişe başlayın!</p>
        <Link href="/">
          <button className="bg-brand-orange text-white px-8 py-4 rounded-xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all">
            ALIŞVERİŞE BAŞLA
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <h1 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Sepetim ({getTotalItems()})</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white p-4 md:p-6 rounded-2xl border-[0.5px] border-slate-200 flex flex-col md:flex-row items-center gap-6 shadow-sm"
                >
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-24 h-32 object-cover rounded-xl bg-slate-50"
                  />
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="font-black text-slate-900 text-lg mb-1">{item.name}</h3>
                    <p className="text-slate-400 text-sm font-bold mb-4">{item.brand}</p>
                    <div className="flex items-center justify-center md:justify-start gap-4">
                      <div className="flex items-center bg-slate-100 rounded-lg p-1 border-[0.5px] border-slate-200">
                        <button onClick={() => removeItem(item._id, token)} className="p-1.5 hover:bg-white rounded-md transition-colors text-slate-600">
                          <Minus size={16} />
                        </button>
                        <span className="w-10 text-center font-black text-sm">{item.quantity}</span>
                        <button onClick={() => addItem(item, token)} className="p-1.5 hover:bg-white rounded-md transition-colors text-slate-600">
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="text-center md:text-right flex flex-col items-center md:items-end gap-2 min-w-[120px]">
                    <span className="text-xl font-black text-brand-orange tracking-tighter">
                      {(item.price * item.quantity).toLocaleString('tr-TR')} TL
                    </span>
                    <button onClick={() => removeItem(item._id, token)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="w-full lg:w-[380px]">
            <div className="bg-white p-6 md:p-8 rounded-3xl border-[0.5px] border-slate-200 shadow-xl sticky top-28">
              <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">Sipariş Özeti</h2>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-slate-500 font-bold">
                  <span>Ürün Toplamı</span>
                  <span>{getTotalPrice().toLocaleString('tr-TR')} TL</span>
                </div>
                <div className="flex justify-between text-slate-500 font-bold">
                  <span>Kargo Toplamı</span>
                  <span className="text-green-600">Bedava</span>
                </div>
                <div className="border-t border-dashed pt-4 flex justify-between">
                  <span className="text-lg font-black text-slate-900">Toplam</span>
                  <span className="text-2xl font-black text-brand-orange tracking-tighter">
                    {getTotalPrice().toLocaleString('tr-TR')} TL
                  </span>
                </div>
              </div>

              <button 
                onClick={handleCheckoutClick}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl text-base font-black hover:bg-brand-orange active:scale-[0.98] transition-all duration-300 shadow-xl flex items-center justify-center gap-3 uppercase tracking-tighter"
              >
                Sepeti Onayla
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
