'use client';

import React, { useState } from 'react';
import { Pattern } from '@rdna/radiants/components/core';
import {
  patternRegistry,
  PATTERN_GROUPS,
  getPatternsByGroup,
} from '@rdna/radiants/patterns';
import type { PatternEntry } from '@rdna/radiants/patterns';

// ============================================================================
// Constants
// ============================================================================

const RDNA_COLORS = [
  { label: 'Ink',          value: 'var(--color-ink)' },
  { label: 'Cream',        value: 'var(--color-cream)' },
  { label: 'Sun Yellow',   value: 'var(--color-sun-yellow)' },
  { label: 'Sunset Fuzz',  value: 'var(--color-sunset-fuzz)' },
  { label: 'Sun Red',      value: 'var(--color-sun-red)' },
  { label: 'Sky Blue',     value: 'var(--color-sky-blue)' },
  { label: 'Mint',         value: 'var(--color-mint)' },
];

const DENSITY_RAMP: string[] = [
  'dust', 'mist', 'scatter', 'rain', 'spray',
  'columns', 'checkerboard',
  'fill-75', 'fill-81', 'fill-88', 'fill-94', 'fill-97', 'solid',
];

const SCALE_OPTIONS: { value: 2 | 3 | 4; label: string }[] = [
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
  { value: 4, label: '4x' },
];

const TWO_TONE_DEMOS = [
  { pat: 'checkerboard', color: 'var(--color-sun-red)',    bg: 'var(--color-cream)',      label: 'Red on Cream' },
  { pat: 'diagonal',     color: 'var(--color-mint)',       bg: 'var(--color-ink)',         label: 'Mint on Ink' },
  { pat: 'confetti',     color: 'var(--color-sunset-fuzz)', bg: 'var(--color-sky-blue)',   label: 'Fuzz on Blue' },
  { pat: 'weave',        color: 'var(--color-ink)',        bg: 'var(--color-sun-yellow)',  label: 'Ink on Yellow' },
];

// ============================================================================
// Sub-components
// ============================================================================

function PatternCard({
  entry,
  color,
  scale,
}: {
  entry: PatternEntry;
  color: string;
  scale: 2 | 3 | 4;
}) {
  return (
    <div className="pixel-rounded-xs bg-page">
      <div className="flex items-start gap-3 p-3">
        {/* Pattern tile */}
        <div className="w-14 h-14 shrink-0 pixel-rounded-xs">
          <Pattern
            pat={entry.name}
            color={color}
            scale={scale}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <span className="font-heading text-sm text-main block truncate">
            {entry.name}
          </span>
          <span className="font-mono text-xs text-sub block">
            {entry.fill}%{' '}
            <span className="text-mute">{entry.hex}</span>
          </span>
          <span className="font-mono text-xs text-mute/60 block truncate">
            {entry.legacyName}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PatternsTab() {
  const [patColor, setPatColor] = useState('var(--color-ink)');
  const [patScale, setPatScale] = useState<2 | 3 | 4>(2);

  const densityEntries = DENSITY_RAMP
    .map((name) => patternRegistry.find((p) => p.name === name))
    .filter((p): p is PatternEntry => p != null);

  return (
    <div className="p-5 space-y-6">
      {/* ── Controls bar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* RDNA color swatches */}
        <span className="font-heading text-xs text-mute uppercase">Color</span>
        <div className="flex items-center gap-1.5">
          {RDNA_COLORS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              title={preset.label}
              onClick={() => setPatColor(preset.value)}
              className={`w-6 h-6 pixel-rounded-xs cursor-pointer transition-shadow ${
                patColor === preset.value
                  ? 'pixel-shadow-raised'
                  : ''
              }`}
              style={{ backgroundColor: preset.value }}
            />
          ))}
        </div>

        {/* Scale select */}
        <label className="flex items-center gap-2 ml-2">
          <span className="font-heading text-xs text-mute uppercase">Scale</span>
          <select
            value={patScale}
            onChange={(e) => setPatScale(Number(e.target.value) as 2 | 3 | 4)}
            className="font-mono text-sm text-main bg-page border border-line rounded-sm px-2 py-1 cursor-pointer"
          >
            {SCALE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* ── Density ramp strip ───────────────────────────────────── */}
      <div className="space-y-2">
        <h3>Density Ramp</h3>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {densityEntries.map((entry) => (
            <div key={entry.name} className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-12 h-12 pixel-rounded-xs">
                <Pattern
                  pat={entry.name}
                  color={patColor}
                  scale={patScale}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
              <span className="font-mono text-xs text-mute text-center leading-tight">
                {entry.fill}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pattern groups ───────────────────────────────────────── */}
      {PATTERN_GROUPS.map((group) => {
        const entries = getPatternsByGroup(group.key);
        return (
          <div key={group.key} className="space-y-2">
            <div>
              <h3>{group.label}</h3>
              <p className="text-sub">{group.desc}</p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-2">
              {entries.map((entry) => (
                <PatternCard
                  key={entry.name}
                  entry={entry}
                  color={patColor}
                  scale={patScale}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* ── Usage demos ──────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3>Usage Demos</h3>

        {/* Two-tone overlay examples */}
        <div className="space-y-2">
          <h4 className="font-heading text-xs text-mute uppercase">Two-Tone Overlays</h4>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2">
            {TWO_TONE_DEMOS.map((demo) => (
              <div key={demo.label} className="space-y-1">
                <div className="h-20 pixel-rounded-xs">
                  <Pattern
                    pat={demo.pat}
                    color={demo.color}
                    bg={demo.bg}
                    scale={patScale}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
                <span className="font-mono text-xs text-mute block">{demo.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scale comparison */}
        <div className="space-y-2">
          <h4 className="font-heading text-xs text-mute uppercase">Scale Comparison</h4>
          <div className="flex gap-2 flex-wrap">
            {([2, 3, 4] as const).map((s) => (
              <div key={s} className="space-y-1">
                <div className="w-20 h-20 pixel-rounded-xs">
                  <Pattern
                    pat="checkerboard"
                    color={patColor}
                    scale={s}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
                <span className="font-mono text-xs text-mute block text-center">{s}x</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
