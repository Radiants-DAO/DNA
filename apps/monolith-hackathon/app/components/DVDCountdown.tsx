'use client';

import { useEffect, useRef } from 'react';

// Hackathon milestone dates
const SUBMISSION_CLOSE = new Date('2026-03-09T19:00:00-08:00').getTime();
const VOTING_CLOSE = new Date('2026-04-29T19:00:00-07:00').getTime();

const BOX_W = 300;
const BOX_H = 130;
const SPEED = 2.4;
const PIXEL_SCALE = 5;
const FADE_RATE = 0.05;
const TRAIL_ALPHA = 0.4;
const FRAME_INTERVAL = 33;

const COLORS = ['#b494f7', '#14f1b2', '#ef5c6f', '#fd8f3a', '#8dfff0'];

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

export function DVDCountdown() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const dRef = useRef<HTMLSpanElement>(null);
  const hRef = useRef<HTMLSpanElement>(null);
  const mRef = useRef<HTMLSpanElement>(null);
  const sRef = useRef<HTMLSpanElement>(null);

  const stateRef = useRef({
    x: 100 + Math.random() * 300,
    y: 80 + Math.random() * 200,
    dx: SPEED * (Math.random() > 0.5 ? 1 : -1),
    dy: SPEED * 0.7 * (Math.random() > 0.5 ? 1 : -1),
    colorIdx: 0,
    lastFrame: 0,
  });

  const phase = getPhase(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    const inner = innerRef.current;
    if (!canvas || !box || !inner) return;

    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = Math.ceil(window.innerWidth / PIXEL_SCALE);
      canvas.height = Math.ceil(window.innerHeight / PIXEL_SCALE);
    };
    resize();
    window.addEventListener('resize', resize);

    const applyColor = (color: string) => {
      inner.style.borderColor = color;
      inner.style.boxShadow = `0 0 1.5em ${color}30, inset 0 0 0.75em ${color}15`;
      const accents = inner.querySelectorAll<HTMLElement>('[data-accent]');
      accents.forEach(el => { el.style.color = color; });
    };
    applyColor(COLORS[stateRef.current.colorIdx]);

    let raf: number;
    const animate = (now: number) => {
      raf = requestAnimationFrame(animate);

      const s = stateRef.current;
      if (now - s.lastFrame < FRAME_INTERVAL) return;
      s.lastFrame = now;

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      s.x += s.dx;
      s.y += s.dy;

      let bounced = false;
      if (s.x <= 0) { s.x = 0; s.dx = Math.abs(s.dx); bounced = true; }
      if (s.x + BOX_W >= vw) { s.x = vw - BOX_W; s.dx = -Math.abs(s.dx); bounced = true; }
      if (s.y <= 0) { s.y = 0; s.dy = Math.abs(s.dy); bounced = true; }
      if (s.y + BOX_H >= vh) { s.y = vh - BOX_H; s.dy = -Math.abs(s.dy); bounced = true; }

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

      box.style.transform = `translate(${Math.round(s.x)}px,${Math.round(s.y)}px)`;
    };

    raf = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Countdown tick
  useEffect(() => {
    const update = () => {
      const p = getPhase(Date.now());
      if (!p) return;
      if (labelRef.current) labelRef.current.textContent = p.label;
      const t = decompose(p.diff);
      if (dRef.current) dRef.current.textContent = pad2(t.d);
      if (hRef.current) hRef.current.textContent = pad2(t.h);
      if (mRef.current) mRef.current.textContent = pad2(t.m);
      if (sRef.current) sRef.current.textContent = pad2(t.s);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  if (!phase) return null;
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
          zIndex: 10,
          mixBlendMode: 'lighten',
        }}
      />

      <div
        ref={boxRef}
        className="fixed top-0 left-0 pointer-events-none"
        style={{ width: BOX_W, height: BOX_H, zIndex: 12, willChange: 'transform' }}
      >
        <div ref={innerRef} className="dvd-countdown-box">
          {/* Header row with icons */}
          <div className="dvd-countdown-header">
            <Hourglass size={14} />
            <span ref={labelRef} data-accent className="dvd-countdown-label">
              {phase.label}
            </span>
            <Hourglass size={14} />
          </div>

          {/* Countdown digits */}
          <div className="dvd-countdown-digits">
            <div className="dvd-countdown-unit">
              <span ref={dRef} className="dvd-countdown-value">{pad2(t.d)}</span>
              <span className="dvd-countdown-sub">days</span>
            </div>
            <span className="dvd-countdown-sep">:</span>
            <div className="dvd-countdown-unit">
              <span ref={hRef} className="dvd-countdown-value">{pad2(t.h)}</span>
              <span className="dvd-countdown-sub">hrs</span>
            </div>
            <span className="dvd-countdown-sep">:</span>
            <div className="dvd-countdown-unit">
              <span ref={mRef} className="dvd-countdown-value">{pad2(t.m)}</span>
              <span className="dvd-countdown-sub">min</span>
            </div>
            <span className="dvd-countdown-sep">:</span>
            <div className="dvd-countdown-unit">
              <span ref={sRef} className="dvd-countdown-value">{pad2(t.s)}</span>
              <span className="dvd-countdown-sub">sec</span>
            </div>
          </div>

          {/* Footer */}
          <div className="dvd-countdown-footer">
            <SpaceInvader size={12} />
            <span>MONOLITH HACKATHON</span>
            <SpaceInvader size={12} />
          </div>
        </div>
      </div>
    </>
  );
}

export default DVDCountdown;
