"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ACCOUNT_MENU = [
  { href: "/account/orders", label: "Siparişlerim", icon: "📦" },
  { href: "/account/requests", label: "Soru ve Taleplerim", icon: "💬" },
  { href: "/account/info", label: "Kullanıcı Bilgilerim", icon: "👤" },
  { href: "/account/reviews", label: "Değerlendirmelerim", icon: "⭐" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
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
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="rounded-2xl border border-slate-100 bg-white p-4 h-fit sticky top-24">
          <nav className="space-y-1">
            {ACCOUNT_MENU.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
