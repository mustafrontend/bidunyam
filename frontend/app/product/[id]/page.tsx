"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { motion } from "framer-motion";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { Star, ShoppingCart, ArrowLeft, Truck, ShieldCheck, RotateCcw, Check } from "lucide-react";

interface VariantGroup {
  name: string;
  type: "COLOR" | "SIZE" | "CUSTOM";
  values: Array<{
    label: string;
    price: number;
    stock: number;
  }>;
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
  bulletPoints?: string[];
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
  variants?: VariantGroup[];
  extraServices?: ExtraService[];
}

function buildCartKey(productId: string, selectedVariants: Record<string, string>, selectedServices: ExtraService[]) {
  return `${productId}:${Object.entries(selectedVariants)
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("|")}:${selectedServices.map((s) => s.name).sort().join("|")}`;
}

function formatVariantMeta(price: number, stock: number) {
  const parts = [];
  if (price > 0) parts.push(`${price.toLocaleString("tr-TR")} TL`);
  if (stock > 0) parts.push(`${stock} adet`);
  return parts.join(" • ");
}

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({});
  const [added, setAdded] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await apiClient.get(`/products/${id}`);
        const p: Product = res.data.data;
        setProduct(p);

        const initialVariants: Record<string, string> = {};
        (p.variants || []).forEach((group) => {
          if (group.values?.length) initialVariants[group.name] = group.values[0].label;
        });
        setSelectedVariants(initialVariants);
        setSelectedImageIndex(0);
      } catch (err) {
        console.error("Failed to fetch product", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  const gallery = useMemo(() => {
    if (!product) return [];
    const imgs = product.imageUrls?.filter(Boolean) ?? [];
    return imgs.length > 0 ? imgs : [product.imageUrl].filter(Boolean);
  }, [product]);

  const activeServices = useMemo(() => {
    if (!product?.extraServices?.length) return [] as ExtraService[];
    return product.extraServices.filter((service) => selectedServices[service.name]);
  }, [product, selectedServices]);

  const finalPrice = useMemo(() => {
    if (!product) return 0;
    const selectedVariantPrice = (product.variants || []).reduce((sum, group) => {
      const selectedLabel = selectedVariants[group.name];
      const selected = group.values.find((option) => option.label === selectedLabel);
      return sum + (selected?.price || 0);
    }, 0);
    const serviceTotal = activeServices.reduce((sum, service) => sum + (service.price || 0), 0);
    return (selectedVariantPrice > 0 ? selectedVariantPrice : product.price) + serviceTotal;
  }, [product, activeServices, selectedVariants]);

  const effectiveStock = useMemo(() => {
    if (!product) return 0;
    const variantStocks = (product.variants || [])
      .map((group) => {
        const selectedLabel = selectedVariants[group.name];
        const selected = group.values.find((option) => option.label === selectedLabel);
        return selected?.stock || 0;
      })
      .filter((count) => count > 0);

    if (!variantStocks.length) return product.stock || 0;
    return Math.min(product.stock || 0, ...variantStocks);
  }, [product, selectedVariants]);

  const handleAddToCart = async () => {
    if (!product) return;
    const cartKey = buildCartKey(product._id, selectedVariants, activeServices);
    await addItem(
      {
        ...product,
        price: finalPrice,
        imageUrl: gallery[selectedImageIndex] || product.imageUrl,
        cartKey,
        selectedVariant: selectedVariants,
        selectedServices: activeServices,
      },
      token
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-12">
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="aspect-square w-full rounded-2xl bg-slate-200 md:w-1/2" />
          <div className="w-full space-y-6 md:w-1/2">
            <div className="h-8 w-1/4 rounded bg-slate-200" />
            <div className="h-12 w-3/4 rounded bg-slate-200" />
            <div className="h-24 w-full rounded bg-slate-200" />
            <div className="h-12 w-1/3 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return <div className="py-20 text-center font-black">Ürün bulunamadı.</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors group hover:text-brand-orange"
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          Geri Dön
        </button>

        <div className="flex flex-col gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:gap-12 lg:p-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-1/2"
          >
            <div className="overflow-hidden rounded-2xl bg-slate-50 aspect-square">
              <img
                src={gallery[selectedImageIndex] || product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>

            {gallery.length > 1 && (
              <div className="mt-4 grid grid-cols-5 gap-3">
                {gallery.slice(0, 5).map((img, index) => (
                  <button
                    key={`${img}-${index}`}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`overflow-hidden rounded-xl border-2 transition-colors ${selectedImageIndex === index ? "border-brand-orange" : "border-slate-200"}`}
                  >
                    <img src={img} alt={`${product.name}-${index}`} className="h-20 w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex w-full flex-col lg:w-1/2"
          >
            <div className="mb-6">
              <span className="mb-2 block text-sm font-black uppercase tracking-widest text-brand-orange">{product.brand}</span>
              <h1 className="mb-4 text-3xl font-black leading-tight tracking-tight text-slate-900 md:text-4xl">{product.name}</h1>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star fill="currentColor" size={20} />
                  <span className="text-lg font-black text-slate-900">{product.rating}</span>
                </div>
                <span className="border-l pl-4 font-bold text-slate-400">{product.reviewCount} Değerlendirme</span>
              </div>
            </div>

            <p className="mb-5 text-slate-600 leading-relaxed font-medium">
              {product.shortDescription || product.description}
            </p>

            {product.bulletPoints?.length ? (
              <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Öne Çıkanlar</p>
                <div className="space-y-2">
                  {product.bulletPoints.slice(0, 5).map((point) => (
                    <div key={point} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check size={16} className="mt-0.5 text-green-600" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mb-6 flex items-center justify-between rounded-2xl bg-slate-50 p-5">
              <div>
                {product.originalPrice > product.price && (
                  <span className="mb-1 block text-lg font-bold text-slate-400 line-through">
                    {product.originalPrice.toLocaleString("tr-TR")} TL
                  </span>
                )}
                <span className="text-4xl font-black tracking-tighter text-brand-orange">
                  {finalPrice.toLocaleString("tr-TR")} TL
                </span>
              </div>
              <div className="text-right">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Kategori</span>
                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black uppercase tracking-tighter text-slate-700">
                  {product.category}
                </span>
              </div>
            </div>

            <div className="space-y-5">
              {(product.variants || []).map((group) => (
                <div key={group.name}>
                  <p className="mb-3 text-sm font-black text-slate-800">
                    {group.name}: <span className="text-slate-500 font-semibold">{selectedVariants[group.name]}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.values.map((value) => (
                      <button
                        key={value.label}
                        onClick={() => setSelectedVariants((prev) => ({ ...prev, [group.name]: value.label }))}
                        className={`min-w-14 rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${
                          selectedVariants[group.name] === value.label
                            ? "border-brand-orange bg-brand-orange/5 text-brand-orange"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span className="block">{value.label}</span>
                        {formatVariantMeta(value.price, value.stock) ? (
                          <span className="mt-1 block text-[10px] font-medium text-slate-400">
                            {formatVariantMeta(value.price, value.stock)}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {(product.extraServices || []).length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-black text-slate-800">Ek Hizmetler</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {product.extraServices?.map((service) => {
                      const checked = !!selectedServices[service.name];
                      return (
                        <button
                          key={service.name}
                          onClick={() =>
                            setSelectedServices((prev) => ({
                              ...prev,
                              [service.name]: !prev[service.name],
                            }))
                          }
                          className={`rounded-2xl border p-4 text-left transition-colors ${
                            checked ? "border-brand-orange bg-brand-orange/5" : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-black text-slate-800">{service.name}</p>
                              {service.description ? <p className="mt-1 text-xs text-slate-500">{service.description}</p> : null}
                            </div>
                            <span className="font-black text-brand-orange">+{service.price.toLocaleString("tr-TR")} TL</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Seçili Stok</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{effectiveStock} adet</p>
                <p className="text-xs text-slate-500">Seçtiğin varyant kombinasyonuna göre stok görünür.</p>
              </div>

              <div className="flex flex-col gap-4 pt-2">
                <button
                  onClick={handleAddToCart}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 py-5 text-base font-black text-white shadow-xl transition-all duration-300 hover:bg-brand-orange active:scale-[0.98]"
                >
                  <ShoppingCart size={22} />
                  {added ? "SEPETE EKLENDİ" : "SEPETE EKLE"}
                </button>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 border-t pt-8">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <Truck size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Hızlı Teslimat</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <ShieldCheck size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Güvenli Ödeme</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <RotateCcw size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Kolay İade</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
