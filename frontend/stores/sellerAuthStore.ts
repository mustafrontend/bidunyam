import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from './authStore';

interface SellerAuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useSellerAuthStore = create<SellerAuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => {
        set({ user: null, token: null });
      },
      isAuthenticated: () => !!get().token,
    }),
    { name: 'trendyol-seller-auth-storage' }
  )
);
