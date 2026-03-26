'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DialRoot, useDialKit } from 'dialkit';
import 'dialkit/styles.css';
import './dialkit-rdna.css';
import { Button } from '@rdna/radiants/components/core';

import type { PatternPlaygroundState } from './types';
import { PRESETS, DEFAULT_STATE } from './presets';
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

const GLOW_BASE_OPTIONS = [
  { value: 'oklch(0.45 0.01 85)',  label: 'Warm Grey (default)' },
  { value: 'oklch(0.35 0.02 85)',  label: 'Dark Warm' },
  { value: 'oklch(0.5 0.01 85)',   label: 'Mid Grey' },
  { value: 'oklch(0.3 0.01 160)',  label: 'Dark Cool' },
  { value: 'oklch(0.4 0.02 60)',   label: 'Dark Amber' },
  { value: 'oklch(0.25 0.005 85)', label: 'Near Black' },
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

    // ── Glow (mouse follower) ──
    glow: {
      enabled: initial.glowEnabled,
      color: { type: 'select' as const, options: RDNA_COLOR_OPTIONS, default: initial.glowCenter },
      radius: [initial.glowRadius, 50, 400, 10],
      base: { type: 'select' as const, options: GLOW_BASE_OPTIONS, default: initial.glowBase },
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
    const glow = params.glow as { enabled: boolean; color: string; radius: number; base: string };

    const next: Partial<PatternPlaygroundState> = {
      color: params.foreground as string,
      bg: params.background as string,
      scale: Math.round(params.scale as number) as 1 | 2 | 3 | 4,
      glowEnabled: glow.enabled,
      glowCenter: glow.color,
      glowRadius: glow.radius,
      glowBase: glow.base,
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

  return null; // DialKit renders via DialRoot
}

// ============================================================================
// Main Component
// ============================================================================

export function PatternPlayground() {
  const [state, setState] = useState<PatternPlaygroundState>(DEFAULT_STATE);
  const [activePreset, setActivePreset] = useState(0);
  const [dialKey, setDialKey] = useState(0);

  const handlePatternSelect = useCallback((name: string) => {
    setState((prev) => ({ ...prev, pat: name }));
  }, []);

  const handlePreset = useCallback((index: number) => {
    setActivePreset(index);
    setState(PRESETS[index].state);
    setDialKey((k) => k + 1);
  }, []);

  const handleSync = useCallback((partial: Partial<PatternPlaygroundState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 flex">
        {/* ── Left sidebar: pattern picker + DialKit controls ── */}
        <div className="w-64 shrink-0 border-r border-rule flex flex-col overflow-hidden">
          {/* Presets */}
          <div className="px-3 pt-3 pb-2 border-b border-rule space-y-2">
            <span className="font-heading text-xs text-mute uppercase tracking-wide block">
              Presets
            </span>
            <div className="flex flex-wrap gap-1">
              {PRESETS.map((preset, i) => (
                <Button
                  key={preset.name}
                  size="sm"
                  compact
                  quiet={activePreset !== i}
                  onClick={() => handlePreset(i)}
                  title={preset.description}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Pattern grid */}
          <div className="px-3 py-2 border-b border-rule overflow-y-auto max-h-56">
            <span className="font-heading text-xs text-mute uppercase tracking-wide block mb-2">
              Pattern
            </span>
            <PatternGridPicker
              selected={state.pat}
              onSelect={handlePatternSelect}
              color={state.color}
            />
          </div>

          {/* DialKit inline panel */}
          <div
            key={dialKey}
            className="flex-1 min-h-0 overflow-y-auto [&_.dialkit-panel]:!bg-transparent [&_.dialkit-panel]:!border-0 [&_.dialkit-panel]:!shadow-none"
          >
            <DialRoot mode="inline" />
            <PlaygroundControls initial={state} onSync={handleSync} />
          </div>
        </div>

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
