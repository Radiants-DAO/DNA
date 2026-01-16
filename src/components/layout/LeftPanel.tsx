import { useState, useEffect, useCallback } from "react";
import { VariablesPanel } from "../VariablesPanel";
import { ComponentsPanel } from "../ComponentsPanel";
import { AssetsPanel } from "../AssetsPanel";

/**
 * LeftPanel - Icon rail + expandable panel content
 *
 * Structure based on radflow/devtools LeftRail pattern:
 * - Icon rail: Always visible, provides quick access to sections
 * - Panel content: Expandable area that shows section content
 * - Keyboard shortcuts: 1-4 to switch sections
 *
 * Sections:
 * 1. Variables - Design tokens and CSS variables
 * 2. Components - Project components list
 * 3. Assets - Icons and images
 * 4. Layers - DOM tree (Webflow-style navigator)
 */

export type LeftPanelSection = "variables" | "components" | "assets" | "layers";

interface SectionConfig {
  id: LeftPanelSection;
  label: string;
  shortcut: string;
  icon: React.ReactNode;
}

// ============================================================================
// Icons
// ============================================================================

const Icons = {
  variables: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  components: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  assets: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  layers: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  chevronLeft: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
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
  div: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  component: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
      <line x1="12" y1="22" x2="12" y2="15.5" />
      <polyline points="22 8.5 12 15.5 2 8.5" />
    </svg>
  ),
  text: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  ),
  image: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
};

// ============================================================================
// Section Configuration
// ============================================================================

const SECTIONS: SectionConfig[] = [
  { id: "variables", label: "Variables", shortcut: "1", icon: Icons.variables },
  { id: "components", label: "Components", shortcut: "2", icon: Icons.components },
  { id: "assets", label: "Assets", shortcut: "3", icon: Icons.assets },
  { id: "layers", label: "Layers", shortcut: "4", icon: Icons.layers },
];

// ============================================================================
// Icon Button Component
// ============================================================================

interface IconButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  shortcut: string;
  onClick: () => void;
}

function IconButton({ icon, label, active, shortcut, onClick }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-9 h-9 flex items-center justify-center rounded-md transition-all duration-150
        ${active
          ? "bg-primary/20 text-primary"
          : "text-text-muted hover:text-text hover:bg-white/5"
        }
      `}
      title={`${label} (${shortcut})`}
    >
      {icon}
    </button>
  );
}

// ============================================================================
// Main LeftPanel Component
// ============================================================================

// Icon rail width constant
const RAIL_WIDTH = 48; // w-12 = 48px

interface LeftPanelProps {
  /** Total width of the panel (rail + content). Passed from EditorLayout. */
  width?: number;
}

export function LeftPanel({ width = 312 }: LeftPanelProps) {
  const [activeSection, setActiveSection] = useState<LeftPanelSection | null>("variables");
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Calculate content width (total width minus rail)
  const contentWidth = Math.max(0, width - RAIL_WIDTH);

  // Toggle section - clicking active section collapses panel
  const toggleSection = useCallback((section: LeftPanelSection) => {
    if (activeSection === section && !isPanelCollapsed) {
      setIsPanelCollapsed(true);
    } else {
      setActiveSection(section);
      setIsPanelCollapsed(false);
    }
  }, [activeSection, isPanelCollapsed]);

  // Keyboard shortcuts: 1-4 for section switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Don't trigger if modifier keys are pressed (except shift for some shortcuts)
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const key = e.key;
      if (key >= "1" && key <= "4") {
        const index = parseInt(key) - 1;
        const section = SECTIONS[index];
        if (section) {
          e.preventDefault();
          toggleSection(section.id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSection]);

  return (
    <div className="flex h-full">
      {/* Icon Rail - Always visible */}
      <div className="w-12 bg-surface flex flex-col items-center py-2 gap-1 border-r border-border">
        {/* Section Icons */}
        <div className="flex flex-col gap-0.5">
          {SECTIONS.map((section) => (
            <IconButton
              key={section.id}
              icon={section.icon}
              label={section.label}
              shortcut={section.shortcut}
              active={activeSection === section.id}
              onClick={() => toggleSection(section.id)}
            />
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Settings button at bottom */}
        <div className="relative">
          <IconButton
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            }
            label="Settings"
            shortcut="⌘,"
            active={showSettingsMenu}
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
          />
          {/* Settings Dropdown Menu */}
          {showSettingsMenu && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowSettingsMenu(false)}
              />
              <div className="absolute bottom-full left-0 mb-1 w-48 bg-surface border border-border rounded-lg shadow-xl z-50 py-1">
                <button
                  onClick={() => setShowSettingsMenu(false)}
                  className="w-full text-left px-3 py-2 text-sm text-text-muted hover:bg-white/5 transition-colors cursor-not-allowed"
                  disabled
                >
                  Preferences (coming soon)
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Expandable Panel Content */}
      {activeSection && !isPanelCollapsed && (
        <div
          className="bg-surface/50 flex flex-col border-r border-border"
          style={{ width: contentWidth }}
        >
          {/* Panel Header */}
          <div className="h-10 px-3 flex items-center justify-between border-b border-border shrink-0">
            <span className="text-xs font-medium text-text uppercase tracking-wider">
              {activeSection}
            </span>
            <button
              onClick={() => setIsPanelCollapsed(true)}
              className="text-text-muted hover:text-text p-1 rounded hover:bg-white/5 transition-colors"
              title="Collapse panel"
            >
              {Icons.chevronLeft}
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-auto">
            <PanelContent section={activeSection} />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Panel Content Router
// ============================================================================

function PanelContent({ section }: { section: LeftPanelSection }) {
  switch (section) {
    case "variables":
      return <VariablesPanel />;
    case "components":
      return <ComponentsPanel />;
    case "assets":
      return <AssetsPanel />;
    case "layers":
      return <LayersContent />;
    default:
      return null;
  }
}




// ============================================================================
// Layers Panel Content - Webflow-style Full Page DOM Tree
// ============================================================================

interface LayerNode {
  id: string;
  name: string;
  type: "div" | "component" | "symbol" | "text" | "image" | "link" | "button" | "form" | "input" | "section";
  children?: LayerNode[];
  isHidden?: boolean;
  className?: string;
}

// Full page DOM tree structure (Webflow Navigator style)
const mockLayerTree: LayerNode[] = [
  {
    id: "body",
    name: "Body",
    type: "div",
    children: [
      {
        id: "page-wrapper",
        name: "page-wrapper",
        type: "div",
        children: [
          {
            id: "global-styles",
            name: "Global Styles",
            type: "symbol",
          },
          {
            id: "main-wrapper",
            name: "main-wrapper",
            type: "div",
            children: [
              // Navigation Section
              {
                id: "section-nav",
                name: "section-nav",
                type: "section",
                children: [
                  {
                    id: "navbar",
                    name: "Navbar",
                    type: "component",
                    children: [
                      { id: "nav-brand", name: "nav-brand", type: "div", children: [
                        { id: "logo", name: "Logo", type: "image" },
                        { id: "brand-text", name: "brand-text", type: "text" },
                      ]},
                      { id: "nav-menu", name: "nav-menu", type: "div", children: [
                        { id: "nav-link-1", name: "nav-link", type: "link" },
                        { id: "nav-link-2", name: "nav-link", type: "link" },
                        { id: "nav-link-3", name: "nav-link", type: "link" },
                        { id: "nav-link-4", name: "nav-link", type: "link" },
                      ]},
                      { id: "nav-cta", name: "Button", type: "component" },
                    ],
                  },
                ],
              },
              // Hero Section
              {
                id: "section-hero",
                name: "section-hero",
                type: "section",
                children: [
                  {
                    id: "hero-container",
                    name: "hero-container",
                    type: "div",
                    children: [
                      { id: "hero-content", name: "hero-content", type: "div", children: [
                        { id: "hero-badge", name: "Badge", type: "component" },
                        { id: "hero-heading", name: "h1", type: "text" },
                        { id: "hero-subtext", name: "p.hero-subtext", type: "text" },
                        { id: "hero-cta-group", name: "hero-cta-group", type: "div", children: [
                          { id: "hero-btn-primary", name: "Button", type: "component" },
                          { id: "hero-btn-secondary", name: "Button", type: "component" },
                        ]},
                      ]},
                      { id: "hero-visual", name: "hero-visual", type: "div", children: [
                        { id: "hero-image", name: "hero-image", type: "image" },
                      ]},
                    ],
                  },
                ],
              },
              // Features Section
              {
                id: "section-features",
                name: "section-features",
                type: "section",
                children: [
                  { id: "features-heading", name: "section-heading", type: "div", children: [
                    { id: "features-title", name: "h2", type: "text" },
                    { id: "features-desc", name: "p", type: "text" },
                  ]},
                  {
                    id: "features-grid",
                    name: "features-grid",
                    type: "div",
                    children: [
                      { id: "feature-card-1", name: "FeatureCard", type: "component" },
                      { id: "feature-card-2", name: "FeatureCard", type: "component" },
                      { id: "feature-card-3", name: "FeatureCard", type: "component" },
                      { id: "feature-card-4", name: "FeatureCard", type: "component" },
                      { id: "feature-card-5", name: "FeatureCard", type: "component" },
                      { id: "feature-card-6", name: "FeatureCard", type: "component" },
                    ],
                  },
                ],
              },
              // Testimonials Section
              {
                id: "section-testimonials",
                name: "section-testimonials",
                type: "section",
                isHidden: false,
                children: [
                  { id: "testimonials-heading", name: "section-heading", type: "div" },
                  {
                    id: "testimonials-slider",
                    name: "TestimonialSlider",
                    type: "component",
                    children: [
                      { id: "testimonial-1", name: "TestimonialCard", type: "component" },
                      { id: "testimonial-2", name: "TestimonialCard", type: "component" },
                      { id: "testimonial-3", name: "TestimonialCard", type: "component" },
                    ],
                  },
                ],
              },
              // Pricing Section
              {
                id: "section-pricing",
                name: "section-pricing",
                type: "section",
                children: [
                  { id: "pricing-heading", name: "section-heading", type: "div" },
                  { id: "pricing-toggle", name: "PricingToggle", type: "component" },
                  {
                    id: "pricing-cards",
                    name: "pricing-cards",
                    type: "div",
                    children: [
                      { id: "pricing-card-1", name: "PricingCard", type: "component" },
                      { id: "pricing-card-2", name: "PricingCard", type: "component" },
                      { id: "pricing-card-3", name: "PricingCard", type: "component" },
                    ],
                  },
                ],
              },
              // CTA Section
              {
                id: "section-cta",
                name: "section-cta",
                type: "section",
                children: [
                  { id: "cta-content", name: "cta-content", type: "div", children: [
                    { id: "cta-heading", name: "h2", type: "text" },
                    { id: "cta-text", name: "p", type: "text" },
                  ]},
                  {
                    id: "cta-form",
                    name: "NewsletterForm",
                    type: "component",
                    children: [
                      { id: "cta-input", name: "input", type: "input" },
                      { id: "cta-submit", name: "button", type: "button" },
                    ],
                  },
                ],
              },
              // Footer Section
              {
                id: "section-footer",
                name: "section-footer",
                type: "section",
                children: [
                  {
                    id: "footer-content",
                    name: "Footer",
                    type: "component",
                    children: [
                      { id: "footer-brand", name: "footer-brand", type: "div", children: [
                        { id: "footer-logo", name: "Logo", type: "image" },
                        { id: "footer-desc", name: "p", type: "text" },
                      ]},
                      { id: "footer-links", name: "footer-links", type: "div", children: [
                        { id: "footer-col-1", name: "footer-col", type: "div" },
                        { id: "footer-col-2", name: "footer-col", type: "div" },
                        { id: "footer-col-3", name: "footer-col", type: "div" },
                      ]},
                      { id: "footer-social", name: "SocialLinks", type: "component" },
                    ],
                  },
                  { id: "footer-bottom", name: "footer-bottom", type: "div", children: [
                    { id: "copyright", name: "span", type: "text" },
                    { id: "legal-links", name: "legal-links", type: "div" },
                  ]},
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

function LayersContent() {
  // Default expanded: body, page-wrapper, main-wrapper, and hero section
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(["body", "page-wrapper", "main-wrapper", "section-hero", "hero-container"])
  );
  const [selectedNode, setSelectedNode] = useState<string | null>("hero-heading");
  const [hiddenNodes, setHiddenNodes] = useState<Set<string>>(new Set());

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const toggleVisibility = (nodeId: string) => {
    setHiddenNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Expand all section-level nodes
  const expandAllSections = () => {
    const sectionIds = new Set(expandedNodes);
    const addSections = (nodes: LayerNode[]) => {
      for (const node of nodes) {
        if (node.type === "section" || node.id.startsWith("section-")) {
          sectionIds.add(node.id);
        }
        if (node.children) {
          addSections(node.children);
        }
      }
    };
    addSections(mockLayerTree);
    setExpandedNodes(sectionIds);
  };

  // Collapse all section-level nodes
  const collapseAllSections = () => {
    setExpandedNodes(new Set(["body", "page-wrapper", "main-wrapper"]));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Section controls */}
      <div className="px-2 py-1.5 border-b border-border flex items-center gap-1">
        <button
          onClick={expandAllSections}
          className="text-[10px] text-text-muted hover:text-text px-1.5 py-0.5 rounded hover:bg-white/5"
          title="Expand all sections"
        >
          Expand All
        </button>
        <span className="text-text-muted text-[10px]">|</span>
        <button
          onClick={collapseAllSections}
          className="text-[10px] text-text-muted hover:text-text px-1.5 py-0.5 rounded hover:bg-white/5"
          title="Collapse all sections"
        >
          Collapse All
        </button>
      </div>

      {/* Tree content */}
      <div className="flex-1 overflow-auto py-1">
        <LayerTree
          nodes={mockLayerTree}
          depth={0}
          expandedNodes={expandedNodes}
          selectedNode={selectedNode}
          hiddenNodes={hiddenNodes}
          onToggleExpand={toggleExpand}
          onSelectNode={setSelectedNode}
          onToggleVisibility={toggleVisibility}
        />
      </div>

      {/* Footer info */}
      <div className="px-2 py-1.5 border-t border-border text-[10px] text-text-muted">
        {selectedNode ? `Selected: ${selectedNode}` : "Click to select element"}
      </div>
    </div>
  );
}

interface LayerTreeProps {
  nodes: LayerNode[];
  depth: number;
  expandedNodes: Set<string>;
  selectedNode: string | null;
  hiddenNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  onSelectNode: (nodeId: string) => void;
  onToggleVisibility: (nodeId: string) => void;
}

function LayerTree({
  nodes,
  depth,
  expandedNodes,
  selectedNode,
  hiddenNodes,
  onToggleExpand,
  onSelectNode,
  onToggleVisibility,
}: LayerTreeProps) {
  return (
    <div className="space-y-0">
      {nodes.map((node) => (
        <LayerTreeNode
          key={node.id}
          node={node}
          depth={depth}
          isExpanded={expandedNodes.has(node.id)}
          isSelected={selectedNode === node.id}
          isHidden={hiddenNodes.has(node.id)}
          onToggleExpand={onToggleExpand}
          onSelectNode={onSelectNode}
          onToggleVisibility={onToggleVisibility}
          expandedNodes={expandedNodes}
          selectedNode={selectedNode}
          hiddenNodes={hiddenNodes}
        />
      ))}
    </div>
  );
}

interface LayerTreeNodeProps {
  node: LayerNode;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  isHidden: boolean;
  onToggleExpand: (nodeId: string) => void;
  onSelectNode: (nodeId: string) => void;
  onToggleVisibility: (nodeId: string) => void;
  expandedNodes: Set<string>;
  selectedNode: string | null;
  hiddenNodes: Set<string>;
}

// Additional icons for new node types
const LayerIcons = {
  section: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="6" width="20" height="12" rx="2" />
    </svg>
  ),
  link: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  button: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="8" width="18" height="8" rx="3" />
    </svg>
  ),
  form: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="7" y1="8" x2="17" y2="8" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="7" y1="16" x2="12" y2="16" />
    </svg>
  ),
  input: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="8" width="18" height="8" rx="2" />
      <line x1="6" y1="12" x2="6" y2="12" strokeLinecap="round" />
    </svg>
  ),
  symbol: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
      <line x1="12" y1="22" x2="12" y2="15.5" />
      <polyline points="22 8.5 12 15.5 2 8.5" />
      <polyline points="2 15.5 12 8.5 22 15.5" />
    </svg>
  ),
  eyeOpen: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeClosed: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
};

function LayerTreeNode({
  node,
  depth,
  isExpanded,
  isSelected,
  isHidden,
  onToggleExpand,
  onSelectNode,
  onToggleVisibility,
  expandedNodes,
  selectedNode,
  hiddenNodes,
}: LayerTreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const paddingLeft = 8 + depth * 12;

  const getNodeIcon = () => {
    switch (node.type) {
      case "component":
        return Icons.component;
      case "symbol":
        return LayerIcons.symbol;
      case "text":
        return Icons.text;
      case "image":
        return Icons.image;
      case "section":
        return LayerIcons.section;
      case "link":
        return LayerIcons.link;
      case "button":
        return LayerIcons.button;
      case "form":
        return LayerIcons.form;
      case "input":
        return LayerIcons.input;
      default:
        return Icons.div;
    }
  };

  const isComponent = node.type === "component";
  const isSymbol = node.type === "symbol";
  const isSection = node.type === "section";

  // Determine text color based on type
  const getTextColor = () => {
    if (isComponent) return "text-success";
    if (isSymbol) return "text-success";
    if (isSection) return "text-text";
    return "text-text";
  };

  const getIconColor = () => {
    if (isComponent) return "text-success";
    if (isSymbol) return "text-success";
    return "text-text-muted";
  };

  return (
    <div className={isHidden ? "opacity-40" : ""}>
      <div
        className={`
          group w-full flex items-center gap-1 py-0.5 pr-1 text-left transition-colors
          ${isSelected
            ? "bg-primary/20"
            : "hover:bg-white/5"
          }
        `}
        style={{ paddingLeft }}
      >
        {/* Expand/Collapse Chevron */}
        <span
          className={`w-4 h-4 flex items-center justify-center text-text-muted shrink-0 ${
            hasChildren ? "cursor-pointer hover:text-text" : "opacity-0"
          }`}
          onClick={(e) => {
            if (hasChildren) {
              e.stopPropagation();
              onToggleExpand(node.id);
            }
          }}
        >
          {hasChildren && (isExpanded ? Icons.chevronDown : Icons.chevronRight)}
        </span>

        {/* Clickable row content */}
        <button
          className="flex items-center gap-1.5 flex-1 min-w-0"
          onClick={() => onSelectNode(node.id)}
        >
          {/* Node Icon */}
          <span className={`shrink-0 ${getIconColor()}`}>
            {getNodeIcon()}
          </span>

          {/* Node Name */}
          <span
            className={`text-xs truncate ${getTextColor()} ${
              isSection ? "font-medium" : ""
            }`}
          >
            {node.name}
          </span>
        </button>

        {/* Visibility Toggle - shown on hover */}
        <button
          className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-text p-0.5 shrink-0 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(node.id);
          }}
          title={isHidden ? "Show element" : "Hide element"}
        >
          {isHidden ? LayerIcons.eyeClosed : LayerIcons.eyeOpen}
        </button>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <LayerTree
          nodes={node.children!}
          depth={depth + 1}
          expandedNodes={expandedNodes}
          selectedNode={selectedNode}
          hiddenNodes={hiddenNodes}
          onToggleExpand={onToggleExpand}
          onSelectNode={onSelectNode}
          onToggleVisibility={onToggleVisibility}
        />
      )}
    </div>
  );
}

export default LeftPanel;
