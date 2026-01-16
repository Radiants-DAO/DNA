import { useState, useRef, useEffect, useCallback } from "react";

/**
 * RightPanel - Designer panel with CSS property sections
 *
 * Features:
 * - Collapsible sections with smooth transitions
 * - Icon rail when collapsed (scroll-to-section on click)
 * - Context-aware sections (non-applicable collapsed by default)
 * - State selector for hover/focus/active states
 * - Mode toggle (Clipboard/Direct-Edit)
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

type EditMode = "clipboard" | "direct";

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

export function RightPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedState, setSelectedState] = useState<string>("default");
  const [editMode, setEditMode] = useState<EditMode>("clipboard");

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
        {/* Mode toggle at top */}
        <button
          onClick={() => setEditMode(editMode === "clipboard" ? "direct" : "clipboard")}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-white/5 mb-2"
          title={editMode === "clipboard" ? "Clipboard Mode" : "Direct Edit Mode"}
        >
          {editMode === "clipboard" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="8" y="2" width="8" height="4" rx="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          )}
        </button>

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
    <div className="w-80 bg-surface/50 border-l border-white/5 flex flex-col">
      {/* Header */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-white/5 shrink-0">
        <span className="text-xs font-medium text-text uppercase tracking-wider">
          Designer
        </span>
        <div className="flex items-center gap-1">
          {/* Mode toggle */}
          <div className="flex bg-background/50 rounded-md p-0.5">
            <button
              onClick={() => setEditMode("clipboard")}
              className={`px-2 py-1 text-[10px] rounded transition-colors flex items-center gap-1 ${
                editMode === "clipboard"
                  ? "bg-surface text-text"
                  : "text-text-muted hover:text-text"
              }`}
              title="Clipboard Mode - Copy CSS to clipboard"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="8" y="2" width="8" height="4" rx="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              </svg>
              Copy
            </button>
            <button
              onClick={() => setEditMode("direct")}
              className={`px-2 py-1 text-[10px] rounded transition-colors flex items-center gap-1 ${
                editMode === "direct"
                  ? "bg-surface text-text"
                  : "text-text-muted hover:text-text"
              }`}
              title="Direct Edit Mode - Write changes to files"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
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

      {/* CSS Output / Mode Footer */}
      <div className="border-t border-white/5 p-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">
            {editMode === "clipboard" ? "CSS Output" : "Pending Changes"}
          </span>
          {editMode === "direct" && (
            <span className="text-[10px] text-success/70">Auto-save: 500ms</span>
          )}
        </div>
        <div className="bg-background/50 rounded-md p-2 font-mono text-[11px] text-text-muted max-h-20 overflow-auto">
          <pre className="whitespace-pre-wrap">{`.button {
  display: flex;
  padding: 8px 16px;
  background: var(--primary);
}`}</pre>
        </div>
        {editMode === "clipboard" ? (
          <button className="mt-2 w-full py-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-xs rounded-md transition-colors flex items-center justify-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="8" y="2" width="8" height="4" rx="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            </svg>
            Copy to Clipboard
          </button>
        ) : (
          <div className="mt-2 flex gap-2">
            <button className="flex-1 py-1.5 bg-success/20 hover:bg-success/30 text-success text-xs rounded-md transition-colors">
              Save Now
            </button>
            <button className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-text-muted text-xs rounded-md transition-colors">
              Discard
            </button>
          </div>
        )}
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

function PositionSection() {
  const [position, setPosition] = useState<PositionType>("static");
  const [offsets, setOffsets] = useState<OffsetValues>({
    top: { value: "", unit: "auto" },
    right: { value: "", unit: "auto" },
    bottom: { value: "", unit: "auto" },
    left: { value: "", unit: "auto" },
  });
  const [zIndex, setZIndex] = useState<string>("auto");
  const [positionOrigin, setPositionOrigin] = useState<PositionOrigin>("tl");

  // Update offset value
  const updateOffsetValue = (side: keyof OffsetValues, value: string) => {
    setOffsets((prev) => ({
      ...prev,
      [side]: { ...prev[side], value },
    }));
  };

  // Update offset unit
  const updateOffsetUnit = (side: keyof OffsetValues, unit: PositionUnit) => {
    setOffsets((prev) => ({
      ...prev,
      [side]: { ...prev[side], unit, value: unit === "auto" ? "" : prev[side].value },
    }));
  };

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
              onClick={() => setPosition(p)}
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
                          onClick={() => setPositionOrigin(pos.id)}
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
            onChange={(e) => setZIndex(e.target.value)}
            placeholder="auto"
            className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
          />
          {/* Quick z-index presets */}
          <div className="flex gap-0.5">
            {["0", "10", "50", "100"].map((z) => (
              <button
                key={z}
                onClick={() => setZIndex(z)}
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

function TypographySection() {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-text-muted block mb-1">Font Family</label>
        <input
          type="text"
          defaultValue="Inter, sans-serif"
          className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-text-muted block mb-1">Size</label>
          <input
            type="text"
            defaultValue="14px"
            className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Weight</label>
          <input
            type="text"
            defaultValue="500"
            className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-text-muted block mb-1">Line Height</label>
          <input
            type="text"
            defaultValue="1.5"
            className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Letter Spacing</label>
          <input
            type="text"
            defaultValue="0"
            className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
      </div>
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

function BordersSection() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-text-muted block mb-1">Width</label>
          <input
            type="text"
            defaultValue="1px"
            className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Style</label>
          <select className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text">
            <option>solid</option>
            <option>dashed</option>
            <option>dotted</option>
            <option>none</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-1">Color</label>
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-md bg-white/10 border border-white/10 cursor-pointer" />
          <input
            type="text"
            defaultValue="rgba(255,255,255,0.1)"
            className="flex-1 h-8 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-1">Radius</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="24"
            defaultValue="8"
            className="flex-1"
          />
          <input
            type="text"
            defaultValue="8px"
            className="w-16 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
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
