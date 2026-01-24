import type { StateCreator } from "zustand";
import type { TargetProject, TargetProjectSlice } from "../types";

/**
 * Known dev server ports to scan for RadFlow-enabled projects
 */
const SCAN_PORTS = [3000, 3001, 3002, 3003, 3004, 3005, 4000, 5173, 8080];

export const createTargetProjectSlice: StateCreator<
  TargetProjectSlice,
  [],
  [],
  TargetProjectSlice
> = (set, get) => ({
  targetProjects: [],
  activeTarget: null,
  isScanning: false,

  scanForProjects: async () => {
    set({ isScanning: true });

    const found: TargetProject[] = [];

    // Scan each port for RadFlow health endpoint
    const checks = SCAN_PORTS.map(async (port) => {
      try {
        const response = await fetch(`http://localhost:${port}/api/radflow/health`, {
          method: "GET",
          signal: AbortSignal.timeout(2000),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.ok) {
            // Use project name from health response (from package.json)
            const name = data.project || `localhost:${port}`;

            found.push({
              name,
              url: `http://localhost:${port}`,
              port,
              status: "online",
            });
          }
        }
      } catch {
        // Port not responding or no RadFlow endpoint
      }
    });

    await Promise.all(checks);

    // Sort by port number
    found.sort((a, b) => a.port - b.port);

    // Preserve active target if still online
    const { activeTarget } = get();
    const stillOnline = activeTarget
      ? found.find((p) => p.url === activeTarget.url)
      : null;

    set({
      targetProjects: found,
      activeTarget: stillOnline || found[0] || null,
      isScanning: false,
    });
  },

  setActiveTarget: (target) => {
    set({ activeTarget: target });
  },

  addTargetProject: (project) => {
    set((state) => ({
      targetProjects: [...state.targetProjects, project],
    }));
  },

  removeTargetProject: (url) => {
    set((state) => ({
      targetProjects: state.targetProjects.filter((p) => p.url !== url),
      activeTarget:
        state.activeTarget?.url === url ? null : state.activeTarget,
    }));
  },
});
