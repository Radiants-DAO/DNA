import type { StateCreator } from "zustand";
import type { AppState } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { LazyStore } from "@tauri-apps/plugin-store";

// ============================================================================
// Types
// ============================================================================

export interface ThemeEntry {
  id: string;
  name: string;
  path: string;
  hasTokensCss: boolean;
  hasDarkCss: boolean;
  hasComponentsDir: boolean;
  apps: string[];
}

export interface AppEntry {
  id: string;
  name: string;
  path: string;
  themeIds: string[];
  devCommand: string;
  devPort: number;
  previewRoute: string;
}

export interface RecentWorkspace {
  path: string;
  name: string;
  lastOpened: string;
}

export type WorkspaceContext = {
  type: "monorepo";
  root: string;
  themes: ThemeEntry[];
  apps: AppEntry[];
  activeThemeId: string | null;
  activeAppId: string | null;
} | null;

export interface WorkspaceSlice {
  // State
  workspace: WorkspaceContext;
  workspaceLoading: boolean;
  workspaceError: string | null;
  recentWorkspaces: RecentWorkspace[];
  /** True while theme data (tokens/assets/schemas) is loading after theme selection */
  themeDataLoading: boolean;

  // Actions
  initializeWorkspace: () => Promise<void>;
  openWorkspace: (rootPath?: string) => Promise<void>;
  closeWorkspace: () => Promise<void>;
  selectTheme: (themeId: string) => Promise<void>;
  selectApp: (appId: string) => Promise<void>;
  removeRecentWorkspace: (path: string) => Promise<void>;
}

// ============================================================================
// Persistence
// ============================================================================

const STORE_FILE = "workspace.json";
const MAX_RECENT = 10;

let _store: LazyStore | null = null;
function getStore(): LazyStore {
  if (!_store) {
    _store = new LazyStore(STORE_FILE);
  }
  return _store;
}

// ============================================================================
// Helpers
// ============================================================================

interface MonorepoScanResult {
  themes: ThemeEntry[];
  apps: AppEntry[];
  errors: string[];
}

/**
 * Poll the Rust backend for server status until it transitions to "running"
 * (or we give up). Covers the race where Rust sets Running before the
 * frontend event listener is mounted.
 */
function pollServerReady(get: () => AppState, attempts = 15, interval = 1000) {
  let count = 0;
  const id = setInterval(async () => {
    count++;
    await get().refreshServerStatus();
    const { serverStatus } = get();
    if (serverStatus.state === "running" || serverStatus.state === "error" || count >= attempts) {
      clearInterval(id);
    }
  }, interval);
}

/**
 * Load theme data (tokens, assets, schemas) into their respective slices.
 * All operations run in parallel and can fail independently.
 */
async function loadThemeData(
  themePath: string,
  get: () => AppState,
): Promise<void> {
  const { loadThemeTokens, loadThemeAssets, scanComponentSchemas, setSpatialRootPath } = get();

  const results = await Promise.allSettled([
    loadThemeTokens(themePath),
    loadThemeAssets(themePath),
    scanComponentSchemas(themePath),
  ]);

  // Set spatial root regardless of individual failures
  setSpatialRootPath(themePath);

  // Log any failures
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      const labels = ["tokens", "assets", "schemas"];
      console.warn(`[workspace] Failed to load ${labels[i]}:`, r.reason);
    }
  });
}

// ============================================================================
// Slice
// ============================================================================

export const createWorkspaceSlice: StateCreator<
  AppState,
  [],
  [],
  WorkspaceSlice
> = (set, get) => ({
  workspace: null,
  workspaceLoading: false,
  workspaceError: null,
  recentWorkspaces: [],
  themeDataLoading: false,

  initializeWorkspace: async () => {
    try {
      const store = getStore();
      const recents = await store.get<RecentWorkspace[]>("recentWorkspaces") ?? [];

      set({ recentWorkspaces: recents });

      // Auto-open last-used workspace
      if (recents.length > 0) {
        const last = recents[0];
        // Verify path still exists
        try {
          await invoke<MonorepoScanResult>("scan_monorepo", { root: last.path });
          // Path is valid, auto-open
          await get().openWorkspace(last.path);
        } catch {
          // Path invalid or no longer a workspace - just show picker
        }
      }
    } catch (err) {
      console.error("[workspace] Failed to initialize:", err);
    }
  },

  openWorkspace: async (rootPath?: string) => {
    let path = rootPath;

    // If no path provided, open folder picker
    if (!path) {
      try {
        const selected = await open({
          multiple: false,
          directory: true,
          title: "Select Monorepo Root",
        });
        if (!selected) return; // cancelled
        path = typeof selected === "string" ? selected : selected[0];
      } catch {
        return;
      }
    }

    set({ workspaceLoading: true, workspaceError: null });

    try {
      const result = await invoke<MonorepoScanResult>("scan_monorepo", { root: path });

      // Log non-fatal errors as warnings
      if (result.errors.length > 0) {
        console.warn("[workspace] Scan warnings:", result.errors);
      }

      // Auto-select first theme
      const firstTheme = result.themes[0] ?? null;
      // Auto-select first app that belongs to selected theme
      const firstApp = firstTheme
        ? result.apps.find((a) => a.themeIds.includes(firstTheme.id)) ?? null
        : null;

      set({
        workspace: {
          type: "monorepo",
          root: path!,
          themes: result.themes,
          apps: result.apps,
          activeThemeId: firstTheme?.id ?? null,
          activeAppId: firstApp?.id ?? null,
        },
        workspaceLoading: false,
        workspaceError: null,
      });

      // Save to recents
      const store = getStore();
      const { recentWorkspaces } = get();
      const name = path!.split("/").pop() ?? "Unknown";
      const updated: RecentWorkspace[] = [
        { path: path!, name, lastOpened: new Date().toISOString() },
        ...recentWorkspaces.filter((r) => r.path !== path),
      ].slice(0, MAX_RECENT);
      await store.set("recentWorkspaces", updated);
      await store.save();
      set({ recentWorkspaces: updated });

      // Load theme data if we have a theme
      if (firstTheme) {
        set({ themeDataLoading: true });
        await loadThemeData(firstTheme.path, get);
        set({ themeDataLoading: false });
      }

      // Start dev server if we have an app
      if (firstApp) {
        try {
          await get().detectProject(firstApp.path);
          await get().startDevServer();
          // Poll for server ready (Rust sets status before frontend listener may be mounted)
          pollServerReady(get);
        } catch (err) {
          console.warn("[workspace] Failed to start dev server:", err);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({
        workspaceLoading: false,
        workspaceError: message,
      });
    }
  },

  closeWorkspace: async () => {
    // Stop any running server
    try {
      await get().stopDevServer();
    } catch {
      // ignore
    }

    // Clear workspace-dependent state
    get().clearTokens();
    get().clearAssets();
    get().clearProject();

    set({
      workspace: null,
      workspaceError: null,
    });
  },

  selectTheme: async (themeId: string) => {
    const { workspace } = get();
    if (!workspace) return;

    const theme = workspace.themes.find((t) => t.id === themeId);
    if (!theme) return;

    // Auto-select app if the theme itself is also an app (e.g. monolith)
    const themeApp = workspace.apps.find((a) => a.id === themeId);
    const autoAppId = themeApp?.id ?? null;

    set({
      workspace: { ...workspace, activeThemeId: themeId, activeAppId: autoAppId },
      themeDataLoading: true,
    });

    // Clear old data and load new theme data
    get().clearTokens();
    get().clearAssets();

    await loadThemeData(theme.path, get);
    set({ themeDataLoading: false });

    // Start dev server if theme has its own app
    if (themeApp) {
      get().setComponentPreviewServerUrl(null);
      get().setPagePreviewUrl(null);
      try {
        await get().stopDevServer();
      } catch { /* ignore */ }
      try {
        await get().detectProject(themeApp.path);
        await get().startDevServer();
        pollServerReady(get);
      } catch (err) {
        console.warn("[workspace] Failed to start dev server for theme-app:", themeApp.name, err);
      }
    }
  },

  selectApp: async (appId: string) => {
    const { workspace } = get();
    if (!workspace) return;

    const app = workspace.apps.find((a) => a.id === appId);
    if (!app) return;

    // Also select the app's primary theme if different
    const appThemeId = app.themeIds[0] ?? null;
    const themeChanged = appThemeId && appThemeId !== workspace.activeThemeId;

    set({
      workspace: {
        ...workspace,
        activeThemeId: themeChanged ? appThemeId : workspace.activeThemeId,
        activeAppId: appId,
      },
    });

    // Load theme data if theme changed
    if (themeChanged && appThemeId) {
      const theme = workspace.themes.find((t) => t.id === appThemeId);
      if (theme) {
        set({ themeDataLoading: true });
        get().clearTokens();
        get().clearAssets();
        await loadThemeData(theme.path, get);
        set({ themeDataLoading: false });
      }
    }

    // Clear stale preview URLs before server restart
    get().setComponentPreviewServerUrl(null);
    get().setPagePreviewUrl(null);

    // Stop existing server and start new one
    try {
      await get().stopDevServer();
    } catch {
      // ignore stop errors
    }
    try {
      await get().detectProject(app.path);
      await get().startDevServer();
      // Poll for server ready (Rust sets status before frontend listener may be mounted)
      pollServerReady(get);
    } catch (err) {
      console.error("[workspace] Failed to start dev server for app:", app.name, err);
    }
  },

  removeRecentWorkspace: async (path: string) => {
    const store = getStore();
    const { recentWorkspaces } = get();
    const updated = recentWorkspaces.filter((r) => r.path !== path);
    await store.set("recentWorkspaces", updated);
    await store.save();
    set({ recentWorkspaces: updated });
  },
});
