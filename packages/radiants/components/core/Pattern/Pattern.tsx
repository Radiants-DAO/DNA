'use client';

import React, { useId } from 'react';

import { getPattern, listFilledRects } from '@rdna/pixel';

export interface PatternProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Pattern name from the registry */
  pat: string;
  /** Dot/foreground color — any CSS color value. Defaults to var(--color-main) */
  color?: string;
  /** Background color behind the pattern. Defaults to transparent (overlay mode) */
  bg?: string;
  /** Scale multiplier: 1 = 8px, 2 = 16px, 3 = 24px, 4 = 32px */
  scale?: 1 | 2 | 3 | 4;
  /** If true, tile the pattern to fill the host. Defaults to true. */
  tiled?: boolean;
}

export function Pattern({
  pat,
  color,
  bg,
  scale = 1,
  tiled = true,
  className = '',
  style,
  children,
  ...rest
}: PatternProps) {
  const grid = getPattern(pat);
  const patternId = useId().replace(/:/g, '_');

  if (!grid) {
    return null;
  }

  const rects = listFilledRects(grid, scale);
  const tileWidth = grid.width * scale;
  const tileHeight = grid.height * scale;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        backgroundColor: bg,
        ...style,
      }}
      {...rest}
    >
      <svg
        aria-hidden
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          color: color ?? 'var(--color-main)',
          zIndex: 0,
        }}
      >
        {tiled ? (
          <>
            <defs>
              <pattern
                id={patternId}
                width={tileWidth}
                height={tileHeight}
                patternUnits="userSpaceOnUse"
              >
                {rects.map((rect) => (
                  <rect
                    key={`${rect.x}-${rect.y}`}
                    x={rect.x}
                    y={rect.y}
                    width={rect.width}
                    height={rect.height}
                    fill="currentColor"
                  />
                ))}
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternId})`} />
          </>
        ) : (
          rects.map((rect) => (
            <rect
              key={`single-${rect.x}-${rect.y}`}
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill="currentColor"
            />
          ))
        )}
      </svg>
      {children ? (
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      ) : null}
    </div>
  );
}
