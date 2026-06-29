import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SearchSessionState {
  lastSearchedCategory: string | null;
  lastSearchedSubCategory: string | null;
  recentSearches: string[];
  setSearchSession: (category: string | null, subCategory?: string | null) => void;
  clearSearchSession: () => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

// Custom storage wrapper to prevent SSR issues with localStorage
const storage = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
  },
};

export const useSearchSessionStore = create<SearchSessionState>()(
  persist(
    (set, get) => ({
      lastSearchedCategory: null,
      lastSearchedSubCategory: null,
      recentSearches: [],
      setSearchSession: (category, subCategory = null) => 
        set({ lastSearchedCategory: category, lastSearchedSubCategory: subCategory }),
      clearSearchSession: () => 
        set({ lastSearchedCategory: null, lastSearchedSubCategory: null }),
      addRecentSearch: (query) => {
        if (!query.trim()) return;
        const q = query.trim();
        const current = get().recentSearches;
        const filtered = current.filter(item => item.toLowerCase() !== q.toLowerCase());
        set({ recentSearches: [q, ...filtered].slice(0, 5) });
      },
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'bidunyam-search-session',
      storage: createJSONStorage(() => storage), 
    }
  )
);
