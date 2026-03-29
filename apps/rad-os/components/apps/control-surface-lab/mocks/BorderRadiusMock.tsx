/* eslint-disable */
'use client';

import { useState } from 'react';

export function BorderRadiusMock() {
  const [linked, setLinked] = useState(true);
  const [borderStyle, setBorderStyle] = useState<string>('solid');
  const [unit, setUnit] = useState<'px' | 'rem' | '%'>('px');
  const [radii, setRadii] = useState({ tl: 8, tr: 8, bl: 8, br: 8 });

  const setRadius = (corner: keyof typeof radii, value: number) => {
    if (linked) {
      setRadii({ tl: value, tr: value, bl: value, br: value });
    } else {
      setRadii((prev) => ({ ...prev, [corner]: value }));
    }
  };

  const radiusValue = `${radii.tl}${unit} ${radii.tr}${unit} ${radii.br}${unit} ${radii.bl}${unit}`;

  const styles: ('none' | 'solid' | 'dashed' | 'dotted' | 'double')[] = [
    'none', 'solid', 'dashed', 'dotted', 'double',
  ];

  const units: ('px' | 'rem' | '%')[] = ['px', 'rem', '%'];

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Preview with corner inputs */}
      <div className="relative mx-auto flex h-24 w-32 items-center justify-center">
        <div
          className="h-full w-full bg-gray-50"
          style={{
            borderRadius: radiusValue,
            border: borderStyle === 'none' ? '1px solid #e5e7eb' : `2px ${borderStyle} #9ca3af`,
          }}
        />

        {/* Corner inputs */}
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

        {/* Center link toggle */}
        <button
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm"
          onClick={() => setLinked(!linked)}
          title={linked ? 'Unlink corners' : 'Link corners'}
        >
          {linked ? '🔗' : '🔓'}
        </button>
      </div>

      {/* Border Style Row */}
      <div className="flex items-center justify-center gap-1">
        {styles.map((s) => (
          <button
            key={s}
            className={`rounded px-2 py-1 font-sans text-[10px] capitalize ${
              borderStyle === s
                ? 'bg-gray-700 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            onClick={() => setBorderStyle(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Unit Selector Row */}
      <div className="flex items-center justify-center gap-1">
        {units.map((u) => (
          <button
            key={u}
            className={`rounded-full px-3 py-0.5 font-mono text-xs ${
              unit === u
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            onClick={() => setUnit(u)}
          >
            {u}
          </button>
        ))}
      </div>
    </div>
  );
}
