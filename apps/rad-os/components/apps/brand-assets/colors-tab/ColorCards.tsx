'use client';

import { useState } from 'react';
import { CompactRowButton } from '@rdna/radiants/components/core';
import type { SemanticToken, SemanticCategory } from './types';

export function SemanticTokenRow({ token }: { token: SemanticToken }) {
  const [copied, setCopied] = useState(false);

  return (
    <CompactRowButton
      onClick={async () => {
        await navigator.clipboard.writeText(`var(${token.cssVar})`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="group gap-3 px-4 py-3 text-main"
      leading={(
        <span
          data-rdna-brand-primitive
          className="size-5 pixel-rounded-6"
          style={{ backgroundColor: token.lightHex }}
          title={`Sun Mode: ${token.lightHex}`}
        />
      )}
      trailing={(
        <span
          className="size-5 pixel-rounded-6"
          title={`Moon Mode: ${token.darkHex}`}
        >
          <span data-rdna-brand-primitive className="block size-full" style={{ backgroundColor: token.darkHex }} />
        </span>
      )}
    >
      <span className="font-joystix text-xs uppercase text-main min-w-20">
        {token.name}
      </span>
      <code className="font-mono text-xs text-mute group-hover:text-main transition-colors">
        {copied ? '✓ copied' : `var(${token.cssVar})`}
      </code>
      <span className="font-mondwest text-xs text-mute shrink-0 hidden @sm:inline">
        {token.note}
      </span>
    </CompactRowButton>
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
        <span className="font-mono text-xs text-mute min-w-20">TOKEN</span>
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
