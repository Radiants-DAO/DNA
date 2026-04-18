'use client';

import type { ReactNode } from 'react';

// =============================================================================
// LayerTreeRow — Hierarchical tree row for layer/element panels
//
// Paper ref: 11 — Layer Tree Row
// Indent per depth. Expand/collapse arrow. Visibility toggle.
// Selected: gold border + slightly brighter bg. Tag label right-aligned.
// =============================================================================

interface LayerTreeRowProps {
  label: string;
  /** Indentation depth (0 = root) */
  depth?: number;
  /** Expand/collapse state — undefined if leaf node */
  expanded?: boolean;
  selected?: boolean;
  /** Right-aligned tag label (e.g., "div", "main", "header") */
  tag?: string;
  onToggleExpand?: () => void;
  onSelect?: () => void;
  children?: ReactNode;
  className?: string;
}

export function LayerTreeRow({
  label,
  depth = 0,
  expanded,
  selected = false,
  tag,
  onToggleExpand,
  onSelect,
  children,
  className = '',
}: LayerTreeRowProps) {
  const isExpandable = expanded !== undefined;

  return (
    <div data-rdna="ctrl-layer-tree-row" className={className}>
      {/* Row */}
      <div
        role="button"
        tabIndex={0}
        className={[
          'flex items-center min-h-5 font-mono text-[0.625rem] uppercase tracking-wider',
          'transition-all duration-fast cursor-pointer',
          selected
            ? 'bg-ctrl-cell-bg border border-ctrl-border-active text-ctrl-text-active'
            : 'text-ctrl-label hover:text-ctrl-value',
        ].join(' ')}
        style={{
          paddingLeft: `${depth * 16 + 4}px`,
          ...(selected ? { textShadow: '0 0 8px var(--glow-sun-yellow)' } : {}),
        }}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (e.key === ' ') e.preventDefault();
            onSelect?.();
          }
        }}
      >
        {/* Expand/collapse arrow */}
        {isExpandable ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleExpand?.(); }}
            className="w-4 shrink-0 text-center text-[0.5rem] hover:text-ctrl-text-active"
          >
            {expanded ? '\u25BC' : '\u25B6'}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {/* Checkbox placeholder */}
        <span className={[
          'size-2.5 border mr-1.5 shrink-0',
          selected ? 'border-ctrl-border-active' : 'border-ctrl-border-inactive',
        ].join(' ')} />

        {/* Label */}
        <span className="flex-1 truncate">{label}</span>

        {/* Tag label */}
        {tag && (
          <span className={[
            'ml-2 mr-1 shrink-0',
            selected ? 'text-ctrl-text-active' : 'text-ctrl-label',
          ].join(' ')}>
            {tag}
          </span>
        )}
      </div>

      {/* Children (expanded) */}
      {isExpandable && expanded && children}
    </div>
  );
}
