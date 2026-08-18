"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Heart } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useFavoriteStore } from "@/stores/favoriteStore";
import { apiClient } from "@/lib/api";
import { CheckoutModal } from "@/components/molecules/CheckoutModal";
import { LoginModal } from "@/components/molecules/LoginModal";
import { productPath } from "@/lib/productUrl";

// Tab enum
const TABS = ["Önceden Eklediklerim", "Favorilerim"];

interface Product {
  _id: string;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  category?: string;
  stock?: number;
}

interface ProductMiniCardProps {
  product: Product;
  onRemove: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
}

function ProductMiniCard({ product, onRemove, onToggleFavorite, isFavorite }: ProductMiniCardProps) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
      <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-xl bg-slate-50" />
      <div className="flex-1 min-w-0">
        <div className="font-black text-slate-900 text-sm truncate">{product.name}</div>
        <div className="text-xs text-slate-400 font-bold truncate">{product.brand}</div>
        <div className="text-base font-black text-[#ff5000] mt-1">{product.price.toLocaleString('tr-TR')} TL</div>
      </div>
      <button onClick={onToggleFavorite} className={isFavorite ? "text-red-500" : "text-slate-300 hover:text-red-500"}>
        <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
      </button>
      <button onClick={onRemove} className="text-slate-300 hover:text-red-500 ml-2">
        <Trash2 size={20} />
      </button>
    </div>
  );
}

export default function CartPage() {
  const { items, addItem, removeItem, getTotalPrice, getTotalItems } = useCartStore();
  const { token, isAuthenticated } = useAuthStore();
  const { productIds: favoriteIds, fetchFavorites, toggleFavorite } = useFavoriteStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [previousCart, setPreviousCart] = useState<Product[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  // Gerçek kargo/hesap kırılımı (fiyatlandırma motorundan)
  const [quote, setQuote] = useState<{ gross: number; shippingCost: number; freeShippingApplied: boolean; buyerTotal: number } | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sepet değiştikçe gerçek kargo + toplam hesabını fiyatlandırma motorundan al
  useEffect(() => {
    if (!items.length) { setQuote(null); return; }
    apiClient
      .post('/products/pricing/quote', {
        items: items.map((i) => ({
          price: i.price,
          quantity: i.quantity,
          categoryPath: i.categoryPath || i.category,
          listingType: i.listingType,
          desi: i.desi,
        })),
      })
      .then((r) => setQuote(r.data?.data || null))
      .catch(() => setQuote(null));
  }, [items]);

  // Sadece token değişince favorileri çek
  useEffect(() => {
    if (token) {
      fetchFavorites(token);
      apiClient
        .get('/cart/previous', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setPreviousCart(res.data?.data?.products || []))
        .catch(() => setPreviousCart([]));
    }
  }, [token, fetchFavorites]);

  // Sepette ürün varsa, ilk ürünün kategorisine göre öneri getir
  useEffect(() => {
    if (items && items.length > 0 && items[0].category) {
      apiClient
        .get('/products', { params: { category: items[0].category, limit: 10 } })
        .then(res => {
          const list: Product[] = res.data?.data?.products || [];
          setSuggestedProducts(list.filter((p) => p._id !== items[0]._id));
        })
        .catch(() => {
          // fallback: genel ürün listesi
          apiClient
            .get('/products', { params: { limit: 8 } })
            .then(res => setSuggestedProducts(res.data?.data?.products || []))
            .catch(() => setSuggestedProducts([]));
        });
    } else {
      apiClient
        .get('/products', { params: { limit: 8 } })
        .then(res => setSuggestedProducts(res.data?.data?.products || []))
        .catch(() => setSuggestedProducts([]));
    }
  }, [items]);

  // Sadece favoriteIds değişince favori ürün detaylarını çek
  useEffect(() => {
    if (favoriteIds && favoriteIds.length > 0) {
      apiClient
        .get('/products', { params: { ids: favoriteIds.join(',') } })
        .then(res => setFavoriteProducts(res.data?.data?.products || []))
        .catch(() => setFavoriteProducts([]));
    } else {
      setFavoriteProducts([]);
    }
  }, [favoriteIds]);

  const handleCheckoutClick = () => {
    if (isAuthenticated()) {
      setIsCheckoutOpen(true);
    } else {
      setIsLoginOpen(true);
    }
  };

  if (!isMounted) {
    return (
      <div className="bg-slate-50 min-h-screen py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
        <div className="bg-slate-100 p-8 rounded-full mb-6">
          <ShoppingBag size={48} className="text-slate-400" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Sepetiniz şu an boş</h1>
        <p className="text-slate-500 font-medium mb-8">Sepetinizde ürün bulunamadı. Hemen alışverişe başlayın!</p>
        <Link href="/">
          <button className="bg-slate-900 text-white px-8 py-4 rounded-xl font-black shadow-lg hover:bg-[#ff5000] active:scale-95 transition-all">
            ALIŞVERİŞE BAŞLA
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <h1 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Sepetim ({getTotalItems()})</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sepet ürünleri */}
          <div className="flex-1 space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.cartKey || item._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white p-4 md:p-6 rounded-2xl border-[0.5px] border-slate-200 flex flex-col md:flex-row items-center gap-6 shadow-sm"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-24 h-32 object-cover rounded-xl bg-slate-50"
                  />
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="font-black text-slate-900 text-lg mb-1">{item.name}</h3>
                    <p className="text-slate-400 text-sm font-bold mb-4">{item.brand}</p>
                    {item.selectedVariant && Object.keys(item.selectedVariant).length > 0 && (
                      <div className="mb-3 flex flex-wrap justify-center gap-2 md:justify-start">
                        {Object.entries(item.selectedVariant).map(([key, value]) => (
                          <span key={key} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.selectedServices && item.selectedServices.length > 0 && (
                      <div className="mb-4 flex flex-wrap justify-center gap-2 md:justify-start">
                        {item.selectedServices.map((service) => (
                          <span key={service.name} className="rounded-full border border-[#ff5000]/20 bg-[#ff5000]/5 px-3 py-1 text-[11px] font-semibold text-[#ff5000]">
                            {service.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-center md:justify-start gap-4">
                      <div className="flex items-center bg-slate-100 rounded-lg p-1 border-[0.5px] border-slate-200">
                        <button
                          onClick={() => removeItem(item.cartKey || item._id, token)}
                          className="p-1.5 hover:bg-white rounded-md transition-colors text-slate-600"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-10 text-center font-black text-sm">{item.quantity}</span>
                        <button
                          onClick={() => {
                            // CartItem → CartItemInput: quantity alanını çıkar
                            const { quantity: _q, ...itemInput } = item;
                            void _q;
                            addItem(itemInput, token);
                          }}
                          className="p-1.5 hover:bg-white rounded-md transition-colors text-slate-600"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="text-center md:text-right flex flex-col items-center md:items-end gap-2 min-w-[120px]">
                    <span className="text-xl font-black text-[#ff5000] tracking-tighter">
                      {(item.price * item.quantity).toLocaleString('tr-TR')} TL
                    </span>
                    <button
                      onClick={() => removeItem(item.cartKey || item._id, token)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-2"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Tabbed öneri/favori bölümü */}
            <div className="mt-10">
              <div className="flex gap-6 border-b-2 border-slate-100 mb-6">
                {TABS.map((tab, i) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(i)}
                    className={`pb-3 px-2 text-lg font-black transition-all ${activeTab === i ? 'border-b-4 border-[#ff5000] text-[#ff5000]' : 'text-slate-400'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div>
                {activeTab === 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {previousCart.length === 0 ? (
                      <p className="text-slate-400 text-sm font-medium py-4">Önceki sepet geçmişi bulunamadı.</p>
                    ) : (
                      previousCart.map((product) => (
                        <ProductMiniCard
                          key={product._id}
                          product={product}
                          onRemove={() => {}}
                          onToggleFavorite={() => toggleFavorite(product._id, token || "")}
                          isFavorite={favoriteIds.includes(product._id)}
                        />
                      ))
                    )}
                  </div>
                )}
                {activeTab === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {favoriteProducts.length === 0 ? (
                      <p className="text-slate-400 text-sm font-medium py-4">Favori listeniz boş.</p>
                    ) : (
                      favoriteProducts.map((product) => (
                        <ProductMiniCard
                          key={product._id}
                          product={product}
                          onRemove={() => toggleFavorite(product._id, token || "")}
                          onToggleFavorite={() => toggleFavorite(product._id, token || "")}
                          isFavorite={favoriteIds.includes(product._id)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Önerilen Ürünler */}
            {suggestedProducts.length > 0 && (
              <div className="mt-12">
                <h2 className="text-xl font-black text-slate-900 mb-4">Önerilen Ürünler</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {suggestedProducts.slice(0, 8).map((product) => (
                    <Link key={product._id} href={productPath(product)}>
                      <div className="bg-white rounded-2xl border border-slate-200 p-3 hover:shadow-md transition-all cursor-pointer">
                        <img src={product.imageUrl} alt={product.name} className="w-full aspect-square object-cover rounded-xl bg-slate-50 mb-2" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider truncate">{product.brand}</p>
                        <p className="text-sm font-black text-slate-800 truncate mt-0.5">{product.name}</p>
                        <p className="text-sm font-black text-[#ff5000] mt-1">{product.price.toLocaleString('tr-TR')} TL</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sipariş Özeti */}
          <div className="w-full lg:w-96">
            <div className="bg-white p-6 md:p-8 rounded-3xl border-[0.5px] border-slate-200 shadow-xl sticky top-28">
              <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">Sipariş Özeti</h2>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-slate-500 font-bold">
                  <span>Ürün Toplamı</span>
                  <span>{getTotalPrice().toLocaleString('tr-TR')} TL</span>
                </div>
                <div className="flex justify-between text-slate-500 font-bold">
                  <span>Kargo Toplamı</span>
                  {quote ? (
                    quote.freeShippingApplied || quote.shippingCost === 0 ? (
                      <span className="text-green-600">Bedava</span>
                    ) : (
                      <span>{quote.shippingCost.toLocaleString('tr-TR')} TL</span>
                    )
                  ) : (
                    <span className="text-slate-400">Hesaplanıyor…</span>
                  )}
                </div>
                <div className="border-t border-dashed pt-4 flex justify-between">
                  <span className="text-lg font-black text-slate-900">Toplam</span>
                  <span className="text-2xl font-black text-[#ff5000] tracking-tighter">
                    {(quote?.buyerTotal ?? getTotalPrice()).toLocaleString('tr-TR')} TL
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckoutClick}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl text-base font-black hover:bg-[#ff5000] active:scale-[0.98] transition-all duration-300 shadow-xl flex items-center justify-center gap-3 uppercase tracking-tighter"
              >
                Sepeti Onayla
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
