import { useState } from "react";
import { useAppStore } from "../../stores/appStore";

/**
 * LeftPanel - Icon rail + expandable panel content
 * Sections: Variables (1), Components (2), Assets (3), Layers (4)
 */

type LeftPanelSection = "variables" | "components" | "assets" | "layers";

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
      className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
        active
          ? "bg-primary/20 text-primary"
          : "text-text-muted hover:text-text hover:bg-white/5"
      }`}
      title={`${label} (${shortcut})`}
    >
      {icon}
    </button>
  );
}

export function LeftPanel() {
  const [activeSection, setActiveSection] = useState<LeftPanelSection | null>(
    "variables"
  );
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSection = (section: LeftPanelSection) => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
      setIsCollapsed(false);
    }
  };

  const icons = {
    variables: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    components: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 3v18" />
        <path d="M3 9h18" />
      </svg>
    ),
    assets: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
    layers: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  };

  return (
    <div className="flex h-full">
      {/* Icon Rail */}
      <div className="w-14 bg-surface border-r border-white/5 flex flex-col items-center py-3 gap-1">
        <IconButton
          icon={icons.variables}
          label="Variables"
          shortcut="1"
          active={activeSection === "variables"}
          onClick={() => toggleSection("variables")}
        />
        <IconButton
          icon={icons.components}
          label="Components"
          shortcut="2"
          active={activeSection === "components"}
          onClick={() => toggleSection("components")}
        />
        <IconButton
          icon={icons.assets}
          label="Assets"
          shortcut="3"
          active={activeSection === "assets"}
          onClick={() => toggleSection("assets")}
        />
        <IconButton
          icon={icons.layers}
          label="Layers"
          shortcut="4"
          active={activeSection === "layers"}
          onClick={() => toggleSection("layers")}
        />
      </div>

      {/* Expandable Panel Content */}
      {activeSection && !isCollapsed && (
        <div className="w-64 bg-surface/50 border-r border-white/5 flex flex-col">
          <div className="h-10 px-4 flex items-center justify-between border-b border-white/5">
            <span className="text-xs font-medium text-text uppercase tracking-wider">
              {activeSection}
            </span>
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-text-muted hover:text-text"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="11 17 6 12 11 7" />
                <polyline points="18 17 13 12 18 7" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <PanelContent section={activeSection} />
          </div>
        </div>
      )}
    </div>
  );
}

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

function VariablesContent() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-text-muted">
        Design tokens and CSS variables from your theme.
      </p>
      <div className="space-y-2">
        <div className="text-xs text-text-muted uppercase tracking-wider">
          Colors
        </div>
        <div className="grid grid-cols-4 gap-2">
          {["primary", "surface", "background", "text"].map((color) => (
            <div
              key={color}
              className={`w-8 h-8 rounded-md bg-${color} border border-white/10`}
              title={`--color-${color}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ComponentsContent() {
  return (
    <div className="space-y-2">
      <p className="text-xs text-text-muted">
        Components found in your project.
      </p>
      <div className="space-y-1">
        {["Button", "Card", "Input", "Dialog", "Tabs"].map((comp) => (
          <div
            key={comp}
            className="px-3 py-2 text-sm text-text hover:bg-white/5 rounded-md cursor-pointer"
          >
            {comp}
          </div>
        ))}
      </div>
    </div>
  );
}

function AssetsContent() {
  return (
    <div className="space-y-2">
      <p className="text-xs text-text-muted">Icons and images in your project.</p>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center text-text-muted"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

function LayersContent() {
  return (
    <div className="space-y-2">
      <p className="text-xs text-text-muted">DOM tree for the current view.</p>
      <div className="space-y-1 font-mono text-xs">
        <div className="text-text">
          <span className="text-text-muted">{"<"}</span>
          div
          <span className="text-text-muted">{">"}</span>
        </div>
        <div className="pl-4 text-text">
          <span className="text-text-muted">{"<"}</span>
          header
          <span className="text-text-muted">{">"}</span>
        </div>
        <div className="pl-8 text-text">
          <span className="text-text-muted">{"<"}</span>
          h1
          <span className="text-text-muted">{">"}</span>
        </div>
        <div className="pl-4 text-text">
          <span className="text-text-muted">{"<"}</span>
          main
          <span className="text-text-muted">{">"}</span>
        </div>
      </div>
    </div>
  );
}

export default LeftPanel;
