'use client';

import { useState } from 'react';
import { Button, Badge, Switch, Slider } from '@rdna/radiants/components/core';

const STYLES = ['none', 'solid', 'dashed', 'dotted'] as const;
const UNITS = ['px', 'rem', '%'] as const;
const OUTLINE_STYLES = ['none', 'solid', 'dashed', 'dotted'] as const;

export function BorderRadiusShell() {
  const [linked, setLinked] = useState(true);
  const [radii, setRadii] = useState([8, 8, 8, 8]);
  const [style, setStyle] = useState<(typeof STYLES)[number]>('solid');
  const [unit, setUnit] = useState<(typeof UNITS)[number]>('px');
  const [borderWidth, setBorderWidth] = useState(1);
  const [borderColor, setBorderColor] = useState('#9ca3af');
  const [outlineStyle, setOutlineStyle] = useState<(typeof OUTLINE_STYLES)[number]>('none');
  const [outlineWidth, setOutlineWidth] = useState(0);
  const [outlineOffset, setOutlineOffset] = useState(2);

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
        Border
      </span>

      {/* Preview */}
      <div className="flex justify-center py-3">
        <div className="relative">
          <div
            className="w-28 h-20 bg-card"
            style={{
              borderRadius: radiusStr,
              border: style === 'none' ? '1px solid var(--color-line)' : `${borderWidth}px ${style} ${borderColor}`,
              outline: outlineWidth > 0 ? `${outlineWidth}px ${outlineStyle} var(--color-accent)` : 'none',
              outlineOffset: `${outlineOffset}px`,
            }}
          />
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

      {/* Radius link + unit */}
      <div className="flex items-center justify-between">
        <Switch size="sm" checked={linked} onChange={setLinked} label="Link" />
        <div className="flex gap-1">
          {UNITS.map((u) => (
            <Badge key={u} variant={unit === u ? 'success' : 'default'} size="sm">
              <button className="cursor-pointer font-mono" onClick={() => setUnit(u)}>
                {u}
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Border style */}
      <div className="flex flex-col gap-1.5">
        <span className="font-heading text-xs uppercase tracking-wide text-mute">Style</span>
        <div className="flex gap-1">
          {STYLES.map((s) => (
            <Button key={s} mode="flat" size="sm" compact active={style === s} onClick={() => setStyle(s)}>
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Border width */}
      <div className="flex flex-col gap-1">
        <span className="font-heading text-xs uppercase tracking-wide text-mute">Width</span>
        <Slider size="sm" value={borderWidth} onChange={setBorderWidth} min={0} max={8} step={1} showValue />
      </div>

      {/* Border color */}
      <div className="flex flex-col gap-1.5">
        <span className="font-heading text-xs uppercase tracking-wide text-mute">Color</span>
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:editable-color-swatch owner:design-system expires:2027-01-01 issue:DNA-999 */}
          <div className="w-5 h-5 pixel-rounded-sm border border-line shrink-0" style={{ backgroundColor: borderColor }} />
          <input
            className="flex-1 bg-transparent font-mono text-xs text-mute outline-none focus:text-main transition-colors border-b border-rule pb-0.5"
            value={borderColor}
            onChange={(e) => setBorderColor(e.target.value)}
          />
        </div>
      </div>

      {/* Outline section */}
      <div className="border-t border-rule pt-2 flex flex-col gap-2">
        <span className="font-heading text-xs uppercase tracking-wide text-mute">Outline</span>

        <div className="flex gap-1">
          {OUTLINE_STYLES.map((s) => (
            <Button key={s} mode="flat" size="sm" compact active={outlineStyle === s} onClick={() => setOutlineStyle(s)}>
              {s}
            </Button>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs text-mute">width</span>
          <Slider size="sm" value={outlineWidth} onChange={setOutlineWidth} min={0} max={6} step={1} showValue />
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs text-mute">offset</span>
          <Slider size="sm" value={outlineOffset} onChange={setOutlineOffset} min={0} max={8} step={1} showValue />
        </div>
      </div>
    </div>
  );
}
