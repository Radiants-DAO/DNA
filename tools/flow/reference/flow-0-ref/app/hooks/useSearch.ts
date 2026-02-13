import { useState, useCallback, useMemo, useEffect } from "react";
import { useAppStore } from "../stores/appStore";
import { fuzzySearch, highlightMatches } from "../utils/fuzzySearch";
import type { ComponentInfo } from "../bindings";

/**
 * Search Scopes for the unified search interface.
 *
 * | Scope | Description | Shortcut |
 * |-------|-------------|----------|
 * | elements | Search visible elements in preview | Cmd+1 |
 * | components | Search componentMap by name | Cmd+2 |
 * | layers | Search Layers Panel tree | Cmd+3 |
 * | assets | Search Assets Panel by filename | Cmd+4 |
 */
export type SearchScope = "elements" | "components" | "layers" | "assets";

/**
 * Base search result type
 */
export interface SearchResult {
  id: string;
  type: SearchScope;
  label: string;
  sublabel?: string;
  icon?: string;
  score: number;
  matchedIndices: number[];
}

/**
 * Element search result - for visible elements in preview
 */
export interface ElementSearchResult extends SearchResult {
  type: "elements";
  tagName: string;
  className?: string;
  textContent?: string;
}

/**
 * Component search result - from componentMap
 */
export interface ComponentSearchResult extends SearchResult {
  type: "components";
  component: ComponentInfo;
  file: string;
  line: number;
}

/**
 * Layer search result - from Layers Panel tree
 */
export interface LayerSearchResult extends SearchResult {
  type: "layers";
  nodeId: string;
  nodeType: string;
}

/**
 * Asset search result - from Assets Panel
 */
export interface AssetSearchResult extends SearchResult {
  type: "assets";
  assetType: "icon" | "logo" | "image";
  path?: string;
}

// Recent searches storage key
const RECENT_SEARCHES_KEY = "radflow-recent-searches";
const MAX_RECENT_SEARCHES = 10;

/**
 * Mock data for elements (simulating DOM tree)
 */
const MOCK_ELEMENTS: ElementSearchResult[] = [
  { id: "el-1", type: "elements", label: "div.hero-container", sublabel: "Hero section container", tagName: "div", className: "hero-container", score: 0, matchedIndices: [] },
  { id: "el-2", type: "elements", label: "h1.hero-heading", sublabel: "Welcome to RadFlow", tagName: "h1", className: "hero-heading", textContent: "Welcome to RadFlow", score: 0, matchedIndices: [] },
  { id: "el-3", type: "elements", label: "p.hero-subtext", sublabel: "Visual design system editor", tagName: "p", className: "hero-subtext", textContent: "Visual design system editor", score: 0, matchedIndices: [] },
  { id: "el-4", type: "elements", label: "button.btn-primary", sublabel: "Get Started", tagName: "button", className: "btn-primary", textContent: "Get Started", score: 0, matchedIndices: [] },
  { id: "el-5", type: "elements", label: "nav.navbar", sublabel: "Navigation bar", tagName: "nav", className: "navbar", score: 0, matchedIndices: [] },
  { id: "el-6", type: "elements", label: "footer.site-footer", sublabel: "Site footer", tagName: "footer", className: "site-footer", score: 0, matchedIndices: [] },
  { id: "el-7", type: "elements", label: "section.features", sublabel: "Features section", tagName: "section", className: "features", score: 0, matchedIndices: [] },
  { id: "el-8", type: "elements", label: "div.card", sublabel: "Feature card", tagName: "div", className: "card", score: 0, matchedIndices: [] },
];

/**
 * Mock data for layers (simulating layer tree)
 */
const MOCK_LAYERS: LayerSearchResult[] = [
  { id: "layer-body", type: "layers", label: "Body", sublabel: "Root", nodeId: "body", nodeType: "div", score: 0, matchedIndices: [] },
  { id: "layer-nav", type: "layers", label: "Navbar", sublabel: "Component", nodeId: "navbar", nodeType: "component", score: 0, matchedIndices: [] },
  { id: "layer-hero", type: "layers", label: "section-hero", sublabel: "Section", nodeId: "section-hero", nodeType: "section", score: 0, matchedIndices: [] },
  { id: "layer-hero-heading", type: "layers", label: "h1", sublabel: "Text", nodeId: "hero-heading", nodeType: "text", score: 0, matchedIndices: [] },
  { id: "layer-features", type: "layers", label: "section-features", sublabel: "Section", nodeId: "section-features", nodeType: "section", score: 0, matchedIndices: [] },
  { id: "layer-pricing", type: "layers", label: "section-pricing", sublabel: "Section", nodeId: "section-pricing", nodeType: "section", score: 0, matchedIndices: [] },
  { id: "layer-footer", type: "layers", label: "Footer", sublabel: "Component", nodeId: "footer-content", nodeType: "component", score: 0, matchedIndices: [] },
  { id: "layer-button", type: "layers", label: "Button", sublabel: "Component", nodeId: "hero-btn-primary", nodeType: "component", score: 0, matchedIndices: [] },
];

/**
 * Mock data for assets
 */
const MOCK_ASSETS: AssetSearchResult[] = [
  { id: "asset-home", type: "assets", label: "home", sublabel: "Icon", assetType: "icon", score: 0, matchedIndices: [] },
  { id: "asset-settings", type: "assets", label: "settings", sublabel: "Icon", assetType: "icon", score: 0, matchedIndices: [] },
  { id: "asset-user", type: "assets", label: "user", sublabel: "Icon", assetType: "icon", score: 0, matchedIndices: [] },
  { id: "asset-search", type: "assets", label: "search", sublabel: "Icon", assetType: "icon", score: 0, matchedIndices: [] },
  { id: "asset-logo", type: "assets", label: "logo-primary", sublabel: "Logo", assetType: "logo", score: 0, matchedIndices: [] },
  { id: "asset-logo-dark", type: "assets", label: "logo-dark", sublabel: "Logo", assetType: "logo", score: 0, matchedIndices: [] },
  { id: "asset-hero-bg", type: "assets", label: "hero-bg.png", sublabel: "Image", assetType: "image", path: "/images/hero-bg.png", score: 0, matchedIndices: [] },
  { id: "asset-pattern", type: "assets", label: "pattern.svg", sublabel: "Image", assetType: "image", path: "/images/pattern.svg", score: 0, matchedIndices: [] },
];

/**
 * Load recent searches from localStorage
 */
function loadRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore localStorage errors
  }
  return [];
}

/**
 * Save recent searches to localStorage
 */
function saveRecentSearches(searches: string[]): void {
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Hook for managing search state and results.
 *
 * Features:
 * - Unified search across multiple scopes
 * - Fuzzy matching with scoring
 * - Recent searches persistence
 * - Scope filtering
 */
export function useSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchScope>("elements");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    loadRecentSearches()
  );

  // Get components from store
  const components = useAppStore((s) => s.components);

  // Build component search results
  const componentResults = useMemo((): ComponentSearchResult[] => {
    if (components.length === 0) {
      // Use mock data when no real components
      return [
        { id: "comp-button", type: "components", label: "Button", sublabel: "src/components/core/Button.tsx:12", component: { name: "Button", file: "/src/components/core/Button.tsx", line: 12, props: [], defaultExport: true, unionTypes: [] }, file: "/src/components/core/Button.tsx", line: 12, score: 0, matchedIndices: [] },
        { id: "comp-input", type: "components", label: "Input", sublabel: "src/components/core/Input.tsx:8", component: { name: "Input", file: "/src/components/core/Input.tsx", line: 8, props: [], defaultExport: true, unionTypes: [] }, file: "/src/components/core/Input.tsx", line: 8, score: 0, matchedIndices: [] },
        { id: "comp-card", type: "components", label: "Card", sublabel: "src/components/layout/Card.tsx:10", component: { name: "Card", file: "/src/components/layout/Card.tsx", line: 10, props: [], defaultExport: true, unionTypes: [] }, file: "/src/components/layout/Card.tsx", line: 10, score: 0, matchedIndices: [] },
        { id: "comp-dialog", type: "components", label: "Dialog", sublabel: "src/components/overlays/Dialog.tsx:15", component: { name: "Dialog", file: "/src/components/overlays/Dialog.tsx", line: 15, props: [], defaultExport: true, unionTypes: [] }, file: "/src/components/overlays/Dialog.tsx", line: 15, score: 0, matchedIndices: [] },
        { id: "comp-tabs", type: "components", label: "Tabs", sublabel: "src/components/navigation/Tabs.tsx:8", component: { name: "Tabs", file: "/src/components/navigation/Tabs.tsx", line: 8, props: [], defaultExport: true, unionTypes: [] }, file: "/src/components/navigation/Tabs.tsx", line: 8, score: 0, matchedIndices: [] },
      ];
    }

    return components.map((comp) => ({
      id: `comp-${comp.file}:${comp.line}`,
      type: "components" as const,
      label: comp.name,
      sublabel: `${comp.file.split("/").slice(-2).join("/")}:${comp.line}`,
      component: comp,
      file: comp.file,
      line: comp.line,
      score: 0,
      matchedIndices: [],
    }));
  }, [components]);

  // Get all items for current scope
  const scopeItems = useMemo((): SearchResult[] => {
    switch (scope) {
      case "elements":
        return MOCK_ELEMENTS;
      case "components":
        return componentResults;
      case "layers":
        return MOCK_LAYERS;
      case "assets":
        return MOCK_ASSETS;
      default:
        return [];
    }
  }, [scope, componentResults]);

  // Search results with fuzzy matching
  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) {
      // Return first 10 items when no query
      return scopeItems.slice(0, 10);
    }

    const searchResults = fuzzySearch<SearchResult>(query, scopeItems, (item) =>
      `${item.label} ${item.sublabel || ""}`
    );

    return searchResults.map((r) => ({
      ...r.item,
      score: r.score,
      matchedIndices: r.matchedIndices,
    }));
  }, [query, scopeItems]);

  // Open search overlay
  const open = useCallback(() => {
    setIsOpen(true);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  // Close search overlay
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  // Set search scope
  const setScopeWithReset = useCallback((newScope: SearchScope) => {
    setScope(newScope);
    setSelectedIndex(0);
  }, []);

  // Navigate to next result
  const selectNext = useCallback(() => {
    setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
  }, [results.length]);

  // Navigate to previous result
  const selectPrevious = useCallback(() => {
    setSelectedIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  // Add to recent searches
  const addToRecent = useCallback((search: string) => {
    if (!search.trim()) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== search);
      const updated = [search, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      saveRecentSearches(updated);
      return updated;
    });
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    saveRecentSearches([]);
  }, []);

  // Get selected result
  const selectedResult = results[selectedIndex] ?? null;

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, scope]);

  return {
    isOpen,
    query,
    setQuery,
    scope,
    setScope: setScopeWithReset,
    results,
    selectedIndex,
    setSelectedIndex,
    selectedResult,
    recentSearches,
    open,
    close,
    selectNext,
    selectPrevious,
    addToRecent,
    clearRecentSearches,
    highlightMatches,
  };
}

export type UseSearchReturn = ReturnType<typeof useSearch>;
