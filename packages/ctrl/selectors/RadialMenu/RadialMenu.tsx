'use client';

import type { ReactNode } from 'react';
import type { ControlSize } from '../../primitives/types';

// =============================================================================
// RadialMenu — SVG pie segments for selection
// =============================================================================

interface RadialMenuOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface RadialMenuProps {
  value: string;
  onChange: (value: string) => void;
  options: RadialMenuOption[];
  label?: string;
  disabled?: boolean;
  size?: ControlSize;
  /** Override diameter in px — takes precedence over `size` */
  diameter?: number;
  /** Show center dot (default true) */
  showCenter?: boolean;
  /** Show crosshair lines through center — useful for 4-way compact layout (default false) */
  showCrosshair?: boolean;
  className?: string;
}

const dimMap: Record<ControlSize, number> = { sm: 72, md: 120, lg: 200 };

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

export function RadialMenu({
  value,
  onChange,
  options,
  label,
  disabled = false,
  size = 'md',
  diameter,
  showCenter = true,
  showCrosshair = false,
  className = '',
}: RadialMenuProps) {
  const dim = diameter ?? dimMap[size];
  // Outer padding to make room for labels outside the circle
  const labelMargin = dim * 0.3;
  const svgSize = dim + labelMargin * 2;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const r = dim / 2 - 2;
  const sliceAngle = 360 / options.length;

  const baseFontSize = dim * 0.11;
  const activeFontSize = baseFontSize * 1.4;
  const centerR = Math.max(3, dim * 0.025);
  const dashedR = r * 0.6;

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
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        role="radiogroup"
      >
        {/* ── Sectors ── */}
        {options.map((opt, i) => {
          const startAngle = i * sliceAngle;
          const endAngle = startAngle + sliceAngle;
          const isActive = opt.value === value;

          return (
            <path
              key={opt.value}
              d={sectorPath(cx, cy, r, startAngle, endAngle)}
              fill={isActive ? 'oklch(1 0 0 / 0.08)' : 'var(--color-ctrl-cell-bg)'}
              stroke="var(--color-ctrl-border-inactive)"
              strokeWidth={1}
              className="cursor-pointer outline-none transition-colors duration-fast"
              onClick={() => !disabled && onChange(opt.value)}
            />
          );
        })}

        {/* ── Outer circle stroke ── */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--color-ctrl-border-inactive)"
          strokeWidth={1}
        />

        {/* ── Inner dashed circle at 60% radius ── */}
        <circle
          cx={cx}
          cy={cy}
          r={dashedR}
          fill="none"
          stroke="var(--color-ctrl-border-inactive)"
          strokeWidth={0.5}
          strokeDasharray={`${dashedR * 0.15} ${dashedR * 0.1}`}
          opacity={0.5}
        />

        {/* ── Divider lines from center to edge ── */}
        {options.map((_, i) => {
          const angle = i * sliceAngle;
          const edge = polarToXY(cx, cy, r, angle);
          return (
            <line
              key={`div-${i}`}
              x1={cx}
              y1={cy}
              x2={edge.x}
              y2={edge.y}
              stroke="var(--color-ctrl-border-inactive)"
              strokeWidth={0.5}
              opacity={0.25}
            />
          );
        })}

        {/* ── Crosshair lines (optional, for compact 4-way) ── */}
        {showCrosshair && (
          <>
            <line x1={cx - r} y1={cy} x2={cx + r} y2={cy}
              stroke="var(--color-ctrl-border-inactive)" strokeWidth={0.5} opacity={0.4} />
            <line x1={cx} y1={cy - r} x2={cx} y2={cy + r}
              stroke="var(--color-ctrl-border-inactive)" strokeWidth={0.5} opacity={0.4} />
          </>
        )}

        {/* ── Center dot + optional rings ── */}
        {showCenter && (
          <>
            {showCrosshair && (
              <>
                <circle
                  cx={cx} cy={cy} r={centerR * 3}
                  fill="none"
                  stroke="var(--color-ctrl-border-inactive)"
                  strokeWidth={0.5}
                  opacity={0.5}
                />
                <circle
                  cx={cx} cy={cy} r={centerR * 2}
                  fill="none"
                  stroke="var(--color-ctrl-border-inactive)"
                  strokeWidth={0.5}
                  opacity={0.3}
                />
              </>
            )}
            <circle
              cx={cx}
              cy={cy}
              r={centerR}
              fill="var(--color-ctrl-thumb)"
              style={{ filter: 'drop-shadow(0 0 3px var(--color-ctrl-glow))' }}
            />
          </>
        )}

        {/* ── Labels (outside circle) + ARIA roles ── */}
        {options.map((opt, i) => {
          const startAngle = i * sliceAngle;
          const midAngle = startAngle + sliceAngle / 2;
          const isActive = opt.value === value;
          const lp = polarToXY(cx, cy, r * 1.25, midAngle);

          return (
            <g key={opt.value} role="radio" aria-checked={isActive}>
              {/* Invisible hit-area that covers the sector for accessibility */}
              <path
                d={sectorPath(cx, cy, r, startAngle, startAngle + sliceAngle)}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => !disabled && onChange(opt.value)}
              />
              <text
                x={lp.x}
                y={lp.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isActive ? 'var(--color-ctrl-text-active)' : 'var(--color-ctrl-label)'}
                fontSize={isActive ? activeFontSize : baseFontSize}
                fontWeight={isActive ? 700 : 400}
                fontFamily="var(--font-mono, monospace)"
                className="pointer-events-none uppercase"
                letterSpacing="0.05em"
                style={isActive ? { filter: 'drop-shadow(0 0 4px var(--color-ctrl-glow))' } : undefined}
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
