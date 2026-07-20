"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api";
import { ProductCard, Product } from "@/components/molecules/ProductCard";
import { Recycle, Tag, ShieldCheck, Sparkles } from "lucide-react";

function normalize(data: unknown[]): Product[] {
  if (!Array.isArray(data)) return [];
  return data.map((item: unknown, idx) => {
    const p = item as Record<string, unknown>;
    return {
      _id: (p.id || p._id || `pazar-${idx}`) as string,
      name: (p.name || "Ürün") as string,
      price: Number(p.price) || 0,
      originalPrice: Number(p.originalPrice) || Number(p.price) || 0,
      imageUrl: (p.imageUrl || "") as string,
      brand: (((p.brand as { name?: string })?.name) || p.brandName || (typeof p.brand === "string" ? p.brand : "") || "biDünyam") as string,
      category: (p.category || "Genel") as string,
      rating: Number(p.rating) || 4.4,
      reviewCount: Number(p.reviewCount) || 0,
      stock: Number(p.stock) ?? 1,
      condition: (p.condition as string) || "IKINCI_EL",
      listingType: (p.listingType as string) || "BIREYSEL",
    };
  });
}

const CONDITIONS = [
  { key: "", label: "Tümü" },
  { key: "EL_EMEGI", label: "El Emeği / Butik" },
  { key: "SIFIR", label: "Sıfır" },
  { key: "AZ_KULLANILMIS", label: "Az Kullanılmış" },
  { key: "IKINCI_EL", label: "İkinci El" },
];

export default function PazarPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [condition, setCondition] = useState("");

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({ listingType: "BIREYSEL", limit: "48" });
    if (condition) q.set("condition", condition);
    apiClient
      .get(`/products?${q.toString()}`)
      .then((res) => setProducts(normalize(res.data?.data?.products || [])))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [condition]);

  const count = products.length;
  const heroStats = useMemo(() => ([
    { icon: Sparkles, label: "Özgün & Butik", desc: "El yapımı özel ürünler" },
    { icon: Recycle, label: "Sürdürülebilir", desc: "İkinci el hazineler" },
    { icon: ShieldCheck, label: "Güvenli Alışveriş", desc: "biDünyam güvencesi" },
  ]), []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 md:px-10 xl:px-14 space-y-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#ff5000] via-[#ff7300] to-[#ff9100] p-8 md:p-10 text-white shadow-md">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black backdrop-blur">
              <Sparkles size={14} /> biDünyam Pazar
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">El Emeği & İkinci El Hazineler</h1>
            <p className="mt-2 max-w-lg text-sm font-medium text-white/90">
              Bireysel satıcılardan butik üretimler, el işi tasarımlar ve az kullanılmış hazineler. Uygun fiyata, güvenle keşfet.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 max-w-xl">
              {heroStats.map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                  <s.icon size={18} className="mb-1.5" />
                  <p className="text-xs font-black leading-tight">{s.label}</p>
                  <p className="text-[10px] font-medium text-white/70 leading-tight">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Durum filtresi */}
        <div className="flex flex-wrap items-center gap-2">
          {CONDITIONS.map((c) => (
            <button key={c.key} onClick={() => setCondition(c.key)}
              className={`rounded-full border px-4 py-1.5 text-xs font-black transition-colors ${
                condition === c.key ? "border-[#ff5000] bg-[#ff5000] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-[#ff5000]"
              }`}>
              {c.label}
            </button>
          ))}
          {!loading && <span className="ml-auto text-xs font-bold text-slate-400">{count} ürün</span>}
        </div>

        {/* Ürünler */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-white" />)}
          </div>
        ) : count === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-20 text-center">
            <Sparkles className="mx-auto mb-3 text-slate-300" size={36} />
            <p className="font-black text-slate-700">Henüz Pazar ilanı yok</p>
            <p className="mt-1 text-sm font-medium text-slate-400">Bireysel satıcılar ilan ekledikçe burada görünecek.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
