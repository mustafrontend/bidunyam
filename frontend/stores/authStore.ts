import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'CUSTOMER' | 'ADMIN' | 'SELLER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => {
        set({ user: null, token: null });
        // Clear cart on logout to prevent data leakage between users
        import('@/stores/cartStore').then(({ useCartStore }) => {
          useCartStore.getState().clearCart();
        });
      },
      isAuthenticated: () => !!get().token,
    }),
    { name: 'trendyol-auth-storage' }
  )
);
