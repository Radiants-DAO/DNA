/**
 * RightPanel - Designer panel with CSS property sections
 *
 * Refactored to use modular section components from sections/ directory.
 * Orchestration-only: < 500 lines as per fn-2-gnc.5 spec.
 *
 * Features:
 * - Collapsible sections with smooth transitions
 * - Icon rail when collapsed (scroll-to-section on click)
 * - Context-aware sections (FlexChild only when parent is flex, etc.)
 * - State selector for hover/focus/active states
 * - Clipboard mode indicator
 * - CSS output preview
 * - Breadcrumb navigation for selected element
 *
 * Sections (16 total):
 * - Always visible: Layout, Space, Size, Position, Typography, Backgrounds, Borders,
 *   Outline, BoxShadows, Filter, BackdropFilter, Transitions, Transforms, Advanced
 * - Context-aware: FlexChild (parent is flex), GridChild (parent is grid)
 */

import { useState, useRef, useCallback, useMemo } from "react";
import {
  LEGACY_SECTION_CONFIGS,
  SECTION_COMPONENTS,
  getVisibleSections,
  type SectionId,
  type SectionContext,
} from "../designer/sections";

// =============================================================================
// Types
// =============================================================================

/**
 * Legacy section type for backward compatibility
 * Uses the original 8-section layout
 */
type LegacySectionId = "layout" | "spacing" | "size" | "position" | "typography" | "backgrounds" | "borders" | "effects";

interface CollapsibleSectionProps {
  id: SectionId;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onRef?: (el: HTMLDivElement | null) => void;
}

interface RightPanelProps {
  /** Total width of the panel. Passed from EditorLayout. */
  width?: number;
  /** Use the new 16-section layout (default: false for backward compat) */
  useNewLayout?: boolean;
}

// =============================================================================
// CollapsibleSection Component
// =============================================================================

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

// =============================================================================
// Section Icons
// =============================================================================

const SECTION_ICONS: Record<SectionId, React.ReactNode> = {
  layout: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
    </svg>
  ),
  flexChild: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="8" width="6" height="8" rx="1" />
      <rect x="11" y="6" width="4" height="12" rx="1" />
      <rect x="17" y="9" width="4" height="6" rx="1" />
    </svg>
  ),
  gridChild: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  spacing: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </svg>
  ),
  size: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 3H3v18" />
      <path d="M21 3v18" />
    </svg>
  ),
  position: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  typography: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  ),
  backgrounds: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  borders: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  outline: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  boxShadows: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M7 21h14a2 2 0 002-2V7" opacity="0.5" />
    </svg>
  ),
  filter: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  backdropFilter: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="12" cy="12" r="4" strokeDasharray="2 2" />
    </svg>
  ),
  transitions: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  ),
  transforms: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v3" />
      <path d="M18.5 5.5l-2.1 2.1" />
      <path d="M21 12h-3" />
      <path d="M18.5 18.5l-2.1-2.1" />
      <path d="M12 21v-3" />
      <path d="M5.5 18.5l2.1-2.1" />
      <path d="M3 12h3" />
      <path d="M5.5 5.5l2.1 2.1" />
    </svg>
  ),
  advanced: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  effects: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
};

// =============================================================================
// RightPanel Component
// =============================================================================

export function RightPanel({ width = 320, useNewLayout = false }: RightPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedState, setSelectedState] = useState<string>("default");

  // Context for section visibility (would come from selection in real implementation)
  const sectionContext: SectionContext = useMemo(() => ({
    parentDisplay: undefined, // Will be populated from selected element's parent
    display: undefined,
    isListItem: false,
    tagName: undefined,
  }), []);

  // Get visible sections based on context and layout mode
  const sections = useMemo(() => {
    if (useNewLayout) {
      return getVisibleSections(sectionContext);
    }
    // Use legacy 8-section layout
    return LEGACY_SECTION_CONFIGS;
  }, [useNewLayout, sectionContext]);

  // Track open state for each section
  const [openSections, setOpenSections] = useState<Set<SectionId>>(() =>
    new Set(sections.filter((s) => s.defaultOpen).map((s) => s.id))
  );

  // Refs for scrolling to sections
  const sectionRefs = useRef<Partial<Record<SectionId, HTMLDivElement | null>>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Toggle a section open/closed
  const toggleSection = useCallback((section: SectionId) => {
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
  const scrollToSection = useCallback((section: SectionId) => {
    setIsCollapsed(false);
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.add(section);
      return next;
    });
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
    setOpenSections(new Set(sections.map((s) => s.id)));
  }, [sections]);

  // Collapse all sections
  const collapseAllSections = useCallback(() => {
    setOpenSections(new Set());
  }, []);

  // Collapsed rail view
  if (isCollapsed) {
    return (
      <div className="w-14 bg-surface border-l border-white/5 flex flex-col items-center py-3 gap-1">
        {/* Clipboard mode indicator */}
        <div className="w-10 h-10 flex items-center justify-center rounded-lg text-text-muted mb-2" title="Clipboard Mode">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="8" y="2" width="8" height="4" rx="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          </svg>
        </div>
        <div className="w-8 border-t border-white/10 mb-2" />

        {/* Section icons */}
        {sections.map((section) => (
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
            {SECTION_ICONS[section.id]}
          </button>
        ))}

        <div className="flex-1" />

        {/* Expand button */}
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

  // Expanded panel view
  return (
    <div className="bg-surface/50 border-l border-white/5 flex flex-col" style={{ width }} data-devflow-id="right-panel">
      {/* Header */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-white/5 shrink-0">
        <span className="text-xs font-medium text-text uppercase tracking-wider">Designer</span>
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

      {/* Breadcrumb & State Selector */}
      <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="text-xs text-text-muted font-mono truncate flex-1">
          <span className="hover:text-primary cursor-pointer transition-colors">div</span>
          <span className="mx-1 text-text-muted/50">{">"}</span>
          <span className="hover:text-primary cursor-pointer transition-colors">section</span>
          <span className="mx-1 text-text-muted/50">{">"}</span>
          <span className="text-text">button</span>
        </div>
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
        {sections.map((section) => {
          const SectionComponent = SECTION_COMPONENTS[section.id];
          return (
            <CollapsibleSection
              key={section.id}
              id={section.id}
              title={section.title}
              icon={SECTION_ICONS[section.id]}
              isOpen={openSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
              onRef={(el) => { sectionRefs.current[section.id] = el; }}
            >
              {SectionComponent ? <SectionComponent /> : null}
            </CollapsibleSection>
          );
        })}
      </div>

      {/* CSS Output Footer */}
      <div className="border-t border-white/5 p-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">CSS Output</span>
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

export default RightPanel;
