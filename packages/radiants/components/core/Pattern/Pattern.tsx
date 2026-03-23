'use client';

import React from 'react';

export interface PatternProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Pattern name from the registry */
  pat: string;
  /** Dot/foreground color — any CSS color value. Defaults to var(--color-main) */
  color?: string;
  /** Background color behind the pattern. Defaults to transparent (overlay mode) */
  bg?: string;
  /** Scale multiplier: 1 = 8px, 2 = 16px, 3 = 24px, 4 = 32px */
  scale?: 1 | 2 | 3 | 4;
}

const SCALE_CLASSES: Record<number, string> = {
  2: 'rdna-pat--2x',
  3: 'rdna-pat--3x',
  4: 'rdna-pat--4x',
};

export function Pattern({
  pat,
  color,
  bg,
  scale,
  className = '',
  style,
  ...rest
}: PatternProps) {
  const patClass = `rdna-pat--${pat}`;
  const scaleClass = scale ? SCALE_CLASSES[scale] ?? '' : '';

  if (bg) {
    // Two-tone: bg div + masked fg div
    return (
      <div
        className={className}
        style={{ position: 'relative', backgroundColor: bg, ...style }}
        {...rest}
      >
        <div
          className={`rdna-pat ${patClass} ${scaleClass}`}
          style={{
            position: 'absolute',
            inset: 0,
            ...(color ? { '--pat-color': color, backgroundColor: color } as React.CSSProperties : {}),
          }}
        />
      </div>
    );
  }

  // Single layer: pattern overlay (transparent bg)
  return (
    <div
      className={`rdna-pat ${patClass} ${scaleClass} ${className}`}
      style={{
        ...(color ? { '--pat-color': color, backgroundColor: color } as React.CSSProperties : {}),
        ...style,
      }}
      {...rest}
    />
  );
}
