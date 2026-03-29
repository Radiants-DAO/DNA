'use client';

import { useState } from 'react';
import { Button, Badge, Switch } from '@rdna/radiants/components/core';

const STYLES = ['none', 'solid', 'dashed'] as const;
const UNITS = ['px', 'rem', '%'] as const;

export function BorderRadiusShell() {
  const [linked, setLinked] = useState(true);
  const [radii, setRadii] = useState([8, 8, 8, 8]);
  const [style, setStyle] = useState<(typeof STYLES)[number]>('solid');
  const [unit, setUnit] = useState<(typeof UNITS)[number]>('px');

  const updateRadius = (idx: number, val: string) => {
    const num = parseInt(val) || 0;
    if (linked) {
      setRadii([num, num, num, num]);
    } else {
      setRadii((prev) => prev.map((v, i) => (i === idx ? num : v)));
    }
  };

  const radiusStr = radii.map((r) => `${r}${unit}`).join(' ');

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Section label */}
      <span className="font-heading text-xs uppercase tracking-wide text-mute">
        Radius
      </span>

      {/* Preview */}
      <div className="flex justify-center py-3">
        <div className="relative">
          <div
            className="w-28 h-20 bg-card border border-line"
            style={{
              borderRadius: radiusStr,
              borderStyle: style === 'none' ? 'solid' : style,
            }}
          />
          {/* Corner values */}
          {[
            { pos: '-top-4 -left-1', idx: 0 },
            { pos: '-top-4 -right-1', idx: 1 },
            { pos: '-bottom-4 -right-1', idx: 2 },
            { pos: '-bottom-4 -left-1', idx: 3 },
          ].map(({ pos, idx }) => (
            <input
              key={idx}
              className={`absolute ${pos} w-6 bg-transparent font-mono text-xs text-mute text-center outline-none focus:text-main transition-colors`}
              value={radii[idx]}
              onChange={(e) => updateRadius(idx, e.target.value)}
            />
          ))}
        </div>
      </div>

      {/* Link toggle */}
      <Switch
        size="sm"
        checked={linked}
        onChange={setLinked}
        label="Link"
      />

      {/* Border style */}
      <div className="flex flex-col gap-1.5">
        <span className="font-heading text-xs uppercase tracking-wide text-mute">
          Border
        </span>
        <div className="flex gap-1">
          {STYLES.map((s) => (
            <Button
              key={s}
              mode="flat"
              size="sm"
              compact
              active={style === s}
              onClick={() => setStyle(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Unit pills */}
      <div className="flex flex-col gap-1.5">
        <span className="font-heading text-xs uppercase tracking-wide text-mute">
          Unit
        </span>
        <div className="flex gap-1">
          {UNITS.map((u) => (
            <Badge
              key={u}
              variant={unit === u ? 'success' : 'default'}
              size="sm"
            >
              <button
                className="cursor-pointer font-mono"
                onClick={() => setUnit(u)}
              >
                {u}
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
