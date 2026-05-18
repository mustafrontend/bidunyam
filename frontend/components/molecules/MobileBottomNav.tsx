"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, Sparkles, Heart, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useFavoriteStore } from "@/stores/favoriteStore";

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.getTotalItems());
  const favoriteCount = useFavoriteStore((s) => s.productIds.length);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Admin routes should not show mobile navigation
  if (pathname?.startsWith("/yonetim")) {
    return null;
  }

  const items = [
    { href: "/", label: "Ana Sayfa", icon: Home },
    { href: "/#categories", label: "Kategoriler", icon: Grid },
    { href: "/#best-sellers", label: "Çok Satanlar", icon: Sparkles },
    { 
      href: "/favorites", 
      label: "Favoriler", 
      icon: Heart, 
      badge: isMounted && favoriteCount > 0 ? favoriteCount : undefined,
      badgeColor: "bg-rose-500 text-white"
    },
    { 
      href: "/cart", 
      label: "Sepetim", 
      icon: ShoppingCart, 
      badge: isMounted && cartCount > 0 ? cartCount : undefined,
      badgeColor: "bg-[#ff5000] text-white"
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-md px-2 py-1 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] md:hidden select-none">
      {items.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 rounded-xl text-center active:scale-95 transition-all duration-150 ${
              isActive ? "text-[#ff5000]" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <div className="relative flex items-center justify-center p-1">
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="transition-transform duration-200" />
              {item.badge !== undefined && (
                <span className={`absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-black border border-white leading-none ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold mt-0.5 tracking-tight leading-none">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
