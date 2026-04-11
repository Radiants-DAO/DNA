'use client';

import { useState, useMemo, type ComponentType } from 'react';
import {
  registry,
  CATEGORIES,
  CATEGORY_LABELS,
  getPreviewStateNames,
  PropControls,
  resolvePreviewState,
  useShowcaseProps,
} from '@rdna/radiants/registry';
import type { RegistryEntry, ComponentCategory, ForcedState } from '@rdna/radiants/registry';
import { Button, Input, PixelBorder } from '@rdna/radiants/components/core';

// ============================================================================
// Showcase Card
// ============================================================================

function ComponentShowcaseCard({ entry }: { entry: RegistryEntry }) {
  const Component = entry.component as ComponentType<Record<string, unknown>> | undefined;
  const { props, remountKey, setPropValue, resetProps } = useShowcaseProps(entry);
  const [forcedState, setForcedState] = useState<'default' | ForcedState>('default');
  const availableStates = ['default', ...getPreviewStateNames(entry.states)] as const;
  const { wrapperState, propOverrides } = resolvePreviewState(forcedState, entry.states);
  const renderProps = { ...props, ...propOverrides };
  const hasControllableProps =
    Object.keys(entry.props).length > 0 &&
    !(entry.renderMode === 'custom' && entry.controlledProps?.length === 0);

  return (
    <PixelBorder size="sm" className="pixel-shadow-resting">
      <div className="bg-page p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <h3 className="text-base font-heading font-bold text-main">
            {entry.name}
          </h3>
          <PixelBorder size="xs" className="inline-block">
            <span className="block text-xs font-heading text-sub bg-depth px-1.5 py-0.5 uppercase">
              {entry.category}
            </span>
          </PixelBorder>
        </div>

        {/* Description */}
        <p className="text-base text-sub">{entry.description}</p>

        {/* Demo Area */}
        {entry.renderMode === 'description-only' ? null : (
          <div className="border-t border-rule pt-3">
            <p className="text-xs font-heading text-mute uppercase mb-2">Preview</p>
            <div data-force-state={wrapperState} key={remountKey}>
              {entry.Demo ? (
                <entry.Demo {...renderProps} />
              ) : Component ? (
                <Component {...renderProps} />
              ) : null}
            </div>
          </div>
        )}

        {/* Forced state strip */}
        {entry.states && entry.states.length > 0 && (
          <div className="flex flex-wrap gap-1 border-t border-rule pt-2">
            {availableStates.map((s) => (
              <PixelBorder key={s} size="xs" className="inline-block">
                {/* eslint-disable-next-line rdna/prefer-rdna-components -- reason:forced-state-chip-requires-inline-button owner:design-system expires:2026-12-31 issue:DNA-001 */}
                <button
                  type="button"
                  onClick={() => setForcedState(s)}
                  className={`cursor-pointer px-1.5 py-0.5 font-mono text-xs transition-colors ${
                    forcedState === s
                      ? 'bg-main text-page'
                      : 'bg-depth text-sub hover:text-main'
                  }`}
                >
                  {s}
                </button>
              </PixelBorder>
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
    </PixelBorder>
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
            <div className="columns-1 @3xl:columns-2 @7xl:columns-3 gap-3">
              {group.entries.map((entry) => (
                <div key={entry.name} className="break-inside-avoid mb-3">
                  <ComponentShowcaseCard entry={entry} />
                </div>
              ))}
            </div>
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
