'use client';

import { useEffect, useRef, useCallback } from 'react';

export interface OrbitalItem {
  id: string;
  icon: string;
  label: string;
  phaseOffset: number;
  glowColor: string;
  iconScale?: number;
}

const ORBITAL_SPEED = 0.065;
const STREAM_CHARS = '01.:;+=<>|/-\\#@$%&*~^!?[]{}()';
const STREAM_LENGTH = 32;

/* Tailwind class constants for data-stream (set via JS ref) */
const STREAM_BASE =
  'fixed top-0 left-0 z-[4] pointer-events-none origin-left font-mono text-[0.55em] leading-none text-white/25 whitespace-nowrap overflow-visible tracking-[0.15em] transition-[opacity,color,text-shadow,font-size] duration-400';
const STREAM_ACTIVE =
  `${STREAM_BASE} !text-[0.5em] !tracking-[0.08em]`;

function randomStreamChar() {
  return STREAM_CHARS[Math.floor(Math.random() * STREAM_CHARS.length)];
}

function generateStream(len: number) {
  let str = '';
  for (let j = 0; j < len; j++) str += randomStreamChar();
  return str;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export interface OrbitalNavProps {
  /** Array of orbital navigation items */
  items: OrbitalItem[];
  /** Callback when an item is selected */
  onSelect: (id: string) => void;
  /** Whether a window/modal is currently open (triggers dismiss animation) */
  isWindowOpen: boolean;
  /** Currently active item ID */
  activeId: string | null;
  /** Custom CSS class */
  className?: string;
}

/**
 * OrbitalNav - Animated circular navigation with orbital motion
 *
 * Features:
 * - Smooth orbital animation with organic drift
 * - Mouse gravity pull effect
 * - Spiral dismiss/return animations
 * - Data stream visual connections
 * - Scramble-reveal labels on hover
 */
export function OrbitalNav({
  items,
  onSelect,
  isWindowOpen,
  activeId,
  className = ''
}: OrbitalNavProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const anglesRef = useRef<number[]>(items.map((item) => item.phaseOffset));
  const rafRef = useRef<number>(0);
  const iconRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const streamRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isMobileRef = useRef(false);
  const lastTimeRef = useRef<number>(0);
  const isWindowOpenRef = useRef(isWindowOpen);
  const activeIdRef = useRef(activeId);
  const streamTickRefs = useRef<number[]>(items.map(() => 0));
  const hoveredIndexRef = useRef<number>(-1);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const labelProgressRef = useRef<number[]>(items.map(() => 0));
  const mouseRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 });
  // Phantom angle - always advances at full speed (where the icon "should" be)
  const phantomAnglesRef = useRef<number[]>(items.map((item) => item.phaseOffset));

  // Smooth position interpolation
  const currentPosRef = useRef<{ x: number; y: number; scale: number; opacity: number }[]>(
    items.map(() => ({ x: 0, y: 0, scale: 1, opacity: 1 }))
  );
  const initializedRef = useRef(false);
  const spawnTimeRef = useRef<number>(0);
  const SPAWN_DELAY = 1.2; // seconds before icons start appearing
  const SPAWN_STAGGER = 0.15; // seconds between each icon emerging

  // Dismiss/return stagger
  const dismissTimeRef = useRef<number>(0);
  const returnTimeRef = useRef<number>(0);
  const clickedIndexRef = useRef<number>(-1);
  const prevModalOpenRef = useRef(false);
  const DISMISS_STAGGER = 0.08;
  const RETURN_STAGGER = 0.12;
  // Per-icon spiral dismiss state
  const dismissRadiusRef = useRef<number[]>(items.map(() => -1));
  const dismissAngleRef = useRef<number[]>(items.map(() => 0));
  const frozenAnglesRef = useRef<number[]>(items.map(() => 0));

  useEffect(() => { isWindowOpenRef.current = isWindowOpen; }, [isWindowOpen]);
  useEffect(() => {
    activeIdRef.current = activeId;
    if (activeId) {
      clickedIndexRef.current = items.findIndex((item) => item.id === activeId);
    }
  }, [activeId, items]);

  const animate = useCallback((time: number) => {
    if (isMobileRef.current) return;

    const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0.016;
    lastTimeRef.current = time;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2;
    const cy = h / 2;
    const orbitR = h * 0.33;
    const modalOpen = isWindowOpenRef.current;
    const hovIdx = hoveredIndexRef.current;

    // Smoothing factor
    const smoothing = 1 - Math.pow(0.0005, dt);

    // Detect modal open/close transitions
    if (modalOpen && !prevModalOpenRef.current) {
      dismissTimeRef.current = time * 0.001;
      for (let j = 0; j < items.length; j++) {
        frozenAnglesRef.current[j] = anglesRef.current[j];
        dismissAngleRef.current[j] = 0;
      }
    } else if (!modalOpen && prevModalOpenRef.current) {
      returnTimeRef.current = time * 0.001;
      for (let j = 0; j < items.length; j++) {
        dismissRadiusRef.current[j] = -1;
        dismissAngleRef.current[j] = 0;
        anglesRef.current[j] = frozenAnglesRef.current[j];
        phantomAnglesRef.current[j] = frozenAnglesRef.current[j];
      }
    }
    prevModalOpenRef.current = modalOpen;

    // Build dismiss/return order: clicked icon goes last
    const clickedIdx = clickedIndexRef.current;
    const staggerOrder: number[] = [];
    for (let i = 0; i < items.length; i++) {
      if (i !== clickedIdx) staggerOrder.push(i);
    }
    if (clickedIdx >= 0) staggerOrder.push(clickedIdx);
    const orderRank: number[] = new Array(items.length);
    staggerOrder.forEach((idx, rank) => { orderRank[idx] = rank; });

    items.forEach((item, i) => {
      const el = iconRefs.current[i];
      const elW = el ? el.offsetWidth : 64;
      const elH = el ? el.offsetHeight : 64;

      let targetX: number;
      let targetY: number;
      let targetScale: number;
      let targetOpacity: number;

      if (modalOpen) {
        // Spiral dismiss animation
        const elapsed = time * 0.001 - dismissTimeRef.current;
        const myDelay = orderRank[i] * DISMISS_STAGGER;
        const ANTICIPATION = 0.15;
        const baseAngle = frozenAnglesRef.current[i];

        if (elapsed < myDelay) {
          dismissRadiusRef.current[i] = -1;
          dismissAngleRef.current[i] += ORBITAL_SPEED * dt;
          const angle = baseAngle + dismissAngleRef.current[i];
          targetX = cx + orbitR * Math.cos(angle);
          targetY = cy + orbitR * Math.sin(angle);
          targetScale = 1;
          targetOpacity = 1;
        } else if (elapsed < myDelay + ANTICIPATION) {
          if (dismissRadiusRef.current[i] < 0) dismissRadiusRef.current[i] = orbitR;
          const antProg = (elapsed - myDelay) / ANTICIPATION;
          const r = orbitR * (1 + 0.04 * Math.sin(antProg * Math.PI));
          dismissRadiusRef.current[i] = r;
          dismissAngleRef.current[i] += ORBITAL_SPEED * dt * 0.5;
          const angle = baseAngle + dismissAngleRef.current[i];
          targetX = cx + r * Math.cos(angle);
          targetY = cy + r * Math.sin(angle);
          targetScale = 0.95;
          targetOpacity = 0.9;
        } else {
          if (dismissRadiusRef.current[i] < 0) dismissRadiusRef.current[i] = orbitR;
          const r = dismissRadiusRef.current[i];
          const shrinkSpeed = orbitR * (0.8 + 3.0 * Math.pow(1 - r / orbitR, 2));
          dismissRadiusRef.current[i] = Math.max(0, r - shrinkSpeed * dt);
          const angularBoost = orbitR / Math.max(r, 8);
          dismissAngleRef.current[i] += ORBITAL_SPEED * dt * (1 + angularBoost * angularBoost * 0.8);
          const angle = baseAngle + dismissAngleRef.current[i];
          const newR = dismissRadiusRef.current[i];
          targetX = cx + newR * Math.cos(angle);
          targetY = cy + newR * Math.sin(angle);
          const rNorm = newR / orbitR;
          targetScale = Math.max(0, rNorm * 0.9 + 0.1 * rNorm * rNorm);
          targetOpacity = Math.max(0, rNorm);
        }
      } else {
        // ORBITING: organic drift orbit
        phantomAnglesRef.current[i] += ORBITAL_SPEED * dt;

        const isHov = hovIdx === i;
        if (!isHov) {
          const gap = phantomAnglesRef.current[i] - anglesRef.current[i];
          if (Math.abs(gap) < 0.001) {
            anglesRef.current[i] = phantomAnglesRef.current[i];
          } else {
            const catchupMult = Math.min(4, 1 + gap * 3);
            anglesRef.current[i] += ORBITAL_SPEED * dt * catchupMult;
            if (anglesRef.current[i] > phantomAnglesRef.current[i]) {
              anglesRef.current[i] = phantomAnglesRef.current[i];
            }
          }
        }
        const angle = anglesRef.current[i];
        const t = time * 0.001;
        const seed = item.phaseOffset * 7.3;
        const radiusDrift = orbitR * (
          0.015 * Math.sin(t * 0.7 + seed) +
          0.01 * Math.sin(t * 1.3 + seed * 2.1) +
          0.008 * Math.sin(t * 2.1 + seed * 0.6)
        );
        const yBob = 4 * Math.sin(t * 0.9 + seed * 1.4) + 2 * Math.sin(t * 1.7 + seed * 0.8);
        targetX = cx + (orbitR + radiusDrift) * Math.cos(angle);
        targetY = cy + (orbitR + radiusDrift) * Math.sin(angle) + yBob;
        targetScale = 1 + 0.02 * Math.sin(t * 0.5 + seed);
        targetOpacity = 1;
      }

      // Mouse gravity pull
      if (!modalOpen) {
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        const dx = mx - targetX;
        const dy = my - targetY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const gravityRadius = 200;
        const maxPull = 25;

        if (dist < gravityRadius && dist > 1) {
          const strength = (1 - dist / gravityRadius) ** 2;
          const pull = strength * maxPull;
          targetX += (dx / dist) * pull;
          targetY += (dy / dist) * pull;
        }
      }

      const cur = currentPosRef.current[i];

      if (!initializedRef.current) {
        spawnTimeRef.current = time * 0.001;
        cur.x = cx;
        cur.y = cy;
        cur.scale = 0;
        cur.opacity = 0;
      }

      const elapsed = time * 0.001 - spawnTimeRef.current;
      const iconSpawnTime = SPAWN_DELAY + i * SPAWN_STAGGER;
      const spawning = elapsed < iconSpawnTime;

      if (spawning) {
        targetX = cx;
        targetY = cy;
        targetScale = 0;
        targetOpacity = 0;
      }

      const returnElapsed = time * 0.001 - returnTimeRef.current;
      const reverseRank = items.length - 1 - orderRank[i];
      const returnDelay = reverseRank * RETURN_STAGGER;
      const returning = !modalOpen && returnTimeRef.current > 0 && returnElapsed < returnDelay;

      if (returning) {
        targetX = cx;
        targetY = cy;
        targetScale = 0;
        targetOpacity = 0;
      }

      {
        const gap = Math.abs(phantomAnglesRef.current[i] - anglesRef.current[i]);
        const catchupFactor = Math.min(1, 1 - gap * 2);
        const driftSmoothing = smoothing * (0.25 + 0.75 * Math.max(0, catchupFactor));

        const isEmerging = spawning || returning;
        const isDismissing = modalOpen && dismissRadiusRef.current[i] >= 0;

        let effectiveSmoothing: number;
        if (isDismissing) {
          effectiveSmoothing = smoothing * 2.5;
        } else if (isEmerging) {
          const emergeTime = spawning ? iconSpawnTime : returnDelay;
          const emergeElapsed = spawning ? elapsed : returnElapsed;
          const emergeProgress = Math.min(1, (emergeElapsed - emergeTime) / 1.0);
          effectiveSmoothing = driftSmoothing * (0.15 + 0.85 * (isEmerging ? 0 : emergeProgress));
        } else {
          const emergeTime = spawning ? iconSpawnTime : returnDelay;
          const emergeElapsed = spawning ? elapsed : returnElapsed;
          const emergeProgress = Math.min(1, (emergeElapsed - emergeTime) / 1.0);
          effectiveSmoothing = driftSmoothing * (0.15 + 0.85 * emergeProgress);
        }

        cur.x = lerp(cur.x, targetX, effectiveSmoothing);
        cur.y = lerp(cur.y, targetY, effectiveSmoothing);
        cur.scale = lerp(cur.scale, targetScale, effectiveSmoothing);
        cur.opacity = lerp(cur.opacity, targetOpacity, effectiveSmoothing);
      }

      if (el) {
        el.style.transform = `translate(${cur.x - elW / 2}px, ${cur.y - elH / 2}px) scale(${cur.scale.toFixed(3)})`;
        el.style.opacity = cur.opacity.toFixed(3);
      }

      // Update stream
      const stream = streamRefs.current[i];
      if (!stream) return;

      const dismissElapsed = time * 0.001 - dismissTimeRef.current;
      const myDismissDelay = orderRank[i] * DISMISS_STAGGER;
      const streamFadingOut = modalOpen && dismissElapsed >= (myDismissDelay - 0.1);
      const iconVisible = cur.opacity > 0.05 && !streamFadingOut;
      if (!iconVisible) {
        stream.style.opacity = '0';
        stream.className = STREAM_BASE;
        return;
      }

      const dx = cx - cur.x;
      const dy = cy - cur.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle2 = Math.atan2(dy, dx) * (180 / Math.PI);

      stream.style.left = `${cur.x}px`;
      stream.style.top = `${cur.y}px`;
      stream.style.width = `${dist}px`;
      stream.style.transform = `rotate(${angle2}deg)`;

      const glow = item.glowColor;
      const isHov = hovIdx === i;

      if (isHov) {
        stream.style.opacity = '1';
        stream.style.color = 'color-mix(in srgb, var(--color-main) 85%, transparent)';
        stream.style.textShadow = `0 0 0.5em ${glow}, 0 0 1.5em ${glow}B3, 0 0 3em ${glow}66`;
        stream.className = STREAM_ACTIVE;
      } else {
        stream.style.opacity = '0.35';
        stream.style.color = 'color-mix(in srgb, var(--color-main) 50%, transparent)';
        stream.style.textShadow = `0 0 0.4em ${glow}99, 0 0 1.2em ${glow}4D, 0 0 2em ${glow}26`;
        stream.className = STREAM_ACTIVE;
      }

      const tickRate = isHov ? 0.06 : 0.12;
      const charCount = STREAM_LENGTH * 2;
      streamTickRefs.current[i] += dt;
      if (streamTickRefs.current[i] > tickRate) {
        streamTickRefs.current[i] = 0;
        stream.textContent = generateStream(charCount);
      }
    });

    // Scramble-reveal labels on hover
    items.forEach((item, i) => {
      const label = labelRefs.current[i];
      if (!label) return;
      const isHovered = hovIdx === i;
      const progress = labelProgressRef.current[i];

      if (isHovered && progress < 1) {
        labelProgressRef.current[i] = Math.min(1, progress + dt * 3);
      } else if (!isHovered && progress > 0) {
        labelProgressRef.current[i] = Math.max(0, progress - dt * 6);
      }

      const p = labelProgressRef.current[i];
      if (p <= 0) {
        label.textContent = '';
        label.style.opacity = '0';
      } else {
        label.style.opacity = '1';
        const target = item.label.toUpperCase();
        let result = '';
        for (let c = 0; c < target.length; c++) {
          const revealPoint = c / target.length;
          if (p > revealPoint + 0.15) {
            result += target[c];
          } else if (p > revealPoint - 0.1) {
            result += STREAM_CHARS[Math.floor(Math.random() * STREAM_CHARS.length)];
          } else {
            result += ' ';
          }
        }
        label.textContent = result;
      }
    });

    initializedRef.current = true;
    rafRef.current = requestAnimationFrame(animate);
  }, [items]);

  useEffect(() => {
    const checkMobile = () => {
      isMobileRef.current = window.innerWidth <= 768;
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const trackMouse = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener('mousemove', trackMouse);

    if (!isMobileRef.current) {
      rafRef.current = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('mousemove', trackMouse);
    };
  }, [animate]);

  return (
    <>
      {items.map((item, i) => (
        <div
          key={`stream-${item.id}`}
          ref={(el) => { streamRefs.current[i] = el; }}
          className={STREAM_BASE}
          aria-hidden="true"
        />
      ))}
      <div ref={layerRef} className={`absolute inset-0 z-[5] pointer-events-none ${className}`.trim()}>
        {items.map((item, i) => (
          <button
            key={item.id}
            ref={(el) => { iconRefs.current[i] = el; }}
            className="group absolute top-0 left-0 pointer-events-auto bg-transparent border-none p-0 cursor-pointer outline-none will-change-transform flex flex-col items-center justify-center opacity-0 select-none [-webkit-tap-highlight-color:transparent]"
            style={{ '--icon-glow': item.glowColor } as React.CSSProperties}
            onClick={() => onSelect(item.id)}
            onMouseEnter={() => { hoveredIndexRef.current = i; }}
            onMouseLeave={() => { hoveredIndexRef.current = -1; }}
            aria-label={item.label}
          >
            <img
              src={item.icon}
              alt={item.label}
              width={48}
              height={48}
              draggable={false}
              className={[
                'h-[3em] w-auto [image-rendering:pixelated] select-none',
                'transition-[filter,transform] duration-300 [transition-timing-function:var(--easing-drift)]',
                'group-hover:scale-110',
                'group-active:scale-90 group-active:duration-100',
                activeId === item.id
                  ? '[filter:drop-shadow(0_0_0.25em_var(--icon-glow))]'
                  : 'group-hover:[filter:drop-shadow(0_0_0.3em_var(--icon-glow))]',
              ].join(' ')}
              style={item.iconScale ? { transform: `scale(${item.iconScale})` } : undefined}
            />
            <span
              className="absolute top-full left-1/2 -translate-x-1/2 font-mono text-[0.875em] uppercase tracking-[0.08em] text-main text-center mt-[0.3em] pointer-events-none whitespace-nowrap opacity-0"
              ref={(el) => { labelRefs.current[i] = el; }}
            />
          </button>
        ))}
      </div>
    </>
  );
}

export default OrbitalNav;
