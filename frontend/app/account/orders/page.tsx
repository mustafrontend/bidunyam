"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Package, Truck, CheckCircle2, XCircle, Clock, ChevronRight, MapPin } from "lucide-react";

type OrderStatus = "PENDING" | "PAID" | "PREPARING" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

interface OrderItem {
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
}
interface TrackingEvent { status: string; label: string; location?: string; timestamp: string; }
interface Shipment {
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  events?: TrackingEvent[];
}
interface Order {
  _id: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
  address?: string;
  shipment?: Shipment;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PENDING: { label: "Beklemede", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  PAID: { label: "Hazırlanıyor", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: Package },
  PREPARING: { label: "Hazırlanıyor", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: Package },
  SHIPPED: { label: "Kargoya Verildi", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: Truck },
  IN_TRANSIT: { label: "Yolda", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", icon: Truck },
  DELIVERED: { label: "Teslim Edildi", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: CheckCircle2 },
  CANCELLED: { label: "İptal Edildi", color: "text-red-600", bg: "bg-red-50 border-red-200", icon: XCircle },
};

function OrderSkeleton() {
  return (
    <div className="border border-slate-100 rounded-2xl p-5 animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-4 w-32 bg-slate-100 rounded" />
        <div className="h-6 w-24 bg-slate-100 rounded-full" />
      </div>
      <div className="flex gap-3">
        <div className="w-16 h-16 bg-slate-100 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 bg-slate-100 rounded" />
          <div className="h-3 w-1/3 bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  );
}

function TrackingTimeline({ shipment }: { shipment: Shipment }) {
  const events = shipment.events || [];
  return (
    <div className="mt-4 rounded-xl bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wide text-slate-500">Kargo Takibi</span>
        <span className="font-mono text-xs font-bold text-slate-600">{shipment.carrier} · {shipment.trackingNumber}</span>
      </div>
      <div className="space-y-0">
        {events.map((e, i) => {
          const isLast = i === events.length - 1;
          const isDelivered = e.status === "DELIVERED";
          return (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`h-3 w-3 rounded-full ${isLast ? (isDelivered ? "bg-green-500" : "bg-[#ff5000]") : "bg-slate-300"}`} />
                {i < events.length - 1 && <div className="h-8 w-0.5 bg-slate-200" />}
              </div>
              <div className="pb-3">
                <p className={`text-xs font-bold ${isLast ? "text-slate-800" : "text-slate-500"}`}>{e.label}</p>
                <p className="text-[10px] font-medium text-slate-400">
                  {e.location ? `${e.location} · ` : ""}
                  {new Date(e.timestamp).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {shipment.estimatedDelivery && events[events.length - 1]?.status !== "DELIVERED" && (
        <p className="mt-2 text-[11px] font-bold text-slate-500">
          Tahmini teslimat: {new Date(shipment.estimatedDelivery).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
        </p>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const token = useAuthStore((s) => s.token);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/orders/my-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data?.orders || res.data?.data || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Siparişler yüklenemedi.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Siparişlerim</h1>
          <p className="mt-1 text-slate-400 text-sm font-medium">Tüm siparişlerinizi ve kargo durumlarını buradan takip edin.</p>
        </div>
        {!loading && orders.length > 0 && (
          <span className="text-xs font-black text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">{orders.length} Sipariş</span>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <OrderSkeleton key={i} />)}</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
          <p className="text-red-500 font-bold text-sm mb-3">{error}</p>
          <button onClick={fetchOrders} className="text-sm font-black text-white bg-slate-900 px-4 py-2 rounded-lg hover:bg-[#ff5000] transition-colors">Tekrar Dene</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-8 py-16 text-center">
          <Package size={40} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-800 font-black mb-1">Henüz bir siparişin yok</p>
          <p className="text-slate-400 text-sm font-medium mb-6">Alışveriş yapmaya başla ve siparişlerini burada takip et.</p>
          <a href="/" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-black text-white hover:bg-[#ff5000] transition-colors">
            Alışverişe Başla <ChevronRight size={16} />
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
            const StatusIcon = cfg.icon;
            const items = order.items || [];
            const hasTracking = !!order.shipment?.trackingNumber;
            const isOpen = expanded === order._id;
            return (
              <div key={order._id} className="border border-slate-100 rounded-2xl p-5 hover:border-slate-200 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Sipariş #{order._id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black ${cfg.bg} ${cfg.color}`}>
                    <StatusIcon size={12} strokeWidth={2.5} />
                    {cfg.label}
                  </div>
                </div>

                <div className="space-y-3">
                  {items.slice(0, 2).map((p, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <img src={p.imageUrl} alt={p.name} className="w-14 h-14 object-cover rounded-xl bg-slate-100 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{p.name}</p>
                        <p className="text-sm font-black text-slate-900 mt-0.5">
                          {(p.price * p.quantity).toLocaleString("tr-TR")} TL
                          {p.quantity > 1 && <span className="text-slate-400 font-medium ml-1">× {p.quantity}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                  {items.length > 2 && <p className="text-xs text-slate-400 font-bold">+{items.length - 2} ürün daha</p>}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <div>
                    <span className="text-xs text-slate-400 font-bold">Toplam: </span>
                    <span className="text-sm font-black text-slate-900">{(order.totalAmount || 0).toLocaleString("tr-TR")} TL</span>
                  </div>
                  {hasTracking ? (
                    <button onClick={() => setExpanded(isOpen ? null : order._id)}
                      className="flex items-center gap-1.5 text-xs font-black text-[#ff5000] hover:underline">
                      <Truck size={13} /> Kargo Takip {isOpen ? "▲" : "▼"}
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <Clock size={13} /> Kargo bekleniyor
                    </span>
                  )}
                </div>

                {isOpen && order.shipment && <TrackingTimeline shipment={order.shipment} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
