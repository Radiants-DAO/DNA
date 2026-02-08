/**
 * Workspace Slice - Ported from Flow 0
 *
 * Manages workspace context (monorepo detection, themes, apps).
 * Workspace detection is stubbed for the extension context.
 */

import type { StateCreator } from "zustand";
import type {
  AppState,
  WorkspaceContext,
  ThemeEntry,
  AppEntry,
  RecentWorkspace,
} from "../types";

export interface WorkspaceSlice {
  // State
  workspace: WorkspaceContext;
  workspaceLoading: boolean;
  workspaceError: string | null;
  recentWorkspaces: RecentWorkspace[];
  themeDataLoading: boolean;

  // Actions
  initializeWorkspace: () => Promise<void>;
  openWorkspace: (rootPath?: string) => Promise<void>;
  closeWorkspace: () => Promise<void>;
  selectTheme: (themeId: string) => Promise<void>;
  selectApp: (appId: string) => Promise<void>;
  removeRecentWorkspace: (path: string) => Promise<void>;

  // Extension-specific: set workspace directly
  setWorkspaceFromBridge: (workspace: WorkspaceContext) => void;
  setThemeDataLoading: (loading: boolean) => void;
}

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

  // Stubbed for extension - workspace is detected via content bridge
  initializeWorkspace: async () => {
    // In the extension context, workspace is initialized via content bridge
    // This is a no-op stub
  },

  openWorkspace: async (_rootPath?: string) => {
    set({ workspaceLoading: true, workspaceError: null });

    // In the extension context, workspace is opened via content bridge
    set({
      workspaceLoading: false,
      workspaceError: "Direct workspace opening not supported in extension. Use setWorkspaceFromBridge instead.",
    });
  },

  closeWorkspace: async () => {
    // Clear workspace-dependent state
    get().clearTokens();
    get().clearAssets();

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

    // Auto-select app if the theme itself is also an app
    const themeApp = workspace.apps.find((a) => a.id === themeId);
    const autoAppId = themeApp?.id ?? null;

    set({
      workspace: { ...workspace, activeThemeId: themeId, activeAppId: autoAppId },
      themeDataLoading: true,
    });

    // In extension context, theme data loading is handled by content bridge
    // Just mark loading as complete
    set({ themeDataLoading: false });
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

    // In extension context, theme data loading is handled by content bridge
    if (themeChanged) {
      set({ themeDataLoading: true });
      // Theme data would be loaded via content bridge
      set({ themeDataLoading: false });
    }
  },

  removeRecentWorkspace: async (path: string) => {
    set((state) => ({
      recentWorkspaces: state.recentWorkspaces.filter((r) => r.path !== path),
    }));
  },

  // Extension-specific: set workspace directly from content bridge
  setWorkspaceFromBridge: (workspace: WorkspaceContext) => {
    set({
      workspace,
      workspaceLoading: false,
      workspaceError: null,
    });
  },

  setThemeDataLoading: (loading: boolean) => {
    set({ themeDataLoading: loading });
  },
});
