import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Address {
  id: string;
  title: string;        // "Ev Adresim", "İş Adresim"
  fullName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood?: string;
  fullAddress: string;
}

interface AddressState {
  addresses: Address[];
  selectedId: string | null;
  addAddress: (a: Omit<Address, 'id'>) => string;
  updateAddress: (id: string, a: Partial<Address>) => void;
  removeAddress: (id: string) => void;
  selectAddress: (id: string) => void;
  getSelected: () => Address | null;
}

function uid() {
  return 'adr-' + Math.random().toString(36).slice(2, 10);
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [],
      selectedId: null,
      addAddress: (a) => {
        const id = uid();
        set((s) => ({
          addresses: [...s.addresses, { ...a, id }],
          selectedId: s.selectedId || id,
        }));
        return id;
      },
      updateAddress: (id, patch) =>
        set((s) => ({
          addresses: s.addresses.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      removeAddress: (id) =>
        set((s) => {
          const addresses = s.addresses.filter((x) => x.id !== id);
          return {
            addresses,
            selectedId: s.selectedId === id ? addresses[0]?.id || null : s.selectedId,
          };
        }),
      selectAddress: (id) => set({ selectedId: id }),
      getSelected: () => {
        const s = get();
        return s.addresses.find((a) => a.id === s.selectedId) || null;
      },
    }),
    { name: 'bidunyam_addresses' }
  )
);
