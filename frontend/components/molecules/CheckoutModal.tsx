"use client";

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, MapPin, CheckCircle2, Loader2, ArrowRight, Plus, ShieldCheck, Lock } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useAddressStore, Address } from '@/stores/addressStore';
import { PaymentLogos } from '@/components/molecules/PaymentLogos';
import { apiClient } from '@/lib/api';
import confetti from 'canvas-confetti';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'address' | 'payment' | 'otp' | 'success';

interface InstallmentOption {
  installmentNumber: number;
  label: string;
  totalPrice: number;
  installmentPrice: number;
  hasInterest: boolean;
}

const EMPTY_ADDR: Omit<Address, 'id'> = {
  title: '', fullName: '', phone: '', city: '', district: '', neighborhood: '', fullAddress: '',
};

function formatCardNumber(v: string) {
  const digits = v.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  if (d.length <= 2) return d;
  return d.slice(0, 2) + '/' + d.slice(2);
}
function detectScheme(num: string) {
  const n = num.replace(/\D/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^5[1-5]/.test(n)) return 'MasterCard';
  if (/^9792/.test(n)) return 'Troy';
  if (/^3[47]/.test(n)) return 'Amex';
  return '';
}
const TL = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<Step>('address');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user, token } = useAuthStore();
  const { addresses, selectedId, selectAddress, addAddress, getSelected } = useAddressStore();

  // Adres formu
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrDraft, setAddrDraft] = useState<Omit<Address, 'id'>>(EMPTY_ADDR);

  // Kart formu
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  // Taksit
  const [installments, setInstallments] = useState<InstallmentOption[]>([]);
  const [bankName, setBankName] = useState('');
  const [selectedInstallment, setSelectedInstallment] = useState(1);
  const [binLoading, setBinLoading] = useState(false);

  // 3DS
  const [threeDSSessionId, setThreeDSSessionId] = useState('');
  const [otp, setOtp] = useState('');
  const [paidInfo, setPaidInfo] = useState<any>(null);

  const total = getTotalPrice();
  const scheme = detectScheme(cardNumber);
  const cleanCard = cardNumber.replace(/\s/g, '');

  const selectedInstallmentOption = useMemo(
    () => installments.find((i) => i.installmentNumber === selectedInstallment),
    [installments, selectedInstallment]
  );
  const payableTotal = selectedInstallmentOption?.totalPrice ?? total;

  const reset = () => {
    setStep('address'); setError(null); setCardNumber(''); setCardName(''); setExpiry('');
    setCvc(''); setInstallments([]); setSelectedInstallment(1); setOtp(''); setThreeDSSessionId('');
    setShowAddrForm(false); setAddrDraft(EMPTY_ADDR); setPaidInfo(null);
  };
  const close = () => { onClose(); setTimeout(reset, 300); };

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // Kart BIN girilince taksitleri getir
  const fetchInstallments = async (bin: string) => {
    setBinLoading(true);
    try {
      const res = await apiClient.post('/orders/payment/installments', { binNumber: bin, price: total }, authHeaders);
      const d = res.data?.data;
      setInstallments(d?.installmentOptions || []);
      setBankName(d?.bankName || '');
    } catch {
      setInstallments([]);
    } finally {
      setBinLoading(false);
    }
  };

  const onCardNumberChange = (v: string) => {
    const formatted = formatCardNumber(v);
    setCardNumber(formatted);
    const digits = formatted.replace(/\s/g, '');
    if (digits.length === 6) fetchInstallments(digits.slice(0, 6));
    if (digits.length < 6) { setInstallments([]); setBankName(''); }
  };

  const saveAddress = () => {
    if (!addrDraft.title || !addrDraft.fullName || !addrDraft.city || !addrDraft.fullAddress) {
      setError('Lütfen adres bilgilerini eksiksiz doldurun.');
      return;
    }
    setError(null);
    addAddress(addrDraft);
    setShowAddrForm(false);
    setAddrDraft(EMPTY_ADDR);
  };

  // Ödemeyi başlat → 3DS
  const startPayment = async () => {
    setError(null);
    const [em, ey] = expiry.split('/');
    if (cleanCard.length < 15) return setError('Kart numarası eksik.');
    if (cardName.trim().length < 3) return setError('Kart üzerindeki ismi girin.');
    if (!em || !ey) return setError('Son kullanma tarihini girin.');
    if (cvc.length < 3) return setError('CVC kodunu girin.');

    setLoading(true);
    try {
      const res = await apiClient.post('/orders/payment/init', {
        cardNumber: cleanCard, cardHolderName: cardName, expireMonth: em, expireYear: ey,
        cvc, installment: selectedInstallment, price: total,
        buyer: { name: user?.name }, basketItems: items.map((i) => ({ id: i._id, name: i.name, price: i.price })),
      }, authHeaders);
      const d = res.data?.data;
      setThreeDSSessionId(d.threeDSSessionId);
      setStep('otp');
    } catch (err: any) {
      setError(err?.response?.data?.errorMessage || 'Ödeme başlatılamadı. Kart bilgilerini kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  // 3DS OTP doğrula → ödeme onayı → sipariş oluştur
  const complete3DS = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.post('/orders/payment/3ds/complete', { threeDSSessionId, otp }, authHeaders);
      const pay = res.data?.data;
      setPaidInfo(pay);

      const addr = getSelected();
      const addrStr = addr
        ? `${addr.fullName}, ${addr.fullAddress}, ${addr.district}/${addr.city} (${addr.phone})`
        : 'Adres belirtilmedi';

      await apiClient.post('/orders/checkout', {
        items: items.map((i) => ({
          productId: i._id, name: i.name, price: i.price, barcode: i.barcode,
          quantity: i.quantity, imageUrl: i.imageUrl,
          selectedVariant: i.selectedVariant, selectedServices: i.selectedServices,
        })),
        totalAmount: total,
        address: addrStr,
        paymentDetails: {
          cardLast4: pay.cardLast4, paymentId: pay.paymentId,
          bankName: pay.bankName, cardScheme: pay.cardScheme,
          installment: pay.installment, paidPrice: pay.paidPrice, authCode: pay.authCode,
        },
      }, authHeaders);

      setStep('success');
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#ff6000', '#22c55e', '#3b82f6'] });
      clearCart();
      apiClient.delete('/cart', authHeaders).catch(() => {});
    } catch (err: any) {
      setError(err?.response?.data?.errorMessage || 'Doğrulama başarısız. Kodu kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = { address: 0, payment: 1, otp: 2, success: 3 }[step];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200]" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-[201] w-full max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-white shadow-2xl max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-7 py-5">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-slate-900">
                  {step === 'address' && 'Teslimat Adresi'}
                  {step === 'payment' && 'Ödeme Bilgileri'}
                  {step === 'otp' && '3D Secure Doğrulama'}
                  {step === 'success' && 'Siparişiniz Alındı!'}
                </h2>
                {step !== 'success' && (
                  <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">
                    <Lock size={10} /> iyzico ile güvende
                  </span>
                )}
              </div>
              {step !== 'success' && (
                <button onClick={close} className="rounded-full p-2 transition-colors hover:bg-slate-100"><X size={20} /></button>
              )}
            </div>

            {/* Progress */}
            {step !== 'success' && (
              <div className="flex items-center gap-2 px-7 pt-4">
                {['Adres', 'Ödeme', '3DS'].map((label, i) => (
                  <div key={label} className="flex flex-1 flex-col gap-1">
                    <div className={`h-1.5 rounded-full transition-colors ${i <= stepIndex ? 'bg-[#ff6000]' : 'bg-slate-100'}`} />
                    <span className={`text-[10px] font-bold ${i <= stepIndex ? 'text-[#ff6000]' : 'text-slate-400'}`}>{label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-7 py-6">
              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>
              )}

              {/* ADRES */}
              {step === 'address' && (
                <div className="space-y-4">
                  {addresses.length === 0 && !showAddrForm && (
                    <div className="rounded-2xl border border-dashed border-slate-300 py-8 text-center">
                      <MapPin className="mx-auto mb-2 text-slate-300" size={28} />
                      <p className="text-sm font-semibold text-slate-500">Kayıtlı adresiniz yok. Yeni adres ekleyin.</p>
                    </div>
                  )}
                  {addresses.map((a) => (
                    <button key={a.id} onClick={() => selectAddress(a.id)}
                      className={`flex w-full items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all ${
                        selectedId === a.id ? 'border-[#ff6000] bg-[#ff6000]/5' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div className={`rounded-lg p-2 ${selectedId === a.id ? 'bg-[#ff6000]/10 text-[#ff6000]' : 'bg-slate-100 text-slate-400'}`}>
                        <MapPin size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black uppercase text-slate-900">{a.title}</h4>
                          {selectedId === a.id && <CheckCircle2 size={15} className="text-[#ff6000]" />}
                        </div>
                        <p className="mt-0.5 text-sm font-medium text-slate-500">{a.fullName} · {a.phone}</p>
                        <p className="text-sm font-medium text-slate-500">{a.fullAddress}, {a.district}/{a.city}</p>
                      </div>
                    </button>
                  ))}

                  {showAddrForm ? (
                    <div className="space-y-3 rounded-2xl border border-slate-200 p-5">
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="Adres başlığı (Ev, İş)" value={addrDraft.title}
                          onChange={(e) => setAddrDraft({ ...addrDraft, title: e.target.value })} className="input-cx" />
                        <input placeholder="Ad Soyad" value={addrDraft.fullName}
                          onChange={(e) => setAddrDraft({ ...addrDraft, fullName: e.target.value })} className="input-cx" />
                        <input placeholder="Telefon" value={addrDraft.phone}
                          onChange={(e) => setAddrDraft({ ...addrDraft, phone: e.target.value })} className="input-cx" />
                        <input placeholder="İl" value={addrDraft.city}
                          onChange={(e) => setAddrDraft({ ...addrDraft, city: e.target.value })} className="input-cx" />
                        <input placeholder="İlçe" value={addrDraft.district}
                          onChange={(e) => setAddrDraft({ ...addrDraft, district: e.target.value })} className="input-cx" />
                        <input placeholder="Mahalle" value={addrDraft.neighborhood}
                          onChange={(e) => setAddrDraft({ ...addrDraft, neighborhood: e.target.value })} className="input-cx" />
                      </div>
                      <textarea placeholder="Açık adres (cadde, sokak, no, daire)" rows={2} value={addrDraft.fullAddress}
                        onChange={(e) => setAddrDraft({ ...addrDraft, fullAddress: e.target.value })} className="input-cx w-full" />
                      <div className="flex gap-2">
                        <button onClick={saveAddress} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-[#ff6000]">Adresi Kaydet</button>
                        <button onClick={() => { setShowAddrForm(false); setError(null); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Vazgeç</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowAddrForm(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-4 text-sm font-black text-slate-500 hover:border-[#ff6000] hover:text-[#ff6000]">
                      <Plus size={16} /> Yeni Adres Ekle
                    </button>
                  )}
                </div>
              )}

              {/* ÖDEME (kart + taksit) */}
              {step === 'payment' && (
                <div className="space-y-5">
                  {/* Kart görseli */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white shadow-xl">
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-11 rounded-md bg-gradient-to-br from-amber-300 to-amber-500" />
                      <span className="text-sm font-black italic tracking-wider">{scheme || 'CARD'}</span>
                    </div>
                    <div className="mt-6 font-mono text-lg tracking-[0.15em]">{cardNumber || '•••• •••• •••• ••••'}</div>
                    <div className="mt-4 flex justify-between text-xs">
                      <div>
                        <div className="text-[9px] uppercase opacity-50">Kart Sahibi</div>
                        <div className="font-bold uppercase">{cardName || 'AD SOYAD'}</div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase opacity-50">SKT</div>
                        <div className="font-bold">{expiry || 'AA/YY'}</div>
                      </div>
                    </div>
                    {bankName && <div className="mt-3 text-[10px] font-bold text-white/70">{bankName}</div>}
                  </div>

                  {/* Kart alanları */}
                  <div className="grid grid-cols-2 gap-3">
                    <input inputMode="numeric" placeholder="Kart Numarası" value={cardNumber}
                      onChange={(e) => onCardNumberChange(e.target.value)} className="input-cx col-span-2" />
                    <input placeholder="Kart Üzerindeki İsim" value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())} className="input-cx col-span-2" />
                    <input inputMode="numeric" placeholder="AA/YY" value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))} className="input-cx" />
                    <input inputMode="numeric" placeholder="CVC" value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} className="input-cx" />
                  </div>

                  {/* Taksit seçenekleri */}
                  {binLoading && <p className="text-xs font-semibold text-slate-400">Taksit seçenekleri yükleniyor…</p>}
                  {installments.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Taksit Seçenekleri</h4>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {installments.map((opt) => (
                          <button key={opt.installmentNumber} onClick={() => setSelectedInstallment(opt.installmentNumber)}
                            className={`rounded-xl border-2 p-2.5 text-left transition-all ${
                              selectedInstallment === opt.installmentNumber ? 'border-[#ff6000] bg-[#ff6000]/5' : 'border-slate-200 hover:border-slate-300'}`}>
                            <div className="text-xs font-black text-slate-800">{opt.label}</div>
                            <div className="text-[11px] font-bold text-slate-500">
                              {opt.installmentNumber > 1 ? `${TL(opt.installmentPrice)} x ${opt.installmentNumber}` : TL(opt.totalPrice)}
                            </div>
                            {opt.hasInterest && <div className="text-[9px] font-bold text-amber-600">+ vade farkı</div>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span className="text-sm font-bold text-slate-600">Ödenecek Tutar</span>
                    <span className="text-xl font-black text-[#ff6000]">{TL(payableTotal)}</span>
                  </div>
                  <PaymentLogos className="justify-center pt-1" />
                </div>
              )}

              {/* 3DS OTP */}
              {step === 'otp' && (
                <div className="space-y-5 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <ShieldCheck size={30} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Bankanızdan gelen kodu girin</h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {bankName || 'Bankanız'} tarafından telefonunuza gönderilen tek kullanımlık şifre.
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-400">(Demo doğrulama kodu: 123456)</p>
                  </div>
                  <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="______" maxLength={6}
                    className="mx-auto w-48 rounded-xl border-2 border-slate-200 bg-slate-50 py-3 text-center text-2xl font-black tracking-[0.5em] outline-none focus:border-[#ff6000]" />
                </div>
              )}

              {/* SUCCESS */}
              {step === 'success' && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center py-6 text-center">
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <CheckCircle2 size={44} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Ödeme Başarılı!</h3>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    {paidInfo?.installment > 1 ? `${paidInfo.installment} taksit ile ` : ''}
                    {paidInfo?.bankName} · {paidInfo?.cardScheme} · **** {paidInfo?.cardLast4}
                  </p>
                  <div className="mt-4 rounded-xl bg-slate-50 px-5 py-3 text-sm">
                    <span className="font-bold text-slate-500">Ödenen Tutar: </span>
                    <span className="font-black text-slate-900">{TL(paidInfo?.paidPrice || total)}</span>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-slate-400">İşlem No: {paidInfo?.paymentId} · Onay: {paidInfo?.authCode}</p>
                  <button onClick={close} className="mt-6 rounded-xl bg-slate-900 px-8 py-3 font-black text-white hover:bg-[#ff6000]">
                    Alışverişe Devam Et
                  </button>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            {step !== 'success' && (
              <div className="flex gap-3 border-t border-slate-100 px-7 py-4">
                {step === 'payment' && (
                  <button onClick={() => { setStep('address'); setError(null); }}
                    className="flex-1 rounded-2xl border border-slate-200 py-3.5 font-black text-slate-600 hover:bg-slate-50">Geri</button>
                )}
                {step === 'otp' && (
                  <button onClick={() => { setStep('payment'); setError(null); setOtp(''); }}
                    className="flex-1 rounded-2xl border border-slate-200 py-3.5 font-black text-slate-600 hover:bg-slate-50">Geri</button>
                )}
                <button
                  disabled={loading || (step === 'address' && !selectedId) || (step === 'otp' && otp.length < 6)}
                  onClick={() => {
                    if (step === 'address') setStep('payment');
                    else if (step === 'payment') startPayment();
                    else if (step === 'otp') complete3DS();
                  }}
                  className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 font-black text-white transition-all hover:bg-[#ff6000] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      {step === 'address' && 'Ödemeye Geç'}
                      {step === 'payment' && `${TL(payableTotal)} Öde`}
                      {step === 'otp' && 'Doğrula ve Öde'}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
