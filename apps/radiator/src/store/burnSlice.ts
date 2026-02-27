import { StateCreator } from 'zustand';

export interface NFTItem {
  mint: string;
  name: string;
  image: string;
  uri: string;
}

export interface BurnSlice {
  eligibleNFTs: NFTItem[];
  primaryNFT: NFTItem | null;
  gasNFTs: NFTItem[];
  offeringRealized: number;
  entangledPair: string | null;
  rewardPreview: { name: string; image: string; uri: string } | null;
  setEligibleNFTs: (nfts: NFTItem[]) => void;
  setPrimaryNFT: (nft: NFTItem | null) => void;
  addGasNFT: (nft: NFTItem) => void;
  removeGasNFT: (mint: string) => void;
  incrementOffering: () => void;
  setEntangledPair: (pair: string | null) => void;
  setRewardPreview: (preview: { name: string; image: string; uri: string } | null) => void;
  resetBurn: () => void;
}

export const createBurnSlice: StateCreator<BurnSlice> = (set) => ({
  eligibleNFTs: [],
  primaryNFT: null,
  gasNFTs: [],
  offeringRealized: 0,
  entangledPair: null,
  rewardPreview: null,
  setEligibleNFTs: (nfts) => set({ eligibleNFTs: nfts }),
  setPrimaryNFT: (nft) => set({ primaryNFT: nft }),
  addGasNFT: (nft) => set((s) => ({ gasNFTs: [...s.gasNFTs, nft] })),
  removeGasNFT: (mint) => set((s) => ({ gasNFTs: s.gasNFTs.filter((n) => n.mint !== mint) })),
  incrementOffering: () => set((s) => ({ offeringRealized: s.offeringRealized + 1 })),
  setEntangledPair: (pair) => set({ entangledPair: pair }),
  setRewardPreview: (preview) => set({ rewardPreview: preview }),
  resetBurn: () => set({
    primaryNFT: null,
    gasNFTs: [],
    offeringRealized: 0,
    entangledPair: null,
    rewardPreview: null,
  }),
});
