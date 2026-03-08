# Shared Component Registry Brainstorm

**Date:** 2026-03-08
**Status:** Decided

## What We're Building

A derived component registry in `packages/radiants/` that auto-generates from existing `*.schema.json` metadata. Both the BrandAssets "Components" tab (via `DesignSystemTab`) and the future playground app consume the same registry. A component creation skill captures metadata at creation time so the registry stays in sync without manual maintenance.

## Why This Approach

The current `DesignSystemTab` is a 1,634-line hand-authored storybook with hardcoded demo JSX. Every new component requires manually adding imports, demo code, and search index entries. By deriving the registry from schema.json — files that already exist for all 27 components — we get a single source of truth that both display (BrandAssets) and dev tooling (playground) can consume. The Phase reference implementation (`phase/app/components/_registry.ts`) validated the `ComponentEntry` pattern with categories, variants, and search tags.

## Key Decisions

- **Registry is a derived artifact** — a generator script reads `*.schema.json` + `core/index.ts` exports and outputs the registry. Never hand-edited directly.
- **Lives in `packages/radiants/`** — co-located with the components it describes. Both apps import from the package.
- **schema.json gets a `category` field** — one-time backfill via agent batch for all 27 existing components. New components get it via the creation skill.
- **Component creation skill** — captures `category`, `description`, demo props at creation time so schema.json is always complete.
- **No hook** — rely on lint/CI to catch missing registry entries rather than adding PostToolUse complexity.
- **DesignSystemTab replaced** — reads from the registry and renders showcase cards (Phase's `ComponentShowcaseCard` pattern). The hand-authored `*Content` functions go away.
- **json-render deferred** — relevant to playground Phase 4+ (AI generation format), not the registry layer.
- **Variant demos auto-generated** — enum props in schema.json produce variant × value combinations. A thin `registry.overrides.ts` allows curation (custom labels, drop noisy combos, set `renderMode`).

## Architecture

```
packages/radiants/
├── components/core/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.schema.json    ← now includes "category"
│   │   └── Button.dna.json
│   └── index.ts                  ← export barrel (import map source)
├── registry/
│   ├── generate.mjs              ← reads schema.json + index.ts → manifest
│   ├── registry.manifest.json    ← generated output (gitignored or committed)
│   ├── registry.ts               ← typed loader, exports ComponentEntry[]
│   ├── registry.overrides.ts     ← manual curation (labels, renderMode, tags)
│   └── types.ts                  ← ComponentEntry, ComponentCategory types
└── package.json                  ← adds registry export entrypoint
```

### Schema.json Addition

```jsonc
{
  "name": "Button",
  "category": "action",          // ← NEW FIELD
  "description": "...",
  "props": { ... },
  // ... existing fields unchanged
}
```

### Category Taxonomy

Derived from DesignSystemTab's existing groupings:

| Category | Components |
|----------|-----------|
| `action` | Button, ContextMenu, DropdownMenu |
| `layout` | Card, Divider, Accordion |
| `form` | Input, TextArea, Label, Checkbox, Radio, Select, Slider, Switch |
| `feedback` | Alert, Badge, Progress, Spinner, Toast |
| `navigation` | Breadcrumbs, Tabs, StepperTabs |
| `overlay` | Dialog, Sheet, Popover, Tooltip, HelpPanel |
| `data-display` | CountdownTimer, Web3ActionBar |
| `dev` | MockStatesPopover |

### ComponentEntry Type

```ts
export type ComponentCategory =
  | 'action'
  | 'layout'
  | 'form'
  | 'feedback'
  | 'navigation'
  | 'overlay'
  | 'data-display'
  | 'dev';

export interface ComponentEntry {
  name: string;
  category: ComponentCategory;
  description: string;
  component: React.ComponentType<unknown>;
  sourcePath: string;                    // playground needs this
  schemaPath: string;                    // playground needs this
  exampleProps?: Record<string, unknown>;
  variants?: Array<{ label: string; props: Record<string, unknown> }>;
  tags?: string[];
  renderMode?: 'inline' | 'contained' | 'description-only';
}
```

### Generator Flow

1. Glob `packages/radiants/components/core/*/*.schema.json`
2. Parse each schema → extract `name`, `category`, `description`, `props`
3. Read `core/index.ts` → build name → export mapping
4. For each enum prop, generate variant combinations (e.g., Button variant × size)
5. Merge with `registry.overrides.ts` (custom labels, renderMode, curated variants)
6. Output `registry.manifest.json` + typed `registry.ts`

### Consumer: BrandAssets Components Tab

```tsx
// apps/rad-os/components/ui/DesignSystemTab.tsx (simplified)
import { registry, CATEGORIES } from '@rdna/radiants/registry';

// Renders ComponentShowcaseCard per entry
// Filters by category tabs + search
// No more hand-authored *Content functions
```

### Consumer: Playground (future)

```tsx
// apps/playground/app/playground/registry.tsx
import { registry } from '@rdna/radiants/registry';

// Extends entries with playground-specific metadata
// Uses sourcePath for generation context
// Uses schemaPath for prompt injection
```

## Open Questions

1. Should `registry.manifest.json` be committed or gitignored + generated at build time?
2. Should the generator run as a package.json script (`pnpm --filter @rdna/radiants generate:registry`) or as part of `pnpm build`?
3. For compound components (Card → CardHeader, CardBody, CardFooter), does the registry show the parent only or each sub-component?
4. Should the creation skill also scaffold a basic Vitest test file?

## Backfill Plan

Agent batch: add `"category"` field to all 27 `*.schema.json` files using the taxonomy above. One parallel agent, ~5 minutes.

## Playground Plan Impact

This brainstorm modifies the playground plan as follows:
- **Task 0.4** (manual registry) → replaced by the shared auto-generated registry from `@rdna/radiants/registry`
- **Task 1.2** (expand manual registry) → unnecessary, generator covers all components
- **Phase 2** (registry automation) → moved forward into this work, no longer a separate phase
- **Task 2.3** (manual overrides) → kept as `registry.overrides.ts`

## Research Notes

- **Phase reference**: `phase/app/components/_registry.ts` + `page.tsx` — clean `ComponentEntry[]` with categories, variants, search, sort, showcase cards
- **DesignSystemTab**: `apps/rad-os/components/ui/DesignSystemTab.tsx` — 1,634 lines, 7 hand-authored content groups, static `COMPONENT_SECTIONS` array
- **Schema coverage**: 27 schema.json files exist, all have `name`/`description`/`props`. Inconsistency: `slots` is object in some, string array in others (doesn't affect registry)
- **json-render**: `defineCatalog` + `defineRegistry` pattern useful for playground Phase 4+ AI generation, not for the registry itself
