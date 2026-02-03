# Flow 2 Phase 3a Core Infrastructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the content-script core infrastructure: selection engine, overlay layer, measurement guides, and a feature registry with hotkeys.

**Architecture:** All code is clean-slate TypeScript in the WXT content script. The selection engine uses deepElementFromPoint for shadow DOM penetration. Overlays render in a closed Shadow DOM root, positioned via CSS custom properties to avoid layout thrash. Features are activated through a registry and hotkey manager.

**Tech Stack:** TypeScript, WXT, Vitest, hotkeys-js, Shadow DOM

---

## Phase 0 - Research Summary

**Brainstorm used:** `docs/brainstorms/2026-02-02-flow-2-phase-3-brainstorm.md`
- Branch A only (clean-slate)
- Selection and overlays are inspired by VisBug, no fork

**Repo patterns and sources:**
- VisBug selection patterns: `tools/flow/reference/ProjectVisBug-main/app/features/selectable.js`
- Overlay positioning: `tools/flow/reference/ProjectVisBug-main/app/components/selection/overlay.element.js`

**Project guidance:**
- `CLAUDE.md` (root): Tailwind v4, semantic tokens

**External research:** Not needed (strong local context)

---

## Dependencies

- Phase 1 (extension shell) completed
- Phase 2 (inspection pipeline) completed

---

## Task 1: Shared selection types and reducer

**Files:**
- Create: `tools/flow/packages/shared/src/types/selection.ts`
- Modify: `tools/flow/packages/shared/src/index.ts`
- Create: `tools/flow/packages/extension/src/content/selection/selectionState.ts`
- Test: `tools/flow/packages/extension/src/content/__tests__/selectionState.test.ts`

**Step 1: Write the failing test**

```ts
// tools/flow/packages/extension/src/content/__tests__/selectionState.test.ts
import { describe, it, expect } from "vitest";
import { selectionReducer, initialSelection } from "../selection/selectionState";

describe("selectionReducer", () => {
  it("adds and removes elements by id", () => {
    const s1 = selectionReducer(initialSelection, { type: "select", id: "a" });
    expect(s1.ids).toEqual(["a"]);

    const s2 = selectionReducer(s1, { type: "unselect", id: "a" });
    expect(s2.ids).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -C tools/flow --filter @flow/extension test -- selectionState.test.ts`  
Expected: FAIL (module not found)

**Step 3: Write minimal implementation**

```ts
// tools/flow/packages/shared/src/types/selection.ts
export type SelectionId = string;

export interface SelectionState {
  ids: SelectionId[];
  primaryId: SelectionId | null;
}

export type SelectionAction =
  | { type: "select"; id: SelectionId }
  | { type: "unselect"; id: SelectionId }
  | { type: "clear" };
```

```ts
// tools/flow/packages/extension/src/content/selection/selectionState.ts
import type { SelectionAction, SelectionState } from "@flow/shared/types/selection";

export const initialSelection: SelectionState = { ids: [], primaryId: null };

export function selectionReducer(
  state: SelectionState,
  action: SelectionAction
): SelectionState {
  switch (action.type) {
    case "select":
      return {
        ids: state.ids.includes(action.id) ? state.ids : [...state.ids, action.id],
        primaryId: action.id,
      };
    case "unselect":
      return {
        ids: state.ids.filter((id) => id !== action.id),
        primaryId: state.primaryId === action.id ? null : state.primaryId,
      };
    case "clear":
      return initialSelection;
  }
}
```

```ts
// tools/flow/packages/shared/src/index.ts
export * from "./types/selection";
```

**Step 4: Run test to verify it passes**

Run: `pnpm -C tools/flow --filter @flow/extension test -- selectionState.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add tools/flow/packages/shared/src/types/selection.ts \
  tools/flow/packages/shared/src/index.ts \
  tools/flow/packages/extension/src/content/selection/selectionState.ts \
  tools/flow/packages/extension/src/content/__tests__/selectionState.test.ts

git commit -m "feat(flow2): add shared selection state types"
```

---

## Task 2: deepElementFromPoint and selection engine

**Files:**
- Create: `tools/flow/packages/extension/src/content/selection/deepElementFromPoint.ts`
- Create: `tools/flow/packages/extension/src/content/selection/selectionEngine.ts`
- Test: `tools/flow/packages/extension/src/content/__tests__/selectionEngine.test.ts`

**Step 1: Write the failing test**

```ts
// tools/flow/packages/extension/src/content/__tests__/selectionEngine.test.ts
import { describe, it, expect } from "vitest";
import { deepElementFromPoint } from "../selection/deepElementFromPoint";

describe("deepElementFromPoint", () => {
  it("returns the top-level element when no shadow root", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const found = deepElementFromPoint(0, 0, () => el);
    expect(found).toBe(el);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -C tools/flow --filter @flow/extension test -- selectionEngine.test.ts`  
Expected: FAIL (module not found)

**Step 3: Write minimal implementation**

```ts
// tools/flow/packages/extension/src/content/selection/deepElementFromPoint.ts
export function deepElementFromPoint(
  x: number,
  y: number,
  elementFromPoint: (x: number, y: number) => Element | null = document.elementFromPoint
): Element | null {
  const el = elementFromPoint(x, y);
  const crawl = (node: Element | null): Element | null => {
    if (!node) return null;
    const shadow = (node as HTMLElement).shadowRoot;
    if (!shadow) return node;
    const candidate = shadow.elementFromPoint(x, y);
    if (!candidate || candidate === node) return node;
    return crawl(candidate as Element);
  };
  return crawl(el);
}
```

```ts
// tools/flow/packages/extension/src/content/selection/selectionEngine.ts
import { selectionReducer, initialSelection } from "./selectionState";
import { deepElementFromPoint } from "./deepElementFromPoint";

export function createSelectionEngine() {
  let state = initialSelection;

  function select(el: Element, id: string) {
    state = selectionReducer(state, { type: "select", id });
    el.setAttribute("data-flow-selected", "true");
  }

  function unselect(el: Element, id: string) {
    state = selectionReducer(state, { type: "unselect", id });
    el.removeAttribute("data-flow-selected");
  }

  function clear() {
    state.ids.forEach((id) => {
      const node = document.querySelector(`[data-flow-id="${id}"]`);
      node?.removeAttribute("data-flow-selected");
    });
    state = selectionReducer(state, { type: "clear" });
  }

  return { select, unselect, clear, getState: () => state, deepElementFromPoint };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm -C tools/flow --filter @flow/extension test -- selectionEngine.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add tools/flow/packages/extension/src/content/selection/deepElementFromPoint.ts \
  tools/flow/packages/extension/src/content/selection/selectionEngine.ts \
  tools/flow/packages/extension/src/content/__tests__/selectionEngine.test.ts

git commit -m "feat(flow2): add deepElementFromPoint selection engine"
```

---

## Task 3: Overlay root + rect helpers

**Files:**
- Create: `tools/flow/packages/extension/src/content/overlays/overlayRoot.ts`
- Create: `tools/flow/packages/extension/src/content/overlays/overlayRect.ts`
- Create: `tools/flow/packages/extension/src/content/overlays/overlayStyles.css`
- Test: `tools/flow/packages/extension/src/content/__tests__/overlayRect.test.ts`

**Step 1: Write the failing test**

```ts
// tools/flow/packages/extension/src/content/__tests__/overlayRect.test.ts
import { describe, it, expect } from "vitest";
import { toOverlayVars } from "../overlays/overlayRect";

describe("toOverlayVars", () => {
  it("maps bounding rect to CSS vars", () => {
    const vars = toOverlayVars({ top: 10, left: 20, width: 100, height: 50 });
    expect(vars["--top"]).toBe("10px");
    expect(vars["--left"]).toBe("20px");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -C tools/flow --filter @flow/extension test -- overlayRect.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// tools/flow/packages/extension/src/content/overlays/overlayRect.ts
export function toOverlayVars(rect: {
  top: number;
  left: number;
  width: number;
  height: number;
}) {
  return {
    "--top": `${rect.top + window.scrollY}px`,
    "--left": `${rect.left}px`,
    "--width": `${rect.width}px`,
    "--height": `${rect.height}px`,
  } as const;
}
```

```ts
// tools/flow/packages/extension/src/content/overlays/overlayRoot.ts
import styles from "./overlayStyles.css?inline";

export function ensureOverlayRoot() {
  let root = document.querySelector("flow-overlay-root") as HTMLElement | null;
  if (!root) {
    root = document.createElement("flow-overlay-root");
    const shadow = root.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = styles;
    shadow.appendChild(style);
    document.documentElement.appendChild(root);
  }
  return root;
}
```

```css
/* tools/flow/packages/extension/src/content/overlays/overlayStyles.css */
.flow-overlay {
  position: absolute;
  top: var(--top);
  left: var(--left);
  width: var(--width);
  height: var(--height);
  pointer-events: none;
  z-index: 2147483646;
}

.flow-overlay-rect {
  width: 100%;
  height: 100%;
  outline: 1px solid rgba(255, 0, 153, 0.8);
  box-sizing: border-box;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm -C tools/flow --filter @flow/extension test -- overlayRect.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add tools/flow/packages/extension/src/content/overlays/overlayRoot.ts \
  tools/flow/packages/extension/src/content/overlays/overlayRect.ts \
  tools/flow/packages/extension/src/content/overlays/overlayStyles.css \
  tools/flow/packages/extension/src/content/__tests__/overlayRect.test.ts

git commit -m "feat(flow2): add overlay root and rect helpers"
```

---

## Task 4: Measurements calculation and overlay

**Files:**
- Create: `tools/flow/packages/extension/src/content/measurements/measurements.ts`
- Create: `tools/flow/packages/extension/src/content/measurements/distanceOverlay.ts`
- Test: `tools/flow/packages/extension/src/content/__tests__/measurements.test.ts`

**Step 1: Write the failing test**

```ts
// tools/flow/packages/extension/src/content/__tests__/measurements.test.ts
import { describe, it, expect } from "vitest";
import { computeMeasurements } from "../measurements/measurements";

describe("computeMeasurements", () => {
  it("returns right distance when target is to the right", () => {
    const m = computeMeasurements(
      { top: 0, left: 0, width: 10, height: 10, right: 10, bottom: 10 } as DOMRect,
      { top: 0, left: 20, width: 10, height: 10, right: 30, bottom: 10 } as DOMRect
    );
    expect(m.find((x) => x.q === "right")?.d).toBe(10);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -C tools/flow --filter @flow/extension test -- measurements.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// tools/flow/packages/extension/src/content/measurements/measurements.ts
export type Measurement = {
  x: number;
  y: number;
  d: number;
  q: "left" | "right" | "top" | "bottom";
  v?: boolean;
};

export function computeMeasurements(a: DOMRect, b: DOMRect): Measurement[] {
  const measurements: Measurement[] = [];
  const midOffset = 2.5;

  if (a.right < b.left) {
    measurements.push({
      x: a.right,
      y: a.top + a.height / 2 - midOffset,
      d: b.left - a.right,
      q: "right",
    });
  }
  if (a.left > b.right) {
    measurements.push({
      x: b.right,
      y: a.top + a.height / 2 - midOffset,
      d: a.left - b.right,
      q: "left",
    });
  }
  if (a.top > b.bottom) {
    measurements.push({
      x: a.left + a.width / 2 - midOffset,
      y: b.bottom,
      d: a.top - b.bottom,
      q: "top",
      v: true,
    });
  }
  if (a.bottom < b.top) {
    measurements.push({
      x: a.left + a.width / 2 - midOffset,
      y: a.bottom,
      d: b.top - a.bottom,
      q: "bottom",
      v: true,
    });
  }

  return measurements.map((m) => ({ ...m, d: Math.round(m.d * 100) / 100 }));
}
```

```ts
// tools/flow/packages/extension/src/content/measurements/distanceOverlay.ts
import type { Measurement } from "./measurements";

export function createDistanceOverlay(measurement: Measurement) {
  const el = document.createElement("div");
  el.className = "flow-distance-overlay";
  el.style.position = "absolute";
  el.style.left = `${measurement.x}px`;
  el.style.top = `${measurement.y}px`;
  el.style.pointerEvents = "none";
  el.textContent = `${measurement.d}px`;
  return el;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm -C tools/flow --filter @flow/extension test -- measurements.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add tools/flow/packages/extension/src/content/measurements/measurements.ts \
  tools/flow/packages/extension/src/content/measurements/distanceOverlay.ts \
  tools/flow/packages/extension/src/content/__tests__/measurements.test.ts

git commit -m "feat(flow2): add measurements calculations and overlay"
```

---

## Task 5: Guides and gridlines overlay

**Files:**
- Create: `tools/flow/packages/extension/src/content/guides/guides.ts`
- Create: `tools/flow/packages/extension/src/content/guides/gridlinesOverlay.ts`
- Test: `tools/flow/packages/extension/src/content/__tests__/guides.test.ts`

**Step 1: Write the failing test**

```ts
// tools/flow/packages/extension/src/content/__tests__/guides.test.ts
import { describe, it, expect } from "vitest";
import { toggleGuideVisibility } from "../guides/guides";

describe("guides", () => {
  it("hides guides when requested", () => {
    const state = { visible: true };
    toggleGuideVisibility(state, false);
    expect(state.visible).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -C tools/flow --filter @flow/extension test -- guides.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// tools/flow/packages/extension/src/content/guides/guides.ts
export function toggleGuideVisibility(state: { visible: boolean }, visible: boolean) {
  state.visible = visible;
}
```

```ts
// tools/flow/packages/extension/src/content/guides/gridlinesOverlay.ts
export function createGridlinesOverlay() {
  const el = document.createElement("div");
  el.className = "flow-gridlines-overlay";
  el.style.position = "absolute";
  el.style.pointerEvents = "none";
  el.style.background = "rgba(255, 0, 153, 0.5)";
  return el;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm -C tools/flow --filter @flow/extension test -- guides.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add tools/flow/packages/extension/src/content/guides/guides.ts \
  tools/flow/packages/extension/src/content/guides/gridlinesOverlay.ts \
  tools/flow/packages/extension/src/content/__tests__/guides.test.ts

git commit -m "feat(flow2): add gridlines guide system"
```

---

## Task 6: Feature registry and hotkeys

**Files:**
- Create: `tools/flow/packages/extension/src/content/features/registry.ts`
- Create: `tools/flow/packages/extension/src/content/features/hotkeys.ts`
- Modify: `tools/flow/packages/extension/package.json`
- Test: `tools/flow/packages/extension/src/content/__tests__/registry.test.ts`

**Step 1: Write the failing test**

```ts
// tools/flow/packages/extension/src/content/__tests__/registry.test.ts
import { describe, it, expect } from "vitest";
import { createRegistry } from "../features/registry";

describe("feature registry", () => {
  it("activates a feature and calls deactivate on switch", () => {
    const registry = createRegistry();
    let deactivated = false;
    registry.register("a", { activate: () => () => (deactivated = true) });
    registry.register("b", { activate: () => () => {} });
    registry.activate("a");
    registry.activate("b");
    expect(deactivated).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -C tools/flow --filter @flow/extension test -- registry.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// tools/flow/packages/extension/src/content/features/registry.ts
export type Feature = { activate: () => () => void };

export function createRegistry() {
  const features = new Map<string, Feature>();
  let cleanup: (() => void) | null = null;

  return {
    register(id: string, feature: Feature) {
      features.set(id, feature);
    },
    activate(id: string) {
      cleanup?.();
      cleanup = features.get(id)?.activate() ?? null;
    },
  };
}
```

```ts
// tools/flow/packages/extension/src/content/features/hotkeys.ts
import hotkeys from "hotkeys-js";

export function registerHotkey(keys: string, handler: (event: KeyboardEvent) => void) {
  hotkeys(keys, (event) => {
    handler(event as KeyboardEvent);
  });
  return () => hotkeys.unbind(keys);
}
```

```json
// tools/flow/packages/extension/package.json
{
  "dependencies": {
    "hotkeys-js": "^3.13.7"
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm -C tools/flow --filter @flow/extension test -- registry.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add tools/flow/packages/extension/src/content/features/registry.ts \
  tools/flow/packages/extension/src/content/features/hotkeys.ts \
  tools/flow/packages/extension/src/content/__tests__/registry.test.ts \
  tools/flow/packages/extension/package.json

git commit -m "feat(flow2): add feature registry and hotkey helper"
```

---

## Task 7: Wire core infra into content entrypoint

**Files:**
- Create: `tools/flow/packages/extension/src/entrypoints/content.ts`
- Test: `tools/flow/packages/extension/src/content/__tests__/contentIntegration.test.ts`

**Step 1: Write the failing test**

```ts
// tools/flow/packages/extension/src/content/__tests__/contentIntegration.test.ts
import { describe, it, expect } from "vitest";
import { createSelectionEngine } from "../selection/selectionEngine";

describe("content integration", () => {
  it("exposes selection state getter", () => {
    const engine = createSelectionEngine();
    expect(engine.getState().ids).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -C tools/flow --filter @flow/extension test -- contentIntegration.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// tools/flow/packages/extension/src/entrypoints/content.ts
import { ensureOverlayRoot } from "../content/overlays/overlayRoot";
import { createSelectionEngine } from "../content/selection/selectionEngine";
import { createRegistry } from "../content/features/registry";

const overlayRoot = ensureOverlayRoot();
const selection = createSelectionEngine();
const registry = createRegistry();

void overlayRoot;
void selection;
void registry;

// TODO: register features after Phase 3b
```

**Step 4: Run test to verify it passes**

Run: `pnpm -C tools/flow --filter @flow/extension test -- contentIntegration.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add tools/flow/packages/extension/src/entrypoints/content.ts \
  tools/flow/packages/extension/src/content/__tests__/contentIntegration.test.ts

git commit -m "feat(flow2): initialize core content infrastructure"
```

---

## Verification

- Run: `pnpm -C tools/flow --filter @flow/extension test`  
  Expected: PASS

