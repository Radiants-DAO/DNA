/* eslint-disable */
'use client';

import { useState } from 'react';

type Tab = 'style' | 'typography' | 'layout';
type BorderStyle = 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
type ShadowPreset = 'none' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type FontStyle = 'normal' | 'italic';
type Alignment = 'L' | 'C' | 'R' | 'J';
type FlexDir = '→' | '↓' | '←' | '↑';

function MiniSlider({ min, max, step = 1, value, onChange, label, suffix = '' }: {
  min: number; max: number; step?: number; value: number;
  onChange: (v: number) => void; label: string; suffix?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="font-sans text-[11px] text-gray-500 uppercase tracking-wide">{label}</span>
        <span className="font-mono text-[11px] text-gray-600">{value}{suffix}</span>
      </div>
      <div className="relative h-1 w-full rounded-full bg-gray-200">
        <div
          className="absolute left-0 top-0 h-1 rounded-full bg-blue-500"
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-1 w-full cursor-pointer opacity-0"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border border-gray-300 bg-white shadow-sm pointer-events-none"
          style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 6px)` }}
        />
      </div>
    </label>
  );
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      className="w-6 h-6 rounded border border-gray-200 shrink-0"
      style={{ backgroundColor: color }}
    />
  );
}

function PillButton({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      className={`rounded px-2 py-1 font-sans text-[11px] transition-colors ${
        active
          ? 'bg-blue-50 border border-blue-300 text-blue-600'
          : 'bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
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
        <span className="font-sans text-[11px] text-gray-500 uppercase tracking-wide">Background</span>
        <div className="flex items-center gap-2">
          <Swatch color="rgba(255,255,255,1)" />
          <input className="h-6 flex-1 rounded border border-gray-200 bg-gray-50 px-2 font-mono text-xs text-gray-700" defaultValue="rgba(255, 255, 255, 1)" />
        </div>
      </div>

      {/* Border */}
      <div className="flex flex-col gap-2">
        <span className="font-sans text-[11px] text-gray-500 uppercase tracking-wide">Border</span>
        <div className="flex gap-1">
          {borderSymbols.map(({ s, label }) => (
            <PillButton key={s} active={borderStyle === s} onClick={() => setBorderStyle(s)}>{label}</PillButton>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Swatch color="#d1d5db" />
          <input className="h-6 flex-1 rounded border border-gray-200 bg-gray-50 px-2 font-mono text-xs text-gray-700" defaultValue="#d1d5db" />
        </div>
        <MiniSlider label="Width" min={0} max={8} value={borderWidth} onChange={setBorderWidth} suffix="px" />
      </div>

      {/* Radius */}
      <div className="flex flex-col gap-2">
        <span className="font-sans text-[11px] text-gray-500 uppercase tracking-wide">Radius</span>
        <div className="flex items-center gap-2">
          <div className="grid grid-cols-2 gap-1">
            {['TL', 'TR', 'BL', 'BR'].map((corner, idx) => (
              <input
                key={corner}
                type="number"
                className="h-6 w-12 rounded border border-gray-200 bg-gray-50 px-1 text-center font-mono text-xs text-gray-600"
                value={radii[idx]}
                onChange={(e) => updateRadius(idx, Number(e.target.value))}
              />
            ))}
          </div>
          <button
            className={`text-sm ${linked ? 'text-blue-500' : 'text-gray-400'}`}
            onClick={() => setLinked(!linked)}
          >
            {linked ? '🔗' : '🔓'}
          </button>
        </div>
      </div>

      {/* Shadow */}
      <div className="flex flex-col gap-1.5">
        <span className="font-sans text-[11px] text-gray-500 uppercase tracking-wide">Shadow</span>
        <div className="flex flex-wrap gap-1">
          {shadowPresets.map((p) => (
            <PillButton key={p} active={shadow === p} onClick={() => setShadow(p)}>{p}</PillButton>
          ))}
        </div>
      </div>

      {/* Backdrop Blur */}
      <MiniSlider label="Backdrop Blur" min={0} max={20} value={blur} onChange={setBlur} suffix="px" />

      {/* Opacity */}
      <MiniSlider label="Opacity" min={0} max={100} value={opacity} onChange={setOpacity} suffix="%" />
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
      {/* Font family */}
      <div className="flex flex-col gap-1">
        <span className="font-sans text-[11px] text-gray-500 uppercase tracking-wide">Font Family</span>
        <select className="h-7 rounded border border-gray-200 bg-gray-50 px-2 font-sans text-xs text-gray-700">
          <option>Inter</option><option>Roboto</option><option>System UI</option>
        </select>
      </div>

      <MiniSlider label="Size" min={8} max={72} value={fontSize} onChange={setFontSize} suffix="px" />
      <MiniSlider label="Weight" min={100} max={900} step={100} value={fontWeight} onChange={setFontWeight} />
      <MiniSlider label="Line Height" min={0.5} max={3} step={0.1} value={lineHeight} onChange={setLineHeight} />
      <MiniSlider label="Letter Spacing" min={-2} max={4} step={0.1} value={letterSpacing} onChange={setLetterSpacing} suffix="em" />

      {/* Style */}
      <div className="flex flex-col gap-1">
        <span className="font-sans text-[11px] text-gray-500 uppercase tracking-wide">Style</span>
        <div className="flex gap-1">
          {(['normal', 'italic'] as FontStyle[]).map((s) => (
            <PillButton key={s} active={fontStyle === s} onClick={() => setFontStyle(s)}>
              {s === 'italic' ? <em>{s}</em> : s}
            </PillButton>
          ))}
        </div>
      </div>

      {/* Alignment */}
      <div className="flex flex-col gap-1">
        <span className="font-sans text-[11px] text-gray-500 uppercase tracking-wide">Alignment</span>
        <div className="flex gap-1">
          {(['L', 'C', 'R', 'J'] as Alignment[]).map((a) => (
            <PillButton key={a} active={alignment === a} onClick={() => setAlignment(a)}>{a}</PillButton>
          ))}
        </div>
      </div>

      {/* Color */}
      <div className="flex flex-col gap-1">
        <span className="font-sans text-[11px] text-gray-500 uppercase tracking-wide">Color</span>
        <div className="flex items-center gap-2">
          <Swatch color="#1a1a1a" />
          <input className="h-6 flex-1 rounded border border-gray-200 bg-gray-50 px-2 font-mono text-xs text-gray-700" defaultValue="#1a1a1a" />
        </div>
      </div>
    </div>
  );
}

/* ─── Layout Tab ─── */
function LayoutTab() {
  const [flexDir, setFlexDir] = useState<FlexDir>('→');
  const [alignPos, setAlignPos] = useState(4); // 0-8, center = 4
  const [gap, setGap] = useState(8);

  const dirs: FlexDir[] = ['→', '↓', '←', '↑'];
  const displays = ['flex', 'grid', 'block', 'inline'];
  const [display, setDisplay] = useState('flex');

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Dimensions */}
      <div className="flex flex-col gap-1">
        <span className="font-sans text-[11px] text-gray-500 uppercase tracking-wide">Dimensions</span>
        <div className="flex gap-2">
          <label className="flex items-center gap-1">
            <span className="font-mono text-[11px] text-gray-400">W</span>
            <input className="h-6 w-16 rounded border border-gray-200 bg-gray-50 px-1 font-mono text-xs text-gray-700 text-center" defaultValue="auto" />
          </label>
          <label className="flex items-center gap-1">
            <span className="font-mono text-[11px] text-gray-400">H</span>
            <input className="h-6 w-16 rounded border border-gray-200 bg-gray-50 px-1 font-mono text-xs text-gray-700 text-center" defaultValue="auto" />
          </label>
        </div>
      </div>

      {/* Display */}
      <div className="flex flex-col gap-1">
        <span className="font-sans text-[11px] text-gray-500 uppercase tracking-wide">Display</span>
        <div className="flex gap-1">
          {displays.map((d) => (
            <PillButton key={d} active={display === d} onClick={() => setDisplay(d)}>{d}</PillButton>
          ))}
        </div>
      </div>

      {/* Direction */}
      <div className="flex flex-col gap-1">
        <span className="font-sans text-[11px] text-gray-500 uppercase tracking-wide">Direction</span>
        <div className="flex gap-1">
          {dirs.map((d) => (
            <PillButton key={d} active={flexDir === d} onClick={() => setFlexDir(d)}>{d}</PillButton>
          ))}
        </div>
      </div>

      {/* Align Grid */}
      <div className="flex flex-col gap-1">
        <span className="font-sans text-[11px] text-gray-500 uppercase tracking-wide">Align</span>
        <div className="grid grid-cols-3 gap-0.5 w-fit">
          {Array.from({ length: 9 }).map((_, i) => (
            <button
              key={i}
              className={`h-4 w-4 rounded-sm transition-colors ${
                alignPos === i
                  ? 'bg-blue-500'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
              onClick={() => setAlignPos(i)}
            />
          ))}
        </div>
      </div>

      {/* Padding */}
      <div className="flex flex-col gap-1">
        <span className="font-sans text-[11px] text-gray-500 uppercase tracking-wide">Padding</span>
        <div className="flex gap-1">
          {['T', 'R', 'B', 'L'].map((side) => (
            <label key={side} className="flex flex-col items-center gap-0.5">
              <span className="font-mono text-[9px] text-gray-400">{side}</span>
              <input className="h-6 w-10 rounded border border-gray-200 bg-gray-50 px-1 text-center font-mono text-xs text-gray-700" defaultValue="0" />
            </label>
          ))}
        </div>
      </div>

      {/* Margin */}
      <div className="flex flex-col gap-1">
        <span className="font-sans text-[11px] text-gray-500 uppercase tracking-wide">Margin</span>
        <div className="flex gap-1">
          {['T', 'R', 'B', 'L'].map((side) => (
            <label key={side} className="flex flex-col items-center gap-0.5">
              <span className="font-mono text-[9px] text-gray-400">{side}</span>
              <input className="h-6 w-10 rounded border border-gray-200 bg-gray-50 px-1 text-center font-mono text-xs text-gray-700" defaultValue="0" />
            </label>
          ))}
        </div>
      </div>

      {/* Gap */}
      <MiniSlider label="Gap" min={0} max={64} value={gap} onChange={setGap} suffix="px" />
    </div>
  );
}

/* ─── Main Panel ─── */
export function InterfaceKitFullPanelMock() {
  const [activeTab, setActiveTab] = useState<Tab>('style');
  const [twEnabled, setTwEnabled] = useState(true);

  const tabs: Tab[] = ['style', 'typography', 'layout'];

  return (
    <div className="flex w-full flex-col bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ maxHeight: 520 }}>
      {/* Header bar */}
      <div className="flex items-center gap-2 bg-white border-b border-gray-200 px-3 py-2">
        <span className="bg-gray-100 rounded-full px-2 py-0.5 font-mono text-xs text-gray-600">
          div.card-wrapper
        </span>
        <div className="flex-1" />
        <button
          className={`rounded-full px-2.5 py-0.5 font-sans text-[11px] font-medium transition-colors ${
            twEnabled
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-500'
          }`}
          onClick={() => setTwEnabled(!twEnabled)}
        >
          TW
        </button>
        <button className="h-6 w-6 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 text-sm">
          📋
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex bg-white border-b border-gray-200 px-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`px-3 py-2 font-sans text-xs capitalize transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-gray-900 font-medium'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'style' && <StyleTab />}
        {activeTab === 'typography' && <TypographyTab />}
        {activeTab === 'layout' && <LayoutTab />}
      </div>
    </div>
  );
}
