import type { CSSProperties } from 'react';

import { getBitmapIcon } from './generated-registry.ts';

export interface BitmapIconProps {
  readonly name: string;
  readonly size?: 16 | 24;
  readonly className?: string;
  readonly 'aria-label'?: string;
  readonly 'aria-hidden'?: boolean;
}

const warnedMissing = new Set<string>();

function warnMissingOnce(name: string, size: 16 | 24) {
  const key = `${size}:${name}`;
  if (warnedMissing.has(key)) return;
  warnedMissing.add(key);
  if (typeof console !== 'undefined' && typeof console.warn === 'function') {
    console.warn(
      `[@rdna/pixel] BitmapIcon: no baked entry for "${name}" at size ${size}. ` +
        'Run `pnpm --filter @rdna/pixel generate:icon-registry` if the source SVG exists.',
    );
  }
}

export function BitmapIcon({
  name,
  size = 16,
  className,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHiddenProp,
}: BitmapIconProps) {
  const entry = getBitmapIcon(name, size);

  if (!entry) {
    warnMissingOnce(name, size);
    return null;
  }

  // 24px icons have a 21×21 live area; inset 1px top/left so the bitmap sits in
  // the 24-slot with its canonical gutter, preserving layout vs the SVG pipeline.
  const maskPosition = size === 24 && entry.width === 21 ? '1px 1px' : 'top left';

  const style: CSSProperties = {
    display: 'inline-block',
    flexShrink: 0,
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: 'currentColor',
    WebkitMaskImage: entry.maskImage,
    maskImage: entry.maskImage,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: maskPosition,
    maskPosition,
    WebkitMaskSize: `${entry.width}px ${entry.height}px`,
    maskSize: `${entry.width}px ${entry.height}px`,
  };

  const ariaHidden = ariaHiddenProp ?? (ariaLabel ? undefined : true);

  return (
    <span
      className={className}
      style={style}
      data-rdna="bitmap-icon"
      data-icon={entry.name}
      data-size={entry.size}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
    />
  );
}
