import { StateCreator } from 'zustand';

export interface PreferencesSlice {
  volume: number;
  darkMode: boolean;
  setVolume: (volume: number) => void;
  setDarkMode: (darkMode: boolean) => void;
  toggleDarkMode: () => void;
}

export const createPreferencesSlice: StateCreator<
  PreferencesSlice,
  [],
  [],
  PreferencesSlice
> = (set) => ({
  volume: 50,
  darkMode: false,

  setVolume: (volume) => set({ volume: Math.max(0, Math.min(100, volume)) }),
  setDarkMode: (darkMode) => set({ darkMode }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
});
