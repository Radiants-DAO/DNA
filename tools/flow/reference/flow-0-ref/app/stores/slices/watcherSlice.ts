import type { StateCreator } from "zustand";
import type { AppState, WatcherSlice } from "../types";
import { commands } from "../../bindings";

export const createWatcherSlice: StateCreator<
  AppState,
  [],
  [],
  WatcherSlice
> = (set, get) => ({
  watcherActive: false,
  watchedPath: null,
  lastFileEvent: null,

  startWatcher: async (path) => {
    const result = await commands.startWatcher(path);

    if (result.status === "ok") {
      set({ watcherActive: true, watchedPath: path });
      return { success: true };
    } else {
      console.error("Failed to start watcher:", result.error);
      return { success: false, error: result.error };
    }
  },

  stopWatcher: async () => {
    const result = await commands.stopWatcher();

    if (result.status === "ok") {
      set({ watcherActive: false, watchedPath: null, lastFileEvent: null });
      return { success: true };
    } else {
      console.error("Failed to stop watcher:", result.error);
      return { success: false, error: result.error };
    }
  },

  handleFileEvent: (event) => {
    set({ lastFileEvent: event });

    // Determine what to refresh based on file type
    const path = event.path;
    const isCss = path.endsWith(".css");
    const isTsx = path.endsWith(".tsx");
    const { watchedPath } = get();

    if (!watchedPath) return;

    // Trigger appropriate refreshes
    if (isCss) {
      // Reload tokens if CSS changed - look for theme.css in watched path
      const themeCssPath = `${watchedPath}/src/theme.css`;
      if (path.includes("theme.css") || path.includes("globals.css")) {
        get().loadTokens(path);
      }
    }

    if (isTsx) {
      // Rescan components if TSX changed
      get().scanComponents(watchedPath);
      // Also rescan violations
      get().scanViolations(watchedPath);
      // Clear comments for modified files (comment mode auto-clear)
      get().clearCommentsForFile(path);
    }
  },

  setLastFileEvent: (event) => set({ lastFileEvent: event }),
});
