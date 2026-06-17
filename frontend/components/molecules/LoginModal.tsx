"use client";

import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, Loader2, User, Phone, ArrowRight } from 'lucide-react';
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
  const [mode, setMode] = useState<'giris' | 'kayit'>('giris');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const setAuth = useAuthStore((state) => state.setAuth);
  const fetchFavorites = useFavoriteStore((state) => state.fetchFavorites);

  // Form modları arasında geçiş yapıldığında hataları temizle
  useEffect(() => {
    setError(null);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);

    try {
      if (mode === 'kayit') {
        // Kayıt işlemini gerçekleştir
        await apiClient.post('/auth/register', { name, email, password });
        // Kayıt başarılıysa otomatik giriş yap
        const loginRes = await apiClient.post('/auth/login', { email, password });
        setAuth(loginRes.data.data.user, loginRes.data.data.token);
        
        await useCartStore.getState().fetchCart(loginRes.data.data.token);
        await fetchFavorites(loginRes.data.data.token);
        
        onClose();
      } else {
        // Normal giriş işlemi
        const res = await apiClient.post('/auth/login', { email, password });
        setAuth(res.data.data.user, res.data.data.token);
        
        // 🛒 Sync cart from Redis & fetch wishlists
        await useCartStore.getState().fetchCart(res.data.data.token);
        await fetchFavorites(res.data.data.token);
        
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'İşlem başarısız. Bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop: Premium Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[100]"
          />
          
          {/* Modal Card: Responsive & Fluid Layout */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12, translateX: "-50%", translateY: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0, translateX: "-50%", translateY: "-50%" }}
            exit={{ opacity: 0, scale: 0.96, y: 12, translateX: "-50%", translateY: "-50%" }}
            transition={{ ease: [0.215, 0.610, 0.355, 1], duration: 0.4 }}
            className="fixed left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-md bg-white rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.12)] border border-slate-100 z-[101] overflow-hidden"
          >
            <div className="p-6 sm:p-8 md:p-10">
              
              {/* Header Segment */}
              <div className="flex items-start justify-between mb-8 select-none">
                <div className="space-y-1">
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                    {mode === 'giris' ? 'Giriş Yap' : 'Hesap Oluştur'}
                  </h2>
                  <p className="text-slate-400 text-xs font-medium">
                    {mode === 'giris' ? 'BiDünyam ayrıcalıklarına kaldığın yerden devam et.' : 'Aramıza katıl ve benzersiz fırsatları yakala.'}
                  </p>
                </div>
                <button 
                  onClick={onClose} 
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all duration-200 cursor-pointer active:scale-90"
                  aria-label="Kapat"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>

              {/* Error Feed Panel */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-2"
                >
                  <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-red-500 animate-pulse" />
                  <p>{error}</p>
                </motion.div>
              )}

              {/* Dynamic Authentication Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {mode === 'kayit' && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      {/* Full Name Input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Ad Soyad</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                            <User size={16} strokeWidth={2} />
                          </div>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Adınız Soyadınız"
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-50"
                            required
                          />
                        </div>
                      </div>
                      
                      {/* Phone Input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Telefon Numarası</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                            <Phone size={16} strokeWidth={2} />
                          </div>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="05XX XXX XX XX"
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-50"
                            required
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">E-Posta Adresi</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                      <Mail size={16} strokeWidth={2} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Örn: mustafa@demo.com"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-50"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Şifre</label>
                    {mode === 'giris' && (
                      <button type="button" className="text-[10px] font-semibold text-slate-400 hover:text-[#ff5000] transition-colors cursor-pointer">
                        Şifremi Unuttum
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                      <Lock size={16} strokeWidth={2} />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-50"
                      required
                    />
                  </div>
                </div>

                {/* Core Form Action Primary Trigger */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-950 text-white py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider active:scale-[0.98] hover:bg-[#ff5000] transition-all duration-300 flex items-center justify-center gap-2 shadow-md shadow-slate-950/5 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <>
                        <span>{mode === 'giris' ? 'Giriş Yap' : 'Kayıt Ol'}</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Decorative Divider Node */}
              <div className="relative my-7 select-none">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                  <span className="bg-white px-3 text-slate-300">Veya</span>
                </div>
              </div>

              {/* OAuth Google Auxiliary Action */}
              <button
                type="button"
                className="w-full bg-white border border-slate-200/80 text-slate-700 py-3 rounded-2xl text-xs font-semibold active:scale-[0.98] hover:bg-slate-50 transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer"
                onClick={() => setError('Google ile entegrasyon şu an yapım aşamasındadır.')}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Google ile {mode === 'giris' ? 'Giriş Yap' : 'Devam Et'}</span>
              </button>

              {/* Bottom Mode Switcher Node */}
              <div className="mt-8 text-center select-none">
                {mode === 'giris' ? (
                  <p className="text-slate-400 text-xs font-medium">
                    Hesabınız yok mu? <button type="button" onClick={() => setMode('kayit')} className="text-[#ff5000] font-bold cursor-pointer hover:underline underline-offset-2 ml-0.5">Hemen Kaydolun</button>
                  </p>
                ) : (
                  <p className="text-slate-400 text-xs font-medium">
                    Zaten üye misiniz? <button type="button" onClick={() => setMode('giris')} className="text-[#ff5000] font-bold cursor-pointer hover:underline underline-offset-2 ml-0.5">Giriş Yapın</button>
                  </p>
                )}
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};