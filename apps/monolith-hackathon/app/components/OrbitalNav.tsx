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

export const ORBITAL_ITEMS: OrbitalItem[] = [
  { id: 'hackathon', icon: '/icons/clock.svg',    label: 'Hackathon', phaseOffset: 0,              glowColor: '#ef5c6f', iconScale: 1.3 },
  { id: 'calendar', icon: '/icons/calendar.svg', label: 'Calendar', phaseOffset: Math.PI * 0.25, glowColor: '#fd8f3a' },
  { id: 'rules',    icon: '/icons/rules.svg',    label: 'Rules',    phaseOffset: Math.PI * 0.5,  glowColor: '#ef5c6f' },
  { id: 'prizes',   icon: '/icons/prizes.svg',   label: 'Prizes',   phaseOffset: Math.PI * 0.75, glowColor: '#fd8f3a' },
  { id: 'judges',   icon: '/icons/judges.svg',   label: 'Judges',   phaseOffset: Math.PI,        glowColor: '#ef5c6f' },
  { id: 'toolbox',  icon: '/icons/tools.svg',    label: 'Toolbox',  phaseOffset: Math.PI * 1.25, glowColor: '#6939ca', iconScale: 1.3 },
  { id: 'faq',      icon: '/icons/faq.svg',      label: 'FAQ',      phaseOffset: Math.PI * 1.5,  glowColor: '#6939ca' },
  { id: 'legal',    icon: '/icons/docs.svg',     label: 'Legal',    phaseOffset: Math.PI * 1.75, glowColor: '#fd8f3a' },
];

const ORBITAL_SPEED = 0.065;
const STREAM_CHARS = '01.:;+=<>|/-\\#@$%&*~^!?[]{}()';
const STREAM_LENGTH = 32;

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

interface OrbitalNavProps {
  onSelect: (id: string) => void;
  isWindowOpen: boolean;
  activeId: string | null;
}

export default function OrbitalNav({ onSelect, isWindowOpen, activeId }: OrbitalNavProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const anglesRef = useRef<number[]>(ORBITAL_ITEMS.map((item) => item.phaseOffset));
  const rafRef = useRef<number>(0);
  const iconRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const streamRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isMobileRef = useRef(false);
  const lastTimeRef = useRef<number>(0);
  const isWindowOpenRef = useRef(isWindowOpen);
  const activeIdRef = useRef(activeId);
  const streamTickRefs = useRef<number[]>(ORBITAL_ITEMS.map(() => 0));
  const hoveredIndexRef = useRef<number>(-1);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const labelProgressRef = useRef<number[]>(ORBITAL_ITEMS.map(() => 0));
  const mouseRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 });
  // Phantom angle — always advances at full speed (where the icon "should" be)
  const phantomAnglesRef = useRef<number[]>(ORBITAL_ITEMS.map((item) => item.phaseOffset));

  // Smooth position interpolation
  const currentPosRef = useRef<{ x: number; y: number; scale: number; opacity: number }[]>(
    ORBITAL_ITEMS.map(() => ({ x: 0, y: 0, scale: 1, opacity: 1 }))
  );
  const initializedRef = useRef(false);
  const spawnTimeRef = useRef<number>(0); // time of first frame
  const SPAWN_DELAY = 1.2; // seconds before icons start appearing (match shader)
  const SPAWN_STAGGER = 0.15; // seconds between each icon emerging

  // Dismiss/return stagger — tracks when modal opened/closed and which icon was clicked
  const dismissTimeRef = useRef<number>(0);
  const returnTimeRef = useRef<number>(0);
  const clickedIndexRef = useRef<number>(-1);
  const prevModalOpenRef = useRef(false);
  const DISMISS_STAGGER = 0.08; // seconds between each icon retreating
  const RETURN_STAGGER = 0.12; // seconds between each icon emerging back
  // Per-icon spiral dismiss state
  const dismissRadiusRef = useRef<number[]>(ORBITAL_ITEMS.map(() => -1)); // -1 = not dismissing
  const dismissAngleRef = useRef<number[]>(ORBITAL_ITEMS.map(() => 0)); // spiral angle offset
  const frozenAnglesRef = useRef<number[]>(ORBITAL_ITEMS.map(() => 0)); // angles at time of dismiss

  useEffect(() => { isWindowOpenRef.current = isWindowOpen; }, [isWindowOpen]);
  useEffect(() => {
    activeIdRef.current = activeId;
    if (activeId) {
      clickedIndexRef.current = ORBITAL_ITEMS.findIndex((item) => item.id === activeId);
    }
  }, [activeId]);

  const animate = useCallback((time: number) => {
    if (isMobileRef.current) return;

    const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0.016;
    lastTimeRef.current = time;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2;
    const cy = h / 2;
    const orbitR = h * 0.33;
    const dockR = h * 0.28;
    const modalOpen = isWindowOpenRef.current;
    const currentActiveId = activeIdRef.current;
    const hovIdx = hoveredIndexRef.current;

    // Smoothing factor — higher = snappier
    const smoothing = 1 - Math.pow(0.0005, dt);

    // Detect modal open/close transitions
    if (modalOpen && !prevModalOpenRef.current) {
      dismissTimeRef.current = time * 0.001;
      // Freeze current angles so we can restore them later
      for (let j = 0; j < ORBITAL_ITEMS.length; j++) {
        frozenAnglesRef.current[j] = anglesRef.current[j];
        dismissAngleRef.current[j] = 0;
      }
    } else if (!modalOpen && prevModalOpenRef.current) {
      returnTimeRef.current = time * 0.001;
      // Restore angles to where they were before dismiss
      for (let j = 0; j < ORBITAL_ITEMS.length; j++) {
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
    for (let i = 0; i < ORBITAL_ITEMS.length; i++) {
      if (i !== clickedIdx) staggerOrder.push(i);
    }
    if (clickedIdx >= 0) staggerOrder.push(clickedIdx);
    // orderRank[i] = position in stagger sequence (0 = first to go, last = clicked)
    const orderRank: number[] = new Array(ORBITAL_ITEMS.length);
    staggerOrder.forEach((idx, rank) => { orderRank[idx] = rank; });

    ORBITAL_ITEMS.forEach((item, i) => {
      const el = iconRefs.current[i];
      const elW = el ? el.offsetWidth : 64;
      const elH = el ? el.offsetHeight : 64;

      let targetX: number;
      let targetY: number;
      let targetScale: number;
      let targetOpacity: number;

      if (modalOpen) {
        // Spiral dismiss — icons spiral inward like matter into a black hole
        // Uses separate dismissAngleRef to avoid corrupting orbit angles
        const elapsed = time * 0.001 - dismissTimeRef.current;
        const myDelay = orderRank[i] * DISMISS_STAGGER;
        const ANTICIPATION = 0.15;
        const baseAngle = frozenAnglesRef.current[i];

        if (elapsed < myDelay) {
          // Waiting — hold at frozen position, gentle drift
          dismissRadiusRef.current[i] = -1;
          dismissAngleRef.current[i] += ORBITAL_SPEED * dt;
          const angle = baseAngle + dismissAngleRef.current[i];
          targetX = cx + orbitR * Math.cos(angle);
          targetY = cy + orbitR * Math.sin(angle);
          targetScale = 1;
          targetOpacity = 1;
        } else if (elapsed < myDelay + ANTICIPATION) {
          // Anticipation — slight outward tidal swell, orbit slows
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
          // Spiral inward — radius shrinks, angular velocity increases
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
        // Phantom always advances — this is where the icon "should" be
        phantomAnglesRef.current[i] += ORBITAL_SPEED * dt;

        const isHov = hovIdx === i;
        if (isHov) {
          // Frozen — don't advance real angle
        } else {
          // Catch up: speed scales with gap between real and phantom angle
          const gap = phantomAnglesRef.current[i] - anglesRef.current[i];
          if (Math.abs(gap) < 0.001) {
            // Close enough — sync exactly and move at normal speed
            anglesRef.current[i] = phantomAnglesRef.current[i];
          } else {
            // Accelerate proportionally to gap (capped at 4x normal speed)
            const catchupMult = Math.min(4, 1 + gap * 3);
            anglesRef.current[i] += ORBITAL_SPEED * dt * catchupMult;
            // Don't overshoot past phantom
            if (anglesRef.current[i] > phantomAnglesRef.current[i]) {
              anglesRef.current[i] = phantomAnglesRef.current[i];
            }
          }
        }
        const angle = anglesRef.current[i];
        const t = time * 0.001;
        // Per-icon phase seed so each wobbles differently
        const seed = item.phaseOffset * 7.3;
        // Layered sine noise: radius drift (±3%), vertical bob, slight scale breath
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

      // Mouse gravity — pull icon toward cursor based on proximity
      if (!modalOpen) {
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        const dx = mx - targetX;
        const dy = my - targetY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const gravityRadius = 200; // pixels — influence range
        const maxPull = 25; // pixels — max displacement

        if (dist < gravityRadius && dist > 1) {
          const strength = (1 - dist / gravityRadius) ** 2; // quadratic falloff
          const pull = strength * maxPull;
          targetX += (dx / dist) * pull;
          targetY += (dy / dist) * pull;
        }
      }

      const cur = currentPosRef.current[i];

      // First frame: record spawn time, place at center
      if (!initializedRef.current) {
        spawnTimeRef.current = time * 0.001;
        cur.x = cx;
        cur.y = cy;
        cur.scale = 0;
        cur.opacity = 0;
      }

      // Staggered spawn: override targets to center until this icon's turn
      const elapsed = time * 0.001 - spawnTimeRef.current;
      const iconSpawnTime = SPAWN_DELAY + i * SPAWN_STAGGER;
      const spawning = elapsed < iconSpawnTime;

      if (spawning) {
        targetX = cx;
        targetY = cy;
        targetScale = 0;
        targetOpacity = 0;
      }

      // Staggered return from modal — clicked icon emerges last
      const returnElapsed = time * 0.001 - returnTimeRef.current;
      // Reverse order: clicked icon last
      const reverseRank = ORBITAL_ITEMS.length - 1 - orderRank[i];
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
          // Spiral dismiss: targets are physics-driven, lerp follows tightly
          effectiveSmoothing = smoothing * 2.5;
        } else if (isEmerging) {
          // Gentle floaty emergence
          const emergeTime = spawning ? iconSpawnTime : returnDelay;
          const emergeElapsed = spawning ? elapsed : returnElapsed;
          const emergeProgress = Math.min(1, (emergeElapsed - emergeTime) / 1.0);
          effectiveSmoothing = driftSmoothing * (0.15 + 0.85 * (isEmerging ? 0 : emergeProgress));
        } else {
          // Normal orbit drift
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

      // Update stream for this icon
      const stream = streamRefs.current[i];
      if (!stream) return;

      // Streams: fade out early during dismiss (overlapping action — streams exit before icons)
      const dismissElapsed = time * 0.001 - dismissTimeRef.current;
      const myDismissDelay = orderRank[i] * DISMISS_STAGGER;
      const streamFadingOut = modalOpen && dismissElapsed >= (myDismissDelay - 0.1);
      const iconVisible = cur.opacity > 0.05 && !streamFadingOut;
      if (!iconVisible) {
        stream.style.opacity = '0';
        stream.className = 'data-stream';
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
        // Hover: max intensity
        stream.style.opacity = '1';
        stream.style.color = 'rgba(255, 255, 255, 0.85)';
        stream.style.textShadow = `0 0 0.5em ${glow}, 0 0 1.5em ${glow}B3, 0 0 3em ${glow}66`;
        stream.className = 'data-stream data-stream--active';
      } else {
        // Always-on: full glow baseline
        stream.style.opacity = '0.35';
        stream.style.color = 'rgba(255, 255, 255, 0.5)';
        stream.style.textShadow = `0 0 0.4em ${glow}99, 0 0 1.2em ${glow}4D, 0 0 2em ${glow}26`;
        stream.className = 'data-stream data-stream--active';
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
    ORBITAL_ITEMS.forEach((item, i) => {
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
  }, []);

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
      {ORBITAL_ITEMS.map((item, i) => (
        <div
          key={`stream-${item.id}`}
          ref={(el) => { streamRefs.current[i] = el; }}
          className="data-stream"
          aria-hidden="true"
        />
      ))}
      <div ref={layerRef} className="orbital-layer">
        {ORBITAL_ITEMS.map((item, i) => (
          <button
            key={item.id}
            ref={(el) => { iconRefs.current[i] = el; }}
            className={`orbital-icon${activeId === item.id ? ' active' : ''}`}
            style={{ '--icon-glow': item.glowColor } as React.CSSProperties}
            onClick={() => onSelect(item.id)}
            onMouseEnter={() => { hoveredIndexRef.current = i; }}
            onMouseLeave={() => { hoveredIndexRef.current = -1; }}
            aria-label={item.label}
          >
            <img src={item.icon} alt={item.label} style={item.iconScale ? { transform: `scale(${item.iconScale})` } : undefined} />
            <span
              className="orbital-label"
              ref={(el) => { labelRefs.current[i] = el; }}
            />
          </button>
        ))}
      </div>
    </>
  );
}
