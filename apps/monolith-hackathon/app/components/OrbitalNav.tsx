'use client';

import { useEffect, useRef, useCallback } from 'react';

export interface OrbitalItem {
  id: string;
  icon: string;
  label: string;
  phaseOffset: number;
  glowColor: string;
}

export const ORBITAL_ITEMS: OrbitalItem[] = [
  { id: 'hackathon', icon: '/icons/clock.svg',    label: 'Hackathon', phaseOffset: 0,              glowColor: '#ef5c6f' },
  { id: 'rules',    icon: '/icons/rules.svg',    label: 'Rules',    phaseOffset: Math.PI * 0.25, glowColor: '#ef5c6f' },
  { id: 'prizes',   icon: '/icons/prizes.svg',   label: 'Prizes',   phaseOffset: Math.PI * 0.5,  glowColor: '#fd8f3a' },
  { id: 'judges',   icon: '/icons/judges.svg',   label: 'Judges',   phaseOffset: Math.PI * 0.75, glowColor: '#ef5c6f' },
  { id: 'toolbox',  icon: '/icons/tools.svg',    label: 'Toolbox',  phaseOffset: Math.PI,        glowColor: '#6939ca' },
  { id: 'faq',      icon: '/icons/faq.svg',      label: 'FAQ',      phaseOffset: Math.PI * 1.25, glowColor: '#6939ca' },
  { id: 'calendar', icon: '/icons/calendar.svg', label: 'Calendar', phaseOffset: Math.PI * 1.5,  glowColor: '#fd8f3a' },
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
  visitedIds: Set<string>;
}

export default function OrbitalNav({ onSelect, isWindowOpen, activeId, visitedIds }: OrbitalNavProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const anglesRef = useRef<number[]>(ORBITAL_ITEMS.map((item) => item.phaseOffset));
  const rafRef = useRef<number>(0);
  const iconRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const streamRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isMobileRef = useRef(false);
  const lastTimeRef = useRef<number>(0);
  const isWindowOpenRef = useRef(isWindowOpen);
  const activeIdRef = useRef(activeId);
  const visitedIdsRef = useRef(visitedIds);
  const streamTickRefs = useRef<number[]>(ORBITAL_ITEMS.map(() => 0));
  const hoveredIndexRef = useRef<number>(-1);

  // Smooth position interpolation
  const currentPosRef = useRef<{ x: number; y: number; scale: number; opacity: number }[]>(
    ORBITAL_ITEMS.map(() => ({ x: 0, y: 0, scale: 1, opacity: 1 }))
  );
  const initializedRef = useRef(false);

  useEffect(() => { isWindowOpenRef.current = isWindowOpen; }, [isWindowOpen]);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);
  useEffect(() => { visitedIdsRef.current = visitedIds; }, [visitedIds]);

  const animate = useCallback((time: number) => {
    if (isMobileRef.current) return;

    const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0.016;
    lastTimeRef.current = time;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2;
    const cy = h / 2;
    const orbitR = h * 0.38;
    const dockR = h * 0.32;
    const modalOpen = isWindowOpenRef.current;
    const currentActiveId = activeIdRef.current;
    const visited = visitedIdsRef.current;
    const allVisited = visited.size >= ORBITAL_ITEMS.length;
    const hovIdx = hoveredIndexRef.current;

    // Smoothing factor — higher = snappier
    const smoothing = 1 - Math.pow(0.0005, dt);

    ORBITAL_ITEMS.forEach((item, i) => {
      const el = iconRefs.current[i];
      const elW = el ? el.offsetWidth : 64;
      const elH = el ? el.offsetHeight : 64;

      let targetX: number;
      let targetY: number;
      let targetScale: number;
      let targetOpacity: number;

      if (modalOpen) {
        // ALL icons hide behind door when modal is open
        targetX = cx;
        targetY = cy;
        targetScale = 0;
        targetOpacity = 0;
      } else if (allVisited) {
        // All visited: fixed ring around center
        const angle = anglesRef.current[i];
        targetX = cx + h * 0.35 * Math.cos(angle);
        targetY = cy + h * 0.35 * Math.sin(angle);
        targetScale = 1;
        targetOpacity = 1;
      } else {
        // ORBITING: normal elliptical orbit
        anglesRef.current[i] += ORBITAL_SPEED * dt;
        const angle = anglesRef.current[i];
        targetX = cx + orbitR * Math.cos(angle);
        targetY = cy + orbitR * Math.sin(angle);
        targetScale = 1;
        targetOpacity = 1;
      }

      // Initialize positions on first frame (no lerp)
      const cur = currentPosRef.current[i];
      if (!initializedRef.current) {
        cur.x = targetX;
        cur.y = targetY;
        cur.scale = targetScale;
        cur.opacity = targetOpacity;
      } else {
        cur.x = lerp(cur.x, targetX, smoothing);
        cur.y = lerp(cur.y, targetY, smoothing);
        cur.scale = lerp(cur.scale, targetScale, smoothing);
        cur.opacity = lerp(cur.opacity, targetOpacity, smoothing);
      }

      if (el) {
        el.style.transform = `translate(${cur.x - elW / 2}px, ${cur.y - elH / 2}px) scale(${cur.scale.toFixed(3)})`;
        el.style.opacity = cur.opacity.toFixed(3);
      }

      // Update stream for this icon
      const stream = streamRefs.current[i];
      if (!stream) return;

      const shouldShowStream =
        (!modalOpen && allVisited) ||
        (!modalOpen && !allVisited && hovIdx === i);

      if (shouldShowStream) {
        const dx = cx - cur.x;
        const dy = cy - cur.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle2 = Math.atan2(dy, dx) * (180 / Math.PI);

        stream.style.left = `${cur.x}px`;
        stream.style.top = `${cur.y}px`;
        stream.style.width = `${dist}px`;
        stream.style.transform = `rotate(${angle2}deg)`;

        const glow = item.glowColor;
        const isFullStream = allVisited;

        if (isFullStream) {
          stream.style.opacity = '1';
          stream.style.color = 'rgba(255, 255, 255, 0.6)';
          stream.style.textShadow = `0 0 0.4em ${glow}, 0 0 1.2em ${glow}80, 0 0 2.5em ${glow}40`;
          stream.className = 'data-stream data-stream--active';
        } else {
          stream.style.opacity = '0.5';
          stream.style.color = 'rgba(255, 255, 255, 0.3)';
          stream.style.textShadow = `0 0 0.3em ${glow}4D`;
          stream.className = 'data-stream data-stream--hover';
        }

        const tickRate = isFullStream ? 0.08 : 0.25;
        const charCount = isFullStream ? STREAM_LENGTH * 2 : STREAM_LENGTH;
        streamTickRefs.current[i] += dt;
        if (streamTickRefs.current[i] > tickRate) {
          streamTickRefs.current[i] = 0;
          stream.textContent = generateStream(charCount);
        }
      } else {
        stream.style.opacity = '0';
        stream.className = 'data-stream';
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

    if (!isMobileRef.current) {
      rafRef.current = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', checkMobile);
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
            className={`orbital-icon${activeId === item.id ? ' active' : ''}${visitedIds.has(item.id) ? ' visited' : ''}`}
            style={{ '--icon-glow': item.glowColor } as React.CSSProperties}
            onClick={() => onSelect(item.id)}
            onMouseEnter={() => { hoveredIndexRef.current = i; }}
            onMouseLeave={() => { hoveredIndexRef.current = -1; }}
            aria-label={item.label}
          >
            <img src={item.icon} alt={item.label} />
            <span className="orbital-label">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
