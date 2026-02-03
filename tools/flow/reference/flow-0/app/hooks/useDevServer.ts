import { useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { useAppStore } from "../stores/appStore";
import type { ServerLog } from "../stores/types";

/**
 * Hook for managing dev server lifecycle and listening to log events.
 *
 * Sets up listeners for:
 * - dev-server-log: Real-time log output from the dev server
 *
 * Returns convenience methods and state for the dev server.
 */
export function useDevServer() {
  const {
    project,
    serverStatus,
    serverLogs,
    addServerLog,
    clearServerLogs,
    setServerStatus,
    startDevServer,
    stopDevServer,
    refreshServerStatus,
    checkServerHealth,
  } = useAppStore();

  // Set up log listener
  useEffect(() => {
    const unlisten = listen<ServerLog>("dev-server-log", (event) => {
      addServerLog(event.payload);

      // Update status based on log content
      if (
        event.payload.line.includes("Ready") ||
        event.payload.line.includes("started server") ||
        event.payload.line.includes("Local:")
      ) {
        // Server is ready - refresh status from backend
        refreshServerStatus();
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [addServerLog, refreshServerStatus]);

  // Check if server is healthy (port responding)
  const isServerHealthy = useCallback(async (): Promise<boolean> => {
    if (!project) return false;
    return checkServerHealth(project.devPort);
  }, [project, checkServerHealth]);

  // Get the dev server URL
  const getServerUrl = useCallback((): string | null => {
    if (!project) return null;
    if (serverStatus.state !== "running") return null;
    return `http://localhost:${project.devPort}`;
  }, [project, serverStatus]);

  // Computed state
  const isRunning = serverStatus.state === "running";
  const isStarting = serverStatus.state === "starting";
  const isStopped = serverStatus.state === "stopped";
  const hasError = serverStatus.state === "error";

  return {
    // State
    project,
    serverStatus,
    serverLogs,
    isRunning,
    isStarting,
    isStopped,
    hasError,

    // Actions
    startDevServer,
    stopDevServer,
    clearServerLogs,
    isServerHealthy,
    getServerUrl,
    refreshServerStatus,
  };
}

/**
 * Hook specifically for listening to dev server ready state.
 * Useful for triggering actions when the server becomes available.
 */
export function useDevServerReady(onReady: () => void) {
  const { serverStatus } = useAppStore();

  useEffect(() => {
    if (serverStatus.state === "running") {
      onReady();
    }
  }, [serverStatus.state, onReady]);
}
