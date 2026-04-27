'use client';

import { useState } from 'react';
import type { BrandColor, ExtendedColor, HierarchyMode } from './types';
import { BRAND_COLORS, EXTENDED_COLORS } from './data';

const ALL_PRIMITIVES: readonly (BrandColor | ExtendedColor)[] = [
  ...BRAND_COLORS,
  ...EXTENDED_COLORS,
];

const byVar = (cssVar: string) =>
  ALL_PRIMITIVES.find((c) => c.cssVar === cssVar)!;

const TAB_ORDER: readonly string[] = [
  '--color-sun-yellow',
  '--color-cream',
  '--color-pure-white',
  '--color-ink',
  '--color-pure-black',
  '--color-mint',
  '--color-sky-blue',
  '--color-sun-red',
  '--color-sunset-fuzz',
];
const TABS: readonly (BrandColor | ExtendedColor)[] = TAB_ORDER.map(byVar);

const LIGHT_TONES = new Set([
  '#FEF8E2', '#FCE184', '#CEF5CA', '#FCC383', '#95BAD2', '#FF7F7F', '#FFFFFF',
]);

interface ColorPrimaryCardProps {
  selected: BrandColor | ExtendedColor;
  mode: HierarchyMode;
  onSelect: (color: BrandColor | ExtendedColor) => void;
}

export function ColorPrimaryCard({ selected, mode, onSelect }: ColorPrimaryCardProps) {
  const isLight = LIGHT_TONES.has(selected.hex);
  const activeCssVar = selected.cssVar;
  const lineCss = mode === 'light' ? 'var(--color-ink)' : 'var(--color-cream)';

  return (
    <div
      className="pixel-rounded-6 pixel-shadow-raised flex flex-col gap-px w-full"
      style={{ backgroundColor: lineCss }}
    >
      {/* Horizontal tab rail — top, spans full card width */}
      <div className="flex h-5 shrink-0 gap-px" style={{ backgroundColor: lineCss }}>
        {TABS.map((c) => {
          const active = c.cssVar === activeCssVar;
          return (
            // eslint-disable-next-line rdna/prefer-rdna-components -- reason:tab-color-chip-no-label owner:design expires:2027-01-01 issue:DNA-001
            <button
              key={c.cssVar}
              type="button"
              onClick={() => onSelect(c)}
              aria-label={c.name}
              aria-pressed={active}
              title={c.name}
              // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-showcase owner:design expires:2027-01-01 issue:DNA-001
              style={{ backgroundColor: c.hex }}
              className="flex-1 cursor-pointer"
            />
          );
        })}
      </div>

      {/* Content row — swatch left, data rows right */}
      <div className="flex gap-px" style={{ backgroundColor: lineCss }}>
        {/* Swatch */}
        {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-showcase owner:design expires:2027-01-01 issue:DNA-001 */}
        <div
          className="w-40 aspect-square shrink-0 flex flex-col justify-end p-3"
          style={{ backgroundColor: selected.hex }}
        >
          {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-showcase owner:design expires:2027-01-01 issue:DNA-001 */}
          <span className={`font-joystix text-sm leading-none truncate ${isLight ? 'text-ink' : 'text-cream'}`}>
            {selected.name}
          </span>
        </div>

        {/* Data rows */}
        <div className="bg-page flex-1 min-w-0 flex flex-col divide-y divide-rule">
          <CompactRow label="CSS" value={`var(${selected.cssVar})`} />
          <CompactRow label="TW" value={`bg-${selected.tailwind}`} />
          <CompactRow label="OKLCH" value={selected.oklch} />
          <CompactRow label="HEX" value={selected.hex} />
        </div>
      </div>
    </div>
  );
}

function CompactRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    // eslint-disable-next-line rdna/prefer-rdna-components -- reason:copy-row-interactive owner:design expires:2027-01-01 issue:DNA-001
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="flex-1 flex items-center gap-2 w-full px-3 text-left hover:bg-hover transition-colors cursor-pointer"
    >
      <span className="font-mono text-xs text-mute w-14 shrink-0 uppercase tracking-tight">{label}</span>
      <code className="font-mono text-xs text-main whitespace-nowrap truncate min-w-0">
        {copied ? '✓ copied' : value}
      </code>
    </button>
  );
}
