import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api';

export interface CartItem {
  _id: string;
  cartKey?: string;
  name: string;
  price: number;
  brand: string;
  imageUrl: string;
  quantity: number;
  barcode?: string;
  category?: string;
  selectedVariant?: Record<string, string>;
  selectedServices?: Array<{ name: string; price: number; description?: string }>;
}

// Input type for addItem — all CartItem fields except quantity which is managed internally
export type CartItemInput = Omit<CartItem, 'quantity'>;

interface CartState {
  items: CartItem[];
  addItem: (product: CartItemInput, token?: string | null) => Promise<void>;
  removeItem: (productId: string, token?: string | null) => Promise<void>;
  fetchCart: (token: string) => Promise<void>;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      fetchCart: async (token) => {
        try {
          const res = await apiClient.get('/cart', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const rawItems = res.data?.data;
          if (Array.isArray(rawItems)) {
            set({ items: rawItems as CartItem[] });
          }
        } catch (err: unknown) {
          const axiosErr = err as { response?: { status: number } };
          if (axiosErr.response?.status !== 401) {
            console.error('Failed to fetch cart from Redis', err);
          }
        }
      },
      addItem: async (product, token) => {
        const items = get().items;
        const cartKey = product.cartKey || product._id;
        const existingItem = items.find((item) => (item.cartKey || item._id) === cartKey);

        let newItems: CartItem[];
        if (existingItem) {
          newItems = items.map((item) =>
            (item.cartKey || item._id) === cartKey
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          const newItem: CartItem = {
            _id: product._id,
            cartKey,
            name: product.name,
            price: product.price,
            brand: product.brand,
            imageUrl: product.imageUrl,
            quantity: 1,
            barcode: product.barcode,
            category: product.category,
            selectedVariant: product.selectedVariant,
            selectedServices: product.selectedServices,
          };
          newItems = [...items, newItem];
        }

        set({ items: newItems });

        // Sync with Redis if logged in
        if (token) {
          try {
            await apiClient.post('/cart/add', product, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (err: unknown) {
            console.error('Failed to sync cart item add', err);
          }
        }
      },
      removeItem: async (productId, token) => {
        const items = get().items;
        const existingItem = items.find((item) => (item.cartKey || item._id) === productId);

        let newItems: CartItem[];
        if (existingItem && existingItem.quantity > 1) {
          newItems = items.map((item) =>
            (item.cartKey || item._id) === productId
              ? { ...item, quantity: item.quantity - 1 }
              : item
          );
        } else {
          newItems = items.filter((item) => (item.cartKey || item._id) !== productId);
        }

        set({ items: newItems });

        // Sync with Redis if logged in
        if (token) {
          try {
            await apiClient.delete(`/cart/${productId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (err: unknown) {
            console.error('Failed to sync cart item remove', err);
          }
        }
      },
      clearCart: () => set({ items: [] }),
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'trendyol-cart-storage',
    }
  )
);
