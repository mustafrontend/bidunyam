"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import Link from "next/link";

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  totalRevenue: number;
  todayRevenue: number;
}

interface RecentOrder {
  _id: string;
  userId: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: { name: string; quantity: number }[];
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-700",
  PAID: "bg-slate-100 text-slate-700",
  SHIPPED: "bg-slate-100 text-slate-700",
  DELIVERED: "bg-slate-100 text-slate-700",
  CANCELLED: "bg-slate-200 text-slate-800",
};

const STATUS_TR: Record<string, string> = {
  PENDING: "Beklemede",
  PAID: "Odendi",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "Iptal",
};

export default function AdminDashboard() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0, pendingOrders: 0, paidOrders: 0, shippedOrders: 0,
    deliveredOrders: 0, cancelledOrders: 0, totalProducts: 0, lowStockProducts: 0,
    totalRevenue: 0, todayRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [ordersRes, productsRes] = await Promise.allSettled([
          apiClient.get("/orders", { headers }),
          apiClient.get("/products?limit=100"),
        ]);

        const orders: RecentOrder[] =
          ordersRes.status === "fulfilled" ? ordersRes.value.data?.data || [] : [];
        const products =
          productsRes.status === "fulfilled"
            ? productsRes.value.data?.data?.products || []
            : [];

        const today = new Date().toDateString();
        const todayRevenue = orders
          .filter((o) => new Date(o.createdAt).toDateString() === today)
          .reduce((s, o) => s + o.totalAmount, 0);

        setStats({
          totalOrders: orders.length,
          pendingOrders: orders.filter((o) => o.status === "PENDING").length,
          paidOrders: orders.filter((o) => o.status === "PAID").length,
          shippedOrders: orders.filter((o) => o.status === "SHIPPED").length,
          deliveredOrders: orders.filter((o) => o.status === "DELIVERED").length,
          cancelledOrders: orders.filter((o) => o.status === "CANCELLED").length,
          totalProducts: products.length,
          lowStockProducts: products.filter((p: any) => p.stock < 10).length,
          totalRevenue: orders.reduce((s: number, o: RecentOrder) => s + o.totalAmount, 0),
          todayRevenue,
        });

        setRecentOrders(
          [...orders].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ).slice(0, 8)
        );
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [token]);

  const topCards = [
    { label: "Toplam Ciro", value: `${stats.totalRevenue.toLocaleString("tr-TR")} TL`, sub: `Bugun: ${stats.todayRevenue.toLocaleString("tr-TR")} TL`, color: "border-l-slate-700" },
    { label: "Toplam Siparis", value: stats.totalOrders, sub: `Bekleyen: ${stats.pendingOrders}`, color: "border-l-slate-700" },
    { label: "Kargoda", value: stats.shippedOrders, sub: `Odendi: ${stats.paidOrders}`, color: "border-l-slate-700" },
    { label: "Teslim Edildi", value: stats.deliveredOrders, sub: `Iptal: ${stats.cancelledOrders}`, color: "border-l-slate-700" },
    { label: "Toplam Urun", value: stats.totalProducts, sub: `Dusuk Stok: ${stats.lowStockProducts}`, color: "border-l-slate-700" },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-white border border-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-800">Genel Bakis</h2>
        <p className="mt-1 text-sm text-slate-500">Tum operasyonlarin ozeti</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {topCards.map((card) => (
          <div key={card.label} className={`rounded-xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm ${card.color}`}>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-black text-slate-800">{card.value}</p>
            <p className="mt-1 text-xs text-slate-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Siparis Durumu Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-700">Siparis Dagilimi</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { label: "Beklemede", count: stats.pendingOrders, color: "bg-slate-500" },
            { label: "Odendi", count: stats.paidOrders, color: "bg-slate-500" },
            { label: "Kargoda", count: stats.shippedOrders, color: "bg-slate-500" },
            { label: "Teslim", count: stats.deliveredOrders, color: "bg-slate-500" },
            { label: "Iptal", count: stats.cancelledOrders, color: "bg-slate-700" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className={`mx-auto mb-2 h-2 rounded-full ${item.color}`} style={{ width: "100%" }} />
              <p className="text-2xl font-black text-slate-800">{item.count}</p>
              <p className="text-xs text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Son Siparisler */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">Son Siparisler</h3>
          <Link href="/yonetim/siparisler" className="text-xs font-bold text-slate-700 hover:text-slate-900 hover:underline">
            Tumu Gor
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-black uppercase text-slate-500">Siparis ID</th>
                <th className="px-6 py-3 text-left text-xs font-black uppercase text-slate-500">Urunler</th>
                <th className="px-6 py-3 text-left text-xs font-black uppercase text-slate-500">Tutar</th>
                <th className="px-6 py-3 text-left text-xs font-black uppercase text-slate-500">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-black uppercase text-slate-500">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-semibold">
                    Henuz siparis bulunmuyor.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order._id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-6 py-3 font-mono text-xs text-slate-600">{order._id.slice(-8).toUpperCase()}</td>
                    <td className="px-6 py-3 text-slate-700 max-w-[200px] truncate">
                      {order.items.map((i) => `${i.name} x${i.quantity}`).join(", ")}
                    </td>
                    <td className="px-6 py-3 font-bold text-slate-800">
                      {order.totalAmount.toLocaleString("tr-TR")} TL
                    </td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_COLOR[order.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {STATUS_TR[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hizli Erisim */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { href: "/yonetim/urunler", label: "Urun Ekle", desc: "Yeni urun katalogu", color: "bg-slate-800" },
          { href: "/yonetim/siparisler", label: "Siparisleri Yonet", desc: "Tum siparis akisi", color: "bg-slate-800" },
          { href: "/yonetim/kargo", label: "Kargo Takibi", desc: "Gonderi durumu", color: "bg-slate-800" },
          { href: "/yonetim/kampanyalar", label: "Kampanya Olustur", desc: "Indirim ve promosyon", color: "bg-slate-800" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className={`rounded-xl ${item.color} p-5 text-white hover:opacity-90 transition-opacity`}>
            <p className="font-black text-base">{item.label}</p>
            <p className="mt-1 text-xs text-white/75">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
