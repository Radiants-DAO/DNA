/**
 * SpatialControls - Directory selector and settings for spatial canvas
 *
 * Ported from Flow 0. Backend calls (Tauri file dialog and filesystem) are stubbed.
 * In the extension, directory selection would require MCP sidecar integration.
 */

import { useState, useCallback } from "react";
import { useAppStore } from "../../stores/appStore";
import type { FileNode } from "../../types/spatial";
import {
  FolderIcon,
  XIcon,
  ChevronDown,
  SettingsIcon,
  RefreshIcon,
} from "./icons";

const DEFAULT_AUTO_COLLAPSE = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "__pycache__",
  "target",
];

interface SpatialControlsProps {
  onScanComplete?: () => void;
}

export function SpatialControls({
  onScanComplete,
}: SpatialControlsProps): React.ReactElement {
  const spatialRootPath = useAppStore((s) => s.spatialRootPath);
  const setSpatialRootPath = useAppStore((s) => s.setSpatialRootPath);
  const setSpatialFileTree = useAppStore((s) => s.setSpatialFileTree);
  const spatialShowHiddenFiles = useAppStore((s) => s.spatialShowHiddenFiles);
  const setSpatialShowHiddenFiles = useAppStore(
    (s) => s.setSpatialShowHiddenFiles
  );

  const [inputValue, setInputValue] = useState(spatialRootPath ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoCollapseOpen, setAutoCollapseOpen] = useState(false);
  const [autoCollapsePatterns, setAutoCollapsePatterns] =
    useState(DEFAULT_AUTO_COLLAPSE);
  const [newPattern, setNewPattern] = useState("");

  // STUB: In extension, this would use MCP sidecar to scan directory
  const loadDirectory = useCallback(
    async (path: string) => {
      if (!path) return;

      setIsLoading(true);
      setError(null);

      try {
        // STUB: Cannot access filesystem directly in extension
        // This would need to go through MCP sidecar
        console.warn("[SpatialControls] Filesystem access requires MCP sidecar");

        // Create a mock root node for demonstration
        const rootNode: FileNode = {
          id: path,
          name: path.split("/").pop() || path,
          path: path,
          nodeType: "Directory",
          extension: null,
          size: 0,
          sizeFormatted: "0 B",
          totalSize: 0,
          childCount: 0,
          modified: new Date().toISOString(),
          isHidden: false,
          isReadable: true,
          isAutoCollapsed: false,
          children: [],
        };

        setSpatialFileTree(rootNode);
        setSpatialRootPath(path);
        setError("Note: Filesystem access requires MCP sidecar connection");
        onScanComplete?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load directory");
      } finally {
        setIsLoading(false);
      }
    },
    [
      setSpatialFileTree,
      setSpatialRootPath,
      onScanComplete,
    ]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      loadDirectory(inputValue);
    },
    [inputValue, loadDirectory]
  );

  // STUB: File dialog not available in extension
  const handleBrowse = useCallback(async () => {
    setError("File browser not available in extension - enter path manually");
  }, []);

  const handleRefresh = useCallback(() => {
    if (spatialRootPath) {
      loadDirectory(spatialRootPath);
    }
  }, [spatialRootPath, loadDirectory]);

  const handleClear = useCallback(() => {
    setInputValue("");
    setSpatialFileTree(null);
    setSpatialRootPath(null);
    setError(null);
  }, [setSpatialFileTree, setSpatialRootPath]);

  const addPattern = useCallback(() => {
    if (newPattern && !autoCollapsePatterns.includes(newPattern)) {
      setAutoCollapsePatterns([...autoCollapsePatterns, newPattern]);
      setNewPattern("");
    }
  }, [newPattern, autoCollapsePatterns]);

  const removePattern = useCallback(
    (pattern: string) => {
      setAutoCollapsePatterns(autoCollapsePatterns.filter((p) => p !== pattern));
    },
    [autoCollapsePatterns]
  );

  const resetDefaults = useCallback(() => {
    setAutoCollapsePatterns(DEFAULT_AUTO_COLLAPSE);
  }, []);

  return (
    <div className="flex flex-col gap-3 p-3 bg-[#1a1a1a] rounded-lg border border-[rgba(255,255,255,0.08)]">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter directory path..."
          aria-label="Directory path"
          className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded text-sm text-white placeholder:text-[rgba(255,255,255,0.3)]"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={handleBrowse}
          aria-label="Browse for folder"
          className="px-3 py-2 bg-[#252525] border border-[rgba(255,255,255,0.08)] rounded text-sm text-white hover:bg-[#303030] transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          <FolderIcon size={14} />
        </button>
        {spatialRootPath && (
          <button
            type="button"
            onClick={handleRefresh}
            aria-label="Refresh"
            className="px-2 text-[rgba(255,255,255,0.5)] hover:text-white transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            <RefreshIcon size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
        )}
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear path"
            className="px-2 text-[rgba(255,255,255,0.5)] hover:text-white transition-colors"
          >
            <XIcon size={14} />
          </button>
        )}
      </form>

      {error && (
        <p role="alert" className="text-sm text-yellow-400">
          {error}
        </p>
      )}

      <label
        htmlFor="spatial-show-hidden"
        className="flex items-center gap-2 text-sm text-[rgba(255,255,255,0.5)] cursor-pointer select-none"
      >
        <input
          id="spatial-show-hidden"
          type="checkbox"
          checked={spatialShowHiddenFiles}
          onChange={(e) => setSpatialShowHiddenFiles(e.target.checked)}
          className="rounded border-[rgba(255,255,255,0.08)] bg-[#0a0a0a]"
        />
        Show hidden files
      </label>

      <div>
        <button
          onClick={() => setAutoCollapseOpen(!autoCollapseOpen)}
          aria-expanded={autoCollapseOpen}
          className="flex items-center gap-2 text-sm text-[rgba(255,255,255,0.5)] hover:text-white transition-colors"
        >
          <SettingsIcon size={14} />
          Auto-collapse settings
          <ChevronDown
            size={14}
            className={`transition-transform ${autoCollapseOpen ? "rotate-180" : ""}`}
          />
        </button>

        {autoCollapseOpen && (
          <div className="mt-2 p-2 bg-[#0a0a0a] rounded border border-[rgba(255,255,255,0.08)]">
            <div className="flex flex-wrap gap-1 mb-2">
              {autoCollapsePatterns.map((pattern) => (
                <span
                  key={pattern}
                  className="flex items-center gap-1 px-2 py-1 bg-[#1a1a1a] rounded text-xs text-white"
                >
                  {pattern}
                  <button
                    onClick={() => removePattern(pattern)}
                    aria-label={`Remove ${pattern}`}
                    className="hover:text-red-400 transition-colors"
                  >
                    <XIcon size={12} />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
                placeholder="Add pattern..."
                className="flex-1 px-2 py-1 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded text-xs text-white placeholder:text-[rgba(255,255,255,0.3)]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPattern();
                  }
                }}
              />
              <button
                onClick={addPattern}
                className="px-2 py-1 bg-[#3b82f6] text-white rounded text-xs hover:bg-[#2563eb] transition-colors"
              >
                Add
              </button>
            </div>

            <button
              onClick={resetDefaults}
              className="mt-2 text-xs text-[rgba(255,255,255,0.5)] hover:text-white transition-colors"
            >
              Reset to defaults
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SpatialControls;
