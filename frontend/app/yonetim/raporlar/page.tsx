"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useSellerAuthStore } from "@/stores/sellerAuthStore";

interface Order {
  _id: string;
  userId: string;
  items: { name: string; quantity: number; price: number; productId: string }[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface DailyStat { date: string; revenue: number; orders: number; }
interface CategoryStat { category: string; revenue: number; count: number; }

function groupByDay(orders: Order[]): DailyStat[] {
  const map: Record<string, DailyStat> = {};
  orders.forEach((o) => {
    const d = new Date(o.createdAt).toLocaleDateString("tr-TR");
    if (!map[d]) map[d] = { date: d, revenue: 0, orders: 0 };
    map[d].revenue += o.totalAmount;
    map[d].orders += 1;
  });
  return Object.values(map).slice(-14).reverse();
}

export default function RaporlarPage() {
  const { token } = useSellerAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"gelir" | "siparis" | "urun">("gelir");

  useEffect(() => {
    apiClient.get("/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setOrders(res.data?.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const delivered = orders.filter((o) => o.status === "DELIVERED");
  const totalRevenue = delivered.reduce((s, o) => s + o.totalAmount, 0);
  const avgOrderValue = delivered.length > 0 ? totalRevenue / delivered.length : 0;

  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
  const todayRevenue = todayOrders.reduce((s, o) => s + o.totalAmount, 0);

  const lastWeek = new Date(); lastWeek.setDate(lastWeek.getDate() - 7);
  const weekOrders = orders.filter((o) => new Date(o.createdAt) >= lastWeek);
  const weekRevenue = weekOrders.filter((o) => o.status === "DELIVERED").reduce((s, o) => s + o.totalAmount, 0);

  const daily = groupByDay(delivered);
  const maxRevenue = Math.max(...daily.map((d) => d.revenue), 1);
  const maxOrders = Math.max(...daily.map((d) => d.orders), 1);

  // Product frequency
  const productFreq: Record<string, { name: string; count: number; revenue: number }> = {};
  orders.forEach((o) => {
    o.items.forEach((item) => {
      const k = item.name;
      if (!productFreq[k]) productFreq[k] = { name: item.name, count: 0, revenue: 0 };
      productFreq[k].count += item.quantity;
      productFreq[k].revenue += item.price * item.quantity;
    });
  });
  const topProducts = Object.values(productFreq).sort((a, b) => b.count - a.count).slice(0, 10);
  const maxProductCount = Math.max(...topProducts.map((p) => p.count), 1);

  const statusDist = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});
  const STATUS_TR: Record<string, string> = { PENDING: "Beklemede", PAID: "Odendi", SHIPPED: "Kargoda", DELIVERED: "Teslim", CANCELLED: "Iptal" };
  const STATUS_COLOR: Record<string, string> = { PENDING: "bg-yellow-400", PAID: "bg-blue-500", SHIPPED: "bg-purple-500", DELIVERED: "bg-green-500", CANCELLED: "bg-red-400" };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Raporlar ve Analitik</h2>
        <p className="text-sm text-slate-500 mt-1">Satis performansi ve trend analizi</p>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Toplam Ciro (Teslim)", value: `${totalRevenue.toLocaleString("tr-TR")} TL`, color: "border-l-[#ff6000]" },
          { label: "Bugun Ciro", value: `${todayRevenue.toLocaleString("tr-TR")} TL`, color: "border-l-blue-500" },
          { label: "7 Gunluk Ciro", value: `${weekRevenue.toLocaleString("tr-TR")} TL`, color: "border-l-purple-500" },
          { label: "Ort. Siparis Degeri", value: `${Math.round(avgOrderValue).toLocaleString("tr-TR")} TL`, color: "border-l-green-500" },
        ].map((c) => (
          <div key={c.label} className={`rounded-xl border-l-4 bg-white p-5 shadow-sm ${c.color}`}>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{c.label}</p>
            <p className="mt-2 text-2xl font-black text-slate-800">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2">
        {[{ key: "gelir", label: "Gunluk Gelir" }, { key: "siparis", label: "Siparis Trendi" }, { key: "urun", label: "En Cok Satan" }].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold border transition-colors ${tab === t.key ? "bg-[#ff6000] text-white border-[#ff6000]" : "bg-white text-slate-600 border-slate-200 hover:border-[#ff6000]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl bg-white" />
      ) : (
        <>
          {/* Revenue Chart */}
          {tab === "gelir" && (
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
              <h3 className="mb-5 text-sm font-black uppercase tracking-wide text-slate-700">Son 14 Gun — Gunluk Ciro</h3>
              {daily.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-semibold">Veri bulunmuyor.</div>
              ) : (
                <div className="flex items-end gap-2 h-48 overflow-x-auto pb-2">
                  {daily.map((d) => (
                    <div key={d.date} className="flex flex-col items-center gap-1 flex-1 min-w-[36px]">
                      <div
                        className="w-full rounded-t-lg bg-[#ff6000] hover:bg-[#d85000] transition-colors relative group"
                        style={{ height: `${(d.revenue / maxRevenue) * 100}%`, minHeight: 4 }}
                      >
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
                          {d.revenue.toLocaleString("tr-TR")} TL
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400 rotate-45 origin-left mt-2 whitespace-nowrap">{d.date.slice(0, 5)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Order Trend */}
          {tab === "siparis" && (
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
              <h3 className="mb-5 text-sm font-black uppercase tracking-wide text-slate-700">Son 14 Gun — Siparis Adedi</h3>
              {daily.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-semibold">Veri bulunmuyor.</div>
              ) : (
                <div className="flex items-end gap-2 h-48 overflow-x-auto pb-2">
                  {daily.map((d) => (
                    <div key={d.date} className="flex flex-col items-center gap-1 flex-1 min-w-[36px]">
                      <div
                        className="w-full rounded-t-lg bg-blue-500 hover:bg-blue-600 transition-colors relative group"
                        style={{ height: `${(d.orders / maxOrders) * 100}%`, minHeight: 4 }}
                      >
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
                          {d.orders} siparis
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400 rotate-45 origin-left mt-2 whitespace-nowrap">{d.date.slice(0, 5)}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Status Distribution */}
              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="mb-3 text-xs font-black uppercase text-slate-600">Siparis Durum Dagilimi</p>
                <div className="space-y-3">
                  {Object.entries(statusDist).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-3">
                      <span className="w-24 text-xs font-semibold text-slate-600">{STATUS_TR[status] ?? status}</span>
                      <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-3 rounded-full ${STATUS_COLOR[status] ?? "bg-slate-400"}`} style={{ width: `${(count / orders.length) * 100}%` }} />
                      </div>
                      <span className="text-xs font-black text-slate-700 w-6 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Top Products */}
          {tab === "urun" && (
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
              <h3 className="mb-5 text-sm font-black uppercase tracking-wide text-slate-700">En Cok Satan 10 Urun</h3>
              {topProducts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-semibold">Veri bulunmuyor.</div>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-4">
                      <span className="w-5 text-right text-xs font-black text-slate-400">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-slate-800 truncate max-w-[200px]">{p.name}</span>
                          <span className="text-xs font-black text-[#ff6000]">{p.count} adet</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-2 rounded-full bg-[#ff6000]" style={{ width: `${(p.count / maxProductCount) * 100}%` }} />
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{p.revenue.toLocaleString("tr-TR")} TL toplam ciro</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
