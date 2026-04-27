'use client';

import { SEMANTIC_CATEGORIES } from './data';
import { SemanticCategoryCard } from './ColorCards';

export function SemanticView() {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-end justify-between border-b border-rule pb-3 gap-4">
        <div>
          <h2 className="text-main leading-tight">Semantic Tokens</h2>
          <p className="text-sm text-mute mt-1">
            Purpose-based tokens that flip in light/dark mode. Audited against{' '}
            <code className="font-mono text-xs">tokens.css</code>.
          </p>
        </div>
        <span className="font-mono text-xs text-mute shrink-0">tokens.css / dark.css</span>
      </div>
      <div className="space-y-3">
        {SEMANTIC_CATEGORIES.map((category, i) => (
          <SemanticCategoryCard key={category.name} category={category} index={i} />
        ))}
      </div>
    </div>
  );
}
