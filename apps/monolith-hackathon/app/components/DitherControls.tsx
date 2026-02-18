'use client';

import { useState, useEffect, useRef, useMemo, useCallback, type CSSProperties, type RefObject } from 'react';
import { renderGradientDither, resolveGradient } from '@dithwather/core';
import type { OrderedAlgorithm, DitherGradientType } from '@dithwather/core';

/* ─── Types ─────────────────────────────────────────────────────────────── */

export type WipeType = DitherGradientType;
export type WipeDirection = 'in' | 'out';

export interface ElementConfig {
  enabled: boolean;
  progress: number;
  type: WipeType;
  angle: number;
  center: [number, number];
  radius: number;
  aspect: number;
  startAngle: number;
  direction: WipeDirection;
  algorithm: OrderedAlgorithm;
  pixelScale: number;
  edge: number;
  duration: number;
  delay: number;
}

export interface DitherControlsState {
  door: ElementConfig;
  title: ElementConfig;
  infowindow: ElementConfig;
}

export const DEFAULT_DITHER_STATE: DitherControlsState = {
  door: {
    enabled: true, progress: 0, type: 'diamond', angle: 135,
    center: [0.5, 0.5], radius: 2, aspect: 2.1, startAngle: 0,
    direction: 'out', algorithm: 'bayer2x2',
    pixelScale: 5, edge: 0.5, duration: 800, delay: 300,
  },
  title: {
    enabled: true, progress: 0, type: 'reflected', angle: 112,
    center: [0.5, 0.5], radius: 1, aspect: 1, startAngle: 0,
    direction: 'out', algorithm: 'bayer2x2',
    pixelScale: 5, edge: 0.2, duration: 700, delay: 100,
  },
  infowindow: {
    enabled: false, progress: 0, type: 'diamond', angle: 135,
    center: [0.5, 0.5], radius: 2, aspect: 2.1, startAngle: 0,
    direction: 'in', algorithm: 'bayer2x2',
    pixelScale: 5, edge: 0.5, duration: 700, delay: 600,
  },
};

/* ─── Wipe math ─────────────────────────────────────────────────────────── */

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

function computeWipeStops(progress: number, type: WipeType, direction: WipeDirection, edge: number) {
  // Linear and reflected: front sweeps along the axis (0→1)
  if (type === 'linear' || type === 'reflected') {
    const front = -edge + progress * (1 + 2 * edge);
    return direction === 'out'
      ? [
          { color: '#000000', position: 0 },
          { color: '#000000', position: clamp01(front - edge) },
          { color: '#ffffff', position: clamp01(front + edge) },
          { color: '#ffffff', position: 1 },
        ]
      : [
          { color: '#ffffff', position: 0 },
          { color: '#ffffff', position: clamp01(front - edge) },
          { color: '#000000', position: clamp01(front + edge) },
          { color: '#000000', position: 1 },
        ];
  }
  // Radial, diamond, conic: front sweeps from center outward (or reverse)
  if (direction === 'out') {
    const front = 1 + edge - progress * (1 + 2 * edge);
    return [
      { color: '#ffffff', position: 0 },
      { color: '#ffffff', position: clamp01(front - edge) },
      { color: '#000000', position: clamp01(front + edge) },
      { color: '#000000', position: 1 },
    ];
  }
  const front = -edge + progress * (1 + 2 * edge);
  return [
    { color: '#ffffff', position: 0 },
    { color: '#ffffff', position: clamp01(front - edge) },
    { color: '#000000', position: clamp01(front + edge) },
    { color: '#000000', position: 1 },
  ];
}

/* ─── Mask style computation ────────────────────────────────────────────── */

const MASK_BASE_STYLE = {
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskMode: 'luminance',
  maskMode: 'luminance',
  imageRendering: 'pixelated',
} as CSSProperties;

/** Render the dither mask to a cached canvas and return an object URL. */
function renderMaskToObjectURL(
  config: ElementConfig,
  width: number,
  height: number,
  canvas: HTMLCanvasElement,
): string {
  const ps = config.pixelScale;
  const rw = Math.max(1, Math.ceil(width / ps));
  const rh = Math.max(1, Math.ceil(height / ps));

  const stops = computeWipeStops(config.progress, config.type, config.direction, config.edge);
  const gradient = resolveGradient(
    { type: config.type, stops, angle: config.angle, center: config.center,
      radius: config.radius, aspect: config.aspect, startAngle: config.startAngle },
    undefined, undefined,
  );

  const imageData = renderGradientDither({
    gradient, algorithm: config.algorithm, width: rw, height: rh, pixelScale: 1,
  });

  if (canvas.width !== rw || canvas.height !== rh) {
    canvas.width = rw;
    canvas.height = rh;
  }
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export function computeDitherMaskStyle(
  config: ElementConfig,
  width: number,
  height: number,
  canvas?: HTMLCanvasElement,
): CSSProperties {
  if (!config.enabled) return {};

  // Hide immediately for direction='in' at progress 0, even before size is measured
  if (config.direction === 'in' && config.progress === 0) return { visibility: 'hidden' as const };

  if (width === 0 || height === 0) return {};

  // Fully visible — no mask needed
  if (config.direction === 'out' && config.progress === 0) return {};
  if (config.direction === 'in' && config.progress === 1) return {};

  // Fully hidden
  if (config.direction === 'out' && config.progress === 1) return { opacity: 0 };

  const c = canvas ?? document.createElement('canvas');
  const url = renderMaskToObjectURL(config, width, height, c);
  const mask = `url(${url})`;

  return {
    WebkitMaskImage: mask,
    maskImage: mask,
    ...MASK_BASE_STYLE,
  } as CSSProperties;
}

/* ─── useDitherMask hook ────────────────────────────────────────────────── */

export function useDitherMask(config: ElementConfig, ref: RefObject<HTMLElement | null>): CSSProperties {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Lazily create a single reusable canvas per hook instance
  if (!canvasRef.current && typeof document !== 'undefined') {
    canvasRef.current = document.createElement('canvas');
  }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize(prev => (prev.width === r.width && prev.height === r.height) ? prev : { width: r.width, height: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, config.enabled]);

  return useMemo(
    () => computeDitherMaskStyle(config, size.width, size.height, canvasRef.current ?? undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.enabled, config.progress, config.type, config.angle, config.center[0], config.center[1],
     config.radius, config.aspect, config.startAngle,
     config.direction, config.algorithm, config.pixelScale, config.edge, size.width, size.height],
  );
}

/* ─── Styles ────────────────────────────────────────────────────────────── */

const S = {
  panel: {
    position: 'fixed', bottom: 12, right: 12, zIndex: 99999,
    width: 280, fontFamily: "'Pixeloid Sans', monospace", fontSize: 11,
    color: '#f6f6f5', background: 'rgb(1,1,1)',
    border: '1px solid rgba(180,148,247,0.5)', borderBottomColor: '#553691', borderRightColor: '#553691',
    boxShadow: '0 4px 24px rgba(0,0,0,0.6)', userSelect: 'none' as const,
  } as CSSProperties,
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '6px 10px', borderBottom: '1px solid rgba(180,148,247,0.3)',
    fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.1em',
    color: '#b494f7', cursor: 'pointer',
  } as CSSProperties,
  tabs: {
    display: 'flex', gap: 0, borderBottom: '1px solid rgba(180,148,247,0.2)',
  } as CSSProperties,
  tab: (active: boolean) => ({
    flex: 1, padding: '5px 0', textAlign: 'center' as const, cursor: 'pointer',
    fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.05em',
    background: active ? 'rgba(180,148,247,0.15)' : 'transparent',
    color: active ? '#b494f7' : 'rgba(246,246,245,0.5)',
    borderBottom: active ? '1px solid #b494f7' : '1px solid transparent',
    transition: 'color 0.15s, background 0.15s',
  }) as CSSProperties,
  body: { padding: '8px 10px', display: 'flex', flexDirection: 'column' as const, gap: 6 } as CSSProperties,
  row: { display: 'flex', alignItems: 'center', gap: 6 } as CSSProperties,
  label: { width: 60, fontSize: 9, color: 'rgba(246,246,245,0.6)', textTransform: 'uppercase' as const, flexShrink: 0 } as CSSProperties,
  slider: { flex: 1, height: 2, accentColor: '#b494f7', cursor: 'pointer' } as CSSProperties,
  val: { width: 38, textAlign: 'right' as const, fontSize: 10, color: '#b494f7', fontFamily: "'Pixeloid Mono', monospace" } as CSSProperties,
  select: {
    flex: 1, background: 'rgba(180,148,247,0.1)', border: '1px solid rgba(180,148,247,0.3)',
    color: '#f6f6f5', fontSize: 10, padding: '2px 4px', fontFamily: "'Pixeloid Sans', monospace",
    cursor: 'pointer',
  } as CSSProperties,
  check: { accentColor: '#b494f7', cursor: 'pointer' } as CSSProperties,
  copyBtn: (copied: boolean) => ({
    width: '100%', padding: '5px 0', marginTop: 4, cursor: 'pointer',
    background: copied ? 'rgba(20,241,178,0.2)' : 'rgba(180,148,247,0.15)',
    border: `1px solid ${copied ? 'rgba(20,241,178,0.5)' : 'rgba(180,148,247,0.3)'}`,
    color: copied ? '#14f1b2' : '#b494f7', fontSize: 9,
    textTransform: 'uppercase' as const, letterSpacing: '0.1em',
    fontFamily: "'Pixeloid Sans', monospace", transition: 'all 0.2s',
  }) as CSSProperties,
  sep: { height: 1, background: 'rgba(180,148,247,0.15)', margin: '2px 0' } as CSSProperties,
};

/* ─── Component ─────────────────────────────────────────────────────────── */

type TabKey = keyof DitherControlsState;
const TAB_LABELS: Record<TabKey, string> = { door: 'Door', title: 'Title', infowindow: 'Window' };

interface DitherControlsProps {
  value: DitherControlsState;
  onChange: (state: DitherControlsState) => void;
}

export function DitherControls({ value, onChange }: DitherControlsProps) {
  const [tab, setTab] = useState<TabKey>('door');
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const pausedAtRef = useRef(0);
  const valueRef = useRef(value);
  valueRef.current = value;

  const config = value[tab];

  // Compute total timeline length from all enabled elements
  const totalDuration = useMemo(() => {
    let max = 0;
    for (const key of Object.keys(value) as TabKey[]) {
      const cfg = value[key];
      if (cfg.enabled) max = Math.max(max, cfg.delay + cfg.duration);
    }
    return max || 1000;
  }, [value.door.enabled, value.door.delay, value.door.duration,
      value.title.enabled, value.title.delay, value.title.duration,
      value.infowindow.enabled, value.infowindow.delay, value.infowindow.duration]);

  // rAF playback loop
  useEffect(() => {
    if (!playing) return;

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const v = valueRef.current;
      const next = { ...v };
      let allDone = true;

      for (const key of Object.keys(v) as TabKey[]) {
        const cfg = v[key];
        if (!cfg.enabled) continue;
        const local = elapsed - cfg.delay;
        if (local < 0) { allDone = false; next[key] = { ...cfg, progress: 0 }; continue; }
        const p = Math.min(1, local / cfg.duration);
        next[key] = { ...cfg, progress: p };
        if (p < 1) allDone = false;
      }

      valueRef.current = next;
      onChange(next);

      if (allDone) {
        setPlaying(false);
        pausedAtRef.current = 0;
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    startTimeRef.current = performance.now() - pausedAtRef.current;
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, onChange]);

  const handlePlay = useCallback(() => {
    // If all done, reset first
    const v = valueRef.current;
    const allDone = (Object.keys(v) as TabKey[]).every(k => !v[k].enabled || v[k].progress >= 1);
    if (allDone) {
      const reset = { ...v };
      for (const k of Object.keys(v) as TabKey[]) reset[k] = { ...v[k], progress: 0 };
      onChange(reset);
      pausedAtRef.current = 0;
    }
    setPlaying(true);
  }, [onChange]);

  const handlePause = useCallback(() => {
    // Capture elapsed time so we can resume from here
    pausedAtRef.current = performance.now() - startTimeRef.current;
    setPlaying(false);
  }, []);

  const handleReset = useCallback(() => {
    setPlaying(false);
    pausedAtRef.current = 0;
    const v = valueRef.current;
    const reset = { ...v };
    for (const k of Object.keys(v) as TabKey[]) reset[k] = { ...v[k], progress: 0 };
    onChange(reset);
  }, [onChange]);

  const update = useCallback(<K extends keyof ElementConfig>(key: K, val: ElementConfig[K]) => {
    onChange({ ...value, [tab]: { ...value[tab], [key]: val } });
  }, [value, tab, onChange]);

  const updateCenter = useCallback((idx: 0 | 1, val: number) => {
    const c: [number, number] = [...config.center] as [number, number];
    c[idx] = val;
    update('center', c);
  }, [config.center, update]);

  const copySettings = useCallback(() => {
    const fmt = (cfg: ElementConfig) => {
      const o: Record<string, unknown> = {
        type: cfg.type, direction: cfg.direction,
        algorithm: cfg.algorithm, pixelScale: cfg.pixelScale, edge: cfg.edge,
        duration: cfg.duration, delay: cfg.delay,
      };
      if (cfg.type === 'linear' || cfg.type === 'reflected') o.angle = cfg.angle;
      if (cfg.type === 'radial' || cfg.type === 'conic' || cfg.type === 'diamond') o.center = cfg.center;
      if (cfg.type === 'radial' || cfg.type === 'diamond') { o.radius = cfg.radius; o.aspect = cfg.aspect; }
      if (cfg.type === 'conic') o.startAngle = cfg.startAngle;
      if (!cfg.enabled) o.enabled = false;
      return o;
    };
    const out = { door: fmt(value.door), title: fmt(value.title), infowindow: fmt(value.infowindow) };
    navigator.clipboard.writeText(JSON.stringify(out, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [value]);

  return (
    <div style={S.panel}>
      <div style={S.header} onClick={() => setCollapsed(c => !c)}>
        <span>Dither Controls</span>
        <span>{collapsed ? '+' : '\u2013'}</span>
      </div>
      {!collapsed && (
        <>
          <div style={S.tabs}>
            {(Object.keys(TAB_LABELS) as TabKey[]).map(k => (
              <div key={k} style={S.tab(tab === k)} onClick={() => setTab(k)}>
                {TAB_LABELS[k]}
                {!value[k].enabled && <span style={{ opacity: 0.4 }}> off</span>}
              </div>
            ))}
          </div>
          <div style={S.body}>
            {/* Enabled */}
            <div style={S.row}>
              <label style={S.label}>Enabled</label>
              <input type="checkbox" checked={config.enabled} onChange={e => update('enabled', e.target.checked)} style={S.check} />
            </div>

            {/* Progress */}
            <div style={S.row}>
              <label style={S.label}>Progress</label>
              <input type="range" min={0} max={1} step={0.005} value={config.progress}
                onChange={e => update('progress', +e.target.value)} style={S.slider} />
              <span style={S.val}>{config.progress.toFixed(2)}</span>
            </div>

            <div style={S.sep} />

            {/* Type */}
            <div style={S.row}>
              <label style={S.label}>Type</label>
              <select value={config.type} onChange={e => update('type', e.target.value as WipeType)} style={S.select}>
                <option value="linear">linear</option>
                <option value="radial">radial</option>
                <option value="conic">conic</option>
                <option value="diamond">diamond</option>
                <option value="reflected">reflected</option>
              </select>
            </div>

            {/* Angle (linear, reflected) */}
            {(config.type === 'linear' || config.type === 'reflected') && (
              <div style={S.row}>
                <label style={S.label}>Angle</label>
                <input type="range" min={0} max={360} step={1} value={config.angle}
                  onChange={e => update('angle', +e.target.value)} style={S.slider} />
                <span style={S.val}>{config.angle}&deg;</span>
              </div>
            )}

            {/* Center (radial, conic, diamond) */}
            {(config.type === 'radial' || config.type === 'conic' || config.type === 'diamond') && (
              <>
                <div style={S.row}>
                  <label style={S.label}>Center X</label>
                  <input type="range" min={0} max={1} step={0.01} value={config.center[0]}
                    onChange={e => updateCenter(0, +e.target.value)} style={S.slider} />
                  <span style={S.val}>{config.center[0].toFixed(2)}</span>
                </div>
                <div style={S.row}>
                  <label style={S.label}>Center Y</label>
                  <input type="range" min={0} max={1} step={0.01} value={config.center[1]}
                    onChange={e => updateCenter(1, +e.target.value)} style={S.slider} />
                  <span style={S.val}>{config.center[1].toFixed(2)}</span>
                </div>
              </>
            )}

            {/* Radius (radial, diamond) */}
            {(config.type === 'radial' || config.type === 'diamond') && (
              <>
                <div style={S.row}>
                  <label style={S.label}>Radius</label>
                  <input type="range" min={0.1} max={2} step={0.05} value={config.radius}
                    onChange={e => update('radius', +e.target.value)} style={S.slider} />
                  <span style={S.val}>{config.radius.toFixed(2)}</span>
                </div>
                <div style={S.row}>
                  <label style={S.label}>Aspect</label>
                  <input type="range" min={0.2} max={3} step={0.05} value={config.aspect}
                    onChange={e => update('aspect', +e.target.value)} style={S.slider} />
                  <span style={S.val}>{config.aspect.toFixed(2)}</span>
                </div>
              </>
            )}

            {/* Start angle (conic) */}
            {config.type === 'conic' && (
              <div style={S.row}>
                <label style={S.label}>Start &deg;</label>
                <input type="range" min={0} max={360} step={1} value={config.startAngle}
                  onChange={e => update('startAngle', +e.target.value)} style={S.slider} />
                <span style={S.val}>{config.startAngle}&deg;</span>
              </div>
            )}

            {/* Direction */}
            <div style={S.row}>
              <label style={S.label}>Direction</label>
              <select value={config.direction} onChange={e => update('direction', e.target.value as WipeDirection)} style={S.select}>
                <option value="out">out (hide)</option>
                <option value="in">in (reveal)</option>
              </select>
            </div>

            <div style={S.sep} />

            {/* Algorithm */}
            <div style={S.row}>
              <label style={S.label}>Algorithm</label>
              <select value={config.algorithm} onChange={e => update('algorithm', e.target.value as OrderedAlgorithm)} style={S.select}>
                <option value="bayer2x2">bayer2x2</option>
                <option value="bayer4x4">bayer4x4</option>
                <option value="bayer8x8">bayer8x8</option>
              </select>
            </div>

            {/* PixelScale */}
            <div style={S.row}>
              <label style={S.label}>Scale</label>
              <input type="range" min={1} max={8} step={1} value={config.pixelScale}
                onChange={e => update('pixelScale', +e.target.value)} style={S.slider} />
              <span style={S.val}>{config.pixelScale}x</span>
            </div>

            {/* Edge */}
            <div style={S.row}>
              <label style={S.label}>Edge</label>
              <input type="range" min={0} max={0.5} step={0.01} value={config.edge}
                onChange={e => update('edge', +e.target.value)} style={S.slider} />
              <span style={S.val}>{config.edge.toFixed(2)}</span>
            </div>

            <div style={S.sep} />

            {/* Duration */}
            <div style={S.row}>
              <label style={S.label}>Duration</label>
              <input type="range" min={100} max={2000} step={50} value={config.duration}
                onChange={e => update('duration', +e.target.value)} style={S.slider} />
              <span style={S.val}>{config.duration}ms</span>
            </div>

            {/* Delay */}
            <div style={S.row}>
              <label style={S.label}>Delay</label>
              <input type="range" min={0} max={1500} step={50} value={config.delay}
                onChange={e => update('delay', +e.target.value)} style={S.slider} />
              <span style={S.val}>{config.delay}ms</span>
            </div>

            <div style={S.sep} />

            {/* Playback controls */}
            <div style={{ display: 'flex', gap: 4 }}>
              {!playing ? (
                <button onClick={handlePlay} style={{ ...S.copyBtn(false), flex: 1, marginTop: 0 }}>
                  {'\u25B6'} Play
                </button>
              ) : (
                <button onClick={handlePause} style={{ ...S.copyBtn(false), flex: 1, marginTop: 0 }}>
                  {'\u23F8'} Pause
                </button>
              )}
              <button onClick={handleReset} style={{ ...S.copyBtn(false), flex: 1, marginTop: 0 }}>
                {'\u23EE'} Reset
              </button>
            </div>

            <button onClick={copySettings} style={S.copyBtn(copied)}>
              {copied ? 'Copied!' : 'Copy Settings'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
