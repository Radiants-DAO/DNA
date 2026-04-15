'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { ControlSize } from '../../primitives/types';

// =============================================================================
// MatrixGrid — CSS Grid of toggle cells (step-sequencer style)
// =============================================================================

interface MatrixGridProps {
  value: boolean[][];
  onChange: (value: boolean[][]) => void;
  rows?: number;
  cols?: number;
  label?: string;
  disabled?: boolean;
  size?: ControlSize;
  className?: string;
  /** Row labels rendered on the left, e.g. ['KICK', 'SNR', 'HH', 'OH'] */
  rowLabels?: string[];
  /** CSS color per row for active cells (falls back to bg-ctrl-fill) */
  rowColors?: string[];
  /** Show 1-based step numbers below each column */
  showColumnNumbers?: boolean;
  /** Insert a wider gap every N columns (e.g. 4 for beat grouping) */
  beatGrouping?: number;
  /** Slot for header content above the grid */
  header?: ReactNode;
}

const cellPx: Record<ControlSize, number> = {
  sm: 16,
  md: 22,
  lg: 26,
};

export function MatrixGrid({
  value,
  onChange,
  cols = value[0]?.length ?? 8,
  label,
  disabled = false,
  size = 'md',
  className = '',
  rowLabels,
  rowColors,
  showColumnNumbers = false,
  beatGrouping,
  header,
}: MatrixGridProps) {
  const toggleCell = (row: number, col: number) => {
    const next = value.map((r, ri) =>
      ri === row ? r.map((c, ci) => (ci === col ? !c : c)) : r,
    );
    onChange(next);
  };

  const px = cellPx[size];

  /** Returns true when a wider beat-group gap should appear before this column */
  const isBeatBoundary = (ci: number) =>
    beatGrouping != null && ci > 0 && ci % beatGrouping === 0;

  return (
    <div
      data-rdna="ctrl-matrix-grid"
      className={[
        'inline-flex flex-col gap-1 select-none',
        disabled && 'opacity-[--ctrl-disabled-opacity] pointer-events-none',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label && (
        <span className="font-mono text-ctrl-label text-[0.625rem] uppercase tracking-wider">
          {label}
        </span>
      )}

      {header}

      {/* Main layout: optional row labels | grid */}
      <div className="inline-flex">
        {/* Row labels column */}
        {rowLabels && (
          <div
            className="flex flex-col shrink-0 pr-2"
            style={{ gap: 'var(--ctrl-cell-gap)' }}
          >
            {value.map((_, ri) => (
              <div
                key={ri}
                className="flex items-center font-mono uppercase tracking-wider"
                style={{
                  height: px,
                  fontSize: 10,
                  color: 'var(--color-ctrl-label)',
                  lineHeight: 1,
                }}
              >
                {rowLabels[ri] ?? ''}
              </div>
            ))}
          </div>
        )}

        {/* Grid + optional column numbers */}
        <div className="inline-flex flex-col">
          <div
            role="grid"
            className="inline-flex flex-col border border-ctrl-border-inactive p-px"
            style={{ gap: 'var(--ctrl-cell-gap)' }}
          >
            {value.map((row, ri) => (
              <div
                key={ri}
                className="flex"
                style={{ gap: 'var(--ctrl-cell-gap)' }}
              >
                {row.map((cell, ci) => {
                  const rowColor = rowColors?.[ri];
                  const activeStyle: CSSProperties | undefined = cell
                    ? {
                        backgroundColor: rowColor ?? undefined,
                        boxShadow: rowColor
                          ? `0 0 4px ${rowColor}`
                          : '0 0 4px var(--color-ctrl-glow)',
                      }
                    : rowColor
                      ? {
                          backgroundColor: `color-mix(in oklch, ${rowColor} 18%, transparent)`,
                        }
                      : undefined;

                  return (
                    <button
                      key={`${ri}-${ci}`}
                      type="button"
                      role="gridcell"
                      aria-pressed={cell}
                      disabled={disabled}
                      onClick={() => toggleCell(ri, ci)}
                      className={[
                        'outline-none transition-all duration-fast',
                        'focus-visible:ring-1 focus-visible:ring-ctrl-glow',
                        // Only use default token classes when no rowColors provided
                        !rowColor &&
                          (cell
                            ? 'bg-ctrl-fill'
                            : 'bg-ctrl-cell-bg hover:bg-ctrl-track'),
                        // When rowColor is set but cell is off, still allow hover
                        rowColor && !cell && 'hover:brightness-150',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      style={{
                        width: px,
                        height: px,
                        ...(isBeatBoundary(ci) ? { marginLeft: 4 } : {}),
                        ...activeStyle,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Column numbers */}
          {showColumnNumbers && (
            <div className="flex" style={{ gap: 'var(--ctrl-cell-gap)' }}>
              {Array.from({ length: cols }, (_, ci) => (
                <div
                  key={ci}
                  className="flex items-center justify-center font-mono"
                  style={{
                    width: px,
                    height: 14,
                    fontSize: 8,
                    color: 'var(--color-ctrl-label)',
                    ...(isBeatBoundary(ci) ? { marginLeft: 4 } : {}),
                  }}
                >
                  {ci + 1}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
