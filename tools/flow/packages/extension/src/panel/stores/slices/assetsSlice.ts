/**
 * Assets Slice - Ported from Flow 0
 *
 * Manages design assets (icons, logos, images) from themes and projects.
 * Asset loading is stubbed for the extension context.
 */

import type { StateCreator } from "zustand";
import type {
  AppState,
  AssetLibrary,
  IconAsset,
  LogoAsset,
  ImageAsset,
} from "../types";

export interface AssetsSlice {
  // State
  themeAssets: AssetLibrary | null;
  projectAssets: AssetLibrary | null;
  themeAssetsLoading: boolean;
  projectAssetsLoading: boolean;
  assetsLoading: boolean;
  themeAssetsError: string | null;
  projectAssetsError: string | null;
  assetsError: string | null;
  recentAssetIds: string[];

  // Actions
  loadThemeAssets: (themePath: string) => Promise<void>;
  loadProjectAssets: (projectPath: string) => Promise<void>;
  clearAssets: () => void;
  addRecentAsset: (assetId: string) => void;
  clearRecentAssets: () => void;

  // Extension-specific: set assets directly from content bridge
  setThemeAssetsFromBridge: (assets: AssetLibrary) => void;
  setProjectAssetsFromBridge: (assets: AssetLibrary) => void;

  // Getters (merge theme + project with theme taking precedence)
  getMergedIcons: () => IconAsset[];
  getMergedLogos: () => LogoAsset[];
  getMergedImages: () => ImageAsset[];
  getTotalAssetCount: () => number;
  getRecentAssets: () => IconAsset[];
}

const MAX_RECENT_ASSETS = 20;

export const createAssetsSlice: StateCreator<
  AppState,
  [],
  [],
  AssetsSlice
> = (set, get) => ({
  // Initial State
  themeAssets: null,
  projectAssets: null,
  themeAssetsLoading: false,
  projectAssetsLoading: false,
  assetsLoading: false,
  themeAssetsError: null,
  projectAssetsError: null,
  assetsError: null,
  recentAssetIds: [],

  // Actions - stubbed for extension
  loadThemeAssets: async (_themePath) => {
    set((state) => ({
      themeAssetsLoading: true,
      themeAssetsError: null,
      assetsLoading: true,
    }));

    // In the extension context, assets are loaded via content bridge
    set((state) => ({
      themeAssetsLoading: false,
      themeAssetsError: "Direct asset loading not supported in extension. Use setThemeAssetsFromBridge instead.",
      assetsLoading: state.projectAssetsLoading,
    }));
  },

  loadProjectAssets: async (_projectPath) => {
    set((state) => ({
      projectAssetsLoading: true,
      projectAssetsError: null,
      assetsLoading: true,
    }));

    // In the extension context, assets are loaded via content bridge
    set((state) => ({
      projectAssetsLoading: false,
      projectAssetsError: "Direct asset loading not supported in extension. Use setProjectAssetsFromBridge instead.",
      assetsLoading: state.themeAssetsLoading,
    }));
  },

  clearAssets: () =>
    set({
      themeAssets: null,
      projectAssets: null,
      themeAssetsError: null,
      projectAssetsError: null,
      assetsError: null,
    }),

  addRecentAsset: (assetId) =>
    set((state) => {
      // Remove if already exists, then add to front
      const filtered = state.recentAssetIds.filter((id) => id !== assetId);
      const updated = [assetId, ...filtered].slice(0, MAX_RECENT_ASSETS);
      return { recentAssetIds: updated };
    }),

  clearRecentAssets: () => set({ recentAssetIds: [] }),

  // Extension-specific: set assets directly from content bridge
  setThemeAssetsFromBridge: (assets: AssetLibrary) => {
    set((state) => ({
      themeAssets: assets,
      themeAssetsLoading: false,
      themeAssetsError: null,
      assetsLoading: state.projectAssetsLoading,
    }));
  },

  setProjectAssetsFromBridge: (assets: AssetLibrary) => {
    set((state) => ({
      projectAssets: assets,
      projectAssetsLoading: false,
      projectAssetsError: null,
      assetsLoading: state.themeAssetsLoading,
    }));
  },

  // Getters
  getMergedIcons: () => {
    const state = get();
    const themeIcons = state.themeAssets?.icons ?? [];
    const projectIcons = state.projectAssets?.icons ?? [];

    // Theme icons take precedence by name
    const themeNames = new Set(themeIcons.map((i) => i.name));
    const uniqueProjectIcons = projectIcons.filter(
      (i) => !themeNames.has(i.name)
    );

    return [...themeIcons, ...uniqueProjectIcons];
  },

  getMergedLogos: () => {
    const state = get();
    const themeLogos = state.themeAssets?.logos ?? [];
    const projectLogos = state.projectAssets?.logos ?? [];

    const themeNames = new Set(themeLogos.map((l) => l.name));
    const uniqueProjectLogos = projectLogos.filter(
      (l) => !themeNames.has(l.name)
    );

    return [...themeLogos, ...uniqueProjectLogos];
  },

  getMergedImages: () => {
    const state = get();
    const themeImages = state.themeAssets?.images ?? [];
    const projectImages = state.projectAssets?.images ?? [];

    const themeNames = new Set(themeImages.map((i) => i.name));
    const uniqueProjectImages = projectImages.filter(
      (i) => !themeNames.has(i.name)
    );

    return [...themeImages, ...uniqueProjectImages];
  },

  getTotalAssetCount: () => {
    const state = get();
    const icons = state.getMergedIcons();
    const logos = state.getMergedLogos();
    const images = state.getMergedImages();
    return icons.length + logos.length + images.length;
  },

  getRecentAssets: () => {
    const state = get();
    const allIcons = state.getMergedIcons();
    const iconMap = new Map(allIcons.map((i) => [i.id, i]));

    return state.recentAssetIds
      .map((id) => iconMap.get(id))
      .filter((i): i is IconAsset => i !== undefined);
  },
});
