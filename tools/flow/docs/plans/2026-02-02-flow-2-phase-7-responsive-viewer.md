# Phase 7: Responsive Viewer Workspace

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Provide a multi-viewport responsive preview workspace (similar to Responsive Viewer) that shows multiple device sizes at once, supports custom screens, syncs scroll/navigation, and includes screenshot + annotation tooling.

**Architecture:** A new extension page (`responsive.html`) runs a React app that renders a workspace of viewports. Each viewport is an iframe pointing at the target URL. A lightweight frame agent script runs in each iframe (only when embedded in the viewer) to report scroll/navigation events and apply sync commands. Viewer state is stored in a Zustand slice and persisted via `chrome.storage.local`. Screenshot capture uses `chrome.tabs.captureVisibleTab` and crops to viewport bounds; annotations render on a canvas overlay.

**Tech Stack:** React 19, TypeScript 5.8, WXT, Zustand, chrome.storage, chrome.scripting, Canvas API

---

## Phase 0 - Research Summary

- Responsive Viewer features: multi-screen preview, custom screen sizes, device mockups, sync scrolling/navigation, multiple layout modes, screenshot + annotation.
- Flow spec alignment: §9 mentions responsive breakpoint preview in Component Canvas. This phase expands the concept to a full-page responsive workspace.

---

## Dependencies

- Phases 1-6 completed (extension shell, inspection, panel migration, mutations, sidecar, prompt output).
- DevTools panel is operational (Phase 3c) to launch the viewer.

---

## Task 1: Shared types and message schema for responsive viewer

**Files:**
- Create: `packages/shared/src/types/responsive.ts`
- Modify: `packages/shared/src/index.ts`
- Modify: `packages/shared/src/messages.ts`

**Types to include:**
- `ViewportPreset` (id, label, width, height, deviceType, scale)
- `ViewportInstance` (id, presetId, url, position, scale, active)
- `WorkspaceLayout` (`grid` | `rows` | `columns` | `canvas`)
- `SyncSettings` (syncScroll, syncNavigation, syncInputs)
- `ResponsiveWorkspaceState` (viewports, layout, sync settings, activeViewportId)

**Messages to include:**
- `viewer:frame-ready` (frameId, viewportId, url)
- `viewer:scroll` (viewportId, scrollTop, scrollLeft)
- `viewer:navigate` (viewportId, url)
- `viewer:sync-scroll` (scrollTop, scrollLeft)
- `viewer:sync-navigate` (url)

**Commit:** `feat(shared): add responsive viewer types and messages`

---

## Task 2: Add responsive viewer entrypoint

**Files:**
- Create: `packages/extension/src/entrypoints/responsive.html`
- Create: `packages/extension/src/entrypoints/responsive.ts`
- Create: `packages/extension/src/entrypoints/responsive/main.tsx`
- Create: `packages/extension/src/responsive/ResponsiveViewerApp.tsx`
- Create: `packages/extension/src/responsive/ResponsiveViewer.css`
- Modify: `packages/extension/wxt.config.ts` (if needed to register entrypoint)

**Notes:**
- Viewer opens in a normal browser tab via `chrome.tabs.create({ url: chrome.runtime.getURL("responsive.html") })`.
- Accept `?url=` query param for initial target URL, with fallback to last-used URL.

**Commit:** `feat(extension): add responsive viewer entrypoint`

---

## Task 3: Device presets and custom screens

**Files:**
- Create: `packages/extension/src/responsive/presets.ts`
- Create: `packages/extension/src/responsive/components/DevicePresetPicker.tsx`
- Create: `packages/extension/src/responsive/components/CustomScreenDialog.tsx`

**Requirements:**
- Include baseline presets (mobile, tablet, laptop, desktop).
- Allow custom width/height + label; save to `chrome.storage.local`.
- Support orientation toggle (swap width/height).

**Commit:** `feat(extension): add responsive device presets and custom screens`

---

## Task 4: Workspace layout + drag and resize

**Files:**
- Create: `packages/extension/src/responsive/store/responsiveStore.ts`
- Create: `packages/extension/src/responsive/layout/WorkspaceLayout.tsx`
- Create: `packages/extension/src/responsive/layout/CanvasLayout.tsx`
- Create: `packages/extension/src/responsive/layout/GridLayout.tsx`

**Requirements:**
- Layout modes: grid, rows, columns, canvas.
- Canvas mode supports drag + resize of viewport cards.
- Store layout state and viewport positions in Zustand, persisted to storage.

**Commit:** `feat(extension): add responsive workspace layouts with drag/resize`

---

## Task 5: Viewport frame component

**Files:**
- Create: `packages/extension/src/responsive/components/ViewportFrame.tsx`
- Create: `packages/extension/src/responsive/components/ViewportToolbar.tsx`

**Requirements:**
- Render iframe with fixed width/height and optional scale-to-fit.
- Show device chrome label (e.g., "iPhone 14 Pro").
- Loading/error states (for blocked frames).
- Per-viewport controls: reload, active toggle, scale slider.

**Commit:** `feat(extension): add responsive viewport frame component`

---

## Task 6: Frame agent script for sync events

**Files:**
- Create: `packages/extension/src/entrypoints/responsiveFrame.ts`
- Modify: `packages/extension/wxt.config.ts` to register as content script (all_frames, matches `<all_urls>`).

**Behavior:**
- Run only when embedded in the viewer (gate via `window.top !== window` and a postMessage handshake).
- Send scroll + navigation events to parent viewer.
- Listen for sync commands (`viewer:sync-scroll`, `viewer:sync-navigate`) and apply them.
- Provide `viewer:frame-ready` handshake with `viewportId`.

**Commit:** `feat(extension): add responsive frame agent for sync messaging`

---

## Task 7: Sync controller (scroll + navigation)

**Files:**
- Create: `packages/extension/src/responsive/services/syncController.ts`
- Modify: `packages/extension/src/responsive/ResponsiveViewerApp.tsx`

**Requirements:**
- Sync scroll from active viewport to others (throttled to rAF).
- Sync navigation when active viewport changes URL.
- Toggle controls in toolbar (sync scroll, sync nav, sync inputs).

**Commit:** `feat(extension): add responsive sync controller`

---

## Task 8: Screenshot + annotation tools

**Files:**
- Create: `packages/extension/src/responsive/tools/captureViewport.ts`
- Create: `packages/extension/src/responsive/tools/AnnotationCanvas.tsx`
- Create: `packages/extension/src/responsive/tools/AnnotationToolbar.tsx`

**Requirements:**
- Capture viewer tab via `chrome.tabs.captureVisibleTab`, crop to viewport bounds.
- Annotation overlay with pen, highlight, arrow, text, undo, clear.
- Export PNG to disk and copy to clipboard.

**Commit:** `feat(extension): add viewport screenshot and annotation tools`

---

## Task 9: DevTools panel integration

**Files:**
- Modify: `packages/extension/src/entrypoints/panel/Panel.tsx`
- Create: `packages/extension/src/panel/components/ResponsiveViewerLauncher.tsx`
- Modify: `packages/extension/src/entrypoints/background.ts` (open/focus viewer tab)

**Requirements:**
- Add a "Responsive Viewer" entry in the panel UI.
- Launch viewer with the inspected tab URL.
- Optional: "Follow inspected tab" toggle to keep viewer URL in sync.

**Commit:** `feat(panel): add responsive viewer launcher`

---

## Task 10: Persistence and workspace presets

**Files:**
- Create: `packages/extension/src/responsive/services/persistence.ts`

**Requirements:**
- Persist workspace state (viewports, layout, sync settings, custom presets).
- Load state on viewer open.
- Save named workspace presets (e.g., "Mobile QA", "Desktop + Tablet").

**Commit:** `feat(extension): persist responsive workspace state`

---

## Task 11: Frame-blocking fallback

**Files:**
- Modify: `packages/extension/src/responsive/components/ViewportFrame.tsx`
- Modify: `packages/extension/src/responsive/services/syncController.ts`

**Requirements:**
- Detect `X-Frame-Options` / `CSP` blocking (iframe error or timeout).
- Offer fallback: open a separate window at the viewport size.
- Keep sync controls disabled for blocked frames.

**Commit:** `feat(extension): add blocked-frame fallback for responsive viewer`

---

## Task 12: Tests + manual verification

**Unit tests:**
- `packages/extension/src/responsive/__tests__/responsiveStore.test.ts`
- `packages/extension/src/responsive/__tests__/syncController.test.ts`
- `packages/extension/src/responsive/__tests__/captureViewport.test.ts`

**Manual checklist:**
1. Open viewer from DevTools on a live URL.
2. Add 3 presets + 1 custom size; verify layout modes.
3. Scroll one viewport → all others sync (when enabled).
4. Navigate in one viewport → others update (when enabled).
5. Capture screenshot of a single viewport; annotate and download.
6. Reload viewer; confirm workspace state persists.
7. Test a page that blocks iframes; fallback window opens.

**Commit:** `test(flow2): add responsive viewer unit tests + checklist`

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Shared types + messages | `packages/shared/src/types/responsive.ts` |
| 2 | Viewer entrypoint | `entrypoints/responsive.*`, `ResponsiveViewerApp.tsx` |
| 3 | Presets + custom screens | `presets.ts`, `CustomScreenDialog.tsx` |
| 4 | Layout + drag/resize | `WorkspaceLayout.tsx`, `responsiveStore.ts` |
| 5 | Viewport frames | `ViewportFrame.tsx` |
| 6 | Frame agent | `entrypoints/responsiveFrame.ts` |
| 7 | Sync controller | `syncController.ts` |
| 8 | Screenshot + annotation | `captureViewport.ts`, `AnnotationCanvas.tsx` |
| 9 | Panel integration | `ResponsiveViewerLauncher.tsx` |
| 10 | Persistence | `persistence.ts` |
| 11 | Frame-blocking fallback | `ViewportFrame.tsx` |
| 12 | Tests + verification | `__tests__/*` |

**Total estimated new code:** ~2,500-3,000 lines (viewer UI + sync + tools)
