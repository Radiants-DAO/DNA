'use client';

import { useState, useMemo } from 'react';
import { registry, CATEGORIES, CATEGORY_LABELS } from '@rdna/radiants/registry';
import type { RegistryEntry, ComponentCategory } from '@rdna/radiants/registry';
import { Button, Input } from '@rdna/radiants/components/core';

// ============================================================================
// Showcase Card
// ============================================================================

function ComponentShowcaseCard({ entry }: { entry: RegistryEntry }) {
  const Component = entry.component;

  return (
    <div className="border border-line bg-page rounded-sm p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h3 className="text-base font-heading font-bold text-main">
          {entry.name}
        </h3>
        <span className="text-xs font-heading text-sub bg-depth px-1.5 py-0.5 rounded-xs uppercase">
          {entry.category}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-sub">{entry.description}</p>

      {/* Demo Area */}
      {entry.Demo ? (
        <div className="border-t border-rule pt-3">
          <p className="text-xs font-heading text-mute uppercase mb-2">Preview</p>
          <entry.Demo />
        </div>
      ) : entry.renderMode === 'description-only' ? null : entry.variants && entry.variants.length > 0 ? (
        <div className="border-t border-rule pt-3">
          <p className="text-xs font-heading text-mute uppercase mb-2">Variants</p>
          <div className="flex flex-wrap items-center gap-3">
            {entry.variants.map(({ label, props }) => (
              <div key={label} className="flex flex-col items-start gap-1">
                {Component && <Component {...props} />}
                <span className="text-xs text-mute mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : entry.exampleProps && Component ? (
        <div className="border-t border-rule pt-3">
          <p className="text-xs font-heading text-mute uppercase mb-2">Preview</p>
          <Component {...entry.exampleProps} />
        </div>
      ) : null}
    </div>
  );
}

// ============================================================================
// DesignSystemTab
// ============================================================================

interface DesignSystemTabProps {
  searchQuery?: string;
}

export function DesignSystemTab({ searchQuery: propSearchQuery = '' }: DesignSystemTabProps) {
  const [activeCategory, setActiveCategory] = useState<ComponentCategory | 'all'>('all');
  const [localSearch, setLocalSearch] = useState('');

  const search = propSearchQuery || localSearch;

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
    <div className="flex flex-col gap-4 h-full overflow-auto p-4">
      {/* Search (only if no external searchQuery) */}
      {!propSearchQuery && (
        <Input
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search components..."
        />
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-1">
        <Button
          variant={activeCategory === 'all' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveCategory('all')}
        >
          All ({registry.length})
        </Button>
        {CATEGORIES.map((cat) => {
          const count = registry.filter((e) => e.category === cat).length;
          if (count === 0) return null;
          return (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveCategory(cat)}
            >
              {CATEGORY_LABELS[cat]} ({count})
            </Button>
          );
        })}
      </div>

      {/* Results count */}
      <p className="text-xs text-mute">
        {filtered.length} component{filtered.length !== 1 ? 's' : ''}
        {search && ` matching "${search}"`}
      </p>

      {/* Component grid, grouped by category */}
      <div className="flex flex-col gap-6">
        {grouped.map((group) => (
          <div key={group.category} className="flex flex-col gap-3">
            <h2 className="text-sm font-heading font-bold text-main uppercase tracking-wide">
              {group.label}
            </h2>
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
  );
}
