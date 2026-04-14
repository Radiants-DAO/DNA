'use client';

import { useEffect, useRef, type CanvasHTMLAttributes } from 'react';

import {
  animateTransition,
  computeFlipOrder,
  paintGrid,
  type PixelGrid,
  type TransitionMode,
} from '@rdna/pixel';

export interface PixelTransitionProps
  extends Omit<CanvasHTMLAttributes<HTMLCanvasElement>, 'width' | 'height'> {
  from: PixelGrid;
  to: PixelGrid;
  pixelSize?: number;
  duration?: number;
  mode?: TransitionMode;
  autoPlay?: boolean;
  color?: string;
}

function resolveColor(canvas: HTMLCanvasElement, color?: string): string {
  if (color) {
    return color;
  }

  const computed = globalThis.getComputedStyle(canvas).color;
  return computed || 'currentColor';
}

export function PixelTransition({
  from,
  to,
  pixelSize = 1,
  duration = 300,
  mode = 'random',
  autoPlay = true,
  color,
  className = '',
  style,
  ...rest
}: PixelTransitionProps) {
  if (from.width !== to.width || from.height !== to.height) {
    throw new Error(
      `PixelTransition requires matching grid dimensions (${from.width}x${from.height} !== ${to.width}x${to.height})`,
    );
  }

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  const width = from.width * pixelSize;
  const height = from.height * pixelSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    cancelRef.current?.();
    cancelRef.current = null;

    const resolvedColor = resolveColor(canvas, color);
    const paintFrame = (bits: string) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      paintGrid(
        ctx,
        {
          ...from,
          bits,
        },
        resolvedColor,
        pixelSize,
      );
    };

    paintFrame(from.bits);

    if (!autoPlay) {
      return () => {
        cancelRef.current?.();
        cancelRef.current = null;
      };
    }

    const flipOrder = computeFlipOrder(from.bits, to.bits, mode, from.width, from.height);
    cancelRef.current = animateTransition(
      from.bits,
      to.bits,
      flipOrder,
      duration,
      paintFrame,
    );

    return () => {
      cancelRef.current?.();
      cancelRef.current = null;
    };
  }, [autoPlay, color, duration, from, mode, pixelSize, to]);

  return (
    <canvas
      {...rest}
      ref={canvasRef}
      className={className}
      width={width}
      height={height}
      style={{
        ...style,
        width: `${width}px`,
        height: `${height}px`,
        display: 'inline-block',
        imageRendering: 'pixelated',
      }}
    />
  );
}
