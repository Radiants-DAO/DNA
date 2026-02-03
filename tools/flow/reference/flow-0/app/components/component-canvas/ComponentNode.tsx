import { useCallback, useMemo } from "react";
import type { ComponentCanvasNode, PropDefinition, SlotDefinition } from "../../types/componentCanvas";
import { Component, Layers, Code, Sliders } from "../ui/icons";
import { CanvasComponentPreview } from "./CanvasComponentPreview";

interface ComponentNodeProps {
  /** The component canvas node to render */
  node: ComponentCanvasNode;
  /** Whether this node is selected */
  isSelected: boolean;
  /** Whether this node has keyboard focus */
  isFocused: boolean;
  /** Selection callback */
  onSelect: (id: string, modifiers: { cmd: boolean; shift: boolean }) => void;
  /** Double-click callback (for zoom-to-fit or expand details) */
  onDoubleClick: (node: ComponentCanvasNode) => void;
  /** Whether preview is enabled */
  previewEnabled?: boolean;
  /** Preview server URL (null = no server available) */
  previewServerUrl?: string | null;
  /** Callback to toggle preview */
  onTogglePreview?: (nodeId: string) => void;
}

/**
 * Build CSS class string for the component node based on visual states.
 */
function buildNodeClassName(isSelected: boolean, isFocused: boolean): string {
  const classes = [
    "component-node",
    "absolute",
    "flex",
    "flex-col",
    "rounded-lg",
    "cursor-pointer",
    "overflow-hidden",
    "transition-all",
    "duration-150",
  ];

  if (isSelected) {
    classes.push("component-node--selected");
  }

  if (isFocused) {
    classes.push("component-node--focused");
  }

  return classes.join(" ");
}

/**
 * Get props as an array for display
 */
function getPropsArray(props: Record<string, PropDefinition>): string[] {
  return Object.keys(props);
}

/**
 * Get slots as an array for display
 */
function getSlotsArray(slots: Record<string, SlotDefinition> | string[]): string[] {
  if (Array.isArray(slots)) {
    return slots;
  }
  return Object.keys(slots);
}

/**
 * Format props summary for display
 */
function formatPropsSummary(props: Record<string, PropDefinition>, maxDisplay: number = 3): string {
  const propNames = getPropsArray(props);
  if (propNames.length === 0) return "None";

  const displayed = propNames.slice(0, maxDisplay);
  const remaining = propNames.length - maxDisplay;

  if (remaining > 0) {
    return `${displayed.join(", ")}, +${remaining}`;
  }
  return displayed.join(", ");
}

/**
 * Format slots summary for display
 */
function formatSlotsSummary(slots: Record<string, SlotDefinition> | string[], maxDisplay: number = 2): string {
  const slotNames = getSlotsArray(slots);
  if (slotNames.length === 0) return "None";

  const displayed = slotNames.slice(0, maxDisplay);
  const remaining = slotNames.length - maxDisplay;

  if (remaining > 0) {
    return `${displayed.join(", ")}, +${remaining}`;
  }
  return displayed.join(", ");
}

/**
 * ComponentNode displays a single component schema as a card on the canvas.
 *
 * Visual structure:
 * ┌─────────────────────────────┐
 * │  [Icon] Button              │  <- Component name with icon
 * ├─────────────────────────────┤
 * │  Props: variant, size, ...  │  <- Prop names (truncated)
 * │  Slots: children, icon      │  <- Slot names
 * │  Examples: 5                │  <- Example count
 * ├─────────────────────────────┤
 * │  4 variants | 9 props       │  <- Summary stats
 * └─────────────────────────────┘
 */
export function ComponentNode({
  node,
  isSelected,
  isFocused,
  onSelect,
  onDoubleClick,
  previewEnabled,
  previewServerUrl,
  onTogglePreview,
}: ComponentNodeProps): React.ReactElement {
  const { schema } = node;

  // Compute stats and summaries
  const propCount = useMemo(() => Object.keys(schema.props).length, [schema.props]);
  const slotCount = useMemo(() => getSlotsArray(schema.slots).length, [schema.slots]);
  const exampleCount = schema.examples.length;
  const variantCount = node.dna ? Object.keys(node.dna.tokenBindings).length : 0;

  const propsSummary = useMemo(
    () => formatPropsSummary(schema.props),
    [schema.props]
  );

  const slotsSummary = useMemo(
    () => formatSlotsSummary(schema.slots),
    [schema.slots]
  );

  // Build class name
  const nodeClassName = useMemo(
    () => buildNodeClassName(isSelected, isFocused),
    [isSelected, isFocused]
  );

  // Click handler
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(node.id, {
        cmd: e.metaKey || e.ctrlKey,
        shift: e.shiftKey,
      });
    },
    [node.id, onSelect]
  );

  // Double-click handler
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDoubleClick(node);
    },
    [node, onDoubleClick]
  );

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onDoubleClick(node);
      }
    },
    [node, onDoubleClick]
  );

  // Determine if node has DNA config
  const hasDna = !!node.dna;

  return (
    <div
      role="button"
      aria-selected={isSelected}
      tabIndex={isFocused ? 0 : -1}
      className={nodeClassName}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        zIndex: isSelected || isFocused ? 3 : 2,
        backgroundColor: "#1a1a1a",
        border: isSelected
          ? "1px solid rgba(59, 130, 246, 0.8)"
          : isFocused
          ? "1px solid rgba(255, 255, 255, 0.3)"
          : "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: isSelected
          ? "0 0 0 2px rgba(59, 130, 246, 0.3), 0 4px 12px rgba(0, 0, 0, 0.4)"
          : "0 2px 8px rgba(0, 0, 0, 0.3)",
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Header: Component name */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-b"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          borderColor: "rgba(255, 255, 255, 0.08)",
        }}
      >
        <Component size={16} className="text-[rgba(255,255,255,0.6)] flex-shrink-0" />
        <span className="flex-1 truncate text-sm font-medium text-[rgba(255,255,255,0.95)]">
          {schema.name}
        </span>
        {hasDna && (
          <div
            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
            style={{
              backgroundColor: "rgba(34, 197, 94, 0.15)",
              color: "rgba(34, 197, 94, 0.9)",
            }}
            title="Has DNA token bindings"
          >
            DNA
          </div>
        )}
        {previewServerUrl && onTogglePreview && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePreview(node.id);
            }}
            className="p-0.5 rounded hover:bg-white/10 transition-colors"
            title={previewEnabled ? "Hide preview" : "Show preview"}
            style={{
              color: previewEnabled ? "rgba(59, 130, 246, 0.9)" : "rgba(255, 255, 255, 0.4)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        )}
      </div>

      {/* Live preview iframe */}
      {previewEnabled && previewServerUrl && (
        <div className="flex-1 min-h-0">
          <CanvasComponentPreview
            componentName={schema.name}
            nodeId={node.id}
            serverUrl={previewServerUrl}
            width={node.width - 2}
            height={80}
          />
        </div>
      )}

      {/* Body: Props, Slots, Examples */}
      <div className="flex-1 px-3 py-2 space-y-1.5 overflow-hidden">
        {/* Props row */}
        <div className="flex items-start gap-2 text-xs">
          <Sliders size={12} className="text-[rgba(255,255,255,0.4)] flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="text-[rgba(255,255,255,0.5)]">Props: </span>
            <span className="text-[rgba(255,255,255,0.8)] truncate">
              {propsSummary}
            </span>
          </div>
        </div>

        {/* Slots row */}
        <div className="flex items-start gap-2 text-xs">
          <Layers size={12} className="text-[rgba(255,255,255,0.4)] flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="text-[rgba(255,255,255,0.5)]">Slots: </span>
            <span className="text-[rgba(255,255,255,0.8)] truncate">
              {slotsSummary}
            </span>
          </div>
        </div>

        {/* Examples row */}
        <div className="flex items-start gap-2 text-xs">
          <Code size={12} className="text-[rgba(255,255,255,0.4)] flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="text-[rgba(255,255,255,0.5)]">Examples: </span>
            <span className="text-[rgba(255,255,255,0.8)]">
              {exampleCount}
            </span>
          </div>
        </div>

        {/* Description (truncated) */}
        {schema.description && (
          <p
            className="text-[10px] leading-tight mt-1 line-clamp-2"
            style={{ color: "rgba(255, 255, 255, 0.5)" }}
            title={schema.description}
          >
            {schema.description}
          </p>
        )}
      </div>

      {/* Footer: Summary stats */}
      <div
        className="flex items-center justify-between px-3 py-2 text-[10px] border-t"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.2)",
          borderColor: "rgba(255, 255, 255, 0.08)",
          color: "rgba(255, 255, 255, 0.5)",
        }}
      >
        <span>
          {variantCount > 0 ? `${variantCount} variant${variantCount !== 1 ? "s" : ""}` : "No variants"}
        </span>
        <span className="mx-2">|</span>
        <span>
          {propCount} prop{propCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

export default ComponentNode;
