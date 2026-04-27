# UI Library Three-Column Showcase — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Replace the current single-pane `DesignSystemTab` with a three-column layout: navigator+props sidebar, component gallery grid, and code output panel.

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA-pixel-art` (branch `feat/pixel-art-system`)

**Architecture:** The new `UILibraryTab` is a self-contained component that replaces `DesignSystemTab` inside `BrandAssetsApp`. It uses plain flexbox (not `AppWindow.Content layout="sidebar"`) because it lives inside an `AppWindow.Island` — not as a top-level window layout — and needs three columns, which `AppWindow.Content` doesn't natively support. The component manages a `selectedEntry` state that drives all three columns contextually. Code generation is a new module that takes a `RegistryEntry` + prop values and produces JSX/CSS/Tailwind strings.

**Tech Stack:** React 19, TypeScript, Tailwind v4, `@rdna/radiants` registry system, container queries

---

## Inventory

| Current File | Action | New Name |
|---|---|---|
| `apps/rad-os/components/ui/DesignSystemTab.tsx` | Delete | — |
| `apps/rad-os/components/ui/UILibraryTab.tsx` | Create | `UILibraryTab` |
| `apps/rad-os/components/ui/ui-library/ComponentCodeOutput.tsx` | Create | Code output panel (Col 3) |
| `apps/rad-os/components/ui/ui-library/component-code-gen.ts` | Create | Code generator for registry components |
| `apps/rad-os/components/apps/BrandAssetsApp.tsx` | Modify (lines 13, 482, 617-629) | Update imports + rename tab label |
| `apps/rad-os/test/design-system-tab.test.tsx` | Rewrite | `test/ui-library-tab.test.tsx` |

## Key Conventions

- **Imports:** `@rdna/radiants/components/core` for UI primitives. `@rdna/radiants/registry` for registry, types, PropControls, useShowcaseProps.
- **Styling:** Semantic tokens only (`bg-page`, `text-main`, `border-rule`). No hardcoded colors. Container queries via `@container` + `@3xl:` / `@7xl:` prefixes.
- **Pixel corners:** `pixel-rounded-xs/sm` for decorative cards. No `border-*` or `overflow-hidden` on pixel-cornered elements.
- **Pixel shadows:** `pixel-shadow-resting` for cards at rest. No `shadow-*` on pixel-cornered elements.
- **Scroll:** Use `overflow-auto` for internal scroll regions (plain div, no need for `ScrollArea` inside a tab).
- **Test mocks:** Mock `@rdna/radiants/components/core` and `@rdna/radiants/registry` the same way the current test does.

---

## Task 1: Create the code generator module

This module takes a RegistryEntry + current prop values and generates copy-pasteable code in JSX, CSS, or Tailwind format. It mirrors the pattern from `PatternCodeOutput` / `code-gen.ts` but for arbitrary registry components.

**Files:**
- Create: `apps/rad-os/components/ui/ui-library/component-code-gen.ts`

**Step 1: Create the module**

```ts
// apps/rad-os/components/ui/ui-library/component-code-gen.ts

import type { RegistryEntry } from '@rdna/radiants/registry';

export type CodeFormat = 'jsx' | 'css' | 'tailwind';

/**
 * Generate a code snippet for a registry component with the given prop values.
 */
export function generateComponentCode(
  format: CodeFormat,
  entry: RegistryEntry,
  propValues: Record<string, unknown>,
): string {
  switch (format) {
    case 'jsx':
      return generateJSX(entry, propValues);
    case 'css':
      return generateCSS(entry);
    case 'tailwind':
      return generateTailwind(entry, propValues);
  }
}

function generateJSX(
  entry: RegistryEntry,
  propValues: Record<string, unknown>,
): string {
  const nonDefault = getNonDefaultProps(entry, propValues);
  if (Object.keys(nonDefault).length === 0) {
    // Self-closing tag with no props
    return `<${entry.name} />`;
  }

  const propStrings = Object.entries(nonDefault).map(([key, value]) => {
    if (typeof value === 'string') return `${key}="${value}"`;
    if (typeof value === 'boolean') return value ? key : `${key}={false}`;
    return `${key}={${JSON.stringify(value)}}`;
  });

  // If short enough, single line
  const inline = `<${entry.name} ${propStrings.join(' ')} />`;
  if (inline.length <= 80) return inline;

  // Multi-line
  const lines = [`<${entry.name}`];
  for (const p of propStrings) {
    lines.push(`  ${p}`);
  }
  lines.push('/>');
  return lines.join('\n');
}

function generateCSS(entry: RegistryEntry): string {
  const bindings = entry.tokenBindings;
  if (!bindings || Object.keys(bindings).length === 0) {
    return `/* ${entry.name} — no token bindings defined */`;
  }

  const lines = [`/* ${entry.name} — token bindings */`];
  for (const [slot, tokens] of Object.entries(bindings)) {
    lines.push(`\n/* ${slot} */`);
    for (const [prop, token] of Object.entries(tokens)) {
      lines.push(`${prop}: var(${token});`);
    }
  }
  return lines.join('\n');
}

function generateTailwind(
  entry: RegistryEntry,
  propValues: Record<string, unknown>,
): string {
  const nonDefault = getNonDefaultProps(entry, propValues);
  const propStrings = Object.entries(nonDefault).map(([key, value]) => {
    if (typeof value === 'string') return `${key}="${value}"`;
    if (typeof value === 'boolean') return value ? key : `${key}={false}`;
    return `${key}={${JSON.stringify(value)}}`;
  });

  const lines: string[] = [];
  lines.push(`import { ${entry.name} } from '@rdna/radiants/components/core';`);
  lines.push('');

  if (propStrings.length === 0) {
    lines.push(`<${entry.name} />`);
  } else {
    const inline = `<${entry.name} ${propStrings.join(' ')} />`;
    if (inline.length <= 80) {
      lines.push(inline);
    } else {
      lines.push(`<${entry.name}`);
      for (const p of propStrings) {
        lines.push(`  ${p}`);
      }
      lines.push('/>');
    }
  }

  return lines.join('\n');
}

/** Return only props that differ from the entry's defaultProps. */
function getNonDefaultProps(
  entry: RegistryEntry,
  propValues: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(propValues)) {
    const def = entry.defaultProps?.[key];
    if (value !== def && value !== undefined && value !== '') {
      result[key] = value;
    }
  }
  return result;
}
```

**Step 2: Verify it compiles**

Run: `cd apps/rad-os && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors in `component-code-gen.ts`

**Step 3: Commit**

```bash
git add apps/rad-os/components/ui/ui-library/component-code-gen.ts
git commit -m "feat: add component code generator for UI library showcase"
```

---

## Task 2: Create the ComponentCodeOutput panel (Col 3)

This is the right-column panel. It mirrors `PatternCodeOutput` — a `ToggleGroup` for format selection, a copy button, and a `<pre>` code block. When no component is selected, it shows an empty state.

**Files:**
- Create: `apps/rad-os/components/ui/ui-library/ComponentCodeOutput.tsx`

**Step 1: Create the component**

```tsx
// apps/rad-os/components/ui/ui-library/ComponentCodeOutput.tsx
'use client';

import { useState } from 'react';
import { Button, ToggleGroup } from '@rdna/radiants/components/core';
import type { RegistryEntry } from '@rdna/radiants/registry';
import { generateComponentCode, type CodeFormat } from './component-code-gen';

interface ComponentCodeOutputProps {
  entry: RegistryEntry | null;
  propValues: Record<string, unknown>;
}

export function ComponentCodeOutput({ entry, propValues }: ComponentCodeOutputProps) {
  const [format, setFormat] = useState<CodeFormat>('jsx');
  const [copied, setCopied] = useState(false);

  if (!entry) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-sm text-mute text-center">
          Select a component to see its code output
        </p>
      </div>
    );
  }

  const code = generateComponentCode(format, entry, propValues);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-3 py-2 border-b border-rule">
        <div className="flex items-center justify-between">
          <span className="font-heading text-xs text-mute uppercase tracking-wide">
            Code
          </span>
          <Button
            size="sm"
            icon={copied ? 'copied-to-clipboard' : 'copy-to-clipboard'}
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>

      {/* Code block */}
      <div className="flex-1 min-h-0 p-3 overflow-auto">
        <div className="pixel-rounded-xs">
          <pre className="font-mono text-xs text-sub bg-depth p-3 overflow-x-auto whitespace-pre-wrap">
            {code}
          </pre>
        </div>
      </div>

      {/* Format toggle — pinned to bottom */}
      <div className="shrink-0 px-3 py-2 border-t border-rule">
        <ToggleGroup
          value={[format]}
          onValueChange={(vals) => { if (vals.length) setFormat(vals[0] as CodeFormat); }}
          size="sm"
          compact
        >
          <ToggleGroup.Item value="jsx">JSX</ToggleGroup.Item>
          <ToggleGroup.Item value="css">CSS</ToggleGroup.Item>
          <ToggleGroup.Item value="tailwind">Tailwind</ToggleGroup.Item>
        </ToggleGroup>
      </div>
    </div>
  );
}
```

**Step 2: Verify it compiles**

Run: `cd apps/rad-os && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Commit**

```bash
git add apps/rad-os/components/ui/ui-library/ComponentCodeOutput.tsx
git commit -m "feat: add ComponentCodeOutput panel for UI library showcase"
```

---

## Task 3: Build the UILibraryTab — three-column layout

This is the main component. It replaces `DesignSystemTab` with the three-column layout:

```
┌────────────────┬─────────────────────────────┬──────────────┐
│ Col 1          │ Col 2                       │ Col 3        │
│ Search/List    │ Component Grid              │ Code Output  │
│ (+ Props when  │ (responsive, grouped        │              │
│  selected)     │  by category)               │              │
└────────────────┴─────────────────────────────┴──────────────┘
```

**Files:**
- Create: `apps/rad-os/components/ui/UILibraryTab.tsx`

**Step 1: Create the component**

```tsx
// apps/rad-os/components/ui/UILibraryTab.tsx
'use client';

import { type ComponentType, useMemo, useRef, useState, startTransition, useEffect, type RefObject } from 'react';
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
import { Input, Button, Separator } from '@rdna/radiants/components/core';
import { ComponentCodeOutput } from './ui-library/ComponentCodeOutput';

// ============================================================================
// Constants
// ============================================================================

const CARD_INTERSECTION_ROOT_MARGIN = '240px 0px';
const DEFAULT_INITIAL_INTERACTIVE_CARDS = 8;

// ============================================================================
// Hooks
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

// ============================================================================
// Mini Card (Col 2 — gallery)
// ============================================================================

function ComponentMiniCard({
  entry,
  selected,
  onSelect,
  scrollRootRef,
  eager,
}: {
  entry: RegistryEntry;
  selected: boolean;
  onSelect: () => void;
  scrollRootRef: RefObject<HTMLDivElement | null>;
  eager: boolean;
}) {
  const Component = entry.component as ComponentType<Record<string, unknown>> | undefined;
  const hasPreview = entry.renderMode !== 'description-only';
  const { containerRef, isReady } = useDeferredContent(
    !eager && hasPreview,
    scrollRootRef,
  );

  return (
    // eslint-disable-next-line rdna/prefer-rdna-components -- reason:gallery-card-interactive owner:design expires:2027-01-01 issue:DNA-001
    <button
      type="button"
      ref={containerRef}
      onClick={onSelect}
      className={`w-full text-left pixel-rounded-sm cursor-pointer transition-colors ${
        selected
          ? 'pixel-shadow-raised ring-2 ring-accent'
          : 'pixel-shadow-resting hover:pixel-shadow-raised'
      }`}
    >
      <div className="bg-page p-3 flex flex-col gap-2">
        {/* Title */}
        <span className="font-heading text-xs text-main uppercase tracking-wide truncate">
          {entry.name}
        </span>

        {/* Preview */}
        {hasPreview && (
          <div className="flex items-center justify-center min-h-16 pointer-events-none">
            {isReady ? (
              entry.Demo ? (
                <entry.Demo {...(entry.defaultProps ?? {})} />
              ) : Component ? (
                <Component {...(entry.defaultProps ?? {})} />
              ) : null
            ) : (
              <span className="font-mono text-[10px] uppercase tracking-wide text-mute">
                ...
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

// ============================================================================
// Navigator + Props (Col 1)
// ============================================================================

function NavigatorPane({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  selectedEntry,
  onSelectEntry,
  grouped,
}: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeCategory: ComponentCategory | 'all';
  onCategoryChange: (cat: ComponentCategory | 'all') => void;
  selectedEntry: RegistryEntry | null;
  onSelectEntry: (entry: RegistryEntry | null) => void;
  grouped: { category: ComponentCategory; label: string; entries: RegistryEntry[] }[];
}) {
  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="shrink-0 p-3 border-b border-rule">
        <Input
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
          placeholder="Search..."
          fullWidth
        />
      </div>

      {/* Category filter */}
      <div className="shrink-0 px-3 py-2 border-b border-rule flex flex-wrap gap-1">
        <Button quiet={activeCategory !== 'all'} size="sm" compact onClick={() => onCategoryChange('all')}>
          All ({registry.length})
        </Button>
        {CATEGORIES.map((cat) => {
          const count = registry.filter((e) => e.category === cat).length;
          if (count === 0) return null;
          return (
            <Button key={cat} quiet={activeCategory !== cat} size="sm" compact onClick={() => onCategoryChange(cat)}>
              {CATEGORY_LABELS[cat]} ({count})
            </Button>
          );
        })}
      </div>

      {/* Component list */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
        {grouped.map((group) => (
          <div key={group.category} className="mb-3">
            <span className="font-heading text-xs text-mute uppercase tracking-wide block mb-1 px-1">
              {group.label}
            </span>
            {group.entries.map((entry) => (
              // eslint-disable-next-line rdna/prefer-rdna-components -- reason:list-item-interactive owner:design expires:2027-01-01 issue:DNA-001
              <button
                key={entry.name}
                type="button"
                onClick={() => onSelectEntry(selectedEntry?.name === entry.name ? null : entry)}
                className={`block w-full text-left px-2 py-1 text-sm transition-colors cursor-pointer ${
                  selectedEntry?.name === entry.name
                    ? 'bg-accent text-flip font-bold'
                    : 'text-main hover:bg-tint'
                }`}
              >
                {entry.name}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Props panel (appears when a component is selected) */}
      {selectedEntry && (
        <SelectedEntryProps entry={selectedEntry} />
      )}
    </div>
  );
}

/** Prop controls for the selected component — bottom of Col 1 */
function SelectedEntryProps({ entry }: { entry: RegistryEntry }) {
  const { props, remountKey, setPropValue, resetProps } = useShowcaseProps(entry);
  const [forcedState, setForcedState] = useState<'default' | ForcedState>('default');
  const availableStates = ['default', ...getPreviewStateNames(entry.states)] as const;

  const hasControllableProps =
    Object.keys(entry.props).length > 0 &&
    !(entry.renderMode === 'custom' && entry.controlledProps?.length === 0);

  if (!hasControllableProps && (!entry.states || entry.states.length === 0)) {
    return null;
  }

  return (
    <div className="shrink-0 max-h-[40%] border-t border-rule flex flex-col">
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-rule">
        <span className="font-heading text-xs text-mute uppercase tracking-wide">Props</span>
        <Button size="sm" mode="flat" onClick={resetProps}>Reset</Button>
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
            values={props}
            onChange={setPropValue}
            onReset={resetProps}
            controlledProps={entry.controlledProps}
            renderMode={entry.renderMode}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main: UILibraryTab
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
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const [localCategory, setLocalCategory] = useState<ComponentCategory | 'all'>('all');
  const [localSearch, setLocalSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<RegistryEntry | null>(null);

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

  // Prop values for the selected component (used by Col 3 code output)
  const { props: selectedProps } = useShowcaseProps(
    selectedEntry ?? { defaultProps: {} },
  );

  let showcaseIndex = 0;

  return (
    <div className="h-full flex">
      {/* ── Col 1: Navigator + Props (fixed width) ── */}
      {!hideControls && (
        <div className="w-56 shrink-0 border-r border-rule bg-card flex flex-col overflow-hidden">
          <NavigatorPane
            searchQuery={search}
            onSearchChange={setLocalSearch}
            activeCategory={activeCategory}
            onCategoryChange={setLocalCategory}
            selectedEntry={selectedEntry}
            onSelectEntry={setSelectedEntry}
            grouped={grouped}
          />
        </div>
      )}

      {/* ── Col 2: Component Gallery (flex-1) ── */}
      <div ref={scrollRootRef} className="flex-1 min-w-0 overflow-auto @container">
        <div className="p-4">
          {grouped.map((group) => (
            <div key={group.category} className="mb-6">
              <div className="border-b border-rule pb-2 mb-3">
                <h2 className="font-heading text-sm text-main uppercase tracking-wide">
                  {group.label}
                </h2>
              </div>
              <div className="grid grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4 @7xl:grid-cols-5 gap-3">
                {group.entries.map((entry) => {
                  const eager = showcaseIndex < initialInteractiveCards;
                  showcaseIndex += 1;
                  return (
                    <ComponentMiniCard
                      key={entry.name}
                      entry={entry}
                      selected={selectedEntry?.name === entry.name}
                      onSelect={() => setSelectedEntry(
                        selectedEntry?.name === entry.name ? null : entry,
                      )}
                      scrollRootRef={scrollRootRef}
                      eager={eager}
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

      {/* ── Col 3: Code Output (fixed width, contextual) ── */}
      <div className="w-64 shrink-0 border-l border-rule bg-card">
        <ComponentCodeOutput
          entry={selectedEntry}
          propValues={selectedProps}
        />
      </div>
    </div>
  );
}
```

**Step 2: Verify it compiles**

Run: `cd apps/rad-os && npx tsc --noEmit --pretty 2>&1 | head -30`

**Step 3: Commit**

```bash
git add apps/rad-os/components/ui/UILibraryTab.tsx
git commit -m "feat: add UILibraryTab three-column showcase layout"
```

---

## Task 4: Wire UILibraryTab into BrandAssetsApp

Replace the `DesignSystemTab` usage in `BrandAssetsApp` with the new `UILibraryTab`. Move search/category state management into the new component (it handles its own state now). Rename the tab label.

**Files:**
- Modify: `apps/rad-os/components/apps/BrandAssetsApp.tsx`

**Step 1: Update the import**

Replace line 13:
```tsx
// OLD
import { DesignSystemTab } from '@/components/ui/DesignSystemTab';
// NEW
import { UILibraryTab } from '@/components/ui/UILibraryTab';
```

**Step 2: Remove the external search/category state**

In the `BrandAssetsApp` component body (~line 481-482), remove:
```tsx
const [componentSearch, setComponentSearch] = useState('');
const [componentCategory, setComponentCategory] = useState<ComponentCategory | 'all'>('all');
```

Also remove the now-unused imports from the registry import (line 17):
```tsx
// OLD
import { registry, CATEGORIES, CATEGORY_LABELS } from '@rdna/radiants/registry';
import type { ComponentCategory } from '@rdna/radiants/registry';
// NEW — keep only what's still used by other tabs (check if anything else uses these)
// registry is still used by the 'components' toolbar count — but that toolbar goes away too
```

**Step 3: Remove the components toolbar**

Remove the entire `{activeTab === 'components' && ( ... )}` toolbar block (~lines 517-539). The `UILibraryTab` now handles its own search/category filtering internally.

**Step 4: Rename the tab**

In `TAB_NAV` (~line 491), change:
```tsx
// OLD
{ value: 'components', label: 'UI', icon: <Icon name="outline-box" /> },
// NEW
{ value: 'components', label: 'UI Library', icon: <Icon name="outline-box" /> },
```

**Step 5: Replace the tab content**

Replace the components tab rendering (~lines 619-629):
```tsx
// OLD
{activeTab === 'components' && (
  <div className="h-full flex flex-col">
    <div className="flex-1 min-h-0 @container">
      <DesignSystemTab
        searchQuery={componentSearch}
        activeCategory={componentCategory}
        hideControls
      />
    </div>
  </div>
)}

// NEW
{activeTab === 'components' && (
  <div className="h-full flex flex-col">
    <div className="flex-1 min-h-0">
      <UILibraryTab />
    </div>
  </div>
)}
```

**Step 6: Clean up unused imports**

After all changes, verify which imports are still needed. Remove `CATEGORIES`, `CATEGORY_LABELS`, `ComponentCategory` if nothing else in `BrandAssetsApp` uses them. The `registry` import can also go if the toolbar was the only consumer.

Remove the now-unused `Input` import if it was only used by the component search toolbar.

**Step 7: Verify it compiles**

Run: `cd apps/rad-os && npx tsc --noEmit --pretty 2>&1 | head -30`

**Step 8: Commit**

```bash
git add apps/rad-os/components/apps/BrandAssetsApp.tsx
git commit -m "feat: wire UILibraryTab into BrandAssetsApp, replace DesignSystemTab"
```

---

## Task 5: Delete old DesignSystemTab

**Files:**
- Delete: `apps/rad-os/components/ui/DesignSystemTab.tsx`

**Step 1: Verify no other imports**

Run: `grep -r "DesignSystemTab" apps/rad-os/ --include="*.tsx" --include="*.ts" -l`
Expected: only `test/design-system-tab.test.tsx` (which we'll rewrite next)

**Step 2: Delete the file**

```bash
rm apps/rad-os/components/ui/DesignSystemTab.tsx
```

**Step 3: Verify build**

Run: `cd apps/rad-os && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 4: Commit**

```bash
git add -u apps/rad-os/components/ui/DesignSystemTab.tsx
git commit -m "chore: remove deprecated DesignSystemTab"
```

---

## Task 6: Rewrite the test

Replace the old `DesignSystemTab` test with tests for `UILibraryTab`. Key behaviors to test:
1. Three-column layout renders (navigator, gallery, code output)
2. Selecting a component populates Col 1 props and Col 3 code
3. Deferred rendering still works for gallery cards
4. Search filtering works

**Files:**
- Delete: `apps/rad-os/test/design-system-tab.test.tsx`
- Create: `apps/rad-os/test/ui-library-tab.test.tsx`

**Step 1: Write the test file**

```tsx
// apps/rad-os/test/ui-library-tab.test.tsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  private readonly callback: IntersectionObserverCallback;
  private readonly elements = new Set<Element>();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  observe = (element: Element) => {
    this.elements.add(element);
  };

  unobserve = (element: Element) => {
    this.elements.delete(element);
  };

  disconnect = () => {
    this.elements.clear();
  };

  takeRecords = () => [];

  static triggerAll(isIntersecting = true) {
    for (const instance of MockIntersectionObserver.instances) {
      const entries = [...instance.elements].map(
        (target) =>
          ({
            isIntersecting,
            target,
          }) as IntersectionObserverEntry,
      );
      instance.callback(entries, instance as unknown as IntersectionObserver);
    }
  }

  static reset() {
    MockIntersectionObserver.instances = [];
  }
}

vi.mock('@rdna/radiants/components/core', () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
  Input: ({ value = '', onChange, placeholder }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input value={value} onChange={onChange} placeholder={placeholder} />
  ),
  Separator: () => <hr />,
  ToggleGroup: Object.assign(
    ({ children }: { children: React.ReactNode }) => <div data-testid="toggle-group">{children}</div>,
    { Item: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button> },
  ),
}));

vi.mock('@rdna/radiants/registry', () => ({
  registry: [
    {
      name: 'Button',
      description: 'A clickable button',
      category: 'action',
      component: ({ label }: { label?: string }) => (
        <div data-testid="demo-button">{label ?? 'Click me'}</div>
      ),
      defaultProps: { label: 'Click me' },
      props: { label: { type: 'string' }, variant: { type: 'string' } },
      states: [],
      renderMode: 'inline',
      tokenBindings: null,
    },
    {
      name: 'Input',
      description: 'A text input',
      category: 'form',
      component: () => <div data-testid="demo-input">Input</div>,
      defaultProps: {},
      props: { placeholder: { type: 'string' } },
      states: [],
      renderMode: 'inline',
      tokenBindings: null,
    },
    {
      name: 'Badge',
      description: 'A badge label',
      category: 'data-display',
      component: ({ label }: { label?: string }) => (
        <div data-testid="demo-badge">{label ?? 'badge'}</div>
      ),
      defaultProps: { label: 'badge' },
      props: { label: { type: 'string' } },
      states: [],
      renderMode: 'inline',
      tokenBindings: null,
    },
  ],
  CATEGORIES: ['action', 'form', 'data-display'],
  CATEGORY_LABELS: { action: 'Actions', form: 'Forms', 'data-display': 'Data Display' },
  getPreviewStateNames: () => [],
  resolvePreviewState: () => ({ wrapperState: undefined, propOverrides: {} }),
  PropControls: () => <div data-testid="prop-controls">Prop controls</div>,
  useShowcaseProps: (entry: { defaultProps?: Record<string, unknown> }) => ({
    props: entry.defaultProps ?? {},
    overrides: {},
    remountKey: 'test',
    setPropValue: vi.fn(),
    resetProps: vi.fn(),
  }),
}));

import { UILibraryTab } from '@/components/ui/UILibraryTab';

describe('UILibraryTab', () => {
  beforeEach(() => {
    MockIntersectionObserver.reset();
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  it('renders three-column layout with navigator, gallery, and code output', () => {
    render(<UILibraryTab />);

    // Col 1: search + category buttons
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(screen.getByText('All (3)')).toBeInTheDocument();

    // Col 2: component names in gallery
    expect(screen.getAllByText('Button').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Input').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Badge').length).toBeGreaterThanOrEqual(1);

    // Col 3: empty state
    expect(screen.getByText('Select a component to see its code output')).toBeInTheDocument();
  });

  it('defers gallery card previews beyond the initial budget', () => {
    render(<UILibraryTab initialInteractiveCards={1} />);

    // First card is eager — should render immediately
    MockIntersectionObserver.triggerAll();

    // All three should eventually render
    expect(screen.getByTestId('demo-button')).toBeInTheDocument();
  });

  it('selecting a component shows its name in the navigator list as highlighted', () => {
    render(<UILibraryTab />);

    // Click "Button" in the navigator list
    const listButtons = screen.getAllByRole('button', { name: 'Button' });
    // The navigator list button (not the gallery card)
    fireEvent.click(listButtons[0]);

    // The code output should no longer show the empty state
    expect(screen.queryByText('Select a component to see its code output')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run the tests**

Run: `cd apps/rad-os && npx vitest run test/ui-library-tab.test.tsx --reporter=verbose`
Expected: All 3 tests pass.

**Step 3: Delete old test and commit**

```bash
rm apps/rad-os/test/design-system-tab.test.tsx
git add apps/rad-os/test/ui-library-tab.test.tsx
git add -u apps/rad-os/test/design-system-tab.test.tsx
git commit -m "test: rewrite showcase tests for UILibraryTab three-column layout"
```

---

## Task 7: Visual QA in browser

**Step 1: Start the dev server**

Run: `pnpm dev` (from monorepo root)

**Step 2: Open in browser**

Navigate to `localhost:3000`, open the BrandAssets app, click the "UI Library" tab.

**Step 3: Check these items**

- [ ] Three columns visible: navigator (left), gallery (center), code output (right)
- [ ] Search input filters both the navigator list and the gallery grid
- [ ] Category buttons filter correctly
- [ ] Clicking a component in the navigator highlights it and shows props below
- [ ] Clicking a component in the gallery also selects it
- [ ] Code output panel shows JSX/CSS/Tailwind tabs with generated code
- [ ] Copy button works
- [ ] Gallery cards tile responsively when window is resized
- [ ] Scrolling in each column is independent
- [ ] Deselecting a component (clicking again) returns to empty state in Col 3 and removes props from Col 1

**Step 4: Fix any issues found, commit**

```bash
git add -A
git commit -m "fix: visual QA fixes for UILibraryTab"
```

---

## Task 8: Lint check

**Step 1: Run RDNA lint**

Run: `pnpm lint:design-system 2>&1 | head -40`

**Step 2: Run general lint**

Run: `pnpm lint 2>&1 | head -40`

**Step 3: Fix any violations, commit**

```bash
git add -A
git commit -m "fix: lint violations in UILibraryTab"
```

---

## Future Extensions (not in scope)

These are noted for the Col 3 code output panel's future growth:

- **Paper export** — generate Paper MCP `write_html` payload
- **HTML export** — standalone HTML snippet with inline styles
- **Figma JSON** — component node JSON for Figma import
- **ASCII art** — text representation for prototyping in terminals/docs

The `ToggleGroup` in `ComponentCodeOutput` can be extended with additional items. The `generateComponentCode` function can gain new format branches.
