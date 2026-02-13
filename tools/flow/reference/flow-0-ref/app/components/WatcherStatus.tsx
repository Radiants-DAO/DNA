import { useAppStore } from "../stores/appStore";
import { useEffect, useState } from "react";

/**
 * Shows file watcher status and recent file change notifications.
 * Displays as a subtle indicator in the UI.
 */
export function WatcherStatus() {
  const watcherActive = useAppStore((s) => s.watcherActive);
  const lastFileEvent = useAppStore((s) => s.lastFileEvent);
  const [showNotification, setShowNotification] = useState(false);
  const [recentFile, setRecentFile] = useState<string | null>(null);

  // Show brief notification when files change
  useEffect(() => {
    if (lastFileEvent) {
      // Extract just the filename from full path
      const filename = lastFileEvent.path.split("/").pop() ?? lastFileEvent.path;
      setRecentFile(filename);
      setShowNotification(true);

      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [lastFileEvent]);

  if (!watcherActive) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 flex items-center gap-2">
      {/* Watcher active indicator */}
      <div className="flex items-center gap-1.5 text-xs text-text-muted bg-surface/80 backdrop-blur px-2 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span>Watching</span>
      </div>

      {/* File change notification */}
      {showNotification && recentFile && (
        <div className="text-xs bg-surface/80 backdrop-blur px-2 py-1 rounded-full animate-in fade-in slide-in-from-left-2 duration-200">
          <span className="text-text-muted">Updated:</span>{" "}
          <span className="text-text">{recentFile}</span>
        </div>
      )}
    </div>
  );
}
