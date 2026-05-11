import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api';

interface CartItem {
  _id: string;
  name: string;
  price: number;
  brand: string;
  imageUrl: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: any, token?: string | null) => Promise<void>;
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
          set({ items: res.data.data });
        } catch (err) {
          console.error('Failed to fetch cart from Redis', err);
        }
      },
      addItem: async (product, token) => {
        const items = get().items;
        const existingItem = items.find((item) => item._id === product._id);
        
        let newItems;
        if (existingItem) {
          newItems = items.map((item) =>
            item._id === product._id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          newItems = [...items, { ...product, quantity: 1 }];
        }
        
        set({ items: newItems });

        // Sync with Redis if logged in
        if (token) {
          try {
            await apiClient.post('/cart/add', product, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (err) {
            console.error('Failed to sync cart item add', err);
          }
        }
      },
      removeItem: async (productId, token) => {
        const items = get().items;
        const existingItem = items.find((item) => item._id === productId);

        let newItems;
        if (existingItem && existingItem.quantity > 1) {
          newItems = items.map((item) =>
            item._id === productId
              ? { ...item, quantity: item.quantity - 1 }
              : item
          );
        } else {
          newItems = items.filter((item) => item._id !== productId);
        }

        set({ items: newItems });

        // Sync with Redis if logged in
        if (token) {
          try {
            await apiClient.delete(`/cart/${productId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (err) {
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
