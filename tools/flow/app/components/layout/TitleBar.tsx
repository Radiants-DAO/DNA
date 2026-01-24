import { useState, useEffect, useCallback, useRef } from "react";
import { useAppStore } from "../../stores/appStore";
import { UndoRedoControls } from "../UndoRedoControls";
import { TargetProjectSelector } from "../TargetProjectSelector";
import { ThemeSelector } from "../ThemeSelector";

/**
 * DogfoodToggle - Toggle switch for Dogfood Mode
 * Only visible in development mode (hidden in production via import.meta.env.PROD)
 * When enabled, Comment Mode works on RadFlow's own UI
 */
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
        flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors
        ${dogfoodMode
          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
          : "bg-background/50 text-text-muted hover:text-text border border-transparent"
        }
      `}
      title="Dogfood Mode: When enabled, Comment Mode works on RadFlow's own UI"
    >
      {/* Dog bone icon */}
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6.5 4.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM22.5 4.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM6.5 19.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM22.5 19.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM4 7v10M20 7v10M4 12h16"
        />
      </svg>
      <span className="font-medium">Dogfood</span>
      {dogfoodMode && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      )}
    </button>
  );
}

/**
 * TitleBar component - Custom title bar for frameless window
 * Provides drag region and breakpoint/mode controls
 * Traffic lights are handled by macOS with titleBarStyle: "Overlay"
 *
 * Note: Mode toggle removed per fn-9 - clipboard mode is now the only mode
 */
export function TitleBar() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div
      data-tauri-drag-region
      data-devflow-id="title-bar"
      className="h-10 bg-surface/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between select-none"
    >
      {/* Left section - Traffic light spacer + Theme/Project selectors + Search */}
      <div className="flex items-center gap-3 pl-20">
        <ThemeSelector />
        <TargetProjectSelector />
        <div className="relative">
          <input
            type="text"
            placeholder="Search (Cmd+F)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search components and layers"
            className="w-48 h-7 bg-background/50 border border-white/8 rounded-md px-3 text-xs text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Center - Breakpoint selector */}
      <div className="flex items-center gap-2">
        <BreakpointSelector />
      </div>

      {/* Right section - Dogfood toggle + Undo/Redo + Clipboard mode indicator */}
      <div className="flex items-center gap-3 pr-4">
        <DogfoodToggle />
        <UndoRedoControls />
        <div className="flex items-center gap-1 bg-background/50 rounded-md px-3 py-1">
          <svg className="w-3 h-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          <span className="text-xs text-text-muted">Clipboard</span>
        </div>
      </div>
    </div>
  );
}

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

export default TitleBar;
