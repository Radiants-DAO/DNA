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
        // eslint-disable-next-line rdna/no-hardcoded-colors, rdna/no-raw-shadow -- reason:paper-design-black-disc-and-inset owner:rad-os expires:2026-12-31 issue:DNA-999
        backgroundColor: 'oklch(0 0 0)',
        boxShadow: 'oklch(0 0 0 / 0.15) 2px 2px 9.6px inset, oklch(0.9780 0.0295 94.34 / 0.1) -2px -2px 9.6px inset',
        borderLeft: '3px solid oklch(0 0 0)',
        ...style,
      }}
    >
      {/* Solid subtle outer ring. Paper hex #EFDC8A2E (paler yellow 18%). */}
      <div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: 20,
          // eslint-disable-next-line rdna/no-hardcoded-colors, rdna/no-raw-shadow -- reason:paper-design-ring owner:rad-os expires:2026-12-31 issue:DNA-999
          border: '1px solid oklch(0.89 0.11 93 / 0.18)',
          boxShadow: 'oklch(0 0 0 / 0.8) 0 0 30px inset',
        }}
      />

      {/* Dashed inner ring. Paper hex #8A7F554D. */}
      <div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: 34,
          // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:paper-design-dashed-ring owner:rad-os expires:2026-12-31 issue:DNA-999
          border: '1px dashed oklch(0.56 0.03 90 / 0.3)',
        }}
      />

      {/* Tick ring — 36 ticks around the perimeter.
          Lit cells advance with track progress; the topmost lit cell (the
          playhead) glows white. Paper hex reference: lit #EFDC8A, dim #3A3528,
          playhead pure white with white glow. */}
      {ticks.map((t) => {
        const isLit = t.index < litCount;
        const isPlayhead = isPlaying && isLit && t.index === litCount - 1;
        // eslint-disable-next-line rdna/no-hardcoded-colors, rdna/no-raw-shadow, rdna/no-hardcoded-motion -- reason:paper-design-tick-palette owner:rad-os expires:2026-12-31 issue:DNA-999
        const litColor = 'oklch(0.89 0.11 93)';
        const dimColor = 'oklch(0.27 0.015 90)';
        const playheadColor = 'oklch(1 0 0)';
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
              backgroundColor: isPlayhead ? playheadColor : isLit ? litColor : dimColor,
              boxShadow: isPlayhead
                ? `${playheadColor} 0 0 10px`
                : isLit
                  ? `${litColor} 0 0 6px`
                  : undefined,
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
