# Flow 2 Phase 3b Editing Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reimplement VisBug editing features in TypeScript with CSS-only before/after diffs and register them in the content script.

**Architecture:** Each feature is a small content-side module with activate/deactivate lifecycle. Mutations are recorded as CSS-only diffs (property, oldValue, newValue) using shared MutationDiff types. Feature activation is routed through the registry from Phase 3a. Panel UI for contextual features is wired in Phase 3c.

**Tech Stack:** TypeScript, WXT content script, Vitest, query-selector-shadow-dom, hotkeys-js, @ctrl/tinycolor, colorjs.io

---

## Phase 0 - Research Summary

**Brainstorm used:** `docs/brainstorms/2026-02-02-flow-2-phase-3-brainstorm.md`
- CSS-only diffs
- Move is separate from Position
- Contextual panels for Search, A11y, Image Swap, Screenshot

**Repo patterns and sources:**
- VisBug features: `tools/flow/reference/ProjectVisBug-main/app/features/*`
- Search and selector utilities: `tools/flow/reference/ProjectVisBug-main/app/features/search.js`
- Accessibility calculations: `tools/flow/reference/ProjectVisBug-main/app/features/accessibility.js`
- Image swap workflow: `tools/flow/reference/ProjectVisBug-main/app/features/imageswap.js`

**External research:** Not needed (strong local context)

---

## Dependencies

- Phase 3a completed (selection, overlays, registry)
- Phase 2 completed (inspection data available for element identity)

---

## Task 1: Shared mutation types and recorder

**Files:**
- Create: `tools/flow/packages/shared/src/types/mutation.ts`
- Modify: `tools/flow/packages/shared/src/index.ts`
- Create: `tools/flow/packages/extension/src/content/mutations/mutationRecorder.ts`
- Test: `tools/flow/packages/extension/src/content/__tests__/mutationRecorder.test.ts`

**Step 1: Write the failing test**

```ts
// tools/flow/packages/extension/src/content/__tests__/mutationRecorder.test.ts
import { describe, it, expect } from "vitest";
import { recordStyleMutation } from "../mutations/mutationRecorder";

describe("recordStyleMutation", () => {
  it("creates a MutationDiff for a CSS property change", () => {
    const diff = recordStyleMutation("ref-1", { color: "red" }, { color: "blue" });
    expect(diff.changes[0].property).toBe("color");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -C tools/flow --filter @flow/extension test -- mutationRecorder.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// tools/flow/packages/shared/src/types/mutation.ts
export interface ElementIdentity {
  selector: string;
  componentName?: string;
  sourceFile?: string;
  sourceLine?: number;
  sourceColumn?: number;
}

export interface PropertyMutation {
  property: string;
  oldValue: string;
  newValue: string;
}

export interface MutationDiff {
  id: string;
  element: ElementIdentity;
  type: "style" | "text" | "spacing";
  changes: PropertyMutation[];
  timestamp: string;
}
```

```ts
// tools/flow/packages/shared/src/index.ts
export * from "./types/mutation";
```

```ts
// tools/flow/packages/extension/src/content/mutations/mutationRecorder.ts
import type { MutationDiff } from "@flow/shared/types/mutation";

export function recordStyleMutation(
  elementRef: string,
  before: Record<string, string>,
  after: Record<string, string>
): MutationDiff {
  const changes = Object.keys(after).map((property) => ({
    property,
    oldValue: before[property] ?? "",
    newValue: after[property] ?? "",
  }));

  return {
    id: crypto.randomUUID(),
    element: { selector: `[data-flow-ref="${elementRef}"]` },
    type: "style",
    changes,
    timestamp: new Date().toISOString(),
  };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm -C tools/flow --filter @flow/extension test -- mutationRecorder.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add tools/flow/packages/shared/src/types/mutation.ts \
  tools/flow/packages/shared/src/index.ts \
  tools/flow/packages/extension/src/content/mutations/mutationRecorder.ts \
  tools/flow/packages/extension/src/content/__tests__/mutationRecorder.test.ts

git commit -m "feat(flow2): add mutation diff types and recorder"
```

---

## Task 2: Spacing feature (margin and padding)

**Files:**
- Create: `tools/flow/packages/extension/src/content/features/spacing.ts`
- Test: `tools/flow/packages/extension/src/content/__tests__/spacingFeature.test.ts`

**Step 1: Write the failing test**

```ts
// tools/flow/packages/extension/src/content/__tests__/spacingFeature.test.ts
import { describe, it, expect } from "vitest";
import { applySpacing } from "../features/spacing";

describe("spacing feature", () => {
  it("applies margin and returns diff", () => {
    const el = document.createElement("div");
    const diff = applySpacing(el, { marginTop: "12px" });
    expect(diff.changes[0].property).toBe("margin-top");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -C tools/flow --filter @flow/extension test -- spacingFeature.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// tools/flow/packages/extension/src/content/features/spacing.ts
import { recordStyleMutation } from "../mutations/mutationRecorder";

export function applySpacing(el: HTMLElement, changes: Record<string, string>) {
  const before: Record<string, string> = {};
  Object.keys(changes).forEach((prop) => {
    before[prop] = el.style.getPropertyValue(prop);
    el.style.setProperty(prop, changes[prop]);
  });
  return recordStyleMutation(el.dataset.flowRef ?? "unknown", before, changes);
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm -C tools/flow --filter @flow/extension test -- spacingFeature.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add tools/flow/packages/extension/src/content/features/spacing.ts \
  tools/flow/packages/extension/src/content/__tests__/spacingFeature.test.ts

git commit -m "feat(flow2): add spacing feature"
```

---

## Task 3: Typography and text edit

**Files:**
- Create: `tools/flow/packages/extension/src/content/features/typography.ts`
- Create: `tools/flow/packages/extension/src/content/features/textEdit.ts`
- Test: `tools/flow/packages/extension/src/content/__tests__/typographyFeature.test.ts`

**Step 1: Write the failing test**

```ts
// tools/flow/packages/extension/src/content/__tests__/typographyFeature.test.ts
import { describe, it, expect } from "vitest";
import { applyTypography } from "../features/typography";

describe("typography feature", () => {
  it("sets font-size and returns diff", () => {
    const el = document.createElement("div");
    const diff = applyTypography(el, { fontSize: "20px" });
    expect(diff.changes[0].property).toBe("font-size");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -C tools/flow --filter @flow/extension test -- typographyFeature.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// tools/flow/packages/extension/src/content/features/typography.ts
import { recordStyleMutation } from "../mutations/mutationRecorder";

export function applyTypography(el: HTMLElement, changes: Record<string, string>) {
  const before: Record<string, string> = {};
  Object.keys(changes).forEach((prop) => {
    before[prop] = el.style.getPropertyValue(prop);
    el.style.setProperty(prop, changes[prop]);
  });
  return recordStyleMutation(el.dataset.flowRef ?? "unknown", before, changes);
}
```

```ts
// tools/flow/packages/extension/src/content/features/textEdit.ts
import type { MutationDiff } from "@flow/shared/types/mutation";

export function applyTextEdit(el: HTMLElement, newText: string): MutationDiff {
  const oldValue = el.textContent ?? "";
  el.textContent = newText;
  return {
    id: crypto.randomUUID(),
    element: { selector: `[data-flow-ref="${el.dataset.flowRef ?? "unknown"}"]` },
    type: "text",
    changes: [{ property: "textContent", oldValue, newValue: newText }],
    timestamp: new Date().toISOString(),
  };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm -C tools/flow --filter @flow/extension test -- typographyFeature.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add tools/flow/packages/extension/src/content/features/typography.ts \
  tools/flow/packages/extension/src/content/features/textEdit.ts \
  tools/flow/packages/extension/src/content/__tests__/typographyFeature.test.ts

git commit -m "feat(flow2): add typography and text edit features"
```

---

## Task 4: Colors, hue shift, and shadows

**Files:**
- Create: `tools/flow/packages/extension/src/content/features/colors.ts`
- Create: `tools/flow/packages/extension/src/content/features/shadows.ts`
- Test: `tools/flow/packages/extension/src/content/__tests__/colorFeature.test.ts`
- Modify: `tools/flow/packages/extension/package.json`

**Step 1: Write the failing test**

```ts
// tools/flow/packages/extension/src/content/__tests__/colorFeature.test.ts
import { describe, it, expect } from "vitest";
import { applyColor } from "../features/colors";

describe("colors feature", () => {
  it("sets background-color and returns diff", () => {
    const el = document.createElement("div");
    const diff = applyColor(el, { backgroundColor: "rgb(0,0,0)" });
    expect(diff.changes[0].property).toBe("background-color");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -C tools/flow --filter @flow/extension test -- colorFeature.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// tools/flow/packages/extension/src/content/features/colors.ts
import { recordStyleMutation } from "../mutations/mutationRecorder";

export function applyColor(el: HTMLElement, changes: Record<string, string>) {
  const before: Record<string, string> = {};
  Object.keys(changes).forEach((prop) => {
    before[prop] = el.style.getPropertyValue(prop);
    el.style.setProperty(prop, changes[prop]);
  });
  return recordStyleMutation(el.dataset.flowRef ?? "unknown", before, changes);
}
```

```ts
// tools/flow/packages/extension/src/content/features/shadows.ts
import { recordStyleMutation } from "../mutations/mutationRecorder";

export function applyShadow(el: HTMLElement, changes: Record<string, string>) {
  const before: Record<string, string> = {};
  Object.keys(changes).forEach((prop) => {
    before[prop] = el.style.getPropertyValue(prop);
    el.style.setProperty(prop, changes[prop]);
  });
  return recordStyleMutation(el.dataset.flowRef ?? "unknown", before, changes);
}
```

```json
// tools/flow/packages/extension/package.json
{
  "dependencies": {
    "@ctrl/tinycolor": "^3.0.2",
    "colorjs.io": "^0.5.0"
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm -C tools/flow --filter @flow/extension test -- colorFeature.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add tools/flow/packages/extension/src/content/features/colors.ts \
  tools/flow/packages/extension/src/content/features/shadows.ts \
  tools/flow/packages/extension/src/content/__tests__/colorFeature.test.ts \
  tools/flow/packages/extension/package.json

git commit -m "feat(flow2): add color and shadow features"
```

---

## Task 5: Layout and flex feature

**Files:**
- Create: `tools/flow/packages/extension/src/content/features/layout.ts`
- Test: `tools/flow/packages/extension/src/content/__tests__/layoutFeature.test.ts`

**Step 1: Write the failing test**

```ts
// tools/flow/packages/extension/src/content/__tests__/layoutFeature.test.ts
import { describe, it, expect } from "vitest";
import { applyLayout } from "../features/layout";

describe("layout feature", () => {
  it("sets display and returns diff", () => {
    const el = document.createElement("div");
    const diff = applyLayout(el, { display: "flex" });
    expect(diff.changes[0].property).toBe("display");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -C tools/flow --filter @flow/extension test -- layoutFeature.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// tools/flow/packages/extension/src/content/features/layout.ts
import { recordStyleMutation } from "../mutations/mutationRecorder";

export function applyLayout(el: HTMLElement, changes: Record<string, string>) {
  const before: Record<string, string> = {};
  Object.keys(changes).forEach((prop) => {
    before[prop] = el.style.getPropertyValue(prop);
    el.style.setProperty(prop, changes[prop]);
  });
  return recordStyleMutation(el.dataset.flowRef ?? "unknown", before, changes);
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm -C tools/flow --filter @flow/extension test -- layoutFeature.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add tools/flow/packages/extension/src/content/features/layout.ts \
  tools/flow/packages/extension/src/content/__tests__/layoutFeature.test.ts

git commit -m "feat(flow2): add layout feature"
```

---

## Task 6: Position feature

**Files:**
- Create: `tools/flow/packages/extension/src/content/features/position.ts`
- Test: `tools/flow/packages/extension/src/content/__tests__/positionFeature.test.ts`

**Step 1: Write the failing test**

```ts
// tools/flow/packages/extension/src/content/__tests__/positionFeature.test.ts
import { describe, it, expect } from "vitest";
import { applyPosition } from "../features/position";

describe("position feature", () => {
  it("sets position and returns diff", () => {
    const el = document.createElement("div");
    const diff = applyPosition(el, { position: "absolute" });
    expect(diff.changes[0].property).toBe("position");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -C tools/flow --filter @flow/extension test -- positionFeature.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// tools/flow/packages/extension/src/content/features/position.ts
import { recordStyleMutation } from "../mutations/mutationRecorder";

export function applyPosition(el: HTMLElement, changes: Record<string, string>) {
  const before: Record<string, string> = {};
  Object.keys(changes).forEach((prop) => {
    before[prop] = el.style.getPropertyValue(prop);
    el.style.setProperty(prop, changes[prop]);
  });
  return recordStyleMutation(el.dataset.flowRef ?? "unknown", before, changes);
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm -C tools/flow --filter @flow/extension test -- positionFeature.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add tools/flow/packages/extension/src/content/features/position.ts \
  tools/flow/packages/extension/src/content/__tests__/positionFeature.test.ts

git commit -m "feat(flow2): add position feature"
```

---

## Task 7: Move (reorder) feature

**Files:**
- Create: `tools/flow/packages/extension/src/content/features/move.ts`
- Test: `tools/flow/packages/extension/src/content/__tests__/moveFeature.test.ts`

**Step 1: Write the failing test**

```ts
// tools/flow/packages/extension/src/content/__tests__/moveFeature.test.ts
import { describe, it, expect } from "vitest";
import { moveElement } from "../features/move";

describe("move feature", () => {
  it("moves element right by inserting after sibling", () => {
    const parent = document.createElement("div");
    const a = document.createElement("div");
    const b = document.createElement("div");
    parent.append(a, b);

    moveElement(a, "right");
    expect(parent.lastElementChild).toBe(a);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -C tools/flow --filter @flow/extension test -- moveFeature.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// tools/flow/packages/extension/src/content/features/move.ts
export function moveElement(el: HTMLElement, direction: "left" | "right") {
  if (!el.parentElement) return;
  if (direction === "left" && el.previousElementSibling) {
    el.parentElement.insertBefore(el, el.previousElementSibling);
  }
  if (direction === "right" && el.nextElementSibling) {
    el.parentElement.insertBefore(el, el.nextElementSibling.nextSibling);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm -C tools/flow --filter @flow/extension test -- moveFeature.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add tools/flow/packages/extension/src/content/features/move.ts \
  tools/flow/packages/extension/src/content/__tests__/moveFeature.test.ts

git commit -m "feat(flow2): add move feature"
```

---

## Task 8: Search feature (selector aliases)

**Files:**
- Create: `tools/flow/packages/extension/src/content/features/search.ts`
- Modify: `tools/flow/packages/extension/package.json`
- Test: `tools/flow/packages/extension/src/content/__tests__/searchFeature.test.ts`

**Step 1: Write the failing test**

```ts
// tools/flow/packages/extension/src/content/__tests__/searchFeature.test.ts
import { describe, it, expect } from "vitest";
import { normalizeQuery } from "../features/search";

describe("search feature", () => {
  it("maps images alias to img selector", () => {
    expect(normalizeQuery("images")).toBe("img");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -C tools/flow --filter @flow/extension test -- searchFeature.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// tools/flow/packages/extension/src/content/features/search.ts
import { querySelectorAllDeep } from "query-selector-shadow-dom";

export function normalizeQuery(query: string) {
  if (query === "images") return "img";
  if (query === "text") return "p,caption,a,h1,h2,h3,h4,h5,h6,small,li,dt,dd";
  return query;
}

export function queryPage(query: string) {
  const selector = normalizeQuery(query);
  if (!selector) return [];
  return querySelectorAllDeep(selector);
}
```

```json
// tools/flow/packages/extension/package.json
{
  "dependencies": {
    "query-selector-shadow-dom": "^1.0.1"
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm -C tools/flow --filter @flow/extension test -- searchFeature.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add tools/flow/packages/extension/src/content/features/search.ts \
  tools/flow/packages/extension/src/content/__tests__/searchFeature.test.ts \
  tools/flow/packages/extension/package.json

git commit -m "feat(flow2): add search feature"
```

---

## Task 9: Accessibility feature (contrast check)

**Files:**
- Create: `tools/flow/packages/extension/src/content/features/accessibility.ts`
- Test: `tools/flow/packages/extension/src/content/__tests__/accessibilityFeature.test.ts`

**Step 1: Write the failing test**

```ts
// tools/flow/packages/extension/src/content/__tests__/accessibilityFeature.test.ts
import { describe, it, expect } from "vitest";
import { getContrastRatio } from "../features/accessibility";

describe("accessibility feature", () => {
  it("computes contrast ratio", () => {
    expect(getContrastRatio("#000000", "#ffffff")).toBeGreaterThan(7);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -C tools/flow --filter @flow/extension test -- accessibilityFeature.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// tools/flow/packages/extension/src/content/features/accessibility.ts
import { readability } from "@ctrl/tinycolor";

export function getContrastRatio(foreground: string, background: string) {
  return readability(foreground, background);
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm -C tools/flow --filter @flow/extension test -- accessibilityFeature.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add tools/flow/packages/extension/src/content/features/accessibility.ts \
  tools/flow/packages/extension/src/content/__tests__/accessibilityFeature.test.ts

git commit -m "feat(flow2): add accessibility contrast feature"
```

---

## Task 10: Image swap feature (drag and drop)

**Files:**
- Create: `tools/flow/packages/extension/src/content/features/imageswap.ts`
- Test: `tools/flow/packages/extension/src/content/__tests__/imageswapFeature.test.ts`

**Step 1: Write the failing test**

```ts
// tools/flow/packages/extension/src/content/__tests__/imageswapFeature.test.ts
import { describe, it, expect } from "vitest";
import { getTargetImages } from "../features/imageswap";

describe("imageswap feature", () => {
  it("returns selected image when provided", () => {
    const img = document.createElement("img");
    expect(getTargetImages([img])).toEqual([img]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -C tools/flow --filter @flow/extension test -- imageswapFeature.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// tools/flow/packages/extension/src/content/features/imageswap.ts
export function getTargetImages(selected: HTMLImageElement[]) {
  return selected;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm -C tools/flow --filter @flow/extension test -- imageswapFeature.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add tools/flow/packages/extension/src/content/features/imageswap.ts \
  tools/flow/packages/extension/src/content/__tests__/imageswapFeature.test.ts

git commit -m "feat(flow2): add image swap utilities"
```

---

## Task 11: Screenshot feature (capture request)

**Files:**
- Create: `tools/flow/packages/extension/src/content/features/screenshot.ts`
- Modify: `tools/flow/packages/extension/src/entrypoints/background.ts`
- Test: `tools/flow/packages/extension/src/content/__tests__/screenshotFeature.test.ts`

**Step 1: Write the failing test**

```ts
// tools/flow/packages/extension/src/content/__tests__/screenshotFeature.test.ts
import { describe, it, expect } from "vitest";
import { buildScreenshotRequest } from "../features/screenshot";

describe("screenshot feature", () => {
  it("creates the request message", () => {
    expect(buildScreenshotRequest().kind).toBe("screenshot:request");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -C tools/flow --filter @flow/extension test -- screenshotFeature.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// tools/flow/packages/extension/src/content/features/screenshot.ts
export function buildScreenshotRequest() {
  return { kind: "screenshot:request" as const };
}
```

```ts
// tools/flow/packages/extension/src/entrypoints/background.ts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.kind === "screenshot:request") {
    chrome.tabs.captureVisibleTab(sender.tab?.windowId, { format: "png" }, (dataUrl) => {
      sendResponse({ dataUrl });
    });
    return true;
  }
});
```

**Step 4: Run test to verify it passes**

Run: `pnpm -C tools/flow --filter @flow/extension test -- screenshotFeature.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add tools/flow/packages/extension/src/content/features/screenshot.ts \
  tools/flow/packages/extension/src/content/__tests__/screenshotFeature.test.ts \
  tools/flow/packages/extension/src/entrypoints/background.ts

git commit -m "feat(flow2): add screenshot request feature"
```

---

## Task 12: Feature registration and hotkeys map

**Files:**
- Create: `tools/flow/packages/extension/src/content/features/index.ts`
- Modify: `tools/flow/packages/extension/src/entrypoints/content.ts`
- Test: `tools/flow/packages/extension/src/content/__tests__/featureRegistry.test.ts`

**Step 1: Write the failing test**

```ts
// tools/flow/packages/extension/src/content/__tests__/featureRegistry.test.ts
import { describe, it, expect } from "vitest";
import { featureIds } from "../features";

describe("feature registry ids", () => {
  it("includes spacing and typography", () => {
    expect(featureIds).toContain("spacing");
    expect(featureIds).toContain("typography");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -C tools/flow --filter @flow/extension test -- featureRegistry.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// tools/flow/packages/extension/src/content/features/index.ts
export const featureIds = [
  "spacing",
  "typography",
  "colors",
  "shadows",
  "layout",
  "position",
  "move",
  "text",
  "search",
  "accessibility",
  "imageswap",
  "screenshot",
] as const;
```

**Step 4: Run test to verify it passes**

Run: `pnpm -C tools/flow --filter @flow/extension test -- featureRegistry.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add tools/flow/packages/extension/src/content/features/index.ts \
  tools/flow/packages/extension/src/content/__tests__/featureRegistry.test.ts \
  tools/flow/packages/extension/src/entrypoints/content.ts

git commit -m "feat(flow2): register editing features"
```

---

## Verification

- Run: `pnpm -C tools/flow --filter @flow/extension test`  
  Expected: PASS

