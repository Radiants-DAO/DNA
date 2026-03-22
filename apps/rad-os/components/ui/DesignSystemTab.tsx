'use client';

import { useState, useMemo } from 'react';
import {
  registry,
  CATEGORIES,
  CATEGORY_LABELS,
  PropControls,
  useShowcaseProps,
} from '@rdna/radiants/registry';
import type { RegistryEntry, ComponentCategory, ForcedState } from '@rdna/radiants/registry';
import { Button, Input } from '@rdna/radiants/components/core';

// ============================================================================
// Showcase Card
// ============================================================================

function ComponentShowcaseCard({ entry }: { entry: RegistryEntry }) {
  const Component = entry.component;
  const { props, remountKey, setPropValue, resetProps } = useShowcaseProps(entry);
  const [forcedState, setForcedState] = useState<'default' | ForcedState>('default');
  const stateAttr = forcedState === 'default' ? undefined : forcedState;
  const hasControllableProps =
    Object.keys(entry.props).length > 0 &&
    !(entry.renderMode === 'custom' && entry.controlledProps?.length === 0);

  return (
    <div className="pixel-shadow-resting">
    <div className="border border-line bg-page pixel-rounded-sm p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h3 className="text-base font-heading font-bold text-main">
          {entry.name}
        </h3>
        <span className="text-xs font-heading text-sub bg-depth px-1.5 py-0.5 pixel-rounded-xs uppercase">
          {entry.category}
        </span>
      </div>

      {/* Description */}
      <p className="text-base text-sub">{entry.description}</p>

      {/* Demo Area */}
      {entry.renderMode === 'description-only' ? null : (
        <div className="border-t border-rule pt-3">
          <p className="text-xs font-heading text-mute uppercase mb-2">Preview</p>
          <div data-force-state={stateAttr} key={remountKey}>
            {entry.Demo ? (
              <entry.Demo {...props} />
            ) : Component ? (
              <Component {...props} />
            ) : null}
          </div>
        </div>
      )}

      {/* Forced state strip */}
      {entry.states && entry.states.length > 0 && (
        <div className="flex flex-wrap gap-1 border-t border-rule pt-2">
          {(['default', ...entry.states] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setForcedState(s)}
              className={`cursor-pointer px-1.5 py-0.5 font-mono text-xs pixel-rounded-xs transition-colors ${
                forcedState === s
                  ? 'bg-main text-inv'
                  : 'bg-depth text-sub hover:text-main'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Prop controls */}
      {hasControllableProps && (
        <div className="border-t border-rule pt-2">
          <PropControls
            props={entry.props}
            values={props}
            onChange={setPropValue}
            onReset={resetProps}
            controlledProps={entry.controlledProps}
            renderMode={entry.renderMode}
          />
        </div>
      )}
    </div>
    </div>
  );
}

// ============================================================================
// DesignSystemTab
// ============================================================================

interface DesignSystemTabProps {
  searchQuery?: string;
  activeCategory?: ComponentCategory | 'all';
  hideControls?: boolean;
}

export function DesignSystemTab({
  searchQuery: propSearchQuery = '',
  activeCategory: propCategory,
  hideControls = false,
}: DesignSystemTabProps) {
  const [localCategory, setLocalCategory] = useState<ComponentCategory | 'all'>('all');
  const [localSearch, setLocalSearch] = useState('');

  const search = propSearchQuery || localSearch;
  const activeCategory = propCategory ?? localCategory;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return registry.filter((entry) => {
      if (activeCategory !== 'all' && entry.category !== activeCategory) return false;
      if (q) {
        const searchable = [
          entry.name,
          entry.description,
          entry.category,
          ...(entry.tags ?? []),
        ].join(' ').toLowerCase();
        return searchable.includes(q);
      }
      return true;
    });
  }, [search, activeCategory]);

  // Group by category for display
  const grouped = useMemo(() => {
    const groups: { category: ComponentCategory; label: string; entries: RegistryEntry[] }[] = [];
    let current: typeof groups[number] | null = null;

    for (const entry of filtered) {
      if (!current || current.category !== entry.category) {
        current = { category: entry.category, label: CATEGORY_LABELS[entry.category], entries: [] };
        groups.push(current);
      }
      current.entries.push(entry);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="h-full overflow-auto">
      <div className="flex flex-col gap-4 p-5">
      {!hideControls && (
        <>
          {/* Search (only if no external searchQuery) */}
          {!propSearchQuery && (
            <Input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search components..."
              fullWidth
            />
          )}

          {/* Category filter */}
          <div className="flex flex-wrap gap-1">
            <Button
              quiet={activeCategory !== 'all'}
              size="sm"
              onClick={() => setLocalCategory('all')}
            >
              All ({registry.length})
            </Button>
            {CATEGORIES.map((cat) => {
              const count = registry.filter((e) => e.category === cat).length;
              if (count === 0) return null;
              return (
                <Button
                  key={cat}
                  quiet={activeCategory !== cat}
                  size="sm"
                  onClick={() => setLocalCategory(cat)}
                >
                  {CATEGORY_LABELS[cat]} ({count})
                </Button>
              );
            })}
          </div>
        </>
      )}

      {/* Component grid, grouped by category */}
      <div className="flex flex-col gap-6">
        {grouped.map((group) => (
          <div key={group.category} className="flex flex-col gap-3">
            <div className="flex items-end justify-between border-b border-rule pb-3 gap-4 mt-8">
              <h2 className="text-main leading-tight">{group.label}</h2>
            </div>
            {group.entries.map((entry) => (
              <ComponentShowcaseCard key={entry.name} entry={entry} />
            ))}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-sub py-8 text-center">
            No components match your search.
          </p>
        )}
      </div>
      </div>
    </div>
  );
}
