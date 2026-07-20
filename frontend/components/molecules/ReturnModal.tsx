"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, CheckCircle2, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

interface OrderItem { name: string; price: number; quantity: number; imageUrl?: string; }
interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  items: OrderItem[];
  onSuccess?: () => void;
}

const REASONS = [
  "Beğenmedim / vazgeçtim",
  "Ürün hasarlı / kusurlu geldi",
  "Yanlış ürün gönderildi",
  "Beden / ölçü uymadı",
  "Üründe eksik parça var",
  "Ürün açıklamayla uyuşmuyor",
  "Diğer",
];

export const ReturnModal: React.FC<ReturnModalProps> = ({ isOpen, onClose, orderId, items, onSuccess }) => {
  const token = useAuthStore((s) => s.token);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const submit = async () => {
    if (!reason) { setError("Lütfen bir iade nedeni seçin."); return; }
    setError(null);
    setLoading(true);
    try {
      await apiClient.post("/orders/returns", { orderId, reason, description }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDone(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.response?.data?.message || "İade talebi oluşturulamadı.");
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    onClose();
    setTimeout(() => { setReason(""); setDescription(""); setDone(false); setError(null); }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close} className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-[201] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-rose-50 p-2 text-rose-500"><RotateCcw size={18} /></div>
                <h2 className="text-lg font-black text-slate-900">İade Talebi</h2>
              </div>
              <button onClick={close} className="rounded-full p-2 hover:bg-slate-100"><X size={18} /></button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              {done ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">İade Talebiniz Alındı</h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Talebiniz satıcı onayına gönderildi. Onaylandığında iade kargo kodunuz oluşturulacak ve buradan takip edebileceksiniz.
                  </p>
                  <button onClick={close} className="mt-5 rounded-xl bg-slate-900 px-6 py-2.5 font-black text-white hover:bg-[#ff6000]">
                    Tamam
                  </button>
                </div>
              ) : (
                <>
                  {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

                  {/* İade edilecek ürünler */}
                  <div className="mb-5 space-y-2">
                    <span className="text-xs font-black uppercase tracking-wide text-slate-400">İade Edilecek Ürünler</span>
                    {items.map((it, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5">
                        {it.imageUrl && <img src={it.imageUrl} alt={it.name} className="h-11 w-11 rounded-lg object-cover bg-slate-50" />}
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-bold text-slate-800">{it.name}</p>
                          <p className="text-xs font-medium text-slate-400">{it.quantity} adet · {(it.price * it.quantity).toLocaleString("tr-TR")} TL</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* İade nedeni */}
                  <div className="mb-4">
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-400">İade Nedeni</label>
                    <select value={reason} onChange={(e) => setReason(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]">
                      <option value="">Neden seçin</option>
                      {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  <div className="mb-5">
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-400">Açıklama (opsiyonel)</label>
                    <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                      placeholder="İade nedeninizi detaylandırabilirsiniz…"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]" />
                  </div>

                  <div className="mb-5 flex items-center justify-between rounded-xl bg-rose-50/60 px-4 py-3">
                    <span className="text-sm font-bold text-slate-600">İade Tutarı</span>
                    <span className="text-lg font-black text-rose-600">{total.toLocaleString("tr-TR")} TL</span>
                  </div>

                  <button onClick={submit} disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 font-black text-white transition-all hover:bg-[#ff6000] disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <><RotateCcw size={18} /> İade Talebi Oluştur</>}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
