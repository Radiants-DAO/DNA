'use client';

import type { ControlSize } from '../../primitives/types';

// =============================================================================
// DirectionPad — 3×3 grid with cardinal chevron arrows + center indicator
//
// Paper ref: Directional controls — gold active chevron with glow,
// dim inactive chevrons, gold diamond center dot.
// =============================================================================

type Direction = 'up' | 'down' | 'left' | 'right';

interface DirectionPadProps {
  /** Currently active/highlighted direction (optional) */
  value?: Direction | null;
  /** Called when a direction button is clicked */
  onPress: (direction: Direction) => void;
  /** Called when center is clicked */
  onCenterPress?: () => void;
  size?: ControlSize;
  className?: string;
}

const sizePx: Record<ControlSize, number> = { sm: 64, md: 88, lg: 104 };

/** Chevron SVG paths for each direction (10×10 viewBox) */
const chevronPaths: Record<Direction, string> = {
  up: 'M2 7 L5 3 L8 7',
  down: 'M2 3 L5 7 L8 3',
  left: 'M7 2 L3 5 L7 8',
  right: 'M3 2 L7 5 L3 8',
};

/** Grid position [row, col] for each direction */
const directionCell: Record<Direction, [number, number]> = {
  up: [0, 1],
  left: [1, 0],
  right: [1, 2],
  down: [2, 1],
};

export type { Direction, DirectionPadProps };

export function DirectionPad({
  value = null,
  onPress,
  onCenterPress,
  size = 'md',
  className = '',
}: DirectionPadProps) {
  const dim = sizePx[size];
  const cellSize = Math.floor((dim - 2) / 3); // subtract 2px for gap
  const chevronSize = Math.max(8, Math.round(cellSize * 0.4));

  // Build a lookup for which cell has what
  const cellMap = new Map<string, Direction>();
  for (const [dir, [r, c]] of Object.entries(directionCell)) {
    cellMap.set(`${r}-${c}`, dir as Direction);
  }

  const cells: { row: number; col: number }[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      cells.push({ row: r, col: c });
    }
  }

  return (
    <div
      data-rdna="ctrl-direction-pad"
      className={['inline-flex select-none', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        role="group"
        aria-label="Direction pad"
        style={{
          display: 'grid',
          gridTemplate: 'repeat(3, 1fr) / repeat(3, 1fr)',
          gap: 1,
          width: dim,
          height: dim,
          border: '1px solid var(--color-ctrl-border-inactive)',
          borderRadius: 2,
        }}
      >
        {cells.map(({ row, col }) => {
          const key = `${row}-${col}`;
          const direction = cellMap.get(key);
          const isCenter = row === 1 && col === 1;

          // Corner cells — empty spacers
          if (!direction && !isCenter) {
            return (
              <div
                key={key}
                style={{ backgroundColor: 'var(--color-ctrl-cell-bg)' }}
              />
            );
          }

          // Center cell — gold diamond
          if (isCenter) {
            return (
              <button
                key={key}
                type="button"
                aria-label="Center"
                onClick={onCenterPress}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--color-ctrl-cell-bg)',
                  border: 'none',
                  padding: 0,
                  cursor: onCenterPress ? 'pointer' : 'default',
                  outline: 'none',
                }}
                className="focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ctrl-glow"
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    transform: 'rotate(45deg)',
                    backgroundColor: 'var(--color-ctrl-fill)',
                    boxShadow:
                      '0 0 4px var(--color-ctrl-glow), 0 0 1px var(--color-ctrl-glow)',
                  }}
                />
              </button>
            );
          }

          // Direction cell — chevron arrow
          const isActive = direction === value;

          return (
            <button
              key={key}
              type="button"
              aria-label={direction}
              aria-pressed={isActive}
              onClick={() => onPress(direction!)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--color-ctrl-cell-bg)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                outline: 'none',
              }}
              className="focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ctrl-glow"
            >
              <svg
                width={chevronSize}
                height={chevronSize}
                viewBox="0 0 10 10"
                fill="none"
                style={{
                  transition:
                    'filter 150ms ease-out',
                  filter: isActive
                    ? 'drop-shadow(0 0 3px var(--color-ctrl-glow))'
                    : 'none',
                }}
              >
                <path
                  d={chevronPaths[direction!]}
                  stroke={
                    isActive
                      ? 'var(--color-ctrl-fill)'
                      : 'var(--color-ctrl-label)'
                  }
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transition: 'stroke 150ms ease-out',
                  }}
                />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}
