# Plan 3: Chrome Side Panel

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Chrome Side Panel as an action-oriented workflow surface that opens with one click from the extension icon, while keeping DevTools as the inspection-oriented surface.

**Architecture:** The Side Panel is a new WXT entrypoint (`entrypoints/sidepanel/`) that reuses the existing Zustand store and panel hooks. A shared `useActiveTabId()` hook abstracts DevTools-vs-SidePanel tabId resolution. The Side Panel layout has 2 rail tabs (Layers stub, Designer) and a persistent bottom dock (Clipboard + Prompt Builder). A new V-mode on the FAB toolbar accumulates element chips into the Prompt Builder. Cmd+K spotlight is sunset. Components/Assets/Variables scanner panels remain DevTools-only in Plan 3.

**Tech Stack:** TypeScript 5.8, React 19, Zustand 5, WXT, Tailwind v4, Chrome Side Panel API (`chrome.sidePanel`)

**Depends on:** Plan 2 complete (all content-script tools working)

**Brainstorms consolidated:**
- `2026-02-20-fab-first-architecture-brainstorm.md` (decisions 1, 4, 5)
- `2026-02-20-side-panel-brainstorm.md` (layout, rail tabs, bottom dock, V-mode, prompt builder)

---

## Pre-flight

Verify Plan 2 is complete:

```bash
cd /Users/rivermassey/Desktop/dev/DNA/tools/flow
pnpm typecheck                              # 0 errors
pnpm --filter @flow/extension test --run    # 0 failures
pnpm --filter @flow/server test --run       # 0 failures
pnpm build                                  # builds cleanly
```

---

## Task 3.0: Add `sidePanel` permission + action to WXT config

**Why:** Chrome requires the `sidePanel` permission to use `chrome.sidePanel` APIs. WXT requires an `action: {}` manifest entry to wire the extension icon to side panel open behavior (you can't have both a popup and a side-panel-on-click).

**Files:**
- Modify: `packages/extension/wxt.config.ts`

**Step 1: Add permission and action**

In `wxt.config.ts`, add `'sidePanel'` to the permissions array and add `action: {}` to the manifest:

```typescript
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Flow',
    description: 'Visual context tool for AI-assisted web development',
    permissions: ['activeTab', 'scripting', 'storage', 'tabs', 'debugger', 'webNavigation', 'alarms', 'sidePanel'],
    host_permissions: ['<all_urls>'],
    action: {},
  },
});
```

**Step 2: Verify WXT accepts the config**

```bash
pnpm --filter @flow/extension build
```

Expected: Build succeeds. The output `.output/chrome-mv3/manifest.json` should contain `"side_panel"` section and `"action"` section.

**Step 3: Commit**

```bash
git add packages/extension/wxt.config.ts
git commit -m "chore: add sidePanel permission and action to manifest for Chrome Side Panel"
```

---

## Task 3.1: Create Side Panel WXT entrypoint

**Why:** WXT auto-discovers entrypoints from the `entrypoints/` directory. A `sidepanel/` folder with `index.html` and `main.tsx` creates the side panel page. WXT auto-registers `side_panel.default_path` in the manifest.

**Files:**
- Create: `packages/extension/src/entrypoints/sidepanel/index.html`
- Create: `packages/extension/src/entrypoints/sidepanel/main.tsx`

**Step 1: Create the HTML shell**

```html
<!-- packages/extension/src/entrypoints/sidepanel/index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Flow</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

**Step 2: Create the React entrypoint**

```tsx
// packages/extension/src/entrypoints/sidepanel/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { SidePanel } from './SidePanel';
import '../../panel.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SidePanel />
  </React.StrictMode>,
);
```

> **Note:** `panel.css` is the existing Tailwind CSS entry. Check if this path resolves correctly from the new location. If not, adjust the import path or create a shared CSS entry.

**Step 3: Create a minimal SidePanel component (placeholder)**

Create `packages/extension/src/entrypoints/sidepanel/SidePanel.tsx`:

```tsx
// packages/extension/src/entrypoints/sidepanel/SidePanel.tsx
export function SidePanel() {
  return (
    <div className="h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
      <p className="text-sm text-neutral-400">Flow Side Panel — loading...</p>
    </div>
  );
}
```

**Step 4: Verify build**

```bash
pnpm --filter @flow/extension build
```

Expected: Build succeeds. Output contains `sidepanel.html` (WXT may rename it). Check `.output/chrome-mv3/manifest.json` for `"side_panel": { "default_path": "sidepanel.html" }`.

**Step 5: Verify manifest structure**

```bash
cat packages/extension/.output/chrome-mv3/manifest.json | grep -A 2 side_panel
```

Expected: `"side_panel"` entry with `"default_path"`.

**Step 6: Commit**

```bash
git add packages/extension/src/entrypoints/sidepanel/
git commit -m "feat: add Chrome Side Panel WXT entrypoint — shell with placeholder"
```

---

## Task 3.2: Wire background to open Side Panel on action click

**Why:** When the user clicks the extension icon, the Side Panel should open (or toggle). This requires `chrome.sidePanel.open()` from the background service worker, triggered by `chrome.action.onClicked`.

**Files:**
- Modify: `packages/extension/src/entrypoints/background.ts` (~15 lines)

**Step 1: Read current background.ts**

Read `packages/extension/src/entrypoints/background.ts` to find the right place to add the action click handler. Look for existing `chrome.action` or `chrome.browserAction` listeners.

**Step 2: Add action click → side panel open**

At the top level of the background script (after other listener registrations), add:

```typescript
// Open Side Panel when the extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (err) {
    console.warn('[background] Failed to open side panel:', err);
  }
});

// Enable side panel for all tabs
chrome.sidePanel.setOptions({ enabled: true }).catch(() => {});
```

> **Note:** `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })` is another approach but has less control. The explicit `open()` call is more reliable.

**Step 3: Verify build**

```bash
pnpm --filter @flow/extension build
```

Expected: Build succeeds.

**Step 4: Manual test**

Load the unpacked extension from `.output/chrome-mv3/`. Click the Flow icon in the toolbar. The Side Panel should open on the right side showing the placeholder text.

**Step 5: Commit**

```bash
git add packages/extension/src/entrypoints/background.ts
git commit -m "feat: open Side Panel on extension icon click — chrome.action.onClicked handler"
```

---

## Task 3.3: Create `useActiveTabId` hook + abstract tabId resolution

**Why:** The DevTools panel gets its tabId synchronously from `chrome.devtools.inspectedWindow.tabId`. The Side Panel must use `chrome.tabs.query()` (async) and react to `chrome.tabs.onActivated`. This hook abstracts both cases so all downstream code (contentBridge, mutationBridge, etc.) works in either context.

**Files:**
- Create: `packages/extension/src/panel/hooks/useActiveTabId.ts`
- Create: `packages/extension/src/panel/hooks/__tests__/useActiveTabId.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/extension/src/panel/hooks/__tests__/useActiveTabId.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActiveTabId } from '../useActiveTabId';

// Mock chrome APIs
const mockQuery = vi.fn();
const mockOnActivated = { addListener: vi.fn(), removeListener: vi.fn() };
const mockOnRemoved = { addListener: vi.fn(), removeListener: vi.fn() };

vi.stubGlobal('chrome', {
  tabs: {
    query: mockQuery,
    onActivated: mockOnActivated,
    onRemoved: mockOnRemoved,
  },
  devtools: undefined, // Not in DevTools context
});

describe('useActiveTabId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves tabId from chrome.tabs.query on mount', async () => {
    mockQuery.mockResolvedValue([{ id: 42 }]);

    const { result } = renderHook(() => useActiveTabId());

    // Initially null while async query resolves
    expect(result.current).toBeNull();

    // After query resolves
    await vi.waitFor(() => {
      expect(result.current).toBe(42);
    });
  });

  it('returns null when no active tab', async () => {
    mockQuery.mockResolvedValue([]);

    const { result } = renderHook(() => useActiveTabId());

    await vi.waitFor(() => {
      expect(result.current).toBeNull();
    });
  });

  it('registers onActivated listener', () => {
    mockQuery.mockResolvedValue([{ id: 1 }]);

    renderHook(() => useActiveTabId());

    expect(mockOnActivated.addListener).toHaveBeenCalledTimes(1);
  });

  it('cleans up listeners on unmount', () => {
    mockQuery.mockResolvedValue([{ id: 1 }]);

    const { unmount } = renderHook(() => useActiveTabId());
    unmount();

    expect(mockOnActivated.removeListener).toHaveBeenCalledTimes(1);
    expect(mockOnRemoved.removeListener).toHaveBeenCalledTimes(1);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm --filter @flow/extension exec vitest run src/panel/hooks/__tests__/useActiveTabId.test.ts
```

Expected: FAIL — module not found.

**Step 3: Write the implementation**

```typescript
// packages/extension/src/panel/hooks/useActiveTabId.ts
import { useState, useEffect } from 'react';

/**
 * Resolves the active tab ID for the current window.
 *
 * In a DevTools panel context, use `chrome.devtools.inspectedWindow.tabId` directly.
 * In a Side Panel context, this hook queries `chrome.tabs` and listens for tab changes.
 *
 * Returns `null` until the tabId is resolved.
 */
export function useActiveTabId(): number | null {
  const [tabId, setTabId] = useState<number | null>(null);

  useEffect(() => {
    // Query the active tab on mount
    chrome.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => {
        const activeTab = tabs[0];
        if (activeTab?.id) {
          setTabId(activeTab.id);
        }
      })
      .catch(() => {
        // Extension context may not have tabs permission in all states
      });

    // Listen for tab activation changes
    const handleActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
      setTabId(activeInfo.tabId);
    };

    // Listen for tab removal (clear if our tab is closed)
    const handleRemoved = (removedTabId: number) => {
      setTabId((current) => (current === removedTabId ? null : current));
    };

    chrome.tabs.onActivated.addListener(handleActivated);
    chrome.tabs.onRemoved.addListener(handleRemoved);

    return () => {
      chrome.tabs.onActivated.removeListener(handleActivated);
      chrome.tabs.onRemoved.removeListener(handleRemoved);
    };
  }, []);

  return tabId;
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm --filter @flow/extension exec vitest run src/panel/hooks/__tests__/useActiveTabId.test.ts
```

Expected: All tests pass.

**Step 5: Export from hooks index**

In `packages/extension/src/panel/hooks/index.ts`, add:

```typescript
export { useActiveTabId } from "./useActiveTabId";
```

**Step 6: Verify typecheck**

```bash
pnpm --filter @flow/extension typecheck
```

Expected: 0 errors.

**Step 7: Commit**

```bash
git add packages/extension/src/panel/hooks/useActiveTabId.ts \
       packages/extension/src/panel/hooks/__tests__/useActiveTabId.test.ts \
       packages/extension/src/panel/hooks/index.ts
git commit -m "feat: add useActiveTabId hook — abstract tabId for Side Panel context"
```

---

## Task 3.4: Abstract `cdpBridge` tabId to accept parameter

**Why:** `cdpBridge.ts` has a module-level `chrome.devtools.inspectedWindow.tabId` that fails outside DevTools. The `cdp()` function needs to accept tabId as a parameter so the Side Panel can use it.

**Files:**
- Modify: `packages/extension/src/panel/api/cdpBridge.ts`

**Step 1: Read current cdpBridge.ts**

Read the file to understand the current `cdp()` signature and usage.

**Step 2: Add tabId parameter**

Change the `cdp()` function signature to accept an optional `tabId`:

```typescript
// Before:
const tabId = chrome.devtools.inspectedWindow.tabId;
export async function cdp(method: string, params?: Record<string, unknown>): Promise<unknown> {
  return chrome.runtime.sendMessage({ type: 'cdp:command', tabId, payload: { method, params } });
}

// After:
/**
 * Send a CDP command to the background service worker.
 * tabId is required in Side Panel context. In DevTools, falls back to inspectedWindow.tabId.
 */
export async function cdp(
  method: string,
  params?: Record<string, unknown>,
  targetTabId?: number,
): Promise<unknown> {
  const resolvedTabId = targetTabId ?? chrome.devtools?.inspectedWindow?.tabId;
  if (!resolvedTabId) {
    throw new Error('[cdpBridge] No tabId available — pass tabId explicitly in Side Panel context');
  }
  return chrome.runtime.sendMessage({
    type: 'cdp:command',
    tabId: resolvedTabId,
    payload: { method, params },
  });
}
```

**Step 3: Update callers**

Search for all `cdp(` calls in the panel code. Most are in:
- `screenshotService.ts` — `cdp('Page.captureScreenshot', ...)`
- `highlightService.ts` — `cdp('Overlay.highlightNode', ...)`
- `pseudoStates.ts` — `cdp('CSS.forcePseudoState', ...)`

These callers currently don't pass tabId (they rely on the module-level const). Since the `targetTabId` parameter is optional and falls back to `chrome.devtools?.inspectedWindow?.tabId`, **existing DevTools panel callers continue to work without changes**.

Side Panel callers will need to pass tabId explicitly — but that wiring happens in Task 3.5 when we build the SidePanel component.

**Step 4: Verify typecheck**

```bash
pnpm --filter @flow/extension typecheck
```

Expected: 0 errors.

**Step 5: Verify tests**

```bash
pnpm --filter @flow/extension test --run
```

Expected: 0 failures (no behavior change for existing callers).

**Step 6: Commit**

```bash
git add packages/extension/src/panel/api/cdpBridge.ts
git commit -m "refactor: make cdpBridge.cdp() accept explicit tabId — Side Panel compatibility"
```

---

## Task 3.5: Build SidePanel component with connection logic

**Why:** The Side Panel needs its own top-level component that mirrors `Panel.tsx`'s connection logic but uses `useActiveTabId()` instead of `chrome.devtools.inspectedWindow.tabId`. It also needs to reconnect the contentBridge when the active tab changes.

**Files:**
- Modify: `packages/extension/src/entrypoints/sidepanel/SidePanel.tsx`

**Step 1: Extract shared connection logic from Panel.tsx**

Read `packages/extension/src/entrypoints/panel/Panel.tsx` carefully. The connection logic (lines 178-528) does these things:
1. Gets tabId
2. Calls `initContentBridge(tabId)`
3. Subscribes to content messages (element selection, mode changes, comments, prompt actions, etc.)
4. Subscribes to Zustand store changes and broadcasts `flow:state-sync` + `panel:session-data`
5. Handles disconnect/reconnect

Most of this is identical between DevTools panel and Side Panel. The ONLY difference is tabId source.

**Step 2: Create a shared `usePanelConnection` hook**

Create `packages/extension/src/panel/hooks/usePanelConnection.ts` that extracts the shared connection logic from `Panel.tsx`. This hook takes `tabId: number | null` and returns the same connection state + inspection context.

```typescript
// packages/extension/src/panel/hooks/usePanelConnection.ts
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  type BackgroundToPanelMessage,
  type ElementHoveredMessage,
  type ElementSelectedMessage,
  type InspectionResult,
  type MutationDiff,
  type MutationStateEvent,
  type ModeState,
  type PromptChip,
} from '@flow/shared';
import { useMutationBridge } from './useMutationBridge';
import { useTextEditBridge } from './useTextEditBridge';
import { usePromptAutoCompile } from './usePromptAutoCompile';
import { useSessionSync } from './useSessionSync';
import { useAppStore, type EditorMode } from '../stores/appStore';
import type { FeedbackType } from '../stores/types';
import { useSessionAutoSave } from './useSessionAutoSave';
import { useSessionRestore } from './useSessionRestore';
import {
  initContentBridge,
  disconnectContentBridge,
  onContentMessage,
} from '../api/contentBridge';
import {
  isRuntimeMessagingError,
  safePortPostMessage,
} from '../../utils/runtimeSafety';

// ... (Extract the full message handler, state sync, and connection logic
//      from Panel.tsx lines 73-528 into this hook.
//      The hook signature is:
//
//      export function usePanelConnection(tabId: number | null): InspectionContextValue
//
//      It returns the same InspectionContextValue that Panel.tsx's context provides.)
```

> **Implementation note:** This is a large extraction. Copy the entire `useEffect` block from `Panel.tsx` (the one that calls `initContentBridge`), the store subscription, and all message handlers into this new hook. Replace the two `chrome.devtools.inspectedWindow.tabId` references with the `tabId` parameter. Add an early return / no-op when `tabId === null`.

**Step 3: Refactor Panel.tsx to use the shared hook**

```typescript
// Panel.tsx becomes:
import { usePanelConnection } from '../../panel/hooks/usePanelConnection';

export function Panel() {
  const tabId = chrome.devtools.inspectedWindow.tabId;
  const contextValue = usePanelConnection(tabId);

  return (
    <InspectionContext.Provider value={contextValue}>
      <EditorLayout />
    </InspectionContext.Provider>
  );
}
```

Keep the `InspectionContext` definition and `useInspection()` hook in `Panel.tsx` (they're exported and used by child components).

**Step 4: Build SidePanel.tsx using the shared hook**

```tsx
// packages/extension/src/entrypoints/sidepanel/SidePanel.tsx
import { useActiveTabId } from '../../panel/hooks/useActiveTabId';
import { usePanelConnection } from '../../panel/hooks/usePanelConnection';
import { InspectionContext } from '../panel/Panel';  // Re-use the same context
import { SidePanelLayout } from '../../panel/components/layout/SidePanelLayout';

export function SidePanel() {
  const tabId = useActiveTabId();
  const contextValue = usePanelConnection(tabId);

  if (tabId === null) {
    return (
      <div className="h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <p className="text-sm text-neutral-400">Waiting for active tab...</p>
      </div>
    );
  }

  return (
    <InspectionContext.Provider value={contextValue}>
      <SidePanelLayout />
    </InspectionContext.Provider>
  );
}
```

> **Note:** `SidePanelLayout` doesn't exist yet — it's created in Task 3.6. For now, use `<EditorLayout />` as a drop-in to verify the connection works, then switch to `SidePanelLayout` after Task 3.6.

**Step 5: Handle tab change reconnection in usePanelConnection**

The hook must detect when `tabId` changes and:
1. Disconnect the old contentBridge
2. Reconnect to the new tab's content script

Add a `useEffect` that depends on `tabId`:

```typescript
useEffect(() => {
  if (tabId === null) return;

  // Disconnect previous bridge (if any) and connect to new tab
  disconnectContentBridge();
  const port = initContentBridge(tabId);
  // ... same setup as before

  return () => {
    disconnectContentBridge();
  };
}, [tabId]);
```

**Step 6: Export InspectionContext from a shared location**

Move `InspectionContext`, `InspectionContextValue`, and `useInspection()` from `Panel.tsx` into a new shared file:

Create `packages/extension/src/panel/context/InspectionContext.ts`:

```typescript
import { createContext, useContext } from 'react';
import type { ElementHoveredMessage, ElementSelectedMessage, InspectionResult } from '@flow/shared';

export interface InspectionContextValue {
  hoveredElement: ElementHoveredMessage['payload'] | null;
  selectedElement: ElementSelectedMessage['payload'] | null;
  inspectionResult: InspectionResult | null;
  agentGlobals: string[];
  connected: boolean;
  textEditActive: boolean;
  setTextEditActive: (active: boolean) => void;
  undo: () => void;
  redo: () => void;
  clearMutations: () => void;
  applyStyle: (styleChanges: Record<string, string>) => void;
  activeSelectors: string[];
}

export const InspectionContext = createContext<InspectionContextValue | null>(null);

export function useInspection() {
  const ctx = useContext(InspectionContext);
  if (!ctx) {
    throw new Error('useInspection must be used within Panel or SidePanel');
  }
  return ctx;
}
```

Update all `useInspection()` importers to point to the new shared location instead of `Panel.tsx`.

**Step 7: Verify typecheck + tests**

```bash
pnpm --filter @flow/extension typecheck
pnpm --filter @flow/extension test --run
```

Expected: 0 errors, 0 failures.

**Step 8: Manual test**

1. Build and load unpacked extension
2. Navigate to any page
3. Click the Flow icon → Side Panel opens
4. Enable Flow via FAB
5. Click an element → Side Panel should show element data in the Designer tab

**Step 9: Commit**

```bash
git add packages/extension/src/panel/hooks/usePanelConnection.ts \
       packages/extension/src/panel/context/InspectionContext.ts \
       packages/extension/src/entrypoints/panel/Panel.tsx \
       packages/extension/src/entrypoints/sidepanel/SidePanel.tsx
git commit -m "feat: wire SidePanel connection — shared usePanelConnection hook, useActiveTabId, tab change reconnection"
```

---

## Task 3.6: Create SidePanelLayout with action rail tabs

**Why:** The Side Panel is action-oriented in Plan 3. Keep scanner/inspection-heavy panels in DevTools for now to avoid `chrome.devtools.*` coupling in Side Panel context.

**Files:**
- Create: `packages/extension/src/panel/components/layout/SidePanelLayout.tsx`
- Create: `packages/extension/src/panel/components/layout/RailTabBar.tsx`

**Step 1: Define the rail tab type**

```typescript
// In RailTabBar.tsx
export type SidePanelTabId =
  | 'layers'
  | 'designer';
```

**Step 2: Create RailTabBar**

A horizontal icon strip at the top of the Side Panel with 2 tabs:
- `layers` (stub in Plan 3; real implementation in Plan 4)
- `designer` (active action tab)

```tsx
// packages/extension/src/panel/components/layout/RailTabBar.tsx
import { useCallback } from 'react';

export type SidePanelTabId =
  | 'layers'
  | 'designer';

interface TabConfig {
  id: SidePanelTabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  { id: 'layers', label: 'Layers', icon: <LayersIcon /> },
  { id: 'designer', label: 'Designer', icon: <PaintbrushIcon /> },
];

interface RailTabBarProps {
  activeTab: SidePanelTabId;
  onTabChange: (tab: SidePanelTabId) => void;
}

export function RailTabBar({ activeTab, onTabChange }: RailTabBarProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = TABS.findIndex((t) => t.id === activeTab);
      let nextIndex: number | null = null;

      if (e.key === 'ArrowRight') {
        nextIndex = currentIndex < TABS.length - 1 ? currentIndex + 1 : 0;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : TABS.length - 1;
      }

      if (nextIndex !== null) {
        e.preventDefault();
        onTabChange(TABS[nextIndex].id);
      }
    },
    [activeTab, onTabChange],
  );

  return (
    <div
      className="h-9 shrink-0 flex items-center gap-0.5 px-1 border-b border-neutral-800 bg-neutral-900"
      role="tablist"
      aria-label="Side Panel tabs"
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`sp-tabpanel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
            title={tab.label}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function LayersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function PaintbrushIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
      <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
      <path d="M14.5 17.5 4.5 15" />
    </svg>
  );
}
```

**Step 3: Create SidePanelLayout**

```tsx
// packages/extension/src/panel/components/layout/SidePanelLayout.tsx
import { useState, useEffect } from 'react';
import { RailTabBar, type SidePanelTabId } from './RailTabBar';
import { DesignerContent } from './RightPanel';
import { BottomDock } from './BottomDock';
import { useAppStore } from '../../stores/appStore';
import { DogfoodBoundary } from '../ui/DogfoodBoundary';

function SidePanelTabContent({ tab }: { tab: SidePanelTabId }) {
  switch (tab) {
    case 'layers':
      return <LayersStub />;
    case 'designer':
      return <DesignerContent />;
  }
}

/** Layers tab placeholder — built in Plan 4. */
function LayersStub() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-2 p-4">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
      <p className="text-xs">Layers panel — coming in Plan 4</p>
    </div>
  );
}

export function SidePanelLayout() {
  const [activeTab, setActiveTab] = useState<SidePanelTabId>('layers');
  const activePanel = useAppStore((s) => s.activePanel);

  // Drive tab focus from UI panel intents (e.g. typography focus while in T mode)
  useEffect(() => {
    if (!activePanel) return;
    if (
      activePanel === 'typography' ||
      activePanel === 'layout' ||
      activePanel === 'spacing' ||
      activePanel === 'colors'
    ) {
      setActiveTab('designer');
    }
  }, [activePanel]);

  return (
    <DogfoodBoundary name="SidePanelLayout" file="layout/SidePanelLayout.tsx" category="layout">
      <div className="h-screen flex flex-col overflow-hidden bg-neutral-950 text-neutral-100">
        {/* Rail Tab Bar */}
        <RailTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div
          id={`sp-tabpanel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={activeTab}
          className="flex-1 overflow-y-auto bg-neutral-900"
        >
          <SidePanelTabContent tab={activeTab} />
        </div>

        {/* Bottom Dock — Clipboard + Prompt Builder */}
        <BottomDock />
      </div>
    </DogfoodBoundary>
  );
}
```

> **Note:** `BottomDock` is created in Task 3.7. For now, create a stub:
>
> Create `packages/extension/src/panel/components/layout/BottomDock.tsx`:
> ```tsx
> export function BottomDock() {
>   return (
>     <div className="h-10 shrink-0 border-t border-neutral-800 bg-neutral-900 flex items-center justify-center">
>       <span className="text-[10px] text-neutral-500">Clipboard | Prompt Builder</span>
>     </div>
>   );
> }
> ```

**Step 4: Update SidePanel.tsx to use SidePanelLayout**

In `packages/extension/src/entrypoints/sidepanel/SidePanel.tsx`, replace `<EditorLayout />` with `<SidePanelLayout />`.

**Step 5: Verify typecheck + build**

```bash
pnpm --filter @flow/extension typecheck
pnpm --filter @flow/extension build
```

Expected: 0 errors.

**Step 6: Manual test**

Load unpacked extension. Click icon → Side Panel opens with rail tabs. Click between Layers and Designer. Layers shows the stub; Designer renders action tools.

**Step 7: Commit**

```bash
git add packages/extension/src/panel/components/layout/RailTabBar.tsx \
       packages/extension/src/panel/components/layout/SidePanelLayout.tsx \
       packages/extension/src/panel/components/layout/BottomDock.tsx \
       packages/extension/src/entrypoints/sidepanel/SidePanel.tsx
git commit -m "feat: Side Panel layout — action rail tabs (Layers/Designer) + bottom dock stub"
```

---

## Task 3.7: Build Bottom Dock — Clipboard + Prompt Builder

**Why:** The bottom dock is the Side Panel's persistent workspace. The Clipboard tab auto-accumulates mutations, comments, and questions with a "Copy all as .md" export. The Prompt Builder tab is a chip-based text area for surgical context curation (replaces Cmd+K spotlight).

**Files:**
- Modify: `packages/extension/src/panel/components/layout/BottomDock.tsx`
- Create: `packages/extension/src/panel/components/layout/ClipboardDock.tsx`
- Create: `packages/extension/src/panel/components/layout/PromptBuilderDock.tsx`

**Step 1: Build ClipboardDock**

```tsx
// packages/extension/src/panel/components/layout/ClipboardDock.tsx
import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';

type FilterSection = 'mutations' | 'comments' | 'questions';

export function ClipboardDock() {
  const mutationDiffs = useAppStore((s) => s.mutationDiffs);
  const comments = useAppStore((s) => s.comments);
  const [activeFilters, setActiveFilters] = useState<Set<FilterSection>>(
    new Set(['mutations', 'comments', 'questions']),
  );

  const questions = comments.filter((c) => c.type === 'question');
  const nonQuestions = comments.filter((c) => c.type !== 'question');

  const toggleFilter = (section: FilterSection) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const exportAsMarkdown = () => {
    const lines: string[] = ['# Flow Session Export\n'];

    if (activeFilters.has('mutations') && mutationDiffs.length > 0) {
      lines.push('## Design Changes\n');
      for (const diff of mutationDiffs) {
        lines.push(`- **${diff.element.selector}**`);
        for (const change of diff.changes) {
          lines.push(`  - \`${change.property}\`: ${change.oldValue} → ${change.newValue}`);
        }
      }
      lines.push('');
    }

    if (activeFilters.has('comments') && nonQuestions.length > 0) {
      lines.push('## Comments\n');
      for (const c of nonQuestions) {
        lines.push(`- **${c.componentName}** (${c.elementSelector}): ${c.content}`);
      }
      lines.push('');
    }

    if (activeFilters.has('questions') && questions.length > 0) {
      lines.push('## Questions\n');
      for (const q of questions) {
        lines.push(`- **${q.componentName}** (${q.elementSelector}): ${q.content}`);
      }
      lines.push('');
    }

    navigator.clipboard.writeText(lines.join('\n')).catch(() => {});
  };

  const totalCount = mutationDiffs.length + comments.length;

  return (
    <div className="flex flex-col gap-1 p-2 text-xs">
      {/* Filter chips */}
      <div className="flex items-center gap-1">
        <FilterChip
          label={`Changes (${mutationDiffs.length})`}
          active={activeFilters.has('mutations')}
          onClick={() => toggleFilter('mutations')}
        />
        <FilterChip
          label={`Comments (${nonQuestions.length})`}
          active={activeFilters.has('comments')}
          onClick={() => toggleFilter('comments')}
        />
        <FilterChip
          label={`Questions (${questions.length})`}
          active={activeFilters.has('questions')}
          onClick={() => toggleFilter('questions')}
        />
        <button
          onClick={exportAsMarkdown}
          disabled={totalCount === 0}
          className="ml-auto px-2 py-0.5 rounded text-[10px] bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Copy as .md
        </button>
      </div>

      {/* Content preview */}
      <div className="max-h-32 overflow-y-auto text-neutral-400">
        {totalCount === 0 ? (
          <p className="text-neutral-600 text-center py-2">
            Make changes, add comments, or ask questions — they accumulate here.
          </p>
        ) : (
          <>
            {activeFilters.has('mutations') &&
              mutationDiffs.map((diff, i) => (
                <div key={`m-${i}`} className="py-0.5 border-b border-neutral-800">
                  <span className="text-blue-400">{diff.element.selector}</span>
                  <span className="text-neutral-600"> — {diff.changes.length} changes</span>
                </div>
              ))}
            {activeFilters.has('comments') &&
              nonQuestions.map((c) => (
                <div key={c.id} className="py-0.5 border-b border-neutral-800">
                  <span className="text-green-400">{c.componentName}</span>
                  <span className="text-neutral-500"> {c.content.slice(0, 60)}</span>
                </div>
              ))}
            {activeFilters.has('questions') &&
              questions.map((q) => (
                <div key={q.id} className="py-0.5 border-b border-neutral-800">
                  <span className="text-yellow-400">{q.componentName}</span>
                  <span className="text-neutral-500"> {q.content.slice(0, 60)}</span>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
        active
          ? 'bg-neutral-700 text-neutral-200'
          : 'bg-neutral-800 text-neutral-500'
      }`}
    >
      {label}
    </button>
  );
}
```

**Step 2: Build PromptBuilderDock**

This renders the prompt draft (text + chips) from `promptBuilderSlice`. It's a simplified version of `PromptPalette.tsx` without the `cmdk` search — just a text input area with chip rendering.

```tsx
// packages/extension/src/panel/components/layout/PromptBuilderDock.tsx
import { useState, useRef, useCallback } from 'react';
import { useAppStore } from '../../stores/appStore';

export function PromptBuilderDock() {
  const promptDraft = useAppStore((s) => s.promptDraft);
  const insertPromptDraftText = useAppStore((s) => s.insertPromptDraftText);
  const removePromptDraftNode = useAppStore((s) => s.removePromptDraftNode);
  const clearPromptDraft = useAppStore((s) => s.clearPromptDraft);
  const copyToClipboard = useAppStore((s) => s.copyToClipboard);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && inputValue.trim()) {
        e.preventDefault();
        insertPromptDraftText(inputValue.trim());
        setInputValue('');
      }
      // Backspace on empty input removes last node
      if (e.key === 'Backspace' && !inputValue && promptDraft.length > 0) {
        const lastNode = promptDraft[promptDraft.length - 1];
        removePromptDraftNode(lastNode.id);
      }
    },
    [inputValue, promptDraft, insertPromptDraftText, removePromptDraftNode],
  );

  return (
    <div className="flex flex-col gap-1 p-2 text-xs">
      {/* Draft nodes (chips + text) */}
      <div className="flex flex-wrap gap-1 min-h-[24px]">
        {promptDraft.map((node) => {
          if (node.type === 'chip') {
            return (
              <span
                key={node.id}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-300 text-[10px]"
              >
                <span className="opacity-60">{node.chip.kind}:</span>
                {node.chip.label}
                <button
                  onClick={() => removePromptDraftNode(node.id)}
                  className="ml-0.5 opacity-40 hover:opacity-100"
                >
                  x
                </button>
              </span>
            );
          }
          if (node.type === 'text') {
            return (
              <span
                key={node.id}
                className="text-neutral-300 text-[11px]"
              >
                {node.text}
              </span>
            );
          }
          return null;
        })}
      </div>

      {/* Input + actions */}
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type text or use V-mode to add chips..."
          className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-[11px] text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-blue-600"
        />
        <button
          onClick={() => copyToClipboard()}
          disabled={promptDraft.length === 0}
          className="px-2 py-1 rounded text-[10px] bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Copy
        </button>
        {promptDraft.length > 0 && (
          <button
            onClick={() => clearPromptDraft()}
            className="px-1.5 py-1 rounded text-[10px] text-neutral-500 hover:text-neutral-300"
          >
            Clear
          </button>
        )}
      </div>

      <p className="text-[9px] text-neutral-600">
        V-mode: Cmd+click elements to add chips. Enter to add text.
      </p>
    </div>
  );
}
```

**Step 3: Update BottomDock to compose Clipboard + Prompt Builder**

```tsx
// packages/extension/src/panel/components/layout/BottomDock.tsx
import { useState } from 'react';
import { ClipboardDock } from './ClipboardDock';
import { PromptBuilderDock } from './PromptBuilderDock';
import { useAppStore } from '../../stores/appStore';

type DockTab = 'clipboard' | 'prompt';

export function BottomDock() {
  const [activeTab, setActiveTab] = useState<DockTab>('clipboard');
  const [expanded, setExpanded] = useState(false);
  const mutationCount = useAppStore((s) => s.mutationDiffs.length);
  const commentCount = useAppStore((s) => s.comments.length);
  const promptCount = useAppStore((s) => s.promptDraft.length);

  return (
    <div
      className={`shrink-0 border-t border-neutral-800 bg-neutral-900 transition-all ${
        expanded ? 'max-h-64' : 'max-h-10'
      }`}
    >
      {/* Tab header */}
      <div className="h-10 flex items-center gap-0.5 px-2">
        <DockTabButton
          label="Clipboard"
          badge={mutationCount + commentCount}
          active={activeTab === 'clipboard'}
          onClick={() => {
            setActiveTab('clipboard');
            setExpanded(true);
          }}
        />
        <DockTabButton
          label="Prompt Builder"
          badge={promptCount}
          active={activeTab === 'prompt'}
          onClick={() => {
            setActiveTab('prompt');
            setExpanded(true);
          }}
        />
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-auto p-1 text-neutral-500 hover:text-neutral-300"
          title={expanded ? 'Collapse' : 'Expand'}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      </div>

      {/* Content */}
      {expanded && (
        <div className="overflow-hidden">
          {activeTab === 'clipboard' ? <ClipboardDock /> : <PromptBuilderDock />}
        </div>
      )}
    </div>
  );
}

function DockTabButton({
  label,
  badge,
  active,
  onClick,
}: {
  label: string;
  badge: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded text-[11px] transition-colors ${
        active
          ? 'bg-neutral-800 text-neutral-200'
          : 'text-neutral-500 hover:text-neutral-300'
      }`}
    >
      {label}
      {badge > 0 && (
        <span className="ml-1 px-1 py-0 rounded-full text-[9px] bg-blue-600/30 text-blue-300">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
```

**Step 4: Verify typecheck + build**

```bash
pnpm --filter @flow/extension typecheck
pnpm --filter @flow/extension build
```

Expected: 0 errors.

**Step 5: Manual test**

Side Panel bottom dock: click Clipboard tab, make some design changes, verify they appear. Click Prompt Builder tab, type text and press Enter, verify it shows as a text node.

**Step 6: Commit**

```bash
git add packages/extension/src/panel/components/layout/BottomDock.tsx \
       packages/extension/src/panel/components/layout/ClipboardDock.tsx \
       packages/extension/src/panel/components/layout/PromptBuilderDock.tsx
git commit -m "feat: bottom dock — Clipboard (mutations+comments export) + Prompt Builder (chip-based text)"
```

---

## Task 3.8: Add V-mode to FAB toolbar

**Why:** V-mode is the new top-level mode on the FAB toolbar. When active, clicking an element adds an element chip to the Side Panel Prompt Builder. This replaces the Cmd+K spotlight workflow for surgical context building.

**Files:**
- Modify: `packages/shared/src/types/modes.ts` (~10 lines)
- Modify: `packages/extension/src/content/ui/toolbar.ts` (~15 lines)
- Modify: `packages/extension/src/entrypoints/content.ts` (~20 lines)

**Step 1: Add `vmodeSelect` in shared mode config**

In `packages/shared/src/types/modes.ts`:
1. Add `'vmodeSelect'` to `TopLevelMode`.
2. Add a `TOP_LEVEL_MODES` entry so hotkeys/interception/hover behavior is driven by the shared config.

```typescript
export type TopLevelMode =
  | 'default'
  | 'select'
  | 'design'
  | 'inspect'
  | 'editText'
  | 'move'
  | 'comment'
  | 'question'
  | 'search'
  | 'vmodeSelect';  // New: V-mode for prompt builder chip accumulation

// In TOP_LEVEL_MODES:
{
  id: 'vmodeSelect',
  hotkey: 'v',
  label: 'V Mode',
  interceptsEvents: true,
  showsHoverOverlay: true,
},
```

> `modeHotkeys.ts` already derives bindings from `TOP_LEVEL_MODES`, so no explicit hotkey registration change is needed.

**Step 2: Add V button to FAB toolbar**

In `packages/extension/src/content/ui/toolbar.ts`, add a button for V-mode in the mode bar alongside the existing buttons (Select, Design, Comment, etc.):

```typescript
// Add to the TOOLBAR_MODES array or equivalent:
{ mode: 'vmodeSelect', label: 'V', title: 'V-Mode: click to add context chips' },
```

**Step 3: Handle V-mode clicks in content.ts**

In `packages/extension/src/entrypoints/content.ts`, in the click handler, add a V-mode path. When V-mode is active, create an element chip and send it to the panel prompt builder:

```typescript
// In the onClick handler, before other mode checks:
if (topLevelMode === 'vmodeSelect') {
  const selector = generateSelector(el);
  const tagName = el.tagName.toLowerCase();
  const componentName = el.getAttribute('data-component') || tagName;
  const classList = Array.from(el.classList).join('.');

  // Send chip to panel prompt builder
  postToPort({
    type: 'flow:prompt-action',
    payload: {
      action: 'insert-chip',
      chip: {
        kind: 'element',
        label: componentName + (classList ? '.' + classList : ''),
        selector,
      },
    },
  });

  // Visual feedback: brief flash on the element
  flashElement(el);
  return;
}
```

**Step 4: Verify typecheck + tests**

```bash
pnpm --filter @flow/extension typecheck
pnpm --filter @flow/extension test --run
```

Expected: 0 errors, 0 failures.

**Step 5: Manual test**

1. Enable Flow
2. Press V to enter V-mode (cursor should change to crosshair)
3. Click an element
4. Open Side Panel → Prompt Builder tab → chip should appear
5. Press Escape to exit V-mode

**Step 6: Commit**

```bash
git add packages/shared/src/types/modes.ts \
       packages/extension/src/content/ui/toolbar.ts \
       packages/extension/src/entrypoints/content.ts
git commit -m "feat: add V-mode to FAB — click elements to add chips to Side Panel prompt builder"
```

---

## Task 3.9: Sunset Cmd+K spotlight

**Why:** The on-page Cmd+K spotlight (PromptPalette + cmdk library) is replaced by the Side Panel's Prompt Builder + V-mode. Removing it reduces content script size and eliminates the on-page React mount.

**Files:**
- Delete: `packages/extension/src/content/ui/commandPalette/PromptPalette.tsx`
- Delete: `packages/extension/src/content/ui/commandPalette/promptPalette.css`
- Modify: `packages/extension/src/content/ui/spotlight.ts` (gut the Cmd+K trigger)
- Modify: `packages/extension/src/entrypoints/content.ts` (remove spotlight initialization)

**Step 1: Check spotlight.ts for what it does**

Read `spotlight.ts` to understand its full scope. It may do more than just Cmd+K — if so, preserve the non-spotlight parts.

**Step 2: Remove Cmd+K keybinding**

In `spotlight.ts`, remove the `keydown` listener that opens the spotlight on Cmd+K. If the entire file is only the spotlight, delete it.

If `spotlight.ts` also handles other things (like the `stateBridge` initialization), extract those into their own module first.

**Step 3: Remove spotlight initialization from content.ts**

In `content.ts`, find where `initSpotlight()` or similar is called and remove it.

**Step 4: Delete PromptPalette files**

```bash
rm packages/extension/src/content/ui/commandPalette/PromptPalette.tsx
rm packages/extension/src/content/ui/commandPalette/promptPalette.css
```

If the `commandPalette/` directory is now empty, delete it:

```bash
rmdir packages/extension/src/content/ui/commandPalette
```

**Step 5: Check if `cmdk` can be uninstalled**

```bash
grep -r "cmdk" packages/extension/src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v __tests__
```

If no remaining references to `cmdk`, remove it from dependencies:

```bash
cd packages/extension && pnpm remove cmdk
```

**Step 6: Verify typecheck + tests + build**

```bash
pnpm typecheck
pnpm --filter @flow/extension test --run
pnpm --filter @flow/extension build
```

Expected: 0 errors, 0 failures, build succeeds.

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: sunset Cmd+K spotlight — replaced by Side Panel Prompt Builder + V-mode"
```

---

## Task 3.10: Wire or delete orphaned context panels

**Why:** Three context panels (`SearchPanel`, `ImageSwapPanel`, `ScreenshotPanel`) are exported but never rendered in any layout. Decision: wire useful ones into the Side Panel or delete them.

**Files:**
- Inspect: `packages/extension/src/panel/components/context/SearchPanel.tsx`
- Inspect: `packages/extension/src/panel/components/context/ImageSwapPanel.tsx`
- Inspect: `packages/extension/src/panel/components/context/ScreenshotPanel.tsx`
- Modify: `packages/extension/src/panel/components/context/index.ts`

**Step 1: Evaluate each panel**

Read each panel to assess value:

- **SearchPanel** — searches DOM by selector/text/attribute. Valuable for the Layers panel (Plan 4). Keep but don't wire yet — Layers tab will integrate search.
- **ImageSwapPanel** — swaps page images with uploaded/URL alternatives. Niche, low priority. Delete.
- **ScreenshotPanel** — captures screenshots via CDP. Now that screenshot is wired (Plan 2 Task 2.4), this panel could be useful. But it's complex and the Side Panel has limited space. Delete — screenshot functionality lives in the CDP service and can be re-exposed as a toolbar action later.

**Step 2: Delete ImageSwapPanel and ScreenshotPanel**

```bash
rm packages/extension/src/panel/components/context/ImageSwapPanel.tsx
rm packages/extension/src/panel/components/context/ScreenshotPanel.tsx
```

**Step 3: Update context/index.ts**

Remove the deleted panel exports. Keep `SearchPanel` and `AccessibilityPanel`.

**Step 4: Check for any remaining imports**

```bash
grep -r "ImageSwapPanel\|ScreenshotPanel" packages/extension/src/ --include="*.ts" --include="*.tsx"
```

Fix any remaining references.

**Step 5: Verify typecheck + tests**

```bash
pnpm typecheck
pnpm --filter @flow/extension test --run
```

Expected: 0 errors, 0 failures.

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: delete orphaned ImageSwapPanel + ScreenshotPanel — SearchPanel kept for Layers integration"
```

---

## Task 3.11: Final verification

**Step 1: Run full suite**

```bash
pnpm typecheck                              # 0 errors across all packages
pnpm --filter @flow/extension test --run    # 0 failures
pnpm --filter @flow/server test --run       # 0 failures
pnpm --filter @flow/extension build         # builds cleanly
```

**Step 2: Verify Side Panel E2E**

Manual smoke test:
1. Load unpacked extension from `.output/chrome-mv3/`
2. Navigate to any web page
3. Click the Flow icon in the toolbar → Side Panel opens on the right
4. Click the FAB to enable Flow
5. Click an element on the page → Side Panel's Designer tab should show style data
6. Switch between rail tabs (Layers, Designer) → each renders content
7. Click Clipboard tab in bottom dock → mutations appear
8. Press V → cursor changes to crosshair → click an element → chip appears in Prompt Builder
9. Press Escape → exit V-mode
10. Verify the DevTools panel still works if DevTools is opened separately

**Step 3: Count changes**

```bash
# New files
ls packages/extension/src/entrypoints/sidepanel/index.html \
   packages/extension/src/entrypoints/sidepanel/main.tsx \
   packages/extension/src/entrypoints/sidepanel/SidePanel.tsx \
   packages/extension/src/panel/hooks/useActiveTabId.ts \
   packages/extension/src/panel/hooks/usePanelConnection.ts \
   packages/extension/src/panel/context/InspectionContext.ts \
   packages/extension/src/panel/components/layout/RailTabBar.tsx \
   packages/extension/src/panel/components/layout/SidePanelLayout.tsx \
   packages/extension/src/panel/components/layout/BottomDock.tsx \
   packages/extension/src/panel/components/layout/ClipboardDock.tsx \
   packages/extension/src/panel/components/layout/PromptBuilderDock.tsx \
   packages/extension/src/panel/hooks/__tests__/useActiveTabId.test.ts 2>/dev/null | wc -l
```

**Step 4: Summarize changes**

After all tasks pass:
- New files: ~12 (Side Panel entrypoint, layout, hooks, context, dock components)
- Modified files: ~8 (wxt.config, background, content, Panel.tsx, cdpBridge, modes, toolbar, spotlight)
- Deleted files: ~4 (PromptPalette, promptPalette.css, ImageSwapPanel, ScreenshotPanel)
- New features: Chrome Side Panel (action-oriented), rail tabs (Layers/Designer), bottom dock (Clipboard + Prompt Builder), V-mode
- Sunset: Cmd+K spotlight, orphaned panels

---

## Summary

| Task | What | New Files | Modified | Deleted |
|------|------|-----------|----------|---------|
| 3.0 | sidePanel permission + action | 0 | 1 | 0 |
| 3.1 | WXT sidepanel entrypoint | 3 | 0 | 0 |
| 3.2 | Background → side panel opener | 0 | 1 | 0 |
| 3.3 | useActiveTabId hook | 2 | 1 | 0 |
| 3.4 | cdpBridge tabId abstraction | 0 | 1 | 0 |
| 3.5 | SidePanel connection + shared hook | 3 | 1 | 0 |
| 3.6 | SidePanelLayout + rail tabs | 3 | 1 | 0 |
| 3.7 | Bottom dock (Clipboard + Prompt Builder) | 2 | 1 | 0 |
| 3.8 | V-mode on FAB | 0 | 3 | 0 |
| 3.9 | Sunset Cmd+K spotlight | 0 | 2 | 3 |
| 3.10 | Wire/delete orphaned panels | 0 | 1 | 2 |
| 3.11 | Final verification | 0 | 0 | 0 |

**Total: ~12 new files, ~8 modified, ~5 deleted, ~100 estimated new test assertions**

---

## Architectural Notes for the Implementer

### Port coexistence
Both DevTools panel and Side Panel can be open simultaneously. Each creates its own `contentBridge` port instance (they're in separate HTML pages = separate JS contexts). The background's `broadcastToTab()` sends to ALL registered ports for a tab — this is correct behavior.

### CSS sharing
The Side Panel imports the same `panel.css` Tailwind entry. Verify the import path resolves correctly from `entrypoints/sidepanel/main.tsx`. If not, adjust or create a symlink.

### Store independence
Each panel context (DevTools and Side Panel) has its own Zustand store instance. They receive the same events from the background, so they stay in sync naturally. No cross-panel store sharing needed.

### Surface split
Plan 3 intentionally keeps **inspection/scanner surfaces** (`ComponentsPanel`, `AssetsPanel`, `VariablesPanel`) in DevTools. Side Panel is action-oriented (`Layers` + `Designer` + bottom dock). This avoids pulling `chrome.devtools.*` scanner dependencies into Side Panel context.

### Tab change latency
When the user switches tabs, `chrome.tabs.onActivated` fires → `useActiveTabId` updates → `usePanelConnection` disconnects old bridge and connects to new tab's content script. There will be a brief flash of "Waiting for active tab..." during the transition. This is acceptable.

### DevTools APIs in shared code
Any code shared between DevTools panel and Side Panel must NOT use `chrome.devtools.*` directly. The `cdpBridge` abstraction (Task 3.4) handles this. If other files have `chrome.devtools` references, they need similar treatment.
