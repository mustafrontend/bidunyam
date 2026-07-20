"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { getTheme } from "@/lib/storeThemes";
import { ShieldCheck, Store as StoreIcon, Star, PackageOpen } from "lucide-react";

interface Store {
  id: string;
  storeSlug: string;
  storeName?: string;
  storeBio?: string;
  storeTheme?: string;
  storeColor?: string;
  storeLogo?: string;
  storeBanner?: string;
  fullName?: string;
  companyName?: string;
}
interface Prod {
  id: string; name: string; price: number; originalPrice: number; imageUrl: string;
  condition?: string; brandName?: string; rating?: number;
}

const CONDITION_LABEL: Record<string, string> = { AZ_KULLANILMIS: "Az Kullanılmış", IKINCI_EL: "İkinci El" };

function hexToSoft(hex: string) {
  // Basit: rengi %12 opaklıkta rgba'ya çevir
  const h = hex.replace("#", "");
  if (h.length !== 6) return "rgba(124,58,237,0.12)";
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},0.12)`;
}

export default function StorePage() {
  const params = useParams();
  const slug = String(params?.slug || "");
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Prod[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    apiClient.get(`/auth/seller/store/${slug}`)
      .then(async (res) => {
        const s: Store = res.data?.data;
        setStore(s);
        const pr = await apiClient.get(`/products?sellerId=${s.id}&limit=48`).catch(() => null);
        setProducts(pr?.data?.data?.products || []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const theme = useMemo(() => getTheme(store?.storeTheme), [store?.storeTheme]);
  const accent = store?.storeColor || "#7c3aed";
  const styleVars = { ["--accent" as string]: accent, ["--accent-soft" as string]: hexToSoft(accent) } as React.CSSProperties;
  const displayName = store?.storeName || store?.fullName || store?.companyName || "Mağaza";

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-400 font-bold">Mağaza yükleniyor…</div>;
  }
  if (notFound || !store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-center px-4">
        <PackageOpen size={44} className="mb-3 text-slate-300" />
        <h1 className="text-xl font-black text-slate-800">Mağaza bulunamadı</h1>
        <p className="mt-1 text-sm text-slate-400">"{slug}" adresinde bir mağaza yok.</p>
        <Link href="/" className="mt-5 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-black text-white">Ana Sayfa</Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.page} ${theme.font}`} style={styleVars}>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        {/* Mağaza başlığı */}
        <div className={`${theme.hero} ${theme.rounded} overflow-hidden p-6 md:p-8`}>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: accent }}>
              {store.storeLogo ? <img src={store.storeLogo} alt={displayName} className="h-full w-full rounded-2xl object-cover" /> : <StoreIcon size={28} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${theme.headerText}`}>{displayName}</h1>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black text-white" style={{ background: accent }}>
                  <ShieldCheck size={11} /> Onaylı
                </span>
              </div>
              {store.storeBio && <p className={`mt-1 text-sm ${theme.subText}`}>{store.storeBio}</p>}
              <p className={`mt-1 text-xs font-semibold ${theme.subText}`}>bidunyam.com/magaza/{store.storeSlug}</p>
            </div>
          </div>
        </div>

        {/* Ürünler */}
        <div className="mt-8 flex items-center justify-between">
          <h2 className={`text-lg font-black ${theme.headerText}`}>Ürünler</h2>
          <span className={`text-xs font-bold ${theme.subText}`}>{products.length} ürün</span>
        </div>

        {products.length === 0 ? (
          <div className={`mt-4 ${theme.card} ${theme.rounded} py-16 text-center`}>
            <PackageOpen size={32} className={`mx-auto mb-2 ${theme.subText}`} />
            <p className={`font-bold ${theme.headerText}`}>Bu mağazada henüz ürün yok</p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {products.map((p) => {
              const disc = p.originalPrice > p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
              return (
                <Link key={p.id} href={`/product/${p.id}`}
                  className={`group flex flex-col overflow-hidden ${theme.card} ${theme.rounded} transition-all`}>
                  <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-white/50 p-3">
                    {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105" /> : <PackageOpen className="text-slate-300" />}
                    {disc > 0 && <span className="absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[9px] font-black text-white" style={{ background: accent }}>%{disc}</span>}
                    {p.condition && p.condition !== "SIFIR" && (
                      <span className={`absolute right-2 top-2 rounded px-1.5 py-0.5 text-[8px] font-black ${theme.chip}`}>{CONDITION_LABEL[p.condition]}</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${theme.subText}`}>{p.brandName || "biDünyam"}</span>
                    <h3 className={`mt-0.5 line-clamp-2 text-xs font-bold ${theme.cardTitle}`}>{p.name}</h3>
                    <div className="mt-2 flex items-center gap-1">
                      <Star size={11} className="fill-current text-amber-400" />
                      <span className={`text-[10px] font-bold ${theme.subText}`}>{(p.rating || 4.5).toFixed(1)}</span>
                    </div>
                    <div className="mt-auto pt-2">
                      {disc > 0 && <span className={`mr-1 text-[10px] line-through ${theme.subText}`}>{p.originalPrice.toLocaleString("tr-TR")} TL</span>}
                      <span className={`text-sm font-black ${theme.price}`}>{p.price.toLocaleString("tr-TR")} TL</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className={`mt-10 border-t pt-6 text-center text-xs ${theme.subText}`} style={{ borderColor: hexToSoft(accent) }}>
          <Link href="/" className="font-bold hover:underline">biDünyam</Link> güvencesiyle · Bu mağaza bir biDünyam bireysel satıcısıdır
        </div>
      </div>
    </div>
  );
}
