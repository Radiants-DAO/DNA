import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/shallow';
import { WindowsSlice, createWindowsSlice } from './slices/windowsSlice';
import { PreferencesSlice, createPreferencesSlice } from './slices/preferencesSlice';
import { RadRadioSlice, createRadRadioSlice } from './slices/radRadioSlice';
export type { WindowState } from './slices/windowsSlice';

type RadOSState = WindowsSlice & PreferencesSlice & RadRadioSlice;

function sanitizePersistedState(state: unknown) {
  if (!state || typeof state !== 'object') {
    return {};
  }

  const persistedState = state as Record<string, unknown>;

  if (
    persistedState.cornerShape !== 'circle' &&
    persistedState.cornerShape !== 'chamfer' &&
    persistedState.cornerShape !== 'scallop'
  ) {
    persistedState.cornerShape = 'chamfer';
  }

  if (
    persistedState.pixelScale !== 1 &&
    persistedState.pixelScale !== 2 &&
    persistedState.pixelScale !== 3
  ) {
    persistedState.pixelScale = 1;
  }

  if (
    persistedState.theme !== 'radiants' &&
    persistedState.theme !== 'skr' &&
    persistedState.theme !== 'monolith'
  ) {
    persistedState.theme = 'radiants';
  }

  return persistedState;
}

export const useRadOSStore = create<RadOSState>()(
  devtools(
    persist(
      (set, get, api) => ({
        ...createWindowsSlice(set, get, api),
        ...createPreferencesSlice(set, get, api),
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
          darkModeAuto: state.darkModeAuto,
          theme: state.theme,
          pixelScale: state.pixelScale,
          cornerShape: state.cornerShape,
          monolithGradientMapValues: state.monolithGradientMapValues,
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
          return sanitizePersistedState(state) as unknown as RadOSState;
        },
        merge: (persisted, current) => ({
          ...current,
          ...sanitizePersistedState(persisted),
        }),
      }
    ),
    { name: 'RadOS Store' }
  )
);

export const usePreferencesStore = () =>
  useRadOSStore(
    useShallow((state) => ({
      volume: state.volume,
      reduceMotion: state.reduceMotion,
      invertMode: state.invertMode,
      darkMode: state.darkMode,
      darkModeAuto: state.darkModeAuto,
      theme: state.theme,
      pixelScale: state.pixelScale,
      cornerShape: state.cornerShape,
      monolithGradientMapValues: state.monolithGradientMapValues,
      setVolume: state.setVolume,
      setReduceMotion: state.setReduceMotion,
      toggleReduceMotion: state.toggleReduceMotion,
      setInvertMode: state.setInvertMode,
      toggleInvertMode: state.toggleInvertMode,
      setDarkMode: state.setDarkMode,
      toggleDarkMode: state.toggleDarkMode,
      setDarkModeAuto: state.setDarkModeAuto,
      setTheme: state.setTheme,
      setPixelScale: state.setPixelScale,
      setCornerShape: state.setCornerShape,
      setMonolithGradientMapValues: state.setMonolithGradientMapValues,
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
      slow: state.radioSlow,
      reverb: state.radioReverb,
      setSlow: state.radioSetSlow,
      setReverb: state.radioSetReverb,
      widgetOpen: state.radioWidgetOpen,
      toggleWidget: state.radioToggleWidget,
      setWidgetOpen: state.radioSetWidgetOpen,
    }))
  );
