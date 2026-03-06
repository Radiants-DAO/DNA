import { StateCreator } from 'zustand';

/**
 * Wallet Slice
 *
 * Manages wallet connection state and owned assets for mock state testing.
 * In production, this would be replaced with real wallet adapter integration.
 */

export interface OwnedRadiant {
  mintAddress: string;
  name: string;
  image: string;
  radiantNumber: string;
}

export interface WalletSlice {
  // State
  isWalletConnected: boolean;
  walletAddress: string | null;
  ownedRadiants: OwnedRadiant[];

  // Mock state presets
  activeMockState: string | null;

  // Actions
  setWalletConnected: (connected: boolean) => void;
  setWalletAddress: (address: string | null) => void;
  setOwnedRadiants: (radiants: OwnedRadiant[]) => void;
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;

  // Mock state actions
  setActiveMockState: (stateId: string | null) => void;
  applyMockState: (stateId: string) => void;
}

// Sample owned radiants for mock states
const MOCK_OWNED_RADIANTS: OwnedRadiant[] = [
  {
    mintAddress: 'mock-radiant-001',
    name: 'Radiant 001',
    image: '/assets/radiants/radiant-001.avif',
    radiantNumber: '001',
  },
  {
    mintAddress: 'mock-radiant-015',
    name: 'Radiant 015',
    image: '/assets/radiants/radiant-002.avif',
    radiantNumber: '015',
  },
  {
    mintAddress: 'mock-radiant-023',
    name: 'Radiant 023',
    image: '/assets/radiants/radiant-003.avif',
    radiantNumber: '023',
  },
];

export const createWalletSlice: StateCreator<
  WalletSlice,
  [],
  [],
  WalletSlice
> = (set) => ({
  // Initial state - disconnected
  isWalletConnected: false,
  walletAddress: null,
  ownedRadiants: [],
  activeMockState: null,

  setWalletConnected: (connected) => set({ isWalletConnected: connected }),

  setWalletAddress: (address) => set({ walletAddress: address }),

  setOwnedRadiants: (radiants) => set({ ownedRadiants: radiants }),

  connectWallet: (address) => set({
    isWalletConnected: true,
    walletAddress: address,
  }),

  disconnectWallet: () => set({
    isWalletConnected: false,
    walletAddress: null,
    ownedRadiants: [],
    activeMockState: null,
  }),

  setActiveMockState: (stateId) => set({ activeMockState: stateId }),

  applyMockState: (stateId) => {
    switch (stateId) {
      case 'wallet-disconnected':
        set({
          isWalletConnected: false,
          walletAddress: null,
          ownedRadiants: [],
          activeMockState: stateId,
        });
        break;

      case 'wallet-connected-no-radiants':
        set({
          isWalletConnected: true,
          walletAddress: '0x1234...5678',
          ownedRadiants: [],
          activeMockState: stateId,
        });
        break;

      case 'radiant-holder':
        set({
          isWalletConnected: true,
          walletAddress: '0xABCD...EF01',
          ownedRadiants: MOCK_OWNED_RADIANTS,
          activeMockState: stateId,
        });
        break;

      default:
        set({ activeMockState: null });
    }
  },
});
