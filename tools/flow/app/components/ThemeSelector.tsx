import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../stores/appStore";
import type { DiscoveredTheme, DiscoveredApp } from "../stores/types";

/**
 * ThemeSelector - Dropdown for selecting which theme to connect to
 *
 * Features:
 * - Scans for RadFlow-enabled themes on startup
 * - Shows available themes (grouped apps from radflow.config.json)
 * - Shows legacy projects without manifest
 * - Changes the active theme which updates the preview iframe
 * - Manual refresh button
 */
export function ThemeSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const discoveredThemes = useAppStore((s) => s.discoveredThemes);
  const activeTheme = useAppStore((s) => s.activeTheme);
  const activeApp = useAppStore((s) => s.activeApp);
  const isThemeScanning = useAppStore((s) => s.isThemeScanning);
  const scanForThemes = useAppStore((s) => s.scanForThemes);
  const setActiveTheme = useAppStore((s) => s.setActiveTheme);

  // Scan for themes on mount
  useEffect(() => {
    scanForThemes();
  }, [scanForThemes]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (theme: DiscoveredTheme) => {
    setActiveTheme(theme);
    setIsOpen(false);
  };

  // Check if any app in the theme is online
  const hasOnlineApp = (theme: DiscoveredTheme) =>
    theme.apps.some((app) => app.status === "online");

  // Get app count display
  const getAppCountDisplay = (theme: DiscoveredTheme) => {
    const online = theme.apps.filter((a) => a.status === "online").length;
    const total = theme.apps.length;
    if (total === 1) return null; // Don't show for single-app themes
    return `${online}/${total} online`;
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-7 bg-background/50 border border-white/8 rounded-md px-3 text-xs hover:border-white/15 transition-colors"
        aria-label={
          activeTheme
            ? `Theme: ${activeTheme.displayName}`
            : "Select theme"
        }
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {activeTheme ? (
          <>
            <StatusDot
              status={hasOnlineApp(activeTheme) ? "online" : "offline"}
            />
            <span className="text-text max-w-32 truncate">
              {activeTheme.displayName}
            </span>
            {activeTheme.isLegacy && (
              <span className="text-[10px] text-yellow-500/80 bg-yellow-500/10 px-1 rounded">
                Legacy
              </span>
            )}
            {activeApp && (
              <span className="text-text-muted">:{activeApp.port}</span>
            )}
          </>
        ) : (
          <span className="text-text-muted">
            {isThemeScanning ? "Scanning..." : "No theme"}
          </span>
        )}
        <ChevronIcon isOpen={isOpen} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-surface border border-white/10 rounded-md shadow-xl z-50 overflow-hidden">
          {/* Header with refresh button */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            <span className="text-xs text-text-muted">Available Themes</span>
            <button
              onClick={() => scanForThemes()}
              disabled={isThemeScanning}
              className="p-1 text-text-muted hover:text-text rounded transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshIcon spinning={isThemeScanning} />
            </button>
          </div>

          {/* Theme list */}
          <div className="max-h-72 overflow-y-auto">
            {discoveredThemes.length === 0 ? (
              <div className="px-3 py-4 text-xs text-text-muted text-center">
                {isThemeScanning ? (
                  <span>Scanning ports...</span>
                ) : (
                  <span>
                    No RadFlow-enabled themes found.
                    <br />
                    Start a dev server to connect.
                  </span>
                )}
              </div>
            ) : (
              discoveredThemes.map((theme) => (
                <button
                  key={theme.root || theme.name}
                  onClick={() => handleSelect(theme)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white/5 transition-colors ${
                    activeTheme?.name === theme.name ? "bg-white/5" : ""
                  }`}
                >
                  <StatusDot
                    status={hasOnlineApp(theme) ? "online" : "offline"}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-text truncate">
                        {theme.displayName}
                      </span>
                      {theme.isLegacy && (
                        <span className="text-[9px] text-yellow-500/80 bg-yellow-500/10 px-1 rounded">
                          Legacy
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      {getAppCountDisplay(theme) ||
                        `Port ${theme.apps[0]?.port || "?"}`}
                    </div>
                  </div>
                  {activeTheme?.name === theme.name && <CheckIcon />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components

function StatusDot({ status }: { status: DiscoveredApp["status"] | "online" | "offline" }) {
  return (
    <span
      className={`w-2 h-2 rounded-full flex-shrink-0 ${
        status === "online"
          ? "bg-green-500"
          : status === "checking"
            ? "bg-yellow-500 animate-pulse"
            : "bg-gray-500"
      }`}
    />
  );
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={`w-3 h-3 text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 ${spinning ? "animate-spin" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default ThemeSelector;
