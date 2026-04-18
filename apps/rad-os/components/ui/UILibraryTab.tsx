'use client';

import {
  type ComponentType,
  useMemo,
  useRef,
  useState,
  startTransition,
  useEffect,
  type RefObject,
  useCallback,
} from 'react';
import {
  registry,
  CATEGORY_LABELS,
  getPreviewStateNames,
  PropControls,
  useShowcaseProps,
} from '@rdna/radiants/registry';
import type {
  RegistryEntry,
  ComponentCategory,
  ForcedState,
} from '@rdna/radiants/registry';
import { Input, Button } from '@rdna/radiants/components/core';
import { ComponentCodeOutput } from './ui-library/ComponentCodeOutput';

// ============================================================================
// Constants
// ============================================================================

const CARD_INTERSECTION_ROOT_MARGIN = '240px 0px';
const DEFAULT_INITIAL_INTERACTIVE_CARDS = 8;
const EMPTY_ENTRY = { defaultProps: {} };

// ============================================================================
// Types
// ============================================================================

interface GroupedCategory {
  category: ComponentCategory;
  label: string;
  entries: RegistryEntry[];
}

export interface UILibraryState {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeCategory: ComponentCategory | 'all';
  setActiveCategory: (cat: ComponentCategory | 'all') => void;
  selectedEntry: RegistryEntry | null;
  setSelectedEntry: (entry: RegistryEntry | null) => void;
  filtered: RegistryEntry[];
  grouped: GroupedCategory[];
  showcaseProps: {
    props: Record<string, unknown>;
    remountKey: string;
    setPropValue: (name: string, value: unknown) => void;
    resetProps: () => void;
  };
}

// ============================================================================
// Hook — shared state for the three sub-components
// ============================================================================

export function useUILibrary(): UILibraryState {
  const [activeCategory, setActiveCategory] = useState<ComponentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<RegistryEntry | null>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return registry.filter((entry) => {
      if (activeCategory !== 'all' && entry.category !== activeCategory) return false;
      if (q) {
        const searchable = [
          entry.name,
          entry.description,
          entry.category,
          ...(entry.tags ?? []),
        ]
          .join(' ')
          .toLowerCase();
        return searchable.includes(q);
      }
      return true;
    });
  }, [searchQuery, activeCategory]);

  const grouped = useMemo(() => {
    const groups: GroupedCategory[] = [];
    let current: GroupedCategory | null = null;

    for (const entry of filtered) {
      if (!current || current.category !== entry.category) {
        current = {
          category: entry.category,
          label: CATEGORY_LABELS[entry.category],
          entries: [],
        };
        groups.push(current);
      }
      current.entries.push(entry);
    }
    return groups;
  }, [filtered]);

  const { props: selectedProps, remountKey, setPropValue, resetProps } =
    useShowcaseProps(selectedEntry ?? EMPTY_ENTRY);

  return {
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    selectedEntry,
    setSelectedEntry,
    filtered,
    grouped,
    showcaseProps: {
      props: selectedProps,
      remountKey,
      setPropValue,
      resetProps,
    },
  };
}

// ============================================================================
// Deferred content hook (lazy intersection-based rendering)
// ============================================================================

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
        if (!entries.some((e) => e.isIntersecting)) return;
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

// ============================================================================
// Mini Card (gallery item) — interactive preview
// ============================================================================

function ComponentMiniCard({
  entry,
  selected,
  onSelect,
  scrollRootRef,
  eager,
  liveProps,
  remountKey,
}: {
  entry: RegistryEntry;
  selected: boolean;
  onSelect: () => void;
  scrollRootRef: RefObject<HTMLDivElement | null>;
  eager: boolean;
  liveProps?: Record<string, unknown>;
  remountKey?: string;
}) {
  const Component = entry.component as
    | ComponentType<Record<string, unknown>>
    | undefined;
  const hasPreview = entry.renderMode !== 'description-only';
  const { containerRef, isReady } = useDeferredContent(
    !eager && hasPreview,
    scrollRootRef,
  );

  return (
    <div ref={containerRef}>
      <div
        className={`w-full text-left pixel-rounded-sm transition-colors ${
          selected
            ? 'pixel-shadow-raised ring-2 ring-accent'
            : 'pixel-shadow-resting hover:pixel-shadow-raised'
        }`}
      >
        <div className="bg-page p-3 flex flex-col gap-2">
          {/* Title bar — clicking here selects the card */}
          {/* eslint-disable-next-line rdna/prefer-rdna-components -- reason:gallery-card-title-select owner:design expires:2027-01-01 issue:DNA-001 */}
          <button
            type="button"
            onClick={onSelect}
            className="flex items-center cursor-pointer w-full text-left"
          >
            <span className="font-heading text-xs text-main uppercase tracking-wide truncate">
              {entry.name}
            </span>
          </button>

          {/* Preview — fully interactive, clicks don't propagate to card */}
          {hasPreview && (
            <div
              className="flex items-center justify-center min-h-16"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              key={selected ? remountKey : undefined}
            >
              {isReady ? (
                entry.Demo ? (
                  <entry.Demo {...(selected && liveProps ? liveProps : (entry.defaultProps ?? {}))} />
                ) : Component ? (
                  <Component {...(selected && liveProps ? liveProps : (entry.defaultProps ?? {}))} />
                ) : null
              ) : (
                <span className="font-mono text-[10px] uppercase tracking-wide text-mute">
                  ...
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Props Panel
// ============================================================================

function PropsPanel({
  entry,
  showcaseProps,
}: {
  entry: RegistryEntry;
  showcaseProps: {
    props: Record<string, unknown>;
    setPropValue: (name: string, value: unknown) => void;
    resetProps: () => void;
  };
}) {
  const [forcedState, setForcedState] = useState<'default' | ForcedState>(
    'default',
  );
  const availableStates = [
    'default',
    ...getPreviewStateNames(entry.states),
  ] as const;

  const hasControllableProps =
    Object.keys(entry.props).length > 0 &&
    !(entry.renderMode === 'custom' && entry.controlledProps?.length === 0);

  if (!hasControllableProps && (!entry.states || entry.states.length === 0)) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-rule">
        <span className="font-heading text-xs text-mute uppercase tracking-wide">
          Props
        </span>
        <Button size="sm" mode="flat" onClick={showcaseProps.resetProps}>
          Reset
        </Button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
        {/* Forced state strip */}
        {entry.states && entry.states.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {availableStates.map((s) => (
              // eslint-disable-next-line rdna/prefer-rdna-components -- reason:state-toggle-button owner:design expires:2027-01-01 issue:DNA-001
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
        {hasControllableProps && (
          <PropControls
            props={entry.props}
            values={showcaseProps.props}
            onChange={showcaseProps.setPropValue}
            onReset={showcaseProps.resetProps}
            controlledProps={entry.controlledProps}
            renderMode={entry.renderMode}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Sub-component 1: Navigator (left island content)
// ============================================================================

export function UILibraryNavigator({
  searchQuery,
  setSearchQuery,
  grouped,
  selectedEntry,
  setSelectedEntry,
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  grouped: GroupedCategory[];
  selectedEntry: RegistryEntry | null;
  setSelectedEntry: (entry: RegistryEntry | null) => void;
}) {
  const handleSelect = useCallback(
    (entry: RegistryEntry) => {
      setSelectedEntry(selectedEntry?.name === entry.name ? null : entry);
      document.getElementById(`component-${entry.name}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [selectedEntry, setSelectedEntry],
  );

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="shrink-0 p-3 border-b border-rule">
        <Input
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchQuery(e.target.value)
          }
          placeholder="Search..."
          fullWidth
        />
      </div>

      {/* Category-grouped component list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {grouped.map((group) => (
          <div key={group.category}>
            {/* Category header */}
            <div className="px-3 py-2 border-b border-rule bg-depth">
              <span className="font-mono text-xs text-mute uppercase tracking-wide">
                {group.label}
              </span>
            </div>
            {/* Component items */}
            {group.entries.map((entry) => (
              // eslint-disable-next-line rdna/prefer-rdna-components -- reason:navigator-list-item owner:design expires:2027-01-01 issue:DNA-001
              <button
                key={entry.name}
                type="button"
                onClick={() => handleSelect(entry)}
                className={`w-full text-left px-3 py-1.5 font-mono text-xs cursor-pointer transition-colors ${
                  selectedEntry?.name === entry.name
                    ? 'bg-accent text-flip font-bold'
                    : 'text-main hover:bg-hover'
                }`}
              >
                {entry.name}
              </button>
            ))}
          </div>
        ))}
        {grouped.length === 0 && (
          <p className="font-mono text-xs text-mute text-center py-6">No results</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Sub-component 2: Gallery (center island content)
// ============================================================================

export function UILibraryGallery({
  grouped,
  filtered,
  selectedEntry,
  setSelectedEntry,
  showcaseProps,
  initialInteractiveCards = DEFAULT_INITIAL_INTERACTIVE_CARDS,
}: {
  grouped: GroupedCategory[];
  filtered: RegistryEntry[];
  selectedEntry: RegistryEntry | null;
  setSelectedEntry: (entry: RegistryEntry | null) => void;
  showcaseProps?: { props: Record<string, unknown>; remountKey: string };
  initialInteractiveCards?: number;
}) {
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  let showcaseIndex = 0;

  return (
    <div
      ref={scrollRootRef}
      className="h-full overflow-auto @container"
    >
      <div className="p-4">
        {grouped.map((group) => (
          <div key={group.category} className="mb-6">
            <div className="border-b border-rule pb-2 mb-3">
              <h2 className="font-heading text-sm text-main uppercase tracking-wide">
                {group.label}
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {group.entries.map((entry) => {
                const eager = showcaseIndex < initialInteractiveCards;
                showcaseIndex += 1;
                return (
                  <ComponentMiniCard
                    key={entry.name}
                    entry={entry}
                    selected={selectedEntry?.name === entry.name}
                    onSelect={() =>
                      setSelectedEntry(
                        selectedEntry?.name === entry.name ? null : entry,
                      )
                    }
                    scrollRootRef={scrollRootRef}
                    eager={eager}
                    liveProps={selectedEntry?.name === entry.name ? showcaseProps?.props : undefined}
                    remountKey={selectedEntry?.name === entry.name ? showcaseProps?.remountKey : undefined}
                  />
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
  );
}

// ============================================================================
// Sub-component 3a: Props (right column, top island)
// ============================================================================

export function UILibraryProps({
  selectedEntry,
  showcaseProps,
}: {
  selectedEntry: RegistryEntry | null;
  showcaseProps: {
    props: Record<string, unknown>;
    setPropValue: (name: string, value: unknown) => void;
    resetProps: () => void;
  };
}) {
  if (!selectedEntry) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-sm text-mute text-center">
          Select a component to inspect
        </p>
      </div>
    );
  }

  return <PropsPanel entry={selectedEntry} showcaseProps={showcaseProps} />;
}

// ============================================================================
// Sub-component 3b: Code (right column, bottom island)
// ============================================================================

export function UILibraryCode({
  selectedEntry,
  propValues,
}: {
  selectedEntry: RegistryEntry | null;
  propValues: Record<string, unknown>;
}) {
  if (!selectedEntry) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-sm text-mute text-center">
          Code output appears here
        </p>
      </div>
    );
  }

  return <ComponentCodeOutput entry={selectedEntry} propValues={propValues} />;
}

// ============================================================================
// Legacy default export — standalone 3-column layout (backward compat)
// ============================================================================

interface UILibraryTabProps {
  searchQuery?: string;
  activeCategory?: ComponentCategory | 'all';
  hideControls?: boolean;
  initialInteractiveCards?: number;
}

export function UILibraryTab({
  searchQuery: propSearchQuery = '',
  activeCategory: propCategory,
  hideControls = false,
  initialInteractiveCards = DEFAULT_INITIAL_INTERACTIVE_CARDS,
}: UILibraryTabProps) {
  const lib = useUILibrary();

  // Sync external props if provided
  const search = propSearchQuery || lib.searchQuery;
  const activeCategory = propCategory ?? lib.activeCategory;

  // Override if external props are controlling
  const effectiveState = {
    ...lib,
    searchQuery: search,
    activeCategory,
  };

  return (
    <div className="h-full flex">
      {/* Col 1: Navigator */}
      {!hideControls && (
        <div className="w-56 shrink-0 border-r border-rule bg-card flex flex-col overflow-hidden">
          <UILibraryNavigator
            searchQuery={effectiveState.searchQuery}
            setSearchQuery={lib.setSearchQuery}
            grouped={effectiveState.grouped}
            selectedEntry={effectiveState.selectedEntry}
            setSelectedEntry={lib.setSelectedEntry}
          />
        </div>
      )}

      {/* Col 2: Gallery */}
      <div className="flex-1 min-w-0">
        <UILibraryGallery
          grouped={effectiveState.grouped}
          filtered={effectiveState.filtered}
          selectedEntry={effectiveState.selectedEntry}
          setSelectedEntry={lib.setSelectedEntry}
          showcaseProps={effectiveState.showcaseProps}
          initialInteractiveCards={initialInteractiveCards}
        />
      </div>

      {/* Col 3: Props + Code */}
      <div className="w-64 shrink-0 border-l border-rule bg-card flex flex-col gap-1.5">
        <div className="flex-1 min-h-0">
          <UILibraryProps
            selectedEntry={effectiveState.selectedEntry}
            showcaseProps={effectiveState.showcaseProps}
          />
        </div>
        <div className="flex-1 min-h-0">
          <UILibraryCode
            selectedEntry={effectiveState.selectedEntry}
            propValues={effectiveState.showcaseProps.props}
          />
        </div>
      </div>
    </div>
  );
}
