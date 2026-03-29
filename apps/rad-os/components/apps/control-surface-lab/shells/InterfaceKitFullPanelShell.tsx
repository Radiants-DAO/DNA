'use client';

import { useState } from 'react';
import { Button, Badge, Input, Slider, Switch, ScrollArea } from '@rdna/radiants/components/core';

type Tab = 'style' | 'typography' | 'layout';
type BorderStyle = 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
type ShadowPreset = 'none' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type FontStyle = 'normal' | 'italic';
type Alignment = 'L' | 'C' | 'R' | 'J';
type FlexDir = '→' | '↓' | '←' | '↑';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-heading text-xs uppercase tracking-wide text-mute">
      {children}
    </span>
  );
}

function ColorSwatch({ color }: { color: string }) {
  return (
    // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:mock-swatch owner:design expires:2027-01-01 issue:DNA-000
    <span
      className="w-6 h-6 rounded-sm border border-line shrink-0"
      style={{ backgroundColor: color }}
    />
  );
}

/* ─── Style Tab ─── */
function StyleTab() {
  const [borderStyle, setBorderStyle] = useState<BorderStyle>('solid');
  const [borderWidth, setBorderWidth] = useState(1);
  const [shadow, setShadow] = useState<ShadowPreset>('sm');
  const [radii, setRadii] = useState([4, 4, 4, 4]);
  const [linked, setLinked] = useState(true);
  const [blur, setBlur] = useState(0);
  const [opacity, setOpacity] = useState(100);

  const borderSymbols: { s: BorderStyle; label: string }[] = [
    { s: 'solid', label: '─' }, { s: 'dashed', label: '--' },
    { s: 'dotted', label: '···' }, { s: 'double', label: '══' },
    { s: 'none', label: '∅' },
  ];
  const shadowPresets: ShadowPreset[] = ['none', '2xs', 'xs', 'sm', 'md', 'lg', 'xl'];

  const updateRadius = (idx: number, val: number) => {
    if (linked) setRadii([val, val, val, val]);
    else setRadii((prev) => prev.map((v, i) => (i === idx ? val : v)));
  };

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Background */}
      <div className="flex flex-col gap-1">
        <SectionLabel>Background</SectionLabel>
        <div className="flex items-center gap-2">
          <ColorSwatch color="rgba(255,255,255,1)" />
          <Input size="sm" defaultValue="rgba(255, 255, 255, 1)" />
        </div>
      </div>

      {/* Border */}
      <div className="flex flex-col gap-2">
        <SectionLabel>Border</SectionLabel>
        <div className="flex gap-1">
          {borderSymbols.map(({ s, label }) => (
            <Button key={s} mode="flat" size="sm" compact active={borderStyle === s} onClick={() => setBorderStyle(s)}>
              {label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <ColorSwatch color="#d1d5db" />
          <Input size="sm" defaultValue="#d1d5db" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-mute">Width</span>
            <span className="font-mono text-xs text-mute">{borderWidth}px</span>
          </div>
          <Slider size="sm" min={0} max={8} value={borderWidth} onChange={setBorderWidth} />
        </div>
      </div>

      {/* Radius */}
      <div className="flex flex-col gap-2">
        <SectionLabel>Radius</SectionLabel>
        <div className="flex items-center gap-2">
          <div className="grid grid-cols-2 gap-1">
            {['TL', 'TR', 'BL', 'BR'].map((corner, idx) => (
              <input
                key={corner}
                type="number"
                className="h-6 w-12 bg-page border border-line rounded-sm px-1 text-center font-mono text-xs text-main"
                value={radii[idx]}
                onChange={(e) => updateRadius(idx, Number(e.target.value))}
              />
            ))}
          </div>
          <Switch size="sm" checked={linked} onChange={setLinked} label="Link" />
        </div>
      </div>

      {/* Shadow */}
      <div className="flex flex-col gap-1.5">
        <SectionLabel>Shadow</SectionLabel>
        <div className="flex flex-wrap gap-1">
          {shadowPresets.map((p) => (
            <Badge key={p} size="sm" variant={shadow === p ? 'accent' : 'default'}>
              <button className="cursor-pointer font-mono" onClick={() => setShadow(p)}>{p}</button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Backdrop Blur */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <SectionLabel>Backdrop Blur</SectionLabel>
          <span className="font-mono text-xs text-mute">{blur}px</span>
        </div>
        <Slider size="sm" min={0} max={20} value={blur} onChange={setBlur} />
      </div>

      {/* Opacity */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <SectionLabel>Opacity</SectionLabel>
          <span className="font-mono text-xs text-mute">{opacity}%</span>
        </div>
        <Slider size="sm" min={0} max={100} value={opacity} onChange={setOpacity} />
      </div>
    </div>
  );
}

/* ─── Typography Tab ─── */
function TypographyTab() {
  const [fontSize, setFontSize] = useState(16);
  const [fontWeight, setFontWeight] = useState(400);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [fontStyle, setFontStyle] = useState<FontStyle>('normal');
  const [alignment, setAlignment] = useState<Alignment>('L');

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Font Family */}
      <div className="flex flex-col gap-1">
        <SectionLabel>Font Family</SectionLabel>
        <div className="flex gap-1">
          {['Inter', 'Mono', 'System'].map((f) => (
            <Button key={f} mode="flat" size="sm" compact>{f}</Button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <SectionLabel>Size</SectionLabel>
          <span className="font-mono text-xs text-mute">{fontSize}px</span>
        </div>
        <Slider size="sm" min={8} max={72} value={fontSize} onChange={setFontSize} />
      </div>

      {/* Weight */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <SectionLabel>Weight</SectionLabel>
          <span className="font-mono text-xs text-mute">{fontWeight}</span>
        </div>
        <Slider size="sm" min={100} max={900} step={100} value={fontWeight} onChange={setFontWeight} />
      </div>

      {/* Line Height */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <SectionLabel>Line Height</SectionLabel>
          <span className="font-mono text-xs text-mute">{lineHeight}</span>
        </div>
        <Slider size="sm" min={0.5} max={3} step={0.1} value={lineHeight} onChange={setLineHeight} />
      </div>

      {/* Letter Spacing */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <SectionLabel>Letter Spacing</SectionLabel>
          <span className="font-mono text-xs text-mute">{letterSpacing}em</span>
        </div>
        <Slider size="sm" min={-2} max={4} step={0.1} value={letterSpacing} onChange={setLetterSpacing} />
      </div>

      {/* Style */}
      <div className="flex flex-col gap-1">
        <SectionLabel>Style</SectionLabel>
        <div className="flex gap-1">
          {(['normal', 'italic'] as FontStyle[]).map((s) => (
            <Button key={s} mode="flat" size="sm" compact active={fontStyle === s} onClick={() => setFontStyle(s)}>
              {s === 'italic' ? <em>{s}</em> : s}
            </Button>
          ))}
        </div>
      </div>

      {/* Alignment */}
      <div className="flex flex-col gap-1">
        <SectionLabel>Alignment</SectionLabel>
        <div className="flex gap-1">
          {(['L', 'C', 'R', 'J'] as Alignment[]).map((a) => (
            <Button key={a} mode="flat" size="sm" compact active={alignment === a} onClick={() => setAlignment(a)}>
              {a}
            </Button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div className="flex flex-col gap-1">
        <SectionLabel>Color</SectionLabel>
        <div className="flex items-center gap-2">
          <ColorSwatch color="#1a1a1a" />
          <Input size="sm" defaultValue="#1a1a1a" />
        </div>
      </div>
    </div>
  );
}

/* ─── Layout Tab ─── */
function LayoutTab() {
  const [flexDir, setFlexDir] = useState<FlexDir>('→');
  const [alignPos, setAlignPos] = useState(4);
  const [gap, setGap] = useState(8);
  const [display, setDisplay] = useState('flex');

  const dirs: FlexDir[] = ['→', '↓', '←', '↑'];
  const displays = ['flex', 'grid', 'block', 'inline'];

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Dimensions */}
      <div className="flex flex-col gap-1">
        <SectionLabel>Dimensions</SectionLabel>
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs text-mute">W</span>
            <Input size="sm" defaultValue="auto" />
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs text-mute">H</span>
            <Input size="sm" defaultValue="auto" />
          </div>
        </div>
      </div>

      {/* Display */}
      <div className="flex flex-col gap-1">
        <SectionLabel>Display</SectionLabel>
        <div className="flex gap-1">
          {displays.map((d) => (
            <Button key={d} mode="flat" size="sm" compact active={display === d} onClick={() => setDisplay(d)}>
              {d}
            </Button>
          ))}
        </div>
      </div>

      {/* Direction */}
      <div className="flex flex-col gap-1">
        <SectionLabel>Direction</SectionLabel>
        <div className="flex gap-1">
          {dirs.map((d) => (
            <Button key={d} mode="flat" size="sm" compact active={flexDir === d} onClick={() => setFlexDir(d)}>
              {d}
            </Button>
          ))}
        </div>
      </div>

      {/* Align Grid */}
      <div className="flex flex-col gap-1">
        <SectionLabel>Align</SectionLabel>
        <div className="grid grid-cols-3 gap-0.5 w-fit">
          {Array.from({ length: 9 }).map((_, i) => (
            <Button
              key={i}
              mode="flat"
              size="sm"
              compact
              active={alignPos === i}
              onClick={() => setAlignPos(i)}
              className="!h-4 !w-4 !min-w-0 !p-0 pixel-rounded-sm"
            />
          ))}
        </div>
      </div>

      {/* Padding */}
      <div className="flex flex-col gap-1">
        <SectionLabel>Padding</SectionLabel>
        <div className="flex gap-1">
          {['T', 'R', 'B', 'L'].map((side) => (
            <div key={side} className="flex flex-col items-center gap-0.5">
              <span className="font-mono text-[9px] text-mute">{side}</span>
              <input
                className="h-6 w-10 bg-page border border-line rounded-sm px-1 text-center font-mono text-xs text-main"
                defaultValue="0"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Margin */}
      <div className="flex flex-col gap-1">
        <SectionLabel>Margin</SectionLabel>
        <div className="flex gap-1">
          {['T', 'R', 'B', 'L'].map((side) => (
            <div key={side} className="flex flex-col items-center gap-0.5">
              <span className="font-mono text-[9px] text-mute">{side}</span>
              <input
                className="h-6 w-10 bg-page border border-line rounded-sm px-1 text-center font-mono text-xs text-main"
                defaultValue="0"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Gap */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <SectionLabel>Gap</SectionLabel>
          <span className="font-mono text-xs text-mute">{gap}px</span>
        </div>
        <Slider size="sm" min={0} max={64} value={gap} onChange={setGap} />
      </div>
    </div>
  );
}

/* ─── Main Panel ─── */
export function InterfaceKitFullPanelShell() {
  const [activeTab, setActiveTab] = useState<Tab>('style');
  const [twEnabled, setTwEnabled] = useState(true);

  const tabs: Tab[] = ['style', 'typography', 'layout'];

  return (
    <div className="flex w-full flex-col bg-card pixel-rounded-sm border border-line overflow-hidden" style={{ maxHeight: 520 }}>
      {/* Header bar */}
      <div className="flex items-center gap-2 bg-card border-b border-line px-3 py-2">
        <Badge size="sm">div.card-wrapper</Badge>
        <div className="flex-1" />
        <Button
          mode="flat"
          size="sm"
          compact
          active={twEnabled}
          onClick={() => setTwEnabled(!twEnabled)}
        >
          TW
        </Button>
        <Button mode="flat" size="sm" compact>
          Copy
        </Button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-rule px-3">
        {tabs.map((tab) => (
          <Button
            key={tab}
            mode="flat"
            size="sm"
            className={`!rounded-none font-heading text-xs uppercase ${
              activeTab === tab
                ? 'border-b-2 border-accent text-accent'
                : 'text-mute'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* Tab content */}
      <ScrollArea className="flex-1">
        {activeTab === 'style' && <StyleTab />}
        {activeTab === 'typography' && <TypographyTab />}
        {activeTab === 'layout' && <LayoutTab />}
      </ScrollArea>
    </div>
  );
}
