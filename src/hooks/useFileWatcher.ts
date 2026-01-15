import { useEffect, useRef } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useAppStore } from "../stores/appStore";
import type { FileEvent } from "../stores/types";

/**
 * Tauri event payload from Rust file watcher.
 * Maps to Rust FileEvent enum with tagged union serialization.
 */
interface TauriFileEvent {
  type: "Modified" | "Created" | "Removed";
  path: string;
}

/**
 * Hook to manage file watcher lifecycle and event subscriptions.
 *
 * - Starts watcher when project is opened
 * - Stops watcher when project is closed
 * - Listens for "file-changed" events from Rust backend
 * - Debounces events (100ms from Rust side)
 * - Routes events to appropriate store actions
 */
export function useFileWatcher(projectPath: string | null) {
  const startWatcher = useAppStore((s) => s.startWatcher);
  const stopWatcher = useAppStore((s) => s.stopWatcher);
  const handleFileEvent = useAppStore((s) => s.handleFileEvent);
  const watcherActive = useAppStore((s) => s.watcherActive);

  // Track if we've started the watcher for this path
  const currentWatchedPath = useRef<string | null>(null);

  // Setup/teardown watcher based on project path
  useEffect(() => {
    if (projectPath && projectPath !== currentWatchedPath.current) {
      // New project - start watcher
      currentWatchedPath.current = projectPath;
      startWatcher(projectPath);
    } else if (!projectPath && currentWatchedPath.current) {
      // Project closed - stop watcher
      currentWatchedPath.current = null;
      stopWatcher();
    }

    return () => {
      // Cleanup on unmount
      if (currentWatchedPath.current) {
        stopWatcher();
        currentWatchedPath.current = null;
      }
    };
  }, [projectPath, startWatcher, stopWatcher]);

  // Subscribe to Tauri file-changed events
  useEffect(() => {
    if (!watcherActive) return;

    let unlisten: UnlistenFn | null = null;

    const setupListener = async () => {
      unlisten = await listen<TauriFileEvent>("file-changed", (event) => {
        const fileEvent: FileEvent = {
          type: event.payload.type,
          path: event.payload.path,
        };
        handleFileEvent(fileEvent);
      });
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [watcherActive, handleFileEvent]);

  return { watcherActive };
}
