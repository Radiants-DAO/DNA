'use client';

import type { CSSProperties, HTMLAttributes } from 'react';

import { bitsToMaskURI, bitsToPath } from '@rdna/pixel';

import { getPixelIcon } from '../../../pixel-icons/registry';
import type { PixelGrid, PixelIconName, PixelIconSource } from '../../../pixel-icons/types';

export interface PixelIconProps extends HTMLAttributes<HTMLSpanElement> {
  grid?: PixelGrid;
  name?: PixelIconName;
  size?: number | string;
  scale?: number;
  color?: string;
}

function resolveIcon(grid: PixelGrid | undefined, name: PixelIconSource | undefined): PixelGrid | undefined {
  if (grid) {
    return grid;
  }

  if (typeof name === 'string') {
    return getPixelIcon(name);
  }

  return name;
}

function toCssSize(value: number | string): string {
  return typeof value === 'number' ? `${value}px` : value;
}

function createMaskImage(grid: PixelGrid): string {
  return bitsToMaskURI(bitsToPath(grid.bits, grid.width, grid.height), grid.width, grid.height);
}

export function PixelIcon({
  grid,
  name,
  size,
  scale = 1,
  color,
  className = '',
  style,
  'aria-label': ariaLabel,
  ...rest
}: PixelIconProps) {
  const icon = resolveIcon(grid, name);

  if (!icon) {
    return null;
  }

  const resolvedWidth = size ?? `${icon.width * scale}px`;
  const resolvedHeight = size ?? `${icon.height * scale}px`;
  const maskImage = 'maskImage' in icon ? icon.maskImage : createMaskImage(icon);
  const hostStyle: CSSProperties = {
    ...style,
    width: toCssSize(resolvedWidth),
    height: toCssSize(resolvedHeight),
    display: 'inline-block',
    backgroundColor: 'currentColor',
    WebkitMaskImage: maskImage,
    maskImage,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
  };

  if (color) {
    hostStyle.color = color;
  }

  return (
    <span
      {...rest}
      className={className}
      data-rdna="pixel-icon"
      data-icon={icon.name}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      role={ariaLabel ? 'img' : undefined}
      style={hostStyle}
    />
  );
}
