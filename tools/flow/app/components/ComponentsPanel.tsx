import { useState, useCallback, useMemo } from "react";
import {
  loadTheme,
  type ThemeComponent,
  type ComponentSchema,
} from "../services/themeLoader";
import { ThemePreview } from "./ThemePreview";

/**
 * ComponentsPanel - Theme Component Browser
 *
 * Displays components from the loaded theme (@rdna/radiants).
 * Click a component to see its live preview with variants.
 *
 * Features:
 * - Component list with search/filter
 * - Live component preview
 * - Variant switcher from schema
 * - Props documentation
 */

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
  chevronDown: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  chevronRight: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="9 18 15 12 9 6" />
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
  component: ThemeComponent;
  isSelected: boolean;
  onSelect: () => void;
}

function ComponentRow({ component, isSelected, onSelect }: ComponentRowProps) {
  const propsCount = component.schema?.props
    ? Object.keys(component.schema.props).length
    : 0;
  const hasVariants = component.schema?.props?.variant?.values?.length;

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
            {component.schema?.props?.variant?.values?.length}v
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
  component: ThemeComponent;
  onClose: () => void;
}

function PreviewPanel({ component, onClose }: PreviewPanelProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>();
  const [copiedName, setCopiedName] = useState(false);

  const variants = component.schema?.props?.variant?.values || [];
  const defaultProps = getDefaultProps(component.schema);

  const handleCopyName = useCallback(() => {
    navigator.clipboard.writeText(component.name).then(() => {
      setCopiedName(true);
      setTimeout(() => setCopiedName(false), 1500);
    });
  }, [component.name]);

  return (
    <div className="border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-secondary/50">
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
      {component.schema?.description && (
        <div className="px-3 py-2 text-xs text-text-muted border-b border-border">
          {component.schema.description}
        </div>
      )}

      {/* Variant Selector */}
      {variants.length > 0 && (
        <div className="px-3 py-2 border-b border-border">
          <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">
            Variant
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                !selectedVariant
                  ? "bg-primary text-white"
                  : "bg-white/5 text-text-muted hover:text-text"
              }`}
              onClick={() => setSelectedVariant(undefined)}
            >
              default
            </button>
            {variants.map((v) => (
              <button
                key={v}
                className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                  selectedVariant === v
                    ? "bg-primary text-white"
                    : "bg-white/5 text-text-muted hover:text-text"
                }`}
                onClick={() => setSelectedVariant(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="p-3">
        <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">
          Preview
        </div>
        <div className="p-4 bg-surface-secondary/30 rounded border border-border">
          <ThemePreview
            componentName={component.name}
            props={defaultProps}
            variant={selectedVariant}
          />
        </div>
      </div>

      {/* Props */}
      {component.schema?.props &&
        Object.keys(component.schema.props).length > 0 && (
          <div className="px-3 pb-3">
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">
              Props
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {Object.entries(component.schema.props).map(([name, config]) => (
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
// Helper Functions
// ============================================================================

/**
 * Extract default props from schema for preview.
 */
function getDefaultProps(
  schema: ComponentSchema | null
): Record<string, unknown> {
  const props: Record<string, unknown> = {};

  if (schema?.props) {
    for (const [key, config] of Object.entries(schema.props)) {
      if (config.default !== undefined) {
        props[key] = config.default;
      }
    }
  }

  // Add sensible defaults for common props that need children
  if (!props.children && schema?.slots?.children) {
    props.children = "Preview Content";
  }

  return props;
}

// ============================================================================
// Main ComponentsPanel Component
// ============================================================================

export function ComponentsPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComponent, setSelectedComponent] =
    useState<ThemeComponent | null>(null);

  // Load theme (synchronous, from ESM imports)
  const theme = useMemo(() => loadTheme(), []);

  // Filter components by search query
  const filteredComponents = useMemo(() => {
    if (!searchQuery.trim()) return theme.components;

    const query = searchQuery.toLowerCase();
    return theme.components.filter(
      (comp) =>
        comp.name.toLowerCase().includes(query) ||
        comp.schema?.description?.toLowerCase().includes(query)
    );
  }, [theme.components, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 space-y-2 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-text">
              {theme.displayName}
            </span>
            <span className="text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded">
              v{theme.version}
            </span>
          </div>
          <span className="text-[10px] text-text-muted">
            {filteredComponents.length} components
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
