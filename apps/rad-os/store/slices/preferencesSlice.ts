import { StateCreator } from 'zustand';

export interface PreferencesSlice {
  // State
  volume: number;
  reduceMotion: boolean;
  invertMode: boolean;

  // Actions
  setVolume: (volume: number) => void;
  setReduceMotion: (reduceMotion: boolean) => void;
  toggleReduceMotion: () => void;
  setInvertMode: (invertMode: boolean) => void;
  toggleInvertMode: () => void;
}

export const createPreferencesSlice: StateCreator<
  PreferencesSlice,
  [],
  [],
  PreferencesSlice
> = (set) => ({
  volume: 50,
  reduceMotion: false,
  invertMode: false,

  setVolume: (volume) => set({ volume: Math.max(0, Math.min(100, volume)) }),

  setReduceMotion: (reduceMotion) => set({ reduceMotion }),

  toggleReduceMotion: () =>
    set((state) => ({ reduceMotion: !state.reduceMotion })),

  setInvertMode: (invertMode) => set({ invertMode }),

  toggleInvertMode: () =>
    set((state) => ({ invertMode: !state.invertMode })),
});
