'use client';

import { useState } from 'react';
import { AppWindow, Switch } from '@rdna/radiants/components/core';
import { BRAND_COLORS } from './data';
import { FibonacciMosaic } from './FibonacciMosaic';
import { ColorPrimaryCard } from './ColorPrimaryCard';
import { SemanticView } from './SemanticView';
import { ColorsSubNav } from './ColorsSubNav';
import type { BrandColor, ExtendedColor, ColorsSubTab, HierarchyMode } from './types';

export function ColorsTab() {
  const [subTab, setSubTab] = useState<ColorsSubTab>('palette');
  const [mode, setMode] = useState<HierarchyMode>('light');
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
      <AppWindow.Island corners="pixel" padding="none" noScroll className="@container">
        <div className="h-full flex flex-col">
          <div className="shrink-0 px-3 py-2 border-b border-line bg-card flex items-center justify-between gap-3">
            <ColorsSubNav active={subTab} onChange={setSubTab} />
            <div className="flex items-center gap-2">
              <span className={`font-heading text-xs uppercase tracking-tight ${mode === 'light' ? 'text-main' : 'text-mute'}`}>Light</span>
              <Switch checked={mode === 'dark'} onChange={(c) => setMode(c ? 'dark' : 'light')} size="sm" />
              <span className={`font-heading text-xs uppercase tracking-tight ${mode === 'dark' ? 'text-main' : 'text-mute'}`}>Dark</span>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-auto p-3 flex flex-col gap-3">
            <div className="w-full shrink-0" style={{ aspectRatio: '1.618 / 1' }}>
              <FibonacciMosaic
                mode={mode}
                selectedCssVar={selected.cssVar}
                onSelect={setSelected}
              />
            </div>
            <ColorPrimaryCard
              selected={selected}
              mode={mode}
              onSelect={setSelected}
            />
          </div>
        </div>
      </AppWindow.Island>
    </AppWindow.Content>
  );
}
