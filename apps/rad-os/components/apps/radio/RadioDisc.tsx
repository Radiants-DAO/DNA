'use client';

import { useEffect, useMemo, useRef } from 'react';

// =============================================================================
// RadioDisc — Embedded circular video viewport at the bottom of the Radio LCD.
//
// The element itself IS the bubble — a single `aspect-square w-full
// rounded-full` container that fills the LCD's width. Its curved bottom half
// registers with the LCD's bowl-shaped bottom so the frame wraps it cleanly.
//
// Layers, composed back-to-front inside the same round container:
//   • Fisheye-warped <video> (scaled up so warped edges stay covered)
//   • CRT scanlines
//   • Radial vignette + upper-left specular highlight
//   • Tick ring — 36 bars just inside the rim, progressing with playback
//   • Faint sun-yellow reticle crosshair
// A heavy multi-layer box-shadow supplies the convex bubble shading.
// =============================================================================

const TICK_COUNT = 36;
// Tick ring is drawn in a 100×100 SVG viewBox (square). All tick dimensions
// below are expressed in that coordinate system so the ring scales with the
// parent container width.
const TICK_LEN = 5.5; // ~14px if the parent ends up ~240px wide
const TICK_W = 0.4;   // ~1px at the same scale
const TICK_INSET = 1.2; // distance from the outer edge to the tick base

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
  /** Optional extra className for the outer container */
  className?: string;
}

export function RadioDisc({
  currentTime,
  duration,
  isPlaying,
  videoSrc,
  onVideoEnded,
  style,
  className = '',
}: RadioDiscProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onEndedRef = useRef(onVideoEnded);
  onEndedRef.current = onVideoEnded;

  const progress = duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0;

  const ticks = useMemo(() => {
    return Array.from({ length: TICK_COUNT }, (_, i) => {
      const angleDeg = i * (360 / TICK_COUNT);
      return { angleDeg, index: i };
    });
  }, []);

  const litCount =
    progress >= 0.98 ? TICK_COUNT : Math.min(TICK_COUNT, Math.round(progress * TICK_COUNT));

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
      className={[
        'relative w-full aspect-square overflow-hidden rounded-full',
        className,
      ].filter(Boolean).join(' ')}
      style={{
        // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:video-backdrop-true-black owner:rad-os expires:2026-12-31 issue:https://github.com/Radiants-DAO/DNA/blob/main/docs/solutions/tooling/rdna-approved-exceptions.md#radio-disc-crt-glass-art-rendering
        backgroundColor: 'oklch(0 0 0)',
        // eslint-disable-next-line rdna/no-hardcoded-colors, rdna/no-raw-shadow -- reason:paper-design-bubble-shading owner:rad-os expires:2026-12-31 issue:https://github.com/Radiants-DAO/DNA/blob/main/docs/solutions/tooling/rdna-approved-exceptions.md#radio-disc-crt-glass-art-rendering
        boxShadow: [
          // Outer cast shadow so the bubble reads as "sitting" on the LCD.
          '0 6px 14px oklch(0 0 0 / 0.55)',
          '0 2px 4px oklch(0 0 0 / 0.5)',
          // Deep rim inset darkening all around (Paper's `0 0 30px #000 80% inset`).
          '0 0 36px oklch(0 0 0 / 0.85) inset',
          // Secondary inset darkening at the bottom-right (shaded side).
          '-8px -10px 22px oklch(0 0 0 / 0.45) inset',
          // Subtle warm highlight at the upper-left (lit side).
          '6px 6px 16px oklch(0.9780 0.0295 94.34 / 0.15) inset',
          // Crisp 1px inner ring for a "glass edge" feel.
          '0 0 0 1px oklch(0.89 0.11 93 / 0.18) inset',
        ].join(', '),
        ...style,
      }}
    >
      {/* SVG fisheye filter — displaces pixels via a radial R/G gradient map. */}
      <svg
        aria-hidden
        width="0"
        height="0"
        className="absolute pointer-events-none"
      >
        <defs>
          <filter id="radio-fisheye" x="0" y="0" width="100%" height="100%">
            <feImage
              result="fisheyeMap"
              preserveAspectRatio="none"
              href={
                'data:image/svg+xml;utf8,' +
                encodeURIComponent(
                  `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'>
                    <defs>
                      <linearGradient id='rg' x1='0%' y1='0%' x2='100%' y2='0%'>
                        <stop offset='0%' stop-color='rgb(255,128,128)'/>
                        <stop offset='50%' stop-color='rgb(128,128,128)'/>
                        <stop offset='100%' stop-color='rgb(0,128,128)'/>
                      </linearGradient>
                      <linearGradient id='gg' x1='0%' y1='0%' x2='0%' y2='100%'>
                        <stop offset='0%' stop-color='rgb(128,255,128)'/>
                        <stop offset='50%' stop-color='rgb(128,128,128)'/>
                        <stop offset='100%' stop-color='rgb(128,0,128)'/>
                      </linearGradient>
                    </defs>
                    <rect width='100%' height='100%' fill='url(#rg)'/>
                    <rect width='100%' height='100%' fill='url(#gg)' style='mix-blend-mode:screen'/>
                  </svg>`,
                )
              }
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="fisheyeMap"
              scale="-28"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Video — fills the circle edge-to-edge; fisheye warp + slight scale. */}
      <video
        key={videoSrc}
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        muted
        autoPlay
        loop
        style={{
          filter: 'url(#radio-fisheye)',
          transform: 'scale(1.14)',
          transformOrigin: 'center',
        }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* CRT scanlines */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:crt-visual-effect owner:rad-os expires:2026-12-31 issue:https://github.com/Radiants-DAO/DNA/blob/main/docs/solutions/tooling/rdna-approved-exceptions.md#radio-disc-crt-glass-art-rendering
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, oklch(0 0 0 / 0.15) 2px, oklch(0 0 0 / 0.15) 4px)',
          mixBlendMode: 'multiply',
        }}
      />

      {/* Fisheye vignette */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:crt-fisheye-vignette owner:rad-os expires:2026-12-31 issue:https://github.com/Radiants-DAO/DNA/blob/main/docs/solutions/tooling/rdna-approved-exceptions.md#radio-disc-crt-glass-art-rendering
          background:
            'radial-gradient(circle at center, transparent 40%, oklch(0 0 0 / 0.35) 80%, oklch(0 0 0 / 0.7) 100%)',
        }}
      />

      {/* Glass specular highlight */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:crt-glass-specular owner:rad-os expires:2026-12-31 issue:https://github.com/Radiants-DAO/DNA/blob/main/docs/solutions/tooling/rdna-approved-exceptions.md#radio-disc-crt-glass-art-rendering
          background:
            'radial-gradient(ellipse 60% 45% at 32% 24%, oklch(1 0 0 / 0.18) 0%, oklch(1 0 0 / 0.06) 35%, transparent 70%)',
          mixBlendMode: 'screen',
        }}
      />

      {/* Tick ring — 36 radial ticks inside the circle's rim. 100×100 viewBox
          scales with the container so ticks always sit flush against the inner
          perimeter. */}
      <svg
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        {ticks.map((t) => {
          const isLit = t.index < litCount;
          const isPlayhead = isPlaying && isLit && t.index === litCount - 1;
          // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:paper-design-tick-palette owner:rad-os expires:2026-12-31 issue:https://github.com/Radiants-DAO/DNA/blob/main/docs/solutions/tooling/rdna-approved-exceptions.md#radio-disc-crt-glass-art-rendering
          const litColor = 'oklch(0.76 0.14 85)';
          const dimColor = 'color-mix(in oklch, var(--color-cream) 28%, transparent)';
          const playheadColor = 'var(--color-cream)';
          const stroke = isPlayhead ? playheadColor : isLit ? litColor : dimColor;
          return (
            <line
              key={t.index}
              x1={50}
              y1={TICK_INSET}
              x2={50}
              y2={TICK_INSET + TICK_LEN}
              stroke={stroke}
              strokeWidth={TICK_W}
              strokeLinecap="butt"
              transform={`rotate(${t.angleDeg} 50 50)`}
              style={{
                filter: isPlayhead
                  ? `drop-shadow(0 0 2px ${playheadColor})`
                  : isLit
                    ? `drop-shadow(0 0 1.5px ${litColor})`
                    : undefined,
                transition: 'stroke 120ms ease-out',
              }}
            />
          );
        })}
      </svg>

      {/* Reticle crosshair — thin sun-yellow vertical + horizontal lines. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:paper-design-reticle owner:rad-os expires:2026-12-31 issue:https://github.com/Radiants-DAO/DNA/blob/main/docs/solutions/tooling/rdna-approved-exceptions.md#radio-disc-crt-glass-art-rendering
          backgroundImage: [
            'linear-gradient(to bottom, transparent 0, transparent calc(50% - 0.5px), oklch(0.76 0.14 85 / 0.22) calc(50% - 0.5px), oklch(0.76 0.14 85 / 0.22) calc(50% + 0.5px), transparent calc(50% + 0.5px))',
            'linear-gradient(to right, transparent 0, transparent calc(50% - 0.5px), oklch(0.76 0.14 85 / 0.22) calc(50% - 0.5px), oklch(0.76 0.14 85 / 0.22) calc(50% + 0.5px), transparent calc(50% + 0.5px))',
          ].join(', '),
        }}
      />
    </div>
  );
}
