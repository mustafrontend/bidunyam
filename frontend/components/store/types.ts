export interface StoreInfo {
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

export interface StoreProduct {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
  condition?: string;
  brandName?: string;
  categoryName?: string;
  categoryPath?: string;
  rating?: number;
}

export interface StorefrontProps {
  store: StoreInfo;
  /** Filtre ve aramadan geçmiş, ekranda gösterilecek ürünler */
  products: StoreProduct[];
  /** Mağazadaki toplam ürün sayısı (hero sayacı filtreden etkilenmesin) */
  totalProducts: number;
  /** Ürünlerden türetilen kategoriler */
  categories: string[];
  activeCategory: string;
  onCategoryChange: (c: string) => void;
  query: string;
  onQueryChange: (q: string) => void;
  accent: string;
  displayName: string;
}

export const CONDITION_LABEL: Record<string, string> = {
  SIFIR: "Sıfır",
  AZ_KULLANILMIS: "Az Kullanılmış",
  IKINCI_EL: "İkinci El",
};

export const ALL_CATEGORIES = "Tümü";

export function discountOf(p: StoreProduct): number {
  return p.originalPrice > p.price
    ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
    : 0;
}

export function tl(n: number): string {
  return `${Number(n || 0).toLocaleString("tr-TR")} TL`;
}

/** Aksan rengini rgba'ya çevirir (arka plan tonları için). */
export function withAlpha(hex: string, alpha: number): string {
  const h = (hex || "").replace("#", "");
  if (h.length !== 6) return `rgba(124,58,237,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
