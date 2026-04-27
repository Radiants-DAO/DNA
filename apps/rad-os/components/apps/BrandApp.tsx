'use client';

import { useMemo, useState } from 'react';
import { AppWindow } from '@rdna/radiants/components/core';
import { type AppProps } from '@/lib/apps';
import { useWindowManager } from '@/hooks/useWindowManager';
import { useControlSurfaceSlot } from '@/components/Rad_os/AppWindow';
import { Icon, RadMarkIcon, FontAaIcon } from '@rdna/radiants/icons/runtime';
import { TypographyPlayground, SubTabNav, type SubTab } from '@/components/apps/typography-playground';
import {
  LogoMakerCanvas,
  useLogoMakerState,
} from '@/components/apps/brand-assets/LogoMaker';
import { LogoMakerControls } from '@/components/apps/brand-assets/LogoMakerControls';
import { ColorsTab } from './brand-assets/colors-tab';

const TAB_NAV = [
  { value: 'logos', label: 'Logos', icon: <RadMarkIcon /> },
  { value: 'colors', label: 'Color', icon: <Icon name="pencil" /> },
  { value: 'fonts', label: 'Type', icon: <FontAaIcon /> },
] as const;

export function BrandApp({ windowId }: AppProps) {
  const [typoSubTab, setTypoSubTab] = useState<SubTab>('manual');
  const { getActiveTab, setActiveTab } = useWindowManager();
  const activeTab = getActiveTab(windowId) ?? 'logos';

  // LogoMaker state — always mounted so state persists across tab switches.
  const logoState = useLogoMakerState();

  // Push the dock only while the logos tab is active. Most `logoState` keys
  // already match `LogoMakerControls` prop names — only size / color / ratio
  // need remapping.
  const dockSlot = useMemo(() => {
    if (activeTab !== 'logos') return null;
    return {
      side: 'right' as const,
      width: 260,
      children: (
        <LogoMakerControls
          {...logoState}
          size={logoState.sizePx}
          onSizeChange={logoState.onSizePxChange}
          color={logoState.logoColor}
          aspectRatio={logoState.ratio}
          sizeUnit="PX"
        />
      ),
    };
  }, [activeTab, logoState]);

  useControlSurfaceSlot(dockSlot);

  return (
    <>
      <AppWindow.Nav value={activeTab} onChange={(tabId) => setActiveTab(windowId, tabId)} showInactiveLabels>
        {TAB_NAV.map((tab) => (
          <AppWindow.Nav.Item key={tab.value} value={tab.value} icon={tab.icon}>
            {tab.label}
          </AppWindow.Nav.Item>
        ))}
      </AppWindow.Nav>

      {activeTab === 'logos' && <LogoMakerCanvas state={logoState} />}
      {activeTab === 'colors' && <ColorsTab />}
      {activeTab === 'fonts' && (
        /* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-stage-gradient owner:design expires:2027-01-01 issue:DNA-001 */
        <AppWindow.Content className="bg-gradient-to-b from-cream to-sun-yellow dark:from-page dark:to-page">
          <AppWindow.Island corners="pixel" padding="none" className="@container">
            <div className="shrink-0 px-3 py-2 border-b border-line bg-card flex items-center gap-3">
              <SubTabNav active={typoSubTab} onChange={setTypoSubTab} />
            </div>
            <div className="flex-1 min-h-0">
              <div className="h-full flex flex-col">
                <div className="flex-1 min-h-0">
                  <TypographyPlayground activeSubTab={typoSubTab} />
                </div>
              </div>
            </div>
          </AppWindow.Island>
        </AppWindow.Content>
      )}
    </>
  );
}

export default BrandApp;
