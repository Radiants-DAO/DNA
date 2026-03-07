'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { useAnimationPreferences } from '../hooks/useAnimationPreferences';
import { computeDitherMaskStyle, type ElementConfig } from './DitherControls';

// Hackathon milestone dates
const SUBMISSION_CLOSE = new Date('2026-03-09T00:00:00Z').getTime(); // Mar 8 19:00 CST
const VOTING_CLOSE = new Date('2026-04-30T00:00:00Z').getTime();

const BOX_W = 420;
const BOX_H = 220;
const SPEED = 3.0;
const PIXEL_SCALE = 5;
const FADE_RATE = 0.05;
const TRAIL_ALPHA = 0.4;
const FRAME_INTERVAL = 1000 / 24;
const REVEAL_DURATION = 700;

const COLORS = ['#b494f7', '#14f1b2', '#ef5c6f', '#fd8f3a', '#8dfff0'];

const REVEAL_CONFIG: Omit<ElementConfig, 'progress' | 'enabled'> = {
  type: 'diamond', angle: 135, center: [0.5, 0.5], radius: 2, aspect: 2.1,
  startAngle: 0, direction: 'in', algorithm: 'bayer2x2',
  pixelScale: 5, edge: 0.5, duration: REVEAL_DURATION, delay: 0,
};

function pad2(n: number) { return n.toString().padStart(2, '0'); }

function getPhase(now: number): { label: string; diff: number } | null {
  if (now < SUBMISSION_CLOSE) return { label: 'SUBMISSIONS CLOSE', diff: SUBMISSION_CLOSE - now };
  if (now < VOTING_CLOSE) return { label: 'JUDGING CLOSES', diff: VOTING_CLOSE - now };
  return null;
}

function decompose(ms: number) {
  return {
    d: Math.floor(ms / 86400000),
    h: Math.floor((ms % 86400000) / 3600000),
    m: Math.floor((ms % 3600000) / 60000),
    s: Math.floor((ms % 60000) / 1000),
  };
}

// Pixel art icons (matching content-renderers style)
const PX = { imageRendering: 'pixelated' as const };
function SpaceInvader({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color || 'currentColor'} style={PX}>
      <path d="M2,11H3V9H4V7H5V5H6V8H7V10H9V8H10V5H11V7H12V9H13V11H14V13H13V14H3V13H2V11ZM7,11V13H9V11H7ZM6,3H7V2H9V3H10V5H9V4H7V5H6V3Z"/>
    </svg>
  );
}
function Hourglass({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color || 'currentColor'} style={PX}>
      <path d="M4,2H12V3H4V2ZM4,14H12V15H4V14ZM5,4H6V5H7V6H6V7H5V4ZM5,10H6V13H5V10ZM6,7H7V8H6V7ZM6,9H7V10H6V9ZM7,6H8V7H7V6ZM7,8H8V7H9V6H8V5H10V4H11V7H10V8H9V9H7V8ZM9,9H10V10H9V9ZM10,10H11V13H10V10Z"/>
    </svg>
  );
}

const SUBMIT_URL = 'https://align.nexus/organizations/8b216ce8-dd0e-4f96-85a1-0d95ba3022e2/hackathons/6unDGXkWmY1Yw99SsKMt6pPCQTpSSQh5kSiJRgqTwHXE';

export function DVDCountdown({ ready = false }: { ready?: boolean }) {
  const [phase, setPhase] = useState(() => getPhase(Date.now()));
  const { isDocumentVisible } = useAnimationPreferences();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const viewportRef = useRef({ width: 0, height: 0 });
  const ditherCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [revealProgress, setRevealProgress] = useState(0);
  const [revealDone, setRevealDone] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const activatedRef = useRef(false);
  if (ready) activatedRef.current = true;
  const active = activatedRef.current && !dismissed;
  const [initialState] = useState(() => ({
    x: 0, y: 0,
    dx: SPEED * (Math.random() > 0.5 ? 1 : -1),
    dy: SPEED * 0.7 * (Math.random() > 0.5 ? 1 : -1),
    colorIdx: 0,
    lastFrame: 0,
    spawned: false,
  }));
  const stateRef = useRef(initialState);
  const pausedRef = useRef(false);

  if (!ditherCanvasRef.current && typeof document !== 'undefined') {
    ditherCanvasRef.current = document.createElement('canvas');
  }

  // Phase 1: Dither reveal — position behind InfoWindow, animate mask 0→1
  useEffect(() => {
    if (!active || revealDone) return;

    const s = stateRef.current;
    if (!s.spawned) {
      s.x = window.innerWidth - BOX_W - 16;
      s.y = 16;
      s.dx = -Math.abs(s.dx);
      s.dy = Math.abs(s.dy);
      s.spawned = true;
    }

    // Position the box immediately
    const box = boxRef.current;
    if (box) box.style.transform = `translate3d(${Math.round(s.x)}px,${Math.round(s.y)}px,0)`;

    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / REVEAL_DURATION);
      setRevealProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setRevealDone(true);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, revealDone]);

  // Phase 2: Bounce animation — starts after reveal completes
  useEffect(() => {
    if (!isDocumentVisible || !revealDone) return;

    const canvas = canvasRef.current;
    const box = boxRef.current;
    const inner = innerRef.current;
    if (!canvas || !box || !inner) return;

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true })!;

    const resize = () => {
      viewportRef.current = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      const nextWidth = Math.ceil(viewportRef.current.width / PIXEL_SCALE);
      const nextHeight = Math.ceil(viewportRef.current.height / PIXEL_SCALE);
      if (canvas.width !== nextWidth) canvas.width = nextWidth;
      if (canvas.height !== nextHeight) canvas.height = nextHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const applyColor = (color: string) => {
      inner.style.setProperty('--dvd-accent', color);
      inner.style.borderColor = color;
      inner.style.boxShadow = `0 8px 32px rgba(0,0,0,0.5), 0 0 1px ${color}30`;
      const header = inner.querySelector<HTMLElement>('.dvd-countdown-header');
      if (header) header.style.borderBottomColor = color;
      const closeBtn = inner.querySelector<HTMLElement>('.dvd-countdown-close');
      if (closeBtn) closeBtn.style.borderLeftColor = color;
    };
    applyColor(COLORS[stateRef.current.colorIdx]);

    const s = stateRef.current;
    let raf: number;
    const animate = (now: number) => {
      raf = requestAnimationFrame(animate);

      if (now - s.lastFrame < FRAME_INTERVAL) return;
      s.lastFrame = now;

      if (pausedRef.current) return;

      const { width: vw, height: vh } = viewportRef.current;

      s.x += s.dx;
      s.y += s.dy;

      let bounced = false;
      if (s.x <= 0) { s.x = 0; s.dx = Math.abs(s.dx); bounced = true; }
      if (s.x + BOX_W >= vw) { s.x = vw - BOX_W; s.dx = -Math.abs(s.dx); bounced = true; }
      if (s.y <= 0) { s.y = 0; s.dy = Math.abs(s.dy); bounced = true; }
      if (s.y + BOX_H >= vh) { s.y = vh - BOX_H; s.dy = -Math.abs(s.dy); bounced = true; }

      // Bounce off InfoWindow
      const infoEl = document.querySelector('.door-info-overlay');
      if (infoEl) {
        const r = infoEl.getBoundingClientRect();
        if (s.x + BOX_W > r.left && s.x < r.right &&
            s.y + BOX_H > r.top && s.y < r.bottom) {
          const ol = (s.x + BOX_W) - r.left;
          const or_ = r.right - s.x;
          const ot = (s.y + BOX_H) - r.top;
          const ob = r.bottom - s.y;
          const min = Math.min(ol, or_, ot, ob);
          if (min === ol) { s.x = r.left - BOX_W; s.dx = -Math.abs(s.dx); }
          else if (min === or_) { s.x = r.right; s.dx = Math.abs(s.dx); }
          else if (min === ot) { s.y = r.top - BOX_H; s.dy = -Math.abs(s.dy); }
          else { s.y = r.bottom; s.dy = Math.abs(s.dy); }
          bounced = true;
        }
      }

      if (bounced) {
        s.colorIdx = (s.colorIdx + 1) % COLORS.length;
        applyColor(COLORS[s.colorIdx]);
      }

      // Fade (black = invisible with lighten blend)
      ctx.fillStyle = `rgba(0,0,0,${FADE_RATE})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Trail
      ctx.fillStyle = COLORS[s.colorIdx];
      ctx.globalAlpha = TRAIL_ALPHA;
      ctx.fillRect(
        Math.round(s.x / PIXEL_SCALE),
        Math.round(s.y / PIXEL_SCALE),
        Math.round(BOX_W / PIXEL_SCALE),
        Math.round(BOX_H / PIXEL_SCALE),
      );
      ctx.globalAlpha = 1;

      box.style.transform = `translate3d(${Math.round(s.x)}px,${Math.round(s.y)}px,0)`;
    };

    s.lastFrame = 0;
    raf = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [isDocumentVisible, revealDone]);

  // Countdown tick
  useEffect(() => {
    const update = () => setPhase(getPhase(Date.now()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // Phase 3: Dither-out on dismiss — reverse mask 1→0
  useEffect(() => {
    if (!dismissing) return;
    pausedRef.current = true; // freeze position during exit
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.max(0, 1 - (now - start) / REVEAL_DURATION);
      setRevealProgress(p);
      if (p > 0) raf = requestAnimationFrame(tick);
      else setDismissed(true);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dismissing]);

  // Dither mask during reveal or dismiss
  const showMask = !revealDone || dismissing;
  const revealMask = useMemo(() => {
    if (!showMask) return undefined;
    return computeDitherMaskStyle(
      { ...REVEAL_CONFIG, enabled: true, progress: revealProgress },
      BOX_W, BOX_H, ditherCanvasRef.current ?? undefined,
    );
  }, [revealProgress, showMask]);

  if (!phase || !active || isMobile) return null;
  const t = decompose(phase.diff);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{
          imageRendering: 'pixelated',
          width: '100%',
          height: '100%',
          zIndex: 18,
          mixBlendMode: 'lighten',
          visibility: revealDone ? 'visible' : 'hidden',
        }}
      />

      <div
        ref={boxRef}
        className="fixed top-0 left-0 pointer-events-none"
        style={{ width: BOX_W, height: BOX_H, zIndex: 20, willChange: 'transform', ...revealMask }}
      >
        <div
          ref={innerRef}
          className="dvd-countdown-box"
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
        >
          {/* Taskbar — matches InfoWindow */}
          <div className="dvd-countdown-header">
            <span ref={labelRef} className="dvd-countdown-label">
              {phase.label}
            </span>
            <button className="dvd-countdown-close" onClick={() => { setRevealDone(false); setDismissing(true); }} aria-label="Dismiss">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" style={PX}>
                <path d="M2,2H4V4H2V2ZM4,4H6V6H4V4ZM6,6H10V10H6V6ZM10,4H12V6H10V4ZM12,2H14V4H12V2ZM10,10H12V12H10V10ZM12,12H14V14H12V12ZM4,10H6V12H4V10ZM2,12H4V14H2V12Z"/>
              </svg>
            </button>
          </div>

          <div className="dvd-countdown-body">
            {/* Countdown digits */}
            <div className="dvd-countdown-digits">
              <div className="dvd-countdown-unit">
                <span className="dvd-countdown-value">{pad2(t.d)}</span>
                <span className="dvd-countdown-sub">days</span>
              </div>
              <span className="dvd-countdown-sep">:</span>
              <div className="dvd-countdown-unit">
                <span className="dvd-countdown-value">{pad2(t.h)}</span>
                <span className="dvd-countdown-sub">hrs</span>
              </div>
              <span className="dvd-countdown-sep">:</span>
              <div className="dvd-countdown-unit">
                <span className="dvd-countdown-value">{pad2(t.m)}</span>
                <span className="dvd-countdown-sub">min</span>
              </div>
              <span className="dvd-countdown-sep">:</span>
              <div className="dvd-countdown-unit">
                <span className="dvd-countdown-value">{pad2(t.s)}</span>
                <span className="dvd-countdown-sub">sec</span>
              </div>
            </div>

            {/* Submit CTA */}
            <a
              href={SUBMIT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="dvd-countdown-submit"
            >
              Submit Your Project
            </a>

            {/* Footer */}
            <div className="dvd-countdown-footer">
              <SpaceInvader size={18} />
              <span>MONOLITH HACKATHON</span>
              <SpaceInvader size={18} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default DVDCountdown;
