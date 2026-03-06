'use client';

import { useEffect, useRef } from 'react';

// Hackathon milestone dates
const SUBMISSION_CLOSE = new Date('2026-03-09T19:00:00-08:00').getTime();
const VOTING_CLOSE = new Date('2026-04-29T19:00:00-07:00').getTime();

const BOX_W = 180;
const BOX_H = 64;
const SPEED = 0.8;
const PIXEL_SCALE = 4;
const FADE_RATE = 0.03;
const TRAIL_ALPHA = 0.35;

const COLORS = ['#b494f7', '#14f1b2', '#ef5c6f', '#fd8f3a', '#8dfff0'];

function pad2(n: number) { return n.toString().padStart(2, '0'); }

function getPhase(now: number): { label: string; diff: number } | null {
  if (now < SUBMISSION_CLOSE) return { label: 'SUBMISSIONS CLOSE', diff: SUBMISSION_CLOSE - now };
  if (now < VOTING_CLOSE) return { label: 'JUDGING CLOSES', diff: VOTING_CLOSE - now };
  return null;
}

function formatDiff(ms: number) {
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${pad2(d)}:${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

export function DVDCountdown() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<HTMLSpanElement>(null);

  const stateRef = useRef({
    x: 100 + Math.random() * 300,
    y: 80 + Math.random() * 200,
    dx: SPEED * (Math.random() > 0.5 ? 1 : -1),
    dy: SPEED * 0.7 * (Math.random() > 0.5 ? 1 : -1),
    colorIdx: 0,
  });

  const phase = getPhase(Date.now());

  // Bounce + trail animation
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

    let raf: number;
    const animate = () => {
      const s = stateRef.current;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      s.x += s.dx;
      s.y += s.dy;

      let bounced = false;
      if (s.x <= 0) { s.x = 0; s.dx = Math.abs(s.dx); bounced = true; }
      if (s.x + BOX_W >= vw) { s.x = vw - BOX_W; s.dx = -Math.abs(s.dx); bounced = true; }
      if (s.y <= 0) { s.y = 0; s.dy = Math.abs(s.dy); bounced = true; }
      if (s.y + BOX_H >= vh) { s.y = vh - BOX_H; s.dy = -Math.abs(s.dy); bounced = true; }

      if (bounced) s.colorIdx = (s.colorIdx + 1) % COLORS.length;

      const color = COLORS[s.colorIdx];

      // Fade existing trail
      ctx.fillStyle = `rgba(0,0,0,${FADE_RATE})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw trail point at low res
      ctx.fillStyle = color;
      ctx.globalAlpha = TRAIL_ALPHA;
      ctx.fillRect(
        Math.round(s.x / PIXEL_SCALE),
        Math.round(s.y / PIXEL_SCALE),
        Math.round(BOX_W / PIXEL_SCALE),
        Math.round(BOX_H / PIXEL_SCALE),
      );
      ctx.globalAlpha = 1;

      // Position the floating box
      box.style.transform = `translate(${Math.round(s.x)}px,${Math.round(s.y)}px)`;
      inner.style.borderColor = color;
      inner.style.boxShadow = `0 0 1em ${color}40, inset 0 0 0.5em ${color}20`;
      if (labelRef.current) labelRef.current.style.color = color;

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Countdown tick (every second)
  useEffect(() => {
    const update = () => {
      const p = getPhase(Date.now());
      if (!p) return;
      if (labelRef.current) labelRef.current.textContent = p.label;
      if (timerRef.current) timerRef.current.textContent = formatDiff(p.diff);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  if (!phase) return null;

  return (
    <>
      {/* Dither trail canvas — low-res + pixelated scaling */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{
          imageRendering: 'pixelated',
          width: '100vw',
          height: '100vh',
          zIndex: 50,
          opacity: 0.6,
        }}
      />

      {/* Bouncing countdown box */}
      <div
        ref={boxRef}
        className="fixed top-0 left-0 pointer-events-none"
        style={{ width: BOX_W, height: BOX_H, zIndex: 51, willChange: 'transform' }}
      >
        <div
          ref={innerRef}
          className="flex flex-col items-center justify-center h-full bg-[rgba(1,1,1,0.9)] border px-[1em] py-[0.5em]"
          style={{ borderColor: COLORS[0], boxShadow: `0 0 1em ${COLORS[0]}40` }}
        >
          <span
            ref={labelRef}
            className="font-[family-name:var(--font-ui)] text-[0.5625em] uppercase tracking-[0.15em]"
            style={{ color: COLORS[0] }}
          >
            {phase.label}
          </span>
          <span
            ref={timerRef}
            className="font-[family-name:var(--font-mono)] text-[1.125em] text-white tabular-nums tracking-[0.05em]"
          >
            {formatDiff(phase.diff)}
          </span>
        </div>
      </div>
    </>
  );
}

export default DVDCountdown;
