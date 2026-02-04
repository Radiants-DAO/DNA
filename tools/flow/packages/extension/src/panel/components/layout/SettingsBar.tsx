/**
 * SettingsBar - Compact floating bar in top-left corner
 *
 * Simplified version for Chrome extension:
 * - Removes Tauri window controls (not applicable in DevTools)
 * - Keeps connection status, search, and settings
 *
 * Uses semantic token classes for theming.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useAppStore } from "../../stores/appStore";

interface SettingsBarProps {
  previewBg?: "dark" | "light";
  setPreviewBg?: (bg: "dark" | "light") => void;
}

export function SettingsBar({
  previewBg = "dark",
  setPreviewBg,
}: SettingsBarProps) {
  const [localPreviewBg, setLocalPreviewBg] = useState<"dark" | "light">("dark");
  const effectiveSetPreviewBg = setPreviewBg || setLocalPreviewBg;

  const [searchQuery, setSearchQuery] = useState("");

  const editorMode = useAppStore((s) => s.editorMode);
  const setEditorMode = useAppStore((s) => s.setEditorMode);

  return (
    <div className="fixed top-2 left-2 z-30" data-devflow-id="floating-settings-bar">
      <div className="flex items-center gap-2 bg-neutral-900/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-neutral-700/50">
        {/* Connection Status */}
        <ConnectionStatus />

        <Divider />

        {/* Mode Selector */}
        <ModeSelector
          currentMode={editorMode}
          onModeChange={setEditorMode}
        />

        <Divider />

        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-500" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-28 h-7 bg-neutral-800/50 border border-neutral-700/50 rounded-md pl-7 pr-2 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {/* Background Toggle */}
        <button
          onClick={() => effectiveSetPreviewBg(previewBg === "dark" ? "light" : "dark")}
          className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50 transition-colors"
          title={`Switch to ${previewBg === "dark" ? "light" : "dark"} background`}
        >
          {previewBg === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Settings Dropdown */}
        <SettingsDropdown />
      </div>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-neutral-700/50" />;
}

function ConnectionStatus() {
  // In extension context, we could track content script or sidecar connection
  // For now, show as connected when panel is active
  const status = "connected";

  const statusColors = {
    connected: "bg-green-400",
    connecting: "bg-yellow-400 animate-pulse",
    error: "bg-red-400",
    disconnected: "bg-neutral-500",
  };

  return (
    <div
      className={`w-2 h-2 rounded-full ${statusColors[status]}`}
      title={`Status: ${status}`}
    />
  );
}

interface ModeSelectorProps {
  currentMode: string;
  onModeChange: (mode: "inspector" | "designer" | "developer") => void;
}

function ModeSelector({ currentMode, onModeChange }: ModeSelectorProps) {
  const modes = [
    { id: "inspector" as const, label: "Inspect", shortcut: "I" },
    { id: "designer" as const, label: "Design", shortcut: "D" },
    { id: "developer" as const, label: "Dev", shortcut: "V" },
  ];

  return (
    <div className="flex items-center gap-1 bg-neutral-800/50 rounded-md p-0.5">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            currentMode === mode.id
              ? "bg-blue-600 text-white"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
          title={`${mode.label} mode (${mode.shortcut})`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}

function SettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
          isOpen
            ? "bg-blue-600 text-white"
            : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50"
        }`}
        title="Settings"
      >
        <SettingsIcon />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b border-neutral-700">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2">
              Panel Settings
            </div>
            <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
              <input type="checkbox" className="rounded" />
              Show element tooltips
            </label>
          </div>

          <div className="p-3">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2">
              Keyboard Shortcuts
            </div>
            <div className="space-y-1 text-xs text-neutral-400">
              <div className="flex justify-between">
                <span>Inspector</span>
                <kbd className="px-1.5 py-0.5 bg-neutral-700 rounded text-[10px]">I</kbd>
              </div>
              <div className="flex justify-between">
                <span>Designer</span>
                <kbd className="px-1.5 py-0.5 bg-neutral-700 rounded text-[10px]">D</kbd>
              </div>
              <div className="flex justify-between">
                <span>Developer</span>
                <kbd className="px-1.5 py-0.5 bg-neutral-700 rounded text-[10px]">V</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icon components
function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default SettingsBar;
