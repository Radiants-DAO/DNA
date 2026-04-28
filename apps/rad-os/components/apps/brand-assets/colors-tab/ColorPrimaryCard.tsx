'use client';

import { useState } from 'react';
import { CompactRowButton } from '@rdna/radiants/components/core';
import type { BrandColor, ExtendedColor } from './types';

const LIGHT_TONES = new Set([
  '#FEF8E2', '#FCE184', '#CEF5CA', '#FCC383', '#95BAD2', '#FF7F7F', '#FFFFFF',
]);

interface ColorPrimaryCardProps {
  selected: BrandColor | ExtendedColor;
}

export function ColorPrimaryCard({ selected }: ColorPrimaryCardProps) {
  const isLight = LIGHT_TONES.has(selected.hex);
  const lineCss = 'var(--color-ink)';

  return (
    <div
      className="flex shrink-0 flex-col gap-px w-full"
      style={{ backgroundColor: lineCss }}
    >
      {/* Content row — swatch left, data rows right */}
      <div className="flex gap-px" style={{ backgroundColor: lineCss }}>
        {/* Swatch */}
        <div
          data-rdna-brand-primitive
          className="w-40 aspect-square shrink-0 flex flex-col justify-end p-3"
          style={{ backgroundColor: selected.hex }}
        >
          <span data-rdna-brand-primitive className={`font-joystix text-sm leading-none truncate ${isLight ? 'text-ink' : 'text-cream'}`}>
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
    <CompactRowButton
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="flex-1 gap-2 px-3 text-main"
      leading={<span className="font-mono text-xs text-mute w-14 uppercase tracking-tight">{label}</span>}
    >
      <code className="font-mono text-xs text-main whitespace-nowrap truncate min-w-0">
        {copied ? '✓ copied' : value}
      </code>
    </CompactRowButton>
  );
}
