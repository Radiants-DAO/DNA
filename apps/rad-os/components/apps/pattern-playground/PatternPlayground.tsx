'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { DialRoot, useDialKit } from 'dialkit';
import 'dialkit/styles.css';
import { Button, ToggleGroup } from '@rdna/radiants/components/core';

import type { PatternPlaygroundState } from './types';
import { PRESETS, DEFAULT_STATE } from './presets';
import { PatternGridPicker } from './PatternGridPicker';
import { PatternPreview } from './PatternPreview';
import { PatternCodeOutput } from './PatternCodeOutput';
import { generateCode } from './code-gen';

// ============================================================================
// DialKit-driven controls component
// ============================================================================

function PlaygroundControls({
  state,
  onChange,
}: {
  state: PatternPlaygroundState;
  onChange: (next: PatternPlaygroundState) => void;
}) {
  const params = useDialKit('Dithwather', {
    // ── Base ──
    foreground: state.color,
    background: state.bg === 'transparent' ? '#FFFFFF00' : state.bg,
    scale: [state.scale, 1, 4, 1],

    // ── Hover ──
    hover: {
      color: state.hoverColor,
      bg: state.hoverBg === 'transparent' ? '#FFFFFF00' : state.hoverBg,
      scale: [state.hoverScale, 0.8, 1.3, 0.01],
      opacity: [state.hoverOpacity, 0, 1],
    },

    // ── Pressed ──
    pressed: {
      color: state.pressedColor,
      bg: state.pressedBg === 'transparent' ? '#FFFFFF00' : state.pressedBg,
      scale: [state.pressedScale, 0.8, 1.1, 0.01],
      translateY: [state.pressedTranslateY, 0, 6, 0.5],
    },

    // ── Glow ──
    glow: {
      enabled: state.glowEnabled,
      center: state.glowCenter,
      spread: [state.glowSpread, 10, 80, 1],
      fade: [state.glowFade, 50, 100, 1],
    },

    // ── Actions ──
    copyJSX: { type: 'action' as const, label: 'Copy JSX' },
    copyCSS: { type: 'action' as const, label: 'Copy CSS' },
  }, {
    onAction: (action: string) => {
      if (action === 'copyJSX') {
        navigator.clipboard.writeText(generateCode('jsx', state));
      }
      if (action === 'copyCSS') {
        navigator.clipboard.writeText(generateCode('css', state));
      }
    },
  });

  // Sync DialKit values → playground state
  useEffect(() => {
    const next: PatternPlaygroundState = {
      ...state,
      color: params.foreground as string,
      bg: (params.background as string) === '#FFFFFF00' ? 'transparent' : params.background as string,
      scale: Math.round(params.scale as number) as 1 | 2 | 3 | 4,
      hoverColor: (params.hover as { color: string }).color,
      hoverBg: (params.hover as { bg: string }).bg === '#FFFFFF00' ? 'transparent' : (params.hover as { bg: string }).bg,
      hoverScale: (params.hover as { scale: number }).scale,
      hoverOpacity: (params.hover as { opacity: number }).opacity,
      pressedColor: (params.pressed as { color: string }).color,
      pressedBg: (params.pressed as { bg: string }).bg === '#FFFFFF00' ? 'transparent' : (params.pressed as { bg: string }).bg,
      pressedScale: (params.pressed as { scale: number }).scale,
      pressedTranslateY: (params.pressed as { translateY: number }).translateY,
      glowEnabled: (params.glow as { enabled: boolean }).enabled,
      glowCenter: (params.glow as { center: string }).center,
      glowSpread: (params.glow as { spread: number }).spread,
      glowFade: (params.glow as { fade: number }).fade,
    };

    // Only fire onChange if something actually changed
    const changed = (Object.keys(next) as (keyof PatternPlaygroundState)[]).some(
      (k) => next[k] !== state[k]
    );
    if (changed) onChange(next);
  });

  return null; // DialKit renders via DialRoot
}

// ============================================================================
// Main Component
// ============================================================================

export function PatternPlayground() {
  const [state, setState] = useState<PatternPlaygroundState>(DEFAULT_STATE);
  const [activePreset, setActivePreset] = useState(0);

  const handlePatternSelect = useCallback((name: string) => {
    setState((prev) => ({ ...prev, pat: name }));
  }, []);

  const handlePreset = useCallback((index: number) => {
    setActivePreset(index);
    setState(PRESETS[index].state);
  }, []);

  const handleChange = useCallback((next: PatternPlaygroundState) => {
    setState(next);
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
          <div className="flex-1 min-h-0 overflow-hidden [&_.dialkit-panel]:!bg-transparent [&_.dialkit-panel]:!border-0 [&_.dialkit-panel]:!shadow-none">
            <DialRoot mode="inline" />
            <PlaygroundControls state={state} onChange={handleChange} />
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
