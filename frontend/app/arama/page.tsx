"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { apiClient } from "@/lib/api";
import { FilterSidebar, FilterState } from "@/components/organisms/FilterSidebar";
import { ProductGrid } from "@/components/organisms/ProductGrid";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

// Ana Arama Bileşeni
const SearchPageContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [options, setOptions] = useState({ brands: [], categories: [] });
  const [dynamicFacets, setDynamicFacets] = useState<Array<{name: string, options: string[]}>>([]);

  // Dinamik özellikleri (attr_) URL'den topla
  const dynamicFilters: Record<string, string[]> = {};
  searchParams.forEach((value, key) => {
    if (key.startsWith("attr_")) {
      if (!dynamicFilters[key]) dynamicFilters[key] = [];
      dynamicFilters[key].push(value);
    }
  });

  // Mevcut URL parametrelerinden filtre state'ini oluştur
  const currentFilters: FilterState = {
    kategori: searchParams.get("kategori") || undefined,
    altkategori: searchParams.get("altkategori") || undefined,
    marka: searchParams.getAll("marka"), // URL'de birden fazla ?marka=X&marka=Y olabilir
    minFiyat: searchParams.get("minFiyat") || undefined,
    maxFiyat: searchParams.get("maxFiyat") || undefined,
    ...dynamicFilters,
  };
  
  const query = searchParams.get("q") || undefined;

  useEffect(() => {
    // Sayfa yüklendiğinde marka ve kategori seçeneklerini çek
    const fetchOptions = async () => {
      try {
        const res = await apiClient.get("/products/meta/options");
        setOptions(res.data?.data || { brands: [], categories: [] });
      } catch (err) {
        console.error("Options fetch error", err);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    // Filtreler değiştiğinde ürünleri çek
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // API'ye göndermek için query parametrelerini hazırla
        const params = new URLSearchParams();
        if (currentFilters.kategori) params.append("category", currentFilters.altkategori || currentFilters.kategori);
        if (query) params.append("search", query);
        if (currentFilters.minFiyat) params.append("minPrice", currentFilters.minFiyat);
        if (currentFilters.maxFiyat) params.append("maxPrice", currentFilters.maxFiyat);
        currentFilters.marka?.forEach(m => params.append("brand", m));

        // Paging defaults for now
        params.append("limit", "24");

        const res = await apiClient.get(`/products?${params.toString()}`);
        setProducts(res.data?.data?.products || []);
        setTotal(res.data?.data?.pagination?.total || 0);
        setDynamicFacets(res.data?.data?.facets || []);
      } catch (err) {
        console.error("Products fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [
    currentFilters.kategori,
    currentFilters.altkategori,
    currentFilters.minFiyat,
    currentFilters.maxFiyat,
    query,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(currentFilters.marka)
  ]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Parametreyi güncelle veya sil
    if (value === undefined || value === "") {
      params.delete(key as string);
    } else if (Array.isArray(value)) {
      params.delete(key as string);
      value.forEach((v) => params.append(key as string, v));
    } else {
      params.set(key as string, value);
    }

    // Eğer ana kategori değişirse alt kategoriyi sıfırla
    if (key === "kategori") {
      params.delete("altkategori");
    }

    // URL'i güncelle (shallow push ile state'i yeniden tetikle)
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-6 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-orange-500 flex items-center gap-1 transition-colors">
            <Home size={14} /> Anasayfa
          </Link>
          <ChevronRight size={14} />
          {query ? (
            <span className="font-semibold text-slate-800">Arama: {query}</span>
          ) : (
            <>
              {currentFilters.kategori ? (
                <Link 
                  href={`/arama?kategori=${encodeURIComponent(currentFilters.kategori)}`} 
                  className={`hover:text-orange-500 transition-colors ${!currentFilters.altkategori ? 'font-semibold text-slate-800' : ''}`}
                >
                  {currentFilters.kategori}
                </Link>
              ) : (
                <span className="font-semibold text-slate-800">Tüm Ürünler</span>
              )}
              
              {currentFilters.altkategori && (
                <>
                  <ChevronRight size={14} />
                  <span className="font-semibold text-slate-800">{currentFilters.altkategori}</span>
                </>
              )}
            </>
          )}
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          <FilterSidebar 
            filters={currentFilters} 
            options={options} 
            dynamicFacets={dynamicFacets}
            onFilterChange={handleFilterChange} 
          />
          <ProductGrid 
            products={products} 
            loading={loading} 
            total={total} 
            searchQuery={query}
            categoryQuery={currentFilters.altkategori || currentFilters.kategori}
          />
        </div>
        
      </div>
    </div>
  );
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Yükleniyor...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
