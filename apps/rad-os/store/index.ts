import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/shallow';
import { WindowsSlice, createWindowsSlice } from './slices/windowsSlice';
import { PreferencesSlice, createPreferencesSlice } from './slices/preferencesSlice';
import { MockDataSlice, createMockDataSlice } from './slices/mockDataSlice';
import { WalletSlice, createWalletSlice } from './slices/walletSlice';

// Re-export types for convenience
export type { WindowState } from './slices/windowsSlice';
export type { Auction, Radiant, StudioSubmission } from './slices/mockDataSlice';
export type { OwnedRadiant } from './slices/walletSlice';

// Combined store type
type RadOSState = WindowsSlice & PreferencesSlice & MockDataSlice & WalletSlice;

// Main store with all slices
export const useRadOSStore = create<RadOSState>()(
  devtools(
    persist(
      (set, get, api) => ({
        ...createWindowsSlice(set, get, api),
        ...createPreferencesSlice(set, get, api),
        ...createMockDataSlice(set, get, api),
        ...createWalletSlice(set, get, api),
      }),
      {
        name: 'rados-storage',
        partialize: (state) => ({
          // Persist preferences
          volume: state.volume,
          reduceMotion: state.reduceMotion,
          darkMode: state.darkMode,
          // Don't persist windows (fresh start each session)
          // Don't persist invertMode (session only per spec)
        }),
      }
    ),
    { name: 'RadOS Store' }
  )
);

// Convenience hooks for specific slices using shallow comparison
export const useWindowsStore = () =>
  useRadOSStore(
    useShallow((state) => ({
      windows: state.windows,
      nextZIndex: state.nextZIndex,
      openWindow: state.openWindow,
      closeWindow: state.closeWindow,
      focusWindow: state.focusWindow,
      toggleFullscreen: state.toggleFullscreen,
      updateWindowPosition: state.updateWindowPosition,
      updateWindowSize: state.updateWindowSize,
      getWindow: state.getWindow,
      getOpenWindows: state.getOpenWindows,
    }))
  );

export const usePreferencesStore = () =>
  useRadOSStore(
    useShallow((state) => ({
      volume: state.volume,
      reduceMotion: state.reduceMotion,
      invertMode: state.invertMode,
      darkMode: state.darkMode,
      setVolume: state.setVolume,
      setReduceMotion: state.setReduceMotion,
      toggleReduceMotion: state.toggleReduceMotion,
      setInvertMode: state.setInvertMode,
      toggleInvertMode: state.toggleInvertMode,
      setDarkMode: state.setDarkMode,
      toggleDarkMode: state.toggleDarkMode,
    }))
  );

export const useMockDataStore = () =>
  useRadOSStore(
    useShallow((state) => ({
      auctions: state.auctions,
      radiants: state.radiants,
      studioSubmissions: state.studioSubmissions,
      setAuctions: state.setAuctions,
      setRadiants: state.setRadiants,
      setStudioSubmissions: state.setStudioSubmissions,
      addStudioSubmission: state.addStudioSubmission,
      updateSubmissionVotes: state.updateSubmissionVotes,
    }))
  );

export const useWalletStore = () =>
  useRadOSStore(
    useShallow((state) => ({
      isWalletConnected: state.isWalletConnected,
      walletAddress: state.walletAddress,
      ownedRadiants: state.ownedRadiants,
      activeMockState: state.activeMockState,
      setWalletConnected: state.setWalletConnected,
      setWalletAddress: state.setWalletAddress,
      setOwnedRadiants: state.setOwnedRadiants,
      connectWallet: state.connectWallet,
      disconnectWallet: state.disconnectWallet,
      setActiveMockState: state.setActiveMockState,
      applyMockState: state.applyMockState,
    }))
  );
