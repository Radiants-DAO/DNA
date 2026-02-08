import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "./ui/icons";
import { DogfoodBoundary } from './ui/DogfoodBoundary';

/**
 * ThemeSelector - Dropdown for selecting theme/mode
 *
 * Simplified version for Chrome extension - shows available themes
 * detected on the page or configurable presets.
 */

interface Theme {
  id: string;
  name: string;
  description?: string;
}

interface ThemeSelectorProps {
  /** Currently selected theme ID */
  selectedThemeId?: string | null;
  /** Available themes */
  themes?: Theme[];
  /** Called when theme is selected */
  onSelectTheme?: (themeId: string) => void;
  /** Whether data is loading */
  loading?: boolean;
}

export function ThemeSelector({
  selectedThemeId,
  themes = [],
  onSelectTheme,
  loading = false,
}: ThemeSelectorProps) {
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

  const activeTheme = themes.find((t) => t.id === selectedThemeId);

  // Build display label
  const displayLabel = activeTheme
    ? activeTheme.name.replace("@rdna/", "")
    : "Select theme";

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-7 bg-neutral-800/50 border border-neutral-700/50 rounded-md px-3 text-xs hover:border-neutral-600 transition-colors"
        aria-label={displayLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {loading ? (
          <span className="text-neutral-400">Loading...</span>
        ) : (
          <span className="text-neutral-200 max-w-48 truncate">{displayLabel}</span>
        )}
        <ChevronDown
          size={12}
          className={`text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-neutral-800 border border-neutral-700/50 rounded-md shadow-xl z-50 overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            {themes.length === 0 ? (
              <div className="px-3 py-4 text-xs text-neutral-400 text-center">
                No themes found.
              </div>
            ) : (
              themes.map((theme) => {
                const isActive = selectedThemeId === theme.id;
                const themeLabel = theme.name.replace("@rdna/", "").toUpperCase();

                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      onSelectTheme?.(theme.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                      isActive
                        ? "bg-neutral-700/50"
                        : "hover:bg-neutral-700/30"
                    }`}
                  >
                    <span className="text-xs text-neutral-200 flex-1">
                      {themeLabel}
                    </span>
                    {isActive && (
                      <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    )}
                  </button>
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
