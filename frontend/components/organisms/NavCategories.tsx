"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Zap,
  CheckCircle2,
  Shirt,
  Home as HomeIcon,
  Laptop,
  Smile,
  Sparkles,
  Activity,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  paramValue: string;
  icon: React.ReactNode;
  activeColor: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Giyim",
    href: "/arama?kategori=Giyim",
    paramValue: "Giyim",
    icon: <Shirt size={14} className="shrink-0 transition-colors duration-300" />,
    activeColor: "text-[#ff5000]",
  },
  {
    label: "Ev & Yaşam",
    href: "/arama?kategori=Ev & Yaşam",
    paramValue: "Ev & Yaşam",
    icon: <HomeIcon size={14} className="shrink-0 transition-colors duration-300" />,
    activeColor: "text-orange-500",
  },
  {
    label: "Elektronik",
    href: "/arama?kategori=Elektronik",
    paramValue: "Elektronik",
    icon: <Laptop size={14} className="shrink-0 transition-colors duration-300" />,
    activeColor: "text-indigo-500",
  },
  {
    label: "Bebek & Çocuk",
    href: "/arama?kategori=Bebek & Çocuk",
    paramValue: "Bebek & Çocuk",
    icon: <Smile size={14} className="shrink-0 transition-colors duration-300" />,
    activeColor: "text-purple-500",
  },
  {
    label: "Kozmetik",
    href: "/arama?kategori=Kozmetik",
    paramValue: "Kozmetik",
    icon: <Sparkles size={14} className="shrink-0 transition-colors duration-300" />,
    activeColor: "text-pink-500",
  },
  {
    label: "Spor & Outdoor",
    href: "/arama?kategori=Spor & Outdoor",
    paramValue: "Spor & Outdoor",
    icon: <Activity size={14} className="shrink-0 transition-colors duration-300" />,
    activeColor: "text-rose-500",
  },
];

const NavCategoriesInner: React.FC = () => {
  const searchParams = useSearchParams();
  const currentKategori = decodeURIComponent(searchParams.get("kategori") ?? "");
  const isOnayliActive = searchParams.get("onayli") === "true";
  const isFlasActive = searchParams.get("kampanya") === "flas";

  return (
    <nav className="mt-3.5 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-slate-100 pt-3 text-xs font-medium text-slate-500 select-none scroll-smooth snap-x">
      {/* Flaş Fırsatlar */}
      <Link
        href="/arama?kampanya=flas"
        className={`snap-start group relative flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shrink-0 shadow-sm ${
          isFlasActive
            ? "bg-[#ff5000] text-white shadow-[#ff5000]/30 scale-[1.02]"
            : "bg-slate-950 text-white hover:bg-[#ff5000]"
        }`}
      >
        <div className="relative flex h-2 w-2 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"></span>
        </div>
        <Zap
          size={14}
          className={`fill-current shrink-0 transition-colors duration-300 ${
            isFlasActive ? "text-white fill-white" : "text-amber-400 fill-amber-400"
          }`}
        />
        <span>Flaş Fırsatlar</span>
      </Link>

      {/* Sadece Onaylılar */}
      <Link
        href="/arama?onayli=true"
        className={`snap-start group flex items-center gap-1.5 px-4 py-2 rounded-xl border transition-all duration-300 shrink-0 ${
          isOnayliActive
            ? "border-emerald-300 bg-emerald-50 text-emerald-700 font-semibold"
            : "border-transparent hover:border-slate-100 hover:bg-slate-50/80 text-slate-600 hover:text-slate-900 font-medium"
        }`}
      >
        <CheckCircle2
          size={14}
          className={`shrink-0 transition-colors duration-300 ${
            isOnayliActive ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500"
          }`}
        />
        <span>Sadece Onaylılar</span>
      </Link>

      {/* Dinamik Kategori Linkleri */}
      {NAV_ITEMS.map((item) => {
        const isActive = currentKategori === item.paramValue;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`snap-start group flex items-center gap-1.5 px-4 py-2 rounded-xl border transition-all duration-300 shrink-0 ${
              isActive
                ? "border-[#ff5000]/30 bg-orange-50 text-[#ff5000] font-semibold"
                : "border-transparent hover:border-slate-100 hover:bg-slate-50/80 text-slate-600 hover:text-slate-900 font-medium"
            }`}
          >
            <span
              className={`transition-colors duration-300 ${
                isActive ? item.activeColor : `text-slate-400 group-hover:${item.activeColor}`
              }`}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
            {isActive && (
              <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-[#ff5000] inline-block animate-pulse" />
            )}
          </Link>
        );
      })}
    </nav>
  );
};

// useSearchParams must be wrapped in Suspense
export const NavCategories: React.FC = () => (
  <Suspense
    fallback={
      <nav className="mt-3.5 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-slate-100 pt-3 h-10" />
    }
  >
    <NavCategoriesInner />
  </Suspense>
);
