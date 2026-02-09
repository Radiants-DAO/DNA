import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { ScannedToken } from "@flow/shared";
import { Copy, RefreshCw } from "./ui/icons";
import { CollapsibleSection } from "./ui/CollapsibleSection";
import { scanTokens } from "../scanners/tokenScanner";
import { onPageNavigated } from "../api/navigationWatcher";

/**
 * VariablesPanel - Design tokens viewer for the panel.
 * Scans CSS custom properties from the inspected page via inspectedWindow.eval().
 */

// ============================================================================
// Types
// ============================================================================

interface TokenCategory {
  label: string;
  type: ScannedToken["category"];
}

interface ParsedToken {
  name: string;
  cssVar: string;
  value: string;
  resolvedValue: string;
  darkValue?: string;
  tier: ScannedToken["tier"];
  category: TokenCategory;
}

// ============================================================================
// Token Categories Configuration
// ============================================================================

const TOKEN_CATEGORIES: TokenCategory[] = [
  { label: "Colors", type: "color" },
  { label: "Spacing", type: "spacing" },
  { label: "Radius", type: "radius" },
  { label: "Shadows", type: "shadow" },
  { label: "Fonts", type: "font" },
  { label: "Motion", type: "motion" },
  { label: "Size", type: "size" },
  { label: "Other", type: "other" },
];

// ============================================================================
// Icons
// ============================================================================

const Icons = {
  copy: <Copy className="w-3 h-3" />,
  refresh: <RefreshCw className="w-3 h-3" />,
};

// ============================================================================
// Token Row Components
// ============================================================================

interface TokenRowProps {
  token: ParsedToken;
  onCopy: (text: string) => void;
}

function ColorTokenRow({ token, onCopy }: TokenRowProps) {
  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-700/50 cursor-pointer group"
      onClick={() => onCopy(token.cssVar)}
      title={`Click to copy: ${token.cssVar}`}
    >
      <div
        className="w-5 h-5 rounded border border-neutral-600 shrink-0"
        style={{ backgroundColor: token.resolvedValue || token.value }}
      />
      <span className="flex-1 text-xs text-neutral-200 truncate">{token.name}</span>
      <code className="text-xs text-neutral-400 shrink-0">{token.value}</code>
      {token.tier === "semantic" && (
        <span className="text-[9px] text-blue-400 bg-blue-400/10 px-1 rounded">S</span>
      )}
      <span className="opacity-0 group-hover:opacity-100 text-neutral-400 transition-opacity">
        {Icons.copy}
      </span>
    </div>
  );
}

function SpacingTokenRow({ token, onCopy }: TokenRowProps) {
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

function RadiusTokenRow({ token, onCopy }: TokenRowProps) {
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

function ShadowTokenRow({ token, onCopy }: TokenRowProps) {
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

function GenericTokenRow({ token, onCopy }: TokenRowProps) {
  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-700/50 cursor-pointer group"
      onClick={() => onCopy(token.cssVar)}
      title={`Click to copy: ${token.cssVar}`}
    >
      <span className="flex-1 text-xs text-neutral-200 truncate">{token.name}</span>
      <code className="text-xs text-neutral-400 shrink-0 truncate max-w-[120px]">{token.value}</code>
      <span className="opacity-0 group-hover:opacity-100 text-neutral-400 transition-opacity">
        {Icons.copy}
      </span>
    </div>
  );
}

// ============================================================================
// Main VariablesPanel Component
// ============================================================================

export function VariablesPanel() {
  const [tokens, setTokens] = useState<ScannedToken[]>([]);
  const [framework, setFramework] = useState<string | undefined>();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runScan = useCallback(() => {
    setLoading(true);
    scanTokens().then((result) => {
      setTokens(result.tokens);
      setFramework(result.framework);
      setLoading(false);
    });
  }, []);

  // Scan on mount + re-scan on SPA navigation
  useEffect(() => {
    runScan();
    const unsubscribe = onPageNavigated(runScan);
    return unsubscribe;
  }, [runScan]);

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

    for (const token of tokens) {
      const category = TOKEN_CATEGORIES.find((c) => c.type === token.category);
      if (!category) continue;

      const existing = result.get(category.label) || [];
      existing.push({
        name: token.name,
        cssVar: `var(${token.name})`,
        value: token.value,
        resolvedValue: token.resolvedValue,
        darkValue: token.darkValue,
        tier: token.tier,
        category,
      });
      result.set(category.label, existing);
    }

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
      case "size":
        return <SpacingTokenRow key={token.cssVar} token={token} onCopy={handleCopy} />;
      case "radius":
        return <RadiusTokenRow key={token.cssVar} token={token} onCopy={handleCopy} />;
      case "shadow":
        return <ShadowTokenRow key={token.cssVar} token={token} onCopy={handleCopy} />;
      default:
        return <GenericTokenRow key={token.cssVar} token={token} onCopy={handleCopy} />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-3 space-y-3">
        <div className="flex items-center gap-2 text-neutral-400">
          <div className="animate-spin">{Icons.refresh}</div>
          <span className="text-xs">Scanning tokens...</span>
        </div>
      </div>
    );
  }

  const totalTokens = tokens.length;

  return (
    <div className="p-3 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-400">
          {totalTokens === 0
            ? "No CSS custom properties found."
            : `${totalTokens} token${totalTokens === 1 ? "" : "s"}${framework ? ` (${framework})` : ""}`}
        </p>
        <button
          onClick={runScan}
          title="Rescan page"
          className="p-1 rounded hover:bg-neutral-700/50 text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          {Icons.refresh}
        </button>
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
