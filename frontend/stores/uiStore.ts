import { create } from 'zustand';

interface UiState {
  isLoginModalOpen: boolean;
  setLoginModalOpen: (isOpen: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isLoginModalOpen: false,
  setLoginModalOpen: (isOpen) => set({ isLoginModalOpen: isOpen }),
}));
