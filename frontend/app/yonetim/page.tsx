"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useSellerAuthStore } from "@/stores/sellerAuthStore";
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
  PENDING: "bg-amber-50 text-amber-700 border-[#px] border-amber-200/50",
  PAID: "bg-blue-50 text-blue-700 border-[#px] border-blue-200/50",
  SHIPPED: "bg-indigo-50 text-indigo-700 border-[#px] border-indigo-200/50",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-[#px] border-emerald-200/50",
  CANCELLED: "bg-rose-50 text-rose-700 border-[#px] border-rose-200/50",
};

const STATUS_TR: Record<string, string> = {
  PENDING: "Beklemede",
  PAID: "Ödendi",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal Edildi",
};

export default function AdminDashboard() {
  const { token } = useSellerAuthStore();
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0, pendingOrders: 0, paidOrders: 0, shippedOrders: 0,
    deliveredOrders: 0, cancelledOrders: 0, totalProducts: 0, lowStockProducts: 0,
    totalRevenue: 0, todayRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  // Bireysel satıcıya özel hızlı işlemler için profil
  const [profile, setProfile] = useState<{ accountType?: string; storeSlug?: string; storeName?: string; fullName?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiClient.get("/auth/seller/profile").then((r) => setProfile(r.data?.data)).catch(() => {});
  }, [token]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [ordersRes, productsRes] = await Promise.allSettled([
          apiClient.get("/orders", { headers }),
          apiClient.get("/products?limit=100&includeAll=true"),
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
    { label: "Toplam Ciro", value: `${stats.totalRevenue.toLocaleString("tr-TR")} TL`, sub: `Bugün: ${stats.todayRevenue.toLocaleString("tr-TR")} TL` },
    { label: "Toplam Sipariş", value: stats.totalOrders, sub: `Bekleyen: ${stats.pendingOrders}` },
    { label: "Kargodakiler", value: stats.shippedOrders, sub: `Ödendi: ${stats.paidOrders}` },
    { label: "Teslim Edilenler", value: stats.deliveredOrders, sub: `İptal: ${stats.cancelledOrders}` },
    { label: "Toplam Ürün", value: stats.totalProducts, sub: `Düşük Stok: ${stats.lowStockProducts}` },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-white border-[0.5px] border-slate-200 rounded-xl animate-pulse" />
        <div className="grid gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-white border-[0.5px] border-slate-200/80" />
          ))}
        </div>
        <div className="h-64 w-full bg-white border-[0.5px] border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  const isBireysel = profile?.accountType === "BIREYSEL";
  const storeUrl = profile?.storeSlug ? `https://bidunyam.com/magaza/${profile.storeSlug}` : "";
  const shareStore = async () => {
    if (!storeUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: profile?.storeName || "Mağazam", url: storeUrl });
      } else {
        await navigator.clipboard.writeText(storeUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* kullanıcı iptal etti */ }
  };

  return (
    <div className="space-y-7 antialiased font-sans">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-800">Genel Bakış</h2>
        <p className="mt-1 text-xs font-semibold text-slate-400">
          {isBireysel ? "Bireysel satıcı paneli — ilanlarını ve satışlarını buradan yönet" : "Mağazanızın güncel operasyonel durumu"}
        </p>
      </div>

      {/* Bireysel satıcıya özel hızlı işlemler */}
      {isBireysel && (
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-violet-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">Bireysel</span>
            <h3 className="text-sm font-black text-slate-800">Hızlı İşlemler</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/yonetim/urunler" className="group flex items-center gap-3 rounded-xl border border-violet-200 bg-white p-4 transition-all hover:border-violet-400 hover:shadow-sm active:scale-[0.98]">
              <span className="text-xl">⚡</span>
              <div>
                <p className="text-sm font-black text-slate-800">Hızlı İlan Ver</p>
                <p className="text-[10px] font-bold text-slate-400">Fotoğraf + fiyat, dakikalar içinde</p>
              </div>
            </Link>
            <button onClick={shareStore} disabled={!storeUrl}
              className="group flex items-center gap-3 rounded-xl border border-violet-200 bg-white p-4 text-left transition-all hover:border-violet-400 hover:shadow-sm active:scale-[0.98] disabled:opacity-50">
              <span className="text-xl">🔗</span>
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-800">{copied ? "Kopyalandı ✓" : "Mağazamı Paylaş"}</p>
                <p className="truncate text-[10px] font-bold text-slate-400">{profile?.storeSlug ? `/magaza/${profile.storeSlug}` : "Önce Mağazam'dan link belirleyin"}</p>
              </div>
            </button>
            <Link href="/yonetim/magaza" className="group flex items-center gap-3 rounded-xl border border-violet-200 bg-white p-4 transition-all hover:border-violet-400 hover:shadow-sm active:scale-[0.98]">
              <span className="text-xl">🏪</span>
              <div>
                <p className="text-sm font-black text-slate-800">Mağazamı Düzenle</p>
                <p className="text-[10px] font-bold text-slate-400">Tema, renk, açıklama</p>
              </div>
            </Link>
            <Link href="/yonetim/tahsilat" className="group flex items-center gap-3 rounded-xl border border-violet-200 bg-white p-4 transition-all hover:border-violet-400 hover:shadow-sm active:scale-[0.98]">
              <span className="text-xl">💰</span>
              <div>
                <p className="text-sm font-black text-slate-800">Tahsilatım</p>
                <p className="text-[10px] font-bold text-slate-400">Hakediş ve IBAN</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {topCards.map((card, i) => (
          <div
            key={card.label}
            className="rounded-xl border-[0.5px] border-slate-200/85 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 relative overflow-hidden"
          >
            {/* Top orange accent line on first metric or all */}
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-[#ff6000]/60" />
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{card.label}</p>
            <p className="mt-2.5 text-2xl font-black text-slate-800 tracking-tight">{card.value}</p>
            <p className="mt-1 text-[10px] font-bold text-slate-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Order Status Distribution Dashboard */}
      <div className="rounded-xl border-[0.5px] border-slate-200/85 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-slate-500">Sipariş Dağılım Durumu</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { label: "Beklemede", count: stats.pendingOrders, color: "bg-amber-500" },
            { label: "Ödendi", count: stats.paidOrders, color: "bg-blue-500" },
            { label: "Kargoda", count: stats.shippedOrders, color: "bg-indigo-500" },
            { label: "Teslim Edildi", count: stats.deliveredOrders, color: "bg-emerald-500" },
            { label: "İptal Edilen", count: stats.cancelledOrders, color: "bg-rose-500" },
          ].map((item) => (
            <div key={item.label} className="text-center p-3 rounded-xl bg-slate-50/60 border-[0.5px] border-slate-100">
              <div className={`mx-auto mb-2.5 h-1.5 rounded-full ${item.color}`} style={{ width: "60%" }} />
              <p className="text-xl font-black text-slate-800">{item.count}</p>
              <p className="text-[10px] font-bold text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="rounded-xl border-[0.5px] border-slate-200/85 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="flex items-center justify-between border-b-[0.5px] border-slate-100 px-6 py-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Son Alınan Siparişler</h3>
          <Link href="/yonetim/siparisler" className="text-xs font-bold text-[#ff6000] hover:text-[#ff6000]/80 transition-all">
            Tümünü Gör →
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-[0.5px] border-slate-100 bg-slate-50/70">
                <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Sipariş ID</th>
                <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Ürün Detayı</th>
                <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Toplam Tutar</th>
                <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Kargo Durumu</th>
                <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Oluşturulma Tarihi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-semibold text-xs">
                    Mağazanıza ait henüz aktif sipariş bulunmamaktadır.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50/40 transition-colors duration-150">
                    <td className="px-6 py-3.5 font-mono text-[11px] font-bold text-slate-500">
                      #{order._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600 max-w-[200px] truncate font-medium">
                      {order.items.map((i) => `${i.name} (x${i.quantity})`).join(", ")}
                    </td>
                    <td className="px-6 py-3.5 font-black text-xs text-slate-800">
                      {order.totalAmount.toLocaleString("tr-TR")} TL
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex rounded-full border-[0.5px] px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${STATUS_COLOR[order.status] ?? "bg-slate-50 text-slate-600"}`}>
                        {STATUS_TR[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-[10px] font-bold text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/yonetim/urunler", label: "Ürün Ekle", desc: "Kataloğa yeni ürünler veya XML yükleyin", badge: "Katalog" },
          { href: "/yonetim/siparisler", label: "Siparişleri Yönet", desc: "Bekleyen sipariş durumlarını güncelleyin", badge: "Sipariş" },
          { href: "/yonetim/kargo", label: "Kargo Takibi", desc: "Paket gönderi ve kurye takibi", badge: "Kargo" },
          { href: "/yonetim/kampanyalar", label: "Kampanya Oluştur", desc: "İndirimler ve kuponlar düzenleyin", badge: "Pazarlama" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-xl border-[0.5px] border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-[#ff6000] hover:shadow-md transition-all duration-200 active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="rounded-[4px] bg-[#ff6000]/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#ff6000]">
                {item.badge}
              </span>
              <span className="text-slate-300 group-hover:text-[#ff6000] transition-colors font-bold text-sm">→</span>
            </div>
            <p className="font-black text-slate-800 text-sm tracking-tight">{item.label}</p>
            <p className="mt-1 text-[10px] font-bold text-slate-400 leading-relaxed">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
