'use client';

import { useState, useCallback } from 'react';
import { AppWindow } from '@rdna/radiants/components/core';

import type { PatternPlaygroundState } from './types';
import { DEFAULT_STATE } from './presets';
import { PatternGridPicker } from './PatternGridPicker';
import { PatternPreview } from './PatternPreview';
import { PatternCodeOutput } from './PatternCodeOutput';

// ============================================================================
// Main Component
// ============================================================================

export function PatternPlayground() {
  const [state, setState] = useState<PatternPlaygroundState>(DEFAULT_STATE);

  const handlePatternSelect = useCallback((name: string) => {
    setState((prev) => ({ ...prev, pat: name }));
  }, []);

  return (
    <AppWindow.Content>
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 flex">
          {/* ── Left: pattern picker sidebar ── */}
          <div className="w-64 shrink-0 border-r border-rule flex flex-col overflow-hidden">
            <div className="px-3 py-2">
              <span className="font-heading text-xs text-mute uppercase tracking-wide block mb-2">
                Pattern
              </span>
              <PatternGridPicker
                selected={state.pat}
                onSelect={handlePatternSelect}
                color={state.color}
              />
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
    </AppWindow.Content>
  );
}
