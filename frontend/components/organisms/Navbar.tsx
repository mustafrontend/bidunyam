"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useFavoriteStore } from '@/stores/favoriteStore';
import { useUiStore } from '@/stores/uiStore';
import { LoginModal } from '../molecules/LoginModal';
import { apiClient } from '@/lib/api';
import { Logo } from '../atoms/Logo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { user, token, logout } = useAuthStore();
  const favoriteCount = useFavoriteStore((state) => state.productIds.length);
  const fetchFavorites = useFavoriteStore((state) => state.fetchFavorites);
  const clearFavorites = useFavoriteStore((state) => state.clearFavorites);
  const { isLoginModalOpen, setLoginModalOpen } = useUiStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (token) {
      fetchFavorites(token);
      return;
    }

    clearFavorites();
  }, [token, fetchFavorites, clearFavorites]);

  // Search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const res = await apiClient.get(`/search?q=${searchQuery}`);
          setSearchResults(res.data.data);
          setShowResults(true);
        } catch (err) {
          console.error("Search failed", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Admin panelde global magazaya ait header gorunmesin.
  if (pathname?.startsWith('/yonetim')) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white shadow-sm">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 md:px-8 md:py-4">
          <div className="flex flex-wrap items-center gap-3 md:gap-5">
            <Link href="/" className="shrink-0">
              <Logo />
            </Link>

            {/* Search Bar */}
            <div className="order-3 w-full md:order-0 md:flex md:flex-1 md:max-w-2xl" ref={searchRef}>
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                  placeholder="Ürün, kategori veya marka ara..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-20 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
                />
                <button className="absolute bottom-1 right-1 top-1 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white transition-colors hover:bg-brand-orange">
                  Ara
                </button>

                {/* Search Results Dropdown */}
                {showResults && (
                  <div className="absolute left-0 right-0 top-full z-60 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
                    {searchResults.length > 0 ? (
                      <div className="py-2">
                        {searchResults.map((product) => (
                          <Link
                            key={product.id}
                            href={`/product/${product.id}`}
                            onClick={() => setShowResults(false)}
                            className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-slate-50"
                          >
                            <img src={product.imageUrl} className="h-12 w-12 rounded-lg bg-slate-100 object-cover" alt="" />
                            <div>
                              <p className="line-clamp-1 text-sm font-black text-slate-900">{product.name}</p>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{product.brand} • {product.category}</p>
                            </div>
                            <div className="ml-auto text-sm font-black text-[#ff6000]">
                              {product.price.toLocaleString('tr-TR')} TL
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-sm font-bold text-slate-400">Sonuc bulunamadi.</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <nav className="ml-auto flex items-center gap-2 md:gap-3">
              {isMounted && !!token ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 transition-colors"
                  >
                    {user?.name}
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
                      <Link
                        href="/favorites"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block w-full px-4 py-2 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        Favorilerim
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          clearFavorites();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
                      >
                        Çıkış Yap
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 transition-colors"
                >
                  Giriş Yap
                </button>
              )}

              <Link
                href="/favorites"
                onClick={(e) => {
                  if (!token) {
                    e.preventDefault();
                    setLoginModalOpen(true);
                  }
                }}
                className="relative flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-rose-300 hover:text-rose-600 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12.001 20.729l-.321-.294C6.4 15.6 3 12.5 3 8.7 3 5.72 5.42 3.3 8.4 3.3c1.73 0 3.39.81 4.45 2.09A6.03 6.03 0 0117.3 3.3C20.28 3.3 22.7 5.72 22.7 8.7c0 3.8-3.4 6.9-8.68 11.74l-.319.289z" />
                </svg>
                Favorilerim
                {isMounted && favoriteCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-50 text-[11px] font-bold text-rose-700">
                    {favoriteCount}
                  </span>
                )}
              </Link>

              <Link
                href="/cart"
                className="relative flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-orange transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Sepetim
                {isMounted && totalItems > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-900">
                    {totalItems}
                  </span>
                )}
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  );
};
