'use client';

import { useEffect, useRef } from 'react';
import type { CanvasRendererConfig } from './types';

// =============================================================================
// useCanvasRenderer — ResizeObserver + rAF loop for canvas-based controls
//
// Used by Waveform, Spectrum, Sparkline for GPU-accelerated rendering.
// Handles device pixel ratio scaling and cleanup automatically.
// =============================================================================

export function useCanvasRenderer(config: CanvasRendererConfig) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const drawRef = useRef(config.draw);

  // Keep draw fn ref current without re-triggering effects
  drawRef.current = config.draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = config.dpr ?? window.devicePixelRatio ?? 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const observer = new ResizeObserver(() => {
      resize();
    });
    observer.observe(canvas);
    resize();

    // rAF render loop
    let running = true;
    const loop = () => {
      if (!running) return;
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      drawRef.current(ctx, rect.width, rect.height);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, [config.dpr]);

  return canvasRef;
}
