'use client';

import {
  useRef,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  renderGradientDither,
  type OrderedAlgorithm,
  type ResolvedGradient,
} from '@dithwather/core';
import { useResizeObserver } from '@dithwather/react';

export interface DitherWipeProps {
  active: boolean;
  type?: 'linear' | 'radial';
  angle?: number;
  center?: [number, number];
  direction?: 'in' | 'out';
  duration?: number;
  delay?: number;
  algorithm?: OrderedAlgorithm;
  pixelScale?: number;
  edge?: number;
  onComplete?: () => void;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const clamp = (v: number) => Math.max(0, Math.min(1, v));

export default function DitherWipe({
  active,
  type = 'linear',
  angle = 135,
  center = [0.5, 0.5],
  direction = 'out',
  duration = 600,
  delay = 0,
  algorithm = 'bayer4x4',
  pixelScale = 3,
  edge = 0.15,
  onComplete,
  children,
  className,
  style,
}: DitherWipeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width: rawW, height: rawH } = useResizeObserver(containerRef, 0);

  // Track animation phase: 'idle' | 'waiting' | 'running' | 'done'
  const [phase, setPhase] = useState<'idle' | 'waiting' | 'running' | 'done'>('idle');
  const rafRef = useRef<number | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Derive canvas dimensions (reduced resolution)
  const w = Math.ceil(rawW / pixelScale);
  const h = Math.ceil(rawH / pixelScale);

  // Start/reset animation when `active` changes
  useEffect(() => {
    if (active) {
      setPhase('waiting');
      delayRef.current = setTimeout(() => setPhase('running'), delay);
    } else {
      // Reset
      if (delayRef.current) clearTimeout(delayRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      delayRef.current = null;
      rafRef.current = null;
      setPhase('idle');
    }
    return () => {
      if (delayRef.current) clearTimeout(delayRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, delay]);

  // rAF animation loop
  useEffect(() => {
    if (phase !== 'running') return;
    if (w <= 0 || h <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const start = performance.now();
    let last = 0;

    const tick = (now: number) => {
      // ~24fps throttle
      if (now - last > 41) {
        last = now;
        const raw = Math.min((now - start) / duration, 1);
        // ease-out cubic
        const progress = 1 - Math.pow(1 - raw, 3);

        const stops = buildStops(type, direction, progress, edge);
        const gradient: ResolvedGradient = {
          type,
          stops,
          angle,
          center,
          radius: 1,
          aspect: 1,
          startAngle: 0,
        };

        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }

        const imageData = renderGradientDither({
          gradient,
          algorithm,
          width: w,
          height: h,
          pixelScale: 1, // already at reduced resolution
        });
        ctx.putImageData(imageData, 0, 0);

        // Convert to data URL for mask
        const url = canvas.toDataURL();
        const el = containerRef.current;
        if (el) {
          el.style.setProperty('-webkit-mask-image', `url(${url})`);
          el.style.setProperty('mask-image', `url(${url})`);
        }

        if (raw >= 1) {
          rafRef.current = null;
          setPhase('done');
          onCompleteRef.current?.();
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, w, h, type, direction, duration, edge, angle, center, algorithm, pixelScale]);

  // Compute container styles based on phase + direction
  const maskStyles: CSSProperties = {};

  if (phase === 'idle' || phase === 'waiting') {
    if (direction === 'in') {
      // Not yet revealed — hide
      maskStyles.visibility = 'hidden';
    }
    // direction === 'out': fully visible, no mask
  } else if (phase === 'running') {
    // Mask is applied via ref in the rAF loop
    Object.assign(maskStyles, {
      maskSize: '100% 100%',
      WebkitMaskSize: '100% 100%',
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
      maskMode: 'luminance',
      WebkitMaskMode: 'luminance',
      imageRendering: 'pixelated' as const,
    });
  } else if (phase === 'done') {
    if (direction === 'out') {
      // Fully dissolved
      maskStyles.opacity = 0;
      maskStyles.pointerEvents = 'none';
    }
    // direction === 'in': fully revealed, no mask needed — clear it
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        ...style,
        ...maskStyles,
      }}
    >
      {children}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

/**
 * Build gradient stops for the wipe mask.
 * White = visible, Black = hidden (maskMode: luminance).
 */
function buildStops(
  type: 'linear' | 'radial',
  direction: 'in' | 'out',
  progress: number,
  edge: number,
) {
  if (type === 'linear' && direction === 'out') {
    // Wipe out: black front sweeps left-to-right (per gradient angle)
    const front = -edge + progress * (1 + 2 * edge);
    return [
      { color: '#000000', position: 0 },
      { color: '#000000', position: clamp(front - edge) },
      { color: '#ffffff', position: clamp(front + edge) },
      { color: '#ffffff', position: 1 },
    ];
  }

  if (type === 'linear' && direction === 'in') {
    // Wipe in: white front sweeps left-to-right
    const front = -edge + progress * (1 + 2 * edge);
    return [
      { color: '#ffffff', position: 0 },
      { color: '#ffffff', position: clamp(front - edge) },
      { color: '#000000', position: clamp(front + edge) },
      { color: '#000000', position: 1 },
    ];
  }

  if (type === 'radial' && direction === 'out') {
    // Edge-to-center wipe out: black sweeps from edges (pos=1) inward (pos=0)
    const front = 1 + edge - progress * (1 + 2 * edge);
    return [
      { color: '#ffffff', position: 0 },
      { color: '#ffffff', position: clamp(front - edge) },
      { color: '#000000', position: clamp(front + edge) },
      { color: '#000000', position: 1 },
    ];
  }

  // radial + in: center-to-edge reveal
  const front = -edge + progress * (1 + 2 * edge);
  return [
    { color: '#ffffff', position: 0 },
    { color: '#ffffff', position: clamp(front - edge) },
    { color: '#000000', position: clamp(front + edge) },
    { color: '#000000', position: 1 },
  ];
}
