"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

const NAV = [
  { href: "/yonetim", label: "Genel Bakis", exact: true },
  { href: "/yonetim/urunler", label: "Urun Yonetimi" },
  { href: "/yonetim/siparisler", label: "Siparis Yonetimi" },
  { href: "/yonetim/kargo", label: "Kargo Durumu" },
  { href: "/yonetim/musteriler", label: "Musteri Yonetimi" },
  { href: "/yonetim/stok", label: "Stok Takibi" },
  { href: "/yonetim/kampanyalar", label: "Kampanya Yonetimi" },
  { href: "/yonetim/raporlar", label: "Raporlar & Analitik" },
  { href: "/yonetim/destek", label: "Musteri Talepleri" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Persist store'un localStorage'dan hydrate olması için bir tick bekle
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

  if (!mounted || !authChecked) return null;

  // Giriş sayfası — sidebar olmadan render et
  if (pathname === "/yonetim/giris") {
    return <>{children}</>;
  }

  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col overflow-y-auto bg-slate-900 text-slate-100">
        <div className="border-b border-slate-700 px-5 py-5">
          <p className="text-lg font-black tracking-tight text-white">bidunyam</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Yonetim Paneli</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                isActive(item)
                  ? "bg-slate-200 text-slate-900"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-700 px-4 py-4">
          <p className="text-xs font-bold text-slate-300 capitalize">{user?.name}</p>
          <p className="text-[11px] text-slate-400">{user?.email}</p>
          <button
            onClick={() => { logout(); router.push("/yonetim/giris"); }}
            className="mt-3 w-full rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 transition-colors hover:bg-slate-700"
          >
            Cikis Yap
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="ml-56 flex min-h-screen flex-1 flex-col">
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
