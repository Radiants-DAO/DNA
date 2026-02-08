/**
 * useFileWatcher - Stub for file watching
 *
 * Ported from Flow 0 - originally used Tauri's file watcher.
 * Stubbed as a no-op for the extension. Will use sidecar WebSocket later.
 */

import { useEffect, useRef } from "react";

/**
 * File event type
 */
export interface FileEvent {
  type: "Modified" | "Created" | "Removed";
  path: string;
}

/**
 * Hook to manage file watcher lifecycle and event subscriptions.
 *
 * STUBBED: This is a no-op in the extension context.
 * In the future, this will connect to the sidecar's WebSocket for file watching.
 *
 * @param projectPath - The project path to watch (ignored in stub)
 */
export function useFileWatcher(projectPath: string | null) {
  // Track if we've logged the stub warning
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    if (projectPath && !hasLoggedRef.current) {
      console.debug(
        "[useFileWatcher] Stubbed - file watching will use sidecar WebSocket in the future"
      );
      hasLoggedRef.current = true;
    }
  }, [projectPath]);

  return { watcherActive: false };
}
