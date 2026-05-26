"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Package, MessageCircle, User, Star } from "lucide-react";

const ACCOUNT_MENU = [
  { href: "/account/orders", label: "Siparişlerim", icon: Package },
  { href: "/account/requests", label: "Soru ve Taleplerim", icon: MessageCircle },
  { href: "/account/info", label: "Kullanıcı Bilgilerim", icon: User },
  { href: "/account/reviews", label: "Değerlendirmelerim", icon: Star },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setLoginModalOpen = useUiStore((s) => s.setLoginModalOpen);

  useEffect(() => {
    if (!token) {
      setLoginModalOpen(true);
      router.push("/");
    }
  }, [token, router, setLoginModalOpen]);

  if (!token) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="h-fit sticky top-24 space-y-3">
          {/* User Card */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-base shrink-0">
                {user?.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="min-w-0">
                <p className="font-black text-slate-900 text-sm truncate">{user?.name || "Kullanıcı"}</p>
                <p className="text-xs text-slate-400 font-medium truncate">{user?.email || ""}</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <div className="rounded-2xl border border-slate-100 bg-white p-2">
            <nav className="space-y-0.5">
              {ACCOUNT_MENU.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
