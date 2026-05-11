"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

interface Order {
  _id: string;
  userId: string;
  items: { name: string; quantity: number }[];
  totalAmount: number;
  status: string;
  address: string;
  createdAt: string;
}

const KARGO_STAGES = ["PAID", "SHIPPED", "DELIVERED"];

const STAGE_LABEL: Record<string, string> = {
  PAID: "Hazirlaniyor",
  SHIPPED: "Kargoya Verildi",
  DELIVERED: "Teslim Edildi",
};

const STAGE_COLOR: Record<string, string> = {
  PAID: "bg-blue-500",
  SHIPPED: "bg-purple-500",
  DELIVERED: "bg-green-500",
};

const MOCK_CARRIERS = ["Yurtici Kargo", "MNG Kargo", "Aras Kargo", "PTT Kargo", "Suredas"];

function trackingCode(orderId: string) {
  return `TRK${orderId.slice(-10).toUpperCase()}`;
}

export default function KargoPage() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Tumu");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get("/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setOrders(res.data?.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const shippable = orders.filter((o) => ["PAID", "SHIPPED", "DELIVERED"].includes(o.status));

  const filtered = shippable.filter((o) => {
    const matchStatus = statusFilter === "Tumu" || o.status === statusFilter;
    const matchSearch = o._id.toLowerCase().includes(search.toLowerCase()) ||
      o.address?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleAdvance = async (order: Order) => {
    const idx = KARGO_STAGES.indexOf(order.status);
    if (idx >= KARGO_STAGES.length - 1) return;
    const nextStatus = KARGO_STAGES[idx + 1];
    setUpdating(order._id);
    try {
      await apiClient.patch(`/orders/${order._id}/status`, { status: nextStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders((prev) => prev.map((o) => o._id === order._id ? { ...o, status: nextStatus } : o));
    } catch {
      setOrders((prev) => prev.map((o) => o._id === order._id ? { ...o, status: nextStatus } : o));
    } finally {
      setUpdating(null);
    }
  };

  const carrierFor = (id: string) => MOCK_CARRIERS[parseInt(id.slice(-2), 16) % MOCK_CARRIERS.length];

  const counts = {
    PAID: shippable.filter((o) => o.status === "PAID").length,
    SHIPPED: shippable.filter((o) => o.status === "SHIPPED").length,
    DELIVERED: shippable.filter((o) => o.status === "DELIVERED").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Kargo Durumu</h2>
        <p className="text-sm text-slate-500 mt-1">Gonderi ve kargo akisi yonetimi</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {KARGO_STAGES.map((s) => (
          <div key={s} className={`rounded-xl p-5 text-white ${STAGE_COLOR[s]}`}>
            <p className="text-xs font-bold uppercase tracking-wide text-white/80">{STAGE_LABEL[s]}</p>
            <p className="mt-2 text-4xl font-black">{counts[s as keyof typeof counts]}</p>
            <p className="mt-1 text-xs text-white/70">siparis</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {["Tumu", ...KARGO_STAGES].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold border transition-colors ${
              statusFilter === s ? "bg-[#ff6000] text-white border-[#ff6000]" : "bg-white text-slate-600 border-slate-200 hover:border-[#ff6000]"
            }`}
          >
            {s === "Tumu" ? "Tumu" : STAGE_LABEL[s]}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Siparis ID ara..."
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs outline-none focus:border-[#ff6000] w-56"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-white" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="rounded-xl bg-white p-16 text-center text-slate-400 font-semibold shadow-sm border border-slate-100">
              Kargo siparisi bulunamadi.
            </div>
          )}
          {filtered.map((order) => {
            const stageIdx = KARGO_STAGES.indexOf(order.status);
            const carrier = carrierFor(order._id);
            const tracking = trackingCode(order._id);
            return (
              <div key={order._id} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <p className="font-mono text-sm font-bold text-slate-700">{order._id.slice(-8).toUpperCase()}</p>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold text-white ${STAGE_COLOR[order.status]}`}>
                        {STAGE_LABEL[order.status]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-1 truncate">{order.address}</p>
                    <p className="text-xs text-slate-400">
                      {carrier} — Takip: <span className="font-mono font-bold text-slate-600">{tracking}</span>
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-1">
                      {KARGO_STAGES.map((stage, i) => (
                        <div key={stage} className="flex flex-1 flex-col items-center gap-1">
                          <div className={`h-2 w-full rounded-full ${i <= stageIdx ? STAGE_COLOR[stage] : "bg-slate-200"}`} />
                          <p className={`text-[10px] font-semibold ${i <= stageIdx ? "text-slate-700" : "text-slate-400"}`}>
                            {STAGE_LABEL[stage].split(" ")[0]}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <p className="font-black text-slate-800">{order.totalAmount.toLocaleString("tr-TR")} TL</p>
                    {order.status !== "DELIVERED" && (
                      <button
                        onClick={() => handleAdvance(order)}
                        disabled={updating === order._id}
                        className="rounded-lg bg-[#ff6000] px-3 py-1.5 text-xs font-black text-white disabled:opacity-60 hover:bg-[#d85000] transition-colors"
                      >
                        {updating === order._id ? "..." : order.status === "PAID" ? "Kargoya Ver" : "Teslim Edildi"}
                      </button>
                    )}
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
