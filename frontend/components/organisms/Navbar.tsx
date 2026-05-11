"use client";

import React, { useEffect, useState, useRef } from 'react';
import { ShoppingCart, User, Search, Menu, LogOut, ChevronDown, Loader2 } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { LoginModal } from '../molecules/LoginModal';
import { apiClient } from '@/lib/api';
import { Logo } from '../atoms/Logo';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export const Navbar: React.FC = () => {
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
  const router = useRouter();

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

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white border-b-[0.5px] border-slate-200 h-16 md:h-20 flex items-center shadow-sm">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-6 flex items-center justify-between gap-4 md:gap-8">
          <Link href="/" className="flex-shrink-0">
            <Logo />
          </Link>

          {/* Search Bar with Elasticsearch */}
          <div className="hidden md:flex flex-1 max-w-2xl relative group" ref={searchRef}>
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                placeholder="Ürün, kategori veya marka ara..."
                className="w-full bg-white border-[0.5px] border-slate-200 rounded-lg py-3 px-4 pl-12 text-sm focus:ring-2 focus:ring-brand-orange transition-all outline-none font-medium shadow-sm hover:border-slate-300"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                {isSearching ? <Loader2 size={18} className="animate-spin text-brand-orange" /> : <Search className="text-slate-400" size={18} />}
              </div>
              <button className="absolute right-1 top-1 bottom-1 px-4 bg-brand-orange text-white rounded-md text-xs font-black active:scale-95 transition-all">
                ARA
              </button>
            </div>

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-[0.5px] border-slate-200 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2">
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((product) => (
                      <Link 
                        key={product.id} 
                        href={`/product/${product.id}`}
                        onClick={() => setShowResults(false)}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors group"
                      >
                        <img src={product.imageUrl} className="w-12 h-12 object-cover rounded-lg bg-slate-100" alt="" />
                        <div>
                          <p className="text-sm font-black text-slate-900 line-clamp-1">{product.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.brand} • {product.category}</p>
                        </div>
                        <div className="ml-auto text-sm font-black text-brand-orange">
                          {product.price.toLocaleString('tr-TR')} TL
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 font-bold text-sm">Sonuç bulunamadı.</div>
                )}
              </div>
            )}
          </div>

          <nav className="flex items-center gap-2 md:gap-6">
            {isMounted && isAuthenticated() ? (
              <div className="relative">
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-brand-orange transition-colors group">
                  <User size={22} className="group-active:scale-90 transition-transform" />
                  <div className="flex items-center gap-0.5">
                    <span className="text-[10px] md:text-xs font-bold capitalize">{user?.name}</span>
                    <ChevronDown size={12} />
                  </div>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white border-[0.5px] border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="w-full px-4 py-2 text-left text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors">
                      <LogOut size={16} />
                      Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setIsLoginModalOpen(true)} className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-brand-orange transition-colors group">
                <User size={22} className="group-active:scale-90 transition-transform" />
                <span className="text-[10px] md:text-xs font-bold">Giriş Yap</span>
              </button>
            )}
            
            <Link href="/cart" className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-brand-orange transition-colors group relative">
              <ShoppingCart size={22} className="group-active:scale-90 transition-transform" />
              <span className="text-[10px] md:text-xs font-bold">Sepetim</span>
              {isMounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-orange text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in">
                  {totalItems}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
};
