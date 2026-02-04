import { useState, useCallback, useMemo, useEffect } from "react";
import { sendToContent, onContentMessage } from "../api/contentBridge";
import { Search, Component, X, Copy, RefreshCw } from "./ui/icons";

/**
 * ComponentsPanel - Component Browser for the extension panel
 *
 * Displays React components detected on the inspected page.
 * Uses fiber walker data from the content script.
 *
 * Features:
 * - Component list from fiber walker
 * - Search/filter components
 * - Copy component name on click
 */

/**
 * Component data available from DOM inspection.
 * Note: This is limited to what can be extracted from data attributes:
 * - data-radflow-id: unique identifier
 * - data-component-name: optional component name
 * - Generated CSS selector for targeting
 */
interface DisplayComponent {
  radflowId: string;
  selector: string;
  componentName: string | null;
}

// ============================================================================
// Icons (inline for simplicity)
// ============================================================================

const Icons = {
  search: <Search className="w-3 h-3" />,
  component: <Component className="w-3.5 h-3.5" />,
  close: <X className="w-3.5 h-3.5" />,
  copy: <Copy className="w-3 h-3" />,
  refresh: <RefreshCw className="w-3 h-3" />,
};

// ============================================================================
// Search Input Component
// ============================================================================

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: SearchInputProps) {
  return (
    <div className="relative">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500">
        {Icons.search}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-7 pr-2 py-1.5 text-xs bg-neutral-800 border border-neutral-700 rounded outline-none focus:border-blue-500/50 placeholder:text-neutral-500/50 text-neutral-200"
      />
    </div>
  );
}

// ============================================================================
// Component Row
// ============================================================================

interface ComponentRowProps {
  component: DisplayComponent;
  isSelected: boolean;
  onSelect: () => void;
}

function ComponentRow({ component, isSelected, onSelect }: ComponentRowProps) {
  // Display name: prefer componentName, fallback to radflowId
  const displayName = component.componentName || component.radflowId;

  return (
    <button
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
        isSelected
          ? "bg-blue-500/20 text-neutral-200"
          : "hover:bg-neutral-700/50 text-neutral-400 hover:text-neutral-200"
      }`}
      onClick={onSelect}
    >
      <span className={isSelected ? "text-blue-400" : "text-green-400"}>
        {Icons.component}
      </span>
      <span className="flex-1 text-xs font-medium truncate">
        {displayName}
      </span>
      {/* Show radflowId badge when componentName is present */}
      {component.componentName && (
        <span className="text-[10px] text-neutral-500 font-mono">
          {component.radflowId}
        </span>
      )}
    </button>
  );
}

// ============================================================================
// Component Preview Panel
// ============================================================================

interface PreviewPanelProps {
  component: DisplayComponent;
  onClose: () => void;
}

function PreviewPanel({ component, onClose }: PreviewPanelProps) {
  const [copiedSelector, setCopiedSelector] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const displayName = component.componentName || component.radflowId;

  const handleCopySelector = useCallback(() => {
    navigator.clipboard.writeText(component.selector).then(() => {
      setCopiedSelector(true);
      setTimeout(() => setCopiedSelector(false), 1500);
    });
  }, [component.selector]);

  const handleCopyId = useCallback(() => {
    navigator.clipboard.writeText(component.radflowId).then(() => {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 1500);
    });
  }, [component.radflowId]);

  return (
    <div className="border-t border-neutral-700">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-700/50 bg-neutral-800/50">
        <div className="flex items-center gap-2">
          <span className="text-blue-400">{Icons.component}</span>
          <span className="text-xs font-medium text-neutral-200">{displayName}</span>
        </div>
        <button
          className="p-1 text-neutral-500 hover:text-neutral-200 rounded hover:bg-neutral-700/50 transition-colors"
          onClick={onClose}
          title="Close preview"
        >
          {Icons.close}
        </button>
      </div>

      {/* Details */}
      <div className="px-3 py-3 space-y-2">
        {/* Radflow ID */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5">
              Radflow ID
            </div>
            <span className="text-xs text-neutral-300 font-mono">
              {component.radflowId}
            </span>
          </div>
          <button
            className="p-0.5 text-neutral-500 hover:text-neutral-200 rounded hover:bg-neutral-700/50 transition-colors"
            onClick={handleCopyId}
            title="Copy radflow ID"
          >
            {copiedId ? (
              <span className="text-[10px] text-green-400">Copied!</span>
            ) : (
              Icons.copy
            )}
          </button>
        </div>

        {/* Component Name (if present) */}
        {component.componentName && (
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5">
              Component Name
            </div>
            <span className="text-xs text-neutral-300">
              {component.componentName}
            </span>
          </div>
        )}

        {/* Selector */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5">
              Selector
            </div>
            <span className="text-xs text-neutral-400 font-mono break-all">
              {component.selector}
            </span>
          </div>
          <button
            className="p-0.5 text-neutral-500 hover:text-neutral-200 rounded hover:bg-neutral-700/50 transition-colors flex-shrink-0"
            onClick={handleCopySelector}
            title="Copy selector"
          >
            {copiedSelector ? (
              <span className="text-[10px] text-green-400">Copied!</span>
            ) : (
              Icons.copy
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main ComponentsPanel Component
// ============================================================================

// Type guard for components response (component map from DOM inspection)
function isComponentMapResponse(message: unknown): message is {
  type: "component-map:result";
  payload: {
    components: Array<{
      radflowId: string;
      selector: string;
      componentName: string | null;
    }>;
  };
} {
  return (
    typeof message === "object" &&
    message !== null &&
    (message as { type?: string }).type === "component-map:result" &&
    typeof (message as { payload?: unknown }).payload === "object" &&
    Array.isArray((message as { payload: { components?: unknown } }).payload.components)
  );
}

export function ComponentsPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComponent, setSelectedComponent] = useState<DisplayComponent | null>(null);
  const [components, setComponents] = useState<DisplayComponent[]>([]);
  const [loading, setLoading] = useState(false);

  // Listen for component map results from content script
  useEffect(() => {
    const cleanup = onContentMessage((message: unknown) => {
      if (isComponentMapResponse(message)) {
        setComponents(message.payload.components);
        setLoading(false);
      }
    });

    return cleanup;
  }, []);

  // Scan for components on mount
  useEffect(() => {
    scanComponents();
  }, []);

  const scanComponents = useCallback(() => {
    setLoading(true);
    sendToContent({
      type: "panel:get-component-map",
    });

    // Real results come via onContentMessage callback
  }, []);

  // Filter components by search query
  const filteredComponents = useMemo(() => {
    if (!searchQuery.trim()) return components;
    const query = searchQuery.toLowerCase();
    return components.filter(
      (c) =>
        c.radflowId.toLowerCase().includes(query) ||
        c.componentName?.toLowerCase().includes(query) ||
        c.selector.toLowerCase().includes(query)
    );
  }, [searchQuery, components]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 space-y-2 border-b border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-neutral-200">
              Components
            </span>
            <span className="text-[10px] text-neutral-500">
              {loading ? "Scanning..." : `${filteredComponents.length} found`}
            </span>
          </div>
          <button
            onClick={scanComponents}
            disabled={loading}
            className="p-1 text-neutral-500 hover:text-neutral-200 rounded hover:bg-neutral-700/50 transition-colors disabled:opacity-50"
            title="Rescan components"
          >
            <span className={loading ? "animate-spin" : ""}>{Icons.refresh}</span>
          </button>
        </div>

        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search components..."
        />
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {filteredComponents.length > 0 ? (
          filteredComponents.map((comp) => (
            <ComponentRow
              key={comp.radflowId}
              component={comp}
              isSelected={selectedComponent?.radflowId === comp.radflowId}
              onSelect={() =>
                setSelectedComponent(
                  selectedComponent?.radflowId === comp.radflowId ? null : comp
                )
              }
            />
          ))
        ) : (
          <div className="text-center py-4 text-neutral-500 text-xs">
            {searchQuery
              ? `No components match "${searchQuery}"`
              : loading
                ? "Loading components..."
                : "No components found"}
          </div>
        )}
      </div>

      {/* Preview Panel */}
      {selectedComponent && (
        <PreviewPanel
          component={selectedComponent}
          onClose={() => setSelectedComponent(null)}
        />
      )}
    </div>
  );
}

export default ComponentsPanel;
