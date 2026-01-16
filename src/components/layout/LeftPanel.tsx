import { useState, useEffect, useCallback } from "react";

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

export function LeftPanel() {
  const [activeSection, setActiveSection] = useState<LeftPanelSection | null>("variables");
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

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

        {/* Settings button at bottom (placeholder) */}
        <IconButton
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          }
          label="Settings"
          shortcut="⌘,"
          active={false}
          onClick={() => {}}
        />
      </div>

      {/* Expandable Panel Content */}
      {activeSection && !isPanelCollapsed && (
        <div className="w-64 bg-surface/50 flex flex-col border-r border-border">
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
      return <VariablesContent />;
    case "components":
      return <ComponentsContent />;
    case "assets":
      return <AssetsContent />;
    case "layers":
      return <LayersContent />;
    default:
      return null;
  }
}

// ============================================================================
// Variables Panel Content
// ============================================================================

function VariablesContent() {
  return (
    <div className="p-3 space-y-4">
      <p className="text-xs text-text-muted">
        Design tokens and CSS variables from your theme.
      </p>

      {/* Colors Section */}
      <div className="space-y-2">
        <div className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
          Colors
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { name: "primary", color: "#3b82f6" },
            { name: "surface", color: "#141414" },
            { name: "background", color: "#0a0a0a" },
            { name: "text", color: "#ffffff" },
          ].map((token) => (
            <button
              key={token.name}
              className="w-8 h-8 rounded-md border border-border hover:border-border-hover transition-colors cursor-pointer"
              style={{ backgroundColor: token.color }}
              title={`--color-${token.name}`}
            />
          ))}
        </div>
      </div>

      {/* Spacing Section */}
      <div className="space-y-2">
        <div className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
          Spacing
        </div>
        <div className="space-y-1">
          {["4px", "8px", "12px", "16px", "24px", "32px"].map((value, i) => (
            <div
              key={value}
              className="flex items-center gap-2 text-xs text-text-muted hover:text-text cursor-pointer"
            >
              <div
                className="h-2 bg-primary/30 rounded-sm"
                style={{ width: parseInt(value) }}
              />
              <span className="font-mono">--space-{i + 1}</span>
              <span className="ml-auto opacity-50">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Components Panel Content
// ============================================================================

function ComponentsContent() {
  const components = [
    { name: "Button", category: "Inputs" },
    { name: "Input", category: "Inputs" },
    { name: "Checkbox", category: "Inputs" },
    { name: "Card", category: "Layout" },
    { name: "Dialog", category: "Overlays" },
    { name: "Tabs", category: "Navigation" },
    { name: "Avatar", category: "Display" },
    { name: "Badge", category: "Display" },
  ];

  // Group by category
  const grouped = components.reduce((acc, comp) => {
    if (!acc[comp.category]) acc[comp.category] = [];
    acc[comp.category].push(comp);
    return acc;
  }, {} as Record<string, typeof components>);

  return (
    <div className="p-3 space-y-3">
      <p className="text-xs text-text-muted">
        Components found in your project.
      </p>

      {Object.entries(grouped).map(([category, comps]) => (
        <div key={category} className="space-y-1">
          <div className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
            {category}
          </div>
          <div className="space-y-0.5">
            {comps.map((comp) => (
              <button
                key={comp.name}
                className="w-full px-2 py-1.5 text-left text-sm text-text hover:bg-white/5 rounded-md cursor-pointer transition-colors"
              >
                {comp.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Assets Panel Content
// ============================================================================

function AssetsContent() {
  const assets = [
    { name: "logo.svg", type: "image" },
    { name: "icon-home.svg", type: "icon" },
    { name: "icon-settings.svg", type: "icon" },
    { name: "icon-user.svg", type: "icon" },
    { name: "hero-bg.png", type: "image" },
    { name: "icon-search.svg", type: "icon" },
    { name: "icon-menu.svg", type: "icon" },
    { name: "icon-close.svg", type: "icon" },
  ];

  return (
    <div className="p-3 space-y-3">
      <p className="text-xs text-text-muted">
        Icons and images. Click to copy name.
      </p>

      <div className="grid grid-cols-4 gap-2">
        {assets.map((asset) => (
          <button
            key={asset.name}
            className="w-full aspect-square rounded-md bg-white/5 flex items-center justify-center text-text-muted hover:text-text hover:bg-white/10 transition-colors cursor-pointer"
            title={asset.name}
            onClick={() => navigator.clipboard.writeText(asset.name)}
          >
            {asset.type === "icon" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            ) : (
              Icons.image
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Layers Panel Content - Webflow-style DOM Tree
// ============================================================================

interface LayerNode {
  id: string;
  name: string;
  type: "div" | "component" | "text" | "image";
  children?: LayerNode[];
  isExpanded?: boolean;
}

// Mock DOM tree structure
const mockLayerTree: LayerNode[] = [
  {
    id: "body",
    name: "Body",
    type: "div",
    isExpanded: true,
    children: [
      {
        id: "app",
        name: "App",
        type: "component",
        isExpanded: true,
        children: [
          {
            id: "header",
            name: "header",
            type: "div",
            children: [
              { id: "nav", name: "nav", type: "div" },
              { id: "logo", name: "Logo", type: "component" },
            ],
          },
          {
            id: "main",
            name: "main",
            type: "div",
            isExpanded: true,
            children: [
              {
                id: "hero",
                name: "section.hero",
                type: "div",
                children: [
                  { id: "h1", name: "h1", type: "text" },
                  { id: "p", name: "p", type: "text" },
                  { id: "cta", name: "Button", type: "component" },
                ],
              },
              {
                id: "features",
                name: "section.features",
                type: "div",
                children: [
                  { id: "card1", name: "Card", type: "component" },
                  { id: "card2", name: "Card", type: "component" },
                  { id: "card3", name: "Card", type: "component" },
                ],
              },
            ],
          },
          {
            id: "footer",
            name: "footer",
            type: "div",
          },
        ],
      },
    ],
  },
];

function LayersContent() {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(["body", "app", "main"])
  );
  const [selectedNode, setSelectedNode] = useState<string | null>("hero");

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

  return (
    <div className="py-2">
      <LayerTree
        nodes={mockLayerTree}
        depth={0}
        expandedNodes={expandedNodes}
        selectedNode={selectedNode}
        onToggleExpand={toggleExpand}
        onSelectNode={setSelectedNode}
      />
    </div>
  );
}

interface LayerTreeProps {
  nodes: LayerNode[];
  depth: number;
  expandedNodes: Set<string>;
  selectedNode: string | null;
  onToggleExpand: (nodeId: string) => void;
  onSelectNode: (nodeId: string) => void;
}

function LayerTree({
  nodes,
  depth,
  expandedNodes,
  selectedNode,
  onToggleExpand,
  onSelectNode,
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
          onToggleExpand={onToggleExpand}
          onSelectNode={onSelectNode}
          expandedNodes={expandedNodes}
          selectedNode={selectedNode}
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
  onToggleExpand: (nodeId: string) => void;
  onSelectNode: (nodeId: string) => void;
  expandedNodes: Set<string>;
  selectedNode: string | null;
}

function LayerTreeNode({
  node,
  depth,
  isExpanded,
  isSelected,
  onToggleExpand,
  onSelectNode,
  expandedNodes,
  selectedNode,
}: LayerTreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const paddingLeft = 8 + depth * 12;

  const getNodeIcon = () => {
    switch (node.type) {
      case "component":
        return Icons.component;
      case "text":
        return Icons.text;
      case "image":
        return Icons.image;
      default:
        return Icons.div;
    }
  };

  const isComponent = node.type === "component";

  return (
    <div>
      <button
        className={`
          w-full flex items-center gap-1 py-1 pr-2 text-left transition-colors
          ${isSelected
            ? "bg-primary/20"
            : "hover:bg-white/5"
          }
        `}
        style={{ paddingLeft }}
        onClick={() => onSelectNode(node.id)}
      >
        {/* Expand/Collapse Chevron */}
        <span
          className={`w-4 h-4 flex items-center justify-center text-text-muted ${
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

        {/* Node Icon */}
        <span className={isComponent ? "text-success" : "text-text-muted"}>
          {getNodeIcon()}
        </span>

        {/* Node Name */}
        <span
          className={`text-xs truncate ${
            isComponent ? "text-success" : "text-text"
          }`}
        >
          {node.name}
        </span>
      </button>

      {/* Children */}
      {hasChildren && isExpanded && (
        <LayerTree
          nodes={node.children!}
          depth={depth + 1}
          expandedNodes={expandedNodes}
          selectedNode={selectedNode}
          onToggleExpand={onToggleExpand}
          onSelectNode={onSelectNode}
        />
      )}
    </div>
  );
}

export default LeftPanel;
