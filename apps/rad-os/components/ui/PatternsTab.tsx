'use client';

import React, { useState } from 'react';
import { Pattern, Button } from '@rdna/radiants/components/core';
import {
  patternRegistry,
  PATTERN_GROUPS,
  getPatternsByGroup,
} from '@rdna/radiants/patterns';
import type { PatternEntry } from '@rdna/radiants/patterns';

// ============================================================================
// Constants
// ============================================================================

const PRESET_COLORS = [
  { label: 'Black',      value: '#000000' },
  { label: 'Terracotta', value: '#c8553a' },
  { label: 'Forest',     value: '#2d6a4f' },
  { label: 'Cobalt',     value: '#4361a8' },
  { label: 'Peach',      value: '#e8a87c' },
  { label: 'Umber',      value: '#8b5e3c' },
];

const DENSITY_RAMP: string[] = [
  'dust', 'mist', 'scatter', 'rain', 'spray',
  'columns', 'checkerboard',
  'fill-75', 'fill-81', 'fill-88', 'fill-94', 'fill-97', 'solid',
];

const SCALE_OPTIONS: { value: 1 | 2 | 3 | 4; label: string }[] = [
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
  { value: 4, label: '4x' },
];

const TWO_TONE_DEMOS = [
  { pat: 'checkerboard', color: '#c8553a', bg: '#fef8e2', label: 'Terracotta on Cream' },
  { pat: 'diagonal',     color: '#2d6a4f', bg: '#0f0e0c', label: 'Forest on Ink' },
  { pat: 'confetti',     color: '#e8a87c', bg: '#4361a8', label: 'Peach on Cobalt' },
  { pat: 'weave',        color: '#8b5e3c', bg: '#fce184', label: 'Umber on Sun Yellow' },
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
  scale: 1 | 2 | 3 | 4;
}) {
  return (
    <div className="border border-line pixel-rounded-xs overflow-hidden bg-page">
      <div className="flex items-start gap-3 p-3">
        {/* Pattern tile */}
        <div className="w-14 h-14 shrink-0 border border-line pixel-rounded-xs overflow-hidden">
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
  const [patColor, setPatColor] = useState('#000000');
  const [patScale, setPatScale] = useState<1 | 2 | 3 | 4>(1);

  const densityEntries = DENSITY_RAMP
    .map((name) => patternRegistry.find((p) => p.name === name))
    .filter((p): p is PatternEntry => p != null);

  return (
    <div className="p-5 space-y-6">
      {/* ── Controls bar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Color picker */}
        <label className="flex items-center gap-2">
          <span className="font-heading text-xs text-mute uppercase">Color</span>
          <input
            type="color"
            value={patColor}
            onChange={(e) => setPatColor(e.target.value)}
            className="w-8 h-8 border border-line pixel-rounded-xs cursor-pointer bg-transparent"
          />
        </label>

        {/* Scale select */}
        <label className="flex items-center gap-2">
          <span className="font-heading text-xs text-mute uppercase">Scale</span>
          <select
            value={patScale}
            onChange={(e) => setPatScale(Number(e.target.value) as 1 | 2 | 3 | 4)}
            className="font-mono text-sm text-main bg-page border border-line pixel-rounded-xs px-2 py-1 cursor-pointer"
          >
            {SCALE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        {/* Preset color buttons */}
        <div className="flex items-center gap-1.5">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              title={preset.label}
              onClick={() => setPatColor(preset.value)}
              className={`w-6 h-6 border pixel-rounded-xs cursor-pointer transition-shadow ${
                patColor === preset.value
                  ? 'border-main pixel-shadow-raised'
                  : 'border-line hover:border-line-hover'
              }`}
              // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:pattern-color-preset-swatches owner:design expires:2027-01-01 issue:DNA-001
              style={{ backgroundColor: preset.value }}
            />
          ))}
        </div>
      </div>

      {/* ── Density ramp strip ───────────────────────────────────── */}
      <div className="space-y-2">
        <h3>Density Ramp</h3>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {densityEntries.map((entry) => (
            <div key={entry.name} className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-12 h-12 border border-line pixel-rounded-xs overflow-hidden">
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
                <div className="h-20 border border-line pixel-rounded-xs overflow-hidden">
                  {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:pattern-demo-showcase owner:design expires:2027-01-01 issue:DNA-001 */}
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
            {([1, 2, 3, 4] as const).map((s) => (
              <div key={s} className="space-y-1">
                <div className="w-20 h-20 border border-line pixel-rounded-xs overflow-hidden">
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
