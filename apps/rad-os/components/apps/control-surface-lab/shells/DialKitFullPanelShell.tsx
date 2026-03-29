'use client';

import { useState } from 'react';
import {
  Button,
  Badge,
  Input,
  Slider,
  Switch,
  Collapsible,
} from '@rdna/radiants/components/core';

// ============================================================================
// DialKit Full Panel Shell — RDNA equivalent
//
// 1:1 comparison with DialKitFullPanelMock. Same controls, same data,
// translated into RDNA design language and component primitives.
// ============================================================================

export function DialKitFullPanelShell() {
  // --- state ---
  const [backPhotoOpen, setBackPhotoOpen] = useState(true);
  const [springOpen, setSpringOpen] = useState(true);
  const [springMode, setSpringMode] = useState<'time' | 'physics'>('time');
  const [darkMode, setDarkMode] = useState(false);
  const [layout, setLayout] = useState('stack');

  const [title, setTitle] = useState('Japan');
  const [subtitle, setSubtitle] = useState('');
  const [accentColor, setAccentColor] = useState('#c41e3a');
  const [shadowTint, setShadowTint] = useState('#000000');

  const [offsetX, setOffsetX] = useState(239);
  const [offsetY, setOffsetY] = useState(0);
  const [scale, setScale] = useState(0.7);
  const [overlayOpacity, setOverlayOpacity] = useState(0.6);

  const [visDuration, setVisDuration] = useState(0.5);
  const [bounce, setBounce] = useState(0.04);

  return (
    <div className="flex w-full flex-col pixel-rounded-sm bg-card overflow-hidden">
      {/* ---- Panel header ---- */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-line">
        <span className="font-heading text-xs uppercase tracking-wide text-mute">
          Photo Stack
        </span>
        <Button mode="flat" size="sm" iconOnly icon="minus" quiet />
      </div>

      {/* ---- Toolbar ---- */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-rule">
        <Badge size="sm">v1</Badge>
        <Button mode="flat" size="sm" icon="copy">
          Copy
        </Button>
      </div>

      {/* ---- Controls body ---- */}
      <div className="flex flex-col gap-3 overflow-y-auto p-3" style={{ maxHeight: 480 }}>

        {/* a. Text input — title */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-mute">title</span>
          <Input
            size="sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-mono text-xs w-28"
          />
        </div>

        {/* b. Text input — subtitle */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-mute">subtitle</span>
          <Input
            size="sm"
            placeholder="Enter subtitle..."
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="font-mono text-xs w-28"
          />
        </div>

        {/* c. Color picker — accentColor */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-mute">accentColor</span>
          <div className="flex items-center gap-1.5">
            {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:color-swatch-preview owner:design-system expires:2027-01-01 issue:DNA-999 */}
            <div className="h-5 w-5 pixel-rounded-sm border border-line" style={{ backgroundColor: accentColor }} />
            <Input
              size="sm"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="font-mono text-xs w-16"
            />
          </div>
        </div>

        {/* d. Color picker — shadowTint */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-mute">shadowTint</span>
          <div className="flex items-center gap-1.5">
            {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:color-swatch-preview owner:design-system expires:2027-01-01 issue:DNA-999 */}
            <div className="h-5 w-5 pixel-rounded-sm border border-line" style={{ backgroundColor: shadowTint }} />
            <Input
              size="sm"
              value={shadowTint}
              onChange={(e) => setShadowTint(e.target.value)}
              className="font-mono text-xs w-16"
            />
          </div>
        </div>

        {/* e. Select — layout (button group) */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-mute">layout</span>
          <div className="flex gap-0.5">
            {(['stack', 'fan', 'grid'] as const).map((opt) => (
              <Button
                key={opt}
                mode="flat"
                size="sm"
                compact
                active={layout === opt}
                onClick={() => setLayout(opt)}
              >
                {opt}
              </Button>
            ))}
          </div>
        </div>

        {/* f. Folder — backPhoto */}
        <Collapsible.Root
          defaultOpen
          open={backPhotoOpen}
          onOpenChange={setBackPhotoOpen}
        >
          <Collapsible.Trigger className="px-0 py-1">
            <span className="font-heading text-xs uppercase tracking-wide text-mute">
              backPhoto
            </span>
          </Collapsible.Trigger>
          <Collapsible.Content className="px-0">
            <div className="flex flex-col gap-2 pl-3 border-l border-line">
              <Slider
                label="offsetX"
                showValue
                value={offsetX}
                onChange={setOffsetX}
                min={0}
                max={400}
                size="sm"
              />
              <Slider
                label="offsetY"
                showValue
                value={offsetY}
                onChange={setOffsetY}
                min={0}
                max={150}
                size="sm"
              />
              <Slider
                label="scale"
                showValue
                value={scale}
                onChange={setScale}
                min={0.5}
                max={0.95}
                step={0.01}
                size="sm"
              />
              <Slider
                label="overlayOpacity"
                showValue
                value={overlayOpacity}
                onChange={setOverlayOpacity}
                min={0}
                max={1}
                step={0.01}
                size="sm"
              />
            </div>
          </Collapsible.Content>
        </Collapsible.Root>

        {/* g. Spring editor — transitionSpring */}
        <Collapsible.Root
          defaultOpen
          open={springOpen}
          onOpenChange={setSpringOpen}
        >
          <Collapsible.Trigger className="px-0 py-1">
            <span className="font-heading text-xs uppercase tracking-wide text-mute">
              transitionSpring
            </span>
          </Collapsible.Trigger>
          <Collapsible.Content className="px-0">
            <div className="flex flex-col gap-2 pl-3 border-l border-line">
              {/* Mode toggle */}
              <div className="flex gap-0.5">
                {(['time', 'physics'] as const).map((m) => (
                  <Button
                    key={m}
                    mode="flat"
                    size="sm"
                    compact
                    active={springMode === m}
                    onClick={() => setSpringMode(m)}
                  >
                    {m}
                  </Button>
                ))}
              </div>

              {/* Curve preview */}
              <div className="h-12 bg-page pixel-rounded-sm flex items-center justify-center">
                <svg width="100%" height="100%" viewBox="0 0 160 40" preserveAspectRatio="none">
                  <path
                    d="M8 32 C40 32, 50 8, 80 8 C110 8, 120 14, 152 10"
                    className="stroke-accent"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <line x1="8" y1="32" x2="8" y2="8" className="stroke-line" strokeWidth="0.5" />
                  <line x1="8" y1="32" x2="152" y2="32" className="stroke-line" strokeWidth="0.5" />
                </svg>
              </div>

              <Slider
                label="visualDuration"
                showValue
                value={visDuration}
                onChange={setVisDuration}
                min={0.1}
                max={1}
                step={0.01}
                size="sm"
              />
              <Slider
                label="bounce"
                showValue
                value={bounce}
                onChange={setBounce}
                min={0}
                max={1}
                step={0.01}
                size="sm"
              />
            </div>
          </Collapsible.Content>
        </Collapsible.Root>

        {/* h. Toggle — darkMode */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-mute">darkMode</span>
          <Switch
            checked={darkMode}
            onChange={setDarkMode}
            size="sm"
          />
        </div>

        {/* i. Action buttons */}
        <div className="flex flex-col gap-1.5">
          <Button mode="flat" size="sm" fullWidth>
            Next
          </Button>
          <Button mode="flat" size="sm" fullWidth>
            Previous
          </Button>
        </div>
      </div>
    </div>
  );
}
