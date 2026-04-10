'use client';

import React from 'react';
import type { ControlSize } from '../../primitives/types';

// =============================================================================
// LEDArray — Row/grid of colored indicator dots with glow
// =============================================================================

interface LEDArrayProps {
  /** Array of booleans (on/off) or color strings (CSS values, empty = off) */
  values: (boolean | string)[];
  /** Default LED color when value is `true` */
  color?: string;
  label?: string;
  size?: ControlSize;
  className?: string;
}

const dotSize: Record<ControlSize, string> = {
  sm: 'size-1.5',
  md: 'size-2',
  lg: 'size-2.5',
};

export function LEDArray({
  values,
  color = 'var(--ctrl-fill)',
  label,
  size = 'md',
  className = '',
}: LEDArrayProps) {
  return (
    <div
      data-rdna="ctrl-led-array"
      className={['inline-flex flex-col gap-1 select-none', className].filter(Boolean).join(' ')}
    >
      {label && (
        <span className="font-mono text-ctrl-label text-[0.625rem] uppercase tracking-wider">
          {label}
        </span>
      )}

      <div className="flex gap-1 items-center">
        {values.map((v, i) => {
          const isOn = typeof v === 'string' ? v.length > 0 : v;
          const ledColor = typeof v === 'string' && v.length > 0 ? v : color;

          return (
            <span
              key={i}
              className={[
                dotSize[size],
                'rounded-full transition-all duration-fast',
                !isOn && 'bg-ctrl-track',
              ].filter(Boolean).join(' ')}
              style={isOn ? {
                backgroundColor: ledColor,
                boxShadow: `0 0 4px ${ledColor}`,
              } : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
