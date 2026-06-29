import { create } from 'zustand';

export interface RecentlyViewedProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  brand: string;
  rating: number;
  reviewCount: number;
}

interface RecentlyViewedState {
  products: RecentlyViewedProduct[];
  addProduct: (product: RecentlyViewedProduct) => void;
  clearAll: () => void;
}

const MAX_ITEMS = 20;
const STORAGE_KEY = 'bidunyam_recently_viewed';

function loadFromStorage(): RecentlyViewedProduct[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(products: RecentlyViewedProduct[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch {
    // Storage full or unavailable
  }
}

export const useRecentlyViewedStore = create<RecentlyViewedState>((set, get) => ({
  products: loadFromStorage(),

  addProduct: (product) => {
    const current = get().products;
    // Remove duplicate if exists, then prepend
    const filtered = current.filter((p) => p.id !== product.id);
    const updated = [product, ...filtered].slice(0, MAX_ITEMS);
    saveToStorage(updated);
    set({ products: updated });
  },

  clearAll: () => {
    saveToStorage([]);
    set({ products: [] });
  },
}));
