"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { apiClient } from "@/lib/api";
import { getTemplate, ALL_CATEGORIES, type StoreInfo, type StoreProduct } from "@/components/store";

/** Ürünün gösterilecek kategori adı (kategori yolu varsa ana kategori). */
function categoryOf(p: StoreProduct): string {
  if (p.categoryName) return p.categoryName;
  if (p.categoryPath) return p.categoryPath.split(">")[0].trim();
  return "Diğer";
}

export default function StorePage() {
  const params = useParams();
  const slug = String(params?.slug || "");
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    apiClient
      .get(`/auth/seller/store/${slug}`)
      .then(async (res) => {
        const s: StoreInfo = res.data?.data;
        setStore(s);
        const pr = await apiClient.get(`/products?sellerId=${s.id}&limit=96`).catch(() => null);
        setProducts(pr?.data?.data?.products || []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => {
      const c = categoryOf(p);
      counts.set(c, (counts.get(c) || 0) + 1);
    });
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
    return [ALL_CATEGORIES, ...sorted];
  }, [products]);

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return products.filter((p) => {
      if (activeCategory !== ALL_CATEGORIES && categoryOf(p) !== activeCategory) return false;
      if (!q) return true;
      return [p.name, p.brandName]
        .filter(Boolean)
        .some((v) => String(v).toLocaleLowerCase("tr").includes(q));
    });
  }, [products, activeCategory, query]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 font-bold text-slate-400">
        Mağaza yükleniyor…
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <PackageOpen size={44} className="mb-3 text-slate-300" />
        <h1 className="text-xl font-black text-slate-800">Mağaza bulunamadı</h1>
        <p className="mt-1 text-sm text-slate-400">&quot;{slug}&quot; adresinde bir mağaza yok.</p>
        <Link href="/" className="mt-5 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-black text-white">
          Ana Sayfa
        </Link>
      </div>
    );
  }

  const template = getTemplate(store.storeTheme);
  const Storefront = template.Component;

  return (
    <Storefront
      store={store}
      products={visible}
      totalProducts={products.length}
      categories={categories}
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      query={query}
      onQueryChange={setQuery}
      accent={store.storeColor || "#7c3aed"}
      displayName={store.storeName || store.fullName || store.companyName || "Mağaza"}
    />
  );
}
