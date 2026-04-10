'use client';

import React from 'react';
import type { ControlSize } from '../../primitives/types';

// =============================================================================
// RadialMenu — SVG pie segments for selection
// =============================================================================

interface RadialMenuOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface RadialMenuProps {
  value: string;
  onChange: (value: string) => void;
  options: RadialMenuOption[];
  label?: string;
  disabled?: boolean;
  size?: ControlSize;
  className?: string;
}

const dimMap: Record<ControlSize, number> = { sm: 48, md: 72, lg: 96 };

function sectorPath(
  cx: number, cy: number, r: number,
  startAngle: number, endAngle: number,
): string {
  const start = polarToXY(cx, cy, r, startAngle);
  const end = polarToXY(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

function polarToXY(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function labelPos(cx: number, cy: number, r: number, midAngle: number) {
  return polarToXY(cx, cy, r * 0.6, midAngle);
}

export function RadialMenu({
  value,
  onChange,
  options,
  label,
  disabled = false,
  size = 'md',
  className = '',
}: RadialMenuProps) {
  const dim = dimMap[size];
  const cx = dim / 2;
  const cy = dim / 2;
  const r = dim / 2 - 2;
  const sliceAngle = 360 / options.length;

  return (
    <div
      data-rdna="ctrl-radial-menu"
      className={[
        'inline-flex flex-col items-center gap-1 select-none',
        disabled && 'opacity-[--ctrl-disabled-opacity] pointer-events-none',
        className,
      ].filter(Boolean).join(' ')}
    >
      {label && (
        <span className="font-mono text-ctrl-label text-[0.625rem] uppercase tracking-wider">
          {label}
        </span>
      )}

      <svg
        width={dim}
        height={dim}
        viewBox={`0 0 ${dim} ${dim}`}
        role="radiogroup"
      >
        {options.map((opt, i) => {
          const startAngle = i * sliceAngle;
          const endAngle = startAngle + sliceAngle;
          const midAngle = startAngle + sliceAngle / 2;
          const isActive = opt.value === value;
          const lp = labelPos(cx, cy, r, midAngle);

          return (
            <g key={opt.value} role="radio" aria-checked={isActive}>
              <path
                d={sectorPath(cx, cy, r, startAngle, endAngle)}
                fill={isActive ? 'var(--ctrl-fill)' : 'var(--ctrl-track)'}
                stroke="var(--ctrl-grid-line)"
                strokeWidth={1}
                className={[
                  'cursor-pointer outline-none transition-colors duration-fast',
                  !isActive && 'hover:fill-[var(--ctrl-hover)]',
                ].filter(Boolean).join(' ')}
                onClick={() => !disabled && onChange(opt.value)}
              />
              <text
                x={lp.x}
                y={lp.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isActive ? 'var(--ctrl-active)' : 'var(--ctrl-label)'}
                fontSize={dim * 0.1}
                fontFamily="var(--font-mono, monospace)"
                className="pointer-events-none"
              >
                {opt.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
