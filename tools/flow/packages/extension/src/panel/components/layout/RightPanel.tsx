/**
 * RightPanel - Horizontal floating bar with Designer and Mutations tabs
 *
 * Simplified version for Chrome extension:
 * - Designer tab: Style property sections
 * - Mutations tab: Pending style changes
 *
 * Uses content bridge messaging instead of Tauri for mutations.
 */

import { useState, useCallback } from "react";
import { useAppStore } from "../../stores/appStore";

type RightPanelTab = "designer" | "mutations";

interface TabConfig {
  id: RightPanelTab;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  { id: "designer", label: "Designer", icon: <PaintbrushIcon /> },
  { id: "mutations", label: "Mutations", icon: <EditIcon /> },
];

const PANEL_WIDTH = 280;

export function RightPanel() {
  const [activeTab, setActiveTab] = useState<RightPanelTab | null>(null);

  const mutationDiffs = useAppStore((s) => s.mutationDiffs);

  const toggleTab = useCallback((tab: RightPanelTab) => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  }, []);

  return (
    <>
      {/* Floating Horizontal Bar */}
      <div
        className="fixed top-2 right-2 z-30"
        data-devflow-id="floating-right-bar"
      >
        <div className="flex items-center gap-1 bg-neutral-900/90 backdrop-blur-sm rounded-lg px-1.5 py-1 shadow-lg border border-neutral-700/50">
          {TABS.map((tab) => {
            const badge = tab.id === "mutations" ? mutationDiffs.length : undefined;
            return (
              <TabButton
                key={tab.id}
                icon={tab.icon}
                label={tab.label}
                active={activeTab === tab.id}
                onClick={() => toggleTab(tab.id)}
                badge={badge}
              />
            );
          })}
        </div>
      </div>

      {/* Floating Panel */}
      {activeTab && (
        <div
          className="fixed top-12 right-2 z-35"
          data-devflow-id={`floating-right-panel-${activeTab}`}
        >
          <div
            className="bg-neutral-900/95 backdrop-blur-sm rounded-lg shadow-lg border border-neutral-700/50 overflow-hidden flex flex-col"
            style={{ width: PANEL_WIDTH, maxHeight: "calc(100vh - 64px)" }}
          >
            {/* Panel Header */}
            <div className="h-10 px-3 flex items-center justify-between border-b border-neutral-700/50 shrink-0">
              <span className="text-xs font-medium text-neutral-200 uppercase tracking-wider">
                {activeTab}
              </span>
              <button
                onClick={() => setActiveTab(null)}
                className="text-neutral-400 hover:text-neutral-200 text-xs hover:bg-neutral-700/50 px-2 py-1 rounded transition-colors"
              >
                Close
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-auto">
              {activeTab === "designer" && <DesignerContent />}
              {activeTab === "mutations" && <MutationsContent />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface TabButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

function TabButton({ icon, label, active, onClick, badge }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors text-xs font-medium ${
        active
          ? "bg-blue-600 text-white"
          : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50"
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className={`ml-0.5 min-w-[16px] h-4 px-1 text-[10px] font-bold rounded-full flex items-center justify-center ${
            active ? "bg-white/20 text-white" : "bg-blue-500 text-white"
          }`}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

function DesignerContent() {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["layout", "spacing"])
  );

  const toggleSection = useCallback((section: string) => {
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

  const sections = [
    { id: "layout", title: "Layout" },
    { id: "spacing", title: "Spacing" },
    { id: "size", title: "Size" },
    { id: "typography", title: "Typography" },
    { id: "backgrounds", title: "Backgrounds" },
    { id: "borders", title: "Borders" },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="px-3 py-2 border-b border-neutral-700/50">
        <div className="text-xs text-neutral-400 font-mono">
          <span className="hover:text-blue-400 cursor-pointer">div</span>
          <span className="mx-1 text-neutral-600">&gt;</span>
          <span className="hover:text-blue-400 cursor-pointer">section</span>
          <span className="mx-1 text-neutral-600">&gt;</span>
          <span className="text-neutral-200">button</span>
        </div>
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <CollapsibleSection
          key={section.id}
          title={section.title}
          isOpen={openSections.has(section.id)}
          onToggle={() => toggleSection(section.id)}
        >
          <SectionPlaceholder section={section.id} />
        </CollapsibleSection>
      ))}
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="border-b border-neutral-800/50">
      <button
        onClick={onToggle}
        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-neutral-800/50 transition-colors"
      >
        <span className="text-xs font-medium text-neutral-300 uppercase tracking-wider">
          {title}
        </span>
        <ChevronIcon
          className={`w-4 h-4 text-neutral-500 transition-transform ${
            isOpen ? "" : "-rotate-90"
          }`}
        />
      </button>
      {isOpen && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

function SectionPlaceholder({ section }: { section: string }) {
  const placeholders: Record<string, React.ReactNode> = {
    layout: (
      <div className="space-y-2">
        <PropertyRow label="Display" value="flex" />
        <PropertyRow label="Direction" value="row" />
        <PropertyRow label="Align" value="center" />
      </div>
    ),
    spacing: (
      <div className="space-y-2">
        <PropertyRow label="Padding" value="16px" />
        <PropertyRow label="Margin" value="0" />
        <PropertyRow label="Gap" value="8px" />
      </div>
    ),
    size: (
      <div className="space-y-2">
        <PropertyRow label="Width" value="auto" />
        <PropertyRow label="Height" value="40px" />
      </div>
    ),
    typography: (
      <div className="space-y-2">
        <PropertyRow label="Font" value="Inter" />
        <PropertyRow label="Size" value="14px" />
        <PropertyRow label="Weight" value="500" />
      </div>
    ),
    backgrounds: (
      <div className="space-y-2">
        <PropertyRow label="Color" value="#3B82F6" isColor />
      </div>
    ),
    borders: (
      <div className="space-y-2">
        <PropertyRow label="Width" value="1px" />
        <PropertyRow label="Radius" value="6px" />
      </div>
    ),
  };

  return placeholders[section] || <p className="text-xs text-neutral-500">No properties</p>;
}

interface PropertyRowProps {
  label: string;
  value: string;
  isColor?: boolean;
}

function PropertyRow({ label, value, isColor }: PropertyRowProps) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-neutral-400">{label}</span>
      <div className="flex items-center gap-1.5">
        {isColor && (
          <div
            className="w-4 h-4 rounded border border-neutral-600"
            style={{ backgroundColor: value }}
          />
        )}
        <span className="text-neutral-200 font-mono text-[11px]">{value}</span>
      </div>
    </div>
  );
}

function MutationsContent() {
  const mutationDiffs = useAppStore((s) => s.mutationDiffs);
  const clearMutationDiffs = useAppStore((s) => s.clearMutationDiffs);

  if (mutationDiffs.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-neutral-800 flex items-center justify-center">
          <EditIcon className="w-5 h-5 text-neutral-500" />
        </div>
        <p className="text-xs text-neutral-400">No pending mutations</p>
        <p className="text-[10px] text-neutral-500 mt-1">
          Style changes will appear here
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="px-3 py-2 border-b border-neutral-700/50 flex items-center justify-between">
        <span className="text-xs text-neutral-400">
          {mutationDiffs.length} change{mutationDiffs.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={clearMutationDiffs}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Mutation List */}
      <div className="p-2 space-y-2">
        {mutationDiffs.map((diff) => (
          <MutationItem key={diff.id} diff={diff} />
        ))}
      </div>
    </div>
  );
}

interface MutationItemProps {
  diff: {
    id: string;
    element: { selector: string };
    type: string;
    changes: Array<{ property: string; oldValue: string; newValue: string }>;
  };
}

function MutationItem({ diff }: MutationItemProps) {
  const removeMutationDiff = useAppStore((s) => s.removeMutationDiff);

  return (
    <div className="group p-2 bg-neutral-800/50 rounded-lg">
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-xs text-neutral-300 font-mono truncate">
          {diff.element.selector}
        </span>
        <button
          onClick={() => removeMutationDiff(diff.id)}
          className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <XIcon className="w-3 h-3" />
        </button>
      </div>
      {diff.changes.map((change, idx) => (
        <div key={idx} className="mt-1">
          <div className="text-[10px] text-blue-400 mb-0.5">{change.property}</div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-red-400 line-through">{change.oldValue}</span>
            <span className="text-neutral-500">&rarr;</span>
            <span className="text-green-400">{change.newValue}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Icons
function PaintbrushIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
      <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z" />
    </svg>
  );
}

function EditIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function XIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default RightPanel;
