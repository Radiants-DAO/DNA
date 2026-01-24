import type { StateCreator } from "zustand";
import type { AppState, ProjectSlice, ServerLog } from "../types";
import { commands } from "../../bindings";

export const createProjectSlice: StateCreator<
  AppState,
  [],
  [],
  ProjectSlice
> = (set, get) => ({
  // Project detection state
  project: null,
  projectLoading: false,
  projectError: null,

  // Dev server state
  serverStatus: { state: "stopped" },
  serverLogs: [],
  maxServerLogs: 500,

  detectProject: async (path) => {
    set({ projectLoading: true, projectError: null });

    const result = await commands.detectProject(path);

    if (result.success && result.project) {
      set({
        project: result.project,
        projectLoading: false,
        projectError: null,
      });
      return { success: true };
    } else {
      set({
        project: null,
        projectLoading: false,
        projectError: result.error || "Unknown error",
      });
      return { success: false, error: result.error || "Unknown error" };
    }
  },

  clearProject: () => {
    set({
      project: null,
      projectLoading: false,
      projectError: null,
      serverStatus: { state: "stopped" },
      serverLogs: [],
    });
  },

  startDevServer: async () => {
    const { project } = get();
    if (!project) {
      return { success: false, error: "No project detected" };
    }

    set({ serverStatus: { state: "starting", logs: [] } });

    const result = await commands.startDevServer(
      project.path,
      project.devCommand,
      project.devPort
    );

    if (result.status === "ok") {
      // Status will be updated via event listener
      return { success: true };
    } else {
      set({
        serverStatus: {
          state: "error",
          message: result.error,
          logs: get().serverLogs.map((l) => l.line),
        },
      });
      return { success: false, error: result.error };
    }
  },

  stopDevServer: async () => {
    const result = await commands.stopDevServer();

    if (result.status === "ok") {
      set({ serverStatus: { state: "stopped" } });
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  },

  refreshServerStatus: async () => {
    const result = await commands.getDevServerStatus();

    if (result.status === "ok") {
      set({ serverStatus: result.data });
    }
  },

  checkServerHealth: async (port) => {
    const result = await commands.checkDevServerHealth(port);

    if (result.status === "ok") {
      return result.data;
    }
    return false;
  },

  addServerLog: (log) => {
    const { serverLogs, maxServerLogs } = get();
    const newLogs = [...serverLogs, log];

    // Trim if exceeds max
    if (newLogs.length > maxServerLogs) {
      newLogs.splice(0, newLogs.length - maxServerLogs);
    }

    set({ serverLogs: newLogs });
  },

  clearServerLogs: () => {
    set({ serverLogs: [] });
  },

  setServerStatus: (status) => {
    set({ serverStatus: status });
  },
});
