'use client';

import { useCallback } from 'react';
import { useCanvasRenderer } from '../../primitives/useCanvasRenderer';
import type { ControlSize } from '../../primitives/types';

// =============================================================================
// Waveform — Canvas waveform path renderer
// =============================================================================

interface WaveformProps {
  data: Float32Array | number[];
  label?: string;
  size?: ControlSize;
  className?: string;
}

const heightMap: Record<ControlSize, string> = {
  sm: 'h-6',
  md: 'h-10',
  lg: 'h-16',
};

export function Waveform({
  data,
  label,
  size = 'md',
  className = '',
}: WaveformProps) {
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      if (data.length === 0) return;

      const fillStyle = getComputedStyle(ctx.canvas).getPropertyValue('--ctrl-fill').trim() || '#FCE184';
      const glowColor = getComputedStyle(ctx.canvas).getPropertyValue('--glow-sun-yellow').trim() || 'rgba(252, 225, 132, 0.5)';

      const mid = height / 2;
      const step = width / data.length;

      ctx.strokeStyle = fillStyle;
      ctx.lineWidth = 1;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 6;

      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = i * step;
        const amp = data[i] * mid;
        ctx.moveTo(x, mid - amp);
        ctx.lineTo(x, mid + amp);
      }
      ctx.stroke();
    },
    [data],
  );

  const canvasRef = useCanvasRenderer({ draw });

  return (
    <div
      data-rdna="ctrl-waveform"
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
