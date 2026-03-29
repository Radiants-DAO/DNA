'use client';

import { useState } from 'react';
import { Button, Input } from '@rdna/radiants/components/core';

const RECENT = ['#f5c542', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#1abc9c'];
const MODES = ['hex', 'rgb', 'hsl', 'oklch'] as const;

export function ColorPickerShell() {
  const [hex, setHex] = useState('#f5c542');
  const [mode, setMode] = useState<(typeof MODES)[number]>('hex');
  const [hue, setHue] = useState(43);
  const [alpha, setAlpha] = useState(100);
  const [slPos, setSlPos] = useState({ x: 70, y: 30 });

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Section label */}
      <span className="font-heading text-xs uppercase tracking-wide text-mute">
        Color
      </span>

      {/* SL gradient area */}
      <div
        className="relative h-28 pixel-rounded-sm cursor-crosshair overflow-hidden"
        // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:hue-saturation-lightness-gradient owner:design-system expires:2027-01-01 issue:DNA-999
        style={{
          background: `
            linear-gradient(to bottom, transparent, black),
            linear-gradient(to right, white, hsl(${hue}, 100%, 50%))
          `,
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setSlPos({
            x: Math.round(((e.clientX - rect.left) / rect.width) * 100),
            y: Math.round(((e.clientY - rect.top) / rect.height) * 100),
          });
        }}
      >
        <div
          className="absolute w-3 h-3 border-2 border-accent rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${slPos.x}%`, top: `${slPos.y}%` }}
        />
      </div>

      {/* Hue bar */}
      <div
        className="relative h-2 pixel-rounded-sm cursor-pointer"
        // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:hue-rainbow-spectrum owner:design-system expires:2027-01-01 issue:DNA-999
        style={{
          background:
            'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setHue(Math.round(((e.clientX - rect.left) / rect.width) * 360));
        }}
      >
        <div
          className="absolute top-1/2 w-2.5 h-2.5 bg-page border border-line rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${(hue / 360) * 100}%` }}
        />
      </div>

      {/* Alpha bar */}
      <div className="relative h-2 pixel-rounded-sm cursor-pointer overflow-hidden">
        {/* Checkerboard */}
        <div
          className="absolute inset-0"
          // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:checkerboard-transparency-pattern owner:design-system expires:2027-01-01 issue:DNA-999
          style={{
            backgroundImage:
              'conic-gradient(#ccc 25%, transparent 25%, transparent 50%, #ccc 50%, #ccc 75%, transparent 75%)',
            backgroundSize: '6px 6px',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, transparent, ${hex})`,
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setAlpha(Math.round(((e.clientX - rect.left) / rect.width) * 100));
          }}
        />
        <div
          className="absolute top-1/2 w-2.5 h-2.5 bg-page border border-line rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${alpha}%` }}
        />
      </div>

      {/* Value row */}
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 pixel-rounded-sm border border-line shrink-0"
          style={{ backgroundColor: hex }}
        />
        <Input
          size="sm"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          className="font-mono text-xs flex-1"
        />
        <div className="flex gap-0.5">
          {MODES.map((m) => (
            <Button
              key={m}
              mode="flat"
              size="sm"
              compact
              active={mode === m}
              onClick={() => setMode(m)}
            >
              {m}
            </Button>
          ))}
        </div>
      </div>

      {/* Recent colors */}
      <div className="flex flex-col gap-1.5">
        <span className="font-heading text-xs uppercase tracking-wide text-mute">
          Recent
        </span>
        <div className="flex gap-1.5">
          {RECENT.map((c) => (
            <button
              key={c}
              className="w-3 h-3 rounded-full border border-line cursor-pointer transition-transform hover:scale-125"
              style={{ backgroundColor: c }}
              onClick={() => setHex(c)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
