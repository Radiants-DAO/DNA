import { useState, useMemo, useCallback } from "react";
import { useAppStore } from "../stores/appStore";

type TypographyProperty =
  | "fontFamily"
  | "fontSize"
  | "fontWeight"
  | "lineHeight"
  | "letterSpacing"
  | "textAlign";

interface Token {
  name: string;
  value: string;
  category?: string;
}

const FONT_WEIGHTS = [
  { label: "100 - Thin", value: "100" },
  { label: "200 - Extra Light", value: "200" },
  { label: "300 - Light", value: "300" },
  { label: "400 - Normal", value: "400" },
  { label: "500 - Medium", value: "500" },
  { label: "600 - Semibold", value: "600" },
  { label: "700 - Bold", value: "700" },
  { label: "800 - Extra Bold", value: "800" },
  { label: "900 - Black", value: "900" },
];

const TEXT_ALIGNMENTS = [
  { value: "left", icon: "≡" },
  { value: "center", icon: "≡" },
  { value: "right", icon: "≡" },
  { value: "justify", icon: "≡" },
];

/**
 * Typography Panel - Property panel for editing font properties.
 *
 * Features:
 * - Font family (from tokens)
 * - Font size (from scale tokens)
 * - Font weight
 * - Line height
 * - Letter spacing
 * - Text alignment
 * - Token picker for all values
 * - Output to clipboard or direct file write
 */
export function TypographyPanel() {
  const activePanel = useAppStore((s) => s.activePanel);
  const tokens = useAppStore((s) => s.tokens);
  const tokensLoading = useAppStore((s) => s.tokensLoading);
  const selectedComponents = useAppStore((s) => s.selectedComponents);
  const directWriteMode = useAppStore((s) => s.directWriteMode);
  const setDirectWriteMode = useAppStore((s) => s.setDirectWriteMode);

  const [activeProperty, setActiveProperty] =
    useState<TypographyProperty | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedValues, setAppliedValues] = useState<
    Record<TypographyProperty, string | null>
  >({
    fontFamily: null,
    fontSize: null,
    fontWeight: null,
    lineHeight: null,
    letterSpacing: null,
    textAlign: null,
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Extract font-related tokens
  const fontTokens = useMemo((): Token[] => {
    if (!tokens) return [];
    const allTokens: Token[] = [];

    const processTokens = (source: Partial<{ [key: string]: string }> | undefined) => {
      if (!source) return;
      for (const [name, value] of Object.entries(source)) {
        if (value && isFontToken(name, value)) {
          allTokens.push({
            name: `--${name}`,
            value,
            category: getFontCategory(name),
          });
        }
      }
    };

    processTokens(tokens.public);
    processTokens(tokens.inline);
    return allTokens;
  }, [tokens]);

  // Filter tokens by current property and search
  const filteredTokens = useMemo(() => {
    let filtered = fontTokens;

    // Filter by property type
    if (activeProperty) {
      filtered = filtered.filter((t) => {
        const cat = t.category || "";
        switch (activeProperty) {
          case "fontFamily":
            return cat === "font-family";
          case "fontSize":
            return cat === "font-size";
          case "lineHeight":
            return cat === "line-height";
          case "letterSpacing":
            return cat === "letter-spacing";
          default:
            return false;
        }
      });
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.value.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [fontTokens, activeProperty, searchQuery]);

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

      const cssProperty = getCssProperty(activeProperty);
      const cssValue = `var(${token.name})`;
      const cssLine = `${cssProperty}: ${cssValue};`;

      setAppliedValues((prev) => ({ ...prev, [activeProperty]: token.name }));

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

      setActiveProperty(null);
    },
    [activeProperty, directWriteMode, selectedComponents, showNotification]
  );

  // Apply weight from select
  const applyWeight = useCallback(
    async (weight: string) => {
      const cssLine = `font-weight: ${weight};`;
      setAppliedValues((prev) => ({ ...prev, fontWeight: weight }));

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
    },
    [directWriteMode, selectedComponents, showNotification]
  );

  // Apply text alignment
  const applyAlignment = useCallback(
    async (alignment: string) => {
      const cssLine = `text-align: ${alignment};`;
      setAppliedValues((prev) => ({ ...prev, textAlign: alignment }));

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
    },
    [directWriteMode, selectedComponents, showNotification]
  );

  // Only show when typography panel is active
  if (activePanel !== "typography") return null;

  const hasSelection = selectedComponents.length > 0;
  const showTokenPicker =
    activeProperty &&
    ["fontFamily", "fontSize", "lineHeight", "letterSpacing"].includes(
      activeProperty
    );

  return (
    <div
      data-radflow-panel
      className="fixed right-0 top-0 bottom-0 w-80 bg-surface border-l border-edge z-40 flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-edge">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">Typography</h2>
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
            Select a component to edit typography
          </p>
        )}
      </div>

      {/* Typography Properties */}
      <div className="p-4 space-y-4 overflow-auto flex-1">
        {/* Font Family */}
        <PropertyRow
          label="Font Family"
          value={appliedValues.fontFamily}
          placeholder="Select font"
          isActive={activeProperty === "fontFamily"}
          onActivate={() =>
            setActiveProperty(
              activeProperty === "fontFamily" ? null : "fontFamily"
            )
          }
          disabled={!hasSelection}
        />

        {/* Font Size */}
        <PropertyRow
          label="Font Size"
          value={appliedValues.fontSize}
          placeholder="Select size"
          isActive={activeProperty === "fontSize"}
          onActivate={() =>
            setActiveProperty(activeProperty === "fontSize" ? null : "fontSize")
          }
          disabled={!hasSelection}
        />

        {/* Font Weight */}
        <div className={`${!hasSelection ? "opacity-50" : ""}`}>
          <label className="text-xs font-medium text-text-muted block mb-1.5">
            Font Weight
          </label>
          <select
            value={appliedValues.fontWeight || ""}
            onChange={(e) => applyWeight(e.target.value)}
            disabled={!hasSelection}
            className="w-full px-3 py-2 rounded-lg border border-edge bg-background text-sm text-text focus:outline-none focus:border-accent disabled:cursor-not-allowed"
          >
            <option value="">Select weight</option>
            {FONT_WEIGHTS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </div>

        {/* Line Height */}
        <PropertyRow
          label="Line Height"
          value={appliedValues.lineHeight}
          placeholder="Select line height"
          isActive={activeProperty === "lineHeight"}
          onActivate={() =>
            setActiveProperty(
              activeProperty === "lineHeight" ? null : "lineHeight"
            )
          }
          disabled={!hasSelection}
        />

        {/* Letter Spacing */}
        <PropertyRow
          label="Letter Spacing"
          value={appliedValues.letterSpacing}
          placeholder="Select letter spacing"
          isActive={activeProperty === "letterSpacing"}
          onActivate={() =>
            setActiveProperty(
              activeProperty === "letterSpacing" ? null : "letterSpacing"
            )
          }
          disabled={!hasSelection}
        />

        {/* Text Alignment */}
        <div className={`${!hasSelection ? "opacity-50" : ""}`}>
          <label className="text-xs font-medium text-text-muted block mb-1.5">
            Text Align
          </label>
          <div className="flex gap-1">
            {TEXT_ALIGNMENTS.map((align) => (
              <button
                key={align.value}
                onClick={() => applyAlignment(align.value)}
                disabled={!hasSelection}
                className={`
                  flex-1 px-3 py-2 rounded border transition-colors
                  ${
                    appliedValues.textAlign === align.value
                      ? "border-accent bg-accent/10"
                      : "border-edge bg-background hover:border-accent/50"
                  }
                  ${!hasSelection ? "cursor-not-allowed" : "cursor-pointer"}
                `}
                title={align.value}
              >
                <AlignIcon align={align.value} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Token Picker */}
      {showTokenPicker && (
        <div className="flex-1 flex flex-col border-t border-edge overflow-hidden max-h-[50%]">
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
            ) : filteredTokens.length === 0 ? (
              <div className="p-4 text-center text-text-muted text-sm">
                <p>No tokens found</p>
                <p className="text-xs mt-1">
                  Load a CSS file with @theme tokens
                </p>
              </div>
            ) : (
              filteredTokens.map((token) => (
                <button
                  key={token.name}
                  onClick={() => applyToken(token)}
                  className="w-full text-left px-3 py-2 hover:bg-background/50 transition-colors"
                >
                  <div className="text-sm font-mono truncate text-text">
                    {token.name}
                  </div>
                  <div className="text-[10px] text-text-muted truncate">
                    {token.value}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-edge text-[10px] text-text-muted">
        {directWriteMode
          ? "Changes write directly to source files"
          : "Click property to copy CSS to clipboard"}
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

interface PropertyRowProps {
  label: string;
  value: string | null;
  placeholder: string;
  isActive: boolean;
  onActivate: () => void;
  disabled?: boolean;
}

function PropertyRow({
  label,
  value,
  placeholder,
  isActive,
  onActivate,
  disabled,
}: PropertyRowProps) {
  return (
    <div className={`${disabled ? "opacity-50" : ""}`}>
      <label className="text-xs font-medium text-text-muted block mb-1.5">
        {label}
      </label>
      <button
        onClick={onActivate}
        disabled={disabled}
        className={`
          w-full px-3 py-2 rounded-lg border text-left transition-colors
          ${
            isActive
              ? "border-accent bg-accent/10"
              : "border-edge bg-background hover:border-accent/50"
          }
          ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <span className="text-sm font-mono truncate text-text">
          {value || placeholder}
        </span>
        <span className="text-text-muted text-xs float-right">
          {isActive ? "▲" : "▼"}
        </span>
      </button>
    </div>
  );
}

function AlignIcon({ align }: { align: string }) {
  const lines = {
    left: ["w-full", "w-3/4", "w-1/2"],
    center: ["w-3/4 mx-auto", "w-full", "w-1/2 mx-auto"],
    right: ["w-full", "w-3/4 ml-auto", "w-1/2 ml-auto"],
    justify: ["w-full", "w-full", "w-3/4"],
  };

  const widths = lines[align as keyof typeof lines] || lines.left;

  return (
    <div className="flex flex-col gap-0.5 py-1">
      {widths.map((w, i) => (
        <div key={i} className={`h-0.5 bg-text-muted rounded ${w}`} />
      ))}
    </div>
  );
}

// Icons

function PencilIcon() {
  return (
    <svg
      className="w-3 h-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
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
    <svg
      className="w-3 h-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
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

function isFontToken(name: string, value: string): boolean {
  const fontKeywords = [
    "font",
    "text",
    "size",
    "leading",
    "tracking",
    "line-height",
    "letter-spacing",
  ];
  return fontKeywords.some((kw) => name.toLowerCase().includes(kw));
}

function getFontCategory(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("font-family") || lower.includes("font-sans") || lower.includes("font-serif") || lower.includes("font-mono"))
    return "font-family";
  if (lower.includes("font-size") || lower.includes("text-")) return "font-size";
  if (lower.includes("leading") || lower.includes("line-height"))
    return "line-height";
  if (lower.includes("tracking") || lower.includes("letter-spacing"))
    return "letter-spacing";
  return "other";
}

function getCssProperty(property: TypographyProperty): string {
  switch (property) {
    case "fontFamily":
      return "font-family";
    case "fontSize":
      return "font-size";
    case "fontWeight":
      return "font-weight";
    case "lineHeight":
      return "line-height";
    case "letterSpacing":
      return "letter-spacing";
    case "textAlign":
      return "text-align";
  }
}
