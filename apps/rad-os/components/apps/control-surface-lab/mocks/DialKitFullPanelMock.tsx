/* eslint-disable */
'use client';

import { useState } from 'react';

// ============================================================================
// DialKit Full Panel Mock
//
// Replicates DialKit's popover-style panel language: dark chrome, 280px concept,
// compact information-dense controls. Every control type in one scrollable panel.
// ============================================================================

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="3.5" y="3.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1" />
      <path d="M8.5 3.5V2.5C8.5 1.95 8.05 1.5 7.5 1.5H2.5C1.95 1.5 1.5 1.95 1.5 2.5V7.5C1.5 8.05 1.95 8.5 2.5 8.5H3.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3 6H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}

function SliderRow({ label, value, min, max, step = 1, onChange }: SliderRowProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="font-sans text-xs text-gray-400 lowercase">{label}</span>
        <span className="font-mono text-xs text-gray-200 tabular-nums">{value}</span>
      </div>
      <div className="relative h-1 w-full rounded-full bg-gray-700">
        <div className="absolute left-0 top-0 h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full cursor-pointer opacity-0"
        />
        <div
          className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white"
          style={{ left: `calc(${pct}% - 6px)` }}
        />
      </div>
    </div>
  );
}

export function DialKitFullPanelMock() {
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
    <div className="flex w-full flex-col overflow-hidden rounded-lg bg-[#1a1a1a] text-gray-200 shadow-2xl">
      {/* ---- Panel header ---- */}
      <div className="flex items-center justify-between rounded-t-lg bg-[#1a1a1a] px-3 py-2">
        <span className="font-sans text-xs font-medium text-gray-300">Photo Stack</span>
        <button className="text-gray-500 hover:text-gray-300">
          <CollapseIcon />
        </button>
      </div>

      {/* ---- Toolbar row ---- */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-[#222] px-3 py-1.5">
        <select
          className="border-none bg-transparent font-mono text-xs text-gray-400 outline-none"
          defaultValue="v1"
        >
          <option value="v1">Version 1 ▾</option>
          <option value="v2">Version 2 ▾</option>
        </select>
        <button className="text-gray-500 hover:text-gray-300">
          <CopyIcon />
        </button>
      </div>

      {/* ---- Controls body ---- */}
      <div className="flex flex-col gap-3 overflow-y-auto p-3" style={{ maxHeight: 480 }}>

        {/* a. Text input — title */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-sans text-xs text-gray-400 lowercase">title</span>
          <input
            className="h-6 w-28 rounded border border-gray-600 bg-[#333] px-2 font-mono text-xs text-gray-200 outline-none focus:border-gray-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* b. Text input — subtitle */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-sans text-xs text-gray-400 lowercase">subtitle</span>
          <input
            className="h-6 w-28 rounded border border-gray-600 bg-[#333] px-2 font-mono text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-gray-500"
            placeholder="Enter subtitle..."
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
        </div>

        {/* c. Color picker — accentColor */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-sans text-xs text-gray-400 lowercase">accentColor</span>
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded border border-gray-600" style={{ backgroundColor: accentColor }} />
            <input
              className="h-6 w-16 rounded border border-gray-600 bg-[#333] px-1.5 font-mono text-xs text-gray-200 outline-none focus:border-gray-500"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
            />
          </div>
        </div>

        {/* d. Color picker — shadowTint */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-sans text-xs text-gray-400 lowercase">shadowTint</span>
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded border border-gray-600" style={{ backgroundColor: shadowTint }} />
            <input
              className="h-6 w-16 rounded border border-gray-600 bg-[#333] px-1.5 font-mono text-xs text-gray-200 outline-none focus:border-gray-500"
              value={shadowTint}
              onChange={(e) => setShadowTint(e.target.value)}
            />
          </div>
        </div>

        {/* e. Select dropdown — layout */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-sans text-xs text-gray-400 lowercase">layout</span>
          <select
            className="h-6 rounded border border-gray-600 bg-[#333] px-2 font-mono text-xs text-gray-200 outline-none"
            value={layout}
            onChange={(e) => setLayout(e.target.value)}
          >
            <option value="stack">stack</option>
            <option value="fan">fan</option>
            <option value="grid">grid</option>
          </select>
        </div>

        {/* f. Folder — backPhoto */}
        <div className="flex flex-col">
          <button
            className="flex items-center justify-between py-1 text-gray-400 hover:text-gray-300"
            onClick={() => setBackPhotoOpen(!backPhotoOpen)}
          >
            <span className="font-sans text-xs lowercase">backPhoto</span>
            <ChevronIcon open={backPhotoOpen} />
          </button>
          {backPhotoOpen && (
            <div className="mt-1 flex flex-col gap-2 border-l border-gray-700 pl-3">
              <SliderRow label="offsetX" value={offsetX} min={0} max={400} onChange={setOffsetX} />
              <SliderRow label="offsetY" value={offsetY} min={0} max={150} onChange={setOffsetY} />
              <SliderRow label="scale" value={scale} min={0.5} max={0.95} step={0.01} onChange={setScale} />
              <SliderRow label="overlayOpacity" value={overlayOpacity} min={0} max={1} step={0.01} onChange={setOverlayOpacity} />
            </div>
          )}
        </div>

        {/* g. Spring editor — transitionSpring */}
        <div className="flex flex-col">
          <button
            className="flex items-center justify-between py-1 text-gray-400 hover:text-gray-300"
            onClick={() => setSpringOpen(!springOpen)}
          >
            <span className="font-sans text-xs lowercase">transitionSpring</span>
            <ChevronIcon open={springOpen} />
          </button>
          {springOpen && (
            <div className="mt-1 flex flex-col gap-2 border-l border-gray-700 pl-3">
              {/* Mode toggle */}
              <div className="flex overflow-hidden rounded bg-[#333]">
                {(['time', 'physics'] as const).map((m) => (
                  <button
                    key={m}
                    className={`flex-1 px-3 py-1 font-mono text-xs capitalize ${
                      springMode === m
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                    onClick={() => setSpringMode(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Curve preview */}
              <div className="flex h-12 items-center justify-center rounded bg-[#222]">
                <svg width="100%" height="100%" viewBox="0 0 160 40" preserveAspectRatio="none">
                  <path
                    d="M8 32 C40 32, 50 8, 80 8 C110 8, 120 14, 152 10"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <line x1="8" y1="32" x2="8" y2="8" stroke="#444" strokeWidth="0.5" />
                  <line x1="8" y1="32" x2="152" y2="32" stroke="#444" strokeWidth="0.5" />
                </svg>
              </div>

              <SliderRow label="visualDuration" value={visDuration} min={0.1} max={1} step={0.01} onChange={setVisDuration} />
              <SliderRow label="bounce" value={bounce} min={0} max={1} step={0.01} onChange={setBounce} />
            </div>
          )}
        </div>

        {/* h. Toggle — darkMode */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-sans text-xs text-gray-400 lowercase">darkMode</span>
          <div className="flex overflow-hidden rounded bg-[#333]">
            {(['Off', 'On'] as const).map((opt) => {
              const isActive = (opt === 'On') === darkMode;
              return (
                <button
                  key={opt}
                  className={`px-3 py-1 font-mono text-xs ${
                    isActive ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}
                  onClick={() => setDarkMode(opt === 'On')}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* i. Action buttons */}
        <div className="flex flex-col gap-1.5">
          <button className="w-full rounded border border-gray-600 px-3 py-1.5 font-sans text-xs text-gray-300 hover:bg-gray-800">
            Next
          </button>
          <button className="w-full rounded border border-gray-600 px-3 py-1.5 font-sans text-xs text-gray-300 hover:bg-gray-800">
            Previous
          </button>
        </div>
      </div>
    </div>
  );
}
