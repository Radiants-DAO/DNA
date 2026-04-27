'use client';

import { AppWindow } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons/runtime';
import { useWindowManager } from '@/hooks/useWindowManager';
import type { AppProps } from '@/lib/apps';
import { CanvasTab } from './tabs/CanvasTab';
import { CornersTab } from './tabs/CornersTab';
import { DitherTab } from './tabs/DitherTab';
import { IconsTab } from './tabs/IconsTab';
import { PatternsTab } from './tabs/PatternsTab';
import { RadiantsTab } from './tabs/RadiantsTab';

const PIXEL_LAB_TABS = [
  { value: 'radiants', label: 'Radiants', icon: <Icon name="rad-mark" /> },
  { value: 'corners', label: 'Corners', icon: <Icon name="resize-corner" /> },
  { value: 'icons', label: 'Icons', icon: <Icon name="document-image" /> },
  { value: 'patterns', label: 'Patterns', icon: <Icon name="css-grid" /> },
  { value: 'dither', label: 'Dither', icon: <Icon name="equalizer" /> },
  { value: 'canvas', label: 'Canvas', icon: <Icon name="pencil" /> },
] as const;

type PixelLabTab = (typeof PIXEL_LAB_TABS)[number]['value'];

function resolvePixelLabTab(tabId: string | undefined): PixelLabTab {
  return PIXEL_LAB_TABS.some((tab) => tab.value === tabId)
    ? (tabId as PixelLabTab)
    : 'radiants';
}

function PixelLabPanel({ activeTab }: { activeTab: PixelLabTab }) {
  switch (activeTab) {
    case 'radiants':
      return <RadiantsTab />;
    case 'corners':
      return <CornersTab />;
    case 'icons':
      return <IconsTab />;
    case 'patterns':
      return <PatternsTab />;
    case 'dither':
      return <DitherTab />;
    case 'canvas':
      return <CanvasTab />;
  }
}

export function PixelLab({ windowId }: AppProps) {
  const { getActiveTab, setActiveTab } = useWindowManager();
  const activeTab = resolvePixelLabTab(getActiveTab(windowId));

  return (
    <>
      <AppWindow.Nav
        value={activeTab}
        onChange={(tabId) => setActiveTab(windowId, tabId)}
        showInactiveLabels={false}
      >
        {PIXEL_LAB_TABS.map((tab) => (
          <AppWindow.Nav.Item key={tab.value} value={tab.value} icon={tab.icon}>
            {tab.label}
          </AppWindow.Nav.Item>
        ))}
      </AppWindow.Nav>

      <PixelLabPanel activeTab={activeTab} />
    </>
  );
}

export default PixelLab;
