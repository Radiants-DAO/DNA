'use client';

import { RefObject, useEffect, useRef, useState } from 'react';
import { Icon, RadSunLogo } from '@rdna/radiants/icons';
import { formatDuration, type Track } from '@/lib/mockData/tracks';
import { Slider } from '@rdna/radiants/components/core';

interface MusicTabProps {
  audioRef: RefObject<HTMLAudioElement | null>;
  currentTrack: Track;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (value: number) => void;
}

// Turntable physics constants
const TARGET_SPEED = 2;    // deg/frame at 60fps → ~3s per revolution
const ACCEL        = 0.04; // deg/frame² spin-up  → full speed in ~0.8s
const DECEL        = 0.025;// deg/frame² coast-down → stop in ~1.3s

export function MusicTab({
  currentTrack,
  isPlaying,
  currentTime,
  volume,
  onPlayPause,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
}: MusicTabProps) {
  const progress = currentTrack.duration > 0 ? (currentTime / currentTrack.duration) * 100 : 0;

  // What's rendered on the label — swaps while record is off-screen
  const [displayedTrack, setDisplayedTrack] = useState<Track>(currentTrack);

  const recordRef    = useRef<HTMLDivElement>(null); // inner spinning div (rotate)
  const slideRef     = useRef<HTMLDivElement>(null); // outer slide div (translateX)
  const rotRef       = useRef(0);
  const speedRef     = useRef(0);
  const frameRef     = useRef<number | undefined>(undefined);
  const isRollingRef = useRef(false); // pauses RAF writes during roll animation
  const timeoutRef   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Turntable RAF loop ──────────────────────────────────────────────────────
  useEffect(() => {
    const animate = () => {
      if (isPlaying) {
        speedRef.current = Math.min(speedRef.current + ACCEL, TARGET_SPEED);
      } else {
        speedRef.current = Math.max(speedRef.current - DECEL, 0);
      }

      // Yield to roll animation when active
      if (speedRef.current > 0 && !isRollingRef.current) {
        rotRef.current = (rotRef.current + speedRef.current) % 360;
        if (recordRef.current) {
          recordRef.current.style.transform = `rotate(${rotRef.current}deg)`;
        }
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
    };
  }, [isPlaying]);

  // ── Record swap: slide out right, roll in from left ─────────────────────────
  useEffect(() => {
    if (currentTrack.id === displayedTrack.id) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    isRollingRef.current = true;

    const slide  = slideRef.current;
    const record = recordRef.current;
    if (!slide || !record) return;

    // 1. Slide out to the right (fast, thrown)
    slide.style.transition  = 'transform 0.22s cubic-bezier(0.4, 0, 1, 1)';
    slide.style.transform   = 'translateX(115%)';

    timeoutRef.current = setTimeout(() => {
      // 2. Snap to left, no transition
      slide.style.transition  = 'none';
      slide.style.transform   = 'translateX(-115%)';

      // 3. Pre-spin the record: -720deg = two full clockwise rotations away from 0
      //    (rolling rightward = clockwise = negative starting angle)
      record.style.transition = 'none';
      record.style.transform  = 'rotate(-720deg)';

      // 4. Swap label content while off-screen
      setDisplayedTrack(currentTrack);

      // 5. Next paint: slide in + roll to 0° simultaneously
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const dur = '0.55s';
          const ease = 'cubic-bezier(0.15, 0.85, 0.3, 1)'; // strong ease-out, slight overshoot

          slide.style.transition  = `transform ${dur} ${ease}`;
          slide.style.transform   = 'translateX(0)';

          record.style.transition = `transform ${dur} ${ease}`;
          record.style.transform  = 'rotate(0deg)';

          timeoutRef.current = setTimeout(() => {
            // 6. Hand rotation back to RAF loop at 0°
            rotRef.current = 0;
            record.style.transition = 'none';
            isRollingRef.current = false;
          }, 550);
        });
      });
    }, 220);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack.id]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    onSeek((x / rect.width) * currentTrack.duration);
  };

  return (
    <div
      className="h-full flex flex-col px-3 py-4"
      // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:decorative-gradient owner:rad-os expires:2026-12-31 issue:DNA-999
      style={{ background: 'linear-gradient(0deg, rgba(252,225,132,1) 0%, rgba(254,248,226,1) 100%)' }}
    >

      {/* Album art area */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="relative w-96 h-96">

          {/* ── Slide container ── */}
          <div ref={slideRef} className="absolute inset-0">

            {/* ── Spinning layer: body + grooves + label + logo ── */}
            <div ref={recordRef} className="relative w-full h-full">
              <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="vinyl-body" cx="50%" cy="50%" r="50%">
                    <stop offset="0%"   stopColor="#0F0E0C" />
                    <stop offset="100%" stopColor="#000000" />
                  </radialGradient>
                  <radialGradient id="label-bg" cx="40%" cy="35%" r="70%">
                    <stop offset="0%"   stopColor="#fce184" />
                    <stop offset="100%" stopColor="#D4A830" />
                  </radialGradient>
                </defs>

                {/* Record body */}
                <circle cx="100" cy="100" r="99" fill="url(#vinyl-body)" />

                {/* Groove rings — alternating light/shadow edges */}
                {Array.from({ length: 28 }, (_, i) => 40 + i * 2.1).map((r, i) => (
                  <circle
                    key={r}
                    cx="100" cy="100" r={r}
                    fill="none"
                    stroke={i % 2 === 0 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.4)'}
                    strokeWidth="0.75"
                  />
                ))}

                {/* Center label */}
                <circle cx="100" cy="100" r="34" fill="url(#label-bg)" />
                <circle cx="100" cy="100" r="33.5" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />

                {/* Track title — below spindle hole */}
                <text
                  x="100" y="113"
                  textAnchor="middle"
                  fill="#0F0E0C"
                  fontSize="4.8"
                  fontFamily="'Joystix', monospace"
                  letterSpacing="0.3"
                >
                  {displayedTrack.title.toUpperCase().slice(0, 14)}
                </text>

                {/* Artist — below title */}
                <text
                  x="100" y="121"
                  textAnchor="middle"
                  fill="#0F0E0C"
                  fontSize="3.6"
                  fontFamily="monospace"
                  letterSpacing="0.5"
                  opacity="0.7"
                >
                  {displayedTrack.artist.toUpperCase().slice(0, 16)}
                </text>

                {/* Outer edge ring */}
                <circle cx="100" cy="100" r="98.5" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />

                {/* Spindle hole */}
                <circle cx="100" cy="100" r="3" fill="#0F0E0C" />
              </svg>

              {/* Conic shimmer — makes rotation visible */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:decorative-gradient owner:rad-os expires:2026-12-31 issue:DNA-999
                  background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.07) 18deg, transparent 36deg, transparent 170deg, rgba(255,255,255,0.04) 188deg, transparent 206deg, transparent 360deg)',
                  mixBlendMode: 'screen',
                }}
              />

              {/* RAD logo — upper portion of label, rotates with record */}
              <div
                className="absolute inset-x-0 flex justify-center pointer-events-none"
                style={{ top: '41%' }}
              >
                <RadSunLogo className="w-16 h-6" color="black" />
              </div>
            </div>

            {/* ── Static specular sheen — never rotates ── */}
            <div className="absolute inset-0 rounded-full pointer-events-none overflow-hidden">
              <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="vinyl-sheen" cx="32%" cy="28%" r="68%">
                    <stop offset="0%"   stopColor="white" stopOpacity="0.18" />
                    <stop offset="45%"  stopColor="white" stopOpacity="0.03" />
                    <stop offset="100%" stopColor="black" stopOpacity="0.18" />
                  </radialGradient>
                </defs>
                <circle cx="100" cy="100" r="100" fill="url(#vinyl-sheen)" />
              </svg>
            </div>

            {/* ── Dither grain overlay — static ── */}
            <div className="absolute inset-0 rounded-full pointer-events-none overflow-hidden">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="dither-grain" x="0%" y="0%" width="100%" height="100%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" seed="7" stitchTiles="stitch" result="noise" />
                    <feColorMatrix type="saturate" values="0" in="noise" result="gray" />
                    <feComponentTransfer in="gray">
                      <feFuncR type="discrete" tableValues="0 1" />
                      <feFuncG type="discrete" tableValues="0 1" />
                      <feFuncB type="discrete" tableValues="0 1" />
                    </feComponentTransfer>
                  </filter>
                  <clipPath id="record-clip">
                    <circle cx="50%" cy="50%" r="50%" />
                  </clipPath>
                </defs>
                <rect
                  width="100%" height="100%"
                  filter="url(#dither-grain)"
                  fill="white"
                  opacity="0.09"
                  clipPath="url(#record-clip)"
                />
              </svg>
            </div>

          </div>
        </div>
      </div>

      {/* Track info */}
      <div className="text-center py-3">
        <h3>{currentTrack.title}</h3>
        <p>{currentTrack.artist}</p>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div
          className="h-1 bg-depth rounded-full cursor-pointer relative overflow-hidden"
          onClick={handleProgressClick}
        >
          <div
            className="absolute left-0 top-0 h-full bg-accent rounded-full transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between">
          <span className="font-mono text-xs text-mute">{formatDuration(currentTime)}</span>
          <span className="font-mono text-xs text-mute">{formatDuration(currentTrack.duration)}</span>
        </div>
      </div>

      {/* Volume slider */}
      <div className="pb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mondwest text-sm text-main">Volume</span>
          <span className="font-mono text-sm text-mute">{volume}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="volume-high" size={20} className="text-sub shrink-0" />
          <div className="flex-1">
            <Slider
              value={volume}
              onChange={onVolumeChange}
              min={0}
              max={100}
              step={1}
              size="sm"
              className="space-y-0"
            />
          </div>
        </div>
      </div>

    </div>
  );
}
