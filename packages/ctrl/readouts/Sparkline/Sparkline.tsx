'use client';

import { useCallback } from 'react';
import { useCanvasRenderer } from '../../primitives/useCanvasRenderer';
import type { ControlSize } from '../../primitives/types';

// =============================================================================
// Sparkline — Canvas line/dot chart for compact data visualization
// =============================================================================

interface SparklineProps {
  data: number[];
  min?: number;
  max?: number;
  label?: string;
  showDots?: boolean;
  size?: ControlSize;
  className?: string;
}

const heightMap: Record<ControlSize, string> = {
  sm: 'h-4',
  md: 'h-6',
  lg: 'h-8',
};

export function Sparkline({
  data,
  min: forcedMin,
  max: forcedMax,
  label,
  showDots = false,
  size = 'md',
  className = '',
}: SparklineProps) {
  const dataMin = forcedMin ?? Math.min(...data);
  const dataMax = forcedMax ?? Math.max(...data);
  const range = dataMax - dataMin || 1;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      if (data.length < 2) return;

      const padding = 2;
      const w = width - padding * 2;
      const h = height - padding * 2;

      // Get CSS custom property values from the canvas element
      const style = getComputedStyle(ctx.canvas);
      const accentFallback = style.getPropertyValue('--color-accent').trim();
      const fillStyle = style.getPropertyValue('--color-ctrl-fill').trim() || accentFallback;
      const dotStyle = style.getPropertyValue('--color-ctrl-glow').trim() || accentFallback;
      const glowColor = style.getPropertyValue('--color-ctrl-glow').trim() || accentFallback;

      ctx.strokeStyle = fillStyle;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 6;

      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = padding + (i / (data.length - 1)) * w;
        const y = padding + (1 - (data[i] - dataMin) / range) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (showDots) {
        ctx.fillStyle = dotStyle;
        for (let i = 0; i < data.length; i++) {
          const x = padding + (i / (data.length - 1)) * w;
          const y = padding + (1 - (data[i] - dataMin) / range) * h;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    [data, dataMin, range, showDots],
  );

  const canvasRef = useCanvasRenderer({ draw });

  return (
    <div
      data-rdna="ctrl-sparkline"
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
