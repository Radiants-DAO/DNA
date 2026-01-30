'use client';

import { useEffect, useRef, useCallback } from 'react';

interface OrbitalItem {
  id: string;
  icon: string;
  label: string;
  speed: number;
  phaseOffset: number;
  glowColor: string;
}

const ORBITAL_ITEMS: OrbitalItem[] = [
  { id: 'timeline', icon: '/icons/clock.svg',    label: 'Timeline', speed: 0.08,  phaseOffset: 0,              glowColor: '#fd8f3a' },
  { id: 'rules',    icon: '/icons/rules.svg',    label: 'Rules',    speed: 0.065, phaseOffset: Math.PI * 0.25, glowColor: '#14f1b2' },
  { id: 'prizes',   icon: '/icons/prizes.svg',   label: 'Prizes',   speed: 0.075, phaseOffset: Math.PI * 0.5,  glowColor: '#ef5c6f' },
  { id: 'judges',   icon: '/icons/judges.svg',   label: 'Judges',   speed: 0.055, phaseOffset: Math.PI * 0.75, glowColor: '#6939ca' },
  { id: 'toolbox',  icon: '/icons/tools.svg',    label: 'Toolbox',  speed: 0.07,  phaseOffset: Math.PI,        glowColor: '#14f1b2' },
  { id: 'faq',      icon: '/icons/faq.svg',      label: 'FAQ',      speed: 0.06,  phaseOffset: Math.PI * 1.25, glowColor: '#fd8f3a' },
  { id: 'calendar', icon: '/icons/calendar.svg', label: 'Calendar', speed: 0.072, phaseOffset: Math.PI * 1.5,  glowColor: '#ef5c6f' },
  { id: 'legal',    icon: '/icons/docs.svg',     label: 'Legal',    speed: 0.058, phaseOffset: Math.PI * 1.75, glowColor: '#6939ca' },
];

const STREAM_CHARS = '01.:;+=<>|/-\\#@$%&*~^!?[]{}()';
const STREAM_LENGTH = 32;

function randomStreamChar() {
  return STREAM_CHARS[Math.floor(Math.random() * STREAM_CHARS.length)];
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
  const connectorRef = useRef<HTMLDivElement>(null);
  const isMobileRef = useRef(false);
  const lastTimeRef = useRef<number>(0);
  const isWindowOpenRef = useRef(isWindowOpen);
  const activeIdRef = useRef(activeId);
  const streamTickRef = useRef<number>(0);
  const hoveredIndexRef = useRef<number>(-1);

  useEffect(() => {
    isWindowOpenRef.current = isWindowOpen;
  }, [isWindowOpen]);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const animate = useCallback((time: number) => {
    if (isMobileRef.current) return;

    const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0.016;
    lastTimeRef.current = time;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2;
    const cy = h / 2;
    const r = h * 0.38;
    const rx = r;
    const ry = r;
    const speedMul = isWindowOpenRef.current ? 0.05 : 1;
    const isActive = isWindowOpenRef.current;
    const hovIdx = hoveredIndexRef.current;

    // Determine which icon the stream should connect to
    const currentActiveId = activeIdRef.current;
    let streamIndex = -1;
    if (isActive && currentActiveId) {
      streamIndex = ORBITAL_ITEMS.findIndex((item) => item.id === currentActiveId);
    } else if (hovIdx >= 0) {
      streamIndex = hovIdx;
    }

    // Positions array for stream connector
    const positions: { x: number; y: number }[] = [];

    ORBITAL_ITEMS.forEach((item, i) => {
      anglesRef.current[i] += item.speed * speedMul * dt;
      const angle = anglesRef.current[i];
      const x = cx + rx * Math.cos(angle);
      const y = cy + ry * Math.sin(angle);
      positions[i] = { x, y };
      const el = iconRefs.current[i];
      const elW = el ? el.offsetWidth : 64;
      const elH = el ? el.offsetHeight : 64;
      if (el) {
        el.style.transform = `translate(${x - elW / 2}px, ${y - elH / 2}px)`;
      }
    });

    // Update connector line from stream icon to viewport center
    const conn = connectorRef.current;
    if (conn && streamIndex >= 0) {
      const pos = positions[streamIndex];
      const item = ORBITAL_ITEMS[streamIndex];
      const dx = cx - pos.x;
      const dy = cy - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle2 = Math.atan2(dy, dx) * (180 / Math.PI);

      conn.style.left = `${pos.x}px`;
      conn.style.top = `${pos.y}px`;
      conn.style.width = `${dist}px`;
      conn.style.transform = `rotate(${angle2}deg)`;

      const glow = item.glowColor;
      if (isActive) {
        conn.style.opacity = '1';
        conn.style.color = `rgba(255, 255, 255, 0.6)`;
        conn.style.textShadow = `0 0 0.4em ${glow}, 0 0 1.2em ${glow}80, 0 0 2.5em ${glow}40`;
        conn.className = 'data-stream data-stream--active';
      } else {
        conn.style.opacity = '0.5';
        conn.style.color = `rgba(255, 255, 255, 0.3)`;
        conn.style.textShadow = `0 0 0.3em ${glow}4D`;
        conn.className = 'data-stream data-stream--hover';
      }

      const tickRate = isActive ? 0.08 : 0.25;
      const charCount = isActive ? STREAM_LENGTH * 2 : STREAM_LENGTH;
      streamTickRef.current += dt;
      if (streamTickRef.current > tickRate) {
        streamTickRef.current = 0;
        let str = '';
        for (let j = 0; j < charCount; j++) {
          str += randomStreamChar();
        }
        conn.textContent = str;
      }
    } else if (conn) {
      conn.style.opacity = '0';
      conn.className = 'data-stream';
    }

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

  const handleClick = (item: OrbitalItem) => {
    onSelect(item.id);
  };

  return (
    <>
      <div ref={connectorRef} className="data-stream" aria-hidden="true" />
      <div ref={layerRef} className="orbital-layer">
        {ORBITAL_ITEMS.map((item, i) => (
          <button
            key={item.id}
            ref={(el) => { iconRefs.current[i] = el; }}
            className={`orbital-icon${activeId === item.id ? ' active' : ''}`}
            onClick={() => handleClick(item)}
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
