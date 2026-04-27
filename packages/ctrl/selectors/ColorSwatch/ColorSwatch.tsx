'use client';

import type { ControlSize } from '../../primitives/types';

// =============================================================================
// ColorSwatch — Color preview rect + label
//
// Paper ref: 12 — Color Swatch
// Variants: panel (16px + bg), inline (12px), compact (8px).
// Selected: gold border + glow. Unselected: cream 25% border.
// =============================================================================

type ColorSwatchSize = ControlSize | 'xl';

interface ColorSwatchProps {
  color: string;
  label?: string;
  selected?: boolean;
  size?: ColorSwatchSize;
  /**
   * When true, the swatch rect fills its parent's inline size and keeps a
   * 1:1 aspect ratio (ignoring `size`). Intended for grid cells where the
   * swatch should fill the column as a square. Incompatible with `label`.
   */
  fill?: boolean;
  /** Drop the border on the color rect — glow is retained for selection. */
  borderless?: boolean;
  onClick?: () => void;
  className?: string;
}

const swatchSize: Record<ColorSwatchSize, string> = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
  xl: 'size-10',
};

export function ColorSwatch({
  color,
  label,
  selected = false,
  size = 'md',
  fill = false,
  borderless = false,
  onClick,
  className = '',
}: ColorSwatchProps) {
  const interactive = !!onClick;
  const rectClass = fill ? 'w-full aspect-square' : swatchSize[size];
  const isTransparent = color === 'transparent' || /^#[0-9a-f]{6}00$/i.test(color);

  return (
    <div
      data-rdna="ctrl-color-swatch"
      className={[
        'group',
        fill ? 'flex w-full' : 'inline-flex items-center gap-1.5',
        interactive && 'cursor-pointer',
        className,
      ].filter(Boolean).join(' ')}
      onClick={onClick}
      role={interactive ? 'option' : undefined}
      aria-selected={interactive ? selected : undefined}
    >
      {/* Color rect */}
      <span
        className={[
          rectClass,
          'relative transition-colors duration-fast',
          borderless ? '' : 'border border-ctrl-border-inactive',
        ].filter(Boolean).join(' ')}
        style={
          isTransparent
            ? {
                backgroundColor: 'var(--color-pure-black)',
                backgroundImage:
                  'linear-gradient(45deg, var(--color-cream) 25%, transparent 25%, transparent 75%, var(--color-cream) 75%), linear-gradient(45deg, var(--color-cream) 25%, transparent 25%, transparent 75%, var(--color-cream) 75%)',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 8px 8px',
              }
            : { backgroundColor: color }
        }
      >
        {!selected && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden group-hover:block"
            style={{
              backgroundColor: 'var(--color-ctrl-label)',
              WebkitMaskImage: 'var(--pat-diagonal)',
              maskImage: 'var(--pat-diagonal)',
              WebkitMaskSize: '8px 8px',
              maskSize: '8px 8px',
              WebkitMaskRepeat: 'repeat',
              maskRepeat: 'repeat',
            }}
          />
        )}
      </span>

      {label && !fill && (
        <span
          className={[
            'font-mono uppercase tracking-wider text-main',
            size === 'sm' ? 'text-[0.5rem]' : 'text-[0.625rem]',
          ].join(' ')}
        >
          {label}
        </span>
      )}
    </div>
  );
}
