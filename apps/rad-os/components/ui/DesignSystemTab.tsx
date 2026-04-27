'use client';

import { useRef, useState, type ComponentType, type RefObject } from 'react';
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
import { Button, Input, ToggleGroup } from '@rdna/radiants/components/core';
import { useDeferredContent, useRegistryBrowserEntries } from './ui-library/browser-state';

const DEFAULT_INITIAL_INTERACTIVE_CARDS = 6;

function DeferredSectionPlaceholder({
  label,
  minHeightClass,
}: {
  label: string;
  minHeightClass: string;
}) {
  return (
    <div
      className={`flex items-center justify-center border border-dashed border-rule bg-depth px-3 py-4 ${minHeightClass}`}
    >
      <span className="font-mono text-[10px] uppercase tracking-wide text-mute">
        {label}
      </span>
    </div>
  );
}

function ComponentShowcaseCard({
  entry,
  scrollRootRef,
  eager,
  onInteract,
}: {
  entry: RegistryEntry;
  scrollRootRef: RefObject<HTMLDivElement | null>;
  eager: boolean;
  onInteract?: (entry: RegistryEntry, props: Record<string, unknown>) => void;
}) {
  const Component = entry.component as ComponentType<Record<string, unknown>> | undefined;
  const { props, remountKey, setPropValue: rawSetPropValue, resetProps } = useShowcaseProps(entry);
  const [forcedState, setForcedState] = useState<'default' | ForcedState>('default');
  const availableStates = ['default', ...getPreviewStateNames(entry.states)] as const;
  const { wrapperState, propOverrides } = resolvePreviewState(forcedState, entry.states);
  const renderProps = { ...props, ...propOverrides };

  const setPropValue = (name: string, value: unknown) => {
    rawSetPropValue(name, value);
    const next = { ...props, [name]: value, ...propOverrides };
    onInteract?.(entry, next);
  };

  const handlePreviewClick = () => {
    onInteract?.(entry, renderProps);
  };

  const hasPreview = entry.renderMode !== 'description-only';
  const hasControllableProps =
    Object.keys(entry.props).length > 0 &&
    !(entry.renderMode === 'custom' && entry.controlledProps?.length === 0);
  const { containerRef, isReady } = useDeferredContent(
    !eager && (hasPreview || hasControllableProps),
    scrollRootRef,
  );

  return (
    <div className="pixel-rounded-6 pixel-shadow-resting">
      <div
        ref={containerRef}
        className="bg-page p-4 flex flex-col gap-3"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-base font-heading font-bold text-main">
            {entry.name}
          </h3>
          <span className="pixel-rounded-4 inline-block block text-xs font-heading text-sub bg-depth px-1.5 py-0.5 uppercase">
            {entry.category}
          </span>
        </div>

        <p className="text-base text-sub">{entry.description}</p>

        {!hasPreview ? null : (
          // eslint-disable-next-line rdna/prefer-rdna-components -- reason:preview-click-capture owner:design expires:2027-01-01 issue:DNA-001
          <div className="border-t border-rule pt-3" onClick={handlePreviewClick} onKeyDown={undefined} role="presentation">
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

        {entry.states && entry.states.length > 0 && (
          <div className="border-t border-rule pt-2">
            <ToggleGroup
              value={[forcedState]}
              onValueChange={(vals) => {
                if (!vals.length) return;
                const next = vals[0] as 'default' | ForcedState;
                setForcedState(next);
                const resolved = resolvePreviewState(next, entry.states);
                onInteract?.(entry, { ...props, ...resolved.propOverrides });
              }}
            >
              {availableStates.map((stateName) => (
                <ToggleGroup.Item key={stateName} value={stateName}>{stateName}</ToggleGroup.Item>
              ))}
            </ToggleGroup>
          </div>
        )}

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

interface DesignSystemTabProps {
  searchQuery?: string;
  activeCategory?: ComponentCategory | 'all';
  hideControls?: boolean;
  initialInteractiveCards?: number;
  onComponentInteract?: (entry: RegistryEntry, props: Record<string, unknown>) => void;
}

export function DesignSystemTab({
  searchQuery: propSearchQuery = '',
  activeCategory: propCategory,
  hideControls = false,
  initialInteractiveCards = DEFAULT_INITIAL_INTERACTIVE_CARDS,
  onComponentInteract,
}: DesignSystemTabProps) {
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const [localCategory, setLocalCategory] = useState<ComponentCategory | 'all'>('all');
  const [localSearch, setLocalSearch] = useState('');

  const search = propSearchQuery || localSearch;
  const activeCategory = propCategory ?? localCategory;
  const { filtered, grouped } = useRegistryBrowserEntries(search, activeCategory);

  let showcaseIndex = 0;

  return (
    <div ref={scrollRootRef} className="h-full overflow-auto">
      <div className="flex flex-col gap-4 p-5">
      {!hideControls && (
        <>
          {!propSearchQuery && (
            <Input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search components..."
              fullWidth
            />
          )}

          <div className="flex flex-wrap gap-1">
            <Button
              quiet={activeCategory !== 'all'}
              size="sm"
              onClick={() => setLocalCategory('all')}
            >
              All ({registry.length})
            </Button>
            {CATEGORIES.map((category) => {
              const count = registry.filter((entry) => entry.category === category).length;
              if (count === 0) return null;

              return (
                <Button
                  key={category}
                  quiet={activeCategory !== category}
                  size="sm"
                  onClick={() => setLocalCategory(category)}
                >
                  {CATEGORY_LABELS[category]} ({count})
                </Button>
              );
            })}
          </div>
        </>
      )}

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
                  <div key={entry.name} id={`component-${entry.name}`} className="break-inside-avoid mb-3">
                    <ComponentShowcaseCard
                      entry={entry}
                      scrollRootRef={scrollRootRef}
                      eager={eager}
                      onInteract={onComponentInteract}
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
