'use client';

import { useState } from 'react';
import type { SemanticToken, SemanticCategory } from './types';

export function SemanticTokenRow({ token }: { token: SemanticToken }) {
  const [copied, setCopied] = useState(false);

  return (
    // eslint-disable-next-line rdna/prefer-rdna-components -- reason:table-row-interactive owner:design expires:2027-01-01 issue:DNA-001
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(`var(${token.cssVar})`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-hover transition-colors cursor-pointer group"
    >
      {/* Sun Mode swatch */}
      {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-showcase owner:design expires:2027-01-01 issue:DNA-001 */}
      <span
        className="w-5 h-5 pixel-rounded-6 shrink-0"
        style={{ backgroundColor: token.lightHex }}
        title={`Sun Mode: ${token.lightHex}`}
      />

      {/* Token name */}
      <span className="font-joystix text-xs uppercase text-main min-w-[80px]">
        {token.name}
      </span>

      {/* CSS var */}
      <code className="flex-1 min-w-0 font-mono text-xs text-mute truncate group-hover:text-main transition-colors">
        {copied ? '✓ copied' : `var(${token.cssVar})`}
      </code>

      {/* Usage note */}
      <span className="font-mondwest text-xs text-mute shrink-0 hidden @sm:inline">
        {token.note}
      </span>

      {/* Moon Mode swatch */}
      <span
        className="w-5 h-5 pixel-rounded-6 shrink-0"
        title={`Moon Mode: ${token.darkHex}`}
      >
        {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-showcase owner:design expires:2027-01-01 issue:DNA-001 */}
        <span className="block w-full h-full" style={{ backgroundColor: token.darkHex }} />
      </span>
    </button>
  );
}

export function SemanticCategoryCard({ category, index }: { category: SemanticCategory; index: number }) {
  return (
    <div className="pixel-rounded-6">
      {/* Header */}
      <div className="bg-inv px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-flip/40">{String(index + 1).padStart(2, '0')}</span>
          <span className="font-joystix text-sm text-flip uppercase tracking-wide">{category.name}</span>
        </div>
        <span className="font-mondwest text-xs text-flip/60 shrink-0 hidden @sm:block">{category.description}</span>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-rule bg-depth">
        <span className="w-5 font-mono text-xs text-center text-mute">LT</span>
        <span className="font-mono text-xs text-mute min-w-[80px]">TOKEN</span>
        <span className="font-mono text-xs text-mute flex-1">VAR</span>
        <span className="font-mono text-xs text-mute hidden @sm:block shrink-0">USAGE</span>
        <span className="w-5 font-mono text-xs text-center text-mute">DK</span>
      </div>

      {/* Token rows */}
      <div className="divide-y divide-rule">
        {category.tokens.map((token) => (
          <SemanticTokenRow key={token.cssVar} token={token} />
        ))}
      </div>
    </div>
  );
}
