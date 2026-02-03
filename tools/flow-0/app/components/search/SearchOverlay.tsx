import { useRef, useEffect, useCallback } from "react";
import { useSearch, type SearchScope, type SearchResult } from "../../hooks/useSearch";

/**
 * SearchOverlay - Unified search interface accessible via Cmd+F
 *
 * Features:
 * - Cmd+F opens search overlay
 * - Scope filters: Elements (Cmd+1), Components (Cmd+2), Layers (Cmd+3), Assets (Cmd+4)
 * - Fuzzy search matching with real-time filtering
 * - Keyboard navigation (Up/Down arrows, Enter to select, Escape to close)
 * - Recent searches in localStorage
 * - Result count indicator
 */

// ============================================================================
// Icons
// ============================================================================

const Icons = {
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  close: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  element: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  component: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
      <line x1="12" y1="22" x2="12" y2="15.5" />
      <polyline points="22 8.5 12 15.5 2 8.5" />
    </svg>
  ),
  layer: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  asset: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  clock: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  enter: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 10 4 15 9 20" />
      <path d="M20 4v7a4 4 0 0 1-4 4H4" />
    </svg>
  ),
};

// ============================================================================
// Scope Button Component
// ============================================================================

interface ScopeButtonProps {
  scope: SearchScope;
  label: string;
  shortcut: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

function ScopeButton({ label, shortcut, icon, active, onClick }: ScopeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
        ${active
          ? "bg-primary/20 text-primary"
          : "text-text-muted hover:text-text hover:bg-white/5"
        }
      `}
      title={`${label} (${shortcut})`}
    >
      {icon}
      <span>{label}</span>
      <span className="ml-1 text-[10px] text-text-muted/60">{shortcut}</span>
    </button>
  );
}

// ============================================================================
// Result Item Component
// ============================================================================

interface ResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

function ResultItem({ result, isSelected, onClick, onMouseEnter }: ResultItemProps) {
  const getIcon = () => {
    switch (result.type) {
      case "elements":
        return Icons.element;
      case "components":
        return Icons.component;
      case "layers":
        return Icons.layer;
      case "assets":
        return Icons.asset;
    }
  };

  const getTypeColor = () => {
    switch (result.type) {
      case "components":
        return "text-success";
      default:
        return "text-text-muted";
    }
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`
        w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
        ${isSelected ? "bg-primary/10" : "hover:bg-white/5"}
      `}
    >
      {/* Icon */}
      <span className={getTypeColor()}>{getIcon()}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-text truncate">{result.label}</div>
        {result.sublabel && (
          <div className="text-xs text-text-muted truncate">{result.sublabel}</div>
        )}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="flex items-center gap-1 text-text-muted">
          <span className="text-[10px]">Enter</span>
          {Icons.enter}
        </div>
      )}
    </button>
  );
}

// ============================================================================
// Search Overlay Component
// ============================================================================

interface SearchOverlayProps {
  searchState: ReturnType<typeof useSearch>;
  onSelectResult?: (result: SearchResult) => void;
}

export function SearchOverlay({ searchState, onSelectResult }: SearchOverlayProps) {
  const {
    isOpen,
    query,
    setQuery,
    scope,
    setScope,
    results,
    selectedIndex,
    setSelectedIndex,
    selectedResult,
    recentSearches,
    close,
    selectNext,
    selectPrevious,
    addToRecent,
    clearRecentSearches,
  } = searchState;

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          selectNext();
          break;
        case "ArrowUp":
          e.preventDefault();
          selectPrevious();
          break;
        case "Enter":
          e.preventDefault();
          if (selectedResult) {
            addToRecent(query);
            onSelectResult?.(selectedResult);
            close();
          }
          break;
        case "Escape":
          e.preventDefault();
          close();
          break;
      }
    },
    [selectNext, selectPrevious, selectedResult, query, addToRecent, onSelectResult, close]
  );

  // Handle result click
  const handleResultClick = useCallback(
    (result: SearchResult) => {
      addToRecent(query);
      onSelectResult?.(result);
      close();
    },
    [query, addToRecent, onSelectResult, close]
  );

  // Scope configurations
  const scopes: Array<{
    scope: SearchScope;
    label: string;
    shortcut: string;
    icon: React.ReactNode;
  }> = [
    { scope: "elements", label: "Elements", shortcut: "⌘1", icon: Icons.element },
    { scope: "components", label: "Components", shortcut: "⌘2", icon: Icons.component },
    { scope: "layers", label: "Layers", shortcut: "⌘3", icon: Icons.layer },
    { scope: "assets", label: "Assets", shortcut: "⌘4", icon: Icons.asset },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={close}
      />

      {/* Overlay */}
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl bg-surface border border-border rounded-lg shadow-2xl z-50 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <span className="text-text-muted">{Icons.search}</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Search ${scope}...`}
            className="flex-1 bg-transparent text-text text-sm outline-none placeholder:text-text-muted/50"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-text-muted hover:text-text transition-colors"
            >
              {Icons.close}
            </button>
          )}
        </div>

        {/* Scope Filters */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-surface/50">
          {scopes.map((s) => (
            <ScopeButton
              key={s.scope}
              scope={s.scope}
              label={s.label}
              shortcut={s.shortcut}
              icon={s.icon}
              active={scope === s.scope}
              onClick={() => setScope(s.scope)}
            />
          ))}
        </div>

        {/* Results */}
        <div
          ref={resultsRef}
          className="max-h-[50vh] overflow-auto"
        >
          {results.length > 0 ? (
            <div className="py-1">
              {results.map((result, index) => (
                <div key={result.id} data-index={index}>
                  <ResultItem
                    result={result}
                    isSelected={selectedIndex === index}
                    onClick={() => handleResultClick(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  />
                </div>
              ))}
            </div>
          ) : query ? (
            <div className="px-4 py-8 text-center text-text-muted">
              <p className="text-sm">No results found for "{query}"</p>
              <p className="text-xs mt-1">Try a different search term or scope</p>
            </div>
          ) : recentSearches.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-1 flex items-center justify-between">
                <span className="text-[10px] text-text-muted uppercase tracking-wider flex items-center gap-1">
                  {Icons.clock}
                  Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-[10px] text-text-muted hover:text-text transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="mt-1">
                {recentSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => setQuery(search)}
                    className="w-full px-4 py-2 text-left text-sm text-text hover:bg-white/5 transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-text-muted">
              <p className="text-sm">Start typing to search</p>
              <p className="text-xs mt-1">Use ⌘1-4 to switch search scope</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border bg-surface/50 flex items-center justify-between text-[10px] text-text-muted">
          <span>{results.length} results</span>
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>Enter Select</span>
            <span>Esc Close</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default SearchOverlay;
