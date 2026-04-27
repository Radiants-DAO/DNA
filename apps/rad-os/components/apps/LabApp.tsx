'use client';

import { useState, useCallback } from 'react';
import { AppWindow } from '@rdna/radiants/components/core';
import { type AppProps } from '@/lib/apps';
import { useWindowManager } from '@/hooks/useWindowManager';
import { Icon } from '@rdna/radiants/icons/runtime';
import {
  useUILibrary,
  UILibraryNavigator,
  UILibraryCode,
} from '@/components/ui/UILibrarySidebar';
import { DesignSystemTab } from '@/components/ui/DesignSystemTab';
import type { RegistryEntry } from '@rdna/radiants/registry';

const TAB_NAV = [
  { value: 'components', label: 'UI Library', icon: <Icon name="code-window" /> },
] as const;

type LabTab = (typeof TAB_NAV)[number]['value'];

function resolveLabTab(tabId: string | undefined): LabTab {
  return TAB_NAV.some((tab) => tab.value === tabId)
    ? (tabId as LabTab)
    : 'components';
}

export function LabApp({ windowId }: AppProps) {
  const { getActiveTab, setActiveTab } = useWindowManager();
  const activeTab = resolveLabTab(getActiveTab(windowId));
  const uiLib = useUILibrary();
  const [activeComponent, setActiveComponent] = useState<{ entry: RegistryEntry; props: Record<string, unknown> } | null>(null);

  const handleComponentInteract = useCallback((entry: RegistryEntry, props: Record<string, unknown>) => {
    setActiveComponent({ entry, props });
  }, []);

  return (
    <>
      <AppWindow.Nav value={activeTab} onChange={(tabId) => setActiveTab(windowId, tabId)} showInactiveLabels>
        {TAB_NAV.map((tab) => (
          <AppWindow.Nav.Item key={tab.value} value={tab.value} icon={tab.icon}>
            {tab.label}
          </AppWindow.Nav.Item>
        ))}
      </AppWindow.Nav>

      <AppWindow.Content layout="split" className="bg-brand-stage" data-active-tab={activeTab}>
        <div className="w-56 shrink-0 flex flex-col gap-1.5">
          <AppWindow.Island corners="pixel" padding="none" className="flex-1 min-h-0">
            <UILibraryNavigator
              searchQuery={uiLib.searchQuery}
              setSearchQuery={uiLib.setSearchQuery}
              grouped={uiLib.grouped}
              selectedEntry={uiLib.selectedEntry}
              setSelectedEntry={uiLib.setSelectedEntry}
            />
          </AppWindow.Island>
          {activeComponent && (
            <AppWindow.Island corners="pixel" padding="none" className="shrink max-h-[50%] min-h-0">
              <UILibraryCode
                selectedEntry={activeComponent.entry}
                propValues={activeComponent.props}
              />
            </AppWindow.Island>
          )}
        </div>
        <AppWindow.Island corners="pixel" padding="none" noScroll className="flex-1 @container">
          <DesignSystemTab hideControls onComponentInteract={handleComponentInteract} />
        </AppWindow.Island>
      </AppWindow.Content>
    </>
  );
}

export default LabApp;
