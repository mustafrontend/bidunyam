"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  User, 
  ShoppingCart, 
  Search, 
  Heart, 
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
import { CategoriesMegaMenu } from "./CategoriesMegaMenu";
import { useSearchSessionStore } from "@/stores/searchSessionStore";

interface Product {
  id: string;
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
}

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const totalItems = useCartStore((s) => s.getTotalItems());
  const { user, token, logout } = useAuthStore();
  const favoriteCount = useFavoriteStore((s) => s.productIds.length);
  const fetchFavorites = useFavoriteStore((s) => s.fetchFavorites);
  const clearFavorites = useFavoriteStore((s) => s.clearFavorites);
  const { isLoginModalOpen, setLoginModalOpen } = useUiStore();

  const [isMounted, setIsMounted] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchCategories, setSearchCategories] = useState<string[]>([]);
  const [searchSubCategories, setSearchSubCategories] = useState<string[]>([]);
  const [searchBrands, setSearchBrands] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const { lastSearchedCategory, lastSearchedSubCategory, clearSearchSession, addRecentSearch } = useSearchSessionStore();

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
    if (token && user?.role === 'CUSTOMER') {
      fetchFavorites(token);
    } else {
      clearFavorites();
    }
  }, [token, user?.role, fetchFavorites, clearFavorites]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.length >= 0 && showResults) {
        try {
          const userIdParam = user?.id ? `&userId=${user.id}` : "";
          const sessionParam = lastSearchedCategory ? `&category=${encodeURIComponent(lastSearchedCategory)}` : "";
          const sessionSubParam = lastSearchedSubCategory ? `&subCategory=${encodeURIComponent(lastSearchedSubCategory)}` : "";
          const res = await apiClient.get(`/search?q=${searchQuery}${userIdParam}${sessionParam}${sessionSubParam}`);
          
          if (searchQuery.length > 0) {
            setSearchResults(res.data.data || []);
            let cats = res.data.categories || [];
            let subCats = res.data.subCategories || [];
            if (cats.length === 0) {
               const ALL_CATS = ["Elektronik", "Moda", "Ev & Yaşam", "Anne & Bebek", "Kozmetik", "Spor", "Otomobil"];
               cats = ALL_CATS.filter((c: string) => c.toLowerCase().includes(searchQuery.toLowerCase())).slice(0,3);
            }
            let brnds = res.data.brands || [];
            if (brnds.length === 0) {
               const ALL_BRANDS = ["Apple", "Samsung", "Xiaomi", "Nike", "Adidas", "Puma", "Fiat", "Ford"];
               brnds = ALL_BRANDS.filter((b: string) => b.toLowerCase().includes(searchQuery.toLowerCase())).slice(0,3);
            }
            
            setSearchCategories(cats);
            setSearchSubCategories(subCats);
            setSearchBrands(brnds);
            setRecommended([]);
          } else {
            setSearchResults([]);
            setSearchCategories([]);
            setSearchBrands([]);
            setRecommended(res.data.recommended?.length ? res.data.recommended : []);
          }
        } catch (err) {
          console.error("Search failed", err);
        }
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, showResults, user?.id]);

  if (pathname?.startsWith("/yonetim") || pathname?.startsWith("/admin")) return null;

  return (
    <>
      {/* 1. Top Bar Notification (Can Alıcı Mikro Kampanya Alanı) */}
      <div className="w-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-slate-400 py-2 text-center text-[11px] font-medium tracking-wide select-none border-b border-slate-900">
        Milyonlarca Ürün, Güvenli Teslimat, 24/7 Destek.{" "}
        <span className="text-white font-semibold underline underline-offset-4 ml-1 cursor-pointer hover:text-[#ff5000] transition-colors duration-200">
          Alışverişe Başla
        </span>
      </div>

      {/* 2. Main Premium Wide Sticky Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl text-slate-900 border-b border-slate-100 transition-all duration-300">
        <div className="w-full max-w-full px-4 md:px-12 2xl:px-16 py-3.5 mx-auto">
          <div className="flex items-center justify-between gap-8 lg:gap-16">
            
            {/* Left Section: Branding & Catalog Directory */}
            <div className="flex items-center gap-8 shrink-0">
              <Link href="/" className="transition-transform duration-300 hover:scale-[1.01] active:scale-[0.98]">
                <Logo light={false} />
              </Link>
              <div className="hidden lg:block border-l border-slate-200 pl-6 transition-colors duration-300 hover:border-[#ff5000]/30">
                <CategoriesMegaMenu />
              </div>
            </div>

            {/* Middle Section: Fluid Ultra-Wide Search Bar */}
            <div className="flex-1 hidden md:block" ref={searchRef}>
              <div className="relative w-full group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#ff5000] transition-colors duration-300">
                  <Search size={15} strokeWidth={2.2} />
                </div>
                {/* Active Session Badge */}
                {(lastSearchedCategory || lastSearchedSubCategory) && (
                  <div className="absolute inset-y-0 left-10 flex items-center">
                    <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-[#ff5000] px-2 py-1 rounded-md text-[10px] font-bold">
                      <span className="w-3 h-3">🏷️</span>
                      {lastSearchedSubCategory || lastSearchedCategory} içinde ara
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          clearSearchSession();
                        }}
                        className="ml-1 hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowResults(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      setShowResults(false);
                      addRecentSearch(searchQuery);
                      const catQuery = lastSearchedCategory ? `&kategori=${encodeURIComponent(lastSearchedCategory)}` : "";
                      const subCatQuery = lastSearchedSubCategory ? `&altkategori=${encodeURIComponent(lastSearchedSubCategory)}` : "";
                      router.push(`/arama?q=${encodeURIComponent(searchQuery)}${catQuery}${subCatQuery}`);
                    }
                  }}
                  placeholder={(lastSearchedCategory || lastSearchedSubCategory) ? "Ürün arayın..." : "Ürün, kategori veya marka ara..."}
                  className={`w-full bg-slate-50 border border-slate-200 text-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#ff5000]/20 focus:border-[#ff5000] transition-all duration-300 shadow-inner ${(lastSearchedCategory || lastSearchedSubCategory) ? 'pl-48' : 'pl-11'} pr-12 py-3.5 font-medium placeholder:text-slate-400`}
                />
                
                {/* Search Button Indicator */}
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <div className="w-8 h-8 rounded-xl bg-[#ff5000] text-white flex items-center justify-center shadow-md shadow-[#ff5000]/20 cursor-pointer hover:bg-orange-600 transition-colors"
                    onClick={() => {
                      if (searchQuery.trim()) {
                        setShowResults(false);
                        addRecentSearch(searchQuery);
                        const catQuery = lastSearchedCategory ? `&kategori=${encodeURIComponent(lastSearchedCategory)}` : "";
                        const subCatQuery = lastSearchedSubCategory ? `&altkategori=${encodeURIComponent(lastSearchedSubCategory)}` : "";
                        router.push(`/arama?q=${encodeURIComponent(searchQuery)}${catQuery}${subCatQuery}`);
                      }
                    }}
                  >
                    <Search size={14} strokeWidth={2.5} />
                  </div>
                </div>

                {/* Dropdown Results Area */}
                {showResults && (
                  <SearchResults 
                    query={searchQuery}
                    results={searchResults}
                    categories={searchCategories}
                    subCategories={searchSubCategories}
                    brands={searchBrands}
                    recentSearches={recentSearches}
                    recommended={recommended}
                    onClose={() => setShowResults(false)}
                  />
                )}
              </div>
            </div>

            {/* Right Section: Core Interactive Profile & Cart Engine */}
            <nav className="flex items-center gap-3.5 md:gap-5 shrink-0">
              
              {/* Identity Handler Module */}
              {isMounted && !!token ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 bg-slate-950 hover:bg-[#ff5000] active:scale-[0.97] transition-all duration-300 text-xs font-medium cursor-pointer text-white shadow-md shadow-slate-950/10"
                  >
                    <User size={15} strokeWidth={2} />
                    <span className="hidden lg:inline max-w-[90px] truncate tracking-wide">{user?.name}</span>
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100/80 z-50">
                      <UserMenu user={user} onClose={() => setIsUserMenuOpen(false)} onLogout={logout} />
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 border border-slate-200 hover:border-[#ff5000]/40 hover:bg-[#ff5000]/5 active:scale-[0.97] transition-all duration-300 text-xs font-medium cursor-pointer text-slate-700 group"
                >
                  <User size={15} strokeWidth={2} className="text-slate-400 group-hover:text-[#ff5000] transition-colors duration-300" />
                  <span className="hidden lg:inline group-hover:text-slate-900 transition-colors duration-300">Giriş Yap</span>
                </button>
              )}

              {/* Wishlist Icon Button */}
              <Link
                href="/favorites"
                className="relative flex items-center justify-center h-10 w-10 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100/70 active:scale-[0.96] transition-all duration-300 group"
              >
                <Heart size={18} strokeWidth={2} className="text-slate-600 group-hover:text-red-500 group-hover:fill-red-500 transition-all duration-300" />
                {isMounted && favoriteCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-slate-950 px-1 text-[9px] font-bold text-white border-2 border-white leading-none">
                    {favoriteCount}
                  </span>
                )}
              </Link>

              {/* Dynamic Basket Controller */}
              <Link
                href="/cart"
                className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-slate-50 hover:bg-[#ff5000]/5 active:scale-[0.96] transition-all duration-300 group border border-slate-100/40 hover:border-[#ff5000]/20"
              >
                <ShoppingCart size={17} strokeWidth={2} className="text-slate-700 group-hover:text-[#ff5000] transition-colors duration-300" />
                {isMounted && totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#ff5000] px-1 text-[9px] font-bold text-white border-2 border-white leading-none shadow-sm shadow-[#ff5000]/20">
                    {totalItems}
                  </span>
                )}
              </Link>

            </nav>
          </div>

          {/* Mobile Search Viewport Node */}
          <div className="mt-3 block md:hidden" ref={searchRef}>
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowResults(true)}
                placeholder="Ürün, marka veya kategori ara..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-4 pr-10 text-xs font-medium text-slate-800 outline-none"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={15} />
              </button>
            </div>
          </div>

          {/* 3. Fluid Sub-Navigation Layer (Yarı Opak Filtreli Premium Alan) */}
          <nav className="mt-3.5 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-slate-100 pt-3 text-xs font-medium text-slate-500 select-none scroll-smooth snap-x group/nav">
            
            {/* Flaş Fırsatlar: Turuncu & Siyah Lüks Kapsül */}
            <Link href="/arama?kampanya=flas" className="snap-start group relative flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950 text-white font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shrink-0 shadow-sm hover:bg-[#ff5000] group-hover/nav:opacity-100">
              <div className="relative flex h-2 w-2 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"></span>
              </div>
              <Zap size={14} className="text-amber-400 fill-amber-400 group-hover:text-white group-hover:fill-white transition-colors duration-300 shrink-0" /> 
              <span>Flaş Fırsatlar</span>
            </Link>

            {/* Diğer Fluid Linkler: Hover anında diğerlerini %60 opaklığa düşürür */}
            <Link href="/arama?onayli=true" className="snap-start group flex items-center gap-1.5 px-4 py-2 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/80 text-slate-600 hover:text-slate-900 font-medium transition-all duration-300 shrink-0 group-hover/nav:hover:!opacity-100 group-hover/nav:opacity-60">
              <CheckCircle2 size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors duration-300 shrink-0" /> 
              <span>Sadece Onaylılar</span>
            </Link>

            <Link href="/arama?kategori=Giyim" className="snap-start group flex items-center gap-1.5 px-4 py-2 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/80 text-slate-600 hover:text-slate-900 font-medium transition-all duration-300 shrink-0 group-hover/nav:hover:!opacity-100 group-hover/nav:opacity-60">
              <Shirt size={14} className="text-slate-400 group-hover:text-[#ff5000] transition-colors duration-300 shrink-0" /> 
              <span>Giyim</span>
            </Link>

            <Link href="/arama?kategori=Ev%20%26%20Yaşam" className="snap-start group flex items-center gap-1.5 px-4 py-2 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/80 text-slate-600 hover:text-slate-900 font-medium transition-all duration-300 shrink-0 group-hover/nav:hover:!opacity-100 group-hover/nav:opacity-60">
              <HomeIcon size={14} className="text-slate-400 group-hover:text-orange-500 transition-colors duration-300 shrink-0" /> 
              <span>Ev & Yaşam</span>
            </Link>

            <Link href="/arama?kategori=Elektronik" className="snap-start group flex items-center gap-1.5 px-4 py-2 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/80 text-slate-600 hover:text-slate-900 font-medium transition-all duration-300 shrink-0 group-hover/nav:hover:!opacity-100 group-hover/nav:opacity-60">
              <Laptop size={14} className="text-slate-400 group-hover:text-indigo-500 transition-colors duration-300 shrink-0" /> 
              <span>Elektronik</span>
            </Link>

            <Link href="/arama?kategori=Bebek%20%26%20Çocuk" className="snap-start group flex items-center gap-1.5 px-4 py-2 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/80 text-slate-600 hover:text-slate-900 font-medium transition-all duration-300 shrink-0 group-hover/nav:hover:!opacity-100 group-hover/nav:opacity-60">
              <Smile size={14} className="text-slate-400 group-hover:text-purple-500 transition-colors duration-300 shrink-0" /> 
              <span>Bebek & Çocuk</span>
            </Link>

            <Link href="/arama?kategori=Kozmetik" className="snap-start group flex items-center gap-1.5 px-4 py-2 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/80 text-slate-600 hover:text-slate-900 font-medium transition-all duration-300 shrink-0 group-hover/nav:hover:!opacity-100 group-hover/nav:opacity-60">
              <Sparkles size={14} className="text-slate-400 group-hover:text-pink-500 transition-colors duration-300 shrink-0" /> 
              <span>Kozmetik</span>
            </Link>

            <Link href="/arama?kategori=Spor%20%26%20Outdoor" className="snap-start group flex items-center gap-1.5 px-4 py-2 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/80 text-slate-600 hover:text-slate-900 font-medium transition-all duration-300 shrink-0 group-hover/nav:hover:!opacity-100 group-hover/nav:opacity-60">
              <Activity size={14} className="text-slate-400 group-hover:text-rose-500 transition-colors duration-300 shrink-0" /> 
              <span>Spor & Outdoor</span>
            </Link>

          </nav>

        </div>
      </header>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  );
};