/**
 * SidePanelLayout - Action-oriented layout for the Chrome Side Panel.
 *
 * Two rail tabs (Layers stub, Designer) and a persistent bottom dock.
 * Inspection/scanner surfaces (Components, Assets, Variables) stay in DevTools.
 */

import { useState, useEffect } from 'react';
import { RailTabBar, type SidePanelTabId } from './RailTabBar';
import { DesignerContent } from './RightPanel';
import { BottomDock } from './BottomDock';
import { useAppStore } from '../../stores/appStore';
import { DogfoodBoundary } from '../ui/DogfoodBoundary';

function SidePanelTabContent({ tab }: { tab: SidePanelTabId }) {
  switch (tab) {
    case 'layers':
      return <LayersStub />;
    case 'designer':
      return <DesignerContent />;
  }
}

/** Layers tab placeholder — built in Plan 4. */
function LayersStub() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-2 p-4">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
      <p className="text-xs">Layers panel — coming in Plan 4</p>
    </div>
  );
}

export function SidePanelLayout() {
  const [activeTab, setActiveTab] = useState<SidePanelTabId>('layers');
  const activePanel = useAppStore((s) => s.activePanel);

  // Drive tab focus from UI panel intents (e.g. typography focus while in T mode)
  useEffect(() => {
    if (!activePanel) return;
    if (
      activePanel === 'typography' ||
      activePanel === 'layout' ||
      activePanel === 'spacing' ||
      activePanel === 'colors'
    ) {
      setActiveTab('designer');
    }
  }, [activePanel]);

  return (
    <DogfoodBoundary name="SidePanelLayout" file="layout/SidePanelLayout.tsx" category="layout">
      <div className="h-screen flex flex-col overflow-hidden bg-neutral-950 text-neutral-100">
        <RailTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        <div
          id={`sp-tabpanel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={activeTab}
          className="flex-1 overflow-y-auto bg-neutral-900"
        >
          <SidePanelTabContent tab={activeTab} />
        </div>

        <BottomDock />
      </div>
    </DogfoodBoundary>
  );
}
