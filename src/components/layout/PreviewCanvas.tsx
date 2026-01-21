import { useRef, useState, useEffect, useMemo } from "react";
import { useAppStore } from "../../stores/appStore";
import { useBridgeConnection } from "../../hooks/useBridgeConnection";
import { useCanvasRect } from "../../hooks/useCanvasRect";
import { CanvasTools } from "../canvas/CanvasTools";
import type { SerializedComponentEntry, BridgeConnectionStatus, PreviewViewMode } from "../../stores/types";

/**
 * Feature detection for iframe credentialless attribute (fn-2-gnc.10)
 *
 * The credentialless attribute isolates the iframe from the parent's credentials,
 * providing enhanced security for cross-origin content.
 *
 * Browser support:
 * - Chrome 110+ supported
 * - Firefox: Not supported
 * - Safari: Not supported
 *
 * Based on Webstudio's canvas-iframe.tsx pattern (AGPL-3.0).
 */
const supportsCredentialless = typeof HTMLIFrameElement !== "undefined" &&
  "credentialless" in HTMLIFrameElement.prototype;

/**
 * PreviewCanvas - Center area for live component preview via iframe
 *
 * Features:
 * - Embeds target project dev server in iframe
 * - Communicates with @radflow/bridge via postMessage
 * - Component grid overview when nothing selected
 * - Variant grid view for showing all prop variations
 * - Respects viewport width from breakpoint selector
 * - Auto-refresh on file changes
 * - Canvas rect tracking for overlay positioning (fn-2-gnc.10)
 * - Credentialless iframe security (with feature detection)
 * - Pointer events toggle for edit/preview modes
 *
 * Merged from fn-7: Full iframe preview with bridge connection
 * Security upgrades from fn-2-gnc.10 (based on Webstudio AGPL-3.0)
 */
export function PreviewCanvas() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewBg, setPreviewBg] = useState<"dark" | "light">("dark");

  // Store state
  const viewportWidth = useAppStore((s) => s.viewportWidth);
  const activeBreakpoint = useAppStore((s) => s.activeBreakpoint);
  const customWidth = useAppStore((s) => s.customWidth);
  const targetUrl = useAppStore((s) => s.targetUrl);
  const bridgeStatus = useAppStore((s) => s.bridgeStatus);
  const bridgeVersion = useAppStore((s) => s.bridgeVersion);
  const bridgeComponentMap = useAppStore((s) => s.bridgeComponentMap);
  const bridgeSelection = useAppStore((s) => s.bridgeSelection);
  const bridgeHoveredId = useAppStore((s) => s.bridgeHoveredId);
  const previewViewMode = useAppStore((s) => s.previewViewMode);
  const variantComponent = useAppStore((s) => s.variantComponent);
  const refreshKey = useAppStore((s) => s.refreshKey);
  const lastFileEvent = useAppStore((s) => s.lastFileEvent);

  // Canvas rect tracking state (fn-2-gnc.10)
  const canvasEditMode = useAppStore((s) => s.canvasEditMode);
  const canvasScale = useAppStore((s) => s.canvasScale);

  // Store actions
  const setTargetUrl = useAppStore((s) => s.setTargetUrl);
  const selectById = useAppStore((s) => s.selectById);
  const clearBridgeSelection = useAppStore((s) => s.clearBridgeSelection);
  const setPreviewViewMode = useAppStore((s) => s.setPreviewViewMode);
  const setVariantComponent = useAppStore((s) => s.setVariantComponent);
  const refreshPreview = useAppStore((s) => s.refreshPreview);

  // Canvas rect tracking hook (fn-2-gnc.10)
  // Tracks iframe dimensions for overlay positioning
  const { forceUpdate: forceRectUpdate } = useCanvasRect(iframeRef);

  // Get targetOrigin from targetUrl
  const targetOrigin = useMemo(() => {
    if (!targetUrl) return "";
    try {
      return new URL(targetUrl).origin;
    } catch {
      return "";
    }
  }, [targetUrl]);

  // Bridge connection hook
  const { highlightComponent, clearHighlight } = useBridgeConnection(iframeRef, targetOrigin);

  // Auto-refresh on file changes
  useEffect(() => {
    if (lastFileEvent && bridgeStatus === "connected") {
      refreshPreview();
    }
  }, [lastFileEvent, bridgeStatus, refreshPreview]);

  // Highlight hovered component in iframe
  useEffect(() => {
    if (bridgeHoveredId) {
      highlightComponent(bridgeHoveredId);
    } else {
      clearHighlight();
    }
  }, [bridgeHoveredId, highlightComponent, clearHighlight]);

  // Determine if we're showing a constrained width
  const isConstrained = viewportWidth !== null;

  // Get unique component names from bridge map
  const componentNames = useMemo(() => {
    const names = new Set<string>();
    bridgeComponentMap.forEach((entry) => {
      if (entry.name && entry.name !== "anonymous") {
        names.add(entry.name);
      }
    });
    return Array.from(names).sort();
  }, [bridgeComponentMap]);

  // Get selected component entry
  const selectedEntry = useMemo(() => {
    if (!bridgeSelection) return undefined;
    return bridgeComponentMap.find((e) => e.radflowId === bridgeSelection.radflowId);
  }, [bridgeComponentMap, bridgeSelection]);

  // Handle back to grid
  const handleBackToGrid = () => {
    clearBridgeSelection();
    setVariantComponent(null);
    setPreviewViewMode("grid");
  };

  // Handle component selection from grid
  const handleSelectComponent = (name: string) => {
    setVariantComponent(name);
  };

  // Handle variant selection
  const handleSelectVariant = (radflowId: string) => {
    selectById(radflowId);
  };

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden" data-devflow-id="preview-canvas">
      {/* Preview Toolbar */}
      <PreviewToolbar
        selectedEntry={selectedEntry}
        bridgeStatus={bridgeStatus}
        bridgeVersion={bridgeVersion}
        previewViewMode={previewViewMode}
        previewBg={previewBg}
        setPreviewBg={setPreviewBg}
        onBackToGrid={handleBackToGrid}
        onRefresh={refreshPreview}
      />

      {/* Preview Container (fn-2-gnc.10) */}
      {/* CSS variable --canvas-pointer-events controls whether iframe or overlays receive clicks */}
      <div
        className={`flex-1 overflow-auto ${
          isConstrained ? "flex items-start justify-center p-4" : ""
        } ${previewBg === "dark" ? "bg-gray-900" : "bg-gray-100"}`}
        style={{
          // CSS variable for pointer events toggle (fn-2-gnc.10)
          // Overlays can use: pointer-events: var(--canvas-pointer-events)
          "--canvas-pointer-events": canvasEditMode ? "auto" : "none",
        } as React.CSSProperties}
      >
        {/* Viewport wrapper - applies width constraint */}
        <div
          className={`${
            isConstrained
              ? "border border-white/10 shadow-2xl transition-all duration-200 bg-white"
              : "h-full w-full"
          }`}
          style={
            isConstrained
              ? {
                  width: `${viewportWidth}px`,
                  maxWidth: "100%",
                  minHeight: "400px",
                }
              : undefined
          }
        >
          {targetUrl ? (
            // Live iframe preview with security upgrades (fn-2-gnc.10)
            // credentialless isolates credentials (Chrome 110+), sandbox provides fallback
            // Based on Webstudio's canvas-iframe.tsx pattern (AGPL-3.0)
            <div className="relative w-full h-full">
              <iframe
                ref={iframeRef}
                key={refreshKey} // Forces reload on refreshKey change
                src={targetUrl}
                className="w-full h-full border-0"
                style={{
                  minHeight: isConstrained ? "400px" : "100%",
                  // Pointer events toggle: none in edit mode allows overlays to receive clicks,
                  // auto in preview mode allows iframe interaction
                  pointerEvents: canvasEditMode ? "none" : "auto",
                  // Apply scale transform if not 1
                  transform: canvasScale !== 1 ? `scale(${canvasScale})` : undefined,
                  transformOrigin: "top left",
                }}
                title="Target Project Preview"
                // Security: credentialless attribute when supported (Chrome 110+)
                // Isolates iframe from parent credentials for enhanced security
                // Falls back to sandbox-only for Firefox/Safari
                {...(supportsCredentialless && { credentialless: "true" })}
                // Sandbox provides baseline security for all browsers
                // allow-same-origin required for postMessage communication with bridge
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                // Update canvas rect when iframe loads (fn-2-gnc.10)
                onLoad={forceRectUpdate}
              />
              {/* Canvas interaction overlays (fn-2-gnc.9) */}
              {/* Renders selection/hover outlines, handles event interception */}
              <CanvasTools iframeRef={iframeRef} scale={canvasScale} />
            </div>
          ) : previewViewMode === "variants" && variantComponent ? (
            // Variant grid view
            <VariantGridView
              componentName={variantComponent}
              entries={bridgeComponentMap.filter(
                (e) => e.name === variantComponent
              )}
              onSelectVariant={handleSelectVariant}
            />
          ) : previewViewMode === "focused" && selectedEntry ? (
            // Focused component view
            <FocusedComponentView entry={selectedEntry} />
          ) : (
            // Component grid overview (default)
            <ComponentGridView
              componentNames={componentNames}
              entries={bridgeComponentMap}
              onSelectComponent={handleSelectComponent}
            />
          )}
        </div>
      </div>

      {/* Preview Status Bar */}
      <PreviewStatusBar
        targetUrl={targetUrl}
        selectedEntry={selectedEntry}
        bridgeStatus={bridgeStatus}
        componentCount={bridgeComponentMap.length}
        viewportWidth={viewportWidth}
        activeBreakpoint={activeBreakpoint}
        customWidth={customWidth}
        canvasScale={canvasScale}
        canvasEditMode={canvasEditMode}
        onSetTargetUrl={setTargetUrl}
      />
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface PreviewToolbarProps {
  selectedEntry: SerializedComponentEntry | undefined;
  bridgeStatus: BridgeConnectionStatus;
  bridgeVersion: string | null;
  previewViewMode: PreviewViewMode;
  previewBg: "dark" | "light";
  setPreviewBg: (bg: "dark" | "light") => void;
  onBackToGrid: () => void;
  onRefresh: () => void;
}

function PreviewToolbar({
  selectedEntry,
  bridgeStatus,
  bridgeVersion,
  previewViewMode,
  previewBg,
  setPreviewBg,
  onBackToGrid,
  onRefresh,
}: PreviewToolbarProps) {
  return (
    <div className="h-10 bg-surface/50 border-b border-white/5 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        {/* Back button when not in grid view */}
        {previewViewMode !== "grid" && (
          <button
            onClick={onBackToGrid}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text"
          >
            <ChevronLeftIcon />
            Back
          </button>
        )}

        {/* Component name / status */}
        <span className="text-xs text-text-muted">
          {selectedEntry?.displayName || selectedEntry?.name || (
            bridgeStatus === "connected"
              ? "Select a component to edit"
              : bridgeStatus === "connecting"
                ? "Connecting to bridge..."
                : bridgeStatus === "error"
                  ? "Connection failed"
                  : "No project loaded"
          )}
        </span>

        {/* Bridge status indicator */}
        <BridgeStatusBadge status={bridgeStatus} version={bridgeVersion} />
      </div>

      <div className="flex items-center gap-2">
        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="p-1.5 rounded hover:bg-background/50 text-text-muted hover:text-text"
          title="Refresh preview"
        >
          <RefreshIcon />
        </button>

        {/* Background toggle */}
        <div className="flex gap-1 bg-background/50 rounded-md p-0.5">
          <button
            onClick={() => setPreviewBg("dark")}
            className={`w-6 h-6 rounded-md transition-all ${
              previewBg === "dark"
                ? "bg-gray-800 ring-2 ring-primary"
                : "bg-gray-800 hover:ring-1 hover:ring-white/20"
            }`}
            title="Dark background"
          />
          <button
            onClick={() => setPreviewBg("light")}
            className={`w-6 h-6 rounded-md transition-all ${
              previewBg === "light"
                ? "bg-gray-200 ring-2 ring-primary"
                : "bg-gray-200 hover:ring-1 hover:ring-black/20"
            }`}
            title="Light background"
          />
        </div>
      </div>
    </div>
  );
}

interface BridgeStatusBadgeProps {
  status: BridgeConnectionStatus;
  version: string | null;
}

function BridgeStatusBadge({ status, version }: BridgeStatusBadgeProps) {
  const colors: Record<BridgeConnectionStatus, string> = {
    disconnected: "bg-gray-500",
    connecting: "bg-yellow-500 animate-pulse",
    connected: "bg-green-500",
    error: "bg-red-500",
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${colors[status]}`} />
      {version && status === "connected" && (
        <span className="text-xs text-text-muted font-mono">v{version}</span>
      )}
    </div>
  );
}

interface PreviewStatusBarProps {
  targetUrl: string | null;
  selectedEntry: SerializedComponentEntry | undefined;
  bridgeStatus: BridgeConnectionStatus;
  componentCount: number;
  viewportWidth: number | null;
  activeBreakpoint: string | null;
  customWidth: number | null;
  canvasScale: number;
  canvasEditMode: boolean;
  onSetTargetUrl: (url: string | null) => void;
}

function PreviewStatusBar({
  targetUrl,
  selectedEntry,
  bridgeStatus,
  componentCount,
  viewportWidth,
  activeBreakpoint,
  customWidth,
  canvasScale,
  canvasEditMode,
  onSetTargetUrl,
}: PreviewStatusBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [urlInput, setUrlInput] = useState(targetUrl || "http://localhost:3000");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onSetTargetUrl(urlInput.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="h-6 bg-surface/50 border-t border-white/5 flex items-center justify-between px-4">
      {/* Left: Source file or URL input */}
      <div className="flex items-center gap-2">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-1">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="text-xs font-mono bg-background/50 border border-white/10 rounded px-2 py-0.5 w-48 focus:outline-none focus:border-primary"
              placeholder="http://localhost:3000"
              autoFocus
              onBlur={() => setIsEditing(false)}
            />
          </form>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-text-muted font-mono hover:text-text"
          >
            {selectedEntry?.source?.relativePath || targetUrl || "Click to set dev server URL"}
          </button>
        )}
      </div>

      {/* Right: Stats */}
      <div className="flex items-center gap-4 text-xs text-text-muted">
        {/* Edit/Preview mode indicator (fn-2-gnc.10) */}
        <span className={canvasEditMode ? "text-primary" : "text-green-500"}>
          {canvasEditMode ? "Edit" : "Preview"}
        </span>

        {/* Scale indicator (fn-2-gnc.10) */}
        {canvasScale !== 1 && (
          <span className="font-mono">{Math.round(canvasScale * 100)}%</span>
        )}

        {/* Component count */}
        {bridgeStatus === "connected" && (
          <span>{componentCount} components</span>
        )}

        {/* Viewport indicator */}
        {viewportWidth && (
          <span className="font-mono">
            {activeBreakpoint ? `@${activeBreakpoint}` : ""} {viewportWidth}px
            {customWidth !== null && " (custom)"}
          </span>
        )}
      </div>
    </div>
  );
}

interface ComponentGridViewProps {
  componentNames: string[];
  entries: SerializedComponentEntry[];
  onSelectComponent: (name: string) => void;
}

function ComponentGridView({
  componentNames,
  entries,
  onSelectComponent,
}: ComponentGridViewProps) {
  // Group entries by component name
  const componentGroups = useMemo(() => {
    const groups: Record<string, SerializedComponentEntry[]> = {};
    entries.forEach((entry) => {
      const name = entry.name || "anonymous";
      if (!groups[name]) groups[name] = [];
      groups[name].push(entry);
    });
    return groups;
  }, [entries]);

  // Use componentNames if available, otherwise show placeholder
  const displayNames =
    componentNames.length > 0
      ? componentNames
      : ["Button", "Input", "Card", "Dialog", "Tabs", "Badge"]; // Placeholders

  return (
    <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto p-8">
      {displayNames.map((name) => {
        const group = componentGroups[name] || [];
        const instanceCount = group.length;

        return (
          <div
            key={name}
            onClick={() => onSelectComponent(name)}
            className="bg-surface/50 rounded-lg p-6 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
          >
            <div className="h-24 flex items-center justify-center mb-4">
              {/* Component preview placeholder */}
              <div className="bg-primary/20 text-primary px-4 py-2 rounded-md text-sm">
                {name}
              </div>
            </div>
            <div className="text-sm font-medium text-text">{name}</div>
            <div className="text-xs text-text-muted">
              {instanceCount > 0
                ? `${instanceCount} instance${instanceCount !== 1 ? "s" : ""}`
                : "Component"}
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {componentNames.length === 0 && entries.length === 0 && (
        <div className="col-span-3 text-center py-12">
          <p className="text-text-muted mb-2">No components detected</p>
          <p className="text-xs text-text-muted/70">
            Set a dev server URL to load your project
          </p>
        </div>
      )}
    </div>
  );
}

interface VariantGridViewProps {
  componentName: string;
  entries: SerializedComponentEntry[];
  onSelectVariant: (id: string) => void;
}

function VariantGridView({
  componentName,
  entries,
  onSelectVariant,
}: VariantGridViewProps) {
  // Generate variants based on props
  const variants = useMemo(() => {
    // Get unique prop combinations
    const seen = new Set<string>();
    return entries.filter((entry) => {
      const key = JSON.stringify(entry.props);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [entries]);

  return (
    <div className="p-8">
      <h2 className="text-lg font-medium text-text mb-6">
        {componentName} Variants
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {variants.map((entry, index) => (
          <div
            key={entry.radflowId}
            onClick={() => onSelectVariant(entry.radflowId)}
            className="bg-surface/50 rounded-lg p-4 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
          >
            <div className="h-20 flex items-center justify-center mb-3 bg-background/50 rounded">
              {/* Variant preview */}
              <div className="bg-primary/20 text-primary px-3 py-1.5 rounded text-sm">
                {componentName}
              </div>
            </div>

            <div className="text-xs text-text-muted">
              Variant {index + 1}
            </div>

            {/* Show key props */}
            {Object.keys(entry.props).length > 0 && (
              <div className="mt-2 text-xs font-mono text-text-muted/70 truncate">
                {Object.entries(entry.props)
                  .slice(0, 2)
                  .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
                  .join(", ")}
              </div>
            )}
          </div>
        ))}
      </div>

      {variants.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-muted">No variants found</p>
        </div>
      )}
    </div>
  );
}

interface FocusedComponentViewProps {
  entry: SerializedComponentEntry;
}

function FocusedComponentView({ entry }: FocusedComponentViewProps) {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="text-center max-w-md">
        {/* Component preview */}
        <div className="bg-surface/50 rounded-lg p-8 mb-4">
          <div className="bg-primary text-white px-6 py-3 rounded-lg text-sm font-medium">
            {entry.displayName || entry.name}
          </div>
        </div>

        {/* Component info */}
        <div className="text-left bg-surface/30 rounded-lg p-4 text-xs">
          <div className="flex justify-between mb-2">
            <span className="text-text-muted">ID:</span>
            <span className="font-mono text-text">{entry.radflowId}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-text-muted">Type:</span>
            <span className="font-mono text-text">{entry.fiberType}</span>
          </div>
          {entry.source && (
            <div className="flex justify-between">
              <span className="text-text-muted">Source:</span>
              <span className="font-mono text-text truncate ml-2">
                {entry.source.relativePath}:{entry.source.line}
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-text-muted mt-4">
          Click elements in the preview to select them
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Icons
// ============================================================================

function ChevronLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

export default PreviewCanvas;
