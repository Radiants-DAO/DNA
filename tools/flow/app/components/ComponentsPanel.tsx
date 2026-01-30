import { useState, useCallback, useMemo } from "react";
import type { ComponentSchema as StoreComponentSchema } from "../types/componentCanvas";
import { useAppStore } from "../stores/appStore";

/**
 * Lightweight shape used for display in ComponentsPanel.
 * Adapts from the store's ComponentSchema.
 */
interface DisplayComponent {
  name: string;
  description: string | null;
  props: Record<string, { type: string; default?: unknown; values?: string[]; description?: string }> | null;
  slots: Record<string, { description?: string }> | string[] | null;
}

/**
 * ComponentsPanel - Component Browser
 *
 * Displays components from componentSchemas in the store (loaded by workspace scan).
 * Shows all components from the active theme's schema.json files.
 *
 * Features:
 * - Component list from store (workspace-scanned schemas)
 * - Variant info from schema props
 * - Props documentation
 */

/** Convert store schema to display shape */
function schemaToDisplay(schema: StoreComponentSchema): DisplayComponent {
  return {
    name: schema.name,
    description: schema.description || null,
    props: Object.keys(schema.props).length > 0 ? schema.props : null,
    slots: schema.slots,
  };
}

// ============================================================================
// Icons
// ============================================================================

const Icons = {
  search: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  component: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
      <line x1="12" y1="22" x2="12" y2="15.5" />
      <polyline points="22 8.5 12 15.5 2 8.5" />
    </svg>
  ),
  close: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  copy: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
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
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted">
        {Icons.search}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-7 pr-2 py-1.5 text-xs bg-surface border border-border rounded outline-none focus:border-primary/50 placeholder:text-text-muted/50"
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
  const propsCount = component.props
    ? Object.keys(component.props).length
    : 0;
  const variantProp = component.props?.variant;
  const hasVariants = variantProp?.values?.length;

  return (
    <button
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
        isSelected
          ? "bg-primary/20 text-text"
          : "hover:bg-white/5 text-text-muted hover:text-text"
      }`}
      onClick={onSelect}
    >
      <span className={isSelected ? "text-primary" : "text-success"}>
        {Icons.component}
      </span>
      <span className="flex-1 text-xs font-medium truncate">
        {component.name}
      </span>
      <div className="flex items-center gap-1.5">
        {hasVariants && (
          <span className="text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded">
            {variantProp?.values?.length}v
          </span>
        )}
        <span className="text-[10px] text-text-muted">{propsCount}p</span>
      </div>
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
  const [copiedName, setCopiedName] = useState(false);

  const variants = component.props?.variant?.values || [];

  const handleCopyName = useCallback(() => {
    navigator.clipboard.writeText(component.name).then(() => {
      setCopiedName(true);
      setTimeout(() => setCopiedName(false), 1500);
    });
  }, [component.name]);

  return (
    <div className="border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-edge-muted bg-surface-elevated">
        <div className="flex items-center gap-2">
          <span className="text-primary">{Icons.component}</span>
          <span className="text-xs font-medium">{component.name}</span>
          <button
            className="p-0.5 text-text-muted hover:text-text rounded hover:bg-white/10 transition-colors"
            onClick={handleCopyName}
            title="Copy component name"
          >
            {copiedName ? (
              <span className="text-[10px] text-success">Copied!</span>
            ) : (
              Icons.copy
            )}
          </button>
        </div>
        <button
          className="p-1 text-text-muted hover:text-text rounded hover:bg-white/10 transition-colors"
          onClick={onClose}
          title="Close preview"
        >
          {Icons.close}
        </button>
      </div>

      {/* Description */}
      {component.description && (
        <div className="px-3 py-2 text-xs text-text-muted border-b border-border">
          {component.description}
        </div>
      )}

      {/* Variant Selector */}
      {variants.length > 0 && (
        <div className="px-3 py-2 border-b border-border">
          <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">
            Variant
          </div>
          <div className="flex flex-wrap gap-1">
            {variants.map((v) => (
              <span
                key={v}
                className="px-2 py-0.5 text-[10px] rounded bg-white/5 text-text-muted"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Props */}
      {component.props &&
        Object.keys(component.props).length > 0 && (
          <div className="px-3 py-3">
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">
              Props
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {Object.entries(component.props).map(([name, config]) => (
                <div
                  key={name}
                  className="flex items-start gap-2 text-[10px] py-0.5"
                >
                  <span className="text-primary font-mono">{name}</span>
                  <span className="text-text-muted truncate flex-1">
                    {config.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}

// ============================================================================
// Main ComponentsPanel Component
// ============================================================================

export function ComponentsPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComponent, setSelectedComponent] =
    useState<DisplayComponent | null>(null);

  // Get components from store (loaded by workspace scan)
  const componentSchemas = useAppStore((s) => s.componentSchemas);
  const componentCanvasLoading = useAppStore((s) => s.componentCanvasLoading);
  const workspace = useAppStore((s) => s.workspace);

  // Get active theme name
  const activeThemeName = useMemo(() => {
    if (!workspace?.activeThemeId) return null;
    return workspace.themes.find((t) => t.id === workspace.activeThemeId)?.name ?? null;
  }, [workspace]);

  // Convert schemas to display components
  const displayComponents = useMemo(() => {
    return componentSchemas.map(schemaToDisplay).sort((a, b) => a.name.localeCompare(b.name));
  }, [componentSchemas]);

  // Filter components by search query
  const filteredComponents = useMemo(() => {
    if (!searchQuery.trim()) return displayComponents;
    const query = searchQuery.toLowerCase();
    return displayComponents.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
    );
  }, [displayComponents, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 space-y-2 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-text">
            {activeThemeName ?? "Components"}
          </span>
          <span className="text-[10px] text-text-muted">
            {componentCanvasLoading ? "Scanning..." : `${filteredComponents.length} components`}
          </span>
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
              key={comp.name}
              component={comp}
              isSelected={selectedComponent?.name === comp.name}
              onSelect={() =>
                setSelectedComponent(
                  selectedComponent?.name === comp.name ? null : comp
                )
              }
            />
          ))
        ) : (
          <div className="text-center py-4 text-text-muted text-xs">
            {searchQuery
              ? `No components match "${searchQuery}"`
              : componentCanvasLoading
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
