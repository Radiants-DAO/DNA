'use client';

import { useState, useCallback } from 'react';

import type { PatternPlaygroundState } from './types';
import { DEFAULT_STATE } from './presets';
import { PatternGridPicker } from './PatternGridPicker';
import { PatternPreview } from './PatternPreview';
import { PatternCodeOutput } from './PatternCodeOutput';
import { GlowControls } from './GlowControls';

// ============================================================================
// Main Component
// ============================================================================

export function PatternPlayground() {
  const [state, setState] = useState<PatternPlaygroundState>(DEFAULT_STATE);

  const handlePatternSelect = useCallback((name: string) => {
    setState((prev) => ({ ...prev, pat: name }));
  }, []);

  const handleGlowChange = useCallback((patch: Partial<PatternPlaygroundState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 flex">
        {/* ── Left: pattern picker sidebar ── */}
        <div className="w-64 shrink-0 border-r border-rule flex flex-col overflow-hidden">
          <div className="px-3 py-2 flex flex-col gap-3 overflow-y-auto">
            <span className="font-heading text-xs text-mute uppercase tracking-wide block">
              Pattern
            </span>
            <PatternGridPicker
              selected={state.pat}
              onSelect={handlePatternSelect}
              color={state.color}
            />
            <GlowControls state={state} onChange={handleGlowChange} />
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
