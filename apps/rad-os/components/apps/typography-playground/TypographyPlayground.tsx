'use client';

import React, { useState } from 'react';
import { ToggleGroup } from '@rdna/radiants/components/core';
import {
  type FontKey,
  type TemplateId,
  FONT_MAP,
} from './typography-data';
import { PlaygroundControls } from './PlaygroundControls';
import { TemplatePreview } from './TemplatePreview';
import { TypeManual } from './TypeManual';

export type SubTab = 'playground' | 'manual';

interface TypographyPlaygroundProps {
  activeSubTab: SubTab;
}

export function TypographyPlayground({
  activeSubTab,
}: TypographyPlaygroundProps) {
  // -- Font state (playground only) --
  const [activeFont, setActiveFont] = useState<FontKey>('mondwest');
  const font = FONT_MAP[activeFont];

  // -- Template state --
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [activeTemplate, setActiveTemplate] = useState<TemplateId>('display');

  // -- Playground controls --
  const [size, setSize] = useState(34);
  const [leading, setLeading] = useState(12);
  const [spacing, setSpacing] = useState(0);
  const [weight, setWeight] = useState(400);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');
  const [glow, setGlow] = useState(true);

  const switchFont = (key: FontKey) => {
    setActiveFont(key);
    setWeight(FONT_MAP[key].weights[0].value);
  };

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

  /* Type Manual — full-width, self-contained layout */
  if (activeSubTab === 'manual') {
    return <TypeManual />;
  }

  /* Playground: preview left, controls right */
  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col items-center justify-center p-5 overflow-auto">
        <div className={`w-full max-w-[420px] aspect-square border border-line overflow-hidden ${mode === 'dark' ? 'dark' : ''}`}>
          <TemplatePreview
            templateId={activeTemplate}
            font={font}
            style={previewStyle}
          />
        </div>
      </div>

      <div className="w-[260px] shrink-0 overflow-y-auto border-l border-rule p-3 space-y-3">
        <div>
          <div className="font-heading text-xs text-mute uppercase tracking-tight mb-1">
            Font
          </div>
          <ToggleGroup
            value={[activeFont]}
            onValueChange={(v) =>
              v.length && switchFont(v[0] as FontKey)
            }
            size="sm"
          >
            <ToggleGroup.Item value="joystix" className="px-1.5">Joystix</ToggleGroup.Item>
            <ToggleGroup.Item value="mondwest" className="px-1.5">Mondwest</ToggleGroup.Item>
            <ToggleGroup.Item value="pixelcode" className="px-1.5">PixelCode</ToggleGroup.Item>
          </ToggleGroup>
        </div>
        <PlaygroundControls
          font={font}
          mode={mode}
          onModeChange={setMode}
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
      </div>
    </div>
  );
}
