"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, ChevronDown, Star } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useFavoriteStore } from "@/stores/favoriteStore";
import { useUiStore } from "@/stores/uiStore";
import { productPath } from "@/lib/productUrl";

interface Product {
  _id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  imageUrl: string;
  category: string;
  rating: number;
  reviewCount: number;
  stock: number;
}

type SortOption = "relevance" | "price_asc" | "price_desc" | "rating" | "newest";

const SORT_LABELS: Record<SortOption, string> = {
  relevance: "En İlgili",
  price_asc: "Fiyat: Düşükten Yükseğe",
  price_desc: "Fiyat: Yüksekten Düşüğe",
  rating: "En Yüksek Puanlı",
  newest: "En Yeni",
};

const PAGE_SIZE = 24;

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="aspect-square bg-slate-100" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-1/2 bg-slate-100 rounded" />
        <div className="h-4 w-3/4 bg-slate-100 rounded" />
        <div className="h-4 w-1/3 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";
  const brandParam = searchParams.get("brand") || "";

  const addItem = useCartStore((s) => s.addItem);
  const token = useAuthStore((s) => s.token);
  const { productIds: favs, toggleFavorite } = useFavoriteStore();
  const setLoginModalOpen = useUiStore((s) => s.setLoginModalOpen);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedBrand, setSelectedBrand] = useState(brandParam);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<SortOption>("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Sidebar filter options derived from results
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return cats.sort((a, b) => a.localeCompare(b, "tr"));
  }, [products]);

  const brands = useMemo(() => {
    const bs = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));
    return bs.sort((a, b) => a.localeCompare(b, "tr"));
  }, [products]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 100 };
      if (q) params.search = q;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedBrand) params.brand = selectedBrand;

      const [dbRes, xmlRes] = await Promise.allSettled([
        apiClient.get("/products", { params }),
        apiClient.get("/products/xml/catalog", { params: { ...params, limit: 50 } }),
      ]);

      const dbProducts: Product[] =
        dbRes.status === "fulfilled"
          ? (dbRes.value.data?.data?.products || []).map((p: Record<string, unknown>) => ({
              _id: String(p.id || p._id || ""),
              name: String(p.name || ""),
              brand: String(p.brand || ""),
              price: Number(p.price) || 0,
              originalPrice: Number(p.originalPrice) || Number(p.price) || 0,
              discountPercent: Number(p.discountPercent) || 0,
              imageUrl: String(p.imageUrl || ""),
              category: String(p.category || ""),
              rating: Number(p.rating) || 4.5,
              reviewCount: Number(p.reviewCount) || 0,
              stock: Number(p.stock) || 0,
            }))
          : [];

      const xmlProducts: Product[] =
        xmlRes.status === "fulfilled"
          ? (xmlRes.value.data?.data?.products || []).map((p: Record<string, unknown>, idx: number) => ({
              _id: String(p._id || `xml-${idx}`),
              name: String(p.name || ""),
              brand: String(p.brand || "XML Market"),
              price: Number(p.price) || 0,
              originalPrice: Number(p.price) || 0,
              discountPercent: 0,
              imageUrl: String(p.imageUrl || ""),
              category: String(p.category || ""),
              rating: 4.8,
              reviewCount: 0,
              stock: Number(p.stock) || 99,
            }))
          : [];

      const combined = [...dbProducts, ...xmlProducts];
      setTotal(combined.length);
      setProducts(combined);
      setPage(1);
    } catch (err: unknown) {
      console.error("Search fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [q, selectedCategory, selectedBrand]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Client-side sort + price filter + pagination
  const filtered = useMemo(() => {
    let list = [...products];

    if (minPrice) list = list.filter((p) => p.price >= Number(minPrice));
    if (maxPrice) list = list.filter((p) => p.price <= Number(maxPrice));

    switch (sort) {
      case "price_asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        list.reverse();
        break;
    }

    return list;
  }, [products, minPrice, maxPrice, sort]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const handleFilterApply = useCallback(() => {
    setShowFilters(false);
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategory("");
    setSelectedBrand("");
    setMinPrice("");
    setMaxPrice("");
    setSort("relevance");
    setPage(1);
  }, []);

  const hasActiveFilters = selectedCategory || selectedBrand || minPrice || maxPrice || sort !== "relevance";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          {q ? (
            <h1 className="text-2xl font-black text-slate-900">
              &quot;<span className="text-[#ff5000]">{q}</span>&quot; için arama sonuçları
            </h1>
          ) : (
            <h1 className="text-2xl font-black text-slate-900">Tüm Ürünler</h1>
          )}
          <p className="text-slate-400 text-sm font-medium mt-1">
            {loading ? "Aranıyor..." : `${filtered.length} ürün bulundu`}
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-black transition-all ${
                hasActiveFilters
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
              }`}
            >
              <SlidersHorizontal size={15} />
              Filtrele
              {hasActiveFilters && (
                <span className="ml-1 bg-[#ff5000] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                  !
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 text-sm font-bold hover:text-red-500 transition-colors"
              >
                <X size={14} />
                Temizle
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:border-slate-400 transition-all"
            >
              {SORT_LABELS[sort]}
              <ChevronDown size={14} />
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl z-20 overflow-hidden">
                {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => { setSort(key); setShowSortMenu(false); setPage(1); }}
                    className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors ${
                      sort === key ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filter Sidebar */}
          {showFilters && (
            <aside className="w-64 shrink-0 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">Kategori</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => { setSelectedCategory(""); setPage(1); }}
                    className={`w-full text-left text-sm py-1 font-bold transition-colors ${!selectedCategory ? "text-[#ff5000]" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    Tümü
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setPage(1); }}
                      className={`w-full text-left text-sm py-1 font-bold transition-colors ${selectedCategory === cat ? "text-[#ff5000]" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">Marka</h2>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => { setSelectedBrand(""); setPage(1); }}
                    className={`w-full text-left text-sm py-1 font-bold transition-colors ${!selectedBrand ? "text-[#ff5000]" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    Tümü
                  </button>
                  {brands.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => { setSelectedBrand(brand); setPage(1); }}
                      className={`w-full text-left text-sm py-1 font-bold transition-colors ${selectedBrand === brand ? "text-[#ff5000]" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">Fiyat Aralığı</h2>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#ff5000]/30"
                  />
                  <span className="text-slate-400 font-black">—</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#ff5000]/30"
                  />
                </div>
                <button
                  onClick={handleFilterApply}
                  className="mt-3 w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-black hover:bg-[#ff5000] transition-colors"
                >
                  Uygula
                </button>
              </div>
            </aside>
          )}

          {/* Product Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => <ProductSkeleton key={i} />)}
              </div>
            ) : paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="text-6xl mb-6">🔍</div>
                <h2 className="text-xl font-black text-slate-800 mb-2">Sonuç bulunamadı</h2>
                <p className="text-slate-400 font-medium mb-6">
                  {q ? `"${q}" için ürün bulunamadı.` : "Bu filtrelere uygun ürün yok."}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black hover:bg-[#ff5000] transition-colors"
                  >
                    Filtreleri Temizle
                  </button>
                )}
                <Link href="/" className="mt-4 text-sm font-bold text-slate-400 hover:text-[#ff5000] transition-colors">
                  Ana Sayfaya Dön
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {paginated.map((product) => {
                    const isFav = favs.includes(product._id);
                    return (
                      <div key={product._id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer relative">
                        <Link href={productPath(product)}>
                          <div className="aspect-square bg-slate-50 relative overflow-hidden">
                            {product.discountPercent > 0 && (
                              <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                -%{product.discountPercent}
                              </span>
                            )}
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        </Link>

                        {/* Favorite Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            if (token) toggleFavorite(product._id, token);
                            else setLoginModalOpen(true);
                          }}
                          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-red-500 hover:scale-105 active:scale-95 transition-all"
                        >
                          <Star size={13} fill={isFav ? "currentColor" : "none"} className={isFav ? "text-[#ff5000]" : ""} />
                        </button>

                        <div className="p-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">{product.brand}</p>
                          <p className="text-sm font-black text-slate-800 line-clamp-2 mt-0.5 leading-snug">{product.name}</p>
                          <div className="flex items-center gap-1 mt-1.5">
                            <Star size={11} fill="currentColor" className="text-amber-500 stroke-none" />
                            <span className="text-[11px] font-black text-slate-700">{product.rating.toFixed(1)}</span>
                            {product.reviewCount > 0 && (
                              <span className="text-slate-400 text-[10px] font-bold">({product.reviewCount})</span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-base font-black text-slate-900">
                              {product.price.toLocaleString("tr-TR")} TL
                            </span>
                            {product.originalPrice > product.price && (
                              <span className="text-xs text-slate-400 line-through font-bold">
                                {product.originalPrice.toLocaleString("tr-TR")} TL
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => addItem({
                              _id: product._id,
                              name: product.name,
                              price: product.price,
                              brand: product.brand,
                              imageUrl: product.imageUrl,
                              category: product.category,
                            }, token)}
                            className="mt-3 w-full bg-slate-900 text-white py-2 rounded-xl text-xs font-black hover:bg-[#ff5000] active:scale-95 transition-all duration-200"
                          >
                            Sepete Ekle
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-10">
                    <button
                      disabled={page === 1}
                      onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0 }); }}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 disabled:opacity-40 hover:border-slate-400 transition-all"
                    >
                      ← Önceki
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => { setPage(pageNum); window.scrollTo({ top: 0 }); }}
                          className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${
                            page === pageNum
                              ? "bg-slate-900 text-white"
                              : "bg-white border border-slate-200 text-slate-700 hover:border-slate-400"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      disabled={page === totalPages}
                      onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0 }); }}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 disabled:opacity-40 hover:border-slate-400 transition-all"
                    >
                      Sonraki →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// useSearchParams() bir Suspense sınırı içinde olmalı (prerender hatası önlenir)
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 font-bold text-slate-400">
          Yükleniyor…
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
