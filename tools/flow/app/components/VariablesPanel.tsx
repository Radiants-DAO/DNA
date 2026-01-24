import { useState, useRef, useEffect, useCallback } from "react";
import { useAppStore } from "../stores/appStore";
import { useProjectStore } from "../stores/projectStore";

/**
 * VariablesPanel - Design tokens viewer/editor for the left panel
 *
 * Displays CSS variables (design tokens) from the current project's theme.
 * Based on the radflow/devtools VariablesTab but adapted for the narrower
 * left panel context in radflow-tauri.
 *
 * Features:
 * - Color tokens display with swatches
 * - Spacing scale visualization
 * - Border radius preview
 * - Shadow previews
 * - Inline editing of token values (pending Rust backend integration)
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
      onClick={(e) => {
        e.stopPropagation();
        setEditValue(value);
        setIsEditing(true);
      }}
      className={`cursor-text hover:bg-white/10 px-1 rounded transition-colors text-xs font-mono ${className}`}
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
        className="w-5 h-5 rounded border border-border shrink-0"
        style={{ backgroundColor: token.value }}
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

  return (
    <div className="space-y-1">
      <button
        className="w-full flex items-center gap-1 text-left"
        onClick={() => setIsExpanded(!isExpanded)}
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
        <div className="space-y-0.5">
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
  const tokensLoading = useAppStore((s) => s.tokensLoading);
  const tokensError = useAppStore((s) => s.tokensError);
  const loadTokens = useAppStore((s) => s.loadTokens);
  const currentProject = useProjectStore((s) => s.currentProject);

  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<string, string>>(new Map());

  // Load tokens when project changes
  useEffect(() => {
    if (currentProject?.path) {
      // Try to find globals.css or similar
      const cssPath = `${currentProject.path}/src/styles/globals.css`;
      loadTokens(cssPath).catch(() => {
        // Silent fail - tokens might not exist yet
      });
    }
  }, [currentProject?.path, loadTokens]);

  // Parse tokens into categorized structure
  const parsedTokens = useCallback((): Map<string, ParsedToken[]> => {
    const result = new Map<string, ParsedToken[]>();
    TOKEN_CATEGORIES.forEach((cat) => result.set(cat.label, []));

    if (!tokens) return result;

    // Combine inline and public tokens
    const allTokens = { ...tokens.inline, ...tokens.public };

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
          });
          result.set(category.label, existing);
          break;
        }
      }
    });

    return result;
  }, [tokens, pendingChanges]);

  // Handle copy to clipboard
  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedToken(text);
      setTimeout(() => setCopiedToken(null), 1500);
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

  // Reload tokens
  const handleReload = useCallback(() => {
    if (currentProject?.path) {
      const cssPath = `${currentProject.path}/src/styles/globals.css`;
      loadTokens(cssPath);
      setPendingChanges(new Map());
    }
  }, [currentProject?.path, loadTokens]);

  const categorizedTokens = parsedTokens();

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
        <button
          onClick={handleReload}
          className="p-1 text-text-muted hover:text-text rounded hover:bg-white/5 transition-colors"
          title="Reload tokens"
        >
          {Icons.refresh}
        </button>
      </div>

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

        return (
          <CollapsibleSection
            key={category.label}
            title={category.label}
            count={categoryTokens.length}
            defaultExpanded={category.type === "color"}
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
