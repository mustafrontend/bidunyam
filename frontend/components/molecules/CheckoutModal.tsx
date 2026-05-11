"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, MapPin, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api';
import confetti from 'canvas-confetti';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'address' | 'payment' | 'success'>('address');
  const [loading, setLoading] = useState(false);
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user, token } = useAuthStore();

  const handlePayment = async () => {
    setLoading(true);
    // Simulate payment delay
    await new Promise(r => setTimeout(r, 2000));

    try {
      await apiClient.post('/orders/checkout', {
        items: items.map(i => ({
          productId: i._id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          imageUrl: i.imageUrl,
          selectedVariant: i.selectedVariant,
          selectedServices: i.selectedServices,
        })),
        totalAmount: getTotalPrice(),
        address: "Kadıköy, İstanbul / Türkiye",
        paymentDetails: {
          cardLast4: "4242",
          paymentId: "PAY-" + Math.random().toString(36).substr(2, 9).toUpperCase()
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStep('success');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff6000', '#22c55e', '#3b82f6']
      });
      
      // Clear cart locally and on Redis
      clearCart();
      if (token) {
        await apiClient.delete('/cart', {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error("Checkout failed", err);
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
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-200"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-3xl shadow-2xl z-201 overflow-hidden"
          >
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  {step === 'address' && 'Teslimat Adresi'}
                  {step === 'payment' && 'Ödeme Bilgileri'}
                  {step === 'success' && 'Siparişiniz Alındı!'}
                </h2>
                {step !== 'success' && (
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              {step !== 'success' && (
                <div className="flex items-center gap-4 mb-10">
                  <div className={`flex-1 h-1.5 rounded-full transition-colors ${step === 'address' || step === 'payment' ? 'bg-brand-orange' : 'bg-slate-100'}`} />
                  <div className={`flex-1 h-1.5 rounded-full transition-colors ${step === 'payment' ? 'bg-brand-orange' : 'bg-slate-100'}`} />
                </div>
              )}

              {/* Steps Content */}
              <div className="min-h-75">
                {step === 'address' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-2xl border-2 border-brand-orange flex items-start gap-4">
                      <div className="bg-brand-orange/10 p-2 rounded-lg text-brand-orange">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm uppercase mb-1">Ev Adresim</h4>
                        <p className="text-slate-500 text-sm font-medium">Caferağa Mah. Moda Cad. No:123 Daire:4 Kadıköy/İstanbul</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border-[0.5px] border-slate-200 flex items-start gap-4 opacity-60">
                      <div className="bg-slate-200 p-2 rounded-lg text-slate-500">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm uppercase mb-1">İş Adresim</h4>
                        <p className="text-slate-500 text-sm font-medium">Levent Plaza Kat:12 No:45 Beşiktaş/İstanbul</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 'payment' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                      <CreditCard className="mb-8 opacity-50" size={32} />
                      <div className="space-y-4">
                        <div className="text-xl font-medium tracking-[0.2em]">**** **** **** 4242</div>
                        <div className="flex justify-between items-end">
                          <div>
                            <div className="text-[10px] uppercase font-bold opacity-50 mb-1">Kart Sahibi</div>
                            <div className="text-sm font-black uppercase">{user?.name}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold opacity-50 mb-1">Son Kullanma</div>
                            <div className="text-sm font-black">12/28</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border-[0.5px] border-slate-200 flex justify-between items-center">
                      <span className="font-bold text-slate-600">Ödenecek Tutar</span>
                      <span className="font-black text-brand-orange text-xl">{getTotalPrice().toLocaleString('tr-TR')} TL</span>
                    </div>
                  </motion.div>
                )}

                {step === 'success' && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    className="flex flex-col items-center justify-center py-8 text-center"
                  >
                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Harika! Siparişiniz Hazırlanıyor</h3>
                    <p className="text-slate-500 font-medium mb-8">
                      Sipariş numaranız: <span className="font-black text-slate-900">#TY-{Math.floor(Math.random()*1000000)}</span><br/>
                      Detayları e-posta adresinize gönderdik.
                    </p>
                    <button 
                      onClick={onClose}
                      className="bg-slate-900 text-white px-8 py-4 rounded-xl font-black shadow-lg hover:bg-brand-orange transition-all"
                    >
                      ALIŞVERİŞE DEVAM ET
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Footer Actions */}
              {step !== 'success' && (
                <div className="mt-10 flex gap-4">
                  {step === 'payment' && (
                    <button 
                      onClick={() => setStep('address')}
                      className="flex-1 border-[0.5px] border-slate-200 py-4 rounded-2xl font-black text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      GERİ
                    </button>
                  )}
                  <button 
                    disabled={loading}
                    onClick={step === 'address' ? () => setStep('payment') : handlePayment}
                    className="flex-2 bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-brand-orange active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        {step === 'address' ? 'ÖDEME ADIMINA GEÇ' : 'ÖDEMEYİ TAMAMLA'}
                        <ArrowRight size={20} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
