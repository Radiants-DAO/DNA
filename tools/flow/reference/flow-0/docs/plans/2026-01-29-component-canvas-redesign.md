# Component Canvas Redesign: Zoned Canvas, Live Rendering & Full Component Discovery

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the component canvas into a zoned layout with live-rendered component cards (direct import, not iframes), full component discovery (theme + project + bridge), category grouping, and a page preview zone — all on one pan/zoom canvas.

**Architecture:** The canvas becomes a zoned surface with two regions: a "Components" zone (left) showing live-rendered component cards grouped by category, and a "Preview" zone (right) showing page previews at various viewport sizes. Components are imported directly from the monorepo via Vite workspace resolution and rendered in sandboxed divs with theme CSS injected. The Rust backend scan_schemas command is extended to also scan project source directories. Bridge runtime discovery supplements schema-based discovery for components without .schema.json files. A new `category` field is added to all .schema.json files.

**Tech Stack:** React 19, Zustand 5, Vite 7 (monorepo workspace resolution), Tailwind v4, Tauri 2 (Rust backend)

---

## Scope

| Area | What Changes |
|------|-------------|
| 1d: Component discovery | Rust backend scans project src/ + theme; bridge supplements |
| 1a: Layout | Zoned canvas with Components zone + Preview zone |
| 1b: Sorting/filtering | Category field in .schema.json, grouped sections with headers |
| 1c: View layer | Live-rendered cards (direct import), auto-sizing, expandable props |
| Comment fixes | **Separate plan** (deferred) |

## Phase Overview

1. **Phase 1 (Tasks 1-5):** Schema category field + Rust scan expansion
2. **Phase 2 (Tasks 6-10):** Zoned canvas layout with category sections
3. **Phase 3 (Tasks 11-16):** Live component rendering via direct import
4. **Phase 4 (Tasks 17-19):** Preview zone with page imports
5. **Phase 5 (Tasks 20-22):** Bridge discovery integration + polish

---

## Phase 1: Schema Category Field & Expanded Scanning

### Task 1: Add `category` field to schema type definitions

**Files:**
- Modify: `app/types/componentCanvas.ts`

**Step 1: Add category type and field**

Add after the existing imports/types at the top of the file:

```typescript
/** Component category for grouping in the canvas */
export type ComponentCategory =
  | "layout"
  | "action"
  | "input"
  | "feedback"
  | "overlay"
  | "navigation"
  | "specialty"
  | "app"; // App-specific components (RadOS, Radmark, etc.)
```

Add `category` to the `ComponentSchema` interface:

```typescript
/** Category for canvas grouping (from schema.json) */
category?: ComponentCategory;
/** App name if category is "app" (e.g. "RadOS", "Radmark") */
appName?: string;
/** Source origin: "theme", "project", or "bridge" */
source?: "theme" | "project" | "bridge";
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add app/types/componentCanvas.ts
git commit -m "feat(component-canvas): add category, appName, source fields to ComponentSchema"
```

---

### Task 2: Add category to all radiants .schema.json files

**Files:**
- Modify: All 26 `packages/radiants/components/core/*/Component.schema.json` files

**Step 1: Add category field to each schema**

Add `"category": "<value>"` as the second field (after `"name"`) in each schema file:

| Component | Category |
|-----------|----------|
| Accordion | navigation |
| Alert | feedback |
| Badge | feedback |
| Breadcrumbs | navigation |
| Button | action |
| Card | layout |
| Checkbox | input |
| ContextMenu | action |
| CountdownTimer | specialty |
| Dialog | overlay |
| Divider | layout |
| DropdownMenu | action |
| HelpPanel | overlay |
| Input | input |
| MockStatesPopover | specialty |
| Popover | overlay |
| Progress | feedback |
| Select | input |
| Sheet | overlay |
| Slider | input |
| Switch | input |
| Tabs | navigation |
| Toast | feedback |
| Tooltip | overlay |
| Web3ActionBar | specialty |

**Step 2: Verify JSON validity**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/packages/radiants && find . -name "*.schema.json" -exec python3 -m json.tool {} > /dev/null \;`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/radiants/components/core/
git commit -m "feat(radiants): add category field to all 26 component schemas"
```

---

### Task 3: Update Rust scan_schemas to parse category field

**Files:**
- Modify: `tauri/src/commands/schema.rs`
- Modify: `tauri/src/types/mod.rs`

**Step 1: Read the current Rust schema types and scan command**

Open `tauri/src/types/mod.rs` and find `RawSchema`. Open `tauri/src/commands/schema.rs` and find the `scan_schemas` function.

**Step 2: Add category and app_name fields to RawSchema**

In `tauri/src/types/mod.rs`, add to the `RawSchema` struct:

```rust
pub category: Option<String>,
pub app_name: Option<String>,
```

**Step 3: Parse category from schema JSON in scan_schemas**

In the schema parsing logic in `schema.rs`, when reading the JSON file, extract:

```rust
let category = json_value.get("category")
    .and_then(|v| v.as_str())
    .map(|s| s.to_string());
let app_name = json_value.get("appName")
    .and_then(|v| v.as_str())
    .map(|s| s.to_string());
```

Set these on the `RawSchema` instance.

**Step 4: Verify Rust compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow/tauri && cargo check`
Expected: PASS

**Step 5: Commit**

```bash
git add tauri/src/commands/schema.rs tauri/src/types/mod.rs
git commit -m "feat(tauri): parse category and appName from schema.json"
```

---

### Task 4: Extend scan_schemas to accept multiple paths

**Files:**
- Modify: `tauri/src/commands/schema.rs`
- Modify: `tauri/src/lib.rs` (if command signature changes)

**Step 1: Read current scan_schemas signature**

Currently: `fn scan_schemas(path: String) -> Result<ScanResult, String>`

**Step 2: Change to accept multiple paths**

```rust
#[tauri::command]
#[specta::specta]
pub fn scan_schemas(paths: Vec<String>) -> Result<ScanResult, String> {
    let mut all_schemas: Vec<RawSchema> = Vec::new();
    let mut all_dna_configs: Vec<RawDnaConfig> = Vec::new();
    let start = std::time::Instant::now();

    for path in &paths {
        let path = std::path::Path::new(path);
        if !path.exists() {
            continue; // Skip non-existent paths silently
        }

        // Existing walk logic, but append to all_schemas/all_dna_configs
        // instead of creating new vecs
        // ... (keep existing per-directory scan logic)
    }

    // Deduplicate by component name (theme takes precedence)
    // Use a seen set to skip duplicates
    let mut seen_names = std::collections::HashSet::new();
    all_schemas.retain(|s| seen_names.insert(s.name.clone()));

    Ok(ScanResult {
        schemas: all_schemas,
        dna_configs: all_dna_configs,
        total_schemas: all_schemas.len() as u32,
        total_dna_configs: all_dna_configs.len() as u32,
        scan_time_ms: start.elapsed().as_millis() as u64,
    })
}
```

**Step 3: Add source field to RawSchema**

Add to `RawSchema`:
```rust
pub source: String, // "theme" or "project"
```

Set this based on which path the schema was found in. The first path is "theme", subsequent paths are "project".

**Step 4: Verify Rust compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow/tauri && cargo check`
Expected: PASS

**Step 5: Commit**

```bash
git add tauri/src/commands/schema.rs tauri/src/types/mod.rs tauri/src/lib.rs
git commit -m "feat(tauri): scan_schemas accepts multiple paths, adds source field"
```

---

### Task 5: Update frontend scanComponentSchemas to pass multiple paths

**Files:**
- Modify: `app/stores/slices/componentCanvasSlice.ts`

**Step 1: Update scanComponentSchemas action**

Change signature to accept multiple paths:

```typescript
/** Scan theme + project directories for component schemas and DNA configs */
scanComponentSchemas: (paths: string[]) => Promise<void>;
```

Update the implementation:

```typescript
scanComponentSchemas: async (paths) => {
  set({
    componentCanvasLoading: true,
    componentCanvasError: null,
    componentCanvasThemePath: paths[0] || null,
  });

  try {
    const { invoke } = await import("@tauri-apps/api/core");

    // Call updated Rust command with paths array
    const result = await invoke<ScanResult>("scan_schemas", { paths });

    // ... rest of parsing unchanged, but also extract category/source:
```

In the schema mapping, add:

```typescript
return {
  name: s.name,
  description: s.description,
  filePath: s.filePath,
  props,
  slots,
  examples: s.examples,
  subcomponents: s.subcomponents ?? undefined,
  category: s.category as ComponentCategory | undefined,
  appName: s.appName ?? undefined,
  source: (s.source as "theme" | "project") ?? "theme",
};
```

**Step 2: Update callers**

Search for all calls to `scanComponentSchemas` and update them to pass an array. Likely in a workspace loading hook or EditorLayout. Change:

```typescript
// Before:
scanComponentSchemas(themePath);

// After:
const paths = [themePath];
if (projectPath) paths.push(projectPath + '/src');
scanComponentSchemas(paths);
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add app/stores/slices/componentCanvasSlice.ts
git commit -m "feat(component-canvas): scanComponentSchemas accepts multiple paths with source tracking"
```

---

## Phase 2: Zoned Canvas Layout

### Task 6: Define zone types and canvas layout model

**Files:**
- Modify: `app/types/componentCanvas.ts`

**Step 1: Add zone types**

```typescript
// ============================================================================
// Canvas Zone Types
// ============================================================================

/** A zone is a labeled region on the canvas */
export interface CanvasZone {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Background color (subtle, for visual separation) */
  bgColor: string;
}

/** Category section within the components zone */
export interface CategorySection {
  category: ComponentCategory;
  label: string;
  /** Nodes belonging to this category */
  nodeIds: string[];
  /** Y offset within the components zone */
  offsetY: number;
  /** Height of this section */
  height: number;
}

/** Display labels for categories */
export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  layout: "Layout",
  action: "Actions",
  input: "Inputs",
  feedback: "Feedback",
  overlay: "Overlays",
  navigation: "Navigation",
  specialty: "Specialty",
  app: "App Components",
};

/** Category sort order */
export const CATEGORY_ORDER: ComponentCategory[] = [
  "layout",
  "input",
  "action",
  "feedback",
  "overlay",
  "navigation",
  "specialty",
  "app",
];
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add app/types/componentCanvas.ts
git commit -m "feat(component-canvas): add zone and category section types"
```

---

### Task 7: Rewrite grid layout to category-grouped layout

**Files:**
- Modify: `app/stores/slices/componentCanvasSlice.ts`

**Step 1: Replace calculateGridLayout with calculateZonedLayout**

```typescript
import type {
  ComponentSchema,
  DnaConfig,
  ComponentCanvasNode,
  CategorySection,
  CanvasZone,
  ComponentCategory,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
} from "../../types/componentCanvas";

/**
 * Zone configuration
 */
const ZONE_CONFIG = {
  componentsZone: { x: 0, y: 0, minWidth: 800 },
  previewZone: { gapFromComponents: 80 },
  sectionHeaderHeight: 40,
  sectionGap: 32,
  nodeGap: 24,
  nodesPerRow: 3,
  nodeMinWidth: 240,
  nodeMinHeight: 160,
  zonePadding: 48,
  zoneLabelHeight: 48,
};

/**
 * Calculate category-grouped layout for nodes
 */
function calculateZonedLayout(
  schemas: ComponentSchema[],
  dnaConfigs: DnaConfig[]
): {
  nodes: ComponentCanvasNode[];
  categorySections: CategorySection[];
  componentsZone: CanvasZone;
} {
  const nodes: ComponentCanvasNode[] = [];
  const dnaMap = new Map(dnaConfigs.map((d) => [d.component, d]));
  const categorySections: CategorySection[] = [];

  // Group schemas by category
  const grouped = new Map<ComponentCategory, ComponentSchema[]>();
  for (const schema of schemas) {
    const cat = schema.category || "specialty";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(schema);
  }

  // Layout each category section
  let currentY = ZONE_CONFIG.zonePadding + ZONE_CONFIG.zoneLabelHeight;
  let maxRight = 0;

  for (const category of CATEGORY_ORDER) {
    const categorySchemas = grouped.get(category);
    if (!categorySchemas || categorySchemas.length === 0) continue;

    const sectionStartY = currentY;

    // Section header
    currentY += ZONE_CONFIG.sectionHeaderHeight;

    // Layout nodes in grid within this section
    const sectionNodeIds: string[] = [];

    categorySchemas.forEach((schema, index) => {
      const row = Math.floor(index / ZONE_CONFIG.nodesPerRow);
      const col = index % ZONE_CONFIG.nodesPerRow;

      const x = ZONE_CONFIG.zonePadding +
        col * (ZONE_CONFIG.nodeMinWidth + ZONE_CONFIG.nodeGap);
      const y = currentY +
        row * (ZONE_CONFIG.nodeMinHeight + ZONE_CONFIG.nodeGap);

      const node: ComponentCanvasNode = {
        id: `component-${schema.name}`,
        schema,
        dna: dnaMap.get(schema.name),
        x,
        y,
        width: ZONE_CONFIG.nodeMinWidth,
        height: ZONE_CONFIG.nodeMinHeight,
      };

      nodes.push(node);
      sectionNodeIds.push(node.id);

      const right = x + ZONE_CONFIG.nodeMinWidth;
      if (right > maxRight) maxRight = right;
    });

    const totalRows = Math.ceil(categorySchemas.length / ZONE_CONFIG.nodesPerRow);
    currentY += totalRows * (ZONE_CONFIG.nodeMinHeight + ZONE_CONFIG.nodeGap);

    categorySections.push({
      category,
      label: CATEGORY_LABELS[category],
      nodeIds: sectionNodeIds,
      offsetY: sectionStartY,
      height: currentY - sectionStartY,
    });

    currentY += ZONE_CONFIG.sectionGap;
  }

  const componentsZone: CanvasZone = {
    id: "components",
    label: "Components",
    x: 0,
    y: 0,
    width: Math.max(maxRight + ZONE_CONFIG.zonePadding, ZONE_CONFIG.componentsZone.minWidth),
    height: currentY + ZONE_CONFIG.zonePadding,
    bgColor: "rgba(255, 255, 255, 0.02)",
  };

  return { nodes, categorySections, componentsZone };
}
```

**Step 2: Add categorySections and zones to slice state**

Add to `ComponentCanvasSlice` interface:

```typescript
/** Category sections for grouped display */
categorySections: CategorySection[];
/** Canvas zones */
componentsZone: CanvasZone | null;
previewZone: CanvasZone | null;
```

Add initial state:

```typescript
categorySections: [],
componentsZone: null,
previewZone: null,
```

**Step 3: Update scanComponentSchemas to use new layout**

Replace the `calculateGridLayout` call:

```typescript
const { nodes, categorySections, componentsZone } = calculateZonedLayout(schemas, dnaConfigs);

set({
  componentSchemas: schemas,
  dnaConfigs: dnaConfigs,
  componentCanvasNodes: nodes,
  categorySections,
  componentsZone,
  componentCanvasLoading: false,
});
```

**Step 4: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add app/stores/slices/componentCanvasSlice.ts
git commit -m "feat(component-canvas): category-grouped zoned layout algorithm"
```

---

### Task 8: Render zone backgrounds and section headers in ComponentCanvas

**Files:**
- Modify: `app/components/component-canvas/ComponentCanvas.tsx`

**Step 1: Add zone and section state selectors**

```typescript
const categorySections = useAppStore((s) => s.categorySections);
const componentsZone = useAppStore((s) => s.componentsZone);
```

**Step 2: Render zone background inside the transform container**

Add before the component nodes, inside the transformed div:

```typescript
{/* Zone backgrounds */}
{componentsZone && (
  <div
    className="absolute rounded-xl pointer-events-none"
    style={{
      left: componentsZone.x,
      top: componentsZone.y,
      width: componentsZone.width,
      height: componentsZone.height,
      backgroundColor: componentsZone.bgColor,
      border: "1px solid rgba(255, 255, 255, 0.05)",
    }}
  >
    {/* Zone label */}
    <div
      className="absolute -top-6 left-4 text-xs font-medium px-2 py-0.5 rounded"
      style={{
        color: "rgba(255, 255, 255, 0.5)",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
      }}
    >
      {componentsZone.label}
    </div>
  </div>
)}

{/* Category section headers */}
{categorySections.map((section) => (
  <div
    key={section.category}
    className="absolute pointer-events-none"
    style={{
      left: 48,
      top: section.offsetY,
      height: 32,
    }}
  >
    <span
      className="text-xs font-heading uppercase tracking-wider"
      style={{ color: "rgba(255, 255, 255, 0.4)" }}
    >
      {section.label}
    </span>
    <span
      className="text-[10px] ml-2"
      style={{ color: "rgba(255, 255, 255, 0.2)" }}
    >
      {section.nodeIds.length}
    </span>
  </div>
))}
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add app/components/component-canvas/ComponentCanvas.tsx
git commit -m "feat(component-canvas): render zone backgrounds and category section headers"
```

---

### Task 9: Add category filter controls

**Files:**
- Modify: `app/components/component-canvas/ComponentCanvas.tsx`
- Modify: `app/stores/slices/componentCanvasSlice.ts`

**Step 1: Add filter state to slice**

```typescript
/** Active category filters (empty = show all) */
componentCanvasCategoryFilter: Set<ComponentCategory>;

/** Toggle a category filter */
toggleCategoryFilter: (category: ComponentCategory) => void;

/** Clear all filters (show all) */
clearCategoryFilters: () => void;
```

Implementation:

```typescript
componentCanvasCategoryFilter: new Set(),

toggleCategoryFilter: (category) =>
  set((state) => {
    const filters = new Set(state.componentCanvasCategoryFilter);
    if (filters.has(category)) {
      filters.delete(category);
    } else {
      filters.add(category);
    }
    return { componentCanvasCategoryFilter: filters };
  }),

clearCategoryFilters: () => set({ componentCanvasCategoryFilter: new Set() }),
```

**Step 2: Add filter bar to ComponentCanvas**

Add a filter bar above the canvas (inside the flex-1 flex flex-col container, before the canvas viewport):

```typescript
{/* Category filter bar */}
<div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/5">
  <span className="text-[10px] text-white/40 mr-2">Filter:</span>
  {CATEGORY_ORDER.map((cat) => {
    const count = categorySections.find((s) => s.category === cat)?.nodeIds.length || 0;
    if (count === 0) return null;
    const isActive = categoryFilter.size === 0 || categoryFilter.has(cat);
    return (
      <button
        key={cat}
        onClick={() => toggleCategoryFilter(cat)}
        className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
          isActive
            ? "bg-white/10 text-white/80"
            : "bg-transparent text-white/25 hover:text-white/40"
        }`}
      >
        {CATEGORY_LABELS[cat]} ({count})
      </button>
    );
  })}
</div>
```

**Step 3: Apply filter to rendered nodes**

In the nodes rendering, filter by active categories:

```typescript
const visibleNodes = useMemo(() => {
  if (categoryFilter.size === 0) return componentNodes;
  return componentNodes.filter((n) =>
    categoryFilter.has(n.schema.category || "specialty")
  );
}, [componentNodes, categoryFilter]);
```

Use `visibleNodes` instead of `componentNodes` in the render loop.

**Step 4: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add app/components/component-canvas/ComponentCanvas.tsx app/stores/slices/componentCanvasSlice.ts
git commit -m "feat(component-canvas): add category filter controls"
```

---

### Task 10: Add source filter (theme vs project vs bridge)

**Files:**
- Modify: `app/components/component-canvas/ComponentCanvas.tsx`
- Modify: `app/stores/slices/componentCanvasSlice.ts`

**Step 1: Add source filter state**

```typescript
/** Active source filter (empty = show all) */
componentCanvasSourceFilter: Set<"theme" | "project" | "bridge">;

toggleSourceFilter: (source: "theme" | "project" | "bridge") => void;
```

**Step 2: Add source filter pills next to category filters**

```typescript
<div className="ml-4 flex items-center gap-1.5 border-l border-white/5 pl-4">
  <span className="text-[10px] text-white/40 mr-1">Source:</span>
  {(["theme", "project", "bridge"] as const).map((src) => {
    const count = componentNodes.filter((n) => (n.schema.source || "theme") === src).length;
    if (count === 0) return null;
    const isActive = sourceFilter.size === 0 || sourceFilter.has(src);
    const colors = { theme: "#3b82f6", project: "#22c55e", bridge: "#f59e0b" };
    return (
      <button
        key={src}
        onClick={() => toggleSourceFilter(src)}
        className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
          isActive ? "text-white/80" : "text-white/25"
        }`}
        style={{
          backgroundColor: isActive ? `${colors[src]}20` : "transparent",
          borderColor: isActive ? `${colors[src]}40` : "transparent",
          borderWidth: 1,
        }}
      >
        {src} ({count})
      </button>
    );
  })}
</div>
```

**Step 3: Combine with category filter in visibleNodes**

```typescript
const visibleNodes = useMemo(() => {
  return componentNodes.filter((n) => {
    const catMatch = categoryFilter.size === 0 || categoryFilter.has(n.schema.category || "specialty");
    const srcMatch = sourceFilter.size === 0 || sourceFilter.has(n.schema.source || "theme");
    return catMatch && srcMatch;
  });
}, [componentNodes, categoryFilter, sourceFilter]);
```

**Step 4: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add app/components/component-canvas/ComponentCanvas.tsx app/stores/slices/componentCanvasSlice.ts
git commit -m "feat(component-canvas): add source filter (theme/project/bridge)"
```

---

## Phase 3: Live Component Rendering via Direct Import

### Task 11: Set up Vite alias for radiants component imports

**Files:**
- Modify: `vite.config.ts`

**Step 1: Add resolve alias for radiants package**

```typescript
import path from "path";

export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@rdna/radiants": path.resolve(__dirname, "../../packages/radiants"),
      "@rdna/radiants/components/core": path.resolve(
        __dirname,
        "../../packages/radiants/components/core"
      ),
    },
  },
  // ... rest of config
}));
```

**Step 2: Verify the alias works**

Create a quick test: in any existing component, try importing Button:

```typescript
// Temporary test - remove after verifying
import { Button } from "@rdna/radiants/components/core";
console.log("Button imported:", Button);
```

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm tauri dev`
Expected: No import errors, Button logs to console

**Step 3: Remove test import, commit**

```bash
git add vite.config.ts
git commit -m "feat: add Vite alias for @rdna/radiants monorepo imports"
```

---

### Task 12: Create ComponentRenderer sandboxed wrapper

**Files:**
- Create: `app/components/component-canvas/ComponentRenderer.tsx`

**Step 1: Create the sandboxed renderer**

This component dynamically imports a component by name from the radiants package and renders it in a sandboxed div with theme CSS.

```typescript
import { Suspense, lazy, useMemo, useRef, useEffect, useState } from "react";
import type { ComponentSchema } from "../../types/componentCanvas";

/**
 * Dynamic import map for radiants components.
 * Maps component name -> lazy import.
 * This is populated at build time via Vite's dynamic import.
 */
const componentModules = import.meta.glob(
  "/../../packages/radiants/components/core/*/index.ts",
  { eager: false }
) as Record<string, () => Promise<Record<string, unknown>>>;

/**
 * Resolve a component by name from the radiants package.
 * Returns a lazy React component or null.
 */
function resolveComponent(name: string): React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>> | null {
  // Try to find the module by folder name
  const moduleKey = Object.keys(componentModules).find((key) =>
    key.includes(`/${name}/`)
  );

  if (!moduleKey) return null;

  return lazy(async () => {
    const mod = await componentModules[moduleKey]();
    const Component = mod[name] || mod.default;
    if (!Component) {
      return { default: () => <div className="text-red-400 text-xs">Component "{name}" not found in module</div> };
    }
    return { default: Component as React.ComponentType<Record<string, unknown>> };
  });
}

interface ComponentRendererProps {
  schema: ComponentSchema;
  /** Which example to render (index into schema.examples) */
  exampleIndex?: number;
  /** Max width for the render area */
  maxWidth?: number;
  /** Callback when rendered content size is known */
  onResize?: (size: { width: number; height: number }) => void;
}

/**
 * ComponentRenderer — Renders a component from the monorepo directly.
 *
 * Uses Vite's import.meta.glob to dynamically import radiants components.
 * Wraps them in a sandboxed container with theme CSS applied.
 * Measures rendered size and reports back for auto-sizing cards.
 */
export function ComponentRenderer({
  schema,
  exampleIndex = 0,
  maxWidth = 400,
  onResize,
}: ComponentRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const LazyComponent = useMemo(
    () => resolveComponent(schema.name),
    [schema.name]
  );

  // Measure rendered size
  useEffect(() => {
    if (!containerRef.current || !onResize) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        onResize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [onResize]);

  if (!LazyComponent) {
    return (
      <div className="flex items-center justify-center p-4 text-[10px] text-white/30">
        No render available
      </div>
    );
  }

  // Build default props from schema examples
  const exampleProps = useMemo(() => {
    const example = schema.examples[exampleIndex];
    if (!example) return {};

    // Try to extract props from example code (simple heuristic)
    // For now, use default prop values from schema
    const defaults: Record<string, unknown> = {};
    for (const [key, prop] of Object.entries(schema.props)) {
      if (prop.default !== undefined) {
        defaults[key] = prop.default;
      }
    }
    return defaults;
  }, [schema, exampleIndex]);

  return (
    <div
      ref={containerRef}
      className="component-renderer-sandbox"
      style={{
        maxWidth,
        overflow: "hidden",
        // Import radiants theme CSS via Tailwind — the parent app already
        // has radiants tokens loaded in index.css
      }}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-4">
            <span className="text-[10px] text-white/30">Loading...</span>
          </div>
        }
      >
        <div className="bg-surface-primary text-content-primary p-3 rounded">
          <LazyComponent {...exampleProps}>
            {schema.name}
          </LazyComponent>
        </div>
      </Suspense>
    </div>
  );
}

export default ComponentRenderer;
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add app/components/component-canvas/ComponentRenderer.tsx
git commit -m "feat(component-canvas): create ComponentRenderer with dynamic monorepo imports"
```

---

### Task 13: Redesign ComponentNode to show live render + collapsible props

**Files:**
- Modify: `app/components/component-canvas/ComponentNode.tsx`

**Step 1: Read the current ComponentNode**

Currently 295 lines showing text-based props/slots. We're replacing this with:
- Live rendered component (via ComponentRenderer) as the main content
- Component name header
- Collapsible details drawer (props, slots, examples)
- Auto-sizing based on rendered content

**Step 2: Rewrite ComponentNode**

```typescript
import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import type { ComponentCanvasNode } from "../../types/componentCanvas";
import { ComponentRenderer } from "./ComponentRenderer";
import { Component } from "../ui/icons";

interface ComponentNodeProps {
  node: ComponentCanvasNode;
  isSelected: boolean;
  isFocused: boolean;
  onSelect: (id: string, modifiers: { cmd: boolean; shift: boolean }) => void;
  onDoubleClick: (node: ComponentCanvasNode) => void;
  onResize?: (id: string, size: { width: number; height: number }) => void;
}

export function ComponentNode({
  node,
  isSelected,
  isFocused,
  onSelect,
  onDoubleClick,
  onResize,
}: ComponentNodeProps): React.ReactElement {
  const { schema } = node;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [renderedSize, setRenderedSize] = useState<{ width: number; height: number } | null>(null);

  const hasDna = !!node.dna;
  const propCount = Object.keys(schema.props).length;
  const variantCount = node.dna ? Object.keys(node.dna.tokenBindings).length : 0;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(node.id, {
        cmd: e.metaKey || e.ctrlKey,
        shift: e.shiftKey,
      });
    },
    [node.id, onSelect]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDoubleClick(node);
    },
    [node, onDoubleClick]
  );

  const handleRendererResize = useCallback(
    (size: { width: number; height: number }) => {
      setRenderedSize(size);
      onResize?.(node.id, size);
    },
    [node.id, onResize]
  );

  // Compute dynamic height: header (36) + render area + details (if open) + footer (28)
  const dynamicHeight = useMemo(() => {
    const headerHeight = 36;
    const renderHeight = renderedSize ? Math.min(renderedSize.height + 24, 300) : 120;
    const detailsHeight = detailsOpen ? 120 : 0;
    const footerHeight = 28;
    return headerHeight + renderHeight + detailsHeight + footerHeight;
  }, [renderedSize, detailsOpen]);

  return (
    <div
      role="button"
      aria-selected={isSelected}
      tabIndex={isFocused ? 0 : -1}
      className="absolute flex flex-col rounded-lg cursor-pointer overflow-hidden transition-all duration-150"
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: dynamicHeight,
        zIndex: isSelected || isFocused ? 3 : 2,
        backgroundColor: "#1a1a1a",
        border: isSelected
          ? "1px solid rgba(59, 130, 246, 0.8)"
          : isFocused
          ? "1px solid rgba(255, 255, 255, 0.3)"
          : "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: isSelected
          ? "0 0 0 2px rgba(59, 130, 246, 0.3), 0 4px 12px rgba(0, 0, 0, 0.4)"
          : "0 2px 8px rgba(0, 0, 0, 0.3)",
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b flex-shrink-0"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          borderColor: "rgba(255, 255, 255, 0.08)",
        }}
      >
        <Component size={14} className="text-[rgba(255,255,255,0.5)] flex-shrink-0" />
        <span className="flex-1 truncate text-xs font-medium text-[rgba(255,255,255,0.95)]">
          {schema.name}
        </span>
        {/* Source badge */}
        {schema.source && schema.source !== "theme" && (
          <span
            className="text-[9px] px-1 py-0.5 rounded"
            style={{
              backgroundColor: schema.source === "project" ? "rgba(34, 197, 94, 0.15)" : "rgba(245, 158, 11, 0.15)",
              color: schema.source === "project" ? "rgba(34, 197, 94, 0.9)" : "rgba(245, 158, 11, 0.9)",
            }}
          >
            {schema.source}
          </span>
        )}
        {hasDna && (
          <span
            className="text-[9px] px-1 py-0.5 rounded"
            style={{
              backgroundColor: "rgba(34, 197, 94, 0.15)",
              color: "rgba(34, 197, 94, 0.9)",
            }}
          >
            DNA
          </span>
        )}
      </div>

      {/* Live render area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ComponentRenderer
          schema={schema}
          maxWidth={node.width - 2}
          onResize={handleRendererResize}
        />
      </div>

      {/* Collapsible details */}
      {detailsOpen && (
        <div
          className="px-3 py-2 border-t overflow-y-auto"
          style={{
            maxHeight: 120,
            borderColor: "rgba(255, 255, 255, 0.08)",
            fontSize: 10,
            color: "rgba(255, 255, 255, 0.6)",
          }}
        >
          <div className="space-y-1">
            {Object.entries(schema.props).slice(0, 8).map(([name, prop]) => (
              <div key={name} className="flex justify-between">
                <span className="text-[rgba(255,255,255,0.8)]">{name}</span>
                <span className="text-[rgba(255,255,255,0.4)]">{prop.type}</span>
              </div>
            ))}
            {propCount > 8 && (
              <div className="text-[rgba(255,255,255,0.3)]">+{propCount - 8} more</div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        className="flex items-center justify-between px-3 py-1.5 text-[10px] border-t flex-shrink-0"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.2)",
          borderColor: "rgba(255, 255, 255, 0.08)",
          color: "rgba(255, 255, 255, 0.5)",
        }}
      >
        <span>
          {variantCount > 0 ? `${variantCount} variant${variantCount !== 1 ? "s" : ""}` : ""}{" "}
          {propCount} prop{propCount !== 1 ? "s" : ""}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDetailsOpen(!detailsOpen);
          }}
          className="text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.8)] transition-colors"
        >
          {detailsOpen ? "Hide" : "Props"}
        </button>
      </div>
    </div>
  );
}

export default ComponentNode;
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add app/components/component-canvas/ComponentNode.tsx
git commit -m "feat(component-canvas): redesign ComponentNode with live render + collapsible props"
```

---

### Task 14: Add onResize callback to ComponentCanvas for dynamic node sizing

**Files:**
- Modify: `app/components/component-canvas/ComponentCanvas.tsx`
- Modify: `app/stores/slices/componentCanvasSlice.ts`

**Step 1: Add resize action to slice**

```typescript
/** Update a node's dimensions after live render */
resizeComponentNode: (id: string, size: { width: number; height: number }) => void;
```

Implementation:

```typescript
resizeComponentNode: (id, size) =>
  set((state) => ({
    componentCanvasNodes: state.componentCanvasNodes.map((n) =>
      n.id === id
        ? { ...n, height: Math.max(size.height + 64, 160) } // 64px for header+footer
        : n
    ),
  })),
```

**Step 2: Pass onResize to ComponentNode in ComponentCanvas**

```typescript
const resizeComponentNode = useAppStore((s) => s.resizeComponentNode);

// In the render loop:
<ComponentNode
  node={node}
  isSelected={...}
  isFocused={...}
  onSelect={handleSelect}
  onDoubleClick={handleNodeDoubleClick}
  onResize={resizeComponentNode}
/>
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add app/components/component-canvas/ComponentCanvas.tsx app/stores/slices/componentCanvasSlice.ts
git commit -m "feat(component-canvas): dynamic node sizing from live render"
```

---

### Task 15: Update barrel exports

**Files:**
- Modify: `app/components/component-canvas/index.ts`

**Step 1: Add new exports**

```typescript
export { ComponentNode } from "./ComponentNode";
export { ComponentCanvas } from "./ComponentCanvas";
export { ComponentRenderer } from "./ComponentRenderer";
```

**Step 2: Commit**

```bash
git add app/components/component-canvas/index.ts
git commit -m "chore(component-canvas): update barrel exports"
```

---

### Task 16: Inject radiants theme CSS into the Tauri app

**Files:**
- Modify: `app/index.css`

**Step 1: Import radiants tokens so rendered components have correct styling**

Add at the top of `app/index.css` (after tailwind import):

```css
/* Import radiants theme tokens for live component rendering */
@import "../../packages/radiants/tokens.css";
@import "../../packages/radiants/base.css";
@import "../../packages/radiants/typography.css";
@import "../../packages/radiants/animations.css";
```

Note: The radiants dark.css is already likely imported or can be conditionally imported. The key tokens (surface, content, edge, action, status) need to be available for rendered components.

**Step 2: Scope radiants styles to the renderer sandbox**

To avoid radiants styles leaking into the Tauri app's own UI, wrap the imports in a layer:

```css
@layer radiants {
  @import "../../packages/radiants/tokens.css";
  @import "../../packages/radiants/base.css";
}
```

Or use the `.component-renderer-sandbox` class added in Task 12 as a scoping container.

**Step 3: Verify the app builds**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm tauri dev`
Expected: App starts, component cards render with radiants styling

**Step 4: Commit**

```bash
git add app/index.css
git commit -m "feat: import radiants theme CSS for live component rendering"
```

---

## Phase 4: Preview Zone

### Task 17: Create PreviewZone component

**Files:**
- Create: `app/components/component-canvas/PreviewZone.tsx`

**Step 1: Create the preview zone**

The preview zone renders page previews at different viewport sizes, positioned to the right of the components zone.

```typescript
import { useMemo } from "react";
import { useAppStore } from "../../stores/appStore";
import type { CanvasZone } from "../../types/componentCanvas";

interface ViewportPreset {
  label: string;
  width: number;
  height: number;
}

const VIEWPORT_PRESETS: ViewportPreset[] = [
  { label: "Mobile", width: 375, height: 667 },
  { label: "Tablet", width: 768, height: 1024 },
  { label: "Desktop", width: 1280, height: 800 },
  { label: "Wide", width: 1920, height: 1080 },
];

interface PreviewZoneProps {
  zone: CanvasZone;
}

/**
 * PreviewZone — Renders page preview cards at various viewport sizes.
 * Positioned to the right of the components zone.
 * Each card is a scaled-down iframe showing the target URL.
 */
export function PreviewZone({ zone }: PreviewZoneProps) {
  const targetUrl = useAppStore((s) => s.targetUrl);

  if (!targetUrl) {
    return (
      <div
        className="absolute rounded-xl flex items-center justify-center"
        style={{
          left: zone.x,
          top: zone.y,
          width: zone.width,
          height: zone.height,
          backgroundColor: zone.bgColor,
          border: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* Zone label */}
        <div
          className="absolute -top-6 left-4 text-xs font-medium px-2 py-0.5 rounded"
          style={{
            color: "rgba(255, 255, 255, 0.5)",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
          }}
        >
          Preview
        </div>
        <p className="text-xs text-[rgba(255,255,255,0.3)]">
          Set a target URL to see page previews
        </p>
      </div>
    );
  }

  // Layout preview cards horizontally with spacing
  const CARD_GAP = 32;
  const CARD_SCALE = 0.4; // Scale down iframes to fit
  const PADDING = 48;

  return (
    <div
      className="absolute rounded-xl"
      style={{
        left: zone.x,
        top: zone.y,
        width: zone.width,
        height: zone.height,
        backgroundColor: zone.bgColor,
        border: "1px solid rgba(255, 255, 255, 0.05)",
      }}
    >
      {/* Zone label */}
      <div
        className="absolute -top-6 left-4 text-xs font-medium px-2 py-0.5 rounded"
        style={{
          color: "rgba(255, 255, 255, 0.5)",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
        }}
      >
        Preview
      </div>

      {/* Preview cards */}
      <div className="flex gap-8 p-12">
        {VIEWPORT_PRESETS.map((preset, index) => {
          const scaledWidth = preset.width * CARD_SCALE;
          const scaledHeight = preset.height * CARD_SCALE;

          return (
            <div key={preset.label} className="flex flex-col items-center gap-2">
              {/* Label */}
              <span className="text-[10px] text-[rgba(255,255,255,0.4)]">
                {preset.label} ({preset.width}x{preset.height})
              </span>

              {/* Scaled iframe */}
              <div
                className="rounded-lg overflow-hidden border border-white/10"
                style={{
                  width: scaledWidth,
                  height: scaledHeight,
                  backgroundColor: "#fff",
                }}
              >
                <iframe
                  src={targetUrl}
                  title={`${preset.label} preview`}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  style={{
                    width: preset.width,
                    height: preset.height,
                    transform: `scale(${CARD_SCALE})`,
                    transformOrigin: "top left",
                    border: "none",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PreviewZone;
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add app/components/component-canvas/PreviewZone.tsx
git commit -m "feat(component-canvas): create PreviewZone with viewport preset cards"
```

---

### Task 18: Compute preview zone position and wire into canvas

**Files:**
- Modify: `app/stores/slices/componentCanvasSlice.ts`
- Modify: `app/components/component-canvas/ComponentCanvas.tsx`

**Step 1: Compute preview zone after components zone**

In the layout calculation (after `calculateZonedLayout`), compute the preview zone:

```typescript
const previewZone: CanvasZone = {
  id: "preview",
  label: "Preview",
  x: componentsZone.width + ZONE_CONFIG.previewZone.gapFromComponents,
  y: 0,
  width: 900, // Enough for 4 scaled viewport cards
  height: Math.max(componentsZone.height, 600),
  bgColor: "rgba(255, 255, 255, 0.02)",
};
```

Add to the set() call: `previewZone`.

**Step 2: Render PreviewZone in ComponentCanvas**

Import and add inside the transform container:

```typescript
import { PreviewZone } from "./PreviewZone";

// Inside the transformed div:
{previewZone && <PreviewZone zone={previewZone} />}
```

**Step 3: Update computeCanvasBounds to include preview zone**

```typescript
function computeCanvasBounds(
  nodes: ComponentCanvasNode[],
  previewZone: CanvasZone | null
): { width: number; height: number } {
  let maxX = 0;
  let maxY = 0;

  for (const node of nodes) {
    const right = node.x + node.width;
    const bottom = node.y + node.height;
    if (right > maxX) maxX = right;
    if (bottom > maxY) maxY = bottom;
  }

  if (previewZone) {
    const right = previewZone.x + previewZone.width;
    const bottom = previewZone.y + previewZone.height;
    if (right > maxX) maxX = right;
    if (bottom > maxY) maxY = bottom;
  }

  return {
    width: maxX + 100,
    height: maxY + 100,
  };
}
```

**Step 4: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add app/stores/slices/componentCanvasSlice.ts app/components/component-canvas/ComponentCanvas.tsx
git commit -m "feat(component-canvas): position and render preview zone alongside components"
```

---

### Task 19: Remove old PagePreviewCard (replaced by PreviewZone)

**Files:**
- Delete: `app/components/component-canvas/PagePreviewCard.tsx` (if it exists from Phase 2 plan)
- Modify: `app/components/component-canvas/ComponentCanvas.tsx` (remove PagePreviewCard import/usage)
- Modify: `app/stores/slices/componentCanvasSlice.ts` (remove pagePreviewConfig state if added)

**Step 1: Remove PagePreviewCard references**

If PagePreviewCard was created in the earlier plan, remove all references. The PreviewZone replaces it.

**Step 2: Clean up slice state**

Remove `pagePreviewConfig`, `togglePagePreview`, `setPagePreviewUrl` if they exist.

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add -u
git commit -m "refactor(component-canvas): remove PagePreviewCard, replaced by PreviewZone"
```

---

## Phase 5: Bridge Discovery Integration

### Task 20: Add bridge-discovered components to canvas

**Files:**
- Modify: `app/stores/slices/componentCanvasSlice.ts`

**Step 1: Add action to merge bridge components**

```typescript
/** Merge bridge-discovered components (from runtime fiber hook) */
mergeBridgeComponents: (entries: Array<{ name: string; source?: { relativePath: string; line: number } }>) => void;
```

Implementation:

```typescript
mergeBridgeComponents: (entries) => {
  const state = get();
  const existingNames = new Set(state.componentSchemas.map((s) => s.name));

  // Only add components we don't already have from schemas
  const newSchemas: ComponentSchema[] = entries
    .filter((e) => e.name && e.name !== "anonymous" && !existingNames.has(e.name))
    .filter((e, i, arr) => arr.findIndex((x) => x.name === e.name) === i) // dedupe
    .map((e) => ({
      name: e.name,
      description: `Discovered via bridge runtime (${e.source?.relativePath || "unknown source"})`,
      filePath: e.source?.relativePath || "",
      props: {},
      slots: {},
      examples: [],
      source: "bridge" as const,
      category: "app" as ComponentCategory,
    }));

  if (newSchemas.length === 0) return;

  const allSchemas = [...state.componentSchemas, ...newSchemas];
  const { nodes, categorySections, componentsZone } = calculateZonedLayout(
    allSchemas,
    state.dnaConfigs
  );

  set({
    componentSchemas: allSchemas,
    componentCanvasNodes: nodes,
    categorySections,
    componentsZone,
  });
},
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add app/stores/slices/componentCanvasSlice.ts
git commit -m "feat(component-canvas): merge bridge-discovered components into canvas"
```

---

### Task 21: Wire bridge component map updates to canvas

**Files:**
- Modify: `app/hooks/useBridgeConnection.ts` (or wherever bridge messages are handled)

**Step 1: Read the bridge message handler**

Find where `COMPONENT_MAP` messages are processed. This is in `useBridgeConnection.ts` or the bridge slice.

**Step 2: After updating bridgeComponentMap, call mergeBridgeComponents**

When the bridge sends a COMPONENT_MAP message with entries, extract unique component names and call:

```typescript
const mergeBridgeComponents = useAppStore.getState().mergeBridgeComponents;

// In the COMPONENT_MAP handler:
case "COMPONENT_MAP": {
  // existing: setBridgeComponentMap(data.entries)

  // NEW: merge into component canvas
  const uniqueComponents = data.entries
    .filter((e: { name: string }) => e.name && e.name !== "anonymous")
    .map((e: { name: string; source?: { relativePath: string; line: number } }) => ({
      name: e.name,
      source: e.source,
    }));
  mergeBridgeComponents(uniqueComponents);
  break;
}
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add app/hooks/useBridgeConnection.ts
git commit -m "feat(component-canvas): wire bridge discovery to canvas component list"
```

---

### Task 22: Update AppState types and verify full integration

**Files:**
- Modify: `app/stores/types.ts` (if needed)
- Modify: `app/components/component-canvas/index.ts`

**Step 1: Verify AppState picks up all new fields**

Since `AppState extends ComponentCanvasSlice`, new fields should be automatic. Run typecheck:

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 2: Update barrel exports**

```typescript
export { ComponentNode } from "./ComponentNode";
export { ComponentCanvas } from "./ComponentCanvas";
export { ComponentRenderer } from "./ComponentRenderer";
export { PreviewZone } from "./PreviewZone";
```

**Step 3: Full build test**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm tauri dev`
Expected: App starts, component canvas shows categorized live-rendered components with preview zone

**Step 4: Commit**

```bash
git add -u
git commit -m "feat(component-canvas): finalize zoned canvas redesign integration"
```

---

## Verification Checklist

### Component Discovery (1d)
- [ ] Rust scan_schemas accepts multiple paths
- [ ] Theme components have source="theme"
- [ ] Project src/ components have source="project"
- [ ] Bridge-discovered components appear with source="bridge"
- [ ] Deduplication: theme components take precedence by name

### Zoned Layout (1a)
- [ ] Components zone renders with labeled background
- [ ] Preview zone renders to the right with viewport preset cards
- [ ] Pan/zoom moves both zones together
- [ ] Zone labels visible above each region

### Category Grouping (1b)
- [ ] Components grouped by category with section headers
- [ ] Category filter pills hide/show groups
- [ ] Source filter pills hide/show by origin
- [ ] All 26 radiants schemas have category field

### Live Rendering (1c)
- [ ] Component cards show actual rendered components (not text)
- [ ] Cards auto-size based on rendered content
- [ ] Props drawer is collapsible (hidden by default, "Props" button shows it)
- [ ] DNA badge shows on components with token bindings
- [ ] Source badge shows "project" or "bridge" for non-theme components

### Preview Zone
- [ ] Four viewport preset cards (Mobile, Tablet, Desktop, Wide)
- [ ] Each card shows scaled iframe of target URL
- [ ] Empty state when no target URL configured

---

## Notes

- **Direct import vs iframe:** We use Vite `import.meta.glob` to dynamically import radiants components. This only works for components in the monorepo workspace. Bridge-discovered components (from external projects) cannot be directly imported — they show a "No render available" placeholder until iframe fallback is implemented in a future task.
- **CSS scoping:** Radiants theme tokens are imported into the Tauri app's CSS. The `.component-renderer-sandbox` class provides a scoping boundary. If token conflicts arise with the app's own UI, use `@layer` to isolate.
- **Comment fixes are deferred** to a separate plan as discussed.
- **Performance:** `import.meta.glob` with `eager: false` means components are lazy-loaded. Only visible components are rendered. If performance degrades with 50+ components, implement virtualization (only render nodes in viewport).
