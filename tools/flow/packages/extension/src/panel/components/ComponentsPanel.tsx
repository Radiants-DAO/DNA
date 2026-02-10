import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { ScannedComponent } from "@flow/shared";
import { Component, X, Copy, RefreshCw } from "./ui/icons";
import { SearchInput } from "./ui/SearchInput";
import { CollapsibleSection } from "./ui/CollapsibleSection";
import { scanComponents } from "../scanners/componentScanner";
import { onPageNavigated } from "../api/navigationWatcher";

/**
 * ComponentsPanel - Component Browser for the extension panel.
 * Scans components from the inspected page via inspectedWindow.eval().
 * Tiered detection: React fibers → Vue → Svelte → Custom Elements → HTML landmarks.
 */

// ============================================================================
// Icons
// ============================================================================

const Icons = {
  component: <Component className="w-3.5 h-3.5" />,
  close: <X className="w-3.5 h-3.5" />,
  copy: <Copy className="w-3 h-3" />,
  refresh: <RefreshCw className="w-3 h-3" />,
};

// ============================================================================
// Framework badge colors
// ============================================================================

const FRAMEWORK_COLORS: Record<string, { bg: string; text: string }> = {
  react: { bg: "bg-cyan-400/10", text: "text-cyan-400" },
  vue: { bg: "bg-emerald-400/10", text: "text-emerald-400" },
  svelte: { bg: "bg-orange-400/10", text: "text-orange-400" },
  angular: { bg: "bg-red-400/10", text: "text-red-400" },
  "web-component": { bg: "bg-purple-400/10", text: "text-purple-400" },
  html: { bg: "bg-neutral-400/10", text: "text-neutral-400" },
};

// ============================================================================
// Component classification
// ============================================================================

type ComponentKind = 'ui' | 'functional';

const FUNCTIONAL_PATTERNS = [
  /Provider$/i,
  /Consumer$/i,
  /Context$/i,
  /Boundary$/i,
  /Suspense/i,
  /Portal$/i,
  /Router$/i,
  /Route$/i,
  /Switch$/i,
  /Guard$/i,
  /Gate$/i,
  /Observer$/i,
  /Connector$/i,
  /^with[A-Z]/,       // HOCs: withAuth, withTheme, etc.
  /^use[A-Z]/,        // hook-like components
  /Store$/i,
  /Manager$/i,
  /Handler$/i,
  /Listener$/i,
  /Interceptor$/i,
];

function classifyComponent(comp: ScannedComponent): ComponentKind {
  for (const pattern of FUNCTIONAL_PATTERNS) {
    if (pattern.test(comp.name)) return 'functional';
  }
  return 'ui';
}

const COMPONENT_KINDS: Record<ComponentKind, { label: string; bg: string; text: string }> = {
  ui:         { label: 'UI Components', bg: 'bg-green-400/10',   text: 'text-green-400' },
  functional: { label: 'Functional',    bg: 'bg-amber-400/10',   text: 'text-amber-400' },
};

const KIND_ORDER: ComponentKind[] = ['ui', 'functional'];

// ============================================================================
// Component Row
// ============================================================================

interface ComponentRowProps {
  component: ScannedComponent;
  isSelected: boolean;
  onSelect: () => void;
}

function ComponentRow({ component, isSelected, onSelect }: ComponentRowProps) {
  const colors = FRAMEWORK_COLORS[component.framework] ?? FRAMEWORK_COLORS.html;

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
        {component.name}
      </span>
      {component.instances > 1 && (
        <span className="text-[10px] text-neutral-500">
          ×{component.instances}
        </span>
      )}
      <span className={`text-[9px] ${colors.bg} ${colors.text} px-1 rounded`}>
        {component.framework}
      </span>
    </button>
  );
}

// ============================================================================
// Component Preview Panel
// ============================================================================

interface PreviewPanelProps {
  component: ScannedComponent;
  onClose: () => void;
}

function PreviewPanel({ component, onClose }: PreviewPanelProps) {
  const [copiedSelector, setCopiedSelector] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopySelector = useCallback(() => {
    if (!component.selector) return;
    navigator.clipboard.writeText(component.selector).then(() => {
      setCopiedSelector(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopiedSelector(false), 1500);
    }).catch(() => {});
  }, [component.selector]);

  const colors = FRAMEWORK_COLORS[component.framework] ?? FRAMEWORK_COLORS.html;

  return (
    <div className="border-t border-neutral-700">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-700/50 bg-neutral-800/50">
        <div className="flex items-center gap-2">
          <span className="text-blue-400">{Icons.component}</span>
          <span className="text-xs font-medium text-neutral-200">{component.name}</span>
          <span className={`text-[9px] ${colors.bg} ${colors.text} px-1 rounded`}>
            {component.framework}
          </span>
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
        {/* Instances */}
        <div>
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5">
            Instances
          </div>
          <span className="text-xs text-neutral-300">
            {component.instances}
          </span>
        </div>

        {/* Selector */}
        {component.selector && (
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
        )}

        {/* Source location */}
        {component.source && (
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5">
              Source
            </div>
            <span className="text-xs text-neutral-400 font-mono break-all">
              {component.source.fileName}:{component.source.lineNumber}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main ComponentsPanel Component
// ============================================================================

export function ComponentsPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComponent, setSelectedComponent] = useState<ScannedComponent | null>(null);
  const [components, setComponents] = useState<ScannedComponent[]>([]);
  const [framework, setFramework] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runScan = useCallback(() => {
    setLoading(true);
    setError(null);
    scanComponents().then((result) => {
      setComponents(result.components);
      setFramework(result.framework);
      setLoading(false);
    }).catch((err) => {
      console.error('[ComponentsPanel] scan failed:', err);
      setError(err instanceof Error ? err.message : 'Scan failed');
      setLoading(false);
    });
  }, []);

  // Scan on mount + re-scan on SPA navigation
  useEffect(() => {
    runScan();
    const unsubscribe = onPageNavigated(runScan);
    return unsubscribe;
  }, [runScan]);

  // Filter components by search query
  const filteredComponents = useMemo(() => {
    if (!searchQuery.trim()) return components;
    const query = searchQuery.toLowerCase();
    return components.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.framework.toLowerCase().includes(query) ||
        c.selector.toLowerCase().includes(query)
    );
  }, [searchQuery, components]);

  // Group by kind
  const grouped = useMemo(() => {
    const groups: Record<ComponentKind, ScannedComponent[]> = { ui: [], functional: [] };
    for (const comp of filteredComponents) {
      groups[classifyComponent(comp)].push(comp);
    }
    return groups;
  }, [filteredComponents]);

  if (error) {
    return (
      <div className="p-3 space-y-2">
        <p className="text-xs text-red-400">Failed to scan components: {error}</p>
        <button
          onClick={runScan}
          className="px-2 py-1 text-xs rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-200 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

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
              {loading
                ? "Scanning..."
                : `${filteredComponents.length} found${framework ? ` (${framework})` : ""}`}
            </span>
          </div>
          <button
            onClick={runScan}
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
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredComponents.length > 0 ? (
          KIND_ORDER.filter((kind) => grouped[kind].length > 0).map((kind) => {
            const config = COMPONENT_KINDS[kind];
            return (
              <CollapsibleSection
                key={kind}
                title={config.label}
                count={grouped[kind].length}
                defaultExpanded
                badge={
                  <span className={`text-[9px] ${config.bg} ${config.text} px-1 rounded`}>
                    {config.label}
                  </span>
                }
              >
                {grouped[kind].map((comp) => (
                  <ComponentRow
                    key={`${comp.framework}:${comp.name}`}
                    component={comp}
                    isSelected={selectedComponent?.name === comp.name && selectedComponent?.framework === comp.framework}
                    onSelect={() =>
                      setSelectedComponent(
                        selectedComponent?.name === comp.name && selectedComponent?.framework === comp.framework
                          ? null
                          : comp
                      )
                    }
                  />
                ))}
              </CollapsibleSection>
            );
          })
        ) : (
          <div className="text-center py-4 text-neutral-500 text-xs">
            {searchQuery
              ? `No components match "${searchQuery}"`
              : loading
                ? "Scanning components..."
                : "No components detected on this page."}
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
