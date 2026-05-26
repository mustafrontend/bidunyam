"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { Users, Store, Package, ShoppingCart, CreditCard, Activity, BarChart2, PieChart as PieChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    users: 0,
    sellers: 0,
    products: 0,
    carts: 0,
    orders: 0,
    revenue: 0,
    xmls: 0,
    xmlProducts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usersRes, sellersRes, productsRes, cartsRes, ordersRes, xmlRes] = await Promise.all([
          apiClient.get("/auth/admin/users"),
          apiClient.get("/auth/admin/sellers"),
          apiClient.get("/products/admin/products/all"),
          apiClient.get("/cart/admin/all"),
          apiClient.get("/orders/admin/all"),
          apiClient.get("/products/admin/xml/all-requests"),
        ]);

        const orders = ordersRes.data?.data || [];
        const totalRevenue = orders.reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);
        
        const xmlRequests = xmlRes.data?.data?.requests || [];
        const totalXmlProducts = xmlRequests.reduce((acc: number, req: any) => acc + (req.totalProducts || 0), 0);

        setStats({
          users: usersRes.data?.data?.length || 0,
          sellers: sellersRes.data?.data?.length || 0,
          products: productsRes.data?.data?.length || 0,
          carts: cartsRes.data?.data?.length || 0,
          orders: orders.length,
          revenue: totalRevenue,
          xmls: xmlRequests.length,
          xmlProducts: totalXmlProducts,
        });
      } catch (err) {
        console.error("Failed to load admin stats", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const cards = [
    { title: "Toplam Müşteri", value: stats.users, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Toplam Satıcı", value: stats.sellers, icon: Store, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Katalog Ürünü", value: stats.products, icon: Package, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Toplam XML", value: stats.xmls, icon: Package, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "XML Ürün Sayısı", value: stats.xmlProducts, icon: Package, color: "text-rose-600", bg: "bg-rose-50" },
    { title: "Aktif Sepetler", value: stats.carts, icon: ShoppingCart, color: "text-orange-600", bg: "bg-orange-50" },
    { title: "Toplam Sipariş", value: stats.orders, icon: CreditCard, color: "text-pink-600", bg: "bg-pink-50" },
    { title: "Toplam Hacim", value: `₺${stats.revenue.toLocaleString()}`, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-32 bg-white rounded-3xl border border-slate-100" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Özeti</h1>
        <p className="text-sm font-semibold text-slate-500">Sistemdeki genel istatistikleri ve anlık durumu buradan izleyebilirsiniz.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${card.bg} ${card.color}`}>
                <Icon size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider">{card.title}</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kullanıcı Dağılımı Grafiği */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BarChart2 size={20} strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-black text-slate-800">Kullanıcı Dağılımı</h2>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Müşteriler', adet: stats.users, fill: '#3b82f6' },
                { name: 'Satıcılar', adet: stats.sellers, fill: '#10b981' }
              ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="adet" radius={[6, 6, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ürün Kaynağı Dağılımı Grafiği */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <PieChartIcon size={20} strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-black text-slate-800">Ürün Kaynak Dağılımı</h2>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Katalog Ürünleri', value: stats.products },
                    { name: 'XML Ürünleri', value: stats.xmlProducts }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#8b5cf6" />
                  <Cell fill="#f43f5e" />
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
