'use client';

import React from 'react';

import { getPatternByName, type PatternName } from '../../../patterns';

export interface PatternProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Pattern name from the registry */
  pat: PatternName | string;
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
  const pattern = getPatternByName(pat);

  if (!pattern) {
    return null;
  }

  const classes = [
    'rdna-pat',
    `rdna-pat--${pattern.name}`,
    scale > 1 ? `rdna-pat--${scale}x` : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      style={{
        backgroundColor: bg,
        '--pat-bg': bg ?? 'transparent',
        '--pat-color': color ?? 'var(--color-main)',
        '--pat-repeat': tiled ? 'repeat' : 'no-repeat',
        '--pat-scale': scale,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
