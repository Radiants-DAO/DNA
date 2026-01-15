import { useState, useMemo, useCallback } from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { useAppStore } from "../stores/appStore";

type ColorProperty = "background" | "text" | "border";

interface ColorToken {
  name: string;
  value: string;
  category?: string;
}

/**
 * Colors Panel - Property panel for editing background, text, and border colors.
 *
 * Features:
 * - Token picker with semantic token names
 * - Search/filter tokens
 * - Color swatch previews
 * - Custom color input fallback via react-colorful
 * - Output to clipboard or direct file write (matches Text Edit toggle)
 */
export function ColorsPanel() {
  const activePanel = useAppStore((s) => s.activePanel);
  const tokens = useAppStore((s) => s.tokens);
  const tokensLoading = useAppStore((s) => s.tokensLoading);
  const selectedComponents = useAppStore((s) => s.selectedComponents);
  const directWriteMode = useAppStore((s) => s.directWriteMode);
  const setDirectWriteMode = useAppStore((s) => s.setDirectWriteMode);

  const [activeProperty, setActiveProperty] = useState<ColorProperty | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customColor, setCustomColor] = useState("#3b82f6");
  const [appliedColors, setAppliedColors] = useState<Record<ColorProperty, string | null>>({
    background: null,
    text: null,
    border: null,
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Extract color tokens from theme data
  const colorTokens = useMemo((): ColorToken[] => {
    if (!tokens) return [];

    const allTokens: ColorToken[] = [];

    // Process public tokens (exported as utilities)
    for (const [name, value] of Object.entries(tokens.public || {})) {
      if (value && isColorValue(name, value)) {
        allTokens.push({
          name: `--${name}`,
          value,
          category: getCategoryFromName(name),
        });
      }
    }

    // Process inline tokens (internal reference)
    for (const [name, value] of Object.entries(tokens.inline || {})) {
      if (value && isColorValue(name, value)) {
        allTokens.push({
          name: `--${name}`,
          value,
          category: getCategoryFromName(name),
        });
      }
    }

    return allTokens;
  }, [tokens]);

  // Filter tokens by search query
  const filteredTokens = useMemo(() => {
    if (!searchQuery) return colorTokens;
    const query = searchQuery.toLowerCase();
    return colorTokens.filter(
      (token) =>
        token.name.toLowerCase().includes(query) ||
        token.category?.toLowerCase().includes(query)
    );
  }, [colorTokens, searchQuery]);

  // Group tokens by category
  const groupedTokens = useMemo(() => {
    const groups = new Map<string, ColorToken[]>();
    for (const token of filteredTokens) {
      const category = token.category || "other";
      const existing = groups.get(category) || [];
      existing.push(token);
      groups.set(category, existing);
    }
    return groups;
  }, [filteredTokens]);

  // Show toast notification
  const showNotification = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  // Apply a color token to the active property
  const applyToken = useCallback(
    async (token: ColorToken) => {
      if (!activeProperty) return;

      const cssProperty = getCssProperty(activeProperty);
      const cssValue = `var(${token.name})`;
      const cssLine = `${cssProperty}: ${cssValue};`;

      setAppliedColors((prev) => ({ ...prev, [activeProperty]: token.name }));

      if (directWriteMode && selectedComponents.length > 0) {
        // Direct write mode - would write to file
        // For now, show a toast that this would write
        showNotification(`Would write: ${cssLine}`);
      } else {
        // Clipboard mode - copy CSS to clipboard
        try {
          await navigator.clipboard.writeText(cssLine);
          showNotification(`Copied: ${cssLine}`);
        } catch (err) {
          console.error("Failed to copy to clipboard:", err);
        }
      }

      setActiveProperty(null);
    },
    [activeProperty, directWriteMode, selectedComponents, showNotification]
  );

  // Apply custom color
  const applyCustomColor = useCallback(async () => {
    if (!activeProperty) return;

    const cssProperty = getCssProperty(activeProperty);
    const cssLine = `${cssProperty}: ${customColor};`;

    setAppliedColors((prev) => ({ ...prev, [activeProperty]: customColor }));

    if (directWriteMode && selectedComponents.length > 0) {
      showNotification(`Would write: ${cssLine}`);
    } else {
      try {
        await navigator.clipboard.writeText(cssLine);
        showNotification(`Copied: ${cssLine}`);
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
      }
    }

    setShowCustomPicker(false);
    setActiveProperty(null);
  }, [activeProperty, customColor, directWriteMode, selectedComponents, showNotification]);

  // Only show when colors panel is active
  if (activePanel !== "colors") return null;

  const hasSelection = selectedComponents.length > 0;

  return (
    <div
      data-radflow-panel
      className="fixed right-0 top-0 bottom-0 w-80 bg-surface border-l border-edge z-40 flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-edge">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">Colors</h2>
          <button
            onClick={() => setDirectWriteMode(!directWriteMode)}
            className={`
              px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1
              ${directWriteMode ? "bg-orange-500 text-white" : "bg-background text-text-muted border border-edge"}
            `}
            title={directWriteMode ? "Direct write mode" : "Clipboard mode"}
          >
            {directWriteMode ? (
              <>
                <PencilIcon />
                Write
              </>
            ) : (
              <>
                <ClipboardIcon />
                Copy
              </>
            )}
          </button>
        </div>
        {!hasSelection && (
          <p className="text-xs text-text-muted mt-1">
            Select a component to edit colors
          </p>
        )}
      </div>

      {/* Color Properties */}
      <div className="p-4 space-y-4">
        <ColorPropertyRow
          label="Background"
          property="background"
          appliedValue={appliedColors.background}
          isActive={activeProperty === "background"}
          onActivate={() => {
            setActiveProperty(activeProperty === "background" ? null : "background");
            setShowCustomPicker(false);
          }}
          disabled={!hasSelection}
        />
        <ColorPropertyRow
          label="Text"
          property="text"
          appliedValue={appliedColors.text}
          isActive={activeProperty === "text"}
          onActivate={() => {
            setActiveProperty(activeProperty === "text" ? null : "text");
            setShowCustomPicker(false);
          }}
          disabled={!hasSelection}
        />
        <ColorPropertyRow
          label="Border"
          property="border"
          appliedValue={appliedColors.border}
          isActive={activeProperty === "border"}
          onActivate={() => {
            setActiveProperty(activeProperty === "border" ? null : "border");
            setShowCustomPicker(false);
          }}
          disabled={!hasSelection}
        />
      </div>

      {/* Token Picker (shown when property is active) */}
      {activeProperty && !showCustomPicker && (
        <div className="flex-1 flex flex-col border-t border-edge overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-edge">
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-background border border-edge rounded focus:outline-none focus:border-accent"
            />
          </div>

          {/* Tokens List */}
          <div className="flex-1 overflow-auto">
            {tokensLoading ? (
              <div className="p-4 text-center text-text-muted text-sm">
                Loading tokens...
              </div>
            ) : colorTokens.length === 0 ? (
              <div className="p-4 text-center text-text-muted text-sm">
                <p>No color tokens found</p>
                <p className="text-xs mt-1">Load a CSS file with @theme tokens</p>
              </div>
            ) : filteredTokens.length === 0 ? (
              <div className="p-4 text-center text-text-muted text-sm">
                No tokens match "{searchQuery}"
              </div>
            ) : (
              Array.from(groupedTokens.entries()).map(([category, tokens]) => (
                <div key={category}>
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-text-muted bg-background/50">
                    {category}
                  </div>
                  {tokens.map((token) => (
                    <button
                      key={token.name}
                      onClick={() => applyToken(token)}
                      className="w-full text-left px-3 py-2 hover:bg-background/50 transition-colors flex items-center gap-3"
                    >
                      <div
                        className="w-6 h-6 rounded border border-edge flex-shrink-0"
                        style={{ backgroundColor: token.value }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-mono truncate text-text">
                          {token.name}
                        </div>
                        <div className="text-[10px] text-text-muted truncate">
                          {token.value}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Custom Color Fallback */}
          <div className="p-3 border-t border-edge">
            <button
              onClick={() => setShowCustomPicker(true)}
              className="w-full text-left px-3 py-2 bg-background rounded border border-edge hover:border-accent transition-colors flex items-center gap-2"
            >
              <div className="w-5 h-5 rounded border border-edge bg-gradient-to-br from-red-500 via-green-500 to-blue-500" />
              <span className="text-sm text-text">Use custom color</span>
              <span className="text-[10px] text-yellow-600 ml-auto">
                (not recommended)
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Custom Color Picker */}
      {activeProperty && showCustomPicker && (
        <div className="flex-1 flex flex-col border-t border-edge overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setShowCustomPicker(false)}
                className="text-sm text-accent hover:underline flex items-center gap-1"
              >
                <span>&#8592;</span> Back to tokens
              </button>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-700">
                <strong>Warning:</strong> Using inline colors instead of design tokens
                reduces consistency and maintainability.
              </p>
            </div>

            <div className="flex justify-center mb-4">
              <HexColorPicker color={customColor} onChange={setCustomColor} />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-text-muted">#</span>
              <HexColorInput
                color={customColor}
                onChange={setCustomColor}
                className="flex-1 px-2 py-1.5 text-sm font-mono bg-background border border-edge rounded focus:outline-none focus:border-accent"
              />
              <div
                className="w-8 h-8 rounded border border-edge"
                style={{ backgroundColor: customColor }}
              />
            </div>

            <button
              onClick={applyCustomColor}
              className="w-full px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              Apply {customColor}
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-edge text-[10px] text-text-muted">
        {directWriteMode
          ? "Changes write directly to source files"
          : "Click token to copy CSS to clipboard"}
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

// Helper Components

interface ColorPropertyRowProps {
  label: string;
  property: ColorProperty;
  appliedValue: string | null;
  isActive: boolean;
  onActivate: () => void;
  disabled?: boolean;
}

function ColorPropertyRow({
  label,
  property,
  appliedValue,
  isActive,
  onActivate,
  disabled,
}: ColorPropertyRowProps) {
  return (
    <div className={`${disabled ? "opacity-50" : ""}`}>
      <label className="text-xs font-medium text-text-muted block mb-1.5">
        {label} Color
      </label>
      <button
        onClick={onActivate}
        disabled={disabled}
        className={`
          w-full px-3 py-2 rounded-lg border text-left flex items-center gap-2 transition-colors
          ${isActive
            ? "border-accent bg-accent/10"
            : "border-edge bg-background hover:border-accent/50"
          }
          ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <ColorSwatch value={appliedValue} property={property} />
        <span className="flex-1 text-sm font-mono truncate text-text">
          {appliedValue || `Select ${property} color`}
        </span>
        <span className="text-text-muted text-xs">{isActive ? "▲" : "▼"}</span>
      </button>
    </div>
  );
}

function ColorSwatch({
  value,
  property,
}: {
  value: string | null;
  property: ColorProperty;
}) {
  // Default preview colors for each property type
  const defaults: Record<ColorProperty, string> = {
    background: "#e5e7eb",
    text: "#374151",
    border: "#d1d5db",
  };

  const displayColor = value?.startsWith("#")
    ? value
    : value
    ? "var(--color-accent, #3b82f6)" // Token reference - show accent as indicator
    : defaults[property];

  return (
    <div
      className="w-6 h-6 rounded border border-edge flex-shrink-0"
      style={{ backgroundColor: displayColor }}
    />
  );
}

// Icons

function PencilIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
      />
    </svg>
  );
}

// Utility Functions

function isColorValue(name: string, value: string): boolean {
  // Check if it looks like a color value
  if (
    value.startsWith("#") ||
    value.startsWith("rgb") ||
    value.startsWith("hsl") ||
    value.startsWith("oklch") ||
    value.startsWith("oklab")
  ) {
    return true;
  }

  // Check if name suggests it's a color
  const colorKeywords = [
    "color",
    "background",
    "bg",
    "text",
    "border",
    "fill",
    "stroke",
    "accent",
    "primary",
    "secondary",
    "surface",
    "muted",
    "foreground",
  ];

  return colorKeywords.some((keyword) => name.toLowerCase().includes(keyword));
}

function getCategoryFromName(name: string): string {
  const lower = name.toLowerCase();

  if (lower.includes("background") || lower.includes("bg")) return "background";
  if (lower.includes("text") || lower.includes("foreground")) return "text";
  if (lower.includes("border") || lower.includes("edge")) return "border";
  if (lower.includes("accent") || lower.includes("primary")) return "accent";
  if (lower.includes("surface")) return "surface";
  if (lower.includes("muted")) return "muted";

  return "other";
}

function getCssProperty(property: ColorProperty): string {
  switch (property) {
    case "background":
      return "background-color";
    case "text":
      return "color";
    case "border":
      return "border-color";
  }
}
