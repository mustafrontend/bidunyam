"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useSellerAuthStore } from "@/stores/sellerAuthStore";

interface TrackingEvent { status: string; label: string; location?: string; timestamp: string; }
interface Shipment {
  carrier?: string;
  trackingNumber?: string;
  barcode?: string;
  navlungoShipmentId?: string;
  desi?: number;
  estimatedDelivery?: string;
  events?: TrackingEvent[];
}
interface Order {
  _id: string;
  userId: string;
  items: { name: string; quantity: number }[];
  totalAmount: number;
  status: string;
  address: string;
  shipment?: Shipment;
  createdAt: string;
}

// Görsel 3 aşama; ara statüler (PREPARING/IN_TRANSIT) bunlara eşlenir
const KARGO_STAGES = ["PAID", "SHIPPED", "DELIVERED"];

const STAGE_LABEL: Record<string, string> = {
  PAID: "Hazırlanıyor",
  PREPARING: "Hazırlanıyor",
  SHIPPED: "Kargoya Verildi",
  IN_TRANSIT: "Yolda",
  DELIVERED: "Teslim Edildi",
};

const STAGE_COLOR: Record<string, string> = {
  PAID: "bg-blue-500",
  PREPARING: "bg-blue-500",
  SHIPPED: "bg-purple-500",
  IN_TRANSIT: "bg-indigo-500",
  DELIVERED: "bg-green-500",
};

// Sipariş statüsünü 3 görsel aşamadan birine indir
function visualStage(status: string): number {
  if (["PAID", "PREPARING"].includes(status)) return 0;
  if (["SHIPPED", "IN_TRANSIT"].includes(status)) return 1;
  if (status === "DELIVERED") return 2;
  return 0;
}

export default function KargoPage() {
  const { token } = useSellerAuthStore();
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

  const shippable = orders.filter((o) => ["PAID", "PREPARING", "SHIPPED", "IN_TRANSIT", "DELIVERED"].includes(o.status));

  const filtered = shippable.filter((o) => {
    const matchStatus = statusFilter === "Tumu" || visualStage(o.status) === visualStage(statusFilter);
    const matchSearch = o._id.toLowerCase().includes(search.toLowerCase()) ||
      o.address?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // PAID → Navlungo gönderi oluştur (gerçek takip no üretir)
  const handleShip = async (order: Order) => {
    setUpdating(order._id);
    try {
      const res = await apiClient.post(`/orders/${order._id}/ship`, {}, authHeaders);
      const updated = res.data?.data;
      setOrders((prev) => prev.map((o) => o._id === order._id ? updated : o));
    } catch (e) {
      console.error("Gönderi oluşturulamadı", e);
    } finally {
      setUpdating(null);
    }
  };

  // Kargo takip durumunu bir adım ilerlet (webhook simülasyonu)
  const handleAdvance = async (order: Order) => {
    setUpdating(order._id);
    try {
      const res = await apiClient.post(`/orders/${order._id}/advance`, {}, authHeaders);
      const updated = res.data?.data;
      setOrders((prev) => prev.map((o) => o._id === order._id ? updated : o));
    } catch (e) {
      console.error("Takip ilerletilemedi", e);
    } finally {
      setUpdating(null);
    }
  };

  const counts = {
    PAID: shippable.filter((o) => visualStage(o.status) === 0).length,
    SHIPPED: shippable.filter((o) => visualStage(o.status) === 1).length,
    DELIVERED: shippable.filter((o) => visualStage(o.status) === 2).length,
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
            const stageIdx = visualStage(order.status);
            const sh = order.shipment;
            const hasShipment = !!sh?.trackingNumber;
            const isPaid = visualStage(order.status) === 0;
            const lastEvent = sh?.events?.[sh.events.length - 1];
            return (
              <div key={order._id} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <p className="font-mono text-sm font-bold text-slate-700">{order._id.slice(-8).toUpperCase()}</p>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold text-white ${STAGE_COLOR[order.status] || "bg-slate-400"}`}>
                        {STAGE_LABEL[order.status] || order.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-1 truncate">{order.address}</p>
                    {hasShipment ? (
                      <p className="text-xs text-slate-400">
                        {sh!.carrier} — Takip: <span className="font-mono font-bold text-slate-600">{sh!.trackingNumber}</span>
                        {sh!.desi ? <span className="ml-2 text-slate-400">· {sh!.desi} desi</span> : null}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600 font-semibold">Henüz kargoya verilmedi</p>
                    )}
                    {lastEvent && (
                      <p className="mt-1 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-600">{lastEvent.label}</span>
                        {lastEvent.location ? ` — ${lastEvent.location}` : ""}
                      </p>
                    )}
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
                    {isPaid && (
                      <button
                        onClick={() => handleShip(order)}
                        disabled={updating === order._id}
                        className="rounded-lg bg-[#ff6000] px-3 py-1.5 text-xs font-black text-white disabled:opacity-60 hover:bg-[#d85000] transition-colors"
                      >
                        {updating === order._id ? "..." : "Kargoya Ver (Navlungo)"}
                      </button>
                    )}
                    {stageIdx === 1 && (
                      <button
                        onClick={() => handleAdvance(order)}
                        disabled={updating === order._id}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-black text-white disabled:opacity-60 hover:bg-indigo-700 transition-colors"
                      >
                        {updating === order._id ? "..." : "Durumu İlerlet →"}
                      </button>
                    )}
                    {stageIdx === 2 && (
                      <span className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-black text-green-600">Teslim Edildi ✓</span>
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
