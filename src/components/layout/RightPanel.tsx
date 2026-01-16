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

function SpacingSection() {
  return (
    <div className="space-y-3">
      {/* Chrome DevTools style box model */}
      <div className="relative bg-background/50 rounded-md p-4">
        {/* Margin (outer) */}
        <div className="border border-dashed border-orange-500/50 p-3 rounded-md">
          <div className="absolute top-1 left-2 text-xs text-orange-500/70">margin</div>
          <div className="flex justify-center text-xs text-text-muted mb-1">8</div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">8</span>
            {/* Padding (inner) */}
            <div className="border border-dashed border-green-500/50 p-3 rounded-md flex-1 mx-2">
              <div className="absolute left-8 text-xs text-green-500/70">padding</div>
              <div className="flex justify-center text-xs text-text-muted mb-1">16</div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">16</span>
                {/* Content */}
                <div className="bg-primary/20 rounded-sm px-4 py-2 text-xs text-text">
                  content
                </div>
                <span className="text-xs text-text-muted">16</span>
              </div>
              <div className="flex justify-center text-xs text-text-muted mt-1">16</div>
            </div>
            <span className="text-xs text-text-muted">8</span>
          </div>
          <div className="flex justify-center text-xs text-text-muted mt-1">8</div>
        </div>
      </div>
    </div>
  );
}

function SizeSection() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-text-muted block mb-1">Width</label>
          <input
            type="text"
            defaultValue="auto"
            className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Height</label>
          <input
            type="text"
            defaultValue="auto"
            className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-text-muted block mb-1">Min W</label>
          <input
            type="text"
            defaultValue="0"
            className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Max W</label>
          <input
            type="text"
            defaultValue="none"
            className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
      </div>
    </div>
  );
}

function PositionSection() {
  const [position, setPosition] = useState<"static" | "relative" | "absolute" | "fixed" | "sticky">("relative");

  return (
    <div className="space-y-3">
      <div className="flex gap-1 bg-background/50 rounded-md p-0.5 flex-wrap">
        {(["static", "relative", "absolute", "fixed", "sticky"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPosition(p)}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              position === p
                ? "bg-surface text-text"
                : "text-text-muted hover:text-text"
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>
      {position !== "static" && (
        <div className="grid grid-cols-2 gap-2">
          {["Top", "Right", "Bottom", "Left"].map((dir) => (
            <div key={dir}>
              <label className="text-xs text-text-muted block mb-1">{dir}</label>
              <input
                type="text"
                defaultValue="auto"
                className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
              />
            </div>
          ))}
        </div>
      )}
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
