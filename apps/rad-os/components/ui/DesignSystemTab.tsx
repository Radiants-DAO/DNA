'use client';

import { startTransition, useEffect, useMemo, useRef, useState, type ComponentType, type RefObject } from 'react';
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
import { Button, Input } from '@rdna/radiants/components/core';

const CARD_INTERSECTION_ROOT_MARGIN = '240px 0px';
const DEFAULT_INITIAL_INTERACTIVE_CARDS = 6;

function useDeferredContent(
  shouldDefer: boolean,
  rootRef: RefObject<HTMLElement | null>,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(() => !shouldDefer);

  useEffect(() => {
    if (!shouldDefer || isReady) return;

    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      const frame = window.requestAnimationFrame(() => {
        setIsReady(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        startTransition(() => {
          setIsReady(true);
        });
        observer.disconnect();
      },
      {
        root: rootRef.current,
        rootMargin: CARD_INTERSECTION_ROOT_MARGIN,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isReady, rootRef, shouldDefer]);

  return { containerRef, isReady };
}

function DeferredSectionPlaceholder({
  label,
  minHeightClass,
}: {
  label: string;
  minHeightClass: string;
}) {
  return (
    <div
      className={`flex items-center justify-center border border-dashed border-rule bg-depth/40 px-3 py-4 ${minHeightClass}`}
    >
      <span className="font-mono text-[10px] uppercase tracking-wide text-mute">
        {label}
      </span>
    </div>
  );
}

// ============================================================================
// Showcase Card
// ============================================================================

function ComponentShowcaseCard({
  entry,
  scrollRootRef,
  eager,
}: {
  entry: RegistryEntry;
  scrollRootRef: RefObject<HTMLDivElement | null>;
  eager: boolean;
}) {
  const Component = entry.component as ComponentType<Record<string, unknown>> | undefined;
  const { props, remountKey, setPropValue, resetProps } = useShowcaseProps(entry);
  const [forcedState, setForcedState] = useState<'default' | ForcedState>('default');
  const availableStates = ['default', ...getPreviewStateNames(entry.states)] as const;
  const { wrapperState, propOverrides } = resolvePreviewState(forcedState, entry.states);
  const renderProps = { ...props, ...propOverrides };
  const hasPreview = entry.renderMode !== 'description-only';
  const hasControllableProps =
    Object.keys(entry.props).length > 0 &&
    !(entry.renderMode === 'custom' && entry.controlledProps?.length === 0);
  const { containerRef, isReady } = useDeferredContent(
    !eager && (hasPreview || hasControllableProps),
    scrollRootRef,
  );

  return (
    <div className="pixel-rounded-sm pixel-shadow-resting">
      <div
        ref={containerRef}
        className="bg-page p-4 flex flex-col gap-3"
      >
        {/* Header */}
        <div className="flex items-center gap-2">
          <h3 className="text-base font-heading font-bold text-main">
            {entry.name}
          </h3>
          <span className="pixel-rounded-xs inline-block block text-xs font-heading text-sub bg-depth px-1.5 py-0.5 uppercase">
            {entry.category}
          </span>
        </div>

        {/* Description */}
        <p className="text-base text-sub">{entry.description}</p>

        {/* Demo Area */}
        {!hasPreview ? null : (
          <div className="border-t border-rule pt-3">
            <p className="text-xs font-heading text-mute uppercase mb-2">Preview</p>
            {isReady ? (
              <div data-force-state={wrapperState} key={remountKey}>
                {entry.Demo ? (
                  <entry.Demo {...renderProps} />
                ) : Component ? (
                  <Component {...renderProps} />
                ) : null}
              </div>
            ) : (
              <DeferredSectionPlaceholder
                label="Preview mounts on scroll"
                minHeightClass="min-h-24"
              />
            )}
          </div>
        )}

        {/* Forced state strip */}
        {entry.states && entry.states.length > 0 && (
            <div className="flex flex-wrap gap-1 border-t border-rule pt-2">
            {availableStates.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForcedState(s)}
                className={`pixel-rounded-xs inline-block cursor-pointer px-1.5 py-0.5 font-mono text-xs transition-colors ${
                  forcedState === s
                    ? 'bg-main text-page'
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
            {isReady ? (
              <PropControls
                props={entry.props}
                values={props}
                onChange={setPropValue}
                onReset={resetProps}
                controlledProps={entry.controlledProps}
                renderMode={entry.renderMode}
              />
            ) : (
              <DeferredSectionPlaceholder
                label="Controls mount on scroll"
                minHeightClass="min-h-16"
              />
            )}
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
  initialInteractiveCards?: number;
}

export function DesignSystemTab({
  searchQuery: propSearchQuery = '',
  activeCategory: propCategory,
  hideControls = false,
  initialInteractiveCards = DEFAULT_INITIAL_INTERACTIVE_CARDS,
}: DesignSystemTabProps) {
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
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

  let showcaseIndex = 0;

  return (
    <div ref={scrollRootRef} className="h-full overflow-auto">
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
              {group.entries.map((entry) => {
                const eager = showcaseIndex < initialInteractiveCards;
                showcaseIndex += 1;

                return (
                  <div key={entry.name} className="break-inside-avoid mb-3">
                    <ComponentShowcaseCard
                      entry={entry}
                      scrollRootRef={scrollRootRef}
                      eager={eager}
                    />
                  </div>
                );
              })}
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
