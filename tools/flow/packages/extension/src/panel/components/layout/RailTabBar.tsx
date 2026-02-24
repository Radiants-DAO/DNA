import { useCallback } from 'react';

export type SidePanelTabId = 'layers' | 'designer';

interface TabConfig {
  id: SidePanelTabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  { id: 'layers', label: 'Layers', icon: <LayersIcon /> },
  { id: 'designer', label: 'Designer', icon: <PaintbrushIcon /> },
];

interface RailTabBarProps {
  activeTab: SidePanelTabId;
  onTabChange: (tab: SidePanelTabId) => void;
}

export function RailTabBar({ activeTab, onTabChange }: RailTabBarProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = TABS.findIndex((t) => t.id === activeTab);
      let nextIndex: number | null = null;

      if (e.key === 'ArrowRight') {
        nextIndex = currentIndex < TABS.length - 1 ? currentIndex + 1 : 0;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : TABS.length - 1;
      }

      if (nextIndex !== null) {
        e.preventDefault();
        onTabChange(TABS[nextIndex].id);
      }
    },
    [activeTab, onTabChange],
  );

  return (
    <div
      className="h-9 shrink-0 flex items-center gap-0.5 px-1 border-b border-neutral-800 bg-neutral-900"
      role="tablist"
      aria-label="Side Panel tabs"
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`sp-tabpanel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
            title={tab.label}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function LayersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function PaintbrushIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
      <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
      <path d="M14.5 17.5 4.5 15" />
    </svg>
  );
}
