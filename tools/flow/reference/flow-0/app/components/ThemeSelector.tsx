import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "./ui/icons";
import { useAppStore } from "../stores/appStore";

/**
 * ThemeSelector - Grouped dropdown for selecting theme + app from workspace
 *
 * Display format: "ThemeName > AppName" when both selected, just "ThemeName" in theme-only mode.
 * Dropdown shows theme section headers with nested apps.
 */
export function ThemeSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const workspace = useAppStore((s) => s.workspace);
  const selectTheme = useAppStore((s) => s.selectTheme);
  const selectApp = useAppStore((s) => s.selectApp);
  const themeDataLoading = useAppStore((s) => s.themeDataLoading);
  const serverStatus = useAppStore((s) => s.serverStatus);

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

  if (!workspace) return null;

  const activeTheme = workspace.themes.find(
    (t) => t.id === workspace.activeThemeId
  );
  const activeApp = workspace.apps.find(
    (a) => a.id === workspace.activeAppId
  );

  const isServerRunning = serverStatus.state === "running";

  // Build display label
  const displayLabel = activeTheme
    ? activeApp
      ? `${activeTheme.name.replace("@rdna/", "")} > ${activeApp.name.replace("@rdna/", "")}`
      : activeTheme.name.replace("@rdna/", "")
    : "Select theme";

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-7 bg-background/50 border border-white/8 rounded-md px-3 text-xs hover:border-white/15 transition-colors"
        aria-label={displayLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {themeDataLoading ? (
          <span className="text-text-muted">Loading theme...</span>
        ) : (
          <>
            {activeApp && (
              <ServerStatusDot
                running={isServerRunning}
                error={serverStatus.state === "error"}
              />
            )}
            <span className="text-text max-w-48 truncate">{displayLabel}</span>
          </>
        )}
        <ChevronDown
          size={12}
          className={`text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-surface border border-white/10 rounded-md shadow-xl z-50 overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            {workspace.themes.length === 0 ? (
              <div className="px-3 py-4 text-xs text-text-muted text-center">
                No themes found in workspace.
              </div>
            ) : (
              workspace.themes.map((theme) => {
                const themeApps = workspace.apps.filter((a) =>
                  a.themeIds.includes(theme.id)
                );
                const isActiveTheme = workspace.activeThemeId === theme.id;
                const themeLabel = theme.name.replace("@rdna/", "").toUpperCase();

                return (
                  <div key={theme.id}>
                    {/* Theme header - clicking selects theme only */}
                    <button
                      onClick={() => {
                        selectTheme(theme.id);
                        if (themeApps.length === 0) setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                        isActiveTheme && !workspace.activeAppId
                          ? "bg-white/8"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <span className="text-[10px] font-bold tracking-wider text-text-muted flex-1">
                        {themeLabel}
                      </span>
                      {isActiveTheme && !workspace.activeAppId && (
                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      )}
                    </button>

                    {/* Nested apps */}
                    {themeApps.length > 0 ? (
                      themeApps.map((app) => {
                        const isActiveApp = workspace.activeAppId === app.id;
                        const appLabel = app.name.replace("@rdna/", "");
                        const appRunning =
                          isActiveApp && isServerRunning;

                        return (
                          <button
                            key={app.id}
                            onClick={() => {
                              selectApp(app.id);
                              setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 pl-6 pr-3 py-2 text-left transition-colors ${
                              isActiveApp
                                ? "bg-white/8"
                                : "hover:bg-white/5"
                            }`}
                          >
                            <ServerStatusDot
                              running={appRunning}
                              error={
                                isActiveApp &&
                                serverStatus.state === "error"
                              }
                            />
                            <span className="text-xs text-text flex-1 truncate">
                              {appLabel}
                            </span>
                            {isActiveApp && (
                              <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="pl-6 pr-3 py-1.5 text-[10px] text-text-muted/60">
                        (theme only)
                      </div>
                    )}

                    {/* Separator between themes */}
                    <div className="border-b border-white/5 mx-2" />
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ServerStatusDot({
  running,
  error,
}: {
  running: boolean;
  error: boolean;
}) {
  return (
    <span
      className={`w-2 h-2 rounded-full flex-shrink-0 ${
        error
          ? "bg-red-500"
          : running
            ? "bg-green-500"
            : "bg-red-500/60"
      }`}
    />
  );
}

export default ThemeSelector;
