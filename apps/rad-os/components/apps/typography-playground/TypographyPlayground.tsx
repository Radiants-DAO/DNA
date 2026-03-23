'use client';

import React, { useState } from 'react';
import { ToggleGroup } from '@rdna/radiants/components/core';
import {
  type FontKey,
  type TemplateId,
  FONT_MAP,
  getTemplatesForMode,
} from './typography-data';

export type SubTab = 'playground' | 'scale' | 'elements' | 'css-ref' | 'about';

interface TypographyPlaygroundProps {
  activeSubTab: SubTab;
  onSubTabChange: (tab: SubTab) => void;
}

export function TypographyPlayground({
  activeSubTab,
  onSubTabChange: _onSubTabChange,
}: TypographyPlaygroundProps) {
  // -- Font state --
  const [activeFont, setActiveFont] = useState<FontKey>('mondwest');
  const font = FONT_MAP[activeFont];

  // -- Template state --
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [activeTemplate, setActiveTemplate] = useState<TemplateId>('editorial');

  // -- Playground controls --
  const [size, setSize] = useState(34);
  const [leading, setLeading] = useState(12);
  const [spacing, setSpacing] = useState(0);
  const [weight, setWeight] = useState(400);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');
  const [glow, setGlow] = useState(true);

  // -- Mode switching selects first template of new mode --
  const switchMode = (m: 'light' | 'dark') => {
    setMode(m);
    const first = getTemplatesForMode(m)[0];
    if (first) setActiveTemplate(first.id);
  };

  // -- Font switching resets weight to first available --
  const switchFont = (key: FontKey) => {
    setActiveFont(key);
    setWeight(FONT_MAP[key].weights[0].value);
  };

  // -- Derived style object for template text --
  const previewStyle: React.CSSProperties = {
    fontSize: `${size}px`,
    lineHeight: (leading / 10).toFixed(1),
    letterSpacing: `${spacing / 100}em`,
    fontWeight: weight,
    textAlign: align,
    ...(glow && {
      textShadow:
        '0 0 110px oklch(0.91 0.12 94), 0 0 13px oklch(0.91 0.12 94)',
    }),
  };

  // Suppress unused-var warnings during scaffolding — these are wired in Tasks 3-6
  void activeSubTab;
  void _onSubTabChange;
  void font;
  void mode;
  void switchMode;
  void activeTemplate;
  void setActiveTemplate;
  void size;
  void setSize;
  void leading;
  void setLeading;
  void spacing;
  void setSpacing;
  void weight;
  void setWeight;
  void align;
  void setAlign;
  void glow;
  void setGlow;
  void previewStyle;

  return (
    <div className="flex h-full">
      {/* -- Left column -- */}
      <div className="w-[260px] shrink-0 overflow-y-auto border-r border-rule p-3 space-y-4">
        {/* Font picker -- always visible */}
        <div>
          <div className="font-heading text-xs text-mute uppercase tracking-tight mb-2">
            Font
          </div>
          <ToggleGroup
            value={[activeFont]}
            onValueChange={(v) =>
              v.length && switchFont(v[0] as FontKey)
            }
            size="sm"
          >
            <ToggleGroup.Item value="joystix">Joystix</ToggleGroup.Item>
            <ToggleGroup.Item value="mondwest">Mondwest</ToggleGroup.Item>
            <ToggleGroup.Item value="pixelcode">PixelCode</ToggleGroup.Item>
          </ToggleGroup>
        </div>

        {/* Sub-tab content -- filled in Tasks 3-4 */}
      </div>

      {/* -- Right column: preview -- */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 overflow-auto">
        <div className="w-full max-w-[420px] aspect-square border border-line overflow-hidden">
          {/* Preview content -- contextual per sub-tab, filled in Tasks 3-4 */}
        </div>
      </div>
    </div>
  );
}
