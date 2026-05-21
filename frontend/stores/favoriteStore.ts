import { create } from 'zustand';
import { apiClient } from '@/lib/api';

interface FavoriteState {
  productIds: string[];
  isLoading: boolean;
  hasFetched: boolean;
  fetchFavorites: (token: string) => Promise<void>;
  toggleFavorite: (productId: string, token: string) => Promise<void>;
  clearFavorites: () => void;
  isFavorite: (productId: string) => boolean;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  productIds: [],
  isLoading: false,
  hasFetched: false,

  fetchFavorites: async (token) => {
    set({ isLoading: true });
    try {
      const res = await apiClient.get('/auth/favorites', {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ productIds: res.data?.data?.productIds || [], hasFetched: true });
    } catch (err: any) {
      if (err.response?.status !== 401) {
        console.error('Failed to fetch favorites', err);
      }
      set({ productIds: [], hasFetched: true });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleFavorite: async (productId, token) => {
    const exists = get().productIds.includes(productId);

    try {
      const res = exists
        ? await apiClient.delete(`/auth/favorites/${productId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        : await apiClient.post(
            `/auth/favorites/${productId}`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );

      set({ productIds: res.data?.data?.productIds || [], hasFetched: true });
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  },

  clearFavorites: () => set({ productIds: [], hasFetched: false }),

  isFavorite: (productId) => get().productIds.includes(productId),
}));
