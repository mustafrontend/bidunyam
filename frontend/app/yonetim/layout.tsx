"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSellerAuthStore } from "@/stores/sellerAuthStore";
import { apiClient } from "@/lib/api";

const NAV = [
  { href: "/yonetim", label: "Genel Bakış", exact: true },
  { href: "/yonetim/urunler", label: "Ürün Yönetimi" },
  { href: "/yonetim/siparisler", label: "Sipariş Yönetimi" },
  { href: "/yonetim/kargo", label: "Kargo Durumu" },
  { href: "/yonetim/musteriler", label: "Müşteri Yönetimi" },
  { href: "/yonetim/stok", label: "Stok Takibi" },
  { href: "/yonetim/kampanyalar", label: "Kampanya Yönetimi" },
  { href: "/yonetim/raporlar", label: "Raporlar & Analitik" },
  { href: "/yonetim/destek", label: "Müşteri Talepleri" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useSellerAuthStore();
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Wait a brief tick for Zustand local storage hydration
    const t = setTimeout(() => setAuthChecked(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (authChecked && !isAuthenticated() && pathname !== "/yonetim/giris") {
      router.push("/yonetim/giris");
    }
    if (authChecked && isAuthenticated() && pathname === "/yonetim/giris") {
      router.push("/yonetim");
    }
  }, [authChecked, isAuthenticated, pathname, router]);

  // Enforce server-side JWT and device-id binding check on mount
  useEffect(() => {
    if (authChecked && isAuthenticated() && pathname !== "/yonetim/giris") {
      apiClient.get("/auth/seller/profile")
        .then((res) => {
          if (res.data?.data?.role !== "SELLER") {
            logout();
            router.push("/yonetim/giris");
          }
        })
        .catch((err) => {
          console.error("Critical: Session verification or device binding mismatch:", err);
          logout();
          router.push("/yonetim/giris");
        });
    }
  }, [authChecked, isAuthenticated, pathname, router, logout]);

  if (!mounted || !authChecked) return null;

  // Sign-in/Sign-up page renders full screen without sidebar
  if (pathname === "/yonetim/giris") {
    return <>{children}</>;
  }

  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-800">
      {/* Sidebar - Premium Trendyol Partner layout */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col overflow-y-auto bg-white border-r-[0.5px] border-slate-200">
        <div className="border-b-[0.5px] border-slate-200 px-6 py-5">
          <div className="flex items-center space-x-1.5">
            <span className="text-[#ff6000] font-black text-2xl tracking-tight leading-none">bidunyam</span>
            <span className="rounded-[4px] bg-[#ff6000]/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#ff6000] leading-none">
              Partner
            </span>
          </div>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">Yönetici Paneli</p>
        </div>

        <nav className="flex-1 px-2.5 py-4 space-y-0.5">
          {NAV.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2.5 text-xs font-black tracking-tight rounded-lg transition-all duration-200 ${
                  active
                    ? "bg-[#ff6000]/5 text-[#ff6000] border-l-2 border-[#ff6000]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-2 border-transparent"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User profile & dynamic computer-based session tag */}
        <div className="border-t-[0.5px] border-slate-200 px-4 py-4 bg-slate-50/50 space-y-3">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center font-black text-xs text-slate-700 border-[0.5px] border-slate-300">
              {user?.name?.[0]?.toUpperCase() || "S"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-slate-800 capitalize leading-none">{user?.name}</p>
              <p className="truncate text-[10px] text-slate-400 mt-1 leading-none">{user?.email}</p>
            </div>
          </div>
          
          <div className="rounded-[6px] bg-[#ff6000]/5 border-[0.5px] border-[#ff6000]/20 p-2 text-center">
            <p className="text-[9px] font-black text-[#ff6000] uppercase tracking-wider">🔒 BİLGİSAYAR BAZLI OTURUM</p>
            <p className="text-[8px] text-slate-500 mt-0.5 font-semibold">Cihaz doğrulaması aktif</p>
          </div>

          <button
            onClick={() => {
              logout();
              router.push("/yonetim/giris");
            }}
            className="w-full rounded-lg border-[0.5px] border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98]"
          >
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main dashboard content container */}
      <div className="ml-56 flex min-h-screen flex-1 flex-col">
        <main className="flex-1 p-8 bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
