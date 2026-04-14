'use client';

import { useCallback } from 'react';
import { useCanvasRenderer } from '../../primitives/useCanvasRenderer';
import type { ControlSize } from '../../primitives/types';

// =============================================================================
// Spectrum — Canvas vertical bar analyzer display
// =============================================================================

interface SpectrumProps {
  data: number[];
  label?: string;
  size?: ControlSize;
  barWidth?: number;
  className?: string;
}

const heightMap: Record<ControlSize, string> = {
  sm: 'h-6',
  md: 'h-10',
  lg: 'h-16',
};

export function Spectrum({
  data,
  label,
  size = 'md',
  barWidth = 3,
  className = '',
}: SpectrumProps) {
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      if (data.length === 0) return;

      const fillStyle = getComputedStyle(ctx.canvas).getPropertyValue('--ctrl-fill').trim() || '#FCE184';
      const glowColor = getComputedStyle(ctx.canvas).getPropertyValue('--glow-sun-yellow').trim() || 'rgba(252, 225, 132, 0.5)';

      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 4;

      const gap = 1;
      const totalBarWidth = barWidth + gap;
      const maxBars = Math.floor(width / totalBarWidth);
      const barsToRender = Math.min(data.length, maxBars);

      ctx.fillStyle = fillStyle;

      for (let i = 0; i < barsToRender; i++) {
        const val = Math.max(0, Math.min(1, data[i]));
        const barHeight = val * height;
        const x = i * totalBarWidth;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      }
    },
    [data, barWidth],
  );

  const canvasRef = useCanvasRenderer({ draw });

  return (
    <div
      data-rdna="ctrl-spectrum"
      className={['inline-flex flex-col gap-1 select-none', className].filter(Boolean).join(' ')}
    >
      {label && (
        <span className="font-mono text-ctrl-label text-[0.625rem] uppercase tracking-wider">
          {label}
        </span>
      )}

      <canvas
        ref={canvasRef}
        className={['w-full bg-ctrl-cell-bg border border-ctrl-border-inactive rounded-sm', heightMap[size]].join(' ')}
      />
    </div>
  );
}
