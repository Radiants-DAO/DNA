import { useState, useRef, useEffect, useCallback, useMemo, useId } from "react";
import { useAppStore } from "../stores/appStore";
import { Copy, RefreshCw, ChevronDown, ChevronRight } from "./ui/icons";
import { DogfoodBoundary } from './ui/DogfoodBoundary';

/**
 * VariablesPanel - Design tokens viewer/editor for the panel
 * Extension version - reads CSS custom properties from the inspected page.
 *
 * Features:
 * - Color tokens display with swatches
 * - Spacing scale visualization
 * - Border radius preview
 * - Shadow previews
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
  copy: <Copy className="w-3 h-3" />,
  refresh: <RefreshCw className="w-3 h-3" />,
  chevronDown: <ChevronDown className="w-3 h-3" />,
  chevronRight: <ChevronRight className="w-3 h-3" />,
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
// Token Row Components
// ============================================================================

interface ColorTokenRowProps {
  token: ParsedToken;
  onCopy: (text: string) => void;
}

function ColorTokenRow({ token, onCopy }: ColorTokenRowProps) {
  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-700/50 cursor-pointer group"
      onClick={() => onCopy(token.cssVar)}
      title={`Click to copy: ${token.cssVar}`}
    >
      <div
        className="w-5 h-5 rounded border border-neutral-600 shrink-0"
        style={{ backgroundColor: token.value }}
      />
      <span className="flex-1 text-xs text-neutral-200 truncate">{token.name}</span>
      <code className="text-xs text-neutral-400 shrink-0">{token.value}</code>
      <span className="opacity-0 group-hover:opacity-100 text-neutral-400 transition-opacity">
        {Icons.copy}
      </span>
    </div>
  );
}

interface SpacingTokenRowProps {
  token: ParsedToken;
  onCopy: (text: string) => void;
}

function SpacingTokenRow({ token, onCopy }: SpacingTokenRowProps) {
  const numericValue = parseFloat(token.value) || 0;
  const maxWidth = 64;
  const barWidth = Math.min(numericValue * 2, maxWidth);

  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-700/50 cursor-pointer group"
      onClick={() => onCopy(token.cssVar)}
      title={`Click to copy: ${token.cssVar}`}
    >
      <div
        className="h-2 bg-blue-500/40 rounded-sm shrink-0"
        style={{ width: barWidth, minWidth: 4 }}
      />
      <span className="flex-1 text-xs text-neutral-200 truncate">{token.name}</span>
      <code className="text-xs text-neutral-400 shrink-0">{token.value}</code>
      <span className="opacity-0 group-hover:opacity-100 text-neutral-400 transition-opacity">
        {Icons.copy}
      </span>
    </div>
  );
}

interface RadiusTokenRowProps {
  token: ParsedToken;
  onCopy: (text: string) => void;
}

function RadiusTokenRow({ token, onCopy }: RadiusTokenRowProps) {
  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-700/50 cursor-pointer group"
      onClick={() => onCopy(token.cssVar)}
      title={`Click to copy: ${token.cssVar}`}
    >
      <div
        className="w-5 h-5 bg-neutral-600/50 border border-neutral-600 shrink-0"
        style={{ borderRadius: token.value }}
      />
      <span className="flex-1 text-xs text-neutral-200 truncate">{token.name}</span>
      <code className="text-xs text-neutral-400 shrink-0">{token.value}</code>
      <span className="opacity-0 group-hover:opacity-100 text-neutral-400 transition-opacity">
        {Icons.copy}
      </span>
    </div>
  );
}

interface ShadowTokenRowProps {
  token: ParsedToken;
  onCopy: (text: string) => void;
}

function ShadowTokenRow({ token, onCopy }: ShadowTokenRowProps) {
  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-700/50 cursor-pointer group"
      onClick={() => onCopy(token.cssVar)}
      title={`Click to copy: ${token.cssVar}`}
    >
      <div
        className="w-5 h-5 bg-neutral-800 rounded border border-neutral-600 shrink-0"
        style={{ boxShadow: token.value }}
      />
      <span className="flex-1 text-xs text-neutral-200 truncate">{token.name}</span>
      <span className="text-[10px] text-neutral-500 truncate max-w-[80px]" title={token.value}>
        {token.value.length > 15 ? token.value.slice(0, 15) + "..." : token.value}
      </span>
      <span className="opacity-0 group-hover:opacity-100 text-neutral-400 transition-opacity">
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
        <span className="text-neutral-400">
          {isExpanded ? Icons.chevronDown : Icons.chevronRight}
        </span>
        <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium flex-1">
          {title}
        </span>
        <span className="text-[10px] text-neutral-500">
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
  const [colorMode, setColorMode] = useState<"light" | "dark">("dark");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup copy timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Parse tokens into categorized structure
  const parsedTokens = useMemo((): Map<string, ParsedToken[]> => {
    const result = new Map<string, ParsedToken[]>();
    TOKEN_CATEGORIES.forEach((cat) => result.set(cat.label, []));

    // Use mock tokens for now - in production this would come from the content script
    const mockTokens: Record<string, string> = {
      "--color-primary": "#3b82f6",
      "--color-surface": "#141414",
      "--color-background": "#0a0a0a",
      "--color-text": "#ffffff",
      "--spacing-1": "4px",
      "--spacing-2": "8px",
      "--spacing-3": "12px",
      "--spacing-4": "16px",
      "--radius-sm": "2px",
      "--radius-md": "4px",
      "--radius-lg": "8px",
      "--shadow-sm": "0 1px 2px rgba(0,0,0,0.3)",
    };

    Object.entries(mockTokens).forEach(([key, value]) => {
      for (const category of TOKEN_CATEGORIES) {
        if (key.startsWith(category.prefix)) {
          const name = key.replace(category.prefix, "");
          const existing = result.get(category.label) || [];
          existing.push({
            name,
            cssVar: `var(${key})`,
            value,
            category,
          });
          result.set(category.label, existing);
          break;
        }
      }
    });

    return result;
  }, [tokens]);

  // Handle copy to clipboard
  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedToken(text);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopiedToken(null), 1500);
    });
  }, []);

  // Render row based on token type
  const renderTokenRow = (token: ParsedToken) => {
    switch (token.category.type) {
      case "color":
        return <ColorTokenRow key={token.cssVar} token={token} onCopy={handleCopy} />;
      case "spacing":
        return <SpacingTokenRow key={token.cssVar} token={token} onCopy={handleCopy} />;
      case "radius":
        return <RadiusTokenRow key={token.cssVar} token={token} onCopy={handleCopy} />;
      case "shadow":
        return <ShadowTokenRow key={token.cssVar} token={token} onCopy={handleCopy} />;
      default:
        return null;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-3 space-y-3">
        <div className="flex items-center gap-2 text-neutral-400">
          <div className="animate-spin">{Icons.refresh}</div>
          <span className="text-xs">Loading tokens...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-400">
          CSS custom properties from the page.
        </p>
        <div className="flex items-center gap-1">
          {/* Color Mode Toggle */}
          <div className="flex items-center bg-neutral-700/50 rounded p-0.5">
            <button
              onClick={() => setColorMode("light")}
              className={`p-1 rounded transition-colors ${
                colorMode === "light"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-neutral-400 hover:text-neutral-200"
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
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
              title="Dark mode"
              aria-label="Dark mode"
            >
              {Icons.moon}
            </button>
          </div>
        </div>
      </div>

      {/* Token sections */}
      {TOKEN_CATEGORIES.map((category) => {
        const categoryTokens = parsedTokens.get(category.label) || [];
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
        <div className="fixed bottom-4 right-4 bg-neutral-800 border border-neutral-600 px-3 py-2 rounded shadow-lg text-xs text-neutral-200 z-50">
          Copied: {copiedToken}
        </div>
      )}
    </div>
  );
}

export default VariablesPanel;
