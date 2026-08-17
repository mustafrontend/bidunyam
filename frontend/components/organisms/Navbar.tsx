"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  User, 
  ShoppingCart, 
  Search, 
  Heart,
  FileText,
  Package,
  MessageSquare,
  Globe,
  ChevronDown,
  Sparkles,
  Smartphone,
  Store
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
import { NavCategories } from "./NavCategories";
import { useSearchSessionStore } from "@/stores/searchSessionStore";

interface Product {
  id: string;
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
}

const CATEGORY_OPTIONS = [
  "Tüm Kategoriler",
  "Elektronik",
  "Moda & Giyim",
  "Ev & Yaşam",
  "Kozmetik",
  "Yapı Market",
  "Otomobil",
  "Anne & Bebek",
];

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
  const [selectedCategory, setSelectedCategory] = useState("Tüm Kategoriler");
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchCategories, setSearchCategories] = useState<string[]>([]);
  const [searchSubCategories, setSearchSubCategories] = useState<string[]>([]);
  const [searchBrands, setSearchBrands] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const catDropdownRef = useRef<HTMLDivElement>(null);

  const { lastSearchedCategory, lastSearchedSubCategory, clearSearchSession, addRecentSearch } = useSearchSessionStore();

  useEffect(() => {
    setIsMounted(true);
    const clickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setIsCatDropdownOpen(false);
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
          const cat = selectedCategory !== "Tüm Kategoriler" ? selectedCategory : (lastSearchedCategory || "");
          const sessionParam = cat ? `&category=${encodeURIComponent(cat)}` : "";
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
  }, [searchQuery, showResults, user?.id, selectedCategory, lastSearchedCategory, lastSearchedSubCategory]);

  if (pathname?.startsWith("/yonetim") || pathname?.startsWith("/admin") || pathname?.startsWith("/magaza")) return null;

  const handleSearchSubmit = () => {
    if (searchQuery.trim() || selectedCategory !== "Tüm Kategoriler") {
      setShowResults(false);
      if (searchQuery.trim()) addRecentSearch(searchQuery);
      const catQuery = selectedCategory !== "Tüm Kategoriler" ? `&kategori=${encodeURIComponent(selectedCategory)}` : (lastSearchedCategory ? `&kategori=${encodeURIComponent(lastSearchedCategory)}` : "");
      router.push(`/arama?q=${encodeURIComponent(searchQuery)}${catQuery}`);
    }
  };

  return (
    <>
      {/* 1. Global Sources Style Top Utility Header Bar */}
      <div className="w-full bg-slate-100/90 text-slate-600 text-xs border-b border-slate-200/60 select-none hidden md:block">
        <div className="w-full max-w-[1600px] px-4 md:px-10 xl:px-14 py-1.5 mx-auto flex items-center justify-between">
          
          {/* Left Utility Links */}
          <div className="flex items-center gap-5 text-[11px] font-medium text-slate-600">
            <Link href="/arama?kampanya=flas" className="hover:text-[#ff5000] flex items-center gap-1 transition-colors">
              <span>Fuarlar & Etkinlikler</span>
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/sozlesmeler" className="hover:text-[#ff5000] transition-colors">
              Hizmetler
            </Link>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1 cursor-pointer hover:text-[#ff5000] transition-colors">
              <Globe size={12} />
              <span>Türkçe (TR)</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1 hover:text-[#ff5000] cursor-pointer transition-colors">
              <Smartphone size={12} />
              <span>Uygulamayı İndir</span>
            </div>
          </div>

          {/* Right Utility Links */}
          <div className="flex items-center gap-4 text-[11px] font-medium text-slate-600">
            <Link href="/arama?onayli=true" className="flex items-center gap-1 bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded font-bold hover:bg-amber-500/20 transition-colors">
              <Sparkles size={11} className="fill-current" />
              <span>Sourcing Club</span>
            </Link>

            <Link href="/favorites" className="hover:text-[#ff5000] flex items-center gap-1 transition-colors">
              <Heart size={12} />
              <span>Favoriler</span>
              {isMounted && favoriteCount > 0 && <span className="font-bold text-[#ff5000]">({favoriteCount})</span>}
            </Link>

            <Link href="/cart" className="hover:text-[#ff5000] flex items-center gap-1 transition-colors">
              <ShoppingCart size={12} />
              <span>Sepetim</span>
              {isMounted && totalItems > 0 && <span className="font-bold text-[#ff5000]">({totalItems})</span>}
            </Link>

            <span className="text-slate-300">|</span>

            <Link href="/magaza" className="hover:text-[#ff5000] flex items-center gap-1 transition-colors">
              <Store size={12} />
              <span>Satıcı Ol</span>
            </Link>

            <span className="text-slate-300">|</span>

            {/* Auth / Account State */}
            {isMounted && !!token ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 font-semibold text-slate-800 hover:text-[#ff5000] transition-colors"
                >
                  <User size={13} />
                  <span>{user?.name || "Hesabım"}</span>
                  <ChevronDown size={11} />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50">
                    <UserMenu user={user} onClose={() => setIsUserMenuOpen(false)} onLogout={logout} />
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="flex items-center gap-1 font-semibold text-slate-800 hover:text-[#ff5000] transition-colors"
              >
                <User size={13} />
                <span>Giriş Yap / Kaydol</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* 2. Main Global Sources Header Navbar */}
      <header className="sticky top-0 z-50 w-full bg-white text-slate-900 border-b border-slate-200/80 shadow-xs">
        <div className="w-full max-w-[1600px] px-4 md:px-10 xl:px-14 py-3 mx-auto flex items-center justify-between gap-4 md:gap-8">
          
          {/* Logo Brand */}
          <Link href="/" className="shrink-0 transition-transform hover:scale-[1.01] active:scale-[0.98]">
            <Logo light={false} />
          </Link>

          {/* Global Sources Combined Search Bar (Integrated Category Dropdown + Input + Primary Red/Orange Button) */}
          <div className="flex-1 max-w-3xl hidden sm:block relative" ref={searchRef}>
            <div className="relative flex items-center w-full rounded-full border-2 border-[#ff5000] bg-white shadow-xs focus-within:ring-2 focus-within:ring-[#ff5000]/20">
              
              {/* Category Selector Dropdown (Left side of search input) */}
              <div className="relative shrink-0 border-r border-slate-200" ref={catDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors select-none rounded-l-full"
                >
                  <span className="truncate max-w-[110px]">{selectedCategory}</span>
                  <ChevronDown size={13} className="text-slate-400" />
                </button>

                {isCatDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-2 text-xs divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Kategori Seçin
                    </div>
                    <div className="py-1 max-h-[300px] overflow-y-auto">
                      {CATEGORY_OPTIONS.map((cat, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedCategory(cat);
                            setIsCatDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-slate-50 hover:text-[#ff5000] font-bold transition-colors flex items-center justify-between ${
                            selectedCategory === cat ? "text-[#ff5000] bg-orange-50/60" : "text-slate-700"
                          }`}
                        >
                          <span>{cat}</span>
                          {selectedCategory === cat && <span className="text-xs">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Text Input */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowResults(true)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                placeholder="Ürün, marka veya tedarikçi ara..."
                className="w-full bg-white text-xs md:text-sm px-4 py-2.5 font-medium text-slate-900 focus:outline-none placeholder:text-slate-400"
              />

              {/* Primary Search Button (Vibrant Red/Orange Action Button) */}
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="bg-[#ff5000] hover:bg-[#e04500] text-white px-6 py-2.5 font-bold text-xs md:text-sm flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer rounded-r-full"
              >
                <Search size={16} strokeWidth={2.5} />
                <span className="hidden md:inline">Ara</span>
              </button>
            </div>

            {/* Dropdown Results Area (Positioned relative to search bar wrapper) */}
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

          {/* Right Action Icons (RFQ / Teklif Al & Orders / Siparişler) */}
          <div className="flex items-center gap-4 shrink-0">
            
            {/* Request for Quotation / Teklif Al */}
            <Link
              href="/sozlesmeler"
              className="hidden lg:flex flex-col items-center justify-center text-slate-700 hover:text-[#ff5000] transition-colors group"
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <FileText size={16} className="text-[#ff5000] group-hover:scale-110 transition-transform" />
                <span>Teklif Al</span>
              </div>
              <span className="text-[10px] font-medium text-slate-400">RFQ İstekleri</span>
            </Link>

            {/* Orders / Siparişlerim */}
            <Link
              href="/account"
              className="hidden lg:flex flex-col items-center justify-center text-slate-700 hover:text-[#ff5000] transition-colors group"
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Package size={16} className="text-[#ff5000] group-hover:scale-110 transition-transform" />
                <span>Siparişler</span>
              </div>
              <span className="text-[10px] font-medium text-slate-400">Takip Et</span>
            </Link>

            {/* Mobile Actions: Basket & Favorites */}
            <div className="flex items-center gap-2 sm:hidden">
              <Link href="/favorites" className="p-2 text-slate-700 hover:text-[#ff5000]">
                <Heart size={20} />
              </Link>
              <Link href="/cart" className="p-2 text-slate-700 hover:text-[#ff5000] relative">
                <ShoppingCart size={20} />
                {isMounted && totalItems > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#ff5000] text-white text-[9px] font-bold flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>

          </div>

        </div>

        {/* Mobile Search input */}
        <div className="px-4 pb-3 sm:hidden" ref={searchRef}>
          <div className="relative flex items-center w-full rounded-full border border-slate-300 bg-slate-50 overflow-hidden">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowResults(true)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
              placeholder="Ürün, marka ara..."
              className="w-full bg-slate-50 text-xs px-4 py-2 text-slate-900 outline-none"
            />
            <button onClick={handleSearchSubmit} className="bg-[#ff5000] text-white p-2">
              <Search size={14} />
            </button>
          </div>
        </div>

        {/* Sub-Navigation Categories Line */}
        <div className="w-full max-w-[1600px] px-4 md:px-10 xl:px-14 mx-auto">
          <NavCategories />
        </div>

      </header>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  );
};