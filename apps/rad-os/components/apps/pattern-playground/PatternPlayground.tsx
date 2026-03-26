'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DialRoot, useDialKit } from 'dialkit';
import 'dialkit/styles.css';
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

    // ── Hover ──
    hover: {
      color: { type: 'select' as const, options: RDNA_COLOR_OPTIONS, default: initial.hoverColor },
      bg: { type: 'select' as const, options: RDNA_COLOR_OPTIONS, default: initial.hoverBg },
      scale: [initial.hoverScale, 0.8, 1.3, 0.01],
      opacity: [initial.hoverOpacity, 0, 1],
    },

    // ── Pressed ──
    pressed: {
      color: { type: 'select' as const, options: RDNA_COLOR_OPTIONS, default: initial.pressedColor },
      bg: { type: 'select' as const, options: RDNA_COLOR_OPTIONS, default: initial.pressedBg },
      scale: [initial.pressedScale, 0.8, 1.1, 0.01],
      translateY: [initial.pressedTranslateY, 0, 6, 0.5],
    },

    // ── Glow ──
    glow: {
      enabled: initial.glowEnabled,
      center: { type: 'select' as const, options: RDNA_COLOR_OPTIONS, default: initial.glowCenter },
      spread: [initial.glowSpread, 10, 80, 1],
      fade: [initial.glowFade, 50, 100, 1],
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

  // Sync DialKit → playground state on every render
  useEffect(() => {
    const hover = params.hover as { color: string; bg: string; scale: number; opacity: number };
    const pressed = params.pressed as { color: string; bg: string; scale: number; translateY: number };
    const glow = params.glow as { enabled: boolean; center: string; spread: number; fade: number };

    const next: Partial<PatternPlaygroundState> = {
      color: params.foreground as string,
      bg: params.background as string,
      scale: Math.round(params.scale as number) as 1 | 2 | 3 | 4,
      hoverColor: hover.color,
      hoverBg: hover.bg,
      hoverScale: hover.scale,
      hoverOpacity: hover.opacity,
      pressedColor: pressed.color,
      pressedBg: pressed.bg,
      pressedScale: pressed.scale,
      pressedTranslateY: pressed.translateY,
      glowEnabled: glow.enabled,
      glowCenter: glow.center,
      glowSpread: glow.spread,
      glowFade: glow.fade,
    };

    // Only sync if something changed
    const prev = stateRef.current;
    const changed = (Object.keys(next) as (keyof PatternPlaygroundState)[]).some(
      (k) => (next as Record<string, unknown>)[k] !== (prev as Record<string, unknown>)[k]
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
  // Key forces DialKit remount when preset changes — resets all controls to preset values
  const [dialKey, setDialKey] = useState(0);

  const handlePatternSelect = useCallback((name: string) => {
    setState((prev) => ({ ...prev, pat: name }));
  }, []);

  const handlePreset = useCallback((index: number) => {
    setActivePreset(index);
    setState(PRESETS[index].state);
    setDialKey((k) => k + 1); // force DialKit remount
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
