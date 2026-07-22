"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { LayoutDashboard, Users, Store, Package, ShoppingCart, CreditCard, LogOut, SlidersHorizontal, FileCode2, Percent } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, token, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && (!token || user?.role !== "ADMIN")) {
      if (pathname !== "/admin/login") {
        router.push("/admin/login");
      }
    }
  }, [isClient, token, user, pathname, router]);

  if (!isClient) return null;

  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  if (!token || user?.role !== "ADMIN") return null;

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Müşteriler", href: "/admin/users", icon: Users },
    { name: "Satıcılar", href: "/admin/sellers", icon: Store },
    { name: "Ürünler", href: "/admin/products", icon: Package },
    { name: "Kategori Filtreleri", href: "/admin/category-filters", icon: SlidersHorizontal },
    { name: "XML Onayları", href: "/admin/xml-feeds", icon: FileCode2 },
    { name: "Komisyon & Kargo", href: "/admin/komisyon", icon: Percent },
    { name: "Kampanyalar", href: "/admin/campaigns", icon: Package },
    { name: "Sepetler", href: "/admin/carts", icon: ShoppingCart },
    { name: "Siparişler", href: "/admin/orders", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <span className="text-lg font-black tracking-tighter text-[#ff5000]">BiDünyam Admin</span>
        </div>
        
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold text-sm ${
                  isActive
                    ? "bg-[#ff5000]/10 text-[#ff5000]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#ff5000] font-black text-xs">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-all"
          >
            <LogOut size={16} />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
