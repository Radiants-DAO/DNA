'use client';

import type { ControlSize } from '../../primitives/types';

// =============================================================================
// ColorSwatch — Color preview rect + label
//
// Paper ref: 12 — Color Swatch
// Variants: panel (16px + bg), inline (12px), compact (8px).
// Selected: gold border + glow. Unselected: cream 25% border.
// =============================================================================

interface ColorSwatchProps {
  color: string;
  label?: string;
  selected?: boolean;
  size?: ControlSize;
  onClick?: () => void;
  className?: string;
}

const swatchSize: Record<ControlSize, string> = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
};

export function ColorSwatch({
  color,
  label,
  selected = false,
  size = 'md',
  onClick,
  className = '',
}: ColorSwatchProps) {
  const interactive = !!onClick;

  return (
    <div
      data-rdna="ctrl-color-swatch"
      className={[
        'inline-flex items-center gap-1.5',
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
          swatchSize[size],
          'border transition-all duration-fast',
          selected
            ? 'border-ctrl-border-active'
            : 'border-ctrl-border-inactive',
        ].join(' ')}
        style={{
          backgroundColor: color,
          ...(selected ? { boxShadow: '0 0 6px var(--glow-sun-yellow-subtle)' } : {}),
        }}
      />

      {label && (
        <span
          className={[
            'font-mono uppercase tracking-wider',
            size === 'sm' ? 'text-[0.5rem]' : 'text-[0.625rem]',
            selected ? 'text-ctrl-text-active' : 'text-ctrl-label',
          ].join(' ')}
          style={selected ? { textShadow: '0 0 8px var(--glow-sun-yellow)' } : undefined}
        >
          {label}
        </span>
      )}
    </div>
  );
}
