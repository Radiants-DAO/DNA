# Playground Visual QA CLI Extension

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend the playground CLI with commands that let a Claude Code loop agent set component props, capture screenshots, and sweep variants — all from the CLI, without browser automation overhead. Enable automated visual QA loops for component refactoring (Button, Tabs, Form controls, etc.).

**Architecture:** The CLI sends HTTP requests to new API routes in the playground. A headless preview route renders one component with URL-param props. The already-open playground browser tab runs a CaptureService that opens hidden iframes to the preview URL, captures via `html-to-image` (already installed), and reports results back. Zero new npm dependencies. The system is **contract-aware**: when Phase 2 meta-first contract fields (`styleOwnership`, `pixelCorners`, `shadowSystem`, `a11y`) are present in the registry manifest, they enrich the test matrix. When absent, the CLI gracefully falls back to props-only matrices.

**Relationship to meta-first phases:**
- **Phase 2** (component contract fields) adds `styleOwnership.themeOwned`, `pixelCorners`, `shadowSystem`, `a11y` to the registry manifest. The CLI's `list-states` reads these to generate richer test matrices. No file conflicts — CLI creates new files, Phase 2 modifies existing ones.
- **Phase 3** (ESLint contract migration) creates `contract.mjs`. No interaction with the CLI extension.
- **Phase 4** (token-map removal) deletes `token-map.mjs`. No interaction with the CLI extension.
- The CLI extension and all three phases can be built in any order. The only shared data surface is `registry.manifest.json`, which the CLI reads (never writes).

**Tech Stack:** Node 22 ESM, Next.js 16 API routes + pages, React 19, `html-to-image` (existing dep), Vitest

---

## Architecture Diagram

```
CLI (Node.js)                       Next.js Server (3004)           Browser (already open)
─────────────                       ────────────────────           ──────────────────────

list-states button
  → reads manifest
  → reads contract fields
  → outputs test matrix

screenshot button                   POST /api/agent/capture         CaptureService component
  --mode solid --tone accent  ──►     creates request               listens for SSE event
  --color-mode dark                   emits SSE capture event  ──►  opens hidden <iframe>
  --state hover                       stores result                 to /preview/button?...
  polls for result            ◄──   GET  /api/agent/capture?id=     iframe renders, captures
  writes PNG to disk                  returns { dataUrl }     ◄──   POSTs dataUrl back
                                                                    iframe removed
sweep button
  → calls list-states
  → for each combo:
    calls screenshot
  → saves directory of PNGs
```

---

## Phase 0: Prerequisite Gate

Run:

```bash
cd /Users/rivermassey/Desktop/dev/DNA
pnpm --filter @rdna/playground registry:generate
node -e "const m = require('./tools/playground/generated/registry.manifest.json'); const c = m['@rdna/radiants'].components; console.log(c.length + ' components'); const b = c.find(x => x.name === 'Button'); console.log(Object.keys(b.props).join(', '));"
```

Expected:
- Registry generates cleanly
- Button component exists in manifest with props visible

---

## Task 1: Headless Preview Route

**Files:**
- Create: `tools/playground/app/playground/preview/[component]/page.tsx`

This is the cornerstone — a clean render of a single component with no canvas chrome.

**Step 1: Create the preview page**

```tsx
"use client";

import { useSearchParams } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { registryById } from "../../registry";

// Special params that control rendering context, not component props
const RESERVED_PARAMS = new Set([
  "colorMode", "state", "capture", "bg", "padding",
]);

function coerceValue(value: string, propDef?: { type: string }): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  if (propDef?.type === "number") return Number(value);
  return value;
}

export default function PreviewPage({
  params,
}: {
  params: Promise<{ component: string }>;
}) {
  const { component } = use(params);
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  const entry = registryById.get(component);
  const Component = entry?.Component ?? entry?.rawComponent;

  // Parse props from URL search params
  const props: Record<string, unknown> = {};
  if (entry) {
    for (const [key, value] of searchParams.entries()) {
      if (RESERVED_PARAMS.has(key)) continue;
      props[key] = coerceValue(value, entry.props?.[key]);
    }
  }

  // Color mode
  const colorMode = searchParams.get("colorMode") ?? "light";

  // Forced state (hover, pressed, focus, disabled)
  const forcedState = searchParams.get("state");

  // Capture mode
  const captureId = searchParams.get("capture");

  // Apply color mode to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", colorMode);
    document.documentElement.classList.toggle("dark", colorMode === "dark");
  }, [colorMode]);

  // Mark ready after first paint
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setReady(true));
    });
  }, []);

  // Auto-capture when capture=<requestId> and component is ready
  useEffect(() => {
    if (!captureId || !ready || !containerRef.current) return;

    (async () => {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(containerRef.current!, { pixelRatio: 2 });
      await fetch("/playground/api/agent/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", requestId: captureId, dataUrl }),
      });
    })();
  }, [captureId, ready]);

  if (!entry || !Component) {
    return <div data-qa-error="not-found">Component "{component}" not found</div>;
  }

  return (
    <div
      ref={containerRef}
      data-qa-ready={ready || undefined}
      data-qa-component={component}
      data-force-state={forcedState ?? undefined}
      className="inline-flex p-4"
    >
      <Component {...props} />
    </div>
  );
}
```

**Step 2: Verify manually**

Navigate to `http://localhost:3004/playground/preview/button?mode=solid&tone=accent&size=md&colorMode=dark` in the browser. The button should render in dark mode with no canvas chrome.

**Step 3: Commit**

```bash
git add tools/playground/app/playground/preview/
git commit -m "feat(playground): add headless preview route for QA screenshots"
```

---

## Task 2: Capture Store and API Route

**Files:**
- Create: `tools/playground/app/playground/api/agent/capture/route.ts`
- Create: `tools/playground/app/playground/api/agent/capture-store.ts`

**Step 1: Create the capture store**

`capture-store.ts` — in-memory request tracking (same pattern as `signal-store.ts` and `annotation-store.ts`):

```ts
interface CaptureRequest {
  id: string;
  status: "pending" | "complete";
  previewUrl: string;
  dataUrl?: string;
  createdAt: number;
}

class CaptureStore {
  private requests = new Map<string, CaptureRequest>();

  create(previewUrl: string): CaptureRequest { /* ... */ }
  complete(id: string, dataUrl: string): void { /* ... */ }
  get(id: string): CaptureRequest | undefined { /* ... */ }
  // Auto-cleanup: remove completed requests older than 60s
}

export const captureStore = new CaptureStore();
```

**Step 2: Create the API route**

`capture/route.ts`:
- `POST { action: "create", previewUrl }` → creates request, emits SSE capture event, returns `{ requestId }`
- `POST { action: "complete", requestId, dataUrl }` → marks request done (called by the iframe preview page)
- `GET ?id=<requestId>` → returns request status + dataUrl if complete

**Step 3: Extend signal store with capture event**

Modify `tools/playground/app/playground/api/agent/signal-store.ts`:
- Add `captureRequest(url: string, requestId: string)` method
- Add `capture-request` to `PlaygroundSignalEvent` union

Modify `tools/playground/app/playground/lib/playground-signal-event.ts`:
- Add parsing for the new event type

**Step 4: Commit**

```bash
git add tools/playground/app/playground/api/agent/capture/ tools/playground/app/playground/api/agent/signal-store.ts tools/playground/app/playground/lib/playground-signal-event.ts
git commit -m "feat(playground): add capture store and API route"
```

---

## Task 3: CaptureService Client Component

**Files:**
- Create: `tools/playground/app/playground/components/CaptureService.tsx`
- Modify: `tools/playground/app/playground/PlaygroundClient.tsx` (or equivalent root client component)

**Step 1: Create CaptureService**

A ~40-line component that:
- Listens to the SSE signal stream for `capture-request` events
- On receipt, creates a hidden `<iframe>` pointed at the preview URL (which includes `?capture=<requestId>`)
- Sets a 15s timeout to remove the iframe regardless
- Removes the iframe immediately when the capture route reports completion

**Step 2: Mount CaptureService in the playground client**

Add `<CaptureService />` to the root playground client component. It renders nothing visible.

**Step 3: Test manually**

```bash
curl -X POST http://localhost:3004/playground/api/agent/capture \
  -H 'Content-Type: application/json' \
  -d '{"action":"create","previewUrl":"/playground/preview/button?mode=solid&tone=accent&capture=test-1"}'
```

Then poll:
```bash
curl http://localhost:3004/playground/api/agent/capture?id=test-1
```

Should return `{ status: "complete", dataUrl: "data:image/png;base64,..." }`.

**Step 4: Commit**

```bash
git add tools/playground/app/playground/components/CaptureService.tsx tools/playground/app/playground/PlaygroundClient.tsx
git commit -m "feat(playground): add CaptureService for iframe-based screenshots"
```

---

## Task 4: Contract-Aware Prop Matrix Generator

**Files:**
- Create: `tools/playground/bin/lib/prop-matrix.mjs`
- Create: `tools/playground/bin/lib/__tests__/prop-matrix.test.mjs`

This is the contract-aware heart of the system. It reads both standard props AND Phase 2 contract fields from the manifest to generate test combinations.

**Step 1: Write the test**

```js
import { describe, it, expect } from "vitest";
import { buildTestMatrix } from "../prop-matrix.mjs";

describe("buildTestMatrix", () => {
  it("generates enum cross-product from props", () => {
    const matrix = buildTestMatrix({
      props: {
        mode: { type: "enum", values: ["solid", "flat"] },
        tone: { type: "enum", values: ["accent", "danger"] },
      },
    });
    expect(matrix.length).toBe(2 * 2 * 2 * 1); // modes * tones * colorModes * defaultState
  });

  it("includes styleOwnership.themeOwned as data-attribute variants", () => {
    const matrix = buildTestMatrix({
      props: {},
      styleOwnership: [
        { attribute: "data-variant", themeOwned: ["default", "raised", "inverted"] },
      ],
    });
    // 3 themeOwned * 2 colorModes
    expect(matrix.length).toBe(6);
    expect(matrix[0].dataAttributes).toEqual({ "data-variant": "default" });
  });

  it("flags pixelCorners components for border/shadow checks", () => {
    const matrix = buildTestMatrix({
      props: {},
      pixelCorners: true,
      shadowSystem: "pixel",
    });
    expect(matrix.every((m) => m.qaFlags.includes("pixel-corners"))).toBe(true);
    expect(matrix.every((m) => m.qaFlags.includes("pixel-shadow"))).toBe(true);
  });

  it("includes a11y.contrastRequirement in QA flags", () => {
    const matrix = buildTestMatrix({
      props: {},
      a11y: { contrastRequirement: "AA" },
    });
    expect(matrix.every((m) => m.qaFlags.includes("contrast-AA"))).toBe(true);
  });

  it("includes forced states from registry.states", () => {
    const matrix = buildTestMatrix({
      props: { mode: { type: "enum", values: ["solid"] } },
      states: ["hover", "pressed", "disabled"],
    });
    // 1 mode * 2 colorModes * 4 states (default + 3 forced)
    expect(matrix.length).toBe(8);
  });

  it("prunes matrix when it exceeds threshold", () => {
    const matrix = buildTestMatrix({
      props: {
        a: { type: "enum", values: ["1", "2", "3", "4"] },
        b: { type: "enum", values: ["x", "y", "z"] },
        c: { type: "enum", values: ["p", "q"] },
      },
    });
    // 4*3*2*2 = 48 > MAX_MATRIX threshold, should prune intelligently
    expect(matrix.length).toBeLessThanOrEqual(50);
  });

  it("gracefully handles missing contract fields", () => {
    // Props-only component (no Phase 2 metadata yet)
    const matrix = buildTestMatrix({
      props: { variant: { type: "enum", values: ["default", "compact"] } },
    });
    expect(matrix.length).toBe(4); // 2 variants * 2 colorModes
    expect(matrix[0].qaFlags).toEqual([]); // No contract-derived flags
  });
});
```

**Step 2: Implement**

`prop-matrix.mjs`:

```js
/**
 * Build a test matrix for visual QA from manifest props + contract fields.
 *
 * Reads:
 * - props (enum values, boolean flags)        → standard prop combos
 * - styleOwnership.themeOwned                  → data-attribute variant combos (Phase 2)
 * - pixelCorners, shadowSystem                 → QA flags (Phase 2)
 * - a11y.contrastRequirement                   → QA flags (Phase 2)
 * - registry.states                            → forced state combos
 *
 * Output: Array<{ label, props, dataAttributes, colorMode, state, qaFlags }>
 */

const MAX_MATRIX = 50;
const COLOR_MODES = ["light", "dark"];
const DEFAULT_STATES = ["default"];

export function buildTestMatrix(component) {
  const enumProps = extractEnumProps(component.props ?? {});
  const booleanProps = extractBooleanProps(component.props ?? {});
  const forcedStates = [...DEFAULT_STATES, ...(component.states ?? [])];
  const themeVariants = extractThemeVariants(component.styleOwnership);
  const qaFlags = deriveQaFlags(component);

  // Build prop combos (cartesian product of enums)
  let propCombos = cartesian(enumProps);

  // Add theme variant dimension if present
  if (themeVariants.length > 0) {
    propCombos = crossWith(propCombos, themeVariants, "dataAttributes");
  }

  // Cross with color modes and forced states
  let matrix = [];
  for (const combo of propCombos) {
    for (const colorMode of COLOR_MODES) {
      for (const state of forcedStates) {
        matrix.push({
          label: buildLabel(combo, colorMode, state),
          props: combo.props ?? combo,
          dataAttributes: combo.dataAttributes ?? {},
          colorMode,
          state,
          qaFlags,
        });
      }
    }
  }

  // Prune if too large
  if (matrix.length > MAX_MATRIX) {
    matrix = pruneMatrix(matrix, enumProps, MAX_MATRIX);
  }

  return matrix;
}
```

**Step 3: Run tests**

```bash
pnpm --filter @rdna/playground exec vitest run bin/lib/__tests__/prop-matrix.test.mjs
```

**Step 4: Commit**

```bash
git add tools/playground/bin/lib/prop-matrix.mjs tools/playground/bin/lib/__tests__/prop-matrix.test.mjs
git commit -m "feat(playground): contract-aware prop matrix generator"
```

---

## Task 5: CLI Commands — `list-states` and `set-props`

**Files:**
- Create: `tools/playground/bin/commands/list-states.mjs`
- Create: `tools/playground/bin/commands/set-props.mjs`
- Modify: `tools/playground/bin/rdna-playground.mjs`

**Step 1: `list-states`**

```
rdna-playground list-states <component> [--json]
```

- Uses `lookupComponent()` from `bin/lib/prompt.mjs` to resolve the component
- Reads the full manifest entry (props + contract fields)
- Calls `buildTestMatrix()` from `prop-matrix.mjs`
- Outputs JSON array to stdout (for agent consumption) or human-readable table
- Annotates each entry with `qaFlags` so the loop agent knows what to check

**Step 2: `set-props`**

```
rdna-playground set-props <component> key=value [key=value...] [--color-mode light|dark] [--state hover]
```

- Parses key=value pairs
- Validates against manifest prop defs (warns on unknown props)
- Builds and prints the headless preview URL
- No server call needed — the URL is the interface

**Step 3: Register in CLI entry point**

Add to `COMMANDS` in `rdna-playground.mjs`:
```js
"list-states": () => import("./commands/list-states.mjs").then((m) => m.run(args)),
"set-props": () => import("./commands/set-props.mjs").then((m) => m.run(args)),
```

**Step 4: Test manually**

```bash
node tools/playground/bin/rdna-playground.mjs list-states button --json
node tools/playground/bin/rdna-playground.mjs set-props button mode=solid tone=accent --color-mode dark
```

**Step 5: Commit**

```bash
git add tools/playground/bin/commands/list-states.mjs tools/playground/bin/commands/set-props.mjs tools/playground/bin/rdna-playground.mjs
git commit -m "feat(playground): add list-states and set-props CLI commands"
```

---

## Task 6: CLI Commands — `screenshot` and `sweep`

**Files:**
- Create: `tools/playground/bin/commands/screenshot.mjs`
- Create: `tools/playground/bin/commands/sweep.mjs`
- Modify: `tools/playground/bin/rdna-playground.mjs`

**Step 1: `screenshot`**

```
rdna-playground screenshot <component> [--out path] [--props key=val...] [--color-mode light|dark] [--state hover]
```

Implementation:
1. Build the headless preview URL with props as query params
2. POST to `/playground/api/agent/capture` with `{ action: "create", previewUrl }`
3. Poll `GET /playground/api/agent/capture?id=<requestId>` at 200ms intervals, 15s timeout
4. Decode base64 data URL → write PNG to `--out` path (default: `./screenshots/<component>-<label>.png`)
5. Print output path to stdout

**Step 2: `sweep`**

```
rdna-playground sweep <component> [--out-dir path] [--props key=val...] [--max N]
```

Implementation:
1. Call `buildTestMatrix()` for the component
2. If `--props` specified, pin those values and vary the rest
3. For each matrix entry, sequentially:
   a. Call screenshot logic
   b. Save with descriptive filename: `<component>/<label>.png`
   c. Print progress: `[3/24] button-solid-accent-md-dark-hover.png`
4. If `--max N` specified, cap at N screenshots
5. Print summary: `24 screenshots saved to ./screenshots/button/`
6. Print `qaFlags` summary: which flags were active for the sweep

**Step 3: Register in CLI entry point**

```js
"screenshot": () => import("./commands/screenshot.mjs").then((m) => m.run(args)),
"sweep": () => import("./commands/sweep.mjs").then((m) => m.run(args)),
```

**Step 4: Test end-to-end**

```bash
# Single screenshot
node tools/playground/bin/rdna-playground.mjs screenshot button --props mode=solid tone=accent --color-mode dark --out /tmp/button-test.png

# Full sweep
node tools/playground/bin/rdna-playground.mjs sweep button --out-dir /tmp/button-sweep --max 10
```

**Step 5: Commit**

```bash
git add tools/playground/bin/commands/screenshot.mjs tools/playground/bin/commands/sweep.mjs tools/playground/bin/rdna-playground.mjs
git commit -m "feat(playground): add screenshot and sweep CLI commands"
```

---

## Task 7: Visual QA Loop Integration Test

**Files:**
- Create: `tools/playground/bin/__tests__/qa-loop-integration.test.mjs`

Write an integration test that exercises the full loop:

```js
import { describe, it, expect } from "vitest";
import { buildTestMatrix } from "../lib/prop-matrix.mjs";

describe("visual QA loop integration", () => {
  it("generates a non-empty matrix for Button with contract fields", () => {
    // Read actual manifest
    const manifest = JSON.parse(
      readFileSync("tools/playground/generated/registry.manifest.json", "utf8")
    );
    const button = manifest["@rdna/radiants"].components.find(
      (c) => c.name === "Button"
    );
    const matrix = buildTestMatrix(button);

    expect(matrix.length).toBeGreaterThan(0);
    expect(matrix[0]).toHaveProperty("label");
    expect(matrix[0]).toHaveProperty("props");
    expect(matrix[0]).toHaveProperty("colorMode");
    expect(matrix[0]).toHaveProperty("state");
    expect(matrix[0]).toHaveProperty("qaFlags");
  });

  it("enriches matrix when Phase 2 contract fields are present", () => {
    // Simulate a component with contract fields
    const matrix = buildTestMatrix({
      props: { mode: { type: "enum", values: ["solid", "flat"] } },
      pixelCorners: true,
      shadowSystem: "pixel",
      styleOwnership: [
        { attribute: "data-variant", themeOwned: ["default", "raised"] },
      ],
      a11y: { contrastRequirement: "AA" },
      states: ["hover", "pressed"],
    });

    expect(matrix.some((m) => m.qaFlags.includes("pixel-corners"))).toBe(true);
    expect(matrix.some((m) => m.qaFlags.includes("contrast-AA"))).toBe(true);
    expect(matrix.some((m) => m.dataAttributes["data-variant"] === "raised")).toBe(true);
  });
});
```

```bash
pnpm --filter @rdna/playground exec vitest run bin/__tests__/qa-loop-integration.test.mjs
```

**Commit:**

```bash
git add tools/playground/bin/__tests__/qa-loop-integration.test.mjs
git commit -m "test(playground): visual QA loop integration tests"
```

---

## Summary

| Task | New Files | Modified | LOC Est |
|------|-----------|----------|---------|
| 1. Headless preview route | 1 | 0 | ~90 |
| 2. Capture store + API | 2 | 2 | ~120 |
| 3. CaptureService component | 1 | 1 | ~50 |
| 4. Prop matrix generator | 2 | 0 | ~180 |
| 5. list-states + set-props | 2 | 1 | ~120 |
| 6. screenshot + sweep | 2 | 1 | ~170 |
| 7. Integration test | 1 | 0 | ~50 |
| **Total** | **11** | **5** | **~780** |

**Zero new npm dependencies.** Uses existing: `html-to-image`, Next.js API routes, SSE signal store.

**Contract-aware from day 1:**
- `list-states` reads `styleOwnership.themeOwned` → data-attribute test combos
- `list-states` reads `pixelCorners`, `shadowSystem` → QA flags
- `list-states` reads `a11y.contrastRequirement` → contrast QA flag
- All gracefully degrade when Phase 2 fields aren't yet populated

**Loop agent usage pattern:**

```bash
# Get all states to test
MATRIX=$(rdna-playground list-states button --json)

# For each entry in MATRIX:
rdna-playground screenshot button \
  --props mode=solid tone=accent \
  --color-mode dark --state hover \
  --out screenshots/button/solid-accent-dark-hover.png

# Or sweep everything at once:
rdna-playground sweep button --out-dir screenshots/button/
```

The loop agent reads each screenshot, critiques against the design system checklist (using `qaFlags` to know what to check), fixes code, re-screenshots, and commits when PASS.
