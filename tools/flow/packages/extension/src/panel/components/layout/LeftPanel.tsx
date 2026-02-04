/**
 * LeftPanel - Floating icon bar for panel sections
 *
 * Simplified version for Chrome extension:
 * - Removes Tauri file dialog (spatial browser stubbed)
 * - Keeps core sections: Layers, Components
 *
 * Sections:
 * 1. Layers - DOM tree navigator
 * 2. Components - Component list
 */

import { useState, useCallback } from "react";
import { ComponentsPanel } from "../ComponentsPanel";

export type LeftPanelSection = "layers" | "components";

interface SectionConfig {
  id: LeftPanelSection;
  label: string;
  shortcut: string;
  icon: React.ReactNode;
}

const SECTIONS: SectionConfig[] = [
  { id: "layers", label: "Layers", shortcut: "1", icon: <LayersIcon /> },
  { id: "components", label: "Components", shortcut: "2", icon: <GridIcon /> },
];

export function LeftPanel() {
  const [activeSection, setActiveSection] = useState<LeftPanelSection | null>(null);

  const toggleSection = useCallback((section: LeftPanelSection) => {
    setActiveSection((prev) => (prev === section ? null : section));
  }, []);

  return (
    <>
      {/* Floating Icon Bar */}
      <div
        className="fixed left-2 top-1/2 -translate-y-1/2 z-30"
        data-devflow-id="floating-left-bar"
      >
        <div className="flex flex-col items-center gap-1 bg-neutral-900/90 backdrop-blur-sm rounded-lg p-1.5 shadow-lg border border-neutral-700/50">
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
      </div>

      {/* Floating Panel */}
      {activeSection && (
        <div
          className="fixed left-14 top-1/2 -translate-y-1/2 z-40"
          data-devflow-id={`floating-panel-${activeSection}`}
        >
          <div className="bg-neutral-900/95 backdrop-blur-sm rounded-lg shadow-lg border border-neutral-700/50 overflow-hidden w-64 max-h-96">
            {/* Panel Header */}
            <div className="h-10 px-3 flex items-center justify-between border-b border-neutral-700/50">
              <span className="text-xs font-medium text-neutral-200 uppercase tracking-wider">
                {activeSection}
              </span>
              <button
                onClick={() => setActiveSection(null)}
                className="text-neutral-400 hover:text-neutral-200 text-xs hover:bg-neutral-700/50 px-2 py-1 rounded transition-colors"
              >
                Close
              </button>
            </div>

            {/* Panel Content */}
            <div className="overflow-auto max-h-80">
              <PanelContent section={activeSection} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface IconButtonProps {
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  active: boolean;
  onClick: () => void;
}

function IconButton({ icon, label, shortcut, active, onClick }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-9 h-9 flex items-center justify-center rounded-md transition-colors ${
        active
          ? "bg-blue-600 text-white"
          : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50"
      }`}
      title={`${label} (${shortcut})`}
    >
      {icon}
    </button>
  );
}

function PanelContent({ section }: { section: LeftPanelSection }) {
  switch (section) {
    case "layers":
      return <LayersContent />;
    case "components":
      return <ComponentsContent />;
    default:
      return null;
  }
}

function LayersContent() {
  return (
    <div className="p-3">
      <p className="text-xs text-neutral-400 mb-3">
        DOM tree of the inspected page. Select elements to edit.
      </p>
      <div className="space-y-1">
        <LayerItem name="html" depth={0} />
        <LayerItem name="body" depth={1} />
        <LayerItem name="div.container" depth={2} isSelected />
        <LayerItem name="header" depth={3} />
        <LayerItem name="main" depth={3} />
        <LayerItem name="footer" depth={3} />
      </div>
    </div>
  );
}

interface LayerItemProps {
  name: string;
  depth: number;
  isSelected?: boolean;
}

function LayerItem({ name, depth, isSelected }: LayerItemProps) {
  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
        isSelected
          ? "bg-blue-600/20 text-blue-400"
          : "text-neutral-300 hover:bg-neutral-700/50"
      }`}
      style={{ paddingLeft: 8 + depth * 12 }}
    >
      <ChevronIcon className="w-3 h-3 text-neutral-500" />
      <span className="font-mono">{name}</span>
    </div>
  );
}

function ComponentsContent() {
  return <ComponentsPanel />;
}


// Icons
function LayersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}


export default LeftPanel;
