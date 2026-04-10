'use client';

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
}

const cellSize: Record<ControlSize, string> = {
  sm: 'size-3',
  md: 'size-4',
  lg: 'size-5',
};

export function MatrixGrid({
  value,
  onChange,
  cols = value[0]?.length ?? 8,
  label,
  disabled = false,
  size = 'md',
  className = '',
}: MatrixGridProps) {
  const toggleCell = (row: number, col: number) => {
    const next = value.map((r, ri) =>
      ri === row ? r.map((c, ci) => (ci === col ? !c : c)) : r,
    );
    onChange(next);
  };

  return (
    <div
      data-rdna="ctrl-matrix-grid"
      className={[
        'inline-flex flex-col gap-1 select-none',
        disabled && 'opacity-[--ctrl-disabled-opacity] pointer-events-none',
        className,
      ].filter(Boolean).join(' ')}
    >
      {label && (
        <span className="font-mono text-ctrl-label text-[0.625rem] uppercase tracking-wider">
          {label}
        </span>
      )}

      <div
        role="grid"
        className="inline-grid gap-[--ctrl-cell-gap] border border-ctrl-border-inactive p-px"
        style={{ gridTemplateColumns: `repeat(${cols}, auto)` }}
      >
        {value.map((row, ri) =>
          row.map((cell, ci) => (
            <button
              key={`${ri}-${ci}`}
              type="button"
              role="gridcell"
              aria-pressed={cell}
              disabled={disabled}
              onClick={() => toggleCell(ri, ci)}
              className={[
                cellSize[size],
                'outline-none transition-all duration-fast',
                'focus-visible:ring-1 focus-visible:ring-ctrl-glow',
                cell
                  ? 'bg-ctrl-fill'
                  : 'bg-ctrl-cell-bg hover:bg-ctrl-track',
              ].filter(Boolean).join(' ')}
              style={cell ? { boxShadow: '0 0 4px var(--glow-sun-yellow)' } : undefined}
            />
          )),
        )}
      </div>
    </div>
  );
}
