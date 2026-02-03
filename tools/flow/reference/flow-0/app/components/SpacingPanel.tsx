import { useState, useMemo, useCallback } from "react";
import { Clipboard } from "./ui/icons";
import { useAppStore } from "../stores/appStore";

type SpacingSide = "top" | "right" | "bottom" | "left";
type SpacingType = "padding" | "margin";
type SpacingProperty = `${SpacingType}-${SpacingSide}` | "gap";

interface Token {
  name: string;
  value: string;
}

/**
 * Spacing Panel - Property panel for editing padding, margin, and gap.
 *
 * Features:
 * - Visual spacing diagram (Webflow-style nested box)
 * - Padding (all sides, individual)
 * - Margin (all sides, individual)
 * - Gap (for flex/grid)
 * - Spacing scale tokens
 * - Output to clipboard (direct write mode removed per fn-9)
 */
export function SpacingPanel() {
  const activePanel = useAppStore((s) => s.activePanel);
  const tokens = useAppStore((s) => s.tokens);
  const tokensLoading = useAppStore((s) => s.tokensLoading);
  const selectedComponents = useAppStore((s) => s.selectedComponents);

  const [activeProperty, setActiveProperty] =
    useState<SpacingProperty | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedValues, setAppliedValues] = useState<
    Record<SpacingProperty, string | null>
  >({
    "padding-top": null,
    "padding-right": null,
    "padding-bottom": null,
    "padding-left": null,
    "margin-top": null,
    "margin-right": null,
    "margin-bottom": null,
    "margin-left": null,
    gap: null,
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Extract spacing tokens
  const spacingTokens = useMemo((): Token[] => {
    if (!tokens) return [];
    const allTokens: Token[] = [];

    const processTokens = (source: Partial<{ [key: string]: string }> | undefined) => {
      if (!source) return;
      for (const [name, value] of Object.entries(source)) {
        if (value && isSpacingToken(name, value)) {
          allTokens.push({
            name: `--${name}`,
            value,
          });
        }
      }
    };

    processTokens(tokens.public);
    processTokens(tokens.inline);
    return allTokens;
  }, [tokens]);

  // Filter tokens by search
  const filteredTokens = useMemo(() => {
    if (!searchQuery) return spacingTokens;
    const query = searchQuery.toLowerCase();
    return spacingTokens.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.value.toLowerCase().includes(query)
    );
  }, [spacingTokens, searchQuery]);

  // Show toast notification
  const showNotification = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  // Apply a token
  const applyToken = useCallback(
    async (token: Token) => {
      if (!activeProperty) return;

      const cssValue = `var(${token.name})`;
      const cssLine = `${activeProperty}: ${cssValue};`;

      setAppliedValues((prev) => ({ ...prev, [activeProperty]: token.name }));

      try {
        await navigator.clipboard.writeText(cssLine);
        showNotification(`Copied: ${cssLine}`);
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
      }

      setActiveProperty(null);
    },
    [activeProperty, showNotification]
  );

  // Apply a custom value (e.g., "0")
  const applyCustomValue = useCallback(
    async (value: string) => {
      if (!activeProperty) return;

      const cssLine = `${activeProperty}: ${value};`;
      setAppliedValues((prev) => ({ ...prev, [activeProperty]: value }));

      try {
        await navigator.clipboard.writeText(cssLine);
        showNotification(`Copied: ${cssLine}`);
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
      }

      setActiveProperty(null);
    },
    [activeProperty, showNotification]
  );

  // Only show when spacing panel is active
  if (activePanel !== "spacing") return null;

  const hasSelection = selectedComponents.length > 0;

  return (
    <div
      data-radflow-panel
      className="fixed right-0 top-0 bottom-0 w-80 bg-surface border-l border-edge z-40 flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-edge">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">Spacing</h2>
          <div className="px-2 py-1 rounded text-xs font-medium bg-background text-text-muted border border-edge flex items-center gap-1">
            <Clipboard className="w-3 h-3" />
            Copy
          </div>
        </div>
        {!hasSelection && (
          <p className="text-xs text-text-muted mt-1">
            Select a component to edit spacing
          </p>
        )}
      </div>

      {/* Visual Spacing Diagram */}
      <div className={`p-4 ${!hasSelection ? "opacity-50" : ""}`}>
        <SpacingDiagram
          appliedValues={appliedValues}
          activeProperty={activeProperty}
          onSelectProperty={(prop) =>
            setActiveProperty(activeProperty === prop ? null : prop)
          }
          disabled={!hasSelection}
        />
      </div>

      {/* Gap Control */}
      <div className={`px-4 pb-4 ${!hasSelection ? "opacity-50" : ""}`}>
        <label className="text-xs font-medium text-text-muted block mb-1.5">
          Gap (Flex/Grid)
        </label>
        <button
          onClick={() =>
            setActiveProperty(activeProperty === "gap" ? null : "gap")
          }
          disabled={!hasSelection}
          className={`
            w-full px-3 py-2 rounded-lg border text-left transition-colors
            ${
              activeProperty === "gap"
                ? "border-accent bg-accent/10"
                : "border-edge bg-background hover:border-accent/50"
            }
            ${!hasSelection ? "cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          <span className="text-sm font-mono truncate text-text">
            {appliedValues.gap || "Select gap"}
          </span>
          <span className="text-text-muted text-xs float-right">
            {activeProperty === "gap" ? "▲" : "▼"}
          </span>
        </button>
      </div>

      {/* Token Picker */}
      {activeProperty && (
        <div className="flex-1 flex flex-col border-t border-edge overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-edge">
            <input
              type="text"
              placeholder="Search spacing tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-background border border-edge rounded focus:outline-none focus:border-accent"
            />
          </div>

          {/* Common Values */}
          <div className="px-3 py-2 border-b border-edge">
            <div className="flex gap-1">
              {["0", "auto"].map((val) => (
                <button
                  key={val}
                  onClick={() => applyCustomValue(val)}
                  className="flex-1 px-2 py-1.5 text-xs bg-background border border-edge rounded hover:border-accent transition-colors"
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Tokens List */}
          <div className="flex-1 overflow-auto">
            {tokensLoading ? (
              <div className="p-4 text-center text-text-muted text-sm">
                Loading tokens...
              </div>
            ) : filteredTokens.length === 0 ? (
              <div className="p-4 text-center text-text-muted text-sm">
                <p>No spacing tokens found</p>
                <p className="text-xs mt-1">
                  Load a CSS file with @theme tokens
                </p>
              </div>
            ) : (
              filteredTokens.map((token) => (
                <button
                  key={token.name}
                  onClick={() => applyToken(token)}
                  className="w-full text-left px-3 py-2 hover:bg-background/50 transition-colors flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-mono truncate text-text">
                      {token.name}
                    </div>
                    <div className="text-[10px] text-text-muted truncate">
                      {token.value}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-edge text-[10px] text-text-muted">
        Click area in diagram to copy CSS
      </div>

      {/* Toast */}
      {showToast && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-accent text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

// Visual Spacing Diagram Component

interface SpacingDiagramProps {
  appliedValues: Record<SpacingProperty, string | null>;
  activeProperty: SpacingProperty | null;
  onSelectProperty: (prop: SpacingProperty) => void;
  disabled?: boolean;
}

function SpacingDiagram({
  appliedValues,
  activeProperty,
  onSelectProperty,
  disabled,
}: SpacingDiagramProps) {
  const getDisplayValue = (prop: SpacingProperty) => {
    const val = appliedValues[prop];
    if (!val) return "0";
    if (val.startsWith("--")) return val.replace("--", "");
    return val;
  };

  const isActive = (prop: SpacingProperty) => activeProperty === prop;

  return (
    <div className="relative">
      {/* Outer box - Margin */}
      <div className="bg-orange-500/20 rounded-lg p-3 relative">
        <span className="absolute top-1 left-2 text-[10px] text-orange-400 uppercase tracking-wider">
          Margin
        </span>

        {/* Margin Top */}
        <button
          onClick={() => onSelectProperty("margin-top")}
          disabled={disabled}
          className={`
            absolute top-3 left-1/2 -translate-x-1/2 text-xs font-mono px-2 py-0.5 rounded
            ${isActive("margin-top") ? "bg-orange-500 text-white" : "hover:bg-orange-500/30"}
            ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {getDisplayValue("margin-top")}
        </button>

        {/* Margin Right */}
        <button
          onClick={() => onSelectProperty("margin-right")}
          disabled={disabled}
          className={`
            absolute right-1 top-1/2 -translate-y-1/2 text-xs font-mono px-2 py-0.5 rounded
            ${isActive("margin-right") ? "bg-orange-500 text-white" : "hover:bg-orange-500/30"}
            ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {getDisplayValue("margin-right")}
        </button>

        {/* Margin Bottom */}
        <button
          onClick={() => onSelectProperty("margin-bottom")}
          disabled={disabled}
          className={`
            absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-mono px-2 py-0.5 rounded
            ${isActive("margin-bottom") ? "bg-orange-500 text-white" : "hover:bg-orange-500/30"}
            ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {getDisplayValue("margin-bottom")}
        </button>

        {/* Margin Left */}
        <button
          onClick={() => onSelectProperty("margin-left")}
          disabled={disabled}
          className={`
            absolute left-1 top-1/2 -translate-y-1/2 text-xs font-mono px-2 py-0.5 rounded
            ${isActive("margin-left") ? "bg-orange-500 text-white" : "hover:bg-orange-500/30"}
            ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {getDisplayValue("margin-left")}
        </button>

        {/* Inner box - Padding */}
        <div className="bg-green-500/20 rounded-lg p-6 mt-4 mb-4 mx-4 relative">
          <span className="absolute top-1 left-2 text-[10px] text-green-400 uppercase tracking-wider">
            Padding
          </span>

          {/* Padding Top */}
          <button
            onClick={() => onSelectProperty("padding-top")}
            disabled={disabled}
            className={`
              absolute top-3 left-1/2 -translate-x-1/2 text-xs font-mono px-2 py-0.5 rounded
              ${isActive("padding-top") ? "bg-green-500 text-white" : "hover:bg-green-500/30"}
              ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            {getDisplayValue("padding-top")}
          </button>

          {/* Padding Right */}
          <button
            onClick={() => onSelectProperty("padding-right")}
            disabled={disabled}
            className={`
              absolute right-1 top-1/2 -translate-y-1/2 text-xs font-mono px-2 py-0.5 rounded
              ${isActive("padding-right") ? "bg-green-500 text-white" : "hover:bg-green-500/30"}
              ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            {getDisplayValue("padding-right")}
          </button>

          {/* Padding Bottom */}
          <button
            onClick={() => onSelectProperty("padding-bottom")}
            disabled={disabled}
            className={`
              absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-mono px-2 py-0.5 rounded
              ${isActive("padding-bottom") ? "bg-green-500 text-white" : "hover:bg-green-500/30"}
              ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            {getDisplayValue("padding-bottom")}
          </button>

          {/* Padding Left */}
          <button
            onClick={() => onSelectProperty("padding-left")}
            disabled={disabled}
            className={`
              absolute left-1 top-1/2 -translate-y-1/2 text-xs font-mono px-2 py-0.5 rounded
              ${isActive("padding-left") ? "bg-green-500 text-white" : "hover:bg-green-500/30"}
              ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            {getDisplayValue("padding-left")}
          </button>

          {/* Content placeholder */}
          <div className="h-8 bg-surface/50 rounded border border-edge flex items-center justify-center">
            <span className="text-[10px] text-text-muted">Content</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility Functions

function isSpacingToken(name: string, value: string): boolean {
  const spacingKeywords = [
    "spacing",
    "space",
    "gap",
    "margin",
    "padding",
    "inset",
  ];
  const lower = name.toLowerCase();

  // Check name
  if (spacingKeywords.some((kw) => lower.includes(kw))) return true;

  // Check if value looks like spacing (px, rem, em, or number)
  if (/^-?\d+(\.\d+)?(px|rem|em|%)?$/.test(value)) return true;

  return false;
}
