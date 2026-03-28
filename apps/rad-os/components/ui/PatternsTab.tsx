'use client';

import { useState, useCallback } from 'react';
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

const DENSITY_RAMP: string[] = [
  'dust', 'mist', 'scatter', 'rain', 'spray',
  'columns', 'checkerboard',
  'fill-75', 'fill-81', 'fill-88', 'fill-94', 'fill-97', 'solid',
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
  bg,
}: {
  entry: PatternEntry;
  color: string;
  scale: 1 | 2 | 3 | 4;
  bg?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const props = [`pat="${entry.name}"`, `color="${color}"`, `scale={${scale}}`];
    if (bg) props.push(`bg="${bg}"`);
    navigator.clipboard.writeText(`<Pattern ${props.join(' ')} />`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [entry.name, color, scale, bg]);

  return (
    // eslint-disable-next-line rdna/prefer-rdna-components -- reason:pattern-card-uses-full-tile-click-target owner:design-system expires:2026-12-31 issue:DNA-001
    <button
      type="button"
      onClick={handleCopy}
      className="group relative pixel-rounded-xs cursor-pointer text-left aspect-square"
    >
      {/* Pattern fills the entire card */}
      <Pattern
        pat={entry.name}
        color={color}
        bg={bg}
        scale={scale}
        style={{ position: 'absolute', inset: 0 }}
      />

      {/* Hover badge */}
      <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-fast">
        <div className="bg-inv text-flip px-2 py-1 pixel-rounded-xs">
          <span className="font-heading text-xs block truncate">
            {copied ? 'Copied!' : entry.name}
          </span>
          <span className="font-mono text-xs text-flip/60 block">
            {entry.fill}%
          </span>
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface PatternsTabProps {
  color: string;
  scale: 1 | 2 | 3 | 4;
  bg?: string;
}

export function PatternsTab({ color, scale, bg }: PatternsTabProps) {
  const densityEntries = DENSITY_RAMP
    .map((name) => patternRegistry.find((p) => p.name === name))
    .filter((p): p is PatternEntry => p != null);

  return (
    <div className="space-y-6">
      {/* ── Density ramp strip ───────────────────────────────────── */}
      <div className="space-y-2">
        <h3>Density Ramp</h3>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {densityEntries.map((entry) => (
            <div key={entry.name} className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-12 h-12 pixel-rounded-xs">
                <Pattern
                  pat={entry.name}
                  color={color}
                  bg={bg}
                  scale={scale}
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
            <div className="grid grid-cols-4 gap-2">
              {entries.map((entry) => (
                <PatternCard
                  key={entry.name}
                  entry={entry}
                  color={color}
                  scale={scale}
                  bg={bg}
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
                    scale={scale}
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
                    color={color}
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
