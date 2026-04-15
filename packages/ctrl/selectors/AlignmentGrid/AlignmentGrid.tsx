'use client';

import type { ControlSize } from '../../primitives/types';

// =============================================================================
// AlignmentGrid — 3×3 dot matrix for 2D alignment selection
//
// Paper ref: Alignment widget — gold active dot with glow, dim inactive dots.
// Single-select: only one position active at a time.
// =============================================================================

type AlignmentPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

interface AlignmentGridProps {
  value: AlignmentPosition;
  onChange: (value: AlignmentPosition) => void;
  size?: ControlSize;
  className?: string;
}

const positions: AlignmentPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'middle-left',
  'center',
  'middle-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

const sizePx: Record<ControlSize, number> = { sm: 64, md: 88, lg: 104 };

export type { AlignmentPosition, AlignmentGridProps };

export function AlignmentGrid({
  value,
  onChange,
  size = 'md',
  className = '',
}: AlignmentGridProps) {
  const dim = sizePx[size];

  return (
    <div
      data-rdna="ctrl-alignment-grid"
      className={['inline-flex select-none', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        role="radiogroup"
        aria-label="Alignment"
        style={{
          display: 'grid',
          gridTemplate: 'repeat(3, 1fr) / repeat(3, 1fr)',
          width: dim,
          height: dim,
          border: '1px solid var(--color-ctrl-border-inactive)',
          backgroundColor: 'var(--color-ctrl-cell-bg)',
          borderRadius: 2,
        }}
      >
        {positions.map((pos) => {
          const isActive = pos === value;

          return (
            <button
              key={pos}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={pos}
              onClick={() => onChange(pos)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                padding: 0,
                outline: 'none',
              }}
              className="focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ctrl-glow"
            >
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 1,
                  backgroundColor: isActive
                    ? 'var(--color-ctrl-fill)'
                    : 'var(--color-ctrl-grid-dot)',
                  boxShadow: isActive
                    ? '0 0 4px var(--color-ctrl-glow), 0 0 1px var(--color-ctrl-glow)'
                    : 'none',
                  transition: 'background-color 150ms ease-out, box-shadow 150ms ease-out',
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
