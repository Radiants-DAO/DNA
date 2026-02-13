import { useState, useRef, useEffect, useCallback, useMemo, useId } from "react";
import { useAppStore } from "../stores/appStore";

/**
 * VariablesPanel - Design tokens viewer/editor for the left panel
 *
 * Displays CSS variables (design tokens) from the current project's theme.
 * Supports light/dark mode toggle to preview how tokens change between modes.
 *
 * Features:
 * - Color tokens display with swatches
 * - Spacing scale visualization
 * - Border radius preview
 * - Shadow previews
 * - Light/Dark mode toggle
 * - Tokens that change in dark mode are indicated
 * - Copy token name on click
 */

// ============================================================================
// Types
// ============================================================================

interface TokenCategory {
  label: string;
  prefix: string;
  type: "color" | "spacing" | "radius" | "shadow" | "other";
}

interface ParsedToken {
  name: string;
  cssVar: string;
  value: string;
  category: TokenCategory;
  /** Whether this token has a different value in dark mode */
  hasDarkOverride: boolean;
}

// ============================================================================
// Token Categories Configuration
// ============================================================================

const TOKEN_CATEGORIES: TokenCategory[] = [
  { label: "Colors", prefix: "--color-", type: "color" },
  { label: "Spacing", prefix: "--spacing-", type: "spacing" },
  { label: "Radius", prefix: "--radius-", type: "radius" },
  { label: "Shadows", prefix: "--shadow-", type: "shadow" },
];

/** Sub-groups for color tokens, ordered for display */
interface ColorSubGroup {
  label: string;
  /** Prefix after "--color-" to match, or null for "Core" (catches everything else) */
  prefix: string | null;
}

const COLOR_SUB_GROUPS: ColorSubGroup[] = [
  { label: "Core", prefix: null }, // brand/palette colors (no semantic prefix match)
  { label: "Surface", prefix: "surface-" },
  { label: "Content", prefix: "content-" },
  { label: "Edge", prefix: "edge-" },
  { label: "Status", prefix: "status-" },
  { label: "Action", prefix: "action-" },
];

// ============================================================================
// Icons
// ============================================================================

const Icons = {
  copy: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  refresh: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  ),
  chevronDown: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  chevronRight: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  sun: (
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
  ),
  moon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
};

// ============================================================================
// Inline Edit Component
// ============================================================================

interface InlineEditProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  disabled?: boolean;
}

function InlineEdit({ value, onSave, className = "", disabled = false }: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (editValue !== value) {
        onSave(editValue);
      }
      setIsEditing(false);
    } else if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const startEditing = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setEditValue(value);
    setIsEditing(true);
  };

  const handleCodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      startEditing(e);
    }
  };

  if (disabled) {
    return (
      <code className={`text-xs font-mono text-text-muted ${className}`}>
        {value}
      </code>
    );
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`px-1 py-0.5 bg-surface border border-primary/50 rounded text-xs font-mono outline-none ${className}`}
        style={{ width: `${Math.max(editValue.length, 6) + 2}ch` }}
      />
    );
  }

  return (
    <code
      onClick={startEditing}
      onKeyDown={handleCodeKeyDown}
      tabIndex={0}
      role="button"
      className={`cursor-text hover:bg-white/10 px-1 rounded transition-colors text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 ${className}`}
      title="Click to edit"
    >
      {value}
    </code>
  );
}

// ============================================================================
// Token Row Components
// ============================================================================

interface ColorTokenRowProps {
  token: ParsedToken;
  onCopy: (text: string) => void;
  onValueChange: (name: string, value: string) => void;
}

function ColorTokenRow({ token, onCopy, onValueChange }: ColorTokenRowProps) {
  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 cursor-pointer group"
      onClick={() => onCopy(token.cssVar)}
      title={`Click to copy: ${token.cssVar}`}
    >
      <div
        className="w-5 h-5 rounded border border-border shrink-0 relative"
        style={{ backgroundColor: token.value }}
      >
        {token.hasDarkOverride && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400/80 border border-surface"
            title="Changes in dark mode"
          />
        )}
      </div>
      <span className="flex-1 text-xs text-text truncate">{token.name}</span>
      <InlineEdit
        value={token.value}
        onSave={(newValue) => onValueChange(token.name, newValue)}
        className="text-text-muted shrink-0"
      />
      <span className="opacity-0 group-hover:opacity-100 text-text-muted transition-opacity">
        {Icons.copy}
      </span>
    </div>
  );
}

interface SpacingTokenRowProps {
  token: ParsedToken;
  onCopy: (text: string) => void;
  onValueChange: (name: string, value: string) => void;
}

function SpacingTokenRow({ token, onCopy, onValueChange }: SpacingTokenRowProps) {
  // Parse the spacing value for visualization
  const numericValue = parseFloat(token.value) || 0;
  const maxWidth = 64; // Max width for the bar
  const barWidth = Math.min(numericValue * 2, maxWidth);

  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 cursor-pointer group"
      onClick={() => onCopy(token.cssVar)}
      title={`Click to copy: ${token.cssVar}`}
    >
      <div
        className="h-2 bg-primary/40 rounded-sm shrink-0"
        style={{ width: barWidth, minWidth: 4 }}
      />
      <span className="flex-1 text-xs text-text truncate">{token.name}</span>
      <InlineEdit
        value={token.value}
        onSave={(newValue) => onValueChange(token.name, newValue)}
        className="text-text-muted shrink-0"
      />
      <span className="opacity-0 group-hover:opacity-100 text-text-muted transition-opacity">
        {Icons.copy}
      </span>
    </div>
  );
}

interface RadiusTokenRowProps {
  token: ParsedToken;
  onCopy: (text: string) => void;
  onValueChange: (name: string, value: string) => void;
}

function RadiusTokenRow({ token, onCopy, onValueChange }: RadiusTokenRowProps) {
  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 cursor-pointer group"
      onClick={() => onCopy(token.cssVar)}
      title={`Click to copy: ${token.cssVar}`}
    >
      <div
        className="w-5 h-5 bg-white/10 border border-border shrink-0"
        style={{ borderRadius: token.value }}
      />
      <span className="flex-1 text-xs text-text truncate">{token.name}</span>
      <InlineEdit
        value={token.value}
        onSave={(newValue) => onValueChange(token.name, newValue)}
        className="text-text-muted shrink-0"
      />
      <span className="opacity-0 group-hover:opacity-100 text-text-muted transition-opacity">
        {Icons.copy}
      </span>
    </div>
  );
}

interface ShadowTokenRowProps {
  token: ParsedToken;
  onCopy: (text: string) => void;
  onValueChange: (name: string, value: string) => void;
}

function ShadowTokenRow({ token, onCopy, onValueChange }: ShadowTokenRowProps) {
  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 cursor-pointer group"
      onClick={() => onCopy(token.cssVar)}
      title={`Click to copy: ${token.cssVar}`}
    >
      <div
        className="w-5 h-5 bg-surface rounded border border-border shrink-0"
        style={{ boxShadow: token.value }}
      />
      <span className="flex-1 text-xs text-text truncate">{token.name}</span>
      <span className="text-[10px] text-text-muted truncate max-w-[80px]" title={token.value}>
        {token.value.length > 15 ? token.value.slice(0, 15) + "..." : token.value}
      </span>
      <span className="opacity-0 group-hover:opacity-100 text-text-muted transition-opacity">
        {Icons.copy}
      </span>
    </div>
  );
}

// ============================================================================
// Collapsible Section Component
// ============================================================================

interface CollapsibleSectionProps {
  title: string;
  count: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, count, defaultExpanded = true, children }: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentId = useId();

  return (
    <div className="space-y-1">
      <button
        className="w-full flex items-center gap-1 text-left"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        <span className="text-text-muted">
          {isExpanded ? Icons.chevronDown : Icons.chevronRight}
        </span>
        <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium flex-1">
          {title}
        </span>
        <span className="text-[10px] text-text-muted">
          {count}
        </span>
      </button>
      {isExpanded && (
        <div id={contentId} className="space-y-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main VariablesPanel Component
// ============================================================================

export function VariablesPanel() {
  const tokens = useAppStore((s) => s.tokens);
  const darkTokens = useAppStore((s) => s.darkTokens);
  const colorMode = useAppStore((s) => s.colorMode);
  const setColorMode = useAppStore((s) => s.setColorMode);
  const getActiveTokens = useAppStore((s) => s.getActiveTokens);
  const tokensLoading = useAppStore((s) => s.tokensLoading);
  const tokensError = useAppStore((s) => s.tokensError);
  const loadTokens = useAppStore((s) => s.loadTokens);
  const workspace = useAppStore((s) => s.workspace);

  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<string, string>>(new Map());
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup copy timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Track tokens that have dark mode overrides
  const darkOverrideKeys = useMemo(() => {
    if (!darkTokens) return new Set<string>();
    return new Set(Object.keys(darkTokens));
  }, [darkTokens]);

  // Get the active tokens based on current color mode
  const activeTokens = useMemo(() => getActiveTokens(), [getActiveTokens, colorMode]);

  // Check if dark mode is available
  const hasDarkMode = darkTokens !== null && Object.keys(darkTokens).length > 0;

  // Tokens are now loaded by workspaceSlice when a theme is selected.
  // No need for manual loading here.

  // Parse tokens into categorized structure
  const parsedTokens = useMemo((): Map<string, ParsedToken[]> => {
    const result = new Map<string, ParsedToken[]>();
    TOKEN_CATEGORIES.forEach((cat) => result.set(cat.label, []));

    if (!activeTokens) return result;

    // Combine inline and public tokens
    const allTokens = { ...activeTokens.inline, ...activeTokens.public };

    Object.entries(allTokens).forEach(([key, value]) => {
      if (!value) return;

      for (const category of TOKEN_CATEGORIES) {
        if (key.startsWith(category.prefix)) {
          const name = key.replace(category.prefix, "");
          const existing = result.get(category.label) || [];
          existing.push({
            name,
            cssVar: `var(${key})`,
            value: pendingChanges.get(key) ?? value,
            category,
            hasDarkOverride: darkOverrideKeys.has(key),
          });
          result.set(category.label, existing);
          break;
        }
      }
    });

    return result;
  }, [activeTokens, pendingChanges, darkOverrideKeys]);

  // Handle copy to clipboard
  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedToken(text);
      // Clear any existing timeout before setting a new one
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopiedToken(null), 1500);
    });
  }, []);

  // Handle value change (staged, not saved yet)
  const handleValueChange = useCallback((name: string, value: string) => {
    setPendingChanges((prev) => {
      const next = new Map(prev);
      next.set(name, value);
      return next;
    });
  }, []);

  // Reload tokens from active theme
  const handleReload = useCallback(() => {
    if (workspace?.activeThemeId) {
      const theme = workspace.themes.find((t) => t.id === workspace.activeThemeId);
      if (theme) {
        loadTokens(`${theme.path}/tokens.css`);
        setPendingChanges(new Map());
      }
    }
  }, [workspace, loadTokens]);

  const categorizedTokens = parsedTokens;

  // Render row based on token type
  const renderTokenRow = (token: ParsedToken) => {
    switch (token.category.type) {
      case "color":
        return (
          <ColorTokenRow
            key={token.cssVar}
            token={token}
            onCopy={handleCopy}
            onValueChange={handleValueChange}
          />
        );
      case "spacing":
        return (
          <SpacingTokenRow
            key={token.cssVar}
            token={token}
            onCopy={handleCopy}
            onValueChange={handleValueChange}
          />
        );
      case "radius":
        return (
          <RadiusTokenRow
            key={token.cssVar}
            token={token}
            onCopy={handleCopy}
            onValueChange={handleValueChange}
          />
        );
      case "shadow":
        return (
          <ShadowTokenRow
            key={token.cssVar}
            token={token}
            onCopy={handleCopy}
            onValueChange={handleValueChange}
          />
        );
      default:
        return null;
    }
  };

  // Loading state
  if (tokensLoading) {
    return (
      <div className="p-3 space-y-3">
        <div className="flex items-center gap-2 text-text-muted">
          <div className="animate-spin">{Icons.refresh}</div>
          <span className="text-xs">Loading tokens...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (tokensError) {
    return (
      <div className="p-3 space-y-3">
        <p className="text-xs text-text-muted">
          Could not load design tokens.
        </p>
        <p className="text-[10px] text-red-400/70">
          {tokensError}
        </p>
        <button
          onClick={handleReload}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          {Icons.refresh}
          <span>Retry</span>
        </button>
      </div>
    );
  }

  // No tokens state - show placeholder with mock data
  if (!tokens || (Object.keys(tokens.inline).length === 0 && Object.keys(tokens.public).length === 0)) {
    return (
      <div className="p-3 space-y-4">
        <p className="text-xs text-text-muted">
          Design tokens from your theme CSS.
        </p>

        {/* Mock/placeholder colors */}
        <CollapsibleSection title="Colors" count={4}>
          {[
            { name: "primary", value: "#3b82f6" },
            { name: "surface", value: "#141414" },
            { name: "background", value: "#0a0a0a" },
            { name: "text", value: "#ffffff" },
          ].map((color) => (
            <div
              key={color.name}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 cursor-pointer group"
              onClick={() => handleCopy(`var(--color-${color.name})`)}
              title={`Click to copy: var(--color-${color.name})`}
            >
              <div
                className="w-5 h-5 rounded border border-border shrink-0"
                style={{ backgroundColor: color.value }}
              />
              <span className="flex-1 text-xs text-text">{color.name}</span>
              <code className="text-xs text-text-muted">{color.value}</code>
            </div>
          ))}
        </CollapsibleSection>

        {/* Mock/placeholder spacing */}
        <CollapsibleSection title="Spacing" count={6} defaultExpanded={false}>
          {["4px", "8px", "12px", "16px", "24px", "32px"].map((value, i) => (
            <div
              key={value}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 cursor-pointer"
              onClick={() => handleCopy(`var(--spacing-${i + 1})`)}
            >
              <div
                className="h-2 bg-primary/40 rounded-sm"
                style={{ width: parseInt(value), minWidth: 4 }}
              />
              <span className="flex-1 text-xs text-text">space-{i + 1}</span>
              <code className="text-xs text-text-muted">{value}</code>
            </div>
          ))}
        </CollapsibleSection>

        {/* Mock/placeholder radius */}
        <CollapsibleSection title="Radius" count={4} defaultExpanded={false}>
          {[
            { name: "sm", value: "2px" },
            { name: "md", value: "4px" },
            { name: "lg", value: "8px" },
            { name: "full", value: "9999px" },
          ].map((radius) => (
            <div
              key={radius.name}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 cursor-pointer"
              onClick={() => handleCopy(`var(--radius-${radius.name})`)}
            >
              <div
                className="w-5 h-5 bg-white/10 border border-border"
                style={{ borderRadius: radius.value }}
              />
              <span className="flex-1 text-xs text-text">{radius.name}</span>
              <code className="text-xs text-text-muted">{radius.value}</code>
            </div>
          ))}
        </CollapsibleSection>

        {/* Copied toast */}
        {copiedToken && (
          <div className="fixed bottom-4 right-4 bg-surface border border-border px-3 py-2 rounded shadow-lg text-xs text-text">
            Copied: {copiedToken}
          </div>
        )}

        <p className="text-[10px] text-text-muted/60 pt-2">
          Open a project with a globals.css file to see real tokens.
        </p>
      </div>
    );
  }

  // Real tokens display
  return (
    <div className="p-3 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">
          Design tokens from your theme.
        </p>
        <div className="flex items-center gap-1">
          {/* Color Mode Toggle */}
          {hasDarkMode && (
            <div className="flex items-center bg-white/5 rounded p-0.5">
              <button
                onClick={() => setColorMode("light")}
                className={`p-1 rounded transition-colors ${
                  colorMode === "light"
                    ? "bg-primary/20 text-primary"
                    : "text-text-muted hover:text-text"
                }`}
                title="Light mode"
                aria-label="Light mode"
              >
                {Icons.sun}
              </button>
              <button
                onClick={() => setColorMode("dark")}
                className={`p-1 rounded transition-colors ${
                  colorMode === "dark"
                    ? "bg-primary/20 text-primary"
                    : "text-text-muted hover:text-text"
                }`}
                title="Dark mode"
                aria-label="Dark mode"
              >
                {Icons.moon}
              </button>
            </div>
          )}
          <button
            onClick={handleReload}
            className="p-1 text-text-muted hover:text-text rounded hover:bg-white/5 transition-colors"
            title="Reload tokens"
          >
            {Icons.refresh}
          </button>
        </div>
      </div>

      {/* Dark mode info */}
      {hasDarkMode && (
        <div className="text-[10px] text-text-muted bg-white/5 rounded px-2 py-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400/60 shrink-0" />
          <span>Tokens with this indicator change in dark mode</span>
        </div>
      )}

      {/* Pending changes indicator */}
      {pendingChanges.size > 0 && (
        <div className="flex items-center justify-between px-2 py-1.5 bg-primary/10 border border-primary/30 rounded text-xs">
          <span className="text-text">
            {pendingChanges.size} pending {pendingChanges.size === 1 ? "change" : "changes"}
          </span>
          <button
            onClick={() => setPendingChanges(new Map())}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      {/* Token sections */}
      {TOKEN_CATEGORIES.map((category) => {
        const categoryTokens = categorizedTokens.get(category.label) || [];
        if (categoryTokens.length === 0) return null;

        // Colors get sub-accordions by semantic group
        if (category.type === "color") {
          const semanticPrefixes = COLOR_SUB_GROUPS
            .filter((g) => g.prefix !== null)
            .map((g) => g.prefix!);

          const subGroups = COLOR_SUB_GROUPS.map((group) => {
            const tokens = group.prefix === null
              ? categoryTokens.filter((t) => !semanticPrefixes.some((p) => t.name.startsWith(p)))
              : categoryTokens.filter((t) => t.name.startsWith(group.prefix!));
            return { ...group, tokens };
          }).filter((g) => g.tokens.length > 0);

          return (
            <CollapsibleSection
              key={category.label}
              title={category.label}
              count={categoryTokens.length}
              defaultExpanded
            >
              {subGroups.map((group) => (
                <CollapsibleSection
                  key={group.label}
                  title={group.label}
                  count={group.tokens.length}
                  defaultExpanded={group.prefix === null}
                >
                  {group.tokens.map(renderTokenRow)}
                </CollapsibleSection>
              ))}
            </CollapsibleSection>
          );
        }

        return (
          <CollapsibleSection
            key={category.label}
            title={category.label}
            count={categoryTokens.length}
            defaultExpanded={false}
          >
            {categoryTokens.map(renderTokenRow)}
          </CollapsibleSection>
        );
      })}

      {/* Copied toast */}
      {copiedToken && (
        <div className="fixed bottom-4 right-4 bg-surface border border-border px-3 py-2 rounded shadow-lg text-xs text-text z-50">
          Copied: {copiedToken}
        </div>
      )}
    </div>
  );
}

export default VariablesPanel;
