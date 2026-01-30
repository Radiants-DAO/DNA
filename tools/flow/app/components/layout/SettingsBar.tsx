import { useState, useEffect, useRef, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAppStore } from "../../stores/appStore";
import {
  Settings,
  Zap,
  X,
  Minus,
  Maximize2,
  RotateCcw,
  Search,
  ChevronDown,
} from "../ui/icons";
import { ThemeSelector } from "../ThemeSelector";

/**
 * SettingsBar - Compact floating bar in top-left corner
 *
 * Main bar contains:
 * - Custom window controls (close/minimize/maximize)
 * - Connection status indicator (small dot)
 * - Search input (inline)
 * - Dogfood mode toggle (dev only)
 * - Settings gear icon (opens settings dropdown)
 *
 * Settings dropdown contains:
 * - Component Canvas section: Theme path input, scan, show/hide toggle
 * - Viewport section: Breakpoint selector
 * - Toolbar section: Reset toolbar positions
 *
 * Uses custom window controls instead of system traffic lights for consistent
 * cross-platform appearance. Window can be dragged via data-tauri-drag-region.
 */

// ============================================================================
// Dogfood Toggle Component
// ============================================================================

function DogfoodToggle() {
  const dogfoodMode = useAppStore((s) => s.dogfoodMode);
  const setDogfoodMode = useAppStore((s) => s.setDogfoodMode);

  // Hide in production builds
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <button
      onClick={() => setDogfoodMode(!dogfoodMode)}
      className={`
        flex items-center gap-1 px-1.5 py-1 rounded-md text-xs transition-colors
        ${dogfoodMode
          ? "bg-[#FCC383]/20 text-[#FCC383] border border-[#FCC383]/30"
          : "bg-background/50 text-text-muted hover:text-text border border-transparent"
        }
      `}
      title="Dogfood Mode: When enabled, Comment Mode works on RadFlow's own UI"
    >
      <Zap size={12} />
      {dogfoodMode && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#FCC383] animate-pulse" />
      )}
    </button>
  );
}

// ============================================================================
// Window Controls Component (custom traffic lights)
// ============================================================================

function WindowControls() {
  const appWindow = getCurrentWindow();

  const handleClose = () => appWindow.close();
  const handleMinimize = () => appWindow.minimize();
  const handleMaximize = () => appWindow.toggleMaximize();

  return (
    <div className="flex items-center gap-2 mr-2">
      {/* Close - Red */}
      <button
        onClick={handleClose}
        className="group w-3 h-3 rounded-full bg-[#FF5F57] hover:bg-[#FF5F57]/80 transition-colors flex items-center justify-center"
        title="Close"
        aria-label="Close window"
      >
        <X size={8} className="text-[#4A0002] opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* Minimize - Yellow */}
      <button
        onClick={handleMinimize}
        className="group w-3 h-3 rounded-full bg-[#FEBC2E] hover:bg-[#FEBC2E]/80 transition-colors flex items-center justify-center"
        title="Minimize"
        aria-label="Minimize window"
      >
        <Minus size={8} className="text-[#995700] opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* Maximize - Green */}
      <button
        onClick={handleMaximize}
        className="group w-3 h-3 rounded-full bg-[#28C840] hover:bg-[#28C840]/80 transition-colors flex items-center justify-center"
        title="Maximize"
        aria-label="Maximize window"
      >
        <Maximize2 size={7} className="text-[#006500] opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  );
}

// ============================================================================
// Connection Status Indicator (compact - just dot)
// ============================================================================

function ConnectionStatusDot() {
  const bridgeStatus = useAppStore((s) => s.bridgeStatus);

  return (
    <div
      className={`w-2 h-2 rounded-full ${
        bridgeStatus === "connected"
          ? "bg-[#CEF5CA]"
          : bridgeStatus === "connecting"
            ? "bg-[#FCE184] animate-pulse"
            : bridgeStatus === "error"
              ? "bg-[#FF6B63]"
              : "bg-content-muted"
      }`}
      title={`Bridge: ${bridgeStatus}`}
    />
  );
}

// ============================================================================
// Breakpoint Selector Component
// ============================================================================

/**
 * BreakpointSelector - Responsive viewport selector
 *
 * Features:
 * - Breakpoint buttons from store (defaults to Tailwind breakpoints)
 * - Full width / 100% option
 * - Custom width input
 * - Keyboard shortcuts: Cmd+0 (full), Cmd+1-5 (breakpoints)
 * - Active breakpoint visual indicator
 * - Width shown on hover
 */
function BreakpointSelector() {
  const breakpoints = useAppStore((s) => s.breakpoints);
  const activeBreakpoint = useAppStore((s) => s.activeBreakpoint);
  const customWidth = useAppStore((s) => s.customWidth);
  const viewportWidth = useAppStore((s) => s.viewportWidth);
  const setActiveBreakpoint = useAppStore((s) => s.setActiveBreakpoint);
  const setCustomWidth = useAppStore((s) => s.setCustomWidth);
  const selectBreakpointByIndex = useAppStore((s) => s.selectBreakpointByIndex);

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputValue, setCustomInputValue] = useState("");
  const customInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts: Cmd+0-5 for breakpoints
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Only handle Cmd/Ctrl + number keys
      if (!(event.metaKey || event.ctrlKey)) return;

      // Don't trigger when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = event.key;
      // Cmd+0 = full width, Cmd+1-5 = breakpoints
      if (key >= "0" && key <= "5") {
        event.preventDefault();
        selectBreakpointByIndex(parseInt(key, 10));
      }
    },
    [selectBreakpointByIndex]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Focus custom input when shown
  useEffect(() => {
    if (showCustomInput && customInputRef.current) {
      customInputRef.current.focus();
      customInputRef.current.select();
    }
  }, [showCustomInput]);

  const handleCustomSubmit = () => {
    const width = parseInt(customInputValue, 10);
    if (!isNaN(width) && width >= 320 && width <= 3840) {
      setCustomWidth(width);
    }
    setShowCustomInput(false);
    setCustomInputValue("");
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCustomSubmit();
    } else if (e.key === "Escape") {
      setShowCustomInput(false);
      setCustomInputValue("");
    }
  };

  const isFullWidth = activeBreakpoint === null && customWidth === null;

  return (
    <div className="flex items-center gap-1 bg-background/50 rounded-md p-0.5">
      {/* Full width button */}
      <button
        onClick={() => setActiveBreakpoint(null)}
        className={`px-2 py-1 text-xs rounded-md transition-colors ${
          isFullWidth
            ? "bg-surface text-text"
            : "text-text-muted hover:text-text"
        }`}
        title="Full width (Cmd+0)"
      >
        100%
      </button>

      {/* Breakpoint buttons */}
      {breakpoints.map((bp, index) => {
        const isActive = activeBreakpoint === bp.name;
        return (
          <button
            key={bp.name}
            onClick={() => setActiveBreakpoint(bp.name)}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              isActive
                ? "bg-surface text-text"
                : "text-text-muted hover:text-text"
            }`}
            title={`${bp.width}px (Cmd+${index + 1})`}
          >
            {bp.name}
          </button>
        );
      })}

      {/* Divider */}
      <div className="w-px h-4 bg-white/10 mx-0.5" />

      {/* Custom width input toggle/display */}
      {showCustomInput ? (
        <input
          ref={customInputRef}
          type="number"
          min="320"
          max="3840"
          placeholder="Width"
          value={customInputValue}
          onChange={(e) => setCustomInputValue(e.target.value)}
          onKeyDown={handleCustomKeyDown}
          onBlur={handleCustomSubmit}
          className="w-16 h-6 bg-background border border-white/10 rounded px-1 text-xs text-text text-center focus:outline-none focus:border-primary/50"
        />
      ) : (
        <button
          onClick={() => {
            setCustomInputValue(viewportWidth?.toString() || "");
            setShowCustomInput(true);
          }}
          className={`px-2 py-1 text-xs rounded-md transition-colors ${
            customWidth !== null
              ? "bg-surface text-text"
              : "text-text-muted hover:text-text"
          }`}
          title="Enter custom width"
        >
          {customWidth !== null ? `${customWidth}px` : "Custom"}
        </button>
      )}

      {/* Current width indicator */}
      {viewportWidth !== null && (
        <span className="text-[10px] text-text-muted/70 ml-1 font-mono">
          {viewportWidth}px
        </span>
      )}
    </div>
  );
}

// ============================================================================
// Settings Dropdown (contains all settings)
// ============================================================================

interface SettingsDropdownProps {
  previewBg: "dark" | "light";
  setPreviewBg: (bg: "dark" | "light") => void;
}

function SettingsDropdown({ previewBg, setPreviewBg }: SettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleResetPositions = () => {
    // Clear all position keys for floating bars
    localStorage.removeItem('radflow-mode-bar-position');
    localStorage.removeItem('radflow-left-panel-position');
    localStorage.removeItem('radflow-right-panel-position');
    localStorage.removeItem('radflow-right-panel-position-v2');
    localStorage.removeItem('radflow-title-bar-position');
    localStorage.removeItem('radflow-preview-status-bar-position');
    localStorage.removeItem('radflow-mode-bar-drawer-position');
    localStorage.removeItem('radflow-settings-bar-position');

    // Reload to apply defaults
    window.location.reload();
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150
          ${isOpen
            ? "bg-accent text-white"
            : "text-text-muted hover:text-text hover:bg-white/10"
          }
        `}
        title="Settings"
      >
        <Settings size={16} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[280px] w-80 bg-surface border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* ===== VIEWPORT SECTION ===== */}
          <div className="p-3 border-b border-white/10">
            <div className="text-[10px] uppercase tracking-wider text-text-muted mb-2.5 pl-0.5">Viewport</div>

            {/* Breakpoint Selector */}
            <div className="overflow-x-auto">
              <BreakpointSelector />
            </div>
          </div>

          {/* ===== TOOLBAR SECTION ===== */}
          <div className="p-3">
            <div className="text-[10px] uppercase tracking-wider text-text-muted mb-2.5 pl-0.5">Toolbar</div>

            <button
              onClick={handleResetPositions}
              className="w-full flex items-center gap-2.5 text-left px-2.5 py-2 text-xs text-text hover:bg-white/5 rounded-md transition-colors"
            >
              <RotateCcw size={12} className="text-text-muted flex-shrink-0" />
              <span>Reset Toolbar Positions</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Page Navigation Dropdown (visible when dev server is running)
// ============================================================================

function PageNavDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const targetUrl = useAppStore((s) => s.targetUrl);
  const serverStatus = useAppStore((s) => s.serverStatus);
  const setTargetUrl = useAppStore((s) => s.setTargetUrl);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  if (serverStatus.state !== "running" || !targetUrl) return null;

  // Extract base URL and current path
  let baseUrl = "";
  let currentPath = "/";
  try {
    const url = new URL(targetUrl);
    baseUrl = url.origin;
    currentPath = url.pathname;
  } catch {
    return null;
  }

  // Common routes for Next.js / React apps
  const commonRoutes = ["/", "/about", "/components", "/docs"];

  const navigateTo = (path: string) => {
    setTargetUrl(`${baseUrl}${path}`);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs hover:border-white/15 transition-colors text-text-muted hover:text-text"
        title="Navigate to page"
      >
        <span className="font-mono text-[10px] max-w-20 truncate">{currentPath}</span>
        <ChevronDown size={10} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-surface border border-white/10 rounded-md shadow-xl z-50 overflow-hidden">
          <div className="max-h-48 overflow-y-auto py-1">
            {commonRoutes.map((route) => (
              <button
                key={route}
                onClick={() => navigateTo(route)}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                  currentPath === route ? "bg-white/8 text-text" : "text-text-muted hover:bg-white/5 hover:text-text"
                }`}
              >
                <span className="font-mono">{route}</span>
              </button>
            ))}
            {/* Custom URL input */}
            <div className="border-t border-white/10 p-2 mt-1">
              <input
                type="text"
                placeholder="/custom-path"
                className="w-full h-6 bg-background/50 border border-white/10 rounded px-2 text-[10px] font-mono text-text focus:outline-none focus:border-primary/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = (e.target as HTMLInputElement).value;
                    if (val.startsWith("/")) navigateTo(val);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main SettingsBar Component
// ============================================================================

interface SettingsBarProps {
  previewBg?: "dark" | "light";
  setPreviewBg?: (bg: "dark" | "light") => void;
}

export function SettingsBar({ previewBg = "dark", setPreviewBg }: SettingsBarProps) {
  // Local state for previewBg if not provided from parent
  const [localPreviewBg, setLocalPreviewBg] = useState<"dark" | "light">("dark");
  const effectivePreviewBg = previewBg;
  const effectiveSetPreviewBg = setPreviewBg || setLocalPreviewBg;

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div
      className="fixed top-2 left-2 z-30"
      data-devflow-id="floating-settings-bar"
    >
      <div
        data-tauri-drag-region
        className="flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1.5 shadow-lg border border-white/10 select-none"
      >
        {/* Custom Window Controls (replacing macOS traffic lights) */}
        <WindowControls />

        {/* Divider after window controls */}
        <div className="w-px h-5 bg-white/10" />

        {/* Connection Status (compact dot only) */}
        <ConnectionStatusDot />

        {/* Divider */}
        <div className="w-px h-5 bg-white/10" />

        {/* Theme + App Selector */}
        <ThemeSelector />

        {/* Divider */}
        <div className="w-px h-5 bg-white/10" />

        {/* Page Nav (when dev server running) */}
        <PageNavDropdown />

        {/* Divider */}
        <div className="w-px h-5 bg-white/10" />

        {/* Search Input */}
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted/50 pointer-events-none" />
          <input
            type="text"
            placeholder="Search (Cmd+F)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search components and layers"
            className="w-32 h-7 bg-surface/50 border border-white/8 rounded-md pl-7 pr-2 text-xs text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50"
          />
        </div>

        {/* Dogfood Mode Toggle (dev only) */}
        <DogfoodToggle />

        {/* Settings Dropdown (contains theme, project, URL, background, refresh) */}
        <SettingsDropdown previewBg={effectivePreviewBg} setPreviewBg={effectiveSetPreviewBg} />
      </div>
    </div>
  );
}

export default SettingsBar;
