"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useFavoriteStore } from '@/stores/favoriteStore';
import { useUiStore } from '@/stores/uiStore';

interface Product {
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
  brand: string;
}

export default function FavoritesPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUiStore((s) => s.setLoginModalOpen);
  const productIds = useFavoriteStore((s) => s.productIds);
  const fetchFavorites = useFavoriteStore((s) => s.fetchFavorites);
  const isFavoritesLoading = useFavoriteStore((s) => s.isLoading);
  const hasFetched = useFavoriteStore((s) => s.hasFetched);
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);

  const isCustomer = useMemo(() => user?.role === 'CUSTOMER', [user]);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated() || !token || !isCustomer) {
      setLoading(false);
      return;
    }
    // Eğer zaten yükleniyorsa veya zaten fetch edildiyse tekrar fetch etme
    if (!isFavoritesLoading && !hasFetched) {
      fetchFavorites(token);
    }
  }, [fetchFavorites, isAuthenticated, token, isFavoritesLoading, hasFetched, isCustomer]);

  useEffect(() => {
    const run = async () => {
      if (!token || !productIds.length) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Batch fetch — tek API çağrısı, N+1 sorunu yok
        const res = await apiClient.get('/products', {
          params: { ids: productIds.join(','), limit: productIds.length }
        });
        const items: Product[] = (res.data?.data?.products || []).map((item: Record<string, unknown>) => ({
          _id: String(item.id || item._id || ''),
          name: String(item.name || ''),
          price: Number(item.price) || 0,
          imageUrl: String(item.imageUrl || ''),
          brand: String(item.brand || 'biDunyam'),
        }));
        setProducts(items);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [productIds, token]);

  const emptyText = useMemo(() => {
    if (!isAuthenticated()) {
      return 'Favorileri görmek için giriş yapmalısın.';
    }
    return 'Henüz favori ürünün yok.';
  }, [isAuthenticated]);

  if (!isAuthenticated()) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 md:px-8">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Favorilerim</h1>
        <p className="mt-3 text-slate-500">{emptyText}</p>
        <button
          onClick={() => setLoginModalOpen(true)}
          className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-orange"
        >
          Giriş Yap
        </button>
      </div>
    );
  }

  if (isAuthenticated() && !isCustomer) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 md:px-8">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Favorilerim</h1>
        <p className="mt-3 text-slate-500">Yalnızca müşteri hesapları favorileri kullanabilir. Lütfen müşteri hesabınızla giriş yapın.</p>
        <button
          onClick={() => {
            useAuthStore.getState().logout();
            setLoginModalOpen(true);
          }}
          className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-orange"
        >
          Farklı Hesapla Giriş Yap
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Favorilerim</h1>
          <p className="mt-1 text-sm text-slate-500">{productIds.length} ürün</p>
        </div>
        <Link href="/cart" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400">
          Sepetime Git
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
              <div className="aspect-square animate-pulse bg-slate-100" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <p className="text-slate-500">{emptyText}</p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-orange"
          >
            Ürünleri Keşfet
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {products.map((product) => (
            <div key={product._id} className="group overflow-hidden rounded-2xl border border-slate-100 bg-white">
              <Link href={`/product/${product._id}`} className="block">
                <div className="aspect-square bg-slate-50">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl text-slate-300">📦</div>
                  )}
                </div>
              </Link>
              <div className="space-y-2 p-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{product.brand}</p>
                <p className="line-clamp-2 text-sm font-medium text-slate-800">{product.name}</p>
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold text-slate-900">{product.price.toLocaleString('tr-TR')} TL</p>
                  {token && (
                    <button
                      onClick={() => toggleFavorite(product._id, token)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:border-rose-300 hover:text-rose-600"
                    >
                      Kaldır
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
