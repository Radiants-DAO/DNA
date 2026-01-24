import { useMemo } from 'react';
import { useWalletStore } from '@/store';
import {
  AuctionsMockStates,
  getMockStatePreset,
  DEFAULT_AUCTIONS_STATE,
} from '@/lib/mockStates/auctionsMockStates';

/**
 * useAppMockState Hook
 *
 * Provides per-app mock state access for development testing.
 * Combines wallet store state with app-specific mock state presets.
 *
 * @param appId - The app identifier (e.g., 'auctions', 'studio')
 * @returns The current mock state for the app
 */
export function useAppMockState(appId: string): AuctionsMockStates {
  const {
    isWalletConnected,
    walletAddress,
    ownedRadiants,
    activeMockState,
  } = useWalletStore();

  const mockState = useMemo(() => {
    // If a mock state preset is active, use it
    if (activeMockState) {
      return getMockStatePreset(activeMockState);
    }

    // Otherwise, build state from current wallet store values
    return {
      ...DEFAULT_AUCTIONS_STATE,
      isConnected: isWalletConnected,
      walletAddress,
      ownedRadiants: ownedRadiants.map((r) => ({
        mintAddress: r.mintAddress,
        name: r.name,
        image: r.image,
        radiantNumber: r.radiantNumber,
      })),
    };
  }, [activeMockState, isWalletConnected, walletAddress, ownedRadiants]);

  return mockState;
}

/**
 * useAuctionsMockState Hook
 *
 * Convenience wrapper for useAppMockState with 'auctions' appId.
 */
export function useAuctionsMockState(): AuctionsMockStates {
  return useAppMockState('auctions');
}

/**
 * Check if we're in development mode (mock states available)
 */
export function useDevMode(): boolean {
  return process.env.NODE_ENV === 'development';
}

export default useAppMockState;
