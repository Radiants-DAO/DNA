'use client';

import type { CSSProperties, ReactNode } from 'react';
import { NumberField } from '@base-ui/react/number-field';

// =============================================================================
// ScrubSurface — vertical drag-to-scrub on an arbitrary element
//
// Wraps @base-ui/react/number-field's Root + ScrubArea so any div (a trapezoid,
// a row, etc.) can become a vertical scrub surface without needing a visible
// text input. Used by box-model inspectors where the value is shown elsewhere
// (inside a label overlay) and the drag handle is the full visual element.
// =============================================================================

export interface ScrubSurfaceProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  pixelSensitivity?: number;
  /** ClassName applied to the rendered ScrubArea element (the drag surface). */
  className?: string;
  /** Inline style applied to the rendered ScrubArea element. */
  style?: CSSProperties;
  /** Content rendered inside the scrub surface. */
  children?: ReactNode;
}

export function ScrubSurface({
  value,
  onValueChange,
  min = 0,
  max,
  step = 1,
  pixelSensitivity = 2,
  className,
  style,
  children,
}: ScrubSurfaceProps) {
  return (
    <NumberField.Root
      value={value}
      onValueChange={(v) => onValueChange(v ?? 0)}
      min={min}
      max={max}
      step={step}
      render={<span style={{ display: 'contents' }} />}
    >
      <NumberField.ScrubArea
        direction="vertical"
        pixelSensitivity={pixelSensitivity}
        render={(props) => (
          <div
            {...props}
            className={className}
            style={{ ...style, cursor: 'ns-resize', touchAction: 'none' }}
          >
            {children}
          </div>
        )}
      />
      <NumberField.Input
        tabIndex={-1}
        aria-hidden
        className="sr-only pointer-events-none absolute"
      />
    </NumberField.Root>
  );
}
