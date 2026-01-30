import { StateCreator } from "zustand";
import type { AppState } from "../types";
import type { AssetLibrary, IconAsset, LogoAsset, ImageAsset } from "../../bindings";
import { commands } from "../../bindings";

/**
 * Assets Slice
 *
 * Manages design assets (icons, logos, images) from themes and projects.
 * Assets are loaded from:
 * 1. Theme's assets/ directory (icons, logos, images)
 * 2. Project's public/assets/ directory (project-specific assets)
 *
 * Theme assets take precedence - project assets are additive.
 */
export interface AssetsSlice {
  // ============================================================================
  // State
  // ============================================================================

  /** Assets loaded from the active theme */
  themeAssets: AssetLibrary | null;

  /** Assets loaded from the active project */
  projectAssets: AssetLibrary | null;

  /** Whether theme assets are currently loading */
  themeAssetsLoading: boolean;

  /** Whether project assets are currently loading */
  projectAssetsLoading: boolean;

  /**
   * Combined loading state (true if either theme or project assets are loading)
   * @deprecated Use themeAssetsLoading and projectAssetsLoading for more granular control
   */
  assetsLoading: boolean;

  /** Error message from theme asset load operation */
  themeAssetsError: string | null;

  /** Error message from project asset load operation */
  projectAssetsError: string | null;

  /**
   * Combined error message (last error from either operation)
   * @deprecated Use themeAssetsError and projectAssetsError for more granular control
   */
  assetsError: string | null;

  /** Recently used asset IDs (persisted) */
  recentAssetIds: string[];

  // ============================================================================
  // Actions
  // ============================================================================

  /** Load assets from a theme directory */
  loadThemeAssets: (themePath: string) => Promise<void>;

  /** Load assets from a project directory */
  loadProjectAssets: (projectPath: string) => Promise<void>;

  /** Clear all loaded assets */
  clearAssets: () => void;

  /** Add an asset to recently used */
  addRecentAsset: (assetId: string) => void;

  /** Clear recently used assets */
  clearRecentAssets: () => void;

  // ============================================================================
  // Getters (merge theme + project with theme taking precedence)
  // ============================================================================

  /** Get merged icons (theme + project) */
  getMergedIcons: () => IconAsset[];

  /** Get merged logos (theme + project) */
  getMergedLogos: () => LogoAsset[];

  /** Get merged images (theme + project) */
  getMergedImages: () => ImageAsset[];

  /** Get total asset count */
  getTotalAssetCount: () => number;

  /** Get recent assets (resolved from IDs) */
  getRecentAssets: () => IconAsset[];
}

const MAX_RECENT_ASSETS = 20;

export const createAssetsSlice: StateCreator<
  AppState,
  [],
  [],
  AssetsSlice
> = (set, get) => ({
  // ============================================================================
  // Initial State
  // ============================================================================

  themeAssets: null,
  projectAssets: null,
  themeAssetsLoading: false,
  projectAssetsLoading: false,
  assetsLoading: false, // Deprecated: kept for backward compatibility
  themeAssetsError: null,
  projectAssetsError: null,
  assetsError: null, // Deprecated: kept for backward compatibility
  recentAssetIds: [],

  // ============================================================================
  // Actions
  // ============================================================================

  loadThemeAssets: async (themePath) => {
    set((state) => ({
      themeAssetsLoading: true,
      themeAssetsError: null,
      // Update combined loading state
      assetsLoading: true,
    }));

    try {
      const result = await commands.scanThemeAssets(themePath);

      if (result.status === "ok") {
        set((state) => ({
          themeAssets: result.data,
          themeAssetsLoading: false,
          // Only clear combined loading if project isn't loading
          assetsLoading: state.projectAssetsLoading,
        }));
      } else {
        set((state) => ({
          themeAssetsLoading: false,
          themeAssetsError: result.error,
          assetsError: result.error,
          // Only clear combined loading if project isn't loading
          assetsLoading: state.projectAssetsLoading,
        }));
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load theme assets";
      set((state) => ({
        themeAssetsLoading: false,
        themeAssetsError: message,
        assetsError: message,
        // Only clear combined loading if project isn't loading
        assetsLoading: state.projectAssetsLoading,
      }));
    }
  },

  loadProjectAssets: async (projectPath) => {
    set((state) => ({
      projectAssetsLoading: true,
      projectAssetsError: null,
      // Update combined loading state
      assetsLoading: true,
    }));

    try {
      const result = await commands.scanProjectAssets(projectPath);

      if (result.status === "ok") {
        set((state) => ({
          projectAssets: result.data,
          projectAssetsLoading: false,
          // Only clear combined loading if theme isn't loading
          assetsLoading: state.themeAssetsLoading,
        }));
      } else {
        set((state) => ({
          projectAssetsLoading: false,
          projectAssetsError: result.error,
          assetsError: result.error,
          // Only clear combined loading if theme isn't loading
          assetsLoading: state.themeAssetsLoading,
        }));
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load project assets";
      set((state) => ({
        projectAssetsLoading: false,
        projectAssetsError: message,
        assetsError: message,
        // Only clear combined loading if theme isn't loading
        assetsLoading: state.themeAssetsLoading,
      }));
    }
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

  // ============================================================================
  // Getters
  // ============================================================================

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
