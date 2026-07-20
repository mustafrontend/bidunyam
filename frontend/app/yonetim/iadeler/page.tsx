"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useSellerAuthStore } from "@/stores/sellerAuthStore";
import { RotateCcw, Check, X, Banknote, Truck } from "lucide-react";

interface ReturnItem { name: string; price: number; quantity: number; imageUrl?: string; }
interface ReturnReq {
  _id: string;
  orderId: string;
  userId: string;
  items: ReturnItem[];
  reason: string;
  description?: string;
  status: string;
  refundAmount: number;
  rejectReason?: string;
  returnShipment?: { carrier?: string; trackingNumber?: string };
  createdAt: string;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  REQUESTED: { label: "Talep Alındı", cls: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Onaylandı — Kargoda", cls: "bg-blue-100 text-blue-700" },
  IN_RETURN_TRANSIT: { label: "İade Yolda", cls: "bg-indigo-100 text-indigo-700" },
  REFUNDED: { label: "Para İadesi Yapıldı", cls: "bg-green-100 text-green-700" },
  REJECTED: { label: "Reddedildi", cls: "bg-red-100 text-red-600" },
};

export default function IadelerPage() {
  const { token } = useSellerAuthStore();
  const [returns, setReturns] = useState<ReturnReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState("Tümü");

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const load = () => {
    setLoading(true);
    apiClient.get("/orders/returns", authHeaders)
      .then((res) => setReturns(res.data?.data || []))
      .catch(() => setReturns([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { if (token) load(); /* eslint-disable-next-line */ }, [token]);

  const act = async (id: string, action: "approve" | "reject" | "refund") => {
    setBusy(id);
    try {
      const body = action === "reject" ? { rejectReason: "Ürün iade koşullarını sağlamıyor" } : {};
      const res = await apiClient.post(`/orders/returns/${id}/${action}`, body, authHeaders);
      setReturns((prev) => prev.map((r) => r._id === id ? res.data.data : r));
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(null);
    }
  };

  const filtered = filter === "Tümü" ? returns : returns.filter((r) => r.status === filter);
  const counts = {
    REQUESTED: returns.filter((r) => r.status === "REQUESTED").length,
    APPROVED: returns.filter((r) => ["APPROVED", "IN_RETURN_TRANSIT"].includes(r.status)).length,
    REFUNDED: returns.filter((r) => r.status === "REFUNDED").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-800">İade Yönetimi</h2>
        <p className="mt-1 text-sm text-slate-500">Müşteri iade taleplerini onaylayın, iade kargosu oluşturun ve para iadesi yapın.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-amber-500 p-5 text-white">
          <p className="text-xs font-bold uppercase text-white/80">Bekleyen Talep</p>
          <p className="mt-2 text-4xl font-black">{counts.REQUESTED}</p>
        </div>
        <div className="rounded-xl bg-blue-500 p-5 text-white">
          <p className="text-xs font-bold uppercase text-white/80">İşlemde</p>
          <p className="mt-2 text-4xl font-black">{counts.APPROVED}</p>
        </div>
        <div className="rounded-xl bg-green-500 p-5 text-white">
          <p className="text-xs font-bold uppercase text-white/80">İade Tamamlanan</p>
          <p className="mt-2 text-4xl font-black">{counts.REFUNDED}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["Tümü", "REQUESTED", "APPROVED", "REFUNDED", "REJECTED"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-colors ${
              filter === s ? "border-[#ff6000] bg-[#ff6000] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-[#ff6000]"
            }`}>
            {s === "Tümü" ? "Tümü" : STATUS[s]?.label || s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-white" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-100 bg-white p-16 text-center font-semibold text-slate-400">
          <RotateCcw className="mx-auto mb-3 opacity-30" size={32} />
          İade talebi bulunamadı.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const cfg = STATUS[r.status] || STATUS.REQUESTED;
            return (
              <div key={r._id} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <span className="font-mono text-sm font-bold text-slate-700">#{r.orderId.slice(-8).toUpperCase()}</span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${cfg.cls}`}>{cfg.label}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700">{r.reason}</p>
                    {r.description && <p className="mt-0.5 text-xs text-slate-500">{r.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {r.items.map((it, i) => (
                        <span key={i} className="rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500">
                          {it.name} ×{it.quantity}
                        </span>
                      ))}
                    </div>
                    {r.returnShipment?.trackingNumber && (
                      <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-slate-500">
                        <Truck size={12} /> {r.returnShipment.carrier} · {r.returnShipment.trackingNumber}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <p className="text-lg font-black text-rose-600">{r.refundAmount.toLocaleString("tr-TR")} TL</p>
                    <div className="flex gap-2">
                      {r.status === "REQUESTED" && (
                        <>
                          <button onClick={() => act(r._id, "approve")} disabled={busy === r._id}
                            className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50">
                            <Check size={13} /> Onayla
                          </button>
                          <button onClick={() => act(r._id, "reject")} disabled={busy === r._id}
                            className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-black text-red-600 hover:bg-red-50 disabled:opacity-50">
                            <X size={13} /> Reddet
                          </button>
                        </>
                      )}
                      {["APPROVED", "IN_RETURN_TRANSIT"].includes(r.status) && (
                        <button onClick={() => act(r._id, "refund")} disabled={busy === r._id}
                          className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-black text-white hover:bg-green-700 disabled:opacity-50">
                          <Banknote size={13} /> Para İadesi Yap
                        </button>
                      )}
                      {r.status === "REFUNDED" && <span className="text-xs font-black text-green-600">✓ Tamamlandı</span>}
                      {r.status === "REJECTED" && <span className="text-xs font-black text-red-500">Reddedildi</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
