'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { DialPanel, useDialKit } from '@rdna/radiants/components/core';

import type { PatternPlaygroundState } from './types';
import { DEFAULT_STATE } from './presets';
import { PatternGridPicker } from './PatternGridPicker';
import { PatternPreview } from './PatternPreview';
import { PatternCodeOutput } from './PatternCodeOutput';
import { generateCode } from './code-gen';

// ============================================================================
// RDNA color options for DialKit select controls
// ============================================================================

const RDNA_COLOR_OPTIONS = [
  { value: 'var(--color-ink)',         label: 'Ink' },
  { value: 'var(--color-cream)',       label: 'Cream' },
  { value: 'var(--color-sun-yellow)',  label: 'Sun Yellow' },
  { value: 'var(--color-sunset-fuzz)', label: 'Sunset Fuzz' },
  { value: 'var(--color-sun-red)',     label: 'Sun Red' },
  { value: 'var(--color-sky-blue)',    label: 'Sky Blue' },
  { value: 'var(--color-mint)',        label: 'Mint' },
  { value: 'var(--color-pure-white)',  label: 'White' },
  { value: 'transparent',             label: 'Transparent' },
];

const GLOW_MID_OPTIONS = [
  { value: 'oklch(0.6 0.04 85)',  label: 'Warm Mid (default)' },
  { value: 'oklch(0.7 0.06 90)',  label: 'Bright Warm' },
  { value: 'oklch(0.5 0.05 160)', label: 'Cool Mid' },
  { value: 'oklch(0.55 0.05 60)', label: 'Amber Mid' },
  { value: 'oklch(0.65 0.06 85)', label: 'Light Warm' },
  { value: 'oklch(0.45 0.03 85)', label: 'Dim Warm' },
];

const GLOW_BASE_OPTIONS = [
  { value: 'oklch(0.45 0.01 85)',  label: 'Warm Grey (default)' },
  { value: 'oklch(0.35 0.02 85)',  label: 'Dark Warm' },
  { value: 'oklch(0.5 0.01 85)',   label: 'Mid Grey' },
  { value: 'oklch(0.3 0.01 160)',  label: 'Dark Cool' },
  { value: 'oklch(0.4 0.02 60)',   label: 'Dark Amber' },
  { value: 'oklch(0.25 0.005 85)', label: 'Near Black' },
];

const GLOW_SHAPE_OPTIONS = [
  { value: 'circle',  label: 'Circle' },
  { value: 'ellipse', label: 'Ellipse' },
];

// ============================================================================
// DialKit-driven controls — remounts on preset change via key
// ============================================================================

function PlaygroundControls({
  initial,
  onSync,
}: {
  initial: PatternPlaygroundState;
  onSync: (next: Partial<PatternPlaygroundState>) => void;
}) {
  const stateRef = useRef(initial);

  const params = useDialKit('Dithwather', {
    // ── Base ──
    foreground: { type: 'select' as const, options: RDNA_COLOR_OPTIONS, default: initial.color },
    background: { type: 'select' as const, options: RDNA_COLOR_OPTIONS, default: initial.bg },
    scale: [initial.scale, 1, 4, 1],

    // ── Gradient (mouse follower) ──
    gradient: {
      enabled: initial.glowEnabled,
      shape: { type: 'select' as const, options: GLOW_SHAPE_OPTIONS, default: initial.glowShape },
      center: { type: 'select' as const, options: RDNA_COLOR_OPTIONS, default: initial.glowCenter },
      mid: { type: 'select' as const, options: GLOW_MID_OPTIONS, default: initial.glowMid },
      midStop: [initial.glowMidStop, 10, 80, 1],
      base: { type: 'select' as const, options: GLOW_BASE_OPTIONS, default: initial.glowBase },
      radius: [initial.glowRadius, 50, 400, 10],
    },

    // ── Actions ──
    copyJSX: { type: 'action' as const, label: 'Copy JSX' },
    copyCSS: { type: 'action' as const, label: 'Copy CSS' },
  }, {
    onAction: (action: string) => {
      if (action === 'copyJSX') {
        navigator.clipboard.writeText(generateCode('jsx', stateRef.current));
      }
      if (action === 'copyCSS') {
        navigator.clipboard.writeText(generateCode('css', stateRef.current));
      }
    },
  });

  // Sync DialKit → playground state
  useEffect(() => {
    const grad = params.gradient as {
      enabled: boolean; shape: string; center: string;
      mid: string; midStop: number; base: string; radius: number;
    };

    const next: Partial<PatternPlaygroundState> = {
      color: params.foreground as string,
      bg: params.background as string,
      scale: Math.round(params.scale as number) as 1 | 2 | 3 | 4,
      glowEnabled: grad.enabled,
      glowShape: grad.shape as 'circle' | 'ellipse',
      glowCenter: grad.center,
      glowMid: grad.mid,
      glowMidStop: grad.midStop,
      glowBase: grad.base,
      glowRadius: grad.radius,
    };

    const prev = stateRef.current;
    const changed = (Object.keys(next) as (keyof PatternPlaygroundState)[]).some(
      (k) => (next as unknown as Record<string, unknown>)[k] !== (prev as unknown as Record<string, unknown>)[k]
    );
    if (changed) {
      stateRef.current = { ...prev, ...next };
      onSync(next);
    }
  });

  return null; // DialKit renders via DialPanel
}

// ============================================================================
// Main Component
// ============================================================================

export function PatternPlayground() {
  const [state, setState] = useState<PatternPlaygroundState>(DEFAULT_STATE);

  const handlePatternSelect = useCallback((name: string) => {
    setState((prev) => ({ ...prev, pat: name }));
  }, []);

  const handleSync = useCallback((partial: Partial<PatternPlaygroundState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const panelHeader = (
    <div className="px-3 py-2 border-b border-rule">
      <span className="font-heading text-xs text-mute uppercase tracking-wide block mb-2">
        Pattern
      </span>
      <PatternGridPicker
        selected={state.pat}
        onSelect={handlePatternSelect}
        color={state.color}
      />
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 flex">
        <DialPanel header={panelHeader}>
          <PlaygroundControls initial={state} onSync={handleSync} />
        </DialPanel>

        {/* ── Right: preview area ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          <PatternPreview state={state} />
        </div>
      </div>

      {/* ── Bottom: code output ── */}
      <PatternCodeOutput state={state} />
    </div>
  );
}
