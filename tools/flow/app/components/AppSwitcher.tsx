import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../stores/appStore";
import type { DiscoveredApp } from "../stores/types";

interface AppSwitcherProps {
  className?: string;
}

/**
 * AppSwitcher - Dropdown for switching between apps within a theme
 *
 * Features:
 * - Only renders for multi-app themes (hidden for single-app or legacy)
 * - Shows all apps from the theme manifest
 * - Displays online/offline status
 * - Updates viewport when app is selected
 */
export function AppSwitcher({ className }: AppSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeTheme = useAppStore((s) => s.activeTheme);
  const activeApp = useAppStore((s) => s.activeApp);
  const setActiveApp = useAppStore((s) => s.setActiveApp);
  const checkAppHealth = useAppStore((s) => s.checkAppHealth);

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

  // Don't render if no theme, single app, or legacy
  if (!activeTheme || activeTheme.apps.length <= 1 || activeTheme.isLegacy) {
    return null;
  }

  const handleSelectApp = async (app: DiscoveredApp) => {
    setActiveApp(app);
    setIsOpen(false);
    // Optionally refresh health status
    if (app.status !== "online") {
      await checkAppHealth(app);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className || ""}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-7 bg-background/50 border border-white/8 rounded-md px-2.5 text-xs hover:border-white/15 transition-colors"
        aria-label={activeApp ? `App: ${activeApp.displayName}` : "Select app"}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {activeApp ? (
          <>
            <StatusDot status={activeApp.status} />
            <span className="text-text max-w-24 truncate">
              {activeApp.displayName}
            </span>
            <span className="text-text-muted">:{activeApp.port}</span>
          </>
        ) : (
          <span className="text-text-muted">Select app</span>
        )}
        <ChevronIcon isOpen={isOpen} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-surface border border-white/10 rounded-md shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 border-b border-white/10">
            <span className="text-xs text-text-muted">
              Apps in {activeTheme.displayName}
            </span>
          </div>

          {/* App list */}
          <div className="max-h-60 overflow-y-auto">
            {activeTheme.apps.map((app) => (
              <button
                key={app.port}
                onClick={() => handleSelectApp(app)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors ${
                  activeApp?.port === app.port ? "bg-white/5" : ""
                }`}
              >
                <StatusDot status={app.status} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-text truncate">
                    {app.displayName}
                  </div>
                  <div className="text-[10px] text-text-muted">
                    localhost:{app.port}
                    {app.bridgeVersion && app.status === "online" && (
                      <span className="ml-1 text-text-muted/60">
                        v{app.bridgeVersion}
                      </span>
                    )}
                  </div>
                </div>
                {activeApp?.port === app.port && <CheckIcon />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components

function StatusDot({ status }: { status: DiscoveredApp["status"] }) {
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

function CheckIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 text-primary flex-shrink-0"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default AppSwitcher;
