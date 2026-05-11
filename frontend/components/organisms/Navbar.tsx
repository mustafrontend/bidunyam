"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { LoginModal } from '../molecules/LoginModal';
import { apiClient } from '@/lib/api';
import { Logo } from '../atoms/Logo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { user, logout, isAuthenticated } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
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
      <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-sm">
        <div className="w-full border-b border-slate-100 bg-[#f6f6f6]">
          <div className="mx-auto w-full max-w-7xl px-4 py-2 text-[11px] text-slate-600 md:px-6">
            <div className="flex flex-wrap items-center justify-end gap-3 md:gap-6">
              <span>Siparislerim</span>
              <span>Super Fiyat</span>
              <span>Kampanyalar</span>
              <span>Girisimci Kadinlar</span>
              <span>Musteri Hizmetleri</span>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 py-3 md:px-6 md:py-4">
          <div className="flex flex-wrap items-center gap-3 md:gap-5">
            <Link href="/" className="shrink-0">
              <Logo />
            </Link>

            {/* Search Bar with Elasticsearch */}
            <div className="order-3 w-full md:order-0 md:flex md:flex-1 md:max-w-2xl" ref={searchRef}>
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                  placeholder="Urun, kategori veya marka ara"
                  className="w-full rounded-lg border-2 border-[#ff6000]/55 bg-white py-3 pl-4 pr-20 text-sm outline-none transition-all focus:border-[#ff6000]"
                />
                <button className="absolute right-1 top-1 bottom-1 rounded-md bg-[#ff6000] px-4 text-xs font-black text-white">
                  ARA
                </button>
                {isSearching && <p className="mt-1 text-[10px] text-[#ff6000]">Araniyor...</p>}

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
              <div className="hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 md:block">
                Konum
                <p className="font-semibold text-[#ff6000]">Konum sec</p>
              </div>

            {isMounted && isAuthenticated() ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700"
                >
                  {user?.name}
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-bold text-red-500 transition-colors hover:bg-red-50"
                    >
                      Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700"
              >
                Giris Yap
              </button>
            )}

            <Link href="/cart" className="relative rounded-lg bg-[#75757a] px-4 py-2 text-xs font-black text-white">
              Sepetim
              {isMounted && totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-[#75757a]">
                  {totalItems}
                </span>
              )}
            </Link>
          </nav>
        </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#f3f3f3]">
            <div className="h-full w-1/4 bg-[#ff6000]" />
          </div>
        </div>
      </header>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
};
