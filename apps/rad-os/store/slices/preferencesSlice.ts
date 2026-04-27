import { StateCreator } from 'zustand';

export type PixelScale = 1 | 2 | 3;
export type CornerShape = 'circle' | 'chamfer' | 'scallop';
export type RadOSTheme = 'radiants' | 'skr' | 'monolith';

export interface MonolithGradientMapValues {
  portalDark: number;
  portalTeal: number;
  portalSky: number;
  portalMist: number;
  portalCream: number;
  doorTeal: number;
  doorSky: number;
  doorMist: number;
  doorCream: number;
}

export const DEFAULT_MONOLITH_GRADIENT_MAP_VALUES: MonolithGradientMapValues = {
  portalDark: 1,
  portalTeal: 1,
  portalSky: 1,
  portalMist: 1,
  portalCream: 1,
  doorTeal: 1,
  doorSky: 1,
  doorMist: 1,
  doorCream: 1,
};

export interface PreferencesSlice {
  // State
  volume: number;
  reduceMotion: boolean;
  invertMode: boolean;
  darkMode: boolean;
  /** When true, darkMode mirrors the OS `prefers-color-scheme` media query. */
  darkModeAuto: boolean;
  /** Brand-level visual theme. Radiants remains the default RadOS identity. */
  theme: RadOSTheme;
  /** Multiplier applied to pixel-art surfaces via the `--pixel-scale` CSS var. */
  pixelScale: PixelScale;
  /** Global pixel-corner silhouette (circle / chamfer / scallop). */
  cornerShape: CornerShape;
  /** Live tuning values for MONOLITH light-mode SVG gradient maps. */
  monolithGradientMapValues: MonolithGradientMapValues;

  // Actions
  setVolume: (volume: number) => void;
  setReduceMotion: (reduceMotion: boolean) => void;
  toggleReduceMotion: () => void;
  setInvertMode: (invertMode: boolean) => void;
  toggleInvertMode: () => void;
  setDarkMode: (darkMode: boolean) => void;
  toggleDarkMode: () => void;
  setDarkModeAuto: (auto: boolean) => void;
  setTheme: (theme: RadOSTheme) => void;
  setPixelScale: (scale: PixelScale) => void;
  setCornerShape: (shape: CornerShape) => void;
  setMonolithGradientMapValues: (values: MonolithGradientMapValues) => void;
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
  darkMode: false,
  darkModeAuto: true,
  theme: 'radiants',
  pixelScale: 1,
  cornerShape: 'chamfer',
  monolithGradientMapValues: DEFAULT_MONOLITH_GRADIENT_MAP_VALUES,

  setVolume: (volume) => set({ volume: Math.max(0, Math.min(100, volume)) }),

  setReduceMotion: (reduceMotion) => set({ reduceMotion }),

  toggleReduceMotion: () =>
    set((state) => ({ reduceMotion: !state.reduceMotion })),

  setInvertMode: (invertMode) => set({ invertMode }),

  toggleInvertMode: () =>
    set((state) => ({ invertMode: !state.invertMode })),

  setDarkMode: (darkMode) => set({ darkMode }),

  toggleDarkMode: () =>
    set((state) => ({ darkMode: !state.darkMode })),

  setDarkModeAuto: (darkModeAuto) => set({ darkModeAuto }),

  setTheme: (theme) => set({ theme }),

  setPixelScale: (pixelScale) => set({ pixelScale }),

  setCornerShape: (cornerShape) => set({ cornerShape }),

  setMonolithGradientMapValues: (monolithGradientMapValues) =>
    set({ monolithGradientMapValues }),
});
