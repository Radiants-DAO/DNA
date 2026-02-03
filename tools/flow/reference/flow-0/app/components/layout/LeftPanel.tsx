import { useState, useEffect, useCallback } from "react";
import { VariablesPanel } from "../VariablesPanel";
import { ComponentsPanel } from "../ComponentsPanel";
import { AssetsPanel } from "../AssetsPanel";
import { DragHandle, useDraggable } from "../DragHandle";
import { Tooltip } from "../FloatingModeBar";
import { useAppStore } from "../../stores/appStore";
import { open } from "@tauri-apps/plugin-dialog";
import {
  Settings,
  LayoutGrid,
  Image,
  Layers,
  ChevronDown,
  ChevronRight,
  Square,
  Component,
  Type,
  Link,
  Edit,
  Eye,
  EyeOff,
  Layout,
  FolderTree,
  FolderOpen,
} from "../ui/icons";

/**
 * LeftPanel - Floating icon bar + floating panel content
 *
 * Converted from docked sidebar to floating design (similar to FloatingModeBar):
 * - Floating icon bar: Vertically centered on left edge of screen
 * - Floating panels: Open next to the bar, auto-sized to content
 * - Keyboard shortcuts: 1-4 to switch sections, B for spatial browser
 *
 * Sections:
 * 1. Variables - Design tokens and CSS variables
 * 2. Components - Project components list
 * 3. Assets - Icons and images
 * 4. Layers - DOM tree (Webflow-style navigator)
 * B. Spatial Browser - File system spatial view settings
 */

export type LeftPanelSection = "variables" | "components" | "assets" | "layers" | "spatial";

interface SectionConfig {
  id: LeftPanelSection;
  label: string;
  shortcut: string;
  icon: React.ReactNode;
}


// ============================================================================
// Section Configuration
// ============================================================================

const SECTIONS: SectionConfig[] = [
  { id: "variables", label: "Variables", shortcut: "1", icon: <Settings size={18} /> },
  { id: "components", label: "Components", shortcut: "2", icon: <LayoutGrid size={18} /> },
  { id: "assets", label: "Assets", shortcut: "3", icon: <Image size={18} /> },
  { id: "layers", label: "Layers", shortcut: "4", icon: <Layers size={18} /> },
  { id: "spatial", label: "Spatial Browser", shortcut: "B", icon: <FolderTree size={18} /> },
];

// Standalone toggle (not a panel section)
const COMPONENT_CANVAS_CONFIG = {
  label: "Component Canvas",
  shortcut: "G",
  icon: <Component size={18} />,
};

// ============================================================================
// Icon Button Component
// ============================================================================

interface IconButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  shortcut: string;
  onClick: () => void;
  badge?: number;
  tooltipSide?: "top" | "bottom" | "right" | "left";
}

function IconButton({ icon, label, active, shortcut, onClick, badge, tooltipSide = "right" }: IconButtonProps) {
  const tooltipContent = (
    <span className="flex items-center gap-1.5">
      <span>{label}</span>
      <kbd className="bg-white/20 px-1 rounded text-[10px] font-mono">{shortcut}</kbd>
    </span>
  );

  return (
    <Tooltip content={tooltipContent} side={tooltipSide}>
      <button
        onClick={onClick}
        className={`
          relative w-9 h-9 flex items-center justify-center rounded-md transition-all duration-150
          ${active
            ? "bg-accent text-white"
            : "text-text-muted hover:text-text hover:bg-white/10"
          }
        `}
      >
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </button>
    </Tooltip>
  );
}

// ============================================================================
// Main LeftPanel Component - Now a Floating Bar
// ============================================================================

// Panel width for floating panels
const PANEL_WIDTH = 280;
const PANEL_MAX_HEIGHT = 500;

// Default position for the left panel bar
const getDefaultLeftPanelPosition = () => {
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  return { x: 8, y: vh / 2 - 100 };
};

export function LeftPanel() {
  const [activeSection, setActiveSection] = useState<LeftPanelSection | null>(null);

  // Spatial browser toggle state
  const spatialBrowserActive = useAppStore((s) => s.spatialBrowserActive);
  const toggleSpatialBrowser = useAppStore((s) => s.toggleSpatialBrowser);

  // Component canvas toggle state
  const componentCanvasActive = useAppStore((s) => s.componentCanvasActive);
  const toggleComponentCanvas = useAppStore((s) => s.toggleComponentCanvas);

  // Draggable position state
  const {
    position,
    isDragging,
    elementRef,
    handleDragStart,
    snapEdge,
  } = useDraggable(getDefaultLeftPanelPosition(), "radflow-left-panel-position");

  // Determine orientation from snap edge
  const isHorizontal = snapEdge === "top" || snapEdge === "bottom";

  // Tooltip side based on snap edge
  const tooltipSide: "top" | "bottom" | "right" | "left" =
    snapEdge === "left" ? "right" :
    snapEdge === "right" ? "left" :
    snapEdge === "top" ? "bottom" :
    snapEdge === "bottom" ? "top" :
    "right"; // default for vertical bar on left side

  // Toggle section - clicking same section closes panel, different section switches
  // For spatial section: also toggle the spatial browser view
  const toggleSection = useCallback((section: LeftPanelSection) => {
    if (activeSection === section) {
      setActiveSection(null);
      // When closing spatial panel, also disable spatial browser view
      if (section === "spatial" && spatialBrowserActive) {
        toggleSpatialBrowser();
      }
    } else {
      setActiveSection(section);
      // When opening spatial panel, also enable spatial browser view
      if (section === "spatial" && !spatialBrowserActive) {
        toggleSpatialBrowser();
      }
    }
  }, [activeSection, spatialBrowserActive, toggleSpatialBrowser]);

  // Keyboard shortcuts: 1-4 for section switching, B for spatial browser panel
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

      const key = e.key.toLowerCase();
      if (key >= "1" && key <= "4") {
        const index = parseInt(key) - 1;
        const section = SECTIONS[index];
        if (section) {
          e.preventDefault();
          toggleSection(section.id);
        }
      }

      // B key toggles spatial browser panel (which also enables spatial view)
      if (key === "b") {
        e.preventDefault();
        toggleSection("spatial");
      }

      // G key toggles component canvas view
      if (key === "g") {
        e.preventDefault();
        toggleComponentCanvas();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSection]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking on the bar or panel itself
      if (target.closest('[data-devflow-id="floating-left-bar"]') ||
          target.closest('[data-devflow-id^="floating-panel-"]')) {
        return;
      }
      // Close panel if clicking outside
      if (activeSection) {
        setActiveSection(null);
      }
    };

    // Only add listener if a panel is open
    if (activeSection) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [activeSection]);

  return (
    <>
      {/* Floating Icon Bar - Draggable */}
      <div
        ref={elementRef}
        className="fixed z-30"
        style={{
          left: position.x,
          top: position.y,
        }}
        data-devflow-id="floating-left-bar"
      >
        <div className={`flex ${isHorizontal ? "" : "flex-col"} items-center gap-1 bg-background/90 backdrop-blur-sm rounded-lg p-1.5 shadow-lg border border-white/10`}>
          {/* Drag Handle */}
          <DragHandle
            onDragStart={handleDragStart}
            isDragging={isDragging}
            orientation={isHorizontal ? "horizontal" : "vertical"}
          />

          {/* Divider after drag handle */}
          <div className={isHorizontal ? "w-px h-6 bg-white/10 mx-0.5" : "w-6 h-px bg-white/10 my-0.5"} />

          {/* Section Icons - first 4 sections (Variables, Components, Assets, Layers) */}
          {SECTIONS.slice(0, 4).map((section) => (
            <IconButton
              key={section.id}
              icon={section.icon}
              label={section.label}
              shortcut={section.shortcut}
              active={activeSection === section.id}
              onClick={() => toggleSection(section.id)}
              tooltipSide={tooltipSide}
            />
          ))}

          {/* Divider before Spatial Browser */}
          <div className={isHorizontal ? "w-px h-6 bg-white/10 mx-0.5" : "w-6 h-px bg-white/10 my-0.5"} />

          {/* Spatial Browser - with panel and view toggle */}
          <IconButton
            icon={<FolderTree size={18} />}
            label="Spatial Browser"
            shortcut="B"
            active={activeSection === "spatial" || spatialBrowserActive}
            onClick={() => toggleSection("spatial")}
            tooltipSide={tooltipSide}
          />

          {/* Component Canvas toggle */}
          <IconButton
            icon={COMPONENT_CANVAS_CONFIG.icon}
            label={COMPONENT_CANVAS_CONFIG.label}
            shortcut={COMPONENT_CANVAS_CONFIG.shortcut}
            active={componentCanvasActive}
            onClick={toggleComponentCanvas}
            tooltipSide={tooltipSide}
          />
        </div>
      </div>

      {/* Floating Panel - Opens next to the bar */}
      {activeSection && (
        <div
          className="fixed z-35"
          style={isHorizontal ? {
            left: position.x,
            top: position.y + 56, // Bar height (~48px) + gap
          } : {
            left: position.x + 56, // Bar width (~48px) + gap
            top: position.y,
          }}
          data-devflow-id={`floating-panel-${activeSection}`}
        >
          <div
            className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/10 overflow-hidden flex flex-col"
            style={{ width: PANEL_WIDTH, maxHeight: PANEL_MAX_HEIGHT }}
          >
            {/* Panel Header */}
            <div className="h-10 px-3 flex items-center justify-between border-b border-white/10 shrink-0">
              <span className="text-xs font-medium text-text uppercase tracking-wider">
                {activeSection}
              </span>
              <div className="flex items-center gap-1">
                {activeSection === "components" && (
                  <ViewCanvasButton />
                )}
                <button
                  onClick={() => setActiveSection(null)}
                  className="text-text-muted hover:text-text text-xs hover:bg-white/5 px-2 py-1 rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Panel Content - scrollable */}
            <div className="flex-1 overflow-auto">
              <PanelContent section={activeSection} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// View Canvas Button (shown in Components panel header)
// ============================================================================

function ViewCanvasButton() {
  const componentCanvasActive = useAppStore((s) => s.componentCanvasActive);
  const setComponentCanvasActive = useAppStore((s) => s.setComponentCanvasActive);

  return (
    <button
      onClick={() => setComponentCanvasActive(!componentCanvasActive)}
      className={`text-[10px] px-2 py-1 rounded transition-colors ${
        componentCanvasActive
          ? "bg-primary/20 text-primary"
          : "text-text-muted hover:text-text hover:bg-white/5"
      }`}
      title="Toggle Component Canvas view"
    >
      {componentCanvasActive ? "Hide Canvas" : "View Canvas"}
    </button>
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
    case "spatial":
      return <SpatialBrowserPanel />;
    default:
      return null;
  }
}

// ============================================================================
// Spatial Browser Panel Content
// ============================================================================

const DEFAULT_AUTO_COLLAPSE = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "__pycache__",
  "target",
];

/**
 * Shorten path for display, replacing home directory with ~
 */
function shortenPath(path: string): string {
  const home = "/Users/";
  if (path.startsWith(home)) {
    const afterHome = path.substring(home.length);
    const firstSlash = afterHome.indexOf("/");
    if (firstSlash !== -1) {
      return "~" + afterHome.substring(firstSlash);
    }
  }
  return path;
}

function SpatialBrowserPanel() {
  const spatialShowHiddenFiles = useAppStore((s) => s.spatialShowHiddenFiles);
  const setSpatialShowHiddenFiles = useAppStore((s) => s.setSpatialShowHiddenFiles);
  const spatialRootPath = useAppStore((s) => s.spatialRootPath);
  const setSpatialRootPath = useAppStore((s) => s.setSpatialRootPath);

  const [autoCollapseOpen, setAutoCollapseOpen] = useState(false);
  const [autoCollapsePatterns, setAutoCollapsePatterns] = useState(DEFAULT_AUTO_COLLAPSE);
  const [newPattern, setNewPattern] = useState("");

  const handleSelectDirectory = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: true,
        title: "Select Directory to Browse",
      });

      if (selected) {
        const path = typeof selected === "string" ? selected : selected[0];
        setSpatialRootPath(path);
      }
    } catch (err) {
      console.error("Failed to select directory:", err);
    }
  }, [setSpatialRootPath]);

  const addPattern = useCallback(() => {
    if (newPattern && !autoCollapsePatterns.includes(newPattern)) {
      setAutoCollapsePatterns([...autoCollapsePatterns, newPattern]);
      setNewPattern("");
    }
  }, [newPattern, autoCollapsePatterns]);

  const removePattern = useCallback(
    (pattern: string) => {
      setAutoCollapsePatterns(autoCollapsePatterns.filter((p) => p !== pattern));
    },
    [autoCollapsePatterns]
  );

  const resetDefaults = useCallback(() => {
    setAutoCollapsePatterns(DEFAULT_AUTO_COLLAPSE);
  }, []);

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Directory path selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] text-text-muted uppercase tracking-wider">
          Root Directory
        </label>
        <div className="flex items-center gap-2">
          <div
            className="flex-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-text truncate min-w-0"
            title={spatialRootPath || "No directory selected"}
          >
            {spatialRootPath ? shortenPath(spatialRootPath) : "No directory selected"}
          </div>
          <button
            onClick={handleSelectDirectory}
            className="flex items-center gap-1 px-2 py-1.5 bg-accent hover:bg-accent/80 text-white rounded text-[10px] transition-colors shrink-0"
            title="Browse for directory"
          >
            <FolderOpen size={12} />
            Browse
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* Show hidden files toggle */}
      <label
        htmlFor="spatial-show-hidden-panel"
        className="flex items-center gap-2 text-xs text-text-muted cursor-pointer select-none hover:text-text transition-colors"
      >
        <input
          id="spatial-show-hidden-panel"
          type="checkbox"
          checked={spatialShowHiddenFiles}
          onChange={(e) => setSpatialShowHiddenFiles(e.target.checked)}
          className="rounded border-white/10 bg-background"
        />
        Show hidden files
      </label>

      {/* Auto-collapse settings */}
      <div>
        <button
          onClick={() => setAutoCollapseOpen(!autoCollapseOpen)}
          aria-expanded={autoCollapseOpen}
          className="flex items-center gap-2 text-xs text-text-muted hover:text-text transition-colors"
        >
          <Settings size={12} />
          Auto-collapse settings
          <ChevronDown
            size={12}
            className={`transition-transform ${autoCollapseOpen ? "rotate-180" : ""}`}
          />
        </button>

        {autoCollapseOpen && (
          <div className="mt-2 p-2 bg-background rounded border border-white/10">
            <div className="flex flex-wrap gap-1 mb-2">
              {autoCollapsePatterns.map((pattern) => (
                <span
                  key={pattern}
                  className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-[10px] text-text"
                >
                  {pattern}
                  <button
                    onClick={() => removePattern(pattern)}
                    aria-label={`Remove ${pattern}`}
                    className="hover:text-red-400 transition-colors"
                  >
                    <span className="text-[10px]">x</span>
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
                placeholder="Add pattern..."
                className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-text placeholder:text-text-muted"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPattern();
                  }
                }}
              />
              <button
                onClick={addPattern}
                className="px-2 py-1 bg-accent text-white rounded text-[10px] hover:bg-accent/80 transition-colors"
              >
                Add
              </button>
            </div>

            <button
              onClick={resetDefaults}
              className="mt-2 text-[10px] text-text-muted hover:text-text transition-colors"
            >
              Reset to defaults
            </button>
          </div>
        )}
      </div>

      {/* Hint about the spatial view */}
      <p className="text-[10px] text-text-muted mt-2 border-t border-white/10 pt-2">
        Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-[9px]">B</kbd> to toggle the spatial browser view.
        Use the file tree on the right to navigate.
      </p>
    </div>
  );
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
      <div className="px-2 py-1.5 border-b border-white/10 flex items-center gap-1">
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
      <div className="px-2 py-1.5 border-t border-white/10 text-[10px] text-text-muted">
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
        return <Component size={14} />;
      case "symbol":
        return <Component size={14} />;
      case "text":
        return <Type size={14} />;
      case "image":
        return <Image size={14} />;
      case "section":
        return <Layout size={14} />;
      case "link":
        return <Link size={14} />;
      case "button":
        return <Square size={14} />;
      case "form":
        return <LayoutGrid size={14} />;
      case "input":
        return <Edit size={14} />;
      default:
        return <Square size={14} />;
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
            ? "bg-accent/20"
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
          {hasChildren && (isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />)}
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
          {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
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
