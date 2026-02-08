# Flow 2 Phase 3c Panel Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Port Flow 0's React panel UI and Zustand store into the DevTools panel, replacing all Tauri dependencies with browser-safe message passing and sidecar fetch.

**Architecture:** Copy Flow 0 UI components into `packages/extension/src/panel` and incrementally replace Tauri-specific logic. A thin `panel/api.ts` layer abstracts sidecar fetch and content-script messaging. PreviewCanvas is replaced by an "Inspected Tab" placeholder because the real page lives in the inspected tab, not an iframe.

**Tech Stack:** React 19, Zustand 5, TypeScript 5.8, Vitest, chrome.runtime messaging, fetch

---

## Phase 0 - Research Summary

**Brainstorm used:** `docs/brainstorms/2026-02-02-flow-2-phase-3-brainstorm.md`
- Port Flow 0 UI into DevTools
- Port Flow 0 color handling (ColorPicker + culori utilities)

**Repo patterns and sources:**
- Flow 0 components: `tools/flow/reference/flow-0/app/components/*`
- Flow 0 stores: `tools/flow/reference/flow-0/app/stores/*`
- Flow 0 hooks: `tools/flow/reference/flow-0/app/hooks/*`
- Flow 0 color utilities: `tools/flow/reference/flow-0/app/utils/colorConversions.ts`

**External research:** Not needed (strong local context)

---

## Dependencies

- Phase 1 completed (DevTools panel entrypoint exists)
- Phase 2 completed (inspection data available)
- Phase 3a and 3b completed (content features and mutation messages)

---

## Task 1: Port Flow 0 style types and color utilities

**Files:**
- Copy: `tools/flow/reference/flow-0/app/types/styleValue.ts` -> `tools/flow/packages/extension/src/panel/types/styleValue.ts`
- Copy: `tools/flow/reference/flow-0/app/utils/colorConversions.ts` -> `tools/flow/packages/extension/src/panel/utils/colorConversions.ts`
- Copy: `tools/flow/reference/flow-0/app/components/designer/ColorPicker.tsx` -> `tools/flow/packages/extension/src/panel/components/designer/ColorPicker.tsx`
- Modify: `tools/flow/packages/extension/package.json`
- Test: `tools/flow/packages/extension/src/panel/__tests__/colorConversions.test.ts`

**Step 1: Write the failing test**

```ts
// tools/flow/packages/extension/src/panel/__tests__/colorConversions.test.ts
import { describe, it, expect } from "vitest";
import { colorValueToCss } from "../utils/colorConversions";

describe("colorConversions", () => {
  it("formats rgb colors", () => {
    expect(
      colorValueToCss({ type: "color", colorSpace: "srgb", components: [1, 0, 0], alpha: 1 })
    ).toContain("rgb");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -C tools/flow --filter @flow/extension test -- colorConversions.test.ts`  
Expected: FAIL

**Step 3: Copy utilities and add dependencies**

```json
// tools/flow/packages/extension/package.json
{
  "dependencies": {
    "culori": "^4.0.2",
    "react-colorful": "^5.6.1"
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm -C tools/flow --filter @flow/extension test -- colorConversions.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add tools/flow/packages/extension/src/panel/types/styleValue.ts \
  tools/flow/packages/extension/src/panel/utils/colorConversions.ts \
  tools/flow/packages/extension/src/panel/components/designer/ColorPicker.tsx \
  tools/flow/packages/extension/src/panel/__tests__/colorConversions.test.ts \
  tools/flow/packages/extension/package.json

git commit -m "feat(flow2): port Flow 0 color utilities and picker"
```

---

## Task 2: Create panel API shim (sidecar + content messages)

**Files:**
- Create: `tools/flow/packages/extension/src/panel/api/index.ts`
- Create: `tools/flow/packages/extension/src/panel/api/sidecar.ts`
- Create: `tools/flow/packages/extension/src/panel/api/contentBridge.ts`
- Test: `tools/flow/packages/extension/src/panel/__tests__/panelApi.test.ts`

**Step 1: Write the failing test**

```ts
// tools/flow/packages/extension/src/panel/__tests__/panelApi.test.ts
import { describe, it, expect } from "vitest";
import { getSidecarBaseUrl } from "../api/sidecar";

describe("panel api", () => {
  it("returns default sidecar base url", () => {
    expect(getSidecarBaseUrl()).toBe("http://localhost:3737");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -C tools/flow --filter @flow/extension test -- panelApi.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// tools/flow/packages/extension/src/panel/api/sidecar.ts
export function getSidecarBaseUrl() {
  return "http://localhost:3737";
}
```

```ts
// tools/flow/packages/extension/src/panel/api/contentBridge.ts
export function sendToContent(message: unknown) {
  const port = chrome.runtime.connect({ name: "flow-panel" });
  port.postMessage(message);
  port.disconnect();
}
```

```ts
// tools/flow/packages/extension/src/panel/api/index.ts
export * from "./sidecar";
export * from "./contentBridge";
```

**Step 4: Run test to verify it passes**

Run: `pnpm -C tools/flow --filter @flow/extension test -- panelApi.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add tools/flow/packages/extension/src/panel/api \
  tools/flow/packages/extension/src/panel/__tests__/panelApi.test.ts

git commit -m "feat(flow2): add panel api shim"
```

---

## Task 3: Port Zustand store slices

**Files:**
- Copy directory: `tools/flow/reference/flow-0/app/stores` -> `tools/flow/packages/extension/src/panel/stores`
- Modify: `tools/flow/packages/extension/src/panel/stores/appStore.ts`
- Modify: `tools/flow/packages/extension/src/panel/stores/slices/bridgeSlice.ts`
- Modify: `tools/flow/packages/extension/src/panel/stores/slices/projectSlice.ts`
- Modify: `tools/flow/packages/extension/src/panel/stores/slices/watcherSlice.ts`
- Modify: `tools/flow/packages/extension/src/panel/stores/slices/workspaceSlice.ts`
- Test: `tools/flow/packages/extension/src/panel/__tests__/storeInit.test.ts`

**Step 1: Write the failing test**

```ts
// tools/flow/packages/extension/src/panel/__tests__/storeInit.test.ts
import { describe, it, expect } from "vitest";
import { useAppStore } from "../stores/appStore";

describe("app store", () => {
  it("initializes with default editor mode", () => {
    expect(useAppStore.getState().editorMode).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -C tools/flow --filter @flow/extension test -- storeInit.test.ts`  
Expected: FAIL

**Step 3: Copy store and replace Tauri deps**

- Remove `@tauri-apps/*` imports
- Replace file dialogs with stubbed UI state
- Replace bridge socket with `panel/api/contentBridge.ts`
- Replace file watcher with no-op until sidecar WS (Phase 5)

**Step 4: Run test to verify it passes**

Run: `pnpm -C tools/flow --filter @flow/extension test -- storeInit.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add tools/flow/packages/extension/src/panel/stores \
  tools/flow/packages/extension/src/panel/__tests__/storeInit.test.ts

git commit -m "feat(flow2): port Flow 0 Zustand store"
```

---

## Task 4: Port layout shell components

**Files:**
- Copy directory: `tools/flow/reference/flow-0/app/components/layout` -> `tools/flow/packages/extension/src/panel/components/layout`
- Modify: `tools/flow/packages/extension/src/panel/components/layout/SettingsBar.tsx`
- Modify: `tools/flow/packages/extension/src/panel/components/layout/PreviewCanvas.tsx`

**Step 1: Replace Tauri window controls**

- Remove `@tauri-apps/api/window` usage
- Replace window controls with no-op buttons or hide

**Step 2: Replace PreviewCanvas iframe**

- Show a placeholder: "Inspect the active tab to see live preview"

**Step 3: Run typecheck**

Run: `pnpm -C tools/flow --filter @flow/extension typecheck`  
Expected: PASS

**Step 4: Commit**

```bash
git add tools/flow/packages/extension/src/panel/components/layout

git commit -m "feat(flow2): port layout shell components"
```

---

## Task 5: Port designer panel and sections

**Files:**
- Copy directory: `tools/flow/reference/flow-0/app/components/designer` -> `tools/flow/packages/extension/src/panel/components/designer`
- Copy directory: `tools/flow/reference/flow-0/app/components/designer/sections` -> `tools/flow/packages/extension/src/panel/components/designer/sections`
- Modify: `tools/flow/packages/extension/src/panel/components/designer/sections/SpacingSection.tsx`
- Modify: `tools/flow/packages/extension/src/panel/components/designer/sections/TypographySection.tsx`
- Modify: `tools/flow/packages/extension/src/panel/components/designer/sections/BackgroundsSection.tsx`
- Modify: `tools/flow/packages/extension/src/panel/components/designer/sections/BoxShadowsSection.tsx`

**Step 1: Replace mutation calls**

- Replace Tauri invoke calls with `panel/api/contentBridge.ts` messages

**Step 2: Run typecheck**

Run: `pnpm -C tools/flow --filter @flow/extension typecheck`  
Expected: PASS

**Step 3: Commit**

```bash
git add tools/flow/packages/extension/src/panel/components/designer

git commit -m "feat(flow2): port designer panels and sections"
```

---

## Task 6: Port remaining panels and editor modes

**Files:**
- Copy directory: `tools/flow/reference/flow-0/app/components` -> `tools/flow/packages/extension/src/panel/components`
- Modify: `tools/flow/packages/extension/src/panel/components/CommentMode.tsx`
- Modify: `tools/flow/packages/extension/src/panel/components/TextEditMode.tsx`
- Modify: `tools/flow/packages/extension/src/panel/components/ComponentIdMode.tsx`

**Step 1: Replace iframe bridge usage**

- Replace `useBridgeConnection` and iframe assumptions with content bridge messages

**Step 2: Run typecheck**

Run: `pnpm -C tools/flow --filter @flow/extension typecheck`  
Expected: PASS

**Step 3: Commit**

```bash
git add tools/flow/packages/extension/src/panel/components

git commit -m "feat(flow2): port remaining panel components and modes"
```

---

## Task 7: Port spatial and component canvas systems

**Files:**
- Copy directory: `tools/flow/reference/flow-0/app/components/component-canvas` -> `tools/flow/packages/extension/src/panel/components/component-canvas`
- Copy directory: `tools/flow/reference/flow-0/app/components/spatial` -> `tools/flow/packages/extension/src/panel/components/spatial`
- Copy directory: `tools/flow/reference/flow-0/app/hooks` -> `tools/flow/packages/extension/src/panel/hooks`

**Step 1: Remove Tauri-specific hooks**

- Replace `useFileWatcher`, `useDevServer` with stubbed hooks until Phase 5

**Step 2: Run typecheck**

Run: `pnpm -C tools/flow --filter @flow/extension typecheck`  
Expected: PASS

**Step 3: Commit**

```bash
git add tools/flow/packages/extension/src/panel/components/component-canvas \
  tools/flow/packages/extension/src/panel/components/spatial \
  tools/flow/packages/extension/src/panel/hooks

git commit -m "feat(flow2): port spatial and component canvas systems"
```

---

## Task 8: Add contextual panels (Search, Accessibility, Image Swap, Screenshot)

**Files:**
- Create: `tools/flow/packages/extension/src/panel/components/context/SearchPanel.tsx`
- Create: `tools/flow/packages/extension/src/panel/components/context/AccessibilityPanel.tsx`
- Create: `tools/flow/packages/extension/src/panel/components/context/ImageSwapPanel.tsx`
- Create: `tools/flow/packages/extension/src/panel/components/context/ScreenshotPanel.tsx`

**Step 1: Wire panels to content features**

- Send messages using `panel/api/contentBridge.ts`
- Display returned data in each contextual panel

**Step 2: Run typecheck**

Run: `pnpm -C tools/flow --filter @flow/extension typecheck`  
Expected: PASS

**Step 3: Commit**

```bash
git add tools/flow/packages/extension/src/panel/components/context

git commit -m "feat(flow2): add contextual panels"
```

---

## Task 9: Panel entrypoint integration

**Files:**
- Modify: `tools/flow/packages/extension/src/entrypoints/panel/Panel.tsx`

**Step 1: Replace placeholder panel with Flow UI**

- Render `EditorLayout` from `panel/components/layout`

**Step 2: Run typecheck**

Run: `pnpm -C tools/flow --filter @flow/extension typecheck`  
Expected: PASS

**Step 3: Commit**

```bash
git add tools/flow/packages/extension/src/entrypoints/panel/Panel.tsx

git commit -m "feat(flow2): render Flow panel UI in devtools"
```

---

## Verification

- Run: `pnpm -C tools/flow --filter @flow/extension typecheck`  
  Expected: PASS

- Optional: `pnpm -C tools/flow --filter @flow/extension test`  
  Expected: PASS

