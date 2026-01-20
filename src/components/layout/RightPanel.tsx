import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useAppStore } from "../../stores/appStore";
import { ColorPicker, type ColorValue } from "../designer/ColorPicker";

// Debounce helper for direct write mode
function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref on each render
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]) as T;
}

/**
 * RightPanel - Designer panel with CSS property sections
 *
 * Features:
 * - Collapsible sections with smooth transitions
 * - Icon rail when collapsed (scroll-to-section on click)
 * - Context-aware sections (non-applicable collapsed by default)
 * - State selector for hover/focus/active states
 * - Clipboard mode indicator (per fn-9, clipboard is the only mode)
 * - CSS output preview
 * - Breadcrumb navigation for selected element
 *
 * Sections: Layout, Spacing, Size, Position, Typography, Colors, Borders, Effects
 */

type RightPanelSection =
  | "layout"
  | "spacing"
  | "size"
  | "position"
  | "typography"
  | "colors"
  | "borders"
  | "effects";

// Note: Per fn-9, only clipboard mode is used (direct-edit removed)

interface CollapsibleSectionProps {
  id: RightPanelSection;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onRef?: (el: HTMLDivElement | null) => void;
}

function CollapsibleSection({
  id,
  title,
  icon,
  children,
  isOpen,
  onToggle,
  onRef,
}: CollapsibleSectionProps) {
  return (
    <div ref={onRef} className="border-b border-white/5" data-section={id}>
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-text-muted">{icon}</span>
          <span className="text-xs font-medium text-text uppercase tracking-wider">
            {title}
          </span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-text-muted transition-transform duration-200 ${
            isOpen ? "" : "-rotate-90"
          }`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}

// Section configuration
const SECTIONS: { id: RightPanelSection; title: string; defaultOpen: boolean }[] = [
  { id: "layout", title: "Layout", defaultOpen: true },
  { id: "spacing", title: "Spacing", defaultOpen: true },
  { id: "size", title: "Size", defaultOpen: false },
  { id: "position", title: "Position", defaultOpen: false },
  { id: "typography", title: "Typography", defaultOpen: false },
  { id: "colors", title: "Colors", defaultOpen: true },
  { id: "borders", title: "Borders", defaultOpen: false },
  { id: "effects", title: "Effects", defaultOpen: false },
];

interface RightPanelProps {
  /** Total width of the panel. Passed from EditorLayout. */
  width?: number;
}

export function RightPanel({ width = 320 }: RightPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedState, setSelectedState] = useState<string>("default");

  // Track open state for each section
  const [openSections, setOpenSections] = useState<Set<RightPanelSection>>(() =>
    new Set(SECTIONS.filter((s) => s.defaultOpen).map((s) => s.id))
  );

  // Refs for scrolling to sections
  const sectionRefs = useRef<Record<RightPanelSection, HTMLDivElement | null>>({
    layout: null,
    spacing: null,
    size: null,
    position: null,
    typography: null,
    colors: null,
    borders: null,
    effects: null,
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Toggle a section open/closed
  const toggleSection = useCallback((section: RightPanelSection) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  // Scroll to a section (used when clicking collapsed icon rail)
  const scrollToSection = useCallback((section: RightPanelSection) => {
    // First expand the panel if collapsed
    setIsCollapsed(false);

    // Ensure the section is open
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.add(section);
      return next;
    });

    // Scroll to the section after a brief delay to allow expansion
    setTimeout(() => {
      const sectionEl = sectionRefs.current[section];
      const container = scrollContainerRef.current;
      if (sectionEl && container) {
        sectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  }, []);

  // Expand all sections
  const expandAllSections = useCallback(() => {
    setOpenSections(new Set(SECTIONS.map((s) => s.id)));
  }, []);

  // Collapse all sections
  const collapseAllSections = useCallback(() => {
    setOpenSections(new Set());
  }, []);

  const icons = {
    layout: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 3v18" />
        <path d="M15 3v18" />
      </svg>
    ),
    spacing: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <rect x="7" y="7" width="10" height="10" rx="1" />
      </svg>
    ),
    size: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21 3H3v18" />
        <path d="M21 3v18" />
      </svg>
    ),
    position: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 2v4" />
        <path d="M12 18v4" />
        <path d="M2 12h4" />
        <path d="M18 12h4" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    typography: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="4 7 4 4 20 4 20 7" />
        <line x1="9" y1="20" x2="15" y2="20" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </svg>
    ),
    colors: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    borders: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    ),
    effects: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  };

  if (isCollapsed) {
    return (
      <div className="w-14 bg-surface border-l border-white/5 flex flex-col items-center py-3 gap-1">
        {/* Clipboard mode indicator */}
        <div
          className="w-10 h-10 flex items-center justify-center rounded-lg text-text-muted mb-2"
          title="Clipboard Mode"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="8" y="2" width="8" height="4" rx="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          </svg>
        </div>

        <div className="w-8 border-t border-white/10 mb-2" />

        {/* Section icons - click to expand and scroll */}
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              openSections.has(section.id)
                ? "text-primary bg-primary/10"
                : "text-text-muted hover:text-text hover:bg-white/5"
            }`}
            title={section.title}
          >
            {icons[section.id]}
          </button>
        ))}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Expand button at bottom */}
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-white/5"
          title="Expand panel"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="11 17 6 12 11 7" />
            <polyline points="18 17 13 12 18 7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div
      className="bg-surface/50 border-l border-white/5 flex flex-col"
      style={{ width }}
      data-devflow-id="right-panel"
    >
      {/* Header */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-white/5 shrink-0">
        <span className="text-xs font-medium text-text uppercase tracking-wider">
          Designer
        </span>
        <div className="flex items-center gap-1">
          {/* Clipboard mode indicator */}
          <div className="flex items-center gap-1 bg-background/50 rounded-md px-2 py-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
              <rect x="8" y="2" width="8" height="4" rx="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            </svg>
            <span className="text-[10px] text-text-muted">Clipboard</span>
          </div>

          {/* Collapse button */}
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-text-muted hover:text-text p-1 rounded hover:bg-white/5 transition-colors"
            title="Collapse panel"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="13 17 18 12 13 7" />
              <polyline points="6 17 11 12 6 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Breadcrumb & State Selector Row */}
      <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="text-xs text-text-muted font-mono truncate flex-1">
          <span className="hover:text-primary cursor-pointer transition-colors">div</span>
          <span className="mx-1 text-text-muted/50">{">"}</span>
          <span className="hover:text-primary cursor-pointer transition-colors">section</span>
          <span className="mx-1 text-text-muted/50">{">"}</span>
          <span className="text-text">button</span>
        </div>
        {/* State selector */}
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="bg-background/50 border border-white/8 rounded-md px-2 py-1 text-[10px] text-text ml-2"
        >
          <option value="default">Default</option>
          <option value="hover">:hover</option>
          <option value="focus">:focus</option>
          <option value="active">:active</option>
        </select>
      </div>

      {/* Section controls */}
      <div className="px-3 py-1.5 border-b border-white/5 flex items-center gap-1 shrink-0">
        <button
          onClick={expandAllSections}
          className="text-[10px] text-text-muted hover:text-text px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors"
        >
          Expand All
        </button>
        <span className="text-text-muted/50 text-[10px]">|</span>
        <button
          onClick={collapseAllSections}
          className="text-[10px] text-text-muted hover:text-text px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors"
        >
          Collapse All
        </button>
      </div>

      {/* Scrollable content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto">
        <CollapsibleSection
          id="layout"
          title="Layout"
          icon={icons.layout}
          isOpen={openSections.has("layout")}
          onToggle={() => toggleSection("layout")}
          onRef={(el) => { sectionRefs.current.layout = el; }}
        >
          <LayoutSection />
        </CollapsibleSection>

        <CollapsibleSection
          id="spacing"
          title="Spacing"
          icon={icons.spacing}
          isOpen={openSections.has("spacing")}
          onToggle={() => toggleSection("spacing")}
          onRef={(el) => { sectionRefs.current.spacing = el; }}
        >
          <SpacingSection />
        </CollapsibleSection>

        <CollapsibleSection
          id="size"
          title="Size"
          icon={icons.size}
          isOpen={openSections.has("size")}
          onToggle={() => toggleSection("size")}
          onRef={(el) => { sectionRefs.current.size = el; }}
        >
          <SizeSection />
        </CollapsibleSection>

        <CollapsibleSection
          id="position"
          title="Position"
          icon={icons.position}
          isOpen={openSections.has("position")}
          onToggle={() => toggleSection("position")}
          onRef={(el) => { sectionRefs.current.position = el; }}
        >
          <PositionSection />
        </CollapsibleSection>

        <CollapsibleSection
          id="typography"
          title="Typography"
          icon={icons.typography}
          isOpen={openSections.has("typography")}
          onToggle={() => toggleSection("typography")}
          onRef={(el) => { sectionRefs.current.typography = el; }}
        >
          <TypographySection />
        </CollapsibleSection>

        <CollapsibleSection
          id="colors"
          title="Colors"
          icon={icons.colors}
          isOpen={openSections.has("colors")}
          onToggle={() => toggleSection("colors")}
          onRef={(el) => { sectionRefs.current.colors = el; }}
        >
          <ColorsSection />
        </CollapsibleSection>

        <CollapsibleSection
          id="borders"
          title="Borders"
          icon={icons.borders}
          isOpen={openSections.has("borders")}
          onToggle={() => toggleSection("borders")}
          onRef={(el) => { sectionRefs.current.borders = el; }}
        >
          <BordersSection />
        </CollapsibleSection>

        <CollapsibleSection
          id="effects"
          title="Effects"
          icon={icons.effects}
          isOpen={openSections.has("effects")}
          onToggle={() => toggleSection("effects")}
          onRef={(el) => { sectionRefs.current.effects = el; }}
        >
          <EffectsSection />
        </CollapsibleSection>
      </div>

      {/* CSS Output Footer (Clipboard Mode) */}
      <div className="border-t border-white/5 p-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">
            CSS Output
          </span>
        </div>
        <div className="bg-background/50 rounded-md p-2 font-mono text-[11px] text-text-muted max-h-20 overflow-auto">
          <pre className="whitespace-pre-wrap">{`.button {
  display: flex;
  padding: 8px 16px;
  background: var(--primary);
}`}</pre>
        </div>
        <button className="mt-2 w-full py-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-xs rounded-md transition-colors flex items-center justify-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="8" y="2" width="8" height="4" rx="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          </svg>
          Copy to Clipboard
        </button>
      </div>
    </div>
  );
}

type DisplayType = "block" | "flex" | "grid" | "none";
type FlexDirection = "row" | "column" | "row-reverse" | "column-reverse";
type FlexWrap = "nowrap" | "wrap" | "wrap-reverse";
type AlignItems = "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
type JustifyContent = "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";

// Map 9-point grid position to align-items + justify-content
const ALIGNMENT_MAP: { alignItems: AlignItems; justifyContent: JustifyContent }[] = [
  { alignItems: "flex-start", justifyContent: "flex-start" },   // 0: top-left
  { alignItems: "flex-start", justifyContent: "center" },       // 1: top-center
  { alignItems: "flex-start", justifyContent: "flex-end" },     // 2: top-right
  { alignItems: "center", justifyContent: "flex-start" },       // 3: middle-left
  { alignItems: "center", justifyContent: "center" },           // 4: middle-center
  { alignItems: "center", justifyContent: "flex-end" },         // 5: middle-right
  { alignItems: "flex-end", justifyContent: "flex-start" },     // 6: bottom-left
  { alignItems: "flex-end", justifyContent: "center" },         // 7: bottom-center
  { alignItems: "flex-end", justifyContent: "flex-end" },       // 8: bottom-right
];

function LayoutSection() {
  const [display, setDisplay] = useState<DisplayType>("flex");
  const [direction, setDirection] = useState<FlexDirection>("row");
  const [wrap, setWrap] = useState<FlexWrap>("nowrap");
  const [alignItems, setAlignItems] = useState<AlignItems>("center");
  const [justifyContent, setJustifyContent] = useState<JustifyContent>("center");
  const [gap, setGap] = useState("8");
  const [gridColumns, setGridColumns] = useState("2");
  const [gridRows, setGridRows] = useState("auto");

  // Find selected alignment grid position
  const selectedGridPos = ALIGNMENT_MAP.findIndex(
    (m) => m.alignItems === alignItems && m.justifyContent === justifyContent
  );

  // Handle alignment grid click
  const handleAlignmentClick = (index: number) => {
    const mapping = ALIGNMENT_MAP[index];
    setAlignItems(mapping.alignItems);
    setJustifyContent(mapping.justifyContent);
  };

  return (
    <div className="space-y-3">
      {/* Display tabs */}
      <div className="flex gap-1 bg-background/50 rounded-md p-0.5">
        {(["block", "flex", "grid", "none"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDisplay(d)}
            className={`flex-1 py-1 text-xs rounded-md transition-colors ${
              display === d
                ? "bg-surface text-text"
                : "text-text-muted hover:text-text"
            }`}
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      {/* Flex controls */}
      {display === "flex" && (
        <>
          {/* Direction */}
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
              Direction
            </label>
            <div className="flex gap-1">
              {([
                { value: "row", icon: "→", label: "Row" },
                { value: "column", icon: "↓", label: "Col" },
                { value: "row-reverse", icon: "←", label: "Row Rev" },
                { value: "column-reverse", icon: "↑", label: "Col Rev" },
              ] as { value: FlexDirection; icon: string; label: string }[]).map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDirection(d.value)}
                  className={`flex-1 py-1.5 text-xs rounded-md transition-colors flex items-center justify-center gap-1 ${
                    direction === d.value
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-background/50 text-text-muted hover:text-text border border-transparent"
                  }`}
                  title={d.label}
                >
                  {d.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Wrap */}
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
              Wrap
            </label>
            <div className="flex gap-1">
              {([
                { value: "nowrap", label: "No Wrap" },
                { value: "wrap", label: "Wrap" },
                { value: "wrap-reverse", label: "Reverse" },
              ] as { value: FlexWrap; label: string }[]).map((w) => (
                <button
                  key={w.value}
                  onClick={() => setWrap(w.value)}
                  className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                    wrap === w.value
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-background/50 text-text-muted hover:text-text border border-transparent"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* 9-point alignment grid + Gap */}
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
              Alignment
            </label>
            <div className="flex gap-3 items-start">
              <div className="grid grid-cols-3 gap-1 w-16 h-16 bg-background/50 rounded-md p-1.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handleAlignmentClick(i)}
                    className={`w-full h-full rounded-sm transition-colors ${
                      selectedGridPos === i
                        ? "bg-primary"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  />
                ))}
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <label className="text-[10px] text-text-muted block mb-1">Align Items</label>
                  <select
                    value={alignItems}
                    onChange={(e) => setAlignItems(e.target.value as AlignItems)}
                    className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
                  >
                    <option value="flex-start">Start</option>
                    <option value="center">Center</option>
                    <option value="flex-end">End</option>
                    <option value="stretch">Stretch</option>
                    <option value="baseline">Baseline</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-text-muted block mb-1">Justify</label>
                  <select
                    value={justifyContent}
                    onChange={(e) => setJustifyContent(e.target.value as JustifyContent)}
                    className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
                  >
                    <option value="flex-start">Start</option>
                    <option value="center">Center</option>
                    <option value="flex-end">End</option>
                    <option value="space-between">Between</option>
                    <option value="space-around">Around</option>
                    <option value="space-evenly">Evenly</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Gap */}
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
              Gap
            </label>
            <div className="flex gap-1">
              {["0", "4", "8", "12", "16", "24"].map((g) => (
                <button
                  key={g}
                  onClick={() => setGap(g)}
                  className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                    gap === g
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-background/50 text-text-muted hover:text-text border border-transparent"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Grid controls */}
      {display === "grid" && (
        <>
          {/* Columns */}
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
              Columns
            </label>
            <div className="flex gap-1">
              {["1", "2", "3", "4", "6", "12"].map((c) => (
                <button
                  key={c}
                  onClick={() => setGridColumns(c)}
                  className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                    gridColumns === c
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-background/50 text-text-muted hover:text-text border border-transparent"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
              Rows
            </label>
            <div className="flex gap-1">
              {["auto", "1", "2", "3", "4"].map((r) => (
                <button
                  key={r}
                  onClick={() => setGridRows(r)}
                  className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                    gridRows === r
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-background/50 text-text-muted hover:text-text border border-transparent"
                  }`}
                >
                  {r === "auto" ? "Auto" : r}
                </button>
              ))}
            </div>
          </div>

          {/* Gap for grid */}
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
              Gap
            </label>
            <div className="flex gap-1">
              {["0", "4", "8", "12", "16", "24"].map((g) => (
                <button
                  key={g}
                  onClick={() => setGap(g)}
                  className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                    gap === g
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-background/50 text-text-muted hover:text-text border border-transparent"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Alignment for grid */}
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
              Place Items
            </label>
            <div className="grid grid-cols-3 gap-1 w-16 h-16 bg-background/50 rounded-md p-1.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleAlignmentClick(i)}
                  className={`w-full h-full rounded-sm transition-colors ${
                    selectedGridPos === i
                      ? "bg-primary"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Block display - minimal controls */}
      {display === "block" && (
        <div className="text-xs text-text-muted py-2">
          Block elements stack vertically and take full width.
        </div>
      )}

      {/* None display - info */}
      {display === "none" && (
        <div className="text-xs text-text-muted py-2">
          Element is hidden from the layout.
        </div>
      )}
    </div>
  );
}

type SpacingSide = "top" | "right" | "bottom" | "left";
type SpacingType = "margin" | "padding";

interface SpacingValues {
  margin: { top: string; right: string; bottom: string; left: string };
  padding: { top: string; right: string; bottom: string; left: string };
  gap: string;
}

function SpacingSection() {
  const [values, setValues] = useState<SpacingValues>({
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
    padding: { top: "16", right: "16", bottom: "16", left: "16" },
    gap: "8",
  });
  const [activeInput, setActiveInput] = useState<{ type: SpacingType; side: SpacingSide } | null>(null);
  const [marginLinked, setMarginLinked] = useState(true);
  const [paddingLinked, setPaddingLinked] = useState(true);
  const [showTokenPicker, setShowTokenPicker] = useState(false);

  // Common spacing tokens
  const spacingTokens = ["0", "2", "4", "6", "8", "12", "16", "20", "24", "32", "40", "48", "64"];

  // Handle value change
  const handleValueChange = (type: SpacingType, side: SpacingSide, newValue: string) => {
    const isLinked = type === "margin" ? marginLinked : paddingLinked;

    setValues((prev) => {
      if (isLinked) {
        // Update all sides when linked
        return {
          ...prev,
          [type]: { top: newValue, right: newValue, bottom: newValue, left: newValue },
        };
      } else {
        // Update only the specific side
        return {
          ...prev,
          [type]: { ...prev[type], [side]: newValue },
        };
      }
    });
  };

  // Handle clicking on a value to edit
  const handleValueClick = (type: SpacingType, side: SpacingSide) => {
    if (activeInput?.type === type && activeInput?.side === side) {
      setActiveInput(null);
      setShowTokenPicker(false);
    } else {
      setActiveInput({ type, side });
      setShowTokenPicker(true);
    }
  };

  // Handle token selection
  const handleTokenSelect = (token: string) => {
    if (activeInput) {
      handleValueChange(activeInput.type, activeInput.side, token);
    }
    setShowTokenPicker(false);
    setActiveInput(null);
  };

  // Handle gap change
  const handleGapChange = (newGap: string) => {
    setValues((prev) => ({ ...prev, gap: newGap }));
  };

  // Render editable value button
  const renderValue = (type: SpacingType, side: SpacingSide) => {
    const value = values[type][side];
    const isActive = activeInput?.type === type && activeInput?.side === side;
    const colorClass = type === "margin" ? "text-orange-400" : "text-green-400";
    const bgClass = type === "margin"
      ? (isActive ? "bg-orange-500/30" : "hover:bg-orange-500/20")
      : (isActive ? "bg-green-500/30" : "hover:bg-green-500/20");

    return (
      <button
        onClick={() => handleValueClick(type, side)}
        className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${colorClass} ${bgClass}`}
      >
        {value || "-"}
      </button>
    );
  };

  return (
    <div className="space-y-3">
      {/* Chrome DevTools style box model */}
      <div className="relative">
        {/* Margin (outer box) */}
        <div className="bg-orange-500/10 rounded-lg p-1 relative">
          {/* Margin label */}
          <div className="absolute top-1 left-2 text-[9px] text-orange-400/70 uppercase tracking-wider font-medium">
            margin
          </div>

          {/* Link toggle for margin */}
          <button
            onClick={() => setMarginLinked(!marginLinked)}
            className={`absolute top-1 right-2 p-0.5 rounded transition-colors ${
              marginLinked ? "text-orange-400" : "text-orange-400/40"
            }`}
            title={marginLinked ? "Unlink margin values" : "Link margin values"}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {marginLinked ? (
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              ) : (
                <>
                  <path d="M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-3 3a5 5 0 0 0 .54 7.54" />
                  <path d="M5.16 11.75l-1.72 1.71a5 5 0 0 0 7.07 7.07l3-3a5 5 0 0 0-.54-7.54" />
                </>
              )}
            </svg>
          </button>

          {/* Margin top */}
          <div className="flex justify-center pt-3 pb-1">
            {renderValue("margin", "top")}
          </div>

          {/* Middle row: margin-left, padding box, margin-right */}
          <div className="flex items-center">
            {/* Margin left */}
            <div className="w-8 flex justify-center">
              {renderValue("margin", "left")}
            </div>

            {/* Padding (inner box) */}
            <div className="flex-1 bg-green-500/10 rounded-md p-1 relative mx-1">
              {/* Padding label */}
              <div className="absolute top-0.5 left-2 text-[9px] text-green-400/70 uppercase tracking-wider font-medium">
                padding
              </div>

              {/* Link toggle for padding */}
              <button
                onClick={() => setPaddingLinked(!paddingLinked)}
                className={`absolute top-0.5 right-2 p-0.5 rounded transition-colors ${
                  paddingLinked ? "text-green-400" : "text-green-400/40"
                }`}
                title={paddingLinked ? "Unlink padding values" : "Link padding values"}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {paddingLinked ? (
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  ) : (
                    <>
                      <path d="M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-3 3a5 5 0 0 0 .54 7.54" />
                      <path d="M5.16 11.75l-1.72 1.71a5 5 0 0 0 7.07 7.07l3-3a5 5 0 0 0-.54-7.54" />
                    </>
                  )}
                </svg>
              </button>

              {/* Padding top */}
              <div className="flex justify-center pt-2.5 pb-1">
                {renderValue("padding", "top")}
              </div>

              {/* Middle row: padding-left, content, padding-right */}
              <div className="flex items-center justify-between">
                <div className="w-8 flex justify-center">
                  {renderValue("padding", "left")}
                </div>

                {/* Content box */}
                <div className="flex-1 mx-1 h-7 bg-primary/20 rounded border border-primary/30 flex items-center justify-center">
                  <span className="text-[9px] text-primary/70 uppercase tracking-wider">content</span>
                </div>

                <div className="w-8 flex justify-center">
                  {renderValue("padding", "right")}
                </div>
              </div>

              {/* Padding bottom */}
              <div className="flex justify-center pt-1 pb-2">
                {renderValue("padding", "bottom")}
              </div>
            </div>

            {/* Margin right */}
            <div className="w-8 flex justify-center">
              {renderValue("margin", "right")}
            </div>
          </div>

          {/* Margin bottom */}
          <div className="flex justify-center pt-1 pb-2">
            {renderValue("margin", "bottom")}
          </div>
        </div>
      </div>

      {/* Token picker (shows when editing) */}
      {showTokenPicker && activeInput && (
        <div className="bg-background/80 rounded-md p-2 border border-white/10">
          <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">
            {activeInput.type}-{activeInput.side}
          </div>
          <div className="flex flex-wrap gap-1">
            {spacingTokens.map((token) => (
              <button
                key={token}
                onClick={() => handleTokenSelect(token)}
                className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${
                  values[activeInput.type][activeInput.side] === token
                    ? "bg-primary/30 text-primary border border-primary/50"
                    : "bg-white/5 text-text-muted hover:bg-white/10 hover:text-text border border-transparent"
                }`}
              >
                {token}
              </button>
            ))}
          </div>
          {/* Custom value input */}
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              placeholder="Custom value..."
              className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleTokenSelect((e.target as HTMLInputElement).value);
                }
              }}
            />
            <button
              onClick={() => {
                setShowTokenPicker(false);
                setActiveInput(null);
              }}
              className="px-2 py-1 text-xs text-text-muted hover:text-text bg-white/5 rounded-md"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Gap control */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Gap <span className="text-text-muted/50">(flex/grid)</span>
        </label>
        <div className="flex gap-1">
          {["0", "4", "8", "12", "16", "24"].map((g) => (
            <button
              key={g}
              onClick={() => handleGapChange(g)}
              className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                values.gap === g
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-background/50 text-text-muted hover:text-text border border-transparent"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

type SizeUnit = "px" | "rem" | "%" | "vw" | "vh" | "auto";
type OverflowValue = "visible" | "hidden" | "scroll" | "auto";
type AspectRatioPreset = "auto" | "1:1" | "16:9" | "4:3" | "3:2" | "2:3" | "2:1" | "custom";
type ObjectFitValue = "fill" | "contain" | "cover" | "none" | "scale-down";

interface SizeInputProps {
  label: string;
  value: string;
  unit: SizeUnit;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: SizeUnit) => void;
  placeholder?: string;
}

function SizeInput({ label, value, unit, onValueChange, onUnitChange, placeholder = "auto" }: SizeInputProps) {
  const units: SizeUnit[] = ["px", "rem", "%", "vw", "vh", "auto"];

  return (
    <div>
      <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">{label}</label>
      <div className="flex gap-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono min-w-0"
        />
        <select
          value={unit}
          onChange={(e) => onUnitChange(e.target.value as SizeUnit)}
          className="h-7 bg-background/50 border border-white/8 rounded-md px-1 text-[10px] text-text-muted w-14"
        >
          {units.map((u) => (
            <option key={u} value={u}>{u.toUpperCase()}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function SizeSection() {
  // Width/Height state
  const [width, setWidth] = useState({ value: "", unit: "auto" as SizeUnit });
  const [height, setHeight] = useState({ value: "", unit: "auto" as SizeUnit });

  // Min/Max constraints
  const [minWidth, setMinWidth] = useState({ value: "0", unit: "px" as SizeUnit });
  const [maxWidth, setMaxWidth] = useState({ value: "", unit: "auto" as SizeUnit });
  const [minHeight, setMinHeight] = useState({ value: "0", unit: "px" as SizeUnit });
  const [maxHeight, setMaxHeight] = useState({ value: "", unit: "auto" as SizeUnit });

  // Overflow
  const [overflow, setOverflow] = useState<OverflowValue>("visible");

  // Aspect ratio
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>("auto");
  const [customRatio, setCustomRatio] = useState({ w: "16", h: "9" });

  // Object fit
  const [objectFit, setObjectFit] = useState<ObjectFitValue>("fill");

  // Overflow icons
  const overflowOptions: { value: OverflowValue; icon: React.ReactNode; label: string }[] = [
    {
      value: "visible",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
        </svg>
      ),
      label: "Visible",
    },
    {
      value: "hidden",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ),
      label: "Hidden",
    },
    {
      value: "scroll",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M21 9h-4" />
          <path d="M21 15h-4" />
          <path d="M19 12V7m0 10v-5" />
        </svg>
      ),
      label: "Scroll",
    },
    {
      value: "auto",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      ),
      label: "Auto",
    },
  ];

  // Aspect ratio presets
  const aspectRatioOptions: { value: AspectRatioPreset; label: string }[] = [
    { value: "auto", label: "Auto" },
    { value: "1:1", label: "Square (1:1)" },
    { value: "16:9", label: "Widescreen (16:9)" },
    { value: "4:3", label: "Landscape (4:3)" },
    { value: "3:2", label: "Photo (3:2)" },
    { value: "2:3", label: "Portrait (2:3)" },
    { value: "2:1", label: "Univisium (2:1)" },
    { value: "custom", label: "Custom" },
  ];

  // Object fit options
  const objectFitOptions: { value: ObjectFitValue; label: string }[] = [
    { value: "fill", label: "Fill" },
    { value: "contain", label: "Contain" },
    { value: "cover", label: "Cover" },
    { value: "none", label: "None" },
    { value: "scale-down", label: "Scale Down" },
  ];

  return (
    <div className="space-y-4">
      {/* Width and Height */}
      <div className="grid grid-cols-2 gap-3">
        <SizeInput
          label="Width"
          value={width.value}
          unit={width.unit}
          onValueChange={(v) => setWidth({ ...width, value: v })}
          onUnitChange={(u) => setWidth({ ...width, unit: u })}
        />
        <SizeInput
          label="Height"
          value={height.value}
          unit={height.unit}
          onValueChange={(v) => setHeight({ ...height, value: v })}
          onUnitChange={(u) => setHeight({ ...height, unit: u })}
        />
      </div>

      {/* Min/Max Width */}
      <div className="grid grid-cols-2 gap-3">
        <SizeInput
          label="Min W"
          value={minWidth.value}
          unit={minWidth.unit}
          onValueChange={(v) => setMinWidth({ ...minWidth, value: v })}
          onUnitChange={(u) => setMinWidth({ ...minWidth, unit: u })}
          placeholder="0"
        />
        <SizeInput
          label="Max W"
          value={maxWidth.value}
          unit={maxWidth.unit}
          onValueChange={(v) => setMaxWidth({ ...maxWidth, value: v })}
          onUnitChange={(u) => setMaxWidth({ ...maxWidth, unit: u })}
          placeholder="none"
        />
      </div>

      {/* Min/Max Height */}
      <div className="grid grid-cols-2 gap-3">
        <SizeInput
          label="Min H"
          value={minHeight.value}
          unit={minHeight.unit}
          onValueChange={(v) => setMinHeight({ ...minHeight, value: v })}
          onUnitChange={(u) => setMinHeight({ ...minHeight, unit: u })}
          placeholder="0"
        />
        <SizeInput
          label="Max H"
          value={maxHeight.value}
          unit={maxHeight.unit}
          onValueChange={(v) => setMaxHeight({ ...maxHeight, value: v })}
          onUnitChange={(u) => setMaxHeight({ ...maxHeight, unit: u })}
          placeholder="none"
        />
      </div>

      {/* Overflow */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Overflow
        </label>
        <div className="flex gap-1">
          {overflowOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setOverflow(opt.value)}
              className={`flex-1 py-1.5 flex items-center justify-center rounded-md transition-colors ${
                overflow === opt.value
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-background/50 text-text-muted hover:text-text border border-transparent"
              }`}
              title={opt.label}
            >
              {opt.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Aspect Ratio
        </label>
        <select
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value as AspectRatioPreset)}
          className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
        >
          {aspectRatioOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {aspectRatio === "custom" && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={customRatio.w}
              onChange={(e) => setCustomRatio({ ...customRatio, w: e.target.value })}
              className="w-12 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text text-center font-mono"
              placeholder="W"
            />
            <span className="text-text-muted text-xs">:</span>
            <input
              type="text"
              value={customRatio.h}
              onChange={(e) => setCustomRatio({ ...customRatio, h: e.target.value })}
              className="w-12 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text text-center font-mono"
              placeholder="H"
            />
          </div>
        )}
      </div>

      {/* Object Fit */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Object Fit
        </label>
        <select
          value={objectFit}
          onChange={(e) => setObjectFit(e.target.value as ObjectFitValue)}
          className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
        >
          {objectFitOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

type PositionType = "static" | "relative" | "absolute" | "fixed" | "sticky";
type PositionUnit = "px" | "rem" | "%" | "auto";
type PositionOrigin = "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br";

interface OffsetValues {
  top: { value: string; unit: PositionUnit };
  right: { value: string; unit: PositionUnit };
  bottom: { value: string; unit: PositionUnit };
  left: { value: string; unit: PositionUnit };
}

interface PositionInputProps {
  label: string;
  value: string;
  unit: PositionUnit;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: PositionUnit) => void;
}

function PositionInput({ label, value, unit, onValueChange, onUnitChange }: PositionInputProps) {
  const units: PositionUnit[] = ["px", "rem", "%", "auto"];

  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-text-muted w-5">{label}</span>
      <input
        type="text"
        value={unit === "auto" ? "" : value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="auto"
        disabled={unit === "auto"}
        className="flex-1 h-6 bg-background/50 border border-white/8 rounded px-1.5 text-[11px] text-text font-mono min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <select
        value={unit}
        onChange={(e) => onUnitChange(e.target.value as PositionUnit)}
        className="h-6 bg-background/50 border border-white/8 rounded px-0.5 text-[10px] text-text-muted w-12"
      >
        {units.map((u) => (
          <option key={u} value={u}>{u.toUpperCase()}</option>
        ))}
      </select>
    </div>
  );
}

// Helper to format offset value with unit
function formatOffsetValue(value: string, unit: PositionUnit): string {
  if (unit === "auto") return "auto";
  if (!value || value === "") return "auto";
  return `${value}${unit}`;
}

// Helper to generate CSS for position changes
function generatePositionCss(
  position: PositionType,
  offsets: OffsetValues,
  zIndex: string
): string {
  const lines: string[] = [`position: ${position};`];

  if (position !== "static") {
    const sides = ["top", "right", "bottom", "left"] as const;
    for (const side of sides) {
      const offset = offsets[side];
      const formatted = formatOffsetValue(offset.value, offset.unit);
      if (formatted !== "auto") {
        lines.push(`${side}: ${formatted};`);
      }
    }
  }

  if (zIndex !== "auto" && zIndex !== "") {
    lines.push(`z-index: ${zIndex};`);
  }

  return lines.join("\n  ");
}

function PositionSection() {
  // App state integration (directWriteMode removed per fn-9)
  const { selectedEntry, addStyleEdit } = useAppStore();

  const [position, setPosition] = useState<PositionType>("static");
  const [offsets, setOffsets] = useState<OffsetValues>({
    top: { value: "", unit: "auto" },
    right: { value: "", unit: "auto" },
    bottom: { value: "", unit: "auto" },
    left: { value: "", unit: "auto" },
  });
  const [zIndex, setZIndex] = useState<string>("auto");
  const [positionOrigin, setPositionOrigin] = useState<PositionOrigin>("tl");

  // Sync local state with selected element (when selection changes)
  useEffect(() => {
    // Reset to defaults when no selection
    if (!selectedEntry) {
      setPosition("static");
      setOffsets({
        top: { value: "", unit: "auto" },
        right: { value: "", unit: "auto" },
        bottom: { value: "", unit: "auto" },
        left: { value: "", unit: "auto" },
      });
      setZIndex("auto");
      return;
    }
    // Future: Read computed styles from preview iframe when available
    // For now, start with defaults for new selections
  }, [selectedEntry?.radflowId]);

  // Apply style edit to app state
  const applyStyleEdit = useCallback((property: string, oldValue: string, newValue: string) => {
    if (!selectedEntry?.source) return;

    addStyleEdit({
      radflowId: selectedEntry.radflowId,
      componentName: selectedEntry.name,
      source: selectedEntry.source,
      property,
      oldValue,
      newValue,
    });

    // Copy to clipboard
    const css = generatePositionCss(position, offsets, zIndex);
    navigator.clipboard.writeText(css).catch(() => {
      // Clipboard API may fail in some contexts
    });
  }, [selectedEntry, addStyleEdit, position, offsets, zIndex]);

  // Handle position type change
  const handlePositionChange = useCallback((newPosition: PositionType) => {
    const oldPosition = position;
    setPosition(newPosition);
    applyStyleEdit("position", oldPosition, newPosition);
  }, [position, applyStyleEdit]);

  // Update offset value with style edit
  const updateOffsetValue = useCallback((side: keyof OffsetValues, value: string) => {
    setOffsets((prev) => {
      const oldFormatted = formatOffsetValue(prev[side].value, prev[side].unit);
      const newFormatted = formatOffsetValue(value, prev[side].unit);
      if (oldFormatted !== newFormatted && selectedEntry?.source) {
        applyStyleEdit(side, oldFormatted, newFormatted);
      }
      return {
        ...prev,
        [side]: { ...prev[side], value },
      };
    });
  }, [applyStyleEdit, selectedEntry]);

  // Update offset unit with style edit
  const updateOffsetUnit = useCallback((side: keyof OffsetValues, unit: PositionUnit) => {
    setOffsets((prev) => {
      const oldFormatted = formatOffsetValue(prev[side].value, prev[side].unit);
      const newValue = unit === "auto" ? "" : prev[side].value;
      const newFormatted = formatOffsetValue(newValue, unit);
      if (oldFormatted !== newFormatted && selectedEntry?.source) {
        applyStyleEdit(side, oldFormatted, newFormatted);
      }
      return {
        ...prev,
        [side]: { ...prev[side], unit, value: newValue },
      };
    });
  }, [applyStyleEdit, selectedEntry]);

  // Handle z-index change with validation
  const handleZIndexChange = useCallback((value: string) => {
    // Validate: must be empty, "auto", or an integer (including negative)
    if (value === "" || value === "auto" || /^-?\d+$/.test(value)) {
      const oldValue = zIndex;
      setZIndex(value);
      if (selectedEntry?.source) {
        applyStyleEdit("z-index", oldValue === "" ? "auto" : oldValue, value === "" ? "auto" : value);
      }
    }
  }, [zIndex, applyStyleEdit, selectedEntry]);

  // Apply position origin preset (for absolute positioning)
  const applyPositionOrigin = useCallback((origin: PositionOrigin) => {
    setPositionOrigin(origin);

    // Convert origin to offset presets
    const presets: Record<PositionOrigin, OffsetValues> = {
      tl: { top: { value: "0", unit: "px" }, left: { value: "0", unit: "px" }, bottom: { value: "", unit: "auto" }, right: { value: "", unit: "auto" } },
      tc: { top: { value: "0", unit: "px" }, left: { value: "50", unit: "%" }, bottom: { value: "", unit: "auto" }, right: { value: "", unit: "auto" } },
      tr: { top: { value: "0", unit: "px" }, right: { value: "0", unit: "px" }, bottom: { value: "", unit: "auto" }, left: { value: "", unit: "auto" } },
      ml: { top: { value: "50", unit: "%" }, left: { value: "0", unit: "px" }, bottom: { value: "", unit: "auto" }, right: { value: "", unit: "auto" } },
      mc: { top: { value: "50", unit: "%" }, left: { value: "50", unit: "%" }, bottom: { value: "", unit: "auto" }, right: { value: "", unit: "auto" } },
      mr: { top: { value: "50", unit: "%" }, right: { value: "0", unit: "px" }, bottom: { value: "", unit: "auto" }, left: { value: "", unit: "auto" } },
      bl: { bottom: { value: "0", unit: "px" }, left: { value: "0", unit: "px" }, top: { value: "", unit: "auto" }, right: { value: "", unit: "auto" } },
      bc: { bottom: { value: "0", unit: "px" }, left: { value: "50", unit: "%" }, top: { value: "", unit: "auto" }, right: { value: "", unit: "auto" } },
      br: { bottom: { value: "0", unit: "px" }, right: { value: "0", unit: "px" }, top: { value: "", unit: "auto" }, left: { value: "", unit: "auto" } },
    };

    const preset = presets[origin];
    // Apply each offset change
    if (selectedEntry?.source) {
      const sides = ["top", "right", "bottom", "left"] as const;
      for (const side of sides) {
        const oldFormatted = formatOffsetValue(offsets[side].value, offsets[side].unit);
        const newFormatted = formatOffsetValue(preset[side].value, preset[side].unit);
        if (oldFormatted !== newFormatted) {
          applyStyleEdit(side, oldFormatted, newFormatted);
        }
      }
    }
    setOffsets(preset);
  }, [applyStyleEdit, selectedEntry, offsets]);

  // Position type icons
  const positionIcons: Record<PositionType, React.ReactNode> = {
    static: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    relative: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="4" width="10" height="10" rx="1" />
        <rect x="10" y="10" width="10" height="10" rx="1" strokeDasharray="3 2" />
      </svg>
    ),
    absolute: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="2" strokeDasharray="3 2" />
        <rect x="6" y="6" width="8" height="8" rx="1" />
      </svg>
    ),
    fixed: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 5v2M12 17v2M5 12h2M17 12h2" />
      </svg>
    ),
    sticky: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M4 9h16" />
        <rect x="7" y="12" width="6" height="5" rx="1" />
      </svg>
    ),
  };

  // Position type descriptions
  const positionDescriptions: Record<PositionType, string> = {
    static: "Default position in normal document flow",
    relative: "Offset relative to its normal position",
    absolute: "Positioned relative to nearest positioned ancestor",
    fixed: "Positioned relative to the viewport",
    sticky: "Toggles between relative and fixed based on scroll",
  };

  // Position origin grid for absolute positioning
  const originPositions: { id: PositionOrigin; row: number; col: number }[] = [
    { id: "tl", row: 0, col: 0 }, { id: "tc", row: 0, col: 1 }, { id: "tr", row: 0, col: 2 },
    { id: "ml", row: 1, col: 0 }, { id: "mc", row: 1, col: 1 }, { id: "mr", row: 1, col: 2 },
    { id: "bl", row: 2, col: 0 }, { id: "bc", row: 2, col: 1 }, { id: "br", row: 2, col: 2 },
  ];

  return (
    <div className="space-y-3">
      {/* Position type selector */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Type
        </label>
        <div className="flex gap-0.5 bg-background/50 rounded-md p-0.5">
          {(["static", "relative", "absolute", "fixed", "sticky"] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePositionChange(p)}
              className={`flex-1 py-1.5 text-[10px] rounded transition-colors flex items-center justify-center gap-1 ${
                position === p
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-text-muted hover:text-text border border-transparent"
              }`}
              title={positionDescriptions[p]}
            >
              {positionIcons[p]}
              <span className="hidden sm:inline">{p.slice(0, 3).toUpperCase()}</span>
            </button>
          ))}
        </div>
        {/* Description */}
        <p className="text-[10px] text-text-muted/70 mt-1.5 italic">
          {positionDescriptions[position]}
        </p>
      </div>

      {/* Offset inputs - only show when not static */}
      {position !== "static" && (
        <>
          {/* Visual offset diagram */}
          <div className="relative">
            <div className="bg-background/30 rounded-lg p-3">
              {/* Top offset */}
              <div className="flex justify-center mb-1">
                <div className="w-24">
                  <PositionInput
                    label="T"
                    value={offsets.top.value}
                    unit={offsets.top.unit}
                    onValueChange={(v) => updateOffsetValue("top", v)}
                    onUnitChange={(u) => updateOffsetUnit("top", u)}
                  />
                </div>
              </div>

              {/* Left, Center visual, Right */}
              <div className="flex items-center gap-2">
                {/* Left offset */}
                <div className="w-24">
                  <PositionInput
                    label="L"
                    value={offsets.left.value}
                    unit={offsets.left.unit}
                    onValueChange={(v) => updateOffsetValue("left", v)}
                    onUnitChange={(u) => updateOffsetUnit("left", u)}
                  />
                </div>

                {/* Center visual box */}
                <div className="flex-1 h-14 bg-surface/50 rounded border border-white/10 flex items-center justify-center relative">
                  {position === "absolute" && (
                    /* Position origin grid for absolute */
                    <div className="grid grid-cols-3 gap-0.5 w-10 h-10">
                      {originPositions.map((pos) => (
                        <button
                          key={pos.id}
                          onClick={() => applyPositionOrigin(pos.id)}
                          className={`w-full h-full rounded-sm transition-colors ${
                            positionOrigin === pos.id
                              ? "bg-primary"
                              : "bg-white/10 hover:bg-white/20"
                          }`}
                          title={`Position from ${pos.id === "tl" ? "top-left" : pos.id === "tc" ? "top-center" : pos.id === "tr" ? "top-right" : pos.id === "ml" ? "middle-left" : pos.id === "mc" ? "center" : pos.id === "mr" ? "middle-right" : pos.id === "bl" ? "bottom-left" : pos.id === "bc" ? "bottom-center" : "bottom-right"}`}
                        />
                      ))}
                    </div>
                  )}
                  {position !== "absolute" && (
                    <span className="text-[9px] text-text-muted/50 uppercase tracking-wider">
                      element
                    </span>
                  )}
                </div>

                {/* Right offset */}
                <div className="w-24">
                  <PositionInput
                    label="R"
                    value={offsets.right.value}
                    unit={offsets.right.unit}
                    onValueChange={(v) => updateOffsetValue("right", v)}
                    onUnitChange={(u) => updateOffsetUnit("right", u)}
                  />
                </div>
              </div>

              {/* Bottom offset */}
              <div className="flex justify-center mt-1">
                <div className="w-24">
                  <PositionInput
                    label="B"
                    value={offsets.bottom.value}
                    unit={offsets.bottom.unit}
                    onValueChange={(v) => updateOffsetValue("bottom", v)}
                    onUnitChange={(u) => updateOffsetUnit("bottom", u)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Relative to indicator (for absolute) */}
          {position === "absolute" && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-muted">Relative to:</span>
              <div className="flex-1 h-6 bg-background/50 border border-white/8 rounded px-2 flex items-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted mr-1.5">
                  <rect x="2" y="2" width="20" height="20" rx="2" />
                </svg>
                <span className="text-[10px] text-text-muted/70 font-mono truncate">
                  nearest positioned parent
                </span>
              </div>
            </div>
          )}

          {/* Sticky warning */}
          {position === "sticky" && (
            <div className="flex items-start gap-2 bg-warning/10 border border-warning/20 rounded-md p-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warning mt-0.5 shrink-0">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="text-[10px] text-warning/80">
                Requires a scrollable container to work properly
              </span>
            </div>
          )}
        </>
      )}

      {/* Z-Index */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Z-Index
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={zIndex}
            onChange={(e) => handleZIndexChange(e.target.value)}
            placeholder="auto"
            className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
          />
          {/* Quick z-index presets */}
          <div className="flex gap-0.5">
            {["0", "10", "50", "100"].map((z) => (
              <button
                key={z}
                onClick={() => handleZIndexChange(z)}
                className={`px-2 h-7 text-[10px] rounded transition-colors ${
                  zIndex === z
                    ? "bg-primary/20 text-primary"
                    : "bg-background/50 text-text-muted hover:text-text"
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Typography types
type FontSizeUnit = "px" | "rem" | "em" | "%";
type LineHeightUnit = "px" | "rem" | "em" | "" | "normal"; // "" = unitless
type LetterSpacingUnit = "px" | "em" | "rem";
type TextAlign = "left" | "center" | "right" | "justify";
type TextDecoration = "none" | "underline" | "line-through" | "overline";
type TextTransform = "none" | "uppercase" | "lowercase" | "capitalize";

interface FontWeight {
  value: string;
  label: string;
}

const FONT_WEIGHTS: FontWeight[] = [
  { value: "100", label: "100 - Thin" },
  { value: "200", label: "200 - Extra Light" },
  { value: "300", label: "300 - Light" },
  { value: "400", label: "400 - Regular" },
  { value: "500", label: "500 - Medium" },
  { value: "600", label: "600 - Semi Bold" },
  { value: "700", label: "700 - Bold" },
  { value: "800", label: "800 - Extra Bold" },
  { value: "900", label: "900 - Black" },
];

// Default theme fonts (fallback if tokens not loaded)
const DEFAULT_THEME_FONTS = [
  "Inter",
  "Geist",
  "Geist Mono",
  "SF Pro",
  "system-ui",
  "monospace",
];

// Default font size tokens (fallback if tokens not loaded)
const DEFAULT_FONT_SIZE_TOKENS = ["10", "11", "12", "14", "16", "18", "20", "24", "28", "32", "36", "40", "48", "56", "64", "72"];

// Helper to check if a color value is a design token
function isTokenColor(value: string): boolean {
  if (!value) return true; // Empty is valid
  return value.startsWith("var(--") || value.startsWith("var(");
}

// Helper to check if a font value is valid
function isValidFontFamily(value: string, themeFonts: string[]): boolean {
  if (!value) return true;
  // Split by comma and check each font
  const fonts = value.split(",").map(f => f.trim().replace(/["']/g, ""));
  return fonts.some(font =>
    themeFonts.some(themeFont =>
      font.toLowerCase() === themeFont.toLowerCase()
    )
  );
}

// Helper to check if a font size uses a token
function isTokenFontSize(value: string, unit: string, tokenSizes: string[]): boolean {
  if (!value) return true;
  // If using var(), it's a token
  if (value.startsWith("var(")) return true;
  // Check numeric value against known tokens
  const numericValue = parseFloat(value);
  return tokenSizes.includes(String(numericValue)) || tokenSizes.includes(value);
}

// Helper to format typography CSS value with unit
function formatTypographyValue(value: string, unit: string): string {
  if (unit === "normal") return "normal";
  if (unit === "") return value; // unitless
  if (!value || value === "") return "";
  return `${value}${unit}`;
}

// Generate CSS for typography changes
function generateTypographyCss(
  fontFamily: string,
  fontWeight: string,
  fontSize: { value: string; unit: FontSizeUnit },
  lineHeight: { value: string; unit: LineHeightUnit },
  letterSpacing: { value: string; unit: LetterSpacingUnit },
  textAlign: TextAlign,
  textDecoration: TextDecoration,
  textTransform: TextTransform,
  color: string
): string {
  const lines: string[] = [];

  if (fontFamily) lines.push(`font-family: ${fontFamily};`);
  if (fontWeight) lines.push(`font-weight: ${fontWeight};`);

  const formattedSize = formatTypographyValue(fontSize.value, fontSize.unit);
  if (formattedSize) lines.push(`font-size: ${formattedSize};`);

  const formattedLineHeight = formatTypographyValue(lineHeight.value, lineHeight.unit);
  if (formattedLineHeight) lines.push(`line-height: ${formattedLineHeight};`);

  const formattedSpacing = formatTypographyValue(letterSpacing.value, letterSpacing.unit);
  if (formattedSpacing) lines.push(`letter-spacing: ${formattedSpacing};`);

  if (textAlign !== "left") lines.push(`text-align: ${textAlign};`);
  if (textDecoration !== "none") lines.push(`text-decoration: ${textDecoration};`);
  if (textTransform !== "none") lines.push(`text-transform: ${textTransform};`);
  if (color) lines.push(`color: ${color};`);

  return lines.join("\n  ");
}

interface TypographyViolation {
  property: string;
  message: string;
}

function TypographySection() {
  // App state integration (directWriteMode removed per fn-9)
  const { selectedEntry, addStyleEdit, tokens } = useAppStore();

  // Typography state
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontWeight, setFontWeight] = useState("400");
  const [fontSize, setFontSize] = useState({ value: "16", unit: "px" as FontSizeUnit });
  const [lineHeight, setLineHeight] = useState({ value: "1.5", unit: "" as LineHeightUnit });
  const [letterSpacing, setLetterSpacing] = useState({ value: "0", unit: "em" as LetterSpacingUnit });
  const [textAlign, setTextAlign] = useState<TextAlign>("left");
  const [textDecoration, setTextDecoration] = useState<TextDecoration>("none");
  const [textTransform, setTextTransform] = useState<TextTransform>("none");
  const [color, setColor] = useState("var(--text)");

  // Extract theme fonts from tokens (with fallback)
  const themeFonts = useMemo((): string[] => {
    if (!tokens?.public) {
      return DEFAULT_THEME_FONTS;
    }
    // Extract font family names from token entries (keys starting with font-family- or font-)
    const fontEntries = Object.entries(tokens.public)
      .filter(([key]) => key.startsWith("font-family-") || key.startsWith("font-"))
      .map(([key]) => {
        // Extract the font name from the key
        const name = key.replace(/^font-family-/, "").replace(/^font-/, "");
        return name.charAt(0).toUpperCase() + name.slice(1); // Capitalize
      });
    return fontEntries.length > 0 ? fontEntries : DEFAULT_THEME_FONTS;
  }, [tokens?.public]);

  // Extract font size tokens from tokens (with fallback)
  const fontSizeTokens = useMemo((): string[] => {
    if (!tokens?.public) {
      return DEFAULT_FONT_SIZE_TOKENS;
    }
    // Extract numeric values from text-* tokens
    const sizeEntries = Object.entries(tokens.public)
      .filter(([key]) => key.startsWith("text-") && !key.includes("color"))
      .map(([, value]) => {
        if (!value) return null;
        // Extract numeric value from clamp() or direct value
        const match = value.match(/(\d+(?:\.\d+)?)/);
        return match ? match[1] : null;
      })
      .filter((v): v is string => v !== null);
    return sizeEntries.length > 0 ? sizeEntries : DEFAULT_FONT_SIZE_TOKENS;
  }, [tokens?.public]);

  // Extract color tokens for suggestions (used in future token picker)
  const _colorTokens = useMemo((): string[] => {
    if (!tokens?.public) {
      return ["--text", "--text-muted", "--primary", "--secondary", "--background"];
    }
    // Extract color token names
    const colorEntries = Object.keys(tokens.public)
      .filter(key => key.includes("color") || key.startsWith("text-") || key.startsWith("background-"))
      .map(key => `--${key}`);
    return colorEntries.length > 0 ? colorEntries : ["--text", "--text-muted", "--primary", "--secondary", "--background"];
  }, [tokens?.public]);

  // Sync local state with selected element (when selection changes)
  useEffect(() => {
    if (!selectedEntry) {
      // Reset to defaults when no selection
      setFontFamily("Inter");
      setFontWeight("400");
      setFontSize({ value: "16", unit: "px" });
      setLineHeight({ value: "1.5", unit: "" });
      setLetterSpacing({ value: "0", unit: "em" });
      setTextAlign("left");
      setTextDecoration("none");
      setTextTransform("none");
      setColor("var(--text)");
      return;
    }
    // Future: Read computed styles from preview iframe when available
  }, [selectedEntry?.radflowId]);

  // Compute violations using useMemo (more efficient than useEffect + setState)
  const violations = useMemo(() => {
    const result: TypographyViolation[] = [];

    // Check font size against tokens
    if (fontSize.value && !isTokenFontSize(fontSize.value, fontSize.unit, fontSizeTokens)) {
      const suggestions = fontSizeTokens.slice(0, 3).join(", ");
      result.push({
        property: "font-size",
        message: `Font size "${fontSize.value}${fontSize.unit}" is not a design token. Try: ${suggestions}`,
      });
    }

    // Check if font family is in theme
    if (fontFamily && !isValidFontFamily(fontFamily, themeFonts)) {
      result.push({
        property: "font-family",
        message: `Font "${fontFamily}" is not in the theme`,
      });
    }

    // Check if color is a token (more complete check)
    if (color && !isTokenColor(color)) {
      result.push({
        property: "color",
        message: "Color should use a design token (var(--...))",
      });
    }

    return result;
  }, [fontSize, fontFamily, color, fontSizeTokens, themeFonts]);

  // Core style edit function (used by debounced version in direct mode)
  const applyStyleEditImmediate = useCallback((property: string, oldValue: string, newValue: string) => {
    if (!selectedEntry?.source) return;

    addStyleEdit({
      radflowId: selectedEntry.radflowId,
      componentName: selectedEntry.name,
      source: selectedEntry.source,
      property,
      oldValue,
      newValue,
    });
  }, [selectedEntry, addStyleEdit]);

  // Debounced version for direct write mode (500ms delay per spec)
  const applyStyleEditDebounced = useDebouncedCallback(applyStyleEditImmediate, 500);

  // Apply style edit to app state (clipboard mode only per fn-9)
  const applyStyleEdit = useCallback((property: string, oldValue: string, newValue: string) => {
    if (!selectedEntry?.source) return;

    // Immediate in clipboard mode
    applyStyleEditImmediate(property, oldValue, newValue);
    // Copy CSS to clipboard
    const css = generateTypographyCss(
      fontFamily, fontWeight, fontSize, lineHeight, letterSpacing,
      textAlign, textDecoration, textTransform, color
    );
    navigator.clipboard.writeText(css).catch(() => {});
  }, [selectedEntry, applyStyleEditImmediate, fontFamily, fontWeight, fontSize, lineHeight, letterSpacing, textAlign, textDecoration, textTransform, color]);

  // Handlers with style edit tracking
  const handleFontFamilyChange = useCallback((newValue: string) => {
    const oldValue = fontFamily;
    setFontFamily(newValue);
    if (oldValue !== newValue) {
      applyStyleEdit("font-family", oldValue, newValue);
    }
  }, [fontFamily, applyStyleEdit]);

  const handleFontWeightChange = useCallback((newValue: string) => {
    const oldValue = fontWeight;
    setFontWeight(newValue);
    if (oldValue !== newValue) {
      applyStyleEdit("font-weight", oldValue, newValue);
    }
  }, [fontWeight, applyStyleEdit]);

  const handleFontSizeValueChange = useCallback((value: string) => {
    const oldFormatted = formatTypographyValue(fontSize.value, fontSize.unit);
    setFontSize(prev => ({ ...prev, value }));
    const newFormatted = formatTypographyValue(value, fontSize.unit);
    if (oldFormatted !== newFormatted) {
      applyStyleEdit("font-size", oldFormatted, newFormatted);
    }
  }, [fontSize, applyStyleEdit]);

  const handleFontSizeUnitChange = useCallback((unit: FontSizeUnit) => {
    const oldFormatted = formatTypographyValue(fontSize.value, fontSize.unit);
    setFontSize(prev => ({ ...prev, unit }));
    const newFormatted = formatTypographyValue(fontSize.value, unit);
    if (oldFormatted !== newFormatted) {
      applyStyleEdit("font-size", oldFormatted, newFormatted);
    }
  }, [fontSize, applyStyleEdit]);

  const handleLineHeightValueChange = useCallback((value: string) => {
    const oldFormatted = formatTypographyValue(lineHeight.value, lineHeight.unit);
    setLineHeight(prev => ({ ...prev, value }));
    const newFormatted = formatTypographyValue(value, lineHeight.unit);
    if (oldFormatted !== newFormatted) {
      applyStyleEdit("line-height", oldFormatted, newFormatted);
    }
  }, [lineHeight, applyStyleEdit]);

  const handleLineHeightUnitChange = useCallback((unit: LineHeightUnit) => {
    const oldFormatted = formatTypographyValue(lineHeight.value, lineHeight.unit);
    setLineHeight(prev => ({ ...prev, unit }));
    const newFormatted = formatTypographyValue(lineHeight.value, unit);
    if (oldFormatted !== newFormatted) {
      applyStyleEdit("line-height", oldFormatted, newFormatted);
    }
  }, [lineHeight, applyStyleEdit]);

  const handleLetterSpacingValueChange = useCallback((value: string) => {
    const oldFormatted = formatTypographyValue(letterSpacing.value, letterSpacing.unit);
    setLetterSpacing(prev => ({ ...prev, value }));
    const newFormatted = formatTypographyValue(value, letterSpacing.unit);
    if (oldFormatted !== newFormatted) {
      applyStyleEdit("letter-spacing", oldFormatted, newFormatted);
    }
  }, [letterSpacing, applyStyleEdit]);

  const handleLetterSpacingUnitChange = useCallback((unit: LetterSpacingUnit) => {
    const oldFormatted = formatTypographyValue(letterSpacing.value, letterSpacing.unit);
    setLetterSpacing(prev => ({ ...prev, unit }));
    const newFormatted = formatTypographyValue(letterSpacing.value, unit);
    if (oldFormatted !== newFormatted) {
      applyStyleEdit("letter-spacing", oldFormatted, newFormatted);
    }
  }, [letterSpacing, applyStyleEdit]);

  const handleTextAlignChange = useCallback((newValue: TextAlign) => {
    const oldValue = textAlign;
    setTextAlign(newValue);
    if (oldValue !== newValue) {
      applyStyleEdit("text-align", oldValue, newValue);
    }
  }, [textAlign, applyStyleEdit]);

  const handleTextDecorationChange = useCallback((newValue: TextDecoration) => {
    const oldValue = textDecoration;
    setTextDecoration(newValue);
    if (oldValue !== newValue) {
      applyStyleEdit("text-decoration", oldValue, newValue);
    }
  }, [textDecoration, applyStyleEdit]);

  const handleTextTransformChange = useCallback((newValue: TextTransform) => {
    const oldValue = textTransform;
    setTextTransform(newValue);
    if (oldValue !== newValue) {
      applyStyleEdit("text-transform", oldValue, newValue);
    }
  }, [textTransform, applyStyleEdit]);

  const handleColorChange = useCallback((newValue: string) => {
    const oldValue = color;
    setColor(newValue);
    if (oldValue !== newValue) {
      applyStyleEdit("color", oldValue, newValue);
    }
  }, [color, applyStyleEdit]);

  // Text align icons
  const alignIcons: { value: TextAlign; icon: React.ReactNode }[] = [
    {
      value: "left",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="15" y2="12" />
          <line x1="3" y1="18" x2="18" y2="18" />
        </svg>
      ),
    },
    {
      value: "center",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="6" y1="12" x2="18" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      ),
    },
    {
      value: "right",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="9" y1="12" x2="21" y2="12" />
          <line x1="6" y1="18" x2="21" y2="18" />
        </svg>
      ),
    },
    {
      value: "justify",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      ),
    },
  ];

  // Text decoration icons
  const decorationOptions: { value: TextDecoration; icon: React.ReactNode; label: string }[] = [
    {
      value: "none",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
      label: "None",
    },
    {
      value: "underline",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 3v7a6 6 0 0 0 12 0V3" />
          <line x1="4" y1="21" x2="20" y2="21" />
        </svg>
      ),
      label: "Underline",
    },
    {
      value: "line-through",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 7a5.998 5.998 0 0 0-6-5H7v10" />
          <path d="M3 12h18" />
          <path d="M7 17v2a3 3 0 0 0 6 0v-2" />
        </svg>
      ),
      label: "Strikethrough",
    },
    {
      value: "overline",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="3" x2="20" y2="3" />
          <path d="M6 21v-7a6 6 0 0 1 12 0v7" />
        </svg>
      ),
      label: "Overline",
    },
  ];

  // Text transform icons
  const transformOptions: { value: TextTransform; label: string }[] = [
    { value: "none", label: "Aa" },
    { value: "uppercase", label: "AA" },
    { value: "lowercase", label: "aa" },
    { value: "capitalize", label: "Aa" },
  ];

  return (
    <div className="space-y-3">
      {/* Font Family */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Font
        </label>
        <select
          value={fontFamily}
          onChange={(e) => handleFontFamilyChange(e.target.value)}
          className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
        >
          <optgroup label="Theme Fonts">
            {themeFonts.map((font) => (
              <option key={font} value={font}>{font}</option>
            ))}
          </optgroup>
          <optgroup label="System">
            <option value="Arial, sans-serif">Arial</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="Times New Roman, serif">Times New Roman</option>
            <option value="Courier New, monospace">Courier New</option>
            <option value="Verdana, sans-serif">Verdana</option>
          </optgroup>
        </select>
      </div>

      {/* Font Weight */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Weight
        </label>
        <select
          value={fontWeight}
          onChange={(e) => handleFontWeightChange(e.target.value)}
          className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
        >
          {FONT_WEIGHTS.map((weight) => (
            <option key={weight.value} value={weight.value}>{weight.label}</option>
          ))}
        </select>
      </div>

      {/* Size and Line Height Row */}
      <div className="grid grid-cols-2 gap-2">
        {/* Font Size */}
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">
            Size
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              value={fontSize.value}
              onChange={(e) => handleFontSizeValueChange(e.target.value)}
              className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono min-w-0"
              placeholder="16"
            />
            <select
              value={fontSize.unit}
              onChange={(e) => handleFontSizeUnitChange(e.target.value as FontSizeUnit)}
              className="h-7 bg-background/50 border border-white/8 rounded-md px-1 text-[10px] text-text-muted w-12"
            >
              <option value="px">PX</option>
              <option value="rem">REM</option>
              <option value="em">EM</option>
              <option value="%">%</option>
            </select>
          </div>
        </div>

        {/* Line Height */}
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">
            Height
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              value={lineHeight.value}
              onChange={(e) => handleLineHeightValueChange(e.target.value)}
              className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono min-w-0"
              placeholder="1.5"
            />
            <select
              value={lineHeight.unit}
              onChange={(e) => handleLineHeightUnitChange(e.target.value as LineHeightUnit)}
              className="h-7 bg-background/50 border border-white/8 rounded-md px-1 text-[10px] text-text-muted w-12"
            >
              <option value="">—</option>
              <option value="px">PX</option>
              <option value="rem">REM</option>
              <option value="em">EM</option>
              <option value="normal">AUTO</option>
            </select>
          </div>
        </div>
      </div>

      {/* Letter Spacing */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">
          Spacing
        </label>
        <div className="flex gap-1">
          <input
            type="text"
            value={letterSpacing.value}
            onChange={(e) => handleLetterSpacingValueChange(e.target.value)}
            className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
            placeholder="0"
          />
          <select
            value={letterSpacing.unit}
            onChange={(e) => handleLetterSpacingUnitChange(e.target.value as LetterSpacingUnit)}
            className="h-7 bg-background/50 border border-white/8 rounded-md px-1 text-[10px] text-text-muted w-12"
          >
            <option value="em">EM</option>
            <option value="px">PX</option>
            <option value="rem">REM</option>
          </select>
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Color
        </label>
        <div className="flex gap-2">
          <div
            className="w-8 h-7 rounded-md border border-white/10 cursor-pointer shrink-0"
            style={{ backgroundColor: color.startsWith("var") ? "var(--text)" : color }}
          />
          <input
            type="text"
            value={color}
            onChange={(e) => handleColorChange(e.target.value)}
            className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
            placeholder="var(--text)"
          />
        </div>
      </div>

      {/* Text Align */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Align
        </label>
        <div className="flex gap-1">
          {alignIcons.map((item) => (
            <button
              key={item.value}
              onClick={() => handleTextAlignChange(item.value)}
              className={`flex-1 py-1.5 flex items-center justify-center rounded-md transition-colors ${
                textAlign === item.value
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-background/50 text-text-muted hover:text-text border border-transparent"
              }`}
              title={item.value.charAt(0).toUpperCase() + item.value.slice(1)}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Text Decoration */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Decoration
        </label>
        <div className="flex gap-1">
          {decorationOptions.map((item) => (
            <button
              key={item.value}
              onClick={() => handleTextDecorationChange(item.value)}
              className={`flex-1 py-1.5 flex items-center justify-center rounded-md transition-colors ${
                textDecoration === item.value
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-background/50 text-text-muted hover:text-text border border-transparent"
              }`}
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Text Transform */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Case
        </label>
        <div className="flex gap-1">
          {transformOptions.map((item, index) => (
            <button
              key={item.value}
              onClick={() => handleTextTransformChange(item.value)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                textTransform === item.value
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-background/50 text-text-muted hover:text-text border border-transparent"
              }`}
              title={item.value === "none" ? "None" : item.value.charAt(0).toUpperCase() + item.value.slice(1)}
            >
              {index === 0 ? "—" : item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Violation Warnings */}
      {violations.length > 0 && (
        <div className="space-y-1.5">
          {violations.map((violation, index) => (
            <div
              key={index}
              className="flex items-start gap-2 bg-warning/10 border border-warning/20 rounded-md p-2"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-warning mt-0.5 shrink-0"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="text-[10px] text-warning/80">{violation.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ColorsSection() {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-text-muted block mb-1">Background</label>
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-md bg-primary border border-white/10 cursor-pointer" />
          <input
            type="text"
            defaultValue="var(--primary)"
            className="flex-1 h-8 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-1">Text Color</label>
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-md bg-text border border-white/10 cursor-pointer" />
          <input
            type="text"
            defaultValue="var(--text)"
            className="flex-1 h-8 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Borders Section Types
// ============================================================================

type BorderStyle = "none" | "solid" | "dashed" | "dotted" | "double";
type BorderRadiusUnit = "px" | "rem" | "%";

interface BorderWidthValues {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

interface BorderRadiusValues {
  topLeft: string;
  topRight: string;
  bottomRight: string;
  bottomLeft: string;
}

// ============================================================================
// Borders Section Component
// ============================================================================

function BordersSection() {
  // App state integration
  const { selectedEntry, editorMode, addStyleEdit } = useAppStore();

  // Border state
  const [borderStyle, setBorderStyle] = useState<BorderStyle>("solid");
  const [borderColor, setBorderColor] = useState<ColorValue>({
    mode: "token",
    tokenName: "--border",
    hex: "#333333",
    alpha: 100,
  });

  // Border width state
  const [widthLinked, setWidthLinked] = useState(true);
  const [borderWidth, setBorderWidth] = useState<BorderWidthValues>({
    top: "1",
    right: "1",
    bottom: "1",
    left: "1",
  });

  // Border radius state
  const [radiusLinked, setRadiusLinked] = useState(true);
  const [borderRadius, setBorderRadius] = useState<BorderRadiusValues>({
    topLeft: "4",
    topRight: "4",
    bottomRight: "4",
    bottomLeft: "4",
  });
  const [radiusUnit, setRadiusUnit] = useState<BorderRadiusUnit>("px");

  // Sync local state with selected element (when selection changes)
  useEffect(() => {
    if (!selectedEntry) {
      // Reset to defaults when no selection
      setBorderStyle("solid");
      setBorderColor({
        mode: "token" as const,
        tokenName: "--border",
        hex: "#333333",
        alpha: 100,
      });
      setWidthLinked(true);
      setBorderWidth({ top: "1", right: "1", bottom: "1", left: "1" });
      setRadiusLinked(true);
      setBorderRadius({ topLeft: "4", topRight: "4", bottomRight: "4", bottomLeft: "4" });
      setRadiusUnit("px");
      return;
    }
    // Future: Read computed styles from preview iframe when available
  }, [selectedEntry?.radflowId]);

  // Core style edit function
  const applyStyleEditImmediate = useCallback((property: string, oldValue: string, newValue: string) => {
    if (!selectedEntry?.source) return;
    addStyleEdit({
      radflowId: selectedEntry.radflowId,
      componentName: selectedEntry.name,
      source: selectedEntry.source,
      property,
      oldValue,
      newValue,
    });
  }, [selectedEntry, addStyleEdit]);

  // Debounced version for direct write mode (500ms delay per spec)
  const applyStyleEditDebounced = useDebouncedCallback(applyStyleEditImmediate, 500);

  // Apply style edit (debounced in direct mode, immediate in clipboard mode)
  // Note: "clipboard" mode = immediate, all other modes = debounced (direct write)
  // Captures editorMode at call time to avoid race conditions during debounce delay
  const applyStyleEdit = useCallback((property: string, oldValue: string, newValue: string) => {
    if (!selectedEntry?.source) return;
    const currentMode = editorMode; // Capture mode at call time
    if (currentMode !== "clipboard") {
      applyStyleEditDebounced(property, oldValue, newValue);
    } else {
      applyStyleEditImmediate(property, oldValue, newValue);
    }
  }, [selectedEntry, editorMode, applyStyleEditDebounced, applyStyleEditImmediate]);

  // Handler: Border style change
  const handleStyleChange = useCallback((newStyle: BorderStyle) => {
    const oldValue = borderStyle;
    setBorderStyle(newStyle);
    if (oldValue !== newStyle) {
      applyStyleEdit("border-style", oldValue, newStyle);
    }
  }, [borderStyle, applyStyleEdit]);

  // Handler: Border color change
  const handleColorChange = useCallback((newColor: ColorValue) => {
    const oldValue = borderColor.mode === "token" ? `var(${borderColor.tokenName})` : borderColor.hex;
    setBorderColor(newColor);
    const newValue = newColor.mode === "token" ? `var(${newColor.tokenName})` : newColor.hex;
    if (oldValue !== newValue) {
      applyStyleEdit("border-color", oldValue, newValue);
    }
  }, [borderColor, applyStyleEdit]);

  // Handler: Border width change (uniform or per-side)
  // Validates numeric input - allows empty string for clearing, rejects invalid values
  const handleWidthChange = useCallback((side: keyof BorderWidthValues, value: string) => {
    // Allow empty string for clearing, otherwise validate numeric
    if (value !== "") {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) return;
    }

    const oldWidths = { ...borderWidth };
    if (widthLinked) {
      // Update all sides uniformly
      const newWidths = { top: value, right: value, bottom: value, left: value };
      setBorderWidth(newWidths);
      const oldValue = `${oldWidths.top}px`;
      const newValue = `${value}px`;
      if (oldValue !== newValue) {
        applyStyleEdit("border-width", oldValue, newValue);
      }
    } else {
      // Update single side
      const newWidths = { ...borderWidth, [side]: value };
      setBorderWidth(newWidths);
      const oldValue = `${oldWidths[side]}px`;
      const newValue = `${value}px`;
      if (oldValue !== newValue) {
        applyStyleEdit(`border-${side}-width`, oldValue, newValue);
      }
    }
  }, [borderWidth, widthLinked, applyStyleEdit]);

  // Handler: Border radius change (uniform or per-corner)
  // Validates numeric input - allows empty string for clearing, rejects invalid values
  const handleRadiusChange = useCallback((corner: keyof BorderRadiusValues, value: string) => {
    // Allow empty string for clearing, otherwise validate numeric
    if (value !== "") {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) return;
    }

    const oldRadius = { ...borderRadius };
    if (radiusLinked) {
      // Update all corners uniformly
      const newRadius = { topLeft: value, topRight: value, bottomRight: value, bottomLeft: value };
      setBorderRadius(newRadius);
      const oldValue = `${oldRadius.topLeft}${radiusUnit}`;
      const newValue = `${value}${radiusUnit}`;
      if (oldValue !== newValue) {
        applyStyleEdit("border-radius", oldValue, newValue);
      }
    } else {
      // Update single corner
      const newRadius = { ...borderRadius, [corner]: value };
      setBorderRadius(newRadius);
      const cornerMap: Record<keyof BorderRadiusValues, string> = {
        topLeft: "border-top-left-radius",
        topRight: "border-top-right-radius",
        bottomRight: "border-bottom-right-radius",
        bottomLeft: "border-bottom-left-radius",
      };
      const oldValue = `${oldRadius[corner]}${radiusUnit}`;
      const newValue = `${value}${radiusUnit}`;
      if (oldValue !== newValue) {
        applyStyleEdit(cornerMap[corner], oldValue, newValue);
      }
    }
  }, [borderRadius, radiusLinked, radiusUnit, applyStyleEdit]);

  // Handler: Radius unit change
  const handleRadiusUnitChange = useCallback((unit: BorderRadiusUnit) => {
    const oldValue = `${borderRadius.topLeft}${radiusUnit}`;
    setRadiusUnit(unit);
    const newValue = `${borderRadius.topLeft}${unit}`;
    if (oldValue !== newValue && radiusLinked) {
      applyStyleEdit("border-radius", oldValue, newValue);
    }
  }, [borderRadius, radiusUnit, radiusLinked, applyStyleEdit]);

  // Toggle width linked mode
  const toggleWidthLinked = useCallback(() => {
    if (!widthLinked) {
      // When linking, sync all to top value
      const uniformValue = borderWidth.top;
      setBorderWidth({
        top: uniformValue,
        right: uniformValue,
        bottom: uniformValue,
        left: uniformValue,
      });
    }
    setWidthLinked(!widthLinked);
  }, [widthLinked, borderWidth.top]);

  // Toggle radius linked mode
  const toggleRadiusLinked = useCallback(() => {
    if (!radiusLinked) {
      // When linking, sync all to topLeft value
      const uniformValue = borderRadius.topLeft;
      setBorderRadius({
        topLeft: uniformValue,
        topRight: uniformValue,
        bottomRight: uniformValue,
        bottomLeft: uniformValue,
      });
    }
    setRadiusLinked(!radiusLinked);
  }, [radiusLinked, borderRadius.topLeft]);

  // Border style options with icons
  const styleOptions: { value: BorderStyle; icon: React.ReactNode; label: string }[] = [
    {
      value: "none",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="4" x2="20" y2="20" />
          <line x1="20" y1="4" x2="4" y2="20" />
        </svg>
      ),
      label: "None",
    },
    {
      value: "solid",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
      ),
      label: "Solid",
    },
    {
      value: "dashed",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2">
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
      ),
      label: "Dashed",
    },
    {
      value: "dotted",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="1 3" strokeLinecap="round">
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
      ),
      label: "Dotted",
    },
    {
      value: "double",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="2" y1="10" x2="22" y2="10" />
          <line x1="2" y1="14" x2="22" y2="14" />
        </svg>
      ),
      label: "Double",
    },
  ];

  // Link icon SVG
  const LinkIcon = ({ linked }: { linked: boolean }) => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={linked ? "text-primary" : "text-text-muted"}
    >
      {linked ? (
        <>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </>
      ) : (
        <>
          <path d="M18.84 12.25l1.7-1.7a5 5 0 0 0-7.08-7.08l-1.7 1.7" />
          <path d="M5.16 11.75l-1.7 1.7a5 5 0 0 0 7.08 7.08l1.7-1.7" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </>
      )}
    </svg>
  );

  return (
    <div className="space-y-4">
      {/* Border Style */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Style
        </label>
        <div className="flex gap-1">
          {styleOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStyleChange(option.value)}
              className={`flex-1 py-1.5 flex items-center justify-center rounded-md transition-colors ${
                borderStyle === option.value
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-background/50 text-text-muted hover:text-text border border-transparent"
              }`}
              title={option.label}
            >
              {option.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Border Color */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Color
        </label>
        <ColorPicker
          value={borderColor}
          onChange={handleColorChange}
          showAlpha={true}
          cssProperty="border-color"
        />
      </div>

      {/* Border Width Section */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] text-text-muted uppercase tracking-wider">
            Width
          </label>
          <button
            onClick={toggleWidthLinked}
            className={`p-1 rounded hover:bg-white/5 transition-colors ${
              widthLinked ? "text-primary" : "text-text-muted"
            }`}
            title={widthLinked ? "Unlink sides" : "Link all sides"}
          >
            <LinkIcon linked={widthLinked} />
          </button>
        </div>

        {widthLinked ? (
          // Uniform width input
          <div className="flex gap-1">
            <input
              type="text"
              value={borderWidth.top}
              onChange={(e) => handleWidthChange("top", e.target.value)}
              className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
              placeholder="1"
            />
            <span className="h-7 flex items-center px-2 text-[10px] text-text-muted bg-background/30 rounded-md">
              PX
            </span>
          </div>
        ) : (
          // Per-side width inputs with visual layout
          <div className="relative w-full aspect-[4/3] max-w-[160px] mx-auto">
            {/* Visual box representation */}
            <div className="absolute inset-4 border border-dashed border-white/20 rounded" />

            {/* Top input */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14">
              <input
                type="text"
                value={borderWidth.top}
                onChange={(e) => handleWidthChange("top", e.target.value)}
                className="w-full h-6 bg-background/50 border border-white/8 rounded text-center text-[10px] text-text font-mono"
                placeholder="0"
              />
            </div>

            {/* Right input */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-14">
              <input
                type="text"
                value={borderWidth.right}
                onChange={(e) => handleWidthChange("right", e.target.value)}
                className="w-full h-6 bg-background/50 border border-white/8 rounded text-center text-[10px] text-text font-mono"
                placeholder="0"
              />
            </div>

            {/* Bottom input */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14">
              <input
                type="text"
                value={borderWidth.bottom}
                onChange={(e) => handleWidthChange("bottom", e.target.value)}
                className="w-full h-6 bg-background/50 border border-white/8 rounded text-center text-[10px] text-text font-mono"
                placeholder="0"
              />
            </div>

            {/* Left input */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-14">
              <input
                type="text"
                value={borderWidth.left}
                onChange={(e) => handleWidthChange("left", e.target.value)}
                className="w-full h-6 bg-background/50 border border-white/8 rounded text-center text-[10px] text-text font-mono"
                placeholder="0"
              />
            </div>
          </div>
        )}
      </div>

      {/* Border Radius Section */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] text-text-muted uppercase tracking-wider">
            Radius
          </label>
          <button
            onClick={toggleRadiusLinked}
            className={`p-1 rounded hover:bg-white/5 transition-colors ${
              radiusLinked ? "text-primary" : "text-text-muted"
            }`}
            title={radiusLinked ? "Unlink corners" : "Link all corners"}
          >
            <LinkIcon linked={radiusLinked} />
          </button>
        </div>

        {radiusLinked ? (
          // Uniform radius input with slider
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={parseFloat(borderRadius.topLeft) || 0}
                onChange={(e) => handleRadiusChange("topLeft", e.target.value)}
                className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer bg-white/10"
              />
              <div className="flex gap-1">
                <input
                  type="text"
                  value={borderRadius.topLeft}
                  onChange={(e) => handleRadiusChange("topLeft", e.target.value)}
                  className="w-12 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono text-center"
                  placeholder="0"
                />
                <select
                  value={radiusUnit}
                  onChange={(e) => handleRadiusUnitChange(e.target.value as BorderRadiusUnit)}
                  className="h-7 bg-background/50 border border-white/8 rounded-md px-1 text-[10px] text-text-muted w-12"
                >
                  <option value="px">PX</option>
                  <option value="rem">REM</option>
                  <option value="%">%</option>
                </select>
              </div>
            </div>

            {/* Visual preview of radius */}
            <div className="flex justify-center">
              <div
                className="w-16 h-12 border-2 border-text-muted/50 bg-white/5"
                style={{
                  borderRadius: `${borderRadius.topLeft}${radiusUnit}`,
                }}
              />
            </div>
          </div>
        ) : (
          // Per-corner radius inputs with visual preview
          <div className="space-y-2">
            <div className="relative w-full aspect-[4/3] max-w-[160px] mx-auto">
              {/* Visual preview rectangle with actual radius */}
              <div
                className="absolute inset-6 border-2 border-text-muted/50 bg-white/5"
                style={{
                  borderTopLeftRadius: `${borderRadius.topLeft}${radiusUnit}`,
                  borderTopRightRadius: `${borderRadius.topRight}${radiusUnit}`,
                  borderBottomRightRadius: `${borderRadius.bottomRight}${radiusUnit}`,
                  borderBottomLeftRadius: `${borderRadius.bottomLeft}${radiusUnit}`,
                }}
              />

              {/* Top-left corner input */}
              <div className="absolute top-0 left-0 w-12">
                <input
                  type="text"
                  value={borderRadius.topLeft}
                  onChange={(e) => handleRadiusChange("topLeft", e.target.value)}
                  className="w-full h-6 bg-background/50 border border-white/8 rounded text-center text-[10px] text-text font-mono"
                  placeholder="0"
                />
              </div>

              {/* Top-right corner input */}
              <div className="absolute top-0 right-0 w-12">
                <input
                  type="text"
                  value={borderRadius.topRight}
                  onChange={(e) => handleRadiusChange("topRight", e.target.value)}
                  className="w-full h-6 bg-background/50 border border-white/8 rounded text-center text-[10px] text-text font-mono"
                  placeholder="0"
                />
              </div>

              {/* Bottom-right corner input */}
              <div className="absolute bottom-0 right-0 w-12">
                <input
                  type="text"
                  value={borderRadius.bottomRight}
                  onChange={(e) => handleRadiusChange("bottomRight", e.target.value)}
                  className="w-full h-6 bg-background/50 border border-white/8 rounded text-center text-[10px] text-text font-mono"
                  placeholder="0"
                />
              </div>

              {/* Bottom-left corner input */}
              <div className="absolute bottom-0 left-0 w-12">
                <input
                  type="text"
                  value={borderRadius.bottomLeft}
                  onChange={(e) => handleRadiusChange("bottomLeft", e.target.value)}
                  className="w-full h-6 bg-background/50 border border-white/8 rounded text-center text-[10px] text-text font-mono"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Unit selector for unlinked mode */}
            <div className="flex justify-center">
              <select
                value={radiusUnit}
                onChange={(e) => handleRadiusUnitChange(e.target.value as BorderRadiusUnit)}
                className="h-7 bg-background/50 border border-white/8 rounded-md px-2 text-[10px] text-text-muted"
              >
                <option value="px">PX</option>
                <option value="rem">REM</option>
                <option value="%">%</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EffectsSection() {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-text-muted block mb-1">Box Shadow</label>
        <input
          type="text"
          defaultValue="0 2px 8px rgba(0,0,0,0.25)"
          className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
        />
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-1">Backdrop Blur</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="40"
            defaultValue="0"
            className="flex-1"
          />
          <input
            type="text"
            defaultValue="0px"
            className="w-16 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-1">Opacity</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="100"
            className="flex-1"
          />
          <input
            type="text"
            defaultValue="100%"
            className="w-16 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
      </div>
    </div>
  );
}

export default RightPanel;
