/**
 * useDevServer - Stub for dev server management
 *
 * Ported from Flow 0 - originally managed Tauri dev server lifecycle.
 * Stubbed as a no-op for the extension since the extension doesn't manage dev servers.
 */

import { useCallback } from "react";

/**
 * Server status type
 */
export type ServerState = "stopped" | "starting" | "running" | "error";

export interface ServerStatus {
  state: ServerState;
  error?: string;
}

/**
 * Hook for managing dev server lifecycle and listening to log events.
 *
 * STUBBED: This is a no-op in the extension context.
 * The extension inspects existing pages rather than running dev servers.
 */
export function useDevServer() {
  const serverStatus: ServerStatus = { state: "stopped" };
  const serverLogs: unknown[] = [];

  // No-op actions
  const startDevServer = useCallback(async () => {
    console.debug(
      "[useDevServer] Stubbed - extension does not manage dev servers"
    );
  }, []);

  const stopDevServer = useCallback(async () => {
    // No-op
  }, []);

  const clearServerLogs = useCallback(() => {
    // No-op
  }, []);

  const isServerHealthy = useCallback(async (): Promise<boolean> => {
    return false;
  }, []);

  const getServerUrl = useCallback((): string | null => {
    return null;
  }, []);

  const refreshServerStatus = useCallback(async () => {
    // No-op
  }, []);

  return {
    // State
    project: null,
    serverStatus,
    serverLogs,
    isRunning: false,
    isStarting: false,
    isStopped: true,
    hasError: false,

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
 *
 * STUBBED: Never triggers in extension context.
 */
export function useDevServerReady(_onReady: () => void) {
  // No-op - server never becomes ready in extension context
}
