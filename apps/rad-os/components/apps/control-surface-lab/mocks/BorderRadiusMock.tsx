/* eslint-disable */
'use client';

import { useState } from 'react';

export function BorderRadiusMock() {
  const [linked, setLinked] = useState(true);
  const [borderStyle, setBorderStyle] = useState<string>('solid');
  const [unit, setUnit] = useState<'px' | 'rem' | '%'>('px');
  const [radii, setRadii] = useState({ tl: 8, tr: 8, bl: 8, br: 8 });
  const [borderWidth, setBorderWidth] = useState(1);
  const [borderColor, setBorderColor] = useState('#9ca3af');
  const [outlineWidth, setOutlineWidth] = useState(0);
  const [outlineColor, setOutlineColor] = useState('#3b82f6');
  const [outlineStyle, setOutlineStyle] = useState<string>('solid');
  const [outlineOffset, setOutlineOffset] = useState(2);

  const setRadius = (corner: keyof typeof radii, value: number) => {
    if (linked) {
      setRadii({ tl: value, tr: value, bl: value, br: value });
    } else {
      setRadii((prev) => ({ ...prev, [corner]: value }));
    }
  };

  const radiusValue = `${radii.tl}${unit} ${radii.tr}${unit} ${radii.br}${unit} ${radii.bl}${unit}`;

  const styles: string[] = ['none', 'solid', 'dashed', 'dotted', 'double'];
  const units: ('px' | 'rem' | '%')[] = ['px', 'rem', '%'];

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Preview with corner inputs */}
      <div className="relative mx-auto flex h-24 w-32 items-center justify-center">
        <div
          className="h-full w-full"
          style={{
            borderRadius: radiusValue,
            border: borderStyle === 'none' ? '1px solid #e5e7eb' : `${borderWidth}px ${borderStyle} ${borderColor}`,
            outline: outlineWidth > 0 ? `${outlineWidth}px ${outlineStyle} ${outlineColor}` : 'none',
            outlineOffset: `${outlineOffset}px`,
            background: '#fafafa',
          }}
        />
        {([
          { key: 'tl' as const, pos: '-top-1 -left-1' },
          { key: 'tr' as const, pos: '-top-1 -right-1' },
          { key: 'bl' as const, pos: '-bottom-1 -left-1' },
          { key: 'br' as const, pos: '-bottom-1 -right-1' },
        ]).map(({ key, pos }) => (
          <input
            key={key}
            type="number"
            className={`absolute ${pos} h-5 w-12 rounded border border-gray-300 bg-white px-1 text-center font-mono text-xs text-gray-600`}
            value={radii[key]}
            onChange={(e) => setRadius(key, Number(e.target.value))}
          />
        ))}
        <button
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm"
          onClick={() => setLinked(!linked)}
        >
          {linked ? '🔗' : '🔓'}
        </button>
      </div>

      {/* Radius unit selector */}
      <div className="flex items-center justify-center gap-1">
        {units.map((u) => (
          <button
            key={u}
            className={`rounded-full px-3 py-0.5 font-mono text-xs ${
              unit === u ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            onClick={() => setUnit(u)}
          >
            {u}
          </button>
        ))}
      </div>

      {/* Border style */}
      <div className="flex flex-col gap-1">
        <span className="font-sans text-[10px] uppercase tracking-wide text-gray-400">Border Style</span>
        <div className="flex items-center gap-1">
          {styles.map((s) => (
            <button
              key={s}
              className={`rounded px-2 py-1 font-sans text-[10px] capitalize ${
                borderStyle === s ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              onClick={() => setBorderStyle(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Border width + color row */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-1 flex-1">
          <span className="font-sans text-[10px] uppercase tracking-wide text-gray-400">Width</span>
          <div className="flex items-center gap-1">
            <input
              type="range"
              min="0"
              max="8"
              value={borderWidth}
              onChange={(e) => setBorderWidth(Number(e.target.value))}
              className="flex-1 h-1 accent-blue-500"
            />
            <span className="w-8 text-right font-mono text-xs text-gray-600">{borderWidth}px</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-sans text-[10px] uppercase tracking-wide text-gray-400">Color</span>
          <div className="flex items-center gap-1">
            <div
              className="h-6 w-6 rounded border border-gray-300 cursor-pointer"
              style={{ backgroundColor: borderColor }}
            />
            <input
              className="h-6 w-16 rounded border border-gray-200 bg-white px-1 font-mono text-xs text-gray-600"
              value={borderColor}
              onChange={(e) => setBorderColor(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Outline section */}
      <div className="border-t border-gray-200 pt-2">
        <span className="font-sans text-[10px] uppercase tracking-wide text-gray-400">Outline</span>
        <div className="mt-1 flex flex-col gap-2">
          {/* Outline style */}
          <div className="flex items-center gap-1">
            {['none', 'solid', 'dashed', 'dotted'].map((s) => (
              <button
                key={s}
                className={`rounded px-1.5 py-0.5 font-sans text-[10px] capitalize ${
                  outlineStyle === s ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                onClick={() => setOutlineStyle(s)}
              >
                {s}
              </button>
            ))}
          </div>
          {/* Outline width + offset + color */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="font-sans text-[9px] text-gray-400">Width</span>
              <input
                type="range"
                min="0"
                max="6"
                value={outlineWidth}
                onChange={(e) => setOutlineWidth(Number(e.target.value))}
                className="h-1 accent-blue-500"
              />
            </div>
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="font-sans text-[9px] text-gray-400">Offset</span>
              <input
                type="range"
                min="0"
                max="8"
                value={outlineOffset}
                onChange={(e) => setOutlineOffset(Number(e.target.value))}
                className="h-1 accent-blue-500"
              />
            </div>
            <div
              className="h-5 w-5 rounded border border-gray-300 cursor-pointer shrink-0 mt-2.5"
              style={{ backgroundColor: outlineColor }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
