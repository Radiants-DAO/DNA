'use client';

import React, { useState } from 'react';
import { ToggleGroup } from '@rdna/radiants/components/core';
import {
  type FontKey,
  type TemplateId,
  FONT_MAP,
  getTemplatesForMode,
} from './typography-data';
import { PlaygroundControls } from './PlaygroundControls';
import { TemplatePreview } from './TemplatePreview';
import {
  TypeScalePanel,
  ElementStylesPanel,
  CssReferencePanel,
  AboutFontPanel,
  TypeScaleDemo,
  ElementStylesDemo,
  CssReferenceDemo,
  AboutFontDemo,
} from './ReferencePanels';

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

  // Suppress unused-var warnings — wired in Task 6
  void _onSubTabChange;

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

        {/* Sub-tab content */}
        {activeSubTab === 'playground' && (
          <PlaygroundControls
            font={font}
            mode={mode}
            onModeChange={switchMode}
            activeTemplate={activeTemplate}
            onTemplateChange={setActiveTemplate}
            size={size}
            onSizeChange={setSize}
            leading={leading}
            onLeadingChange={setLeading}
            spacing={spacing}
            onSpacingChange={setSpacing}
            weight={weight}
            onWeightChange={setWeight}
            align={align}
            onAlignChange={setAlign}
            glow={glow}
            onGlowChange={setGlow}
          />
        )}
        {activeSubTab === 'scale' && <TypeScalePanel />}
        {activeSubTab === 'elements' && <ElementStylesPanel />}
        {activeSubTab === 'css-ref' && <CssReferencePanel font={font} />}
        {activeSubTab === 'about' && <AboutFontPanel font={font} />}
      </div>

      {/* -- Right column: preview -- */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 overflow-auto">
        <div className="w-full max-w-[420px] aspect-square border border-line overflow-hidden">
          {activeSubTab === 'playground' && (
            <TemplatePreview
              templateId={activeTemplate}
              font={font}
              style={previewStyle}
            />
          )}
          {activeSubTab === 'scale' && <TypeScaleDemo font={font} />}
          {activeSubTab === 'elements' && <ElementStylesDemo />}
          {activeSubTab === 'css-ref' && <CssReferenceDemo font={font} />}
          {activeSubTab === 'about' && <AboutFontDemo font={font} />}
        </div>
      </div>
    </div>
  );
}
