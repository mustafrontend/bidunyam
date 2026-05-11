"use client";

import React, { useState } from 'react';
import { X, Mail, Lock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useFavoriteStore } from '@/stores/favoriteStore';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const setAuth = useAuthStore((state) => state.setAuth);
  const fetchFavorites = useFavoriteStore((state) => state.fetchFavorites);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post('/auth/login', { email, password });
      setAuth(res.data.data.user, res.data.data.token);
      
      // 🛒 Sync cart from Redis
      await useCartStore.getState().fetchCart(res.data.data.token);
      await fetchFavorites(res.data.data.token);
      
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-100"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-101 overflow-hidden"
          >
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">Giriş Yap</h2>
                  <p className="text-slate-500 text-sm font-medium mt-1">Trendyol Demo dünyasına hoş geldiniz.</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-[0.5px] border-red-200 text-red-600 text-xs font-bold rounded-lg animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider pl-1">E-Posta</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ali@demo.com veya mustafa@demo.com"
                      className="w-full bg-slate-50 border-[0.5px] border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-brand-orange outline-none transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider pl-1">Şifre</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="123"
                      className="w-full bg-slate-50 border-[0.5px] border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-brand-orange outline-none transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl text-sm font-black active:scale-[0.98] hover:bg-brand-orange transition-all duration-300 flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'GİRİŞ YAP'}
                  </button>
                </div>
              </form>

              <div className="mt-8 text-center">
                <p className="text-slate-400 text-xs font-bold">
                  Üye değil misiniz? <span className="text-brand-orange cursor-pointer hover:underline">Hemen Kaydolun</span>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
