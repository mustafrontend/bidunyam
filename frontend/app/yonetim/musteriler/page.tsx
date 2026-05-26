"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useSellerAuthStore } from "@/stores/sellerAuthStore";

interface Order {
  _id: string;
  userId: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface CustomerSummary {
  userId: string;
  orderCount: number;
  totalSpend: number;
  lastOrder: string;
  statuses: string[];
  allItems: string[];
}

const STATUS_TR: Record<string, string> = {
  PENDING: "Beklemede", PAID: "Odendi", SHIPPED: "Kargoda",
  DELIVERED: "Teslim Edildi", CANCELLED: "Iptal",
};

export default function MusterilerPage() {
  const { token } = useSellerAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CustomerSummary | null>(null);
  const [sortBy, setSortBy] = useState<"spend" | "orders" | "last">("spend");

  useEffect(() => {
    apiClient.get("/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setOrders(res.data?.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  // Aggregate by userId
  const customerMap = orders.reduce<Record<string, CustomerSummary>>((acc, order) => {
    const id = order.userId || "unknown";
    if (!acc[id]) acc[id] = { userId: id, orderCount: 0, totalSpend: 0, lastOrder: order.createdAt, statuses: [], allItems: [] };
    acc[id].orderCount += 1;
    acc[id].totalSpend += order.totalAmount;
    acc[id].statuses.push(order.status);
    acc[id].allItems.push(...order.items.map((i) => i.name));
    if (new Date(order.createdAt) > new Date(acc[id].lastOrder)) acc[id].lastOrder = order.createdAt;
    return acc;
  }, {});

  const customers = Object.values(customerMap);

  const filtered = customers.filter((c) =>
    c.userId.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === "spend") return b.totalSpend - a.totalSpend;
    if (sortBy === "orders") return b.orderCount - a.orderCount;
    return new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime();
  });

  const selectedOrders = selected
    ? orders.filter((o) => o.userId === selected.userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Musteri Yonetimi</h2>
        <p className="text-sm text-slate-500 mt-1">{filtered.length} aktif musteri</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Toplam Musteri", value: customers.length, color: "border-l-[#ff6000]" },
          { label: "Toplam Siparis", value: orders.length, color: "border-l-blue-500" },
          { label: "Toplam Ciro", value: `${orders.reduce((s, o) => s + o.totalAmount, 0).toLocaleString("tr-TR")} TL`, color: "border-l-green-500" },
        ].map((c) => (
          <div key={c.label} className={`rounded-xl border-l-4 bg-white p-5 shadow-sm ${c.color}`}>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{c.label}</p>
            <p className="mt-2 text-3xl font-black text-slate-800">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kullanici ID ara..."
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-[#ff6000] w-64"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#ff6000]"
        >
          <option value="spend">Harcamaya Gore</option>
          <option value="orders">Siparis Sayisina Gore</option>
          <option value="last">Son Siparise Gore</option>
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        {/* Customer Table */}
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-slate-100">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-semibold">Yukleniyor...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Musteri ID", "Siparis Adedi", "Toplam Harcama", "Son Siparis", "Durum Dagilimi"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="py-16 text-center text-slate-400 font-semibold">Musteri bulunamadi.</td></tr>
                ) : filtered.map((c) => {
                  const uniqueStatuses = Array.from(new Set(c.statuses));
                  return (
                    <tr
                      key={c.userId}
                      onClick={() => setSelected(c)}
                      className={`border-b border-slate-50 cursor-pointer ${selected?.userId === c.userId ? "bg-orange-50" : "hover:bg-slate-50"}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{c.userId.slice(0, 16)}...</td>
                      <td className="px-4 py-3 font-black text-slate-800">{c.orderCount}</td>
                      <td className="px-4 py-3 font-black text-[#ff6000]">{c.totalSpend.toLocaleString("tr-TR")} TL</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{new Date(c.lastOrder).toLocaleDateString("tr-TR")}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {uniqueStatuses.slice(0, 3).map((s) => (
                            <span key={s} className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                              {STATUS_TR[s]}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Customer Detail */}
        {selected && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black uppercase text-slate-500">Musteri Detayi</p>
                <p className="font-mono text-xs font-bold text-slate-700 mt-0.5 break-all">{selected.userId}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">x</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-2xl font-black text-[#ff6000]">{selected.orderCount}</p>
                <p className="text-xs text-slate-500">Siparis</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-xl font-black text-slate-800">{selected.totalSpend.toLocaleString("tr-TR")} TL</p>
                <p className="text-xs text-slate-500">Toplam Harcama</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-black uppercase text-slate-500">Satin Alinan Urunler</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {Array.from(new Set(selected.allItems)).slice(0, 20).map((item, i) => (
                  <div key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700 truncate">{item}</div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-black uppercase text-slate-500">Son Siparisler</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedOrders.map((order) => (
                  <div key={order._id} className="rounded-lg border border-slate-100 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-slate-600">{order._id.slice(-8).toUpperCase()}</span>
                      <span className="text-xs font-bold text-[#ff6000]">{order.totalAmount.toLocaleString("tr-TR")} TL</span>
                    </div>
                    <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString("tr-TR")} — {STATUS_TR[order.status]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
