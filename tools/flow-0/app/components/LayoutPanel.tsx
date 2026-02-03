import { useState, useCallback } from "react";
import { Clipboard } from "./ui/icons";
import { useAppStore } from "../stores/appStore";

type DisplayType = "block" | "flex" | "grid" | "none";
type FlexDirection = "row" | "row-reverse" | "column" | "column-reverse";
type FlexWrap = "nowrap" | "wrap" | "wrap-reverse";
type AlignItems = "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
type JustifyContent =
  | "flex-start"
  | "center"
  | "flex-end"
  | "space-between"
  | "space-around"
  | "space-evenly";

interface LayoutState {
  display: DisplayType | null;
  flexDirection: FlexDirection | null;
  flexWrap: FlexWrap | null;
  alignItems: AlignItems | null;
  justifyContent: JustifyContent | null;
  gridColumns: string | null;
  gridRows: string | null;
  gap: string | null;
}

/**
 * Layout Panel - Property panel for editing display, flex, and grid properties.
 *
 * Features:
 * - Display (flex, grid, block, none)
 * - Flex: direction, wrap, align, justify
 * - Grid: columns, rows
 * - Gap control
 * - Visual preview of layout
 * - Output to clipboard (direct write mode removed per fn-9)
 */
export function LayoutPanel() {
  const activePanel = useAppStore((s) => s.activePanel);
  const selectedComponents = useAppStore((s) => s.selectedComponents);

  const [layout, setLayout] = useState<LayoutState>({
    display: null,
    flexDirection: null,
    flexWrap: null,
    alignItems: null,
    justifyContent: null,
    gridColumns: null,
    gridRows: null,
    gap: null,
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Show toast notification
  const showNotification = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  // Apply a CSS property (copy to clipboard)
  const applyProperty = useCallback(
    async (property: string, value: string) => {
      const cssLine = `${property}: ${value};`;

      try {
        await navigator.clipboard.writeText(cssLine);
        showNotification(`Copied: ${cssLine}`);
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
      }
    },
    [showNotification]
  );

  // Handle display change
  const handleDisplayChange = useCallback(
    (display: DisplayType) => {
      setLayout((prev) => ({ ...prev, display }));
      applyProperty("display", display);
    },
    [applyProperty]
  );

  // Handle flex direction change
  const handleFlexDirection = useCallback(
    (direction: FlexDirection) => {
      setLayout((prev) => ({ ...prev, flexDirection: direction }));
      applyProperty("flex-direction", direction);
    },
    [applyProperty]
  );

  // Handle flex wrap change
  const handleFlexWrap = useCallback(
    (wrap: FlexWrap) => {
      setLayout((prev) => ({ ...prev, flexWrap: wrap }));
      applyProperty("flex-wrap", wrap);
    },
    [applyProperty]
  );

  // Handle align items change
  const handleAlignItems = useCallback(
    (align: AlignItems) => {
      setLayout((prev) => ({ ...prev, alignItems: align }));
      applyProperty("align-items", align);
    },
    [applyProperty]
  );

  // Handle justify content change
  const handleJustifyContent = useCallback(
    (justify: JustifyContent) => {
      setLayout((prev) => ({ ...prev, justifyContent: justify }));
      applyProperty("justify-content", justify);
    },
    [applyProperty]
  );

  // Handle grid columns change
  const handleGridColumns = useCallback(
    (columns: string) => {
      setLayout((prev) => ({ ...prev, gridColumns: columns }));
      applyProperty("grid-template-columns", `repeat(${columns}, 1fr)`);
    },
    [applyProperty]
  );

  // Handle grid rows change
  const handleGridRows = useCallback(
    (rows: string) => {
      setLayout((prev) => ({ ...prev, gridRows: rows }));
      applyProperty("grid-template-rows", `repeat(${rows}, 1fr)`);
    },
    [applyProperty]
  );

  // Handle gap change
  const handleGap = useCallback(
    (gap: string) => {
      setLayout((prev) => ({ ...prev, gap }));
      applyProperty("gap", gap);
    },
    [applyProperty]
  );

  // Only show when layout panel is active
  if (activePanel !== "layout") return null;

  const hasSelection = selectedComponents.length > 0;
  const isFlex = layout.display === "flex";
  const isGrid = layout.display === "grid";

  return (
    <div
      data-radflow-panel
      className="fixed right-0 top-0 bottom-0 w-80 bg-surface border-l border-edge z-40 flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-edge">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">Layout</h2>
          <div className="px-2 py-1 rounded text-xs font-medium bg-background text-text-muted border border-edge flex items-center gap-1">
            <Clipboard className="w-3 h-3" />
            Copy
          </div>
        </div>
        {!hasSelection && (
          <p className="text-xs text-text-muted mt-1">
            Select a component to edit layout
          </p>
        )}
      </div>

      {/* Layout Properties */}
      <div
        className={`p-4 space-y-4 overflow-auto flex-1 ${!hasSelection ? "opacity-50 pointer-events-none" : ""}`}
      >
        {/* Display Type */}
        <div>
          <label className="text-xs font-medium text-text-muted block mb-2">
            Display
          </label>
          <div className="flex gap-1">
            {(["block", "flex", "grid", "none"] as DisplayType[]).map(
              (type) => (
                <button
                  key={type}
                  onClick={() => handleDisplayChange(type)}
                  className={`
                  flex-1 px-2 py-2 text-xs rounded border transition-colors capitalize
                  ${
                    layout.display === type
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-edge bg-background hover:border-accent/50 text-text"
                  }
                `}
                >
                  {type}
                </button>
              )
            )}
          </div>
        </div>

        {/* Flex Options */}
        {isFlex && (
          <>
            {/* Direction */}
            <div>
              <label className="text-xs font-medium text-text-muted block mb-2">
                Direction
              </label>
              <div className="flex gap-1">
                {(
                  [
                    { value: "row", icon: "→" },
                    { value: "column", icon: "↓" },
                    { value: "row-reverse", icon: "←" },
                    { value: "column-reverse", icon: "↑" },
                  ] as { value: FlexDirection; icon: string }[]
                ).map((dir) => (
                  <button
                    key={dir.value}
                    onClick={() => handleFlexDirection(dir.value)}
                    className={`
                      flex-1 px-2 py-2 text-sm rounded border transition-colors
                      ${
                        layout.flexDirection === dir.value
                          ? "border-accent bg-accent/10"
                          : "border-edge bg-background hover:border-accent/50"
                      }
                    `}
                    title={dir.value}
                  >
                    {dir.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Wrap */}
            <div>
              <label className="text-xs font-medium text-text-muted block mb-2">
                Wrap
              </label>
              <div className="flex gap-1">
                {(["nowrap", "wrap", "wrap-reverse"] as FlexWrap[]).map(
                  (wrap) => (
                    <button
                      key={wrap}
                      onClick={() => handleFlexWrap(wrap)}
                      className={`
                      flex-1 px-2 py-2 text-xs rounded border transition-colors
                      ${
                        layout.flexWrap === wrap
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-edge bg-background hover:border-accent/50 text-text"
                      }
                    `}
                    >
                      {wrap === "nowrap" ? "No Wrap" : wrap}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Align Items */}
            <div>
              <label className="text-xs font-medium text-text-muted block mb-2">
                Align Items
              </label>
              <FlexAlignGrid
                selected={layout.alignItems}
                onSelect={handleAlignItems}
                type="align"
              />
            </div>

            {/* Justify Content */}
            <div>
              <label className="text-xs font-medium text-text-muted block mb-2">
                Justify Content
              </label>
              <div className="flex gap-1 flex-wrap">
                {(
                  [
                    { value: "flex-start", label: "Start" },
                    { value: "center", label: "Center" },
                    { value: "flex-end", label: "End" },
                    { value: "space-between", label: "Between" },
                    { value: "space-around", label: "Around" },
                    { value: "space-evenly", label: "Evenly" },
                  ] as { value: JustifyContent; label: string }[]
                ).map((j) => (
                  <button
                    key={j.value}
                    onClick={() => handleJustifyContent(j.value)}
                    className={`
                      px-2 py-1.5 text-xs rounded border transition-colors
                      ${
                        layout.justifyContent === j.value
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-edge bg-background hover:border-accent/50 text-text"
                      }
                    `}
                  >
                    {j.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Grid Options */}
        {isGrid && (
          <>
            {/* Columns */}
            <div>
              <label className="text-xs font-medium text-text-muted block mb-2">
                Columns
              </label>
              <div className="flex gap-1">
                {["1", "2", "3", "4", "6", "12"].map((cols) => (
                  <button
                    key={cols}
                    onClick={() => handleGridColumns(cols)}
                    className={`
                      flex-1 px-2 py-2 text-xs rounded border transition-colors
                      ${
                        layout.gridColumns === cols
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-edge bg-background hover:border-accent/50 text-text"
                      }
                    `}
                  >
                    {cols}
                  </button>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div>
              <label className="text-xs font-medium text-text-muted block mb-2">
                Rows
              </label>
              <div className="flex gap-1">
                {["1", "2", "3", "4", "auto"].map((rows) => (
                  <button
                    key={rows}
                    onClick={() => handleGridRows(rows)}
                    className={`
                      flex-1 px-2 py-2 text-xs rounded border transition-colors
                      ${
                        layout.gridRows === rows
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-edge bg-background hover:border-accent/50 text-text"
                      }
                    `}
                  >
                    {rows}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Gap - show for both flex and grid */}
        {(isFlex || isGrid) && (
          <div>
            <label className="text-xs font-medium text-text-muted block mb-2">
              Gap
            </label>
            <div className="flex gap-1 flex-wrap">
              {["0", "0.5rem", "1rem", "1.5rem", "2rem", "3rem"].map((gap) => (
                <button
                  key={gap}
                  onClick={() => handleGap(gap)}
                  className={`
                    px-3 py-1.5 text-xs rounded border transition-colors
                    ${
                      layout.gap === gap
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-edge bg-background hover:border-accent/50 text-text"
                    }
                  `}
                >
                  {gap}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Visual Preview */}
        {(isFlex || isGrid) && (
          <div>
            <label className="text-xs font-medium text-text-muted block mb-2">
              Preview
            </label>
            <LayoutPreview layout={layout} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-edge text-[10px] text-text-muted">
        Click option to copy CSS to clipboard
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

// Flex Align Grid Component
interface FlexAlignGridProps {
  selected: AlignItems | null;
  onSelect: (align: AlignItems) => void;
  type: "align" | "justify";
}

function FlexAlignGrid({ selected, onSelect }: FlexAlignGridProps) {
  const options: { value: AlignItems; label: string }[] = [
    { value: "flex-start", label: "Start" },
    { value: "center", label: "Center" },
    { value: "flex-end", label: "End" },
    { value: "stretch", label: "Stretch" },
    { value: "baseline", label: "Baseline" },
  ];

  return (
    <div className="flex gap-1 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className={`
            px-2 py-1.5 text-xs rounded border transition-colors
            ${
              selected === opt.value
                ? "border-accent bg-accent/10 text-accent"
                : "border-edge bg-background hover:border-accent/50 text-text"
            }
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// Layout Preview Component
interface LayoutPreviewProps {
  layout: LayoutState;
}

function LayoutPreview({ layout }: LayoutPreviewProps) {
  const style: React.CSSProperties = {
    display: layout.display || "flex",
    flexDirection: layout.flexDirection || "row",
    flexWrap: layout.flexWrap || "nowrap",
    alignItems: layout.alignItems || "stretch",
    justifyContent: layout.justifyContent || "flex-start",
    gap: layout.gap || "0.5rem",
  };

  if (layout.display === "grid") {
    style.display = "grid";
    style.gridTemplateColumns = layout.gridColumns
      ? `repeat(${layout.gridColumns}, 1fr)`
      : "repeat(2, 1fr)";
    style.gridTemplateRows = layout.gridRows
      ? `repeat(${layout.gridRows}, 1fr)`
      : "auto";
  }

  return (
    <div
      className="bg-background border border-edge rounded-lg p-3 min-h-[100px]"
      style={style}
    >
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-accent/20 border border-accent/40 rounded px-2 py-1 text-[10px] text-accent"
        >
          {i}
        </div>
      ))}
    </div>
  );
}

