import { useState, useCallback, useEffect, useMemo } from "react";
import { useAppStore } from "../stores/appStore";
import { useProjectStore } from "../stores/projectStore";
import type { ComponentInfo } from "../bindings";

/**
 * ComponentsPanel - Flat list with categories for the left panel
 *
 * Displays discovered components from the current project, organized by
 * folder/category. Components are discovered by the Rust backend via TSX parsing.
 *
 * Features:
 * - Flat list with collapsible category sections
 * - Search/filter by component name or path
 * - Click to copy component name
 * - Display source file path
 * - Click to select component in preview
 */

// ============================================================================
// Types
// ============================================================================

interface GroupedComponents {
  category: string;
  components: ComponentInfo[];
}

// ============================================================================
// Icons
// ============================================================================

const Icons = {
  copy: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  refresh: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  ),
  chevronDown: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  chevronRight: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  search: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  component: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
      <line x1="12" y1="22" x2="12" y2="15.5" />
      <polyline points="22 8.5 12 15.5 2 8.5" />
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

function SearchInput({ value, onChange, placeholder = "Search..." }: SearchInputProps) {
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
// Collapsible Section Component
// ============================================================================

interface CollapsibleSectionProps {
  title: string;
  count: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, count, defaultExpanded = true, children }: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="space-y-1">
      <button
        className="w-full flex items-center gap-1 text-left hover:bg-white/5 rounded px-1 py-0.5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-text-muted">
          {isExpanded ? Icons.chevronDown : Icons.chevronRight}
        </span>
        <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium flex-1">
          {title}
        </span>
        <span className="text-[10px] text-text-muted">
          {count}
        </span>
      </button>
      {isExpanded && (
        <div className="space-y-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Component Row
// ============================================================================

interface ComponentRowProps {
  component: ComponentInfo;
  onCopy: (text: string) => void;
  onSelect?: (component: ComponentInfo) => void;
}

function ComponentRow({ component, onCopy, onSelect }: ComponentRowProps) {
  // Extract relative path from absolute path
  const getRelativePath = (fullPath: string) => {
    // Try to find common project patterns like src/, components/, etc.
    const patterns = ['/src/', '/components/', '/app/'];
    for (const pattern of patterns) {
      const idx = fullPath.indexOf(pattern);
      if (idx !== -1) {
        return fullPath.slice(idx + 1); // Remove leading slash
      }
    }
    // Fall back to just the filename
    return fullPath.split('/').pop() || fullPath;
  };

  const relativePath = getRelativePath(component.file);
  const propsCount = component.props.length;

  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 cursor-pointer group"
      onClick={() => onSelect?.(component)}
      title={`Click to select • ${relativePath}:${component.line}`}
    >
      {/* Component Icon */}
      <span className="text-success shrink-0">
        {Icons.component}
      </span>

      {/* Component Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text font-medium truncate">
            {component.name}
          </span>
          {propsCount > 0 && (
            <span className="text-[10px] text-text-muted">
              ({propsCount} {propsCount === 1 ? 'prop' : 'props'})
            </span>
          )}
        </div>
        <div className="text-[10px] text-text-muted truncate">
          {relativePath}:{component.line}
        </div>
      </div>

      {/* Copy Button */}
      <button
        className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-text transition-all"
        onClick={(e) => {
          e.stopPropagation();
          onCopy(component.name);
        }}
        title="Copy component name"
      >
        {Icons.copy}
      </button>
    </div>
  );
}

// ============================================================================
// Mock Data for Empty State
// ============================================================================

const MOCK_COMPONENTS: ComponentInfo[] = [
  { name: "Button", file: "/src/components/core/Button.tsx", line: 12, props: [{ name: "variant", type: "'primary' | 'secondary'" }, { name: "size", type: "'sm' | 'md' | 'lg'" }], defaultExport: true, unionTypes: [] },
  { name: "Input", file: "/src/components/core/Input.tsx", line: 8, props: [{ name: "type", type: "string" }, { name: "placeholder", type: "string" }], defaultExport: true, unionTypes: [] },
  { name: "Checkbox", file: "/src/components/core/Checkbox.tsx", line: 5, props: [{ name: "checked", type: "boolean" }], defaultExport: true, unionTypes: [] },
  { name: "Card", file: "/src/components/layout/Card.tsx", line: 10, props: [{ name: "padding", type: "string" }], defaultExport: true, unionTypes: [] },
  { name: "Dialog", file: "/src/components/overlays/Dialog.tsx", line: 15, props: [{ name: "open", type: "boolean" }, { name: "onClose", type: "() => void" }], defaultExport: true, unionTypes: [] },
  { name: "Tabs", file: "/src/components/navigation/Tabs.tsx", line: 8, props: [{ name: "activeTab", type: "string" }], defaultExport: true, unionTypes: [] },
  { name: "Avatar", file: "/src/components/display/Avatar.tsx", line: 6, props: [{ name: "src", type: "string" }, { name: "alt", type: "string" }], defaultExport: true, unionTypes: [] },
  { name: "Badge", file: "/src/components/display/Badge.tsx", line: 4, props: [{ name: "variant", type: "'info' | 'success' | 'warning' | 'error'" }], defaultExport: true, unionTypes: [] },
];

// ============================================================================
// Main ComponentsPanel Component
// ============================================================================

export function ComponentsPanel() {
  const components = useAppStore((s) => s.components);
  const componentsLoading = useAppStore((s) => s.componentsLoading);
  const componentsError = useAppStore((s) => s.componentsError);
  const scanComponents = useAppStore((s) => s.scanComponents);
  const currentProject = useProjectStore((s) => s.currentProject);

  const [searchQuery, setSearchQuery] = useState("");
  const [copiedName, setCopiedName] = useState<string | null>(null);

  // Scan components when project changes
  useEffect(() => {
    if (currentProject?.path) {
      // Scan the src directory for components
      const srcPath = `${currentProject.path}/src`;
      scanComponents(srcPath).catch(() => {
        // Silent fail - components might not exist yet
      });
    }
  }, [currentProject?.path, scanComponents]);

  // Handle copy to clipboard
  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedName(text);
      setTimeout(() => setCopiedName(null), 1500);
    });
  }, []);

  // Handle component selection (future: highlight in preview)
  const handleSelect = useCallback((component: ComponentInfo) => {
    console.log("Selected component:", component.name, component.file, component.line);
    // TODO: Integrate with preview canvas selection
  }, []);

  // Reload components
  const handleReload = useCallback(() => {
    if (currentProject?.path) {
      const srcPath = `${currentProject.path}/src`;
      scanComponents(srcPath);
    }
  }, [currentProject?.path, scanComponents]);

  // Use real components or mock data
  const displayComponents = components.length > 0 ? components : MOCK_COMPONENTS;
  const isUsingMockData = components.length === 0;

  // Filter components by search query
  const filteredComponents = useMemo(() => {
    if (!searchQuery.trim()) return displayComponents;

    const query = searchQuery.toLowerCase();
    return displayComponents.filter((comp) =>
      comp.name.toLowerCase().includes(query) ||
      comp.file.toLowerCase().includes(query)
    );
  }, [displayComponents, searchQuery]);

  // Group components by category (folder)
  const groupedComponents = useMemo((): GroupedComponents[] => {
    const groups = new Map<string, ComponentInfo[]>();

    for (const comp of filteredComponents) {
      // Extract category from path
      const pathParts = comp.file.split('/');
      let category = "Components";

      // Find category from path patterns like /components/core/, /src/core/, etc.
      const componentsIdx = pathParts.findIndex((p) => p === "components");
      if (componentsIdx !== -1 && pathParts[componentsIdx + 1]) {
        category = pathParts[componentsIdx + 1];
      } else {
        // Try src/category pattern
        const srcIdx = pathParts.findIndex((p) => p === "src");
        if (srcIdx !== -1 && pathParts[srcIdx + 1] && pathParts[srcIdx + 1] !== "components") {
          category = pathParts[srcIdx + 1];
        }
      }

      // Capitalize category
      category = category.charAt(0).toUpperCase() + category.slice(1);

      const existing = groups.get(category) || [];
      existing.push(comp);
      groups.set(category, existing);
    }

    // Convert to array and sort by category name
    return Array.from(groups.entries())
      .map(([category, comps]) => ({ category, components: comps.sort((a, b) => a.name.localeCompare(b.name)) }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [filteredComponents]);

  // Loading state
  if (componentsLoading) {
    return (
      <div className="p-3 space-y-3">
        <div className="flex items-center gap-2 text-text-muted">
          <div className="animate-spin">{Icons.refresh}</div>
          <span className="text-xs">Scanning components...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (componentsError && components.length === 0) {
    return (
      <div className="p-3 space-y-3">
        <p className="text-xs text-text-muted">
          Could not scan for components.
        </p>
        <p className="text-[10px] text-red-400/70">
          {componentsError}
        </p>
        <button
          onClick={handleReload}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          {Icons.refresh}
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      {/* Header with search and reload */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted">
            {isUsingMockData ? "Sample components" : `${filteredComponents.length} components`}
          </p>
          {!isUsingMockData && (
            <button
              onClick={handleReload}
              className="p-1 text-text-muted hover:text-text rounded hover:bg-white/5 transition-colors"
              title="Rescan components"
            >
              {Icons.refresh}
            </button>
          )}
        </div>

        {/* Search Input */}
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search components..."
        />
      </div>

      {/* Component List */}
      <div className="space-y-3">
        {groupedComponents.length > 0 ? (
          groupedComponents.map((group) => (
            <CollapsibleSection
              key={group.category}
              title={group.category}
              count={group.components.length}
              defaultExpanded={groupedComponents.length <= 4}
            >
              {group.components.map((comp) => (
                <ComponentRow
                  key={`${comp.file}:${comp.line}`}
                  component={comp}
                  onCopy={handleCopy}
                  onSelect={handleSelect}
                />
              ))}
            </CollapsibleSection>
          ))
        ) : (
          <div className="text-center py-4 text-text-muted text-xs">
            {searchQuery ? `No components match "${searchQuery}"` : "No components found"}
          </div>
        )}
      </div>

      {/* Mock data notice */}
      {isUsingMockData && (
        <p className="text-[10px] text-text-muted/60 pt-2">
          Open a project to see real components.
        </p>
      )}

      {/* Copied toast */}
      {copiedName && (
        <div className="fixed bottom-4 right-4 bg-surface border border-border px-3 py-2 rounded shadow-lg text-xs text-text z-50">
          Copied: {copiedName}
        </div>
      )}
    </div>
  );
}

export default ComponentsPanel;
