"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Star, ShoppingCart, Truck, ShieldCheck, Plus, Minus, Heart, Gift, MessageSquareText } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useFavoriteStore } from "@/stores/favoriteStore";
import { useUiStore } from "@/stores/uiStore";
import { useRecentlyViewedStore } from '@/stores/recentlyViewedStore';
import { ProductGallery } from "@/components/molecules/ProductGallery";
import { DeliverySidebar } from "@/components/molecules/DeliverySidebar";
import { ProductReviews } from "@/components/organisms/ProductReviews";
import { ProductQuestions } from "@/components/organisms/ProductQuestions";
import { ProductTabs } from "@/components/organisms/ProductTabs";
import { extractProductId, productPath } from "@/lib/productUrl";

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
  categoryPath?: string;
  rating: number;
  reviewCount: number;
  bulletPoints?: string[];
  variants?: Variant[];
  extraServices?: ExtraService[];
  sellerName?: string;
  categoryAttributes?: Record<string, string>;
  condition?: string;
  preparationDays?: number;
}

export default function ProductDetail() {
  const params = useParams();
  // URL "<slug>-p-<id>" biçiminde; gerçek kimliği ayrıştırıyoruz
  const id = extractProductId(String(params.id ?? ""));
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  
  // Hediye Gönderimi İçin State Yapısı
  const [isGiftWrapSelected, setIsGiftWrapSelected] = useState(false);
  const [giftNote, setGiftNote] = useState("");
  const GIFT_WRAP_PRICE = 29.00; // Hediye paketi ek ücreti (İsterseniz 0 yapabilirsiniz)

  const addItem = useCartStore((s) => s.addItem);
  const token = useAuthStore((s) => s.token);
  const { productIds: favs, toggleFavorite } = useFavoriteStore();
  const setLoginModalOpen = useUiStore((s) => s.setLoginModalOpen);
  
  const isFav = useMemo(() => favs.includes(id as string), [favs, id]);

  const { addProduct: addRecentlyViewed } = useRecentlyViewedStore();

  const similarScrollRef = useRef<HTMLDivElement>(null);
  const boughtScrollRef = useRef<HTMLDivElement>(null);

  const scrollShelf = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
    if (ref.current) {
      const amount = 220;
      ref.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient
      .get(`/products/${id}`)
      .then((res) => {
        const prod = res.data.data;
        if (prod) {
          prod._id = prod.id || prod._id;
        }
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
              stock: Number(data.stock) || 0,
              imageUrl: data.imageUrl || "",
              imageUrls: data.imageUrl ? [data.imageUrl] : [],
              brand: data.brand || "XML Market",
              category: data.category || "XML Katalog",
              categoryPath: data.categoryPath || data.category || "",
              rating: Number(data.rating) || 0,
              reviewCount: Number(data.reviewCount) || 0,
              bulletPoints: [],
              variants: [],
              categoryAttributes: data.categoryAttributes || {},
            });
          }
        } catch {
          setProduct(null);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Track recently viewed product
  useEffect(() => {
    if (product) {
      addRecentlyViewed({
        id: product._id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        imageUrl: product.imageUrl || product.imageUrls?.[0] || '',
        brand: product.brand || '',
        rating: product.rating || 0,
        reviewCount: product.reviewCount || 0,
      });
    }
  }, [product?._id]);

  // Fetch Category-Based Similar Products
  useEffect(() => {
    if (!product) return;
    
    const isXmlProduct = String(product._id).includes("xml") || String(product._id).startsWith("xml-");
    const fetchPath = isXmlProduct ? "/products/xml/catalog" : "/products";
    const catParam = product.category ? `?category=${encodeURIComponent(product.category)}&limit=10` : "?limit=10";
    
    const parseAndSet = (res: any) => {
      const raw = res.data?.data?.products || res.data?.data?.items || res.data?.data || [];
      const normalized = Array.isArray(raw) ? raw.map((item: any, idx: number) => ({
        _id: item.id || item._id || `sim-${idx}-${Date.now()}`,
        name: item.name || "Benzer Ürün",
        description: item.description || "",
        discountPercent: Number(item.discountPercent) || 0,
        price: Number(item.price) || 0,
        originalPrice: Number(item.originalPrice) || Number(item.price) || 0,
        imageUrl: item.imageUrl || "",
        brand: item.brand || (isXmlProduct ? "XML Market" : "biDunyam"),
        category: item.category || "",
        rating: Number(item.rating) || 0,
        reviewCount: Number(item.reviewCount) || 0,
        stock: Number(item.stock) || 0,
      })) : [];
      
      const items = normalized
        .filter((item: Product) => item._id !== product._id)
        .slice(0, 8);
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

    // Hediye paketi seçildiyse ana fiyata yansıtabiliriz veya sepette ayrı hesaplatabiliriz.
    // Kullanıcıya şeffaf olmak adına buraya ekliyoruz:
    if (isGiftWrapSelected) {
      current += GIFT_WRAP_PRICE;
    }

    const original = product.originalPrice > current ? product.originalPrice : Math.round(current * 1.4);
    const discount = Math.round(((original - current) / original) * 100);
    return { current, original, discount };
  }, [product, selectedVariants, isGiftWrapSelected]);

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

  const displayRating = useMemo(() => (product?.rating && product.rating > 0 ? product.rating : 0), [product]);
  const displayReviewCount = useMemo(() => (product?.reviewCount && product.reviewCount > 0 ? product.reviewCount : 0), [product]);

  const handleAddToCart = async () => {
    if (!product) return;
    
    // Unique sepet anahtarına hediye paketi durumunu ve notunu da ekliyoruz ki sepette gruplanabilsinler
    const giftKeySuffix = isGiftWrapSelected ? `::giftWrap:true::giftNote:${encodeURIComponent(giftNote)}` : "";
    
    const cartItem = {
      ...product,
      price: activePricing.current,
      imageUrl: gallery[0] || product.imageUrl,
      cartKey: `${product._id}::${Object.entries(selectedVariants).map(([k, v]) => `${k}:${v}`).join(",")}${giftKeySuffix}`,
      // Meta custom properties
      selectedOptions: Object.entries(selectedVariants).map(([name, value]) => ({ name, value })),
      // Hediye meta bilgileri backend ve sepet listesi için
      giftOptions: {
        isGift: isGiftWrapSelected,
        giftNote: isGiftWrapSelected ? giftNote : "",
        giftPrice: isGiftWrapSelected ? GIFT_WRAP_PRICE : 0
      }
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
        {/* Breadcrumbs — ürünün gerçek kategori yolundan; boş segment gösterilmez */}
        {(() => {
          const parts = String((product as { categoryPath?: string }).categoryPath || product.category || "")
            .split(">").map((p) => p.trim()).filter(Boolean);
          const main = parts[0];
          const sub = parts[1];
          return (
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">
              <button onClick={() => router.push("/")} className="hover:text-[#ff5000]">Ana Sayfa</button>
              {main && (
                <>
                  <ChevronRight size={10} strokeWidth={3} />
                  <button onClick={() => router.push(`/arama?kategori=${encodeURIComponent(main)}`)} className="hover:text-[#ff5000]">{main}</button>
                </>
              )}
              {sub && (
                <>
                  <ChevronRight size={10} strokeWidth={3} />
                  <button onClick={() => router.push(`/arama?kategori=${encodeURIComponent(main)}&altkategori=${encodeURIComponent(sub)}`)} className="hover:text-[#ff5000]">{sub}</button>
                </>
              )}
              <ChevronRight size={10} strokeWidth={3} />
              <span className="text-slate-800 normal-case truncate max-w-[200px]">{product.name}</span>
            </nav>
          );
        })()}

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
              {(product.discountPercent > 0 || product.condition) && (
                <div className="flex gap-2">
                  {product.discountPercent > 0 && (
                    <span className="bg-[#ff5000]/10 text-[#ff5000] text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">%{product.discountPercent} İndirim</span>
                  )}
                  {product.condition && (
                    <span className="bg-slate-200/60 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">{product.condition === "USED" || product.condition === "SECOND_HAND" ? "İkinci El" : "Sıfır Ürün"}</span>
                  )}
                </div>
              )}
              <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight tracking-tight">{product.name}</h1>
              {product.sellerName && (
                <div className="text-xs font-bold text-slate-500 mt-1">
                  Satıcı: <span className="text-slate-800">{product.sellerName}</span>
                </div>
              )}
              
              <div className="flex items-center gap-4 text-xs">
                {displayReviewCount > 0 ? (
                  <>
                    <div className="flex items-center gap-1 text-[#ff5000]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} fill={i < Math.round(displayRating) ? "currentColor" : "none"} strokeWidth={i < Math.round(displayRating) ? 0 : 2} className="stroke-[#ff5000]" />
                      ))}
                      <span className="font-black text-slate-800 ml-1">{displayRating}</span>
                    </div>
                    <span className="text-slate-400 font-bold border-l pl-4">({displayReviewCount} değerlendirme)</span>
                  </>
                ) : (
                  <span className="text-slate-400 font-bold">Henüz değerlendirilmemiş</span>
                )}
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

            {/* HEDİYE GÖNDERİMİ & PAKETLEME PANELİ */}
            <div className="p-4 border border-slate-200 bg-white rounded-xl space-y-3 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                    <Gift size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 block">Bu Ürün Hediye mi?</span>
                    <span className="text-[10px] text-slate-400 font-bold block">Özel hediye paketi ve şık bir not kartı ekleyin.</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isGiftWrapSelected} 
                    onChange={(e) => setIsGiftWrapSelected(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500"></div>
                </label>
              </div>

              {isGiftWrapSelected && (
                <div className="space-y-3 pt-2 border-t border-slate-100 animate-fadeIn">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <span>Hediye Paketi Ücreti:</span>
                    <span className="text-pink-600">+{GIFT_WRAP_PRICE.toLocaleString("tr-TR")} TL</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1 text-[10px] font-black text-slate-700 uppercase tracking-wide">
                      <MessageSquareText size={12} className="text-slate-400" />
                      Hediye Notunuz
                    </label>
                    <textarea
                      value={giftNote}
                      onChange={(e) => setGiftNote(e.target.value)}
                      maxLength={250}
                      placeholder="Sevdikleriniz için güzel bir mesaj yazın... (En fazla 250 karakter)"
                      className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-pink-400 focus:bg-white transition-all resize-none h-20 text-slate-800 font-medium"
                    />
                    <div className="text-right text-[9px] text-slate-400 font-bold">
                      {giftNote.length}/250 karakter
                    </div>
                  </div>
                </div>
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

          </div>
        </div>

        {/* Dynamic Detail Switcher & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-8 border-t border-slate-200">
          <div className="lg:col-span-8 space-y-12">
            <ProductTabs
              productName={product.name}
              description={product.description}
              bulletPoints={product.bulletPoints || []}
              categoryAttributes={product.categoryAttributes || {}}
              brand={product.brand}
              condition={product.condition}
              preparationDays={product.preparationDays}
            />
            <ProductReviews rating={displayRating} reviewCount={displayReviewCount} productImageUrl={gallery[0] || product.imageUrl} />
            <ProductQuestions />
          </div>
          <div className="lg:col-span-4">
            <DeliverySidebar preparationDays={product.preparationDays} />
          </div>
        </div>

        {/* Benzer Ürünler Carousel Section */}
        {/* ... (Benzer Ürünler Carousel kodları değişmediği için temiz okunabilirlik adına burası aynen korunmuştur) */}
        <section className="pt-16 border-t border-slate-200 select-none">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">Benzer Ürünler</h2>
            </div>
          </div>

          <div className="relative group">
            <button
              onClick={() => scrollShelf(similarScrollRef, "left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-8 h-8 rounded-full bg-white border border-slate-200/80 shadow-md flex items-center justify-center z-10 hover:scale-105 active:scale-95 transition-all text-slate-700 cursor-pointer hidden md:flex"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>

            <button
              onClick={() => scrollShelf(similarScrollRef, "right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-8 h-8 rounded-full bg-white border border-slate-200/80 shadow-md flex items-center justify-center z-10 hover:scale-105 active:scale-95 transition-all text-slate-700 cursor-pointer hidden md:flex"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>

            <div
              ref={similarScrollRef}
              className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-0.5"
            >
              {similarProducts.length > 0 ? (
                similarProducts.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => router.push(productPath(item))}
                      className="bg-white border border-slate-200 rounded-2xl p-3 hover:shadow-lg transition-all group relative cursor-pointer flex flex-col justify-between min-w-[190px] max-w-[210px] select-none shrink-0"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (token) toggleFavorite(item._id, token);
                          else setLoginModalOpen(true);
                        }}
                        className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-slate-400 hover:text-red-500 hover:scale-105 active:scale-95 transition-all"
                      >
                        <Heart size={13} className={favs.includes(item._id) ? "fill-red-500 text-red-500" : ""} />
                      </button>

                      <div>
                        <div className="relative aspect-square mb-2.5 overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center p-3">
                          {item.discountPercent > 0 && (
                            <span className="absolute top-2 left-2 z-10 text-[8px] font-black text-white px-2 py-0.5 rounded shadow-sm uppercase tracking-widest bg-[#ff5000]">
                              %{item.discountPercent} İndirim
                            </span>
                          )}
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>

                        <span className="text-slate-800 font-black text-[10px] uppercase tracking-wider block mt-1">{item.brand}</span>
                        <h4 className="text-xs font-black text-slate-500 line-clamp-1 mt-0.5">{item.name}</h4>

                        {item.reviewCount > 0 && (
                          <div className="flex items-center gap-0.5 mt-1 text-amber-500">
                            <Star size={11} fill="currentColor" className="stroke-none" />
                            <span className="text-[10px] font-black text-slate-700">{item.rating.toFixed(1)}</span>
                            <span className="text-slate-400 text-[10px] font-bold ml-0.5">({item.reviewCount})</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3">
                        {item.discountPercent > 0 && item.originalPrice > item.price && (
                          <span className="text-[10px] font-bold text-slate-400 line-through block">{item.originalPrice.toLocaleString("tr-TR")} TL</span>
                        )}
                        <span className="text-sm font-black text-slate-800">{item.price.toLocaleString("tr-TR")} TL</span>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="w-full text-center text-xs font-bold text-slate-400 py-12">Benzer ürün bulunamadı.</div>
              )}
            </div>
          </div>
        </section>

        {/* Bu Ürünü Alanlar Bunları da Aldı Carousel Section */}
        {/* ... (Bu bölüm de benzer şekilde korunmuştur) */}
        <section className="pt-12 border-t border-slate-200 select-none pb-12">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">Bu Ürünü Alanlar Bunları da Aldı</h2>
            </div>
          </div>

          <div className="relative group">
            <button
              onClick={() => scrollShelf(boughtScrollRef, "left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-8 h-8 rounded-full bg-white border border-slate-200/80 shadow-md flex items-center justify-center z-10 hover:scale-105 active:scale-95 transition-all text-slate-700 cursor-pointer hidden md:flex"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>

            <button
              onClick={() => scrollShelf(boughtScrollRef, "right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-8 h-8 rounded-full bg-white border border-slate-200/80 shadow-md flex items-center justify-center z-10 hover:scale-105 active:scale-95 transition-all text-slate-700 cursor-pointer hidden md:flex"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>

            <div
              ref={boughtScrollRef}
              className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-0.5"
            >
              {similarProducts.length > 0 ? (
                [...similarProducts.slice(2), ...similarProducts.slice(0, 2)].map((item) => (
                    <div
                      key={`bought-${item._id}`}
                      onClick={() => router.push(productPath(item))}
                      className="bg-white border border-slate-200 rounded-2xl p-3 hover:shadow-lg transition-all group relative cursor-pointer flex flex-col justify-between min-w-[190px] max-w-[210px] select-none shrink-0"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (token) toggleFavorite(item._id, token);
                          else setLoginModalOpen(true);
                        }}
                        className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-slate-400 hover:text-red-500 hover:scale-105 active:scale-95 transition-all"
                      >
                        <Heart size={13} className={favs.includes(item._id) ? "fill-red-500 text-red-500" : ""} />
                      </button>

                      <div>
                        <div className="relative aspect-square mb-2.5 overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center p-3">
                          {item.discountPercent > 0 && (
                            <span className="absolute top-2 left-2 z-10 text-[8px] font-black text-white px-2 py-0.5 rounded shadow-sm uppercase tracking-widest bg-[#ff5000]">
                              %{item.discountPercent} İndirim
                            </span>
                          )}
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>

                        <span className="text-slate-800 font-black text-[10px] uppercase tracking-wider block mt-1">{item.brand}</span>
                        <h4 className="text-xs font-black text-slate-500 line-clamp-1 mt-0.5">{item.name}</h4>

                        {item.reviewCount > 0 && (
                          <div className="flex items-center gap-0.5 mt-1 text-amber-500">
                            <Star size={11} fill="currentColor" className="stroke-none" />
                            <span className="text-[10px] font-black text-slate-700">{item.rating.toFixed(1)}</span>
                            <span className="text-slate-400 text-[10px] font-bold ml-0.5">({item.reviewCount})</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3">
                        {item.discountPercent > 0 && item.originalPrice > item.price && (
                          <span className="text-[10px] font-bold text-slate-400 line-through block">{item.originalPrice.toLocaleString("tr-TR")} TL</span>
                        )}
                        <span className="text-sm font-black text-slate-800">{item.price.toLocaleString("tr-TR")} TL</span>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="w-full text-center text-xs font-bold text-slate-400 py-12">Ürün bulunamadı.</div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}