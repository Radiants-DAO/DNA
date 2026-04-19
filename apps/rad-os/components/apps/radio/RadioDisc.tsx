'use client';

import { useEffect, useMemo, useRef } from 'react';

// =============================================================================
// RadioDisc — Circular "transport window" that replaces the old video player.
//
//   • Outer 400px circle with two concentric decorative rings (solid + dashed).
//   • Inner 256px circle clips the current <video> as a round viewport.
//   • 36 tick bars arranged around the perimeter (every 10°). Ticks in the
//     top half (0°–180°) light up sequentially as the current track progresses
//     — one full sweep per song.
// =============================================================================

const OUTER_SIZE = 400;
const INNER_SIZE = 256;
const TICK_COUNT = 36;
const TICK_HEIGHT = 21;
const TICK_WIDTH = 2;

interface RadioDiscProps {
  /** Current playback time in seconds */
  currentTime: number;
  /** Total duration in seconds (>0 to drive the tick sweep) */
  duration: number;
  /** Whether audio is currently playing (drives the tick glow intensity) */
  isPlaying: boolean;
  /** Current video src */
  videoSrc: string;
  /** Called when the video element emits an `ended` event */
  onVideoEnded?: () => void;
  /** Optional extra style for the outer container */
  style?: React.CSSProperties;
}

export function RadioDisc({
  currentTime,
  duration,
  isPlaying,
  videoSrc,
  onVideoEnded,
  style,
}: RadioDiscProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onEndedRef = useRef(onVideoEnded);
  onEndedRef.current = onVideoEnded;

  // Track progress in [0..1]. One full disc rotation per song.
  const progress = duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0;

  // Rebuild tick descriptors once.
  const ticks = useMemo(() => {
    return Array.from({ length: TICK_COUNT }, (_, i) => {
      const angleDeg = i * (360 / TICK_COUNT);
      return { angleDeg, index: i };
    });
  }, []);

  const litCount = Math.floor(progress * TICK_COUNT);

  // (Re)play the video when src changes, and forward `ended` through.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {});

    const handleEnded = () => onEndedRef.current?.();
    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [videoSrc]);

  return (
    <div
      data-rdna="radio-disc"
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        width: OUTER_SIZE,
        height: OUTER_SIZE,
        borderRadius: '50%',
        // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:paper-design-black-disc owner:rad-os expires:2026-12-31 issue:DNA-999
        backgroundColor: 'oklch(0 0 0)',
        // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:paper-design-inset-highlight owner:rad-os expires:2026-12-31 issue:DNA-999
        boxShadow: 'oklch(0 0 0 / 0.15) 2px 2px 9.6px inset, oklch(0.9780 0.0295 94.34 / 0.1) -2px -2px 9.6px inset',
        ...style,
      }}
    >
      {/* Solid subtle outer ring */}
      <div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: 20,
          // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:paper-design-ring owner:rad-os expires:2026-12-31 issue:DNA-999
          border: '1px solid oklch(0.9126 0.1170 93.68 / 0.18)',
          // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:paper-design-vignette owner:rad-os expires:2026-12-31 issue:DNA-999
          boxShadow: 'oklch(0 0 0 / 0.8) 0 0 30px inset',
        }}
      />

      {/* Dashed inner ring */}
      <div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: 34,
          // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:paper-design-dashed-ring owner:rad-os expires:2026-12-31 issue:DNA-999
          border: '1px dashed oklch(0.65 0.035 90 / 0.3)',
        }}
      />

      {/* Tick ring — 36 ticks around the perimeter */}
      {ticks.map((t) => {
        const isLit = t.index < litCount;
        const dim = !isLit;
        return (
          <div
            key={t.index}
            aria-hidden
            className="absolute left-1/2 top-1/2 pointer-events-none"
            style={{
              width: TICK_WIDTH,
              height: TICK_HEIGHT,
              transformOrigin: `${TICK_WIDTH / 2}px ${OUTER_SIZE / 2 - 8}px`,
              transform: `translate(-${TICK_WIDTH / 2}px, -${OUTER_SIZE / 2 - 8}px) rotate(${t.angleDeg}deg)`,
              // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:paper-design-tick owner:rad-os expires:2026-12-31 issue:DNA-999
              backgroundColor: dim ? 'oklch(0.3 0.015 90 / 1)' : 'oklch(0.88 0.13 93)',
              boxShadow: dim
                ? undefined
                : isPlaying
                  // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:paper-design-tick-glow owner:rad-os expires:2026-12-31 issue:DNA-999
                  ? 'oklch(0.88 0.13 93) 0 0 6px'
                  // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:paper-design-tick-glow-dim owner:rad-os expires:2026-12-31 issue:DNA-999
                  : 'oklch(0.88 0.13 93 / 0.4) 0 0 3px',
              transition: 'box-shadow 120ms ease-out, background-color 120ms ease-out',
            }}
          />
        );
      })}

      {/* Inner circular viewport with <video> */}
      <div
        className="relative overflow-hidden rounded-full"
        style={{
          width: INNER_SIZE,
          height: INNER_SIZE,
          // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:video-backdrop-true-black owner:rad-os expires:2026-12-31 issue:DNA-999
          backgroundColor: 'oklch(0 0 0)',
          // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:inner-chrome-inset owner:rad-os expires:2026-12-31 issue:DNA-999
          boxShadow: 'oklch(0 0 0 / 0.15) 2px 2px 9.6px inset, oklch(0.9780 0.0295 94.34 / 0.1) -2px -2px 9.6px inset',
        }}
      >
        <video
          key={videoSrc}
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        >
          <source src={videoSrc} type="video/mp4" />
        </video>

        {/* CRT scanlines masked to the circle */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:crt-visual-effect owner:rad-os expires:2026-12-31 issue:DNA-999
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, oklch(0 0 0 / 0.15) 2px, oklch(0 0 0 / 0.15) 4px)',
            mixBlendMode: 'multiply',
          }}
        />

        {/* Vignette */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:crt-vignette owner:rad-os expires:2026-12-31 issue:DNA-999
            background: 'radial-gradient(ellipse at center, transparent 50%, oklch(0 0 0 / 0.4) 100%)',
          }}
        />
      </div>
    </div>
  );
}
