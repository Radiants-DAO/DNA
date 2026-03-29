/* eslint-disable */
'use client';

import { useState } from 'react';

export function ColorPickerMock() {
  const [hex, setHex] = useState('#f5c542');
  const [hue, setHue] = useState(43);
  const [mode, setMode] = useState<'hex' | 'rgb' | 'hsl' | 'oklch'>('hex');

  const hueColor = `hsl(${hue}, 100%, 50%)`;

  return (
    <div className="flex w-full flex-col gap-2">
      {/* SL Gradient Area */}
      <div
        className="relative h-28 w-full cursor-crosshair rounded"
        style={{
          background: `
            linear-gradient(to bottom, transparent, #000),
            linear-gradient(to right, #fff, ${hueColor})
          `,
        }}
      >
        <div
          className="pointer-events-none absolute h-3.5 w-3.5 rounded-full border-2 border-white"
          style={{
            top: '30%',
            left: '65%',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 2px rgba(0,0,0,0.6)',
          }}
        />
      </div>

      {/* Hue Bar */}
      <div className="relative h-2.5 w-full cursor-pointer rounded-full"
        style={{
          background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          setHue(Math.round(pct * 360));
        }}
      >
        <div
          className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white"
          style={{
            left: `${(hue / 360) * 100}%`,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 2px rgba(0,0,0,0.5)',
            background: hueColor,
          }}
        />
      </div>

      {/* Alpha Bar */}
      <div className="relative h-2.5 w-full cursor-pointer overflow-hidden rounded-full">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%)',
            backgroundSize: '8px 8px',
          }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(to right, transparent, ${hex})`,
          }}
        />
        <div
          className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white"
          style={{
            left: '85%',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 2px rgba(0,0,0,0.5)',
          }}
        />
      </div>

      {/* Value Row */}
      <div className="flex items-center gap-2">
        <div
          className="h-7 w-7 shrink-0 rounded"
          style={{
            backgroundColor: hex,
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.12)',
          }}
        />
        <input
          className="h-7 flex-1 rounded border border-gray-300 bg-white px-1.5 font-mono text-xs text-gray-800"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
        />
        <select
          className="h-7 rounded border border-gray-300 bg-white px-1 font-mono text-xs text-gray-600"
          value={mode}
          onChange={(e) => setMode(e.target.value as typeof mode)}
        >
          <option value="hex">HEX</option>
          <option value="rgb">RGB</option>
          <option value="hsl">HSL</option>
          <option value="oklch">OKLCH</option>
        </select>
      </div>

      {/* Recent Colors */}
      <div className="flex items-center gap-2">
        <span className="font-sans text-[10px] text-gray-400 uppercase tracking-wide">Recent</span>
        <div className="flex gap-1.5">
          {['#f5c542', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#1abc9c'].map((c) => (
            <button
              key={c}
              className="h-4 w-4 rounded-full border border-gray-200 transition-transform hover:scale-110"
              style={{ backgroundColor: c }}
              onClick={() => setHex(c)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
