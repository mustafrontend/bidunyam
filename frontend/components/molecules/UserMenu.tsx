"use client";

import React from "react";
import Link from "next/link";
import { Package, MessageSquare, User, Star, Heart, LogOut } from "lucide-react";

interface UserMenuProps {
  user: { name?: string; email?: string } | null;
  onClose: () => void;
  onLogout: () => void;
}

const MENU_ITEMS = [
  { href: "/account/orders", label: "Siparişlerim", icon: Package },
  { href: "/account/requests", label: "Soru ve Taleplerim", icon: MessageSquare },
  { href: "/account/info", label: "Kullanıcı Bilgilerim", icon: User },
  { href: "/account/reviews", label: "Değerlendirmelerim", icon: Star },
  { href: "/favorites", label: "Beğendiklerim", icon: Heart },
];

export const UserMenu: React.FC<UserMenuProps> = ({ user, onClose, onLogout }) => {
  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border-[0.5px] border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 select-none">
      {/* Header */}
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3.5">
        <p className="text-sm font-black text-slate-800 line-clamp-1">{user?.name}</p>
        <p className="text-[10px] font-bold text-slate-400 mt-0.5 line-clamp-1">{user?.email}</p>
      </div>

      {/* Menu Links */}
      <nav className="px-2 py-2 space-y-0.5">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <Icon size={14} className="text-slate-400" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-100 px-2 py-2 bg-slate-50/50">
        <button
          onClick={(e) => {
            e.preventDefault();
            onLogout();
            onClose();
          }}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={14} className="text-red-400" />
          Çıkış Yap
        </button>
      </div>
    </div>
  );
};
