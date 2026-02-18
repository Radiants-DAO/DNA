'use client';

import { useState, useRef, useCallback, useEffect, type CSSProperties } from 'react';

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface TimelineElement {
  start: number;   // ms from t=0
  duration: number; // ms
}

export interface TimelineConfig {
  title: TimelineElement;
  door: TimelineElement;
  window: TimelineElement;
}

export const DEFAULT_TIMELINE: TimelineConfig = {
  title:  { start: 100,  duration: 700 },
  door:   { start: 688,  duration: 800 },
  window: { start: 1360, duration: 700 },
};

type ElementKey = keyof TimelineConfig;
const KEYS: ElementKey[] = ['title', 'door', 'window'];

const COLORS: Record<ElementKey, string> = {
  title:  '#b494f7',
  door:   '#14f1b2',
  window: '#f7b494',
};

/* ─── Drag state ────────────────────────────────────────────────────────── */

interface DragInfo {
  key: ElementKey;
  mode: 'start' | 'end' | 'move';
  startX: number;
  origStart: number;
  origDuration: number;
}

/* ─── Props ──────────────────────────────────────────────────────────────── */

interface TimelineControlsProps {
  config: TimelineConfig;
  onConfigChange: (config: TimelineConfig) => void;
  position: number;
  onPositionChange: (ms: number) => void;
  totalDuration: number;
  playing: boolean;
  onPlayPause: () => void;
  onReset: () => void;
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export function TimelineControls({
  config,
  onConfigChange,
  position,
  onPositionChange,
  totalDuration,
  playing,
  onPlayPause,
  onReset,
}: TimelineControlsProps) {
  const [collapsed, setCollapsed] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragInfo | null>(null);
  const [scrubbing, setScrubbing] = useState(false);

  // Stable refs for drag handlers
  const configRef = useRef(config);
  configRef.current = config;
  const onConfigChangeRef = useRef(onConfigChange);
  onConfigChangeRef.current = onConfigChange;
  const totalDurRef = useRef(totalDuration);
  totalDurRef.current = totalDuration;

  // ── Global pointer move/up for bar dragging ──
  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;

      const dx = e.clientX - drag.startX;
      const dMs = (dx / rect.width) * totalDurRef.current;
      const cfg = configRef.current;
      const el = { ...cfg[drag.key] };

      if (drag.mode === 'move') {
        el.start = Math.max(0, Math.round(drag.origStart + dMs));
      } else if (drag.mode === 'start') {
        const end = drag.origStart + drag.origDuration;
        el.start = Math.min(end - 50, Math.max(0, Math.round(drag.origStart + dMs)));
        el.duration = end - el.start;
      } else {
        el.duration = Math.max(50, Math.round(drag.origDuration + dMs));
      }

      onConfigChangeRef.current({ ...cfg, [drag.key]: el });
    };

    const handleUp = () => { dragRef.current = null; };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, []);

  const handleBarDown = useCallback((e: React.PointerEvent, key: ElementKey, mode: DragInfo['mode']) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      key, mode,
      startX: e.clientX,
      origStart: config[key].start,
      origDuration: config[key].duration,
    };
  }, [config]);

  // ── Master scrub ──
  const scrubFromEvent = useCallback((e: React.PointerEvent) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onPositionChange(Math.round(frac * totalDuration));
  }, [totalDuration, onPositionChange]);

  const handleScrubDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setScrubbing(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    scrubFromEvent(e);
  }, [scrubFromEvent]);

  const handleScrubMove = useCallback((e: React.PointerEvent) => {
    if (!scrubbing) return;
    scrubFromEvent(e);
  }, [scrubbing, scrubFromEvent]);

  const handleScrubUp = useCallback(() => {
    setScrubbing(false);
  }, []);

  // ── Numerical input helpers ──
  const updateEl = useCallback((key: ElementKey, field: 'start' | 'duration', val: number) => {
    onConfigChange({ ...config, [key]: { ...config[key], [field]: Math.max(0, val) } });
  }, [config, onConfigChange]);

  // ── Render a timeline bar row ──
  const renderRow = (key: ElementKey) => {
    const el = config[key];
    const color = COLORS[key];
    const leftPct = (el.start / totalDuration) * 100;
    const widthPct = (el.duration / totalDuration) * 100;

    return (
      <div key={key} style={S.row}>
        <span style={{ ...S.rowLabel, color }}>{key.toUpperCase()}</span>

        <div style={S.trackBg}>
          {/* Playhead line */}
          <div style={{ ...S.playheadLine, left: `${(position / totalDuration) * 100}%` }} />

          {/* Bar body */}
          <div
            style={{
              position: 'absolute', left: `${leftPct}%`, width: `${widthPct}%`,
              top: 2, bottom: 2, background: color, opacity: 0.3,
              borderRadius: 2, cursor: 'grab',
            }}
            onPointerDown={e => handleBarDown(e, key, 'move')}
          />
          {/* Active fill (based on element progress) */}
          {(() => {
            const t = position;
            const p = t >= el.start ? Math.min(1, (t - el.start) / el.duration) : 0;
            if (p <= 0) return null;
            return (
              <div style={{
                position: 'absolute', left: `${leftPct}%`,
                width: `${widthPct * p}%`,
                top: 2, bottom: 2, background: color, opacity: 0.6,
                borderRadius: 2, pointerEvents: 'none',
              }} />
            );
          })()}
          {/* Left handle */}
          <div
            style={{ ...S.handle, left: `calc(${leftPct}% - 3px)` }}
            onPointerDown={e => handleBarDown(e, key, 'start')}
          >
            <div style={{ ...S.handleBar, background: color }} />
          </div>
          {/* Right handle */}
          <div
            style={{ ...S.handle, left: `calc(${leftPct}% + ${widthPct}% - 3px)` }}
            onPointerDown={e => handleBarDown(e, key, 'end')}
          >
            <div style={{ ...S.handleBar, background: color }} />
          </div>
        </div>

        {/* Numeric inputs */}
        <input
          type="number" step={50} value={el.start}
          onChange={e => updateEl(key, 'start', +e.target.value)}
          style={{ ...S.numInput, color }}
          title="start (ms)"
        />
        <input
          type="number" step={50} value={el.duration}
          onChange={e => updateEl(key, 'duration', +e.target.value)}
          style={{ ...S.numInput, color }}
          title="duration (ms)"
        />
      </div>
    );
  };

  const posFrac = totalDuration > 0 ? (position / totalDuration) * 100 : 0;

  return (
    <div style={S.panel}>
      <div style={S.header} onClick={() => setCollapsed(c => !c)}>
        <span>Animation Timeline</span>
        <span>{collapsed ? '+' : '\u2013'}</span>
      </div>
      {!collapsed && (
        <div style={S.body}>
          {/* ── Playback row ── */}
          <div style={S.playRow}>
            <button onClick={onPlayPause} style={S.btn} title={playing ? 'Pause' : 'Play'}>
              {playing ? '\u23F8' : '\u25B6'}
            </button>
            <button onClick={onReset} style={S.btn} title="Reset">
              {'\u23EE'}
            </button>

            {/* Master scrub track */}
            <div
              ref={trackRef}
              style={S.masterTrack}
              onPointerDown={handleScrubDown}
              onPointerMove={handleScrubMove}
              onPointerUp={handleScrubUp}
            >
              <div style={{ ...S.masterFill, width: `${posFrac}%` }} />
              <div style={{ ...S.masterHead, left: `${posFrac}%` }} />
            </div>

            <span style={S.time}>{Math.round(position)}<span style={{ opacity: 0.4 }}>/{totalDuration}ms</span></span>
          </div>

          {/* ── Column headers ── */}
          <div style={{ ...S.row, opacity: 0.35, marginBottom: -2 }}>
            <span style={S.rowLabel}>ELEM</span>
            <div style={{ flex: 1 }} />
            <span style={{ ...S.numInput, background: 'transparent', border: 'none', textAlign: 'center', cursor: 'default' }}>START</span>
            <span style={{ ...S.numInput, background: 'transparent', border: 'none', textAlign: 'center', cursor: 'default' }}>DUR</span>
          </div>

          {/* ── Element rows ── */}
          {KEYS.map(renderRow)}
        </div>
      )}
    </div>
  );
}

/* ─── Styles ────────────────────────────────────────────────────────────── */

const FONT = "'Pixeloid Sans', monospace";
const MONO = "'Pixeloid Mono', monospace";
const ACCENT = 'rgba(180,148,247,';

const S: Record<string, CSSProperties> = {
  panel: {
    position: 'fixed', bottom: 12, left: 12, zIndex: 99999,
    width: 480, fontFamily: FONT, fontSize: 11,
    color: '#f6f6f5', background: 'rgb(1,1,1)',
    border: `1px solid ${ACCENT}0.5)`, borderBottomColor: '#553691', borderRightColor: '#553691',
    boxShadow: '0 4px 24px rgba(0,0,0,0.6)', userSelect: 'none',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '6px 10px', borderBottom: `1px solid ${ACCENT}0.3)`,
    fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
    color: '#b494f7', cursor: 'pointer',
  },
  body: {
    padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6,
  },

  /* Playback */
  playRow: {
    display: 'flex', alignItems: 'center', gap: 6,
  },
  btn: {
    width: 28, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: `${ACCENT}0.15)`, border: `1px solid ${ACCENT}0.3)`,
    color: '#b494f7', fontSize: 11, cursor: 'pointer', fontFamily: FONT, borderRadius: 0,
    padding: 0, lineHeight: 1,
  },
  masterTrack: {
    flex: 1, height: 14, position: 'relative',
    background: `${ACCENT}0.08)`, border: `1px solid ${ACCENT}0.2)`,
    cursor: 'pointer', overflow: 'hidden',
  },
  masterFill: {
    position: 'absolute', inset: 0, right: 'unset',
    background: `${ACCENT}0.2)`, pointerEvents: 'none',
  },
  masterHead: {
    position: 'absolute', top: 0, bottom: 0, width: 2,
    background: '#b494f7', pointerEvents: 'none', marginLeft: -1,
  },
  time: {
    width: 90, textAlign: 'right', fontSize: 10, fontFamily: MONO,
    color: '#b494f7', flexShrink: 0,
  },

  /* Element rows */
  row: {
    display: 'flex', alignItems: 'center', gap: 6, height: 22,
  },
  rowLabel: {
    width: 50, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em',
    flexShrink: 0,
  },
  trackBg: {
    flex: 1, height: 18, position: 'relative',
    background: `${ACCENT}0.05)`, border: `1px solid ${ACCENT}0.1)`,
    overflow: 'visible',
  },
  playheadLine: {
    position: 'absolute', top: 0, bottom: 0, width: 1,
    background: 'rgba(246,246,245,0.15)', pointerEvents: 'none',
  },
  handle: {
    position: 'absolute', top: 0, bottom: 0, width: 6,
    cursor: 'ew-resize', zIndex: 2,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  handleBar: {
    width: 2, height: '60%', borderRadius: 1,
  },
  numInput: {
    width: 48, height: 18, padding: '0 4px',
    background: `${ACCENT}0.08)`, border: `1px solid ${ACCENT}0.15)`,
    color: '#b494f7', fontSize: 10, fontFamily: MONO,
    textAlign: 'right', outline: 'none',
  },
};
