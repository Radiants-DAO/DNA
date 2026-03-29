import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/shallow';
import { WindowsSlice, createWindowsSlice } from './slices/windowsSlice';
import { PreferencesSlice, createPreferencesSlice } from './slices/preferencesSlice';

export type { WindowState } from './slices/windowsSlice';

type AppState = WindowsSlice & PreferencesSlice;

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get, api) => ({
        ...createWindowsSlice(set, get, api),
        ...createPreferencesSlice(set, get, api),
      }),
      {
        name: '__APP_NAME__-storage',
        partialize: (state) => ({
          volume: state.volume,
          darkMode: state.darkMode,
        }),
      },
    ),
    { name: '__APP_PASCAL_NAME__ Store' },
  ),
);

export const usePreferencesStore = () =>
  useAppStore(
    useShallow((state) => ({
      volume: state.volume,
      darkMode: state.darkMode,
      setVolume: state.setVolume,
      setDarkMode: state.setDarkMode,
      toggleDarkMode: state.toggleDarkMode,
    })),
  );
