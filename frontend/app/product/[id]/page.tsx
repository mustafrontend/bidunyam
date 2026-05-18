"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, ShieldAlert, Star, ShoppingCart, Truck, ShieldCheck, Plus, Minus, Heart } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useFavoriteStore } from "@/stores/favoriteStore";
import { useUiStore } from "@/stores/uiStore";
import { ProductGallery } from "@/components/molecules/ProductGallery";
import { DeliverySidebar } from "@/components/molecules/DeliverySidebar";
import { ProductReviews } from "@/components/organisms/ProductReviews";
import { ProductTabs } from "@/components/organisms/ProductTabs";

interface VariantValue {
  label: string;
  price: number;
  stock: number;
}

interface Variant {
  name: string;
  type: "COLOR" | "SIZE" | "CUSTOM";
  values: VariantValue[];
}

interface ExtraService {
  name: string;
  price: number;
  description?: string;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  stock: number;
  imageUrl: string;
  imageUrls?: string[];
  brand: string;
  category: string;
  rating: number;
  reviewCount: number;
  bulletPoints?: string[];
  variants?: Variant[];
  extraServices?: ExtraService[];
}

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const addItem = useCartStore((s) => s.addItem);
  const token = useAuthStore((s) => s.token);
  const { productIds: favs, toggleFavorite } = useFavoriteStore();
  const setLoginModalOpen = useUiStore((s) => s.setLoginModalOpen);
  
  const isFav = useMemo(() => favs.includes(id as string), [favs, id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient
      .get(`/products/${id}`)
      .then((res) => {
        const prod = res.data.data;
        setProduct(prod);
        
        // Auto-select first variant values by default
        const initialSelected: Record<string, string> = {};
        if (prod.variants) {
          prod.variants.forEach((v: Variant) => {
            if (v.values && v.values.length > 0) {
              initialSelected[v.name] = v.values[0].label;
            }
          });
        }
        setSelectedVariants(initialSelected);
      })
      .catch(async () => {
        try {
          const xmlRes = await apiClient.get(`/products/xml/catalog/${id}`);
          const data = xmlRes.data?.data;
          if (data) {
            setProduct({
              _id: data._id,
              name: data.name || "Ürün",
              description: data.name || "",
              price: Number(data.price) || 0,
              originalPrice: Number(data.originalPrice) || Number(data.price) || 0,
              discountPercent: Number(data.discountPercent) || 0,
              stock: Number(data.stock) || 99,
              imageUrl: data.imageUrl || "",
              imageUrls: data.imageUrl ? [data.imageUrl] : [],
              brand: data.brand || "XML Market",
              category: data.category || "XML Katalog",
              rating: Number(data.rating) || 4.8,
              reviewCount: Number(data.reviewCount) || 141,
              bulletPoints: [],
              variants: [],
            });
          }
        } catch {
          setProduct(null);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch Category-Based Similar Products
  useEffect(() => {
    if (!product) return;
    
    const isXmlProduct = String(product._id).includes("xml") || String(product._id).startsWith("xml-");
    const fetchPath = isXmlProduct ? "/products/xml/catalog" : "/products";
    const catParam = product.category ? `?category=${encodeURIComponent(product.category)}&limit=10` : "?limit=10";
    
    const parseAndSet = (res: any) => {
      const raw = res.data?.data?.products || res.data?.data?.items || res.data?.data || [];
      const normalized = Array.isArray(raw) ? raw.map((item: any, idx: number) => ({
        _id: item._id || `sim-${idx}-${Date.now()}`,
        name: item.name || "Benzer Ürün",
        description: item.description || "",
        discountPercent: Number(item.discountPercent) || 0,
        price: Number(item.price) || 0,
        originalPrice: Number(item.originalPrice) || Number(item.price) || 0,
        imageUrl: item.imageUrl || "",
        brand: item.brand || (isXmlProduct ? "XML Market" : "biDunyam"),
        category: item.category || "",
        rating: Number(item.rating) || 4.5,
        reviewCount: Number(item.reviewCount) || 12,
        stock: Number(item.stock) ?? 99,
      })) : [];
      
      const items = normalized
        .filter((item: Product) => item._id !== product._id)
        .slice(0, 4);
      setSimilarProducts(items);
    };

    apiClient
      .get(`${fetchPath}${catParam}`)
      .then(parseAndSet)
      .catch(() => {
        apiClient
          .get(`${fetchPath}?limit=10`)
          .then(parseAndSet)
          .catch(() => setSimilarProducts([]));
      });
  }, [product]);

  const gallery = useMemo(() => {
    if (!product) return [];
    const imgs = product.imageUrls?.filter(Boolean) || [];
    return imgs.length > 0 ? imgs : [product.imageUrl].filter(Boolean);
  }, [product]);

  // Dynamic Price & Stock calculations based on selected variants
  const activePricing = useMemo(() => {
    if (!product) return { current: 0, original: 0, discount: 0 };
    let current = product.price;
    
    // Check if selected variant value has custom price override
    if (product.variants) {
      product.variants.forEach((v) => {
        const selectedValue = selectedVariants[v.name];
        if (selectedValue) {
          const match = v.values.find((val) => val.label === selectedValue);
          if (match && match.price > 0) {
            current = match.price;
          }
        }
      });
    }

    const original = product.originalPrice > current ? product.originalPrice : Math.round(current * 1.4);
    const discount = Math.round(((original - current) / original) * 100);
    return { current, original, discount };
  }, [product, selectedVariants]);

  const activeStock = useMemo(() => {
    if (!product) return 0;
    let currentStock = product.stock;
    
    if (product.variants) {
      product.variants.forEach((v) => {
        const selectedValue = selectedVariants[v.name];
        if (selectedValue) {
          const match = v.values.find((val) => val.label === selectedValue);
          if (match) {
            currentStock = match.stock;
          }
        }
      });
    }
    return currentStock;
  }, [product, selectedVariants]);

  const displayRating = useMemo(() => (product?.rating && product.rating > 0 ? product.rating : 4.8), [product]);
  const displayReviewCount = useMemo(() => (product?.reviewCount && product.reviewCount > 0 ? product.reviewCount : 141), [product]);

  const handleAddToCart = async () => {
    if (!product) return;
    const cartItem = {
      ...product,
      price: activePricing.current,
      imageUrl: gallery[0] || product.imageUrl,
      cartKey: `${product._id}::${Object.entries(selectedVariants).map(([k, v]) => `${k}:${v}`).join(",")}`,
      // Meta custom properties
      selectedOptions: Object.entries(selectedVariants).map(([name, value]) => ({ name, value })),
    };
    for (let i = 0; i < quantity; i++) {
      await addItem(cartItem, token);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    router.push("/cart");
  };

  // Helper to map color name to tailwind styles
  const getColorClass = (label: string) => {
    const norm = label.toLowerCase().trim();
    if (norm.includes("siyah")) return "bg-black text-white";
    if (norm.includes("gri")) return "bg-slate-400 text-white";
    if (norm.includes("mavi")) return "bg-blue-600 text-white";
    if (norm.includes("kırmızı")) return "bg-red-600 text-white";
    if (norm.includes("yeşil")) return "bg-green-600 text-white";
    if (norm.includes("beyaz")) return "bg-white border border-slate-300 text-slate-800";
    if (norm.includes("sarı")) return "bg-yellow-400 text-slate-800";
    return "bg-slate-100 text-slate-800";
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-16 space-y-8">
        <div className="h-4 w-1/4 rounded bg-slate-200" />
        <div className="flex flex-col gap-8 lg:flex-row bg-white p-8 rounded-3xl border border-slate-200">
          <div className="aspect-[1.83] w-full rounded-2xl bg-slate-100 lg:w-7/12 animate-pulse" />
          <div className="w-full space-y-6 lg:w-5/12">
            <div className="h-6 w-1/3 rounded bg-slate-100" />
            <div className="h-10 w-3/4 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="py-32 text-center text-xs font-black text-slate-400 select-none">Ürün Bulunamadı.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <main className="mx-auto max-w-7xl px-4 md:px-8 space-y-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">
          <button onClick={() => router.push("/")} className="hover:text-[#ff5000]">Ana Sayfa</button>
          <ChevronRight size={10} strokeWidth={3} />
          <span className="hover:text-[#ff5000]">{product.category}</span>
          <ChevronRight size={10} strokeWidth={3} />
          <span className="text-slate-800">{product.brand}</span>
        </nav>

        {/* 2-Column Product Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Gallery */}
          <div className="lg:col-span-7">
            <ProductGallery
              gallery={gallery}
              name={product.name}
              isFavorite={isFav}
              onToggleFavorite={() => {
                if (token) toggleFavorite(product._id, token);
                else setLoginModalOpen(true);
              }}
            />
          </div>

          {/* Right: Info */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="space-y-3 select-none">
              <div className="flex gap-2">
                <span className="bg-[#ff5000]/10 text-[#ff5000] text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Çok Satan</span>
                <span className="bg-slate-200/60 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">{product.category} alanında en iyiler</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight tracking-tight">{product.name}</h1>
              
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1 text-[#ff5000]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill={i < Math.round(displayRating) ? "currentColor" : "none"} strokeWidth={i < Math.round(displayRating) ? 0 : 2} className="stroke-[#ff5000]" />
                  ))}
                  <span className="font-black text-slate-800 ml-1">{displayRating}</span>
                </div>
                <span className="text-slate-400 font-bold border-l pl-4">({displayReviewCount} değerlendirme)</span>
                <span className="text-slate-400 font-bold border-l pl-4">5B+ Son günlerde satıldı</span>
              </div>
            </div>

            {/* Pricing Box Panel */}
            <div className="p-6 bg-slate-100/60 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-baseline gap-3 select-none">
                <span className="text-3xl font-black text-slate-800 tracking-tighter">
                  {activePricing.current.toLocaleString("tr-TR")} TL
                </span>
                {activePricing.original > activePricing.current && (
                  <>
                    <span className="text-slate-400 line-through text-xs font-bold">
                      {activePricing.original.toLocaleString("tr-TR")} TL
                    </span>
                    <span className="text-red-500 font-black text-xs">
                      -%{activePricing.discount}
                    </span>
                  </>
                )}
              </div>

              {/* Delivery Badges */}
              <div className="flex gap-2">
                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200">
                  <Truck size={14} className="text-[#ff5000]" />
                  <span className="text-[10px] font-black text-slate-700">Ücretsiz Kargo</span>
                </div>
                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200">
                  <ShieldCheck size={14} className="text-[#ff5000]" />
                  <span className="text-[10px] font-black text-slate-700">Teslimat Garantisi</span>
                </div>
              </div>
            </div>

            {/* Interactive Dynamic Variations rendering */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4 select-none">
                {product.variants.map((v) => (
                  <div key={v.name} className="space-y-2">
                    <span className="block text-xs font-black text-slate-800 uppercase tracking-wide">
                      {v.name}: <span className="text-[#ff5000]">{selectedVariants[v.name] || "Seçilmedi"}</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {v.values.map((val) => {
                        const isSelected = selectedVariants[v.name] === val.label;
                        
                        if (v.type === "COLOR") {
                          const colClass = getColorClass(val.label);
                          return (
                            <button
                              key={val.label}
                              onClick={() => setSelectedVariants((prev) => ({ ...prev, [v.name]: val.label }))}
                              className={`w-9 h-9 rounded-full ${colClass} cursor-pointer flex items-center justify-center transition-all duration-200 active:scale-95 ${
                                isSelected ? "ring-2 ring-[#ff5000] ring-offset-2 scale-105" : "hover:scale-105 opacity-80"
                              }`}
                              title={`${val.label} (Stok: ${val.stock})`}
                            />
                          );
                        }
                        
                        return (
                          <button
                            key={val.label}
                            onClick={() => setSelectedVariants((prev) => ({ ...prev, [v.name]: val.label }))}
                            className={`px-4 py-2 text-xs font-black rounded-lg border cursor-pointer transition-all duration-200 active:scale-95 ${
                              isSelected
                                ? "bg-slate-900 border-slate-900 text-white"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            {val.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stock Count Indicator Badge */}
            <div className="select-none">
              {activeStock <= 0 ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                  ⚠️ Stokta Yok!
                </span>
              ) : activeStock < 5 ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 animate-pulse">
                  🚨 Acele Edin! Son {activeStock} Ürün Kaldı!
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                  ✅ Stokta Var ({activeStock} Adet)
                </span>
              )}
            </div>

            {/* Purchase action rows */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-32 flex items-center justify-between border border-slate-300 rounded-lg bg-white px-3.5 h-14 text-slate-700 font-bold select-none">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="p-1 hover:text-[#ff5000] cursor-pointer"><Minus size={16} strokeWidth={2.5} /></button>
                  <span className="font-black text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(activeStock, q + 1))}
                    disabled={quantity >= activeStock}
                    className={`p-1 cursor-pointer ${quantity >= activeStock ? "text-slate-300 cursor-not-allowed" : "hover:text-[#ff5000]"}`}
                  >
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>
                
                <button
                  onClick={handleAddToCart}
                  disabled={activeStock <= 0}
                  className={`flex-1 text-white font-black uppercase tracking-wider rounded-lg h-14 hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                    activeStock <= 0 ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-[#ff5000]"
                  }`}
                >
                  <ShoppingCart size={18} strokeWidth={2.5} />
                  {added ? "SEPETE EKLENDİ" : "Sepete Ekle"}
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                disabled={activeStock <= 0}
                className={`w-full border-2 text-xs font-black uppercase tracking-wider rounded-lg h-14 transition-all duration-200 active:scale-95 cursor-pointer ${
                  activeStock <= 0 ? "border-slate-300 text-slate-400 cursor-not-allowed" : "border-slate-900 text-slate-900 hover:bg-slate-50"
                }`}
              >
                Hemen Satın Al
              </button>
            </div>

            {/* Protection Widget */}
            <div className="flex items-start gap-4 p-4 border border-slate-200 bg-white rounded-lg select-none">
              <ShieldAlert size={20} className="text-[#ff5000] mt-0.5 shrink-0" strokeWidth={2.5} />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-black text-slate-800 block">Premium Koruma Planı</span>
                <p className="text-[10px] text-slate-400 font-bold mt-1 leading-normal">
                  Kaza sonucu hasarlara karşı 1 yıl ek koruma ekle: 89,00 TL
                </p>
              </div>
              <button className="text-[10px] font-black text-[#ff5000] hover:underline uppercase tracking-wider cursor-pointer">Ekle</button>
            </div>
          </div>
        </div>

        {/* Dynamic Detail Switcher & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-8 border-t border-slate-200">
          <div className="lg:col-span-8 space-y-12">
            <ProductTabs description={product.description} bulletPoints={product.bulletPoints || []} />
            <ProductReviews rating={displayRating} reviewCount={displayReviewCount} productImageUrl={gallery[0] || product.imageUrl} />
          </div>
          <div className="lg:col-span-4">
            <DeliverySidebar />
          </div>
        </div>

        {/* Recommended Shelf - Dynamic similar products */}
        <section className="pt-16 border-t border-slate-200 select-none">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Bunları da Beğenebilirsiniz</h2>
              <p className="text-slate-400 text-xs font-bold mt-1">Bu minderle sıklıkla birlikte satın alınan ürünler</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {similarProducts.length > 0 ? (
              similarProducts.map((item) => {
                const discount = item.originalPrice > item.price ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0;
                return (
                  <div
                    key={item._id}
                    onClick={() => router.push(`/product/${item._id}`)}
                    className="bg-white border border-slate-200 rounded-xl p-3 hover:shadow-lg transition-all group relative cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-slate-50 flex items-center justify-center p-4">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-contain group-hover:scale-115 transition-transform duration-200"
                        />
                      </div>
                      <span className="text-emerald-600 font-black text-[9px] uppercase tracking-widest">{item.brand}</span>
                      <h4 className="text-xs font-black text-slate-800 line-clamp-1 mt-1">{item.name}</h4>
                      
                      <div className="flex items-center gap-1 mt-1 text-[#ff5000]">
                        <Star size={12} fill="currentColor" className="stroke-none" />
                        <span className="text-[10px] font-black text-slate-700">{item.rating > 0 ? item.rating : 4.8}</span>
                        <span className="text-slate-400 text-[10px] font-bold ml-1">({item.reviewCount > 0 ? item.reviewCount : 141})</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-baseline gap-2">
                      <div className="text-sm font-black text-slate-800">{item.price.toLocaleString("tr-TR")} TL</div>
                      {discount > 0 && (
                        <div className="text-[10px] text-red-500 font-black">-%{discount}</div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-4 text-center text-[10px] font-bold text-slate-400 py-12">Yükleniyor...</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
