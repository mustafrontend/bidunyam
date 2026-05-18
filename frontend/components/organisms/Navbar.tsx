"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  User, 
  HelpCircle, 
  Globe, 
  ShoppingCart, 
  Search, 
  ChevronDown, 
  Heart, 
  Menu, 
  Zap, 
  CheckCircle2, 
  Shirt, 
  Home as HomeIcon, 
  Laptop, 
  Smile, 
  Sparkles, 
  Activity 
} from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useFavoriteStore } from "@/stores/favoriteStore";
import { useUiStore } from "@/stores/uiStore";
import { apiClient } from "@/lib/api";
import { Logo } from "../atoms/Logo";
import { LoginModal } from "../molecules/LoginModal";
import { UserMenu } from "../molecules/UserMenu";
import { SearchResults } from "../molecules/SearchResults";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const totalItems = useCartStore((s) => s.getTotalItems());
  const { user, token, logout } = useAuthStore();
  const favoriteCount = useFavoriteStore((s) => s.productIds.length);
  const fetchFavorites = useFavoriteStore((s) => s.fetchFavorites);
  const clearFavorites = useFavoriteStore((s) => s.clearFavorites);
  const { isLoginModalOpen, setLoginModalOpen, isBrandMode, setIsBrandMode } = useUiStore();

  const [isMounted, setIsMounted] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const clickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  useEffect(() => {
    if (token) {
      fetchFavorites(token);
    } else {
      clearFavorites();
    }
  }, [token, fetchFavorites, clearFavorites]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        try {
          const res = await apiClient.get(`/search?q=${searchQuery}`);
          setSearchResults(res.data.data);
          setShowResults(true);
        } catch (err) {
          console.error("Search failed", err);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  if (pathname?.startsWith("/yonetim")) return null;

  return (
    <>
      {/* 1. Slim Top Promo Banner (Turkish) */}
      <div className="w-full bg-[#001819] text-white py-2 text-center text-[10px] font-black uppercase tracking-widest select-none">
        Milyonlarca Ürün, Güvenli Teslimat, 24/7 Destek. Alışverişe Başla
      </div>

      {/* 2. Main Premium Header Wrapper */}
      <header className="sticky top-0 z-50 w-full bg-white text-slate-800 shadow-sm border-b-[0.5px] border-slate-200">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            
            {/* Brand Logo */}
            <Link href="/" className="shrink-0">
              <Logo light={false} />
            </Link>

            {/* Mode Switcher pill capsule (Turkish) */}
            <div className="hidden md:flex bg-slate-100 p-0.5 rounded-full border border-slate-200/60 text-[10px] font-black uppercase tracking-wider select-none shrink-0">
              <button 
                onClick={() => setIsBrandMode(false)}
                className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                  !isBrandMode 
                    ? "bg-white text-slate-800 font-black shadow-sm" 
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                Bireysel
              </button>
              <button 
                onClick={() => setIsBrandMode(true)}
                className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                  isBrandMode 
                    ? "bg-white text-slate-800 font-black shadow-sm" 
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                Tüzel
              </button>
            </div>

            {/* Categories Hamburger Trigger (Turkish) */}
            <button className="hidden lg:flex items-center gap-1.5 font-black text-xs text-slate-700 hover:bg-slate-50 px-3.5 py-2.5 rounded-full transition-all cursor-pointer active:scale-95 border border-slate-200/60">
              <Menu size={16} strokeWidth={2.5} className="text-[#001819]" />
              <span>Kategoriler</span>
            </button>

            {/* Oversized Pinned Search Bar (Turkish) */}
            <div className="order-3 w-full md:order-none md:flex-1 md:max-w-xl" ref={searchRef}>
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                  placeholder="Milyonlarca ürün arasından ara..."
                  className="w-full rounded-full border-none bg-slate-100 py-2.5 pl-5 pr-14 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:ring-4 focus:ring-slate-200 focus:bg-white"
                />
                <button className="absolute right-1 top-1 bottom-1 rounded-full bg-[#001819] px-4 text-white hover:bg-slate-800 transition-colors active:scale-95 flex items-center justify-center cursor-pointer">
                  <Search size={14} strokeWidth={2.5} />
                </button>

                {/* Autocomplete dropdown */}
                {showResults && (
                  <SearchResults results={searchResults} onClose={() => setShowResults(false)} />
                )}
              </div>
            </div>

            {/* Header Action Controls */}
            <nav className="flex items-center gap-3.5 md:gap-5 text-slate-700">
              
              {/* Account Dropdown */}
              {isMounted && !!token ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-2 hover:bg-slate-100 active:scale-95 transition-all text-xs font-black cursor-pointer"
                  >
                    <User size={18} strokeWidth={2.5} className="text-[#001819]" />
                    <span className="hidden lg:inline line-clamp-1 max-w-[80px] text-slate-800">{user?.name}</span>
                  </button>
                  {isUserMenuOpen && (
                    <UserMenu user={user} onClose={() => setIsUserMenuOpen(false)} onLogout={logout} />
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-2 hover:bg-slate-100 active:scale-95 transition-all text-xs font-black cursor-pointer"
                >
                  <User size={18} strokeWidth={2.5} className="text-[#001819]" />
                </button>
              )}

              {/* Favorites Heart Icon */}
              <Link
                href="/favoriler"
                className="relative flex items-center justify-center h-9 w-9 rounded-full hover:bg-slate-100 active:scale-95 transition-all text-slate-800"
              >
                <Heart size={18} strokeWidth={2.5} className="text-[#001819]" />
                {isMounted && favoriteCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-black text-white border border-white leading-none">
                    {favoriteCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative flex items-center justify-center h-9 w-9 rounded-full hover:bg-slate-100 active:scale-95 transition-all text-slate-800"
              >
                <ShoppingCart size={18} strokeWidth={2.5} className="text-[#001819]" />
                {isMounted && totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-black text-white border border-white leading-none animate-bounce">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* Desktop-only: Sell Item Premium Yellow Button (Turkish) */}
              <button
                onClick={() => router.push("/yonetim/urunler")}
                className="hidden md:block bg-[#fed65b] text-[#745c00] hover:bg-[#fed65b]/90 px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all cursor-pointer active:scale-95 shadow-sm border border-[#e9c349]/20"
              >
                Ürün Sat
              </button>

              {/* Mobile-only: Mode Switcher segment toggle (Bireysel / Tüzel) */}
              <div className="flex md:hidden bg-slate-100 p-0.5 rounded-full border border-slate-200/60 text-[9px] font-black uppercase tracking-wider select-none shrink-0 gap-0.5">
                <button 
                  onClick={() => setIsBrandMode(false)}
                  className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                    !isBrandMode 
                      ? "bg-white text-slate-800 font-black shadow-sm" 
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  Bireysel
                </button>
                <button 
                  onClick={() => setIsBrandMode(true)}
                  className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                    isBrandMode 
                      ? "bg-white text-slate-800 font-black shadow-sm" 
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  Tüzel
                </button>
              </div>

            </nav>
          </div>

          {/* Sub-navigation bar inside header (Turkish) */}
          <nav className="mt-3.5 flex items-center gap-6 overflow-x-auto no-scrollbar border-t border-slate-100 pt-2.5 text-xs font-black text-slate-500 select-none">
            <Link href="/" className="hover:text-slate-900 pb-1 flex items-center gap-1.5 whitespace-nowrap text-slate-900 font-extrabold border-b-2 border-[#001819]">
              <Zap size={14} className="text-amber-500 fill-amber-500 shrink-0 animate-bounce" /> Flaş Fırsatlar
            </Link>
            <Link href="/" className="hover:text-slate-900 pb-1 flex items-center gap-1.5 whitespace-nowrap">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> Sadece Onaylılar
            </Link>
            <Link href="/" className="hover:text-slate-900 pb-1 flex items-center gap-1.5 whitespace-nowrap">
              <Shirt size={14} className="text-blue-500 shrink-0" /> Giyim
            </Link>
            <Link href="/" className="hover:text-slate-900 pb-1 flex items-center gap-1.5 whitespace-nowrap">
              <HomeIcon size={14} className="text-orange-500 shrink-0" /> Ev & Yaşam
            </Link>
            <Link href="/" className="hover:text-slate-900 pb-1 flex items-center gap-1.5 whitespace-nowrap">
              <Laptop size={14} className="text-indigo-500 shrink-0" /> Elektronik
            </Link>
            <Link href="/" className="hover:text-slate-900 pb-1 flex items-center gap-1.5 whitespace-nowrap">
              <Smile size={14} className="text-purple-500 shrink-0" /> Bebek & Çocuk
            </Link>
            <Link href="/" className="hover:text-slate-900 pb-1 flex items-center gap-1.5 whitespace-nowrap">
              <Sparkles size={14} className="text-pink-500 shrink-0" /> Kozmetik
            </Link>
            <Link href="/" className="hover:text-slate-900 pb-1 flex items-center gap-1.5 whitespace-nowrap">
              <Activity size={14} className="text-red-500 shrink-0" /> Spor & Outdoor
            </Link>
          </nav>

        </div>
      </header>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  );
};
