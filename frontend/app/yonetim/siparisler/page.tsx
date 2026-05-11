"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

interface OrderItem { name: string; quantity: number; price: number; imageUrl: string; }
interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  address: string;
  paymentDetails: { cardLast4: string; paymentId: string };
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  PAID: "bg-blue-100 text-blue-700 border-blue-200",
  SHIPPED: "bg-purple-100 text-purple-700 border-purple-200",
  DELIVERED: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_TR: Record<string, string> = {
  PENDING: "Beklemede", PAID: "Odendi", SHIPPED: "Kargoda",
  DELIVERED: "Teslim Edildi", CANCELLED: "Iptal",
};

const ALL_STATUSES = ["Tumu", "PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function SiparislerPage() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Tumu");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await apiClient.get("/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [token]);

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === "Tumu" || o.status === statusFilter;
    const matchSearch =
      o._id.toLowerCase().includes(search.toLowerCase()) ||
      o.address?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await apiClient.patch(`/orders/${orderId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status: newStatus as Order["status"] } : o));
      if (selected?._id === orderId) setSelected((s) => s ? { ...s, status: newStatus as Order["status"] } : s);
    } catch {
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status: newStatus as Order["status"] } : o));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Siparis Yonetimi</h2>
        <p className="text-sm text-slate-500 mt-1">{filtered.length} siparis listelendi</p>
      </div>

      {/* Status Tab Filters */}
      <div className="flex flex-wrap gap-2">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold border transition-colors ${
              statusFilter === s ? "bg-[#ff6000] text-white border-[#ff6000]" : "bg-white text-slate-600 border-slate-200 hover:border-[#ff6000]"
            }`}
          >
            {s === "Tumu" ? "Tumu" : STATUS_TR[s]} ({s === "Tumu" ? orders.length : orders.filter((o) => o.status === s).length})
          </button>
        ))}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Siparis ID veya adres ara..."
        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-[#ff6000] w-72"
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        {/* Orders Table */}
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-400 font-semibold">Yukleniyor...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["ID", "Urunler", "Tutar", "Durum", "Tarih", "Islem"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-16 text-center text-slate-400 font-semibold">Siparis bulunamadi.</td></tr>
                ) : filtered.map((order) => (
                  <tr
                    key={order._id}
                    onClick={() => setSelected(order)}
                    className={`border-b border-slate-50 cursor-pointer ${selected?._id === order._id ? "bg-orange-50" : "hover:bg-slate-50"}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{order._id.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-[160px] truncate text-xs">
                      {order.items.map((i) => `${i.name} x${i.quantity}`).join(", ")}
                    </td>
                    <td className="px-4 py-3 font-black text-slate-800">{order.totalAmount.toLocaleString("tr-TR")} TL</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${STATUS_COLOR[order.status]}`}>
                        {STATUS_TR[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString("tr-TR")}</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => { e.stopPropagation(); handleStatusChange(order._id, e.target.value); }}
                        disabled={updatingId === order._id}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-[#ff6000]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"] as const).map((s) => (
                          <option key={s} value={s}>{STATUS_TR[s]}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black uppercase text-slate-500">Siparis Detayi</p>
                <p className="font-mono text-sm font-bold text-slate-700 mt-0.5">{selected._id.slice(-8).toUpperCase()}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">x</button>
            </div>

            <div className="space-y-2">
              {selected.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                  <img src={item.imageUrl} alt={item.name} className="h-12 w-12 rounded-lg object-cover bg-slate-200" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">x{item.quantity} — {item.price.toLocaleString("tr-TR")} TL</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-slate-50 p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Toplam</span><span className="font-black">{selected.totalAmount.toLocaleString("tr-TR")} TL</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Adres</span><span className="text-right text-xs max-w-[180px]">{selected.address}</span></div>
              {selected.paymentDetails?.cardLast4 && (
                <div className="flex justify-between"><span className="text-slate-500">Kart</span><span>**** {selected.paymentDetails.cardLast4}</span></div>
              )}
              <div className="flex justify-between"><span className="text-slate-500">Tarih</span><span>{new Date(selected.createdAt).toLocaleString("tr-TR")}</span></div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase text-slate-500">Durum Guncelle</p>
              <div className="grid grid-cols-2 gap-2">
                {(["PAID", "SHIPPED", "DELIVERED", "CANCELLED"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(selected._id, s)}
                    className={`rounded-lg border py-2 text-xs font-bold transition-colors ${selected.status === s ? "bg-[#ff6000] text-white border-[#ff6000]" : "border-slate-200 text-slate-600 hover:border-[#ff6000]"}`}
                  >
                    {STATUS_TR[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
