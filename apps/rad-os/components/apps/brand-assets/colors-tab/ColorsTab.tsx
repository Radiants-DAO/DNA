'use client';

import { useState } from 'react';
import { AppWindow } from '@rdna/radiants/components/core';
import { BRAND_COLORS } from './data';
import { FibonacciMosaic } from './FibonacciMosaic';
import { ColorPrimaryCard } from './ColorPrimaryCard';
import { SemanticView } from './SemanticView';
import { ColorsSubNav } from './ColorsSubNav';
import type { BrandColor, ExtendedColor, ColorsSubTab } from './types';

export function ColorsTab() {
  const [subTab, setSubTab] = useState<ColorsSubTab>('palette');
  const [selected, setSelected] = useState<BrandColor | ExtendedColor>(BRAND_COLORS[0]);

  if (subTab === 'semantic') {
    return (
      <AppWindow.Content>
        <AppWindow.Island corners="pixel" padding="none" className="@container">
          <div className="shrink-0 px-3 py-2 border-b border-line bg-card">
            <ColorsSubNav active={subTab} onChange={setSubTab} />
          </div>
          <SemanticView />
        </AppWindow.Island>
      </AppWindow.Content>
    );
  }

  return (
    <AppWindow.Content>
      <AppWindow.Island padding="none" noScroll className="@container">
        <div className="h-full flex flex-col">
          <div className="shrink-0 px-3 py-2 border-b border-line bg-card">
            <ColorsSubNav active={subTab} onChange={setSubTab} />
          </div>
          <div className="flex-1 min-h-0 flex flex-col gap-px bg-line">
            <ColorPrimaryCard
              selected={selected}
            />
            <div className="min-h-0 flex-1">
              <FibonacciMosaic
                selectedCssVar={selected.cssVar}
                onSelect={setSelected}
              />
            </div>
          </div>
        </div>
      </AppWindow.Island>
    </AppWindow.Content>
  );
}
