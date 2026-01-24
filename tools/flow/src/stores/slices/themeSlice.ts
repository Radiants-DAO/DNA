import type { StateCreator } from "zustand";
import type {
  AppState,
  ThemeSlice,
  DiscoveredTheme,
  DiscoveredApp,
  HealthResponse,
} from "../types";

/**
 * Known dev server ports to scan for RadFlow-enabled projects
 */
const SCAN_PORTS = [3000, 3001, 3002, 3003, 3004, 3005, 4000, 5173, 8080];

/**
 * Timeout for health check requests (ms)
 */
const HEALTH_TIMEOUT = 2000;

/**
 * Check health of a single port
 * Returns HealthResponse or null if unavailable
 */
async function checkHealth(port: number): Promise<HealthResponse | null> {
  try {
    const response = await fetch(`http://localhost:${port}/api/radflow/health`, {
      method: "GET",
      signal: AbortSignal.timeout(HEALTH_TIMEOUT),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.ok) {
        return data as HealthResponse;
      }
    }
  } catch {
    // Port not responding or no RadFlow endpoint
  }
  return null;
}

/**
 * Group health responses by theme
 * Creates DiscoveredTheme objects with apps grouped appropriately
 */
function groupByTheme(
  responses: Array<{ port: number; health: HealthResponse }>
): DiscoveredTheme[] {
  const themeMap = new Map<string, DiscoveredTheme>();

  for (const { port, health } of responses) {
    const url = `http://localhost:${port}`;

    if (health.theme) {
      // Theme mode: use theme info from health response
      const key = health.theme.root; // Use root path as unique key

      if (!themeMap.has(key)) {
        // Create theme with all apps from manifest (mark as offline initially)
        const apps: DiscoveredApp[] = (health.apps || []).map((app) => ({
          name: app.name,
          displayName: app.displayName,
          port: app.port,
          url: `http://localhost:${app.port}`,
          status: "offline" as const,
          bridgeVersion: undefined,
        }));

        themeMap.set(key, {
          name: health.theme.name,
          displayName: health.theme.displayName,
          root: health.theme.root,
          apps,
          isLegacy: false,
        });
      }

      // Mark the responding app as online
      const theme = themeMap.get(key)!;
      const appIndex = theme.apps.findIndex((a) => a.port === port);
      if (appIndex >= 0) {
        theme.apps[appIndex].status = "online";
        theme.apps[appIndex].bridgeVersion = health.version;
      } else {
        // App not in manifest but responding (shouldn't happen normally)
        theme.apps.push({
          name: health.app?.name || `port-${port}`,
          displayName: health.app?.displayName || `App on port ${port}`,
          port,
          url,
          status: "online",
          bridgeVersion: health.version,
        });
      }
    } else {
      // Legacy mode: create synthetic theme
      const projectName = health.project || `localhost:${port}`;
      const key = `legacy:${port}`;

      if (!themeMap.has(key)) {
        themeMap.set(key, {
          name: projectName,
          displayName: projectName,
          root: "", // Unknown for legacy projects
          apps: [
            {
              name: projectName,
              displayName: projectName,
              port,
              url,
              status: "online",
              bridgeVersion: health.version,
            },
          ],
          isLegacy: true,
        });
      }
    }
  }

  // Convert to array and sort by name
  return Array.from(themeMap.values()).sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
}

/**
 * Theme slice for managing theme/app discovery and selection
 *
 * Key behaviors:
 * - Scans ports for health endpoints
 * - Groups apps by theme (from radflow.config.json)
 * - Falls back to legacy mode for projects without manifest
 * - Updates ViewportSlice.targetUrl when app changes
 */
export const createThemeSlice: StateCreator<AppState, [], [], ThemeSlice> = (
  set,
  get
) => ({
  // State
  discoveredThemes: [],
  activeTheme: null,
  activeApp: null,
  isThemeScanning: false,
  lastScanAt: null,
  scanError: null,

  // Actions
  scanForThemes: async () => {
    set({ isThemeScanning: true, scanError: null });

    try {
      // Parallel scan all ports
      const results = await Promise.all(
        SCAN_PORTS.map(async (port) => {
          const health = await checkHealth(port);
          return health ? { port, health } : null;
        })
      );

      // Filter out nulls and group by theme
      const validResults = results.filter(
        (r): r is { port: number; health: HealthResponse } => r !== null
      );
      const themes = groupByTheme(validResults);

      // Preserve active selection if still valid
      const { activeTheme, activeApp } = get();
      let newActiveTheme: DiscoveredTheme | null = null;
      let newActiveApp: DiscoveredApp | null = null;

      if (activeTheme) {
        // Try to find the same theme
        newActiveTheme =
          themes.find(
            (t) => t.root === activeTheme.root || t.name === activeTheme.name
          ) || null;

        if (newActiveTheme && activeApp) {
          // Try to find the same app
          newActiveApp =
            newActiveTheme.apps.find((a) => a.port === activeApp.port) || null;
        }
      }

      // If no preserved selection, pick first online app
      if (!newActiveTheme && themes.length > 0) {
        newActiveTheme = themes[0];
      }

      if (newActiveTheme && !newActiveApp) {
        // Pick first online app, or first app if none online
        newActiveApp =
          newActiveTheme.apps.find((a) => a.status === "online") ||
          newActiveTheme.apps[0] ||
          null;
      }

      set({
        discoveredThemes: themes,
        activeTheme: newActiveTheme,
        activeApp: newActiveApp,
        isThemeScanning: false,
        lastScanAt: Date.now(),
      });

      // Update viewport URL
      if (newActiveApp) {
        get().setTargetUrl(newActiveApp.url);
      }
    } catch (error) {
      set({
        isThemeScanning: false,
        scanError: error instanceof Error ? error.message : "Scan failed",
      });
    }
  },

  setActiveTheme: (theme) => {
    if (!theme) {
      set({ activeTheme: null, activeApp: null });
      get().setTargetUrl(null);
      return;
    }

    // Auto-select first online app, or first app
    const app =
      theme.apps.find((a) => a.status === "online") || theme.apps[0] || null;

    set({ activeTheme: theme, activeApp: app });

    if (app) {
      get().setTargetUrl(app.url);
    }
  },

  setActiveApp: (app) => {
    const { activeTheme } = get();

    // Validate app belongs to active theme
    if (app && activeTheme) {
      const valid = activeTheme.apps.some((a) => a.port === app.port);
      if (!valid) {
        console.warn(
          `[ThemeSlice] App ${app.name} not found in theme ${activeTheme.name}`
        );
        return;
      }
    }

    set({ activeApp: app });

    if (app) {
      get().setTargetUrl(app.url);
    }
  },

  checkAppHealth: async (app) => {
    // Mark as checking
    const { activeTheme, discoveredThemes } = get();

    const health = await checkHealth(app.port);

    const updatedApp: DiscoveredApp = {
      ...app,
      status: health ? "online" : "offline",
      bridgeVersion: health?.version,
    };

    // Update in state
    if (activeTheme) {
      const updatedApps = activeTheme.apps.map((a) =>
        a.port === app.port ? updatedApp : a
      );
      const updatedTheme = { ...activeTheme, apps: updatedApps };

      // Also update in discoveredThemes
      const updatedThemes = discoveredThemes.map((t) =>
        t.root === activeTheme.root || t.name === activeTheme.name
          ? updatedTheme
          : t
      );

      set({
        activeTheme: updatedTheme,
        discoveredThemes: updatedThemes,
        // Update activeApp if it's the one we checked
        activeApp:
          get().activeApp?.port === app.port ? updatedApp : get().activeApp,
      });
    }

    return updatedApp;
  },

  refreshActiveApp: async () => {
    const { activeApp, checkAppHealth } = get();
    if (activeApp) {
      await checkAppHealth(activeApp);
    }
  },

  getAppByPort: (port) => {
    const { discoveredThemes } = get();
    for (const theme of discoveredThemes) {
      const app = theme.apps.find((a) => a.port === port);
      if (app) return app;
    }
    return null;
  },
});
