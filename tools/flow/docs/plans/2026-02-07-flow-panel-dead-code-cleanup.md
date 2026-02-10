# Flow Panel Dead Code Cleanup

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove ~6,000 lines of dead/unreachable code from the Flow panel, fix the broken PreviewCanvas mode display, and clean up the dual mode system regression.

**Architecture:** The panel has two parallel mode systems — the old `editorMode` (uiStateSlice) and the new `modeSlice` (content script bridge). The canonical system is `modeSlice`, used by `ModeToolbar`. This cleanup removes dead code from the old system while preserving the 3 overlay modes (`comment`, `text-edit`, `component-id`) that still gate on `editorMode`.

**Tech Stack:** React, Zustand, TypeScript, WXT browser extension

---

## Batch 1: Extract Tooltip & Remove FloatingModeBar (blocks everything)

### Task 1.1: Extract Tooltip to standalone file

**Files:**
- Create: `packages/extension/src/panel/components/ui/Tooltip.tsx`
- Modify: `packages/extension/src/panel/components/ModeToolbar.tsx:27`

**Step 1: Create `ui/Tooltip.tsx`**

Create the file with the Tooltip component extracted from FloatingModeBar.tsx (lines 260-364):

```tsx
/**
 * Tooltip - Hover tooltip with delay and fade animation
 *
 * Shows a tooltip near the children element after a delay.
 * Fades out quickly on mouse leave.
 */

import { useState, useRef, useEffect } from "react";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  side?: "top" | "bottom" | "right" | "left";
}

export function Tooltip({ content, children, delay = 150, side = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setShouldRender(true);
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
    setTimeout(() => {
      setShouldRender(false);
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {shouldRender && (
        <div
          className={`
            absolute z-50 pointer-events-none transition-opacity duration-100
            ${isVisible ? "opacity-100" : "opacity-0"}
            ${side === "top" ? "bottom-full left-1/2 -translate-x-1/2 mb-2" : ""}
            ${side === "bottom" ? "top-full left-1/2 -translate-x-1/2 mt-2" : ""}
            ${side === "right" ? "left-full top-1/2 -translate-y-1/2 ml-2" : ""}
            ${side === "left" ? "right-full top-1/2 -translate-y-1/2 mr-2" : ""}
          `}
        >
          <div className="bg-neutral-800 text-neutral-100 text-xs px-2 py-1.5 rounded-sm shadow-lg whitespace-nowrap border border-neutral-600">
            {content}
          </div>
          {side === "top" && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-4 border-transparent border-t-neutral-800" />
            </div>
          )}
          {side === "bottom" && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-px">
              <div className="border-4 border-transparent border-b-neutral-800" />
            </div>
          )}
          {side === "right" && (
            <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-px">
              <div className="border-4 border-transparent border-r-neutral-800" />
            </div>
          )}
          {side === "left" && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-px">
              <div className="border-4 border-transparent border-l-neutral-800" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Update ModeToolbar import**

In `packages/extension/src/panel/components/ModeToolbar.tsx`, change line 27:
```tsx
// FROM:
import { Tooltip } from './FloatingModeBar';
// TO:
import { Tooltip } from './ui/Tooltip';
```

**Step 3: Verify build**

Run: `cd packages/extension && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add packages/extension/src/panel/components/ui/Tooltip.tsx packages/extension/src/panel/components/ModeToolbar.tsx
git commit -m "refactor: extract Tooltip to standalone ui/Tooltip.tsx"
```

---

### Task 1.2: Delete FloatingModeBar and DragHandle

**Files:**
- Delete: `packages/extension/src/panel/components/FloatingModeBar.tsx` (~420 lines)
- Delete: `packages/extension/src/panel/components/DragHandle.tsx` (~298 lines)

**Step 1: Delete both files**

```bash
rm packages/extension/src/panel/components/FloatingModeBar.tsx
rm packages/extension/src/panel/components/DragHandle.tsx
```

**Step 2: Verify no remaining imports**

Search for any remaining references:
```bash
grep -r "FloatingModeBar\|DragHandle" packages/extension/src/ --include="*.ts" --include="*.tsx"
```
Expected: No results (ModeToolbar was already updated in Task 1.1)

**Step 3: Verify build**

Run: `cd packages/extension && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add -u packages/extension/src/panel/components/
git commit -m "chore: remove dead FloatingModeBar and DragHandle (~718 lines)"
```

---

## Batch 2: Fix SettingsBar and PreviewCanvas

### Task 2.1: Remove dead ModeSelector from SettingsBar

The SettingsBar has three concerns: (1) connection status (keep), (2) ModeSelector using old editorMode (remove), (3) search/settings (keep).

**Files:**
- Modify: `packages/extension/src/panel/components/layout/SettingsBar.tsx`

**Step 1: Remove editorMode reads and ModeSelector**

In `SettingsBar.tsx`:

1. Remove lines 26-27 (store reads):
```tsx
// DELETE these lines:
  const editorMode = useAppStore((s) => s.editorMode);
  const setEditorMode = useAppStore((s) => s.setEditorMode);
```

2. Remove the ModeSelector usage and its surrounding divider (lines 36-43):
```tsx
// DELETE these lines:
        <Divider />

        {/* Mode Selector */}
        <ModeSelector
          currentMode={editorMode}
          onModeChange={setEditorMode}
        />
```

3. Delete the entire `ModeSelector` component (lines 95-125) and its `ModeSelectorProps` interface.

4. In `SettingsDropdown`, remove the keyboard shortcuts section for I/D/V (lines 183-202):
```tsx
// DELETE this block inside SettingsDropdown:
          <div className="p-3">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2">
              Keyboard Shortcuts
            </div>
            <div className="space-y-1 text-xs text-neutral-400">
              <div className="flex justify-between">
                <span>Inspector</span>
                <kbd className="px-1.5 py-0.5 bg-neutral-700 rounded text-[10px]">I</kbd>
              </div>
              <div className="flex justify-between">
                <span>Designer</span>
                <kbd className="px-1.5 py-0.5 bg-neutral-700 rounded text-[10px]">D</kbd>
              </div>
              <div className="flex justify-between">
                <span>Developer</span>
                <kbd className="px-1.5 py-0.5 bg-neutral-700 rounded text-[10px]">V</kbd>
              </div>
            </div>
          </div>
```

5. Remove the `useAppStore` import if no longer needed (check if `SettingsDropdown` still uses it for `dogfoodMode`). It IS still needed for `dogfoodMode` — keep the import.

**Step 2: Verify build**

Run: `cd packages/extension && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/extension/src/panel/components/layout/SettingsBar.tsx
git commit -m "refactor: remove dead ModeSelector from SettingsBar"
```

---

### Task 2.2: Fix PreviewCanvas to read from modeSlice

**Files:**
- Modify: `packages/extension/src/panel/components/layout/PreviewCanvas.tsx`

**Step 1: Switch from editorMode to modeSlice**

In `PreviewCanvas.tsx`:

Change line 17:
```tsx
// FROM:
const editorMode = useAppStore((s) => s.editorMode);
// TO:
const topLevel = useAppStore((s) => s.mode.topLevel);
```

Change line 73:
```tsx
// FROM:
Mode: <span className="text-blue-400">{editorMode}</span>
// TO:
Mode: <span className="text-blue-400">{topLevel}</span>
```

**Step 2: Verify build**

Run: `cd packages/extension && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/extension/src/panel/components/layout/PreviewCanvas.tsx
git commit -m "fix: PreviewCanvas shows modeSlice.topLevel instead of stale editorMode"
```

---

## Batch 3: Delete Dead Component Directories

### Task 3.1: Delete spatial/ directory

**Files:**
- Delete: `packages/extension/src/panel/components/spatial/` (8 files, ~1,588 lines)

These are Tauri-only components (file system canvas) explicitly excluded from the extension in EditorLayout.tsx comment on line 12.

**Step 1: Delete the directory**

```bash
rm -rf packages/extension/src/panel/components/spatial/
```

**Step 2: Verify no remaining imports**

```bash
grep -r "spatial/" packages/extension/src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".wxt/"
```
Expected: Only hits from `component-canvas/` (which we delete next)

**Step 3: Commit**

```bash
git add -u packages/extension/src/panel/components/spatial/
git commit -m "chore: remove dead spatial/ directory (~1,588 lines, Tauri-only)"
```

---

### Task 3.2: Delete component-canvas/ directory

**Files:**
- Delete: `packages/extension/src/panel/components/component-canvas/` (5 files, ~1,283 lines)

**Step 1: Delete the directory**

```bash
rm -rf packages/extension/src/panel/components/component-canvas/
```

**Step 2: Verify no remaining imports**

```bash
grep -r "component-canvas\|ComponentCanvas\|ComponentNode\|ComponentConnections\|CanvasComponentPreview\|PagePreviewCard" packages/extension/src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".wxt/"
```
Expected: No results (or only type re-exports in appStore.ts — handled in Batch 4)

**Step 3: Commit**

```bash
git add -u packages/extension/src/panel/components/component-canvas/
git commit -m "chore: remove dead component-canvas/ directory (~1,283 lines)"
```

---

### Task 3.3: Delete canvas/ directory

**Files:**
- Delete: `packages/extension/src/panel/components/canvas/` (3 files, ~849 lines)

**Step 1: Delete the directory**

```bash
rm -rf packages/extension/src/panel/components/canvas/
```

**Step 2: Verify no remaining imports**

```bash
grep -r "CanvasGrid\|CanvasTools\|/canvas/" packages/extension/src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".wxt/"
```
Expected: No results

**Step 3: Commit**

```bash
git add -u packages/extension/src/panel/components/canvas/
git commit -m "chore: remove dead canvas/ directory (~849 lines)"
```

---

### Task 3.4: Delete orphaned standalone components

**Files:**
- Delete: `packages/extension/src/panel/components/ThemeSelector.tsx` (~145 lines)
- Delete: `packages/extension/src/panel/components/ThemeTransition.tsx` (~100 lines)
- Delete: `packages/extension/src/panel/components/PromptBuilderPanel.tsx` (~161 lines)

**Step 1: Verify each has zero imports**

```bash
grep -r "ThemeSelector\|ThemeTransition\|PromptBuilderPanel" packages/extension/src/ --include="*.ts" --include="*.tsx" | grep -v "ThemeSelector.tsx\|ThemeTransition.tsx\|PromptBuilderPanel.tsx"
```
Expected: No results (or only barrel exports — remove those too)

**Step 2: Delete all three**

```bash
rm packages/extension/src/panel/components/ThemeSelector.tsx
rm packages/extension/src/panel/components/ThemeTransition.tsx
rm packages/extension/src/panel/components/PromptBuilderPanel.tsx
```

**Step 3: Verify build**

Run: `cd packages/extension && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add -u packages/extension/src/panel/components/
git commit -m "chore: remove orphaned ThemeSelector, ThemeTransition, PromptBuilderPanel (~406 lines)"
```

---

## Batch 4: Clean Up Dead Store Slices

### Task 4.1: Remove spatialViewportSlice and componentCanvasSlice

**Files:**
- Delete: `packages/extension/src/panel/stores/slices/spatialViewportSlice.ts` (~447 lines)
- Delete: `packages/extension/src/panel/stores/slices/componentCanvasSlice.ts` (~452 lines)
- Modify: `packages/extension/src/panel/stores/slices/index.ts` (lines 14-15, 34-35)
- Modify: `packages/extension/src/panel/stores/appStore.ts` (lines 19-20, 48-49, 92-93)
- Modify: `packages/extension/src/panel/stores/types.ts` (remove slice types from AppState intersection)

**Step 1: Delete the slice files**

```bash
rm packages/extension/src/panel/stores/slices/spatialViewportSlice.ts
rm packages/extension/src/panel/stores/slices/componentCanvasSlice.ts
```

**Step 2: Update `slices/index.ts`**

Remove these lines:
```ts
// DELETE:
export { createSpatialViewportSlice } from "./spatialViewportSlice";
export { createComponentCanvasSlice } from "./componentCanvasSlice";
// ...and their type re-exports:
export type { SpatialViewportSlice } from "./spatialViewportSlice";
export type { ComponentCanvasSlice } from "./componentCanvasSlice";
```

**Step 3: Update `appStore.ts`**

Remove from imports (lines 19-20):
```ts
// DELETE:
  createSpatialViewportSlice,
  createComponentCanvasSlice,
```

Remove from store creation (lines 48-49):
```ts
// DELETE:
          ...createSpatialViewportSlice(...args),
          ...createComponentCanvasSlice(...args),
```

Remove from type re-exports (lines 92-93):
```ts
// DELETE:
  SpatialViewportSlice,
  ComponentCanvasSlice,
```

Also remove dead type re-exports only used by these slices (lines 126-130):
```ts
// DELETE if unused elsewhere:
  ComponentCanvasNode,
  ComponentConnection,
  ConnectionType,
  NodePreviewState,
  PagePreviewConfig,
```

**Step 4: Update `types.ts`**

Find the `AppState` intersection type and remove `SpatialViewportSlice` and `ComponentCanvasSlice` from it. Also remove the type definitions for `ComponentCanvasNode`, `ComponentConnection`, `ConnectionType`, `NodePreviewState`, `PagePreviewConfig` if they exist only in types.ts and are unused by other slices.

**Step 5: Verify build**

Run: `cd packages/extension && npx tsc --noEmit`
Expected: May get errors if other types reference removed types. Fix any cascading issues.

**Step 6: Commit**

```bash
git add -u packages/extension/src/panel/stores/
git commit -m "chore: remove dead spatialViewportSlice and componentCanvasSlice (~899 lines)"
```

---

### Task 4.2: Remove dead EditorMode values from types

**Files:**
- Modify: `packages/extension/src/panel/stores/types.ts` (lines 124-137)

**Step 1: Trim EditorMode type**

Keep only the values that are actively consumed:

```ts
// FROM:
export type EditorMode =
  | "cursor"
  | "component-id"
  | "text-edit"
  | "preview"
  | "clipboard"
  | "comment"
  | "smart-edit"
  | "select-prompt"
  | "designer"
  | "animation"
  // Extension-specific modes
  | "inspector"
  | "developer";

// TO:
export type EditorMode =
  | "cursor"
  | "component-id"
  | "text-edit"
  | "comment";
```

**Rationale:** Only these 4 values are consumed by live code:
- `"cursor"` — default/fallback in uiStateSlice, persist config, TextEditMode exit
- `"comment"` — gates CommentMode overlay, set by commentSlice
- `"text-edit"` — gates TextEditMode overlay
- `"component-id"` — gates ComponentIdMode overlay

**Step 2: Verify build**

Run: `cd packages/extension && npx tsc --noEmit`
Expected: May fail if any code still assigns dead values. Search and fix:
```bash
grep -rn '"inspector"\|"designer"\|"developer"\|"preview"\|"clipboard"\|"smart-edit"\|"select-prompt"\|"animation"' packages/extension/src/ --include="*.ts" --include="*.tsx" | grep -v "\.test\." | grep -v "node_modules" | grep -v "FloatingModeBar" | grep -v ".wxt/"
```
Fix any remaining references (likely in toolbar.ts or Panel.tsx state sync).

**Step 3: Commit**

```bash
git add packages/extension/src/panel/stores/types.ts
git commit -m "refactor: trim EditorMode to 4 active values (cursor, comment, text-edit, component-id)"
```

---

## Batch 5: Clean Up LeftPanel and Layout Barrel

### Task 5.1: Remove dead LeftPanel export

**Files:**
- Delete: `packages/extension/src/panel/components/layout/LeftPanel.tsx` (~228 lines)
- Modify: `packages/extension/src/panel/components/layout/index.ts` (line 4)

**Step 1: Verify LeftPanel is not imported anywhere**

```bash
grep -r "LeftPanel" packages/extension/src/ --include="*.ts" --include="*.tsx" | grep -v "LeftPanel.tsx" | grep -v "layout/index.ts" | grep -v node_modules | grep -v ".wxt/"
```
Expected: Only the barrel export in `layout/index.ts`. If EditorLayout has a comment referencing it, that's fine.

**Step 2: Delete LeftPanel and update barrel**

```bash
rm packages/extension/src/panel/components/layout/LeftPanel.tsx
```

In `layout/index.ts`, remove line 4:
```ts
// DELETE:
export { LeftPanel } from "./LeftPanel";
```

**Step 3: Verify build**

Run: `cd packages/extension && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add -u packages/extension/src/panel/components/layout/
git commit -m "chore: remove dead LeftPanel (~228 lines, moved to content script Shadow DOM)"
```

---

## Batch 6: Verify & Final Build

### Task 6.1: Full build verification

**Step 1: Run full type check**

```bash
cd packages/extension && npx tsc --noEmit
```

**Step 2: Run WXT build**

```bash
cd packages/extension && npx wxt build
```

**Step 3: Run any existing tests**

```bash
cd packages/extension && npx vitest run 2>/dev/null || echo "No test runner configured"
```

**Step 4: Fix any remaining build errors**

If `tsc` or `wxt build` fails, trace the errors. Common issues:
- Barrel re-exports referencing deleted types → remove the re-export
- `AppState` type intersection referencing removed slices → remove from intersection
- Test file `storeInit.test.ts` may reference `setEditorMode("designer")` → update test

**Step 5: Final commit (if any fixes)**

```bash
git add -A && git commit -m "fix: resolve build errors from dead code cleanup"
```

---

### Task 6.2: Summary verification

After all batches, confirm:

| Item | Before | After |
|------|--------|-------|
| FloatingModeBar + DragHandle | 718 lines | Deleted |
| spatial/ | 1,588 lines | Deleted |
| component-canvas/ | 1,283 lines | Deleted |
| canvas/ | 849 lines | Deleted |
| ThemeSelector + ThemeTransition + PromptBuilderPanel | 406 lines | Deleted |
| LeftPanel | 228 lines | Deleted |
| spatialViewportSlice + componentCanvasSlice | 899 lines | Deleted |
| Dead EditorMode values | 8 dead values | Trimmed to 4 active |
| SettingsBar ModeSelector | ~60 lines dead UI | Removed |
| PreviewCanvas mode display | Shows stale `editorMode` | Shows `mode.topLevel` |
| **Total removed** | **~6,000+ lines** | — |

---

## Out of Scope (tracked separately)

These items were identified during the audit but are NOT part of this cleanup:

1. **toolbar.ts dual-wiring** — legacy click listeners fire alongside `connectToolbarToModeSystem`. Needs careful refactor to avoid breaking on-page toolbar.
2. **Overlay mode migration** — CommentMode/TextEditMode/ComponentIdMode gate on old `editorMode`. Eventually these should integrate with `modeSlice`, but they work via `commentSlice.setEditorMode("comment")` today.
3. **Designer sections contextual filtering** — RightPanel shows all 9 sections regardless of active design sub-mode. Plan envisions filtering per sub-mode.
4. **Wire 4 keyboard tools** (Task 2.W from Phase 1 plan) — position, spacing, flex, move tools are built but not wired into content.ts.
5. **Legacy `content/features/` cleanup** (Task 6.0 from Phase 1 plan) — ~7 files superseded by `modes/tools/`.
