import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/shallow';
import { WindowsSlice, createWindowsSlice } from './slices/windowsSlice';
import { PreferencesSlice, createPreferencesSlice } from './slices/preferencesSlice';
import { MockDataSlice, createMockDataSlice } from './slices/mockDataSlice';
import { RadRadioSlice, createRadRadioSlice } from './slices/radRadioSlice';

// Re-export types for convenience
export type { WindowState } from './slices/windowsSlice';
export type { Radiant, StudioSubmission } from './slices/mockDataSlice';

// Combined store type
type RadOSState = WindowsSlice & PreferencesSlice & MockDataSlice & RadRadioSlice;

// Main store with all slices
export const useRadOSStore = create<RadOSState>()(
  devtools(
    persist(
      (set, get, api) => ({
        ...createWindowsSlice(set, get, api),
        ...createPreferencesSlice(set, get, api),
        ...createMockDataSlice(set, get, api),
        ...createRadRadioSlice(set, get, api),
      }),
      {
        name: 'rados-storage',
        version: 1,
        partialize: (state) => ({
          // Persist preferences
          volume: state.volume,
          reduceMotion: state.reduceMotion,
          darkMode: state.darkMode,
          // Persist radio favorites
          radioFavorites: state.radioFavorites,
          // Don't persist windows (fresh start each session)
          // Don't persist invertMode (session only per spec)
        }),
        migrate: (persisted, version) => {
          const state = persisted as Record<string, unknown>;
          if (version === 0) {
            // Migrate favorites from the old standalone localStorage key
            if (typeof window !== 'undefined') {
              try {
                const legacy = localStorage.getItem('rados-favorites');
                if (legacy) {
                  state.radioFavorites = JSON.parse(legacy) as string[];
                  localStorage.removeItem('rados-favorites');
                }
              } catch {
                // Invalid JSON, ignore
              }
            }
          }
          return state as unknown as RadOSState;
        },
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
      openWindowWithZoom: state.openWindowWithZoom,
      clearZoomAnimation: state.clearZoomAnimation,
      zoomAnimation: state.zoomAnimation,
      closeWindow: state.closeWindow,
      focusWindow: state.focusWindow,
      toggleFullscreen: state.toggleFullscreen,
      toggleWidget: state.toggleWidget,
      updateWindowPosition: state.updateWindowPosition,
      updateWindowSize: state.updateWindowSize,
      setActiveTab: state.setActiveTab,
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
      radiants: state.radiants,
      studioSubmissions: state.studioSubmissions,
      setRadiants: state.setRadiants,
      setStudioSubmissions: state.setStudioSubmissions,
      addStudioSubmission: state.addStudioSubmission,
      updateSubmissionVotes: state.updateSubmissionVotes,
    }))
  );

export const useRadRadioStore = () =>
  useRadOSStore(
    useShallow((state) => ({
      currentVideoIndex: state.radioCurrentVideoIndex,
      currentTrackIndex: state.radioCurrentTrackIndex,
      currentChannel: state.radioCurrentChannel,
      isPlaying: state.radioIsPlaying,
      currentTime: state.radioCurrentTime,
      favorites: state.radioFavorites,
      nextVideo: state.radioNextVideo,
      prevVideo: state.radioPrevVideo,
      setVideoIndex: state.radioSetVideoIndex,
      nextTrack: state.radioNextTrack,
      prevTrack: state.radioPrevTrack,
      setTrackIndex: state.radioSetTrackIndex,
      setChannel: state.radioSetChannel,
      togglePlay: state.radioTogglePlay,
      setPlaying: state.radioSetPlaying,
      setCurrentTime: state.radioSetCurrentTime,
      pendingSeek: state.radioPendingSeek,
      seekTo: state.radioSeekTo,
      clearPendingSeek: state.radioClearPendingSeek,
      toggleFavorite: state.radioToggleFavorite,
      minified: state.radioMinified,
      toggleMinified: state.radioToggleMinified,
    }))
  );
