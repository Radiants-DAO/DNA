import { StateCreator } from 'zustand';

export interface ArtItem {
  file: File | null;
  previewUrl: string;
  name: string;
}

export interface AdminSlice {
  // Step 1: Collection
  adminCollection: string;
  adminCollectionName: string;
  adminCollectionImage: string;
  adminNftCount: number;
  // Step 2: Art
  adminRevealUpfront: boolean;
  adminArtItems: ArtItem[];
  // Step 3: Rules
  adminOfferingSize: number;
  adminCanBurn: boolean;
  adminSymbol: string;
  adminSwapFee: number;
  // Actions
  setAdminCollection: (address: string, name: string, image: string, count: number) => void;
  setAdminRevealUpfront: (reveal: boolean) => void;
  setAdminArtItems: (items: ArtItem[]) => void;
  addAdminArtItem: (item: ArtItem) => void;
  removeAdminArtItem: (index: number) => void;
  updateAdminArtItemName: (index: number, name: string) => void;
  setAdminOfferingSize: (size: number) => void;
  setAdminCanBurn: (canBurn: boolean) => void;
  setAdminSymbol: (symbol: string) => void;
  setAdminSwapFee: (fee: number) => void;
  resetAdmin: () => void;
}

const adminDefaults = {
  adminCollection: '',
  adminCollectionName: '',
  adminCollectionImage: '',
  adminNftCount: 0,
  adminRevealUpfront: true,
  adminArtItems: [] as ArtItem[],
  adminOfferingSize: 3,
  adminCanBurn: true,
  adminSymbol: 'RAD',
  adminSwapFee: 0.05,
};

export const createAdminSlice: StateCreator<AdminSlice> = (set) => ({
  ...adminDefaults,
  setAdminCollection: (address, name, image, count) =>
    set({ adminCollection: address, adminCollectionName: name, adminCollectionImage: image, adminNftCount: count }),
  setAdminRevealUpfront: (reveal) => set({ adminRevealUpfront: reveal }),
  setAdminArtItems: (items) => set({ adminArtItems: items }),
  addAdminArtItem: (item) => set((s) => ({ adminArtItems: [...s.adminArtItems, item] })),
  removeAdminArtItem: (index) =>
    set((s) => ({ adminArtItems: s.adminArtItems.filter((_, i) => i !== index) })),
  updateAdminArtItemName: (index, name) =>
    set((s) => ({
      adminArtItems: s.adminArtItems.map((item, i) => (i === index ? { ...item, name } : item)),
    })),
  setAdminOfferingSize: (size) => set({ adminOfferingSize: size }),
  setAdminCanBurn: (canBurn) => set({ adminCanBurn: canBurn }),
  setAdminSymbol: (symbol) => set({ adminSymbol: symbol }),
  setAdminSwapFee: (fee) => set({ adminSwapFee: fee }),
  resetAdmin: () => set(adminDefaults),
});
