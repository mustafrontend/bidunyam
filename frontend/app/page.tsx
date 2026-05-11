"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  imageUrl: string;
  brand: string;
  category: string;
  rating: number;
  reviewCount: number;
}

type MenuTab = {
  key: string;
  label: string;
};

type MenuSection = {
  categories: string[];
  brands: string[];
  searchTerms: string[];
  highlights: Product[];
};

const categoryTabs: MenuTab[] = [
  { key: "elektronik", label: "Elektronik" },
  { key: "moda", label: "Moda" },
  { key: "ev", label: "Ev, Yasam, Kirtasiye, Ofis" },
  { key: "anne", label: "Anne, Bebek, Oyuncak" },
  { key: "spor", label: "Spor, Outdoor" },
  { key: "kozmetik", label: "Kozmetik, Kisisel Bakim" },
  { key: "supermarket", label: "Supermarket, Pet Shop" },
  { key: "kitap", label: "Kitap, Muzik, Film, Hobi" },
];

const quickDeals = [
  "Bu Fiyatlar Kacmaz",
  "7/24 Altin Al",
  "Masrafsiz Kredi",
  "Yuzde 50 Kazandiririm",
  "Hemen Kesfet",
  "Alisverise Basla",
  "Yuzde 40 Avantaj",
  "Yuzde 10 Net Indirim",
  "Yuzde 70 Avantaj",
  "200 TL Indirim",
];

function normalizeProducts(data: Product[]) {
  if (!data?.length) return [];

  return data.map((item, index) => ({
    _id: item._id || `p-${index}`,
    name: item.name || "Urun",
    price: item.price || 0,
    originalPrice: item.originalPrice || item.price || 0,
    discountPercent: item.discountPercent || 0,
    imageUrl: item.imageUrl || "/images/hero/electronics.png",
    brand: item.brand || "Marka",
    category: item.category || "Genel",
    rating: item.rating || 4.2,
    reviewCount: item.reviewCount || 0,
  }));
}

function detectTabKey(product: Product) {
  const haystack = `${product.category} ${product.name} ${product.brand}`.toLowerCase();

  if (/bebek|cocuk|oyuncak|anne/.test(haystack)) return "anne";
  if (/spor|outdoor|kamp|fitness|kosu|bisiklet/.test(haystack)) return "spor";
  if (/kozmetik|parfum|makyaj|cilt|sac|kisisel/.test(haystack)) return "kozmetik";
  if (/market|gida|deterjan|kagit|hijyen|pet|supermarket/.test(haystack)) return "supermarket";
  if (/kitap|muzik|film|hobi|oyun seti/.test(haystack)) return "kitap";
  if (/ev|yatak|nevresim|mobilya|kirtasiye|ofis|mutfak|dekor|havlu/.test(haystack)) return "ev";
  if (/giyim|moda|elbise|pantolon|gomlek|ceket|ayakkabi|canta|saat|t-shirt/.test(haystack)) return "moda";
  return "elektronik";
}

function buildMenuSections(items: Product[]) {
  const grouped = Object.fromEntries(
    categoryTabs.map((tab) => [
      tab.key,
      {
        categories: new Map<string, number>(),
        brands: new Map<string, number>(),
        names: [] as string[],
        highlights: [] as Product[],
      },
    ])
  ) as Record<
    string,
    {
      categories: Map<string, number>;
      brands: Map<string, number>;
      names: string[];
      highlights: Product[];
    }
  >;

  items.forEach((product) => {
    const key = detectTabKey(product);
    const slot = grouped[key];

    slot.categories.set(product.category, (slot.categories.get(product.category) || 0) + 1);
    slot.brands.set(product.brand, (slot.brands.get(product.brand) || 0) + 1);
    slot.names.push(product.name);

    if (slot.highlights.length < 6) {
      slot.highlights.push(product);
    }
  });

  const sortMap = (map: Map<string, number>) =>
    Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

  return Object.fromEntries(
    categoryTabs.map((tab) => {
      const bucket = grouped[tab.key];
      const popularNames = bucket.names
        .map((name) => name.split(" ").slice(0, 2).join(" "))
        .filter((name, index, arr) => name.length > 3 && arr.indexOf(name) === index)
        .slice(0, 14);

      const section: MenuSection = {
        categories: sortMap(bucket.categories).slice(0, 14),
        brands: sortMap(bucket.brands).slice(0, 14),
        searchTerms: popularNames,
        highlights: bucket.highlights,
      };

      return [tab.key, section];
    })
  ) as Record<string, MenuSection>;
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product._id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-[#f6f6f6]">
        {product.discountPercent > 0 && (
          <span className="absolute left-2 top-2 z-10 rounded-md bg-[#ff6000] px-2 py-1 text-[10px] font-black text-white">
            Ek {product.discountPercent} Kupon
          </span>
        )}
        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-2 text-sm font-semibold text-slate-700">{product.name}</p>
        <p className="text-xs font-semibold text-slate-500">Puan {product.rating.toFixed(1)} ({product.reviewCount})</p>

        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            {product.originalPrice > product.price && (
              <p className="text-xs text-slate-400 line-through">{product.originalPrice.toLocaleString("tr-TR")} TL</p>
            )}
            <p className="text-lg font-black text-slate-900">{product.price.toLocaleString("tr-TR")} TL</p>
          </div>
          <span className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-bold text-slate-600">Sepete ekle</span>
        </div>
      </div>
    </Link>
  );
}

function ProductShelf({ title, items }: { title: string; items: Product[] }) {
  return (
    <section className="mt-8 md:mt-10">
      <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-800">{title}</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((product) => (
          <ProductCard key={`${title}-${product._id}`} product={product} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await apiClient.get("/products");
        const incoming = res?.data?.data?.products || [];
        setProducts(normalizeProducts(incoming));
      } catch (error) {
        console.error("Products could not be loaded.", error);
        setProducts([]);
      }
    };

    fetchProducts();
  }, []);

  const shelves = useMemo(() => {
    const set = normalizeProducts(products);
    return [
      { title: "Populer urunlerden sectik", items: set.slice(0, 6) },
      { title: "En Avantajli Urunler", items: set.slice(6, 12) },
      { title: "Giyim", items: set.slice(12, 18) },
      { title: "Canta", items: set.slice(18, 24) },
    ];
  }, [products]);

  const menuSections = useMemo(() => buildMenuSections(normalizeProducts(products)), [products]);

  return (
    <div className="bg-[#f1f1f1] pb-20">
      <div className="w-full bg-[#dedede] py-2 text-center text-sm font-black text-slate-700">
        HONOR 600 lansmana ozel 5.000 TL aninda indirim ve 5.000 TL takas destegi
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6">
        <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl bg-white p-2 md:grid-cols-5 lg:grid-cols-10">
          {quickDeals.map((deal) => (
            <div key={deal} className="rounded-lg bg-[#ff6000] px-2 py-3 text-center text-[11px] font-bold leading-tight text-white">
              {deal}
            </div>
          ))}
        </div>

        <div className="relative mb-6 rounded-xl border border-slate-200 bg-white" onMouseLeave={() => setActiveMenu(null)}>
          <div className="overflow-x-auto">
            <div className="flex min-w-max items-center">
              {categoryTabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`border-r border-slate-100 px-5 py-3 text-sm font-semibold transition-colors ${activeMenu === tab.key ? "bg-[#fff4ee] text-[#ff6000]" : "text-slate-700 hover:text-[#ff6000]"}`}
                  onMouseEnter={() => setActiveMenu(tab.key)}
                  onFocus={() => setActiveMenu(tab.key)}
                  onClick={() => setActiveMenu(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeMenu && (
            <div className="absolute left-0 right-0 top-full z-40 hidden border-t border-slate-200 bg-white shadow-xl md:grid md:grid-cols-[1.55fr_1fr]">
              <div className="grid grid-cols-3 gap-6 p-5">
                <div>
                  <p className="mb-3 text-[17px] font-black text-[#ff6000]">Populer Kategoriler</p>
                  <ul className="space-y-2 text-[15px] text-slate-700">
                    {menuSections[activeMenu].categories.map((item) => (
                      <li key={`${activeMenu}-${item}`} className="leading-tight hover:text-[#ff6000]">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="mb-3 text-[17px] font-black text-[#ff6000]">Markalar</p>
                  <ul className="space-y-2 text-[15px] text-slate-700">
                    {menuSections[activeMenu].brands.map((item) => (
                      <li key={`${activeMenu}-brand-${item}`} className="leading-tight hover:text-[#ff6000]">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="mb-3 text-[17px] font-black text-[#ff6000]">One Cikan Aramalar</p>
                  <ul className="space-y-2 text-[15px] text-slate-700">
                    {menuSections[activeMenu].searchTerms.map((term) => (
                      <li key={`${activeMenu}-term-${term}`} className="leading-tight hover:text-[#ff6000]">
                        {term}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[#f7f7f7] p-5">
                {menuSections[activeMenu].highlights.slice(0, 4).map((product) => (
                  <Link
                    key={`${activeMenu}-highlight-${product._id}`}
                    href={`/product/${product._id}`}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                  >
                    <img src={product.imageUrl} alt={product.name} className="h-28 w-full object-cover" />
                    <p className="line-clamp-1 px-2 py-2 text-[12px] font-bold text-slate-700">{product.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mb-2" />

        {shelves.map((shelf, index) => (
          <div key={shelf.title}>
            <ProductShelf title={shelf.title} items={shelf.items} />

            {index < shelves.length - 1 && (
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <img src="/images/hero/electronics.png" alt="Kampanya elektronik" className="h-32 w-full rounded-2xl object-cover md:h-36" />
                <img src="/images/hero/home.png" alt="Kampanya ev" className="h-32 w-full rounded-2xl object-cover md:h-36" />
                <img src="/images/hero/fashion.png" alt="Kampanya moda" className="h-32 w-full rounded-2xl object-cover md:h-36" />
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-5 right-5 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow"
      >
        Basa don
      </button>
    </div>
  );
}
