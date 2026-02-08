# Phase 7: UI Wiring + On-Page Toolbar + Dogfood Mode

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire all orphaned components into the UI, move the toolbar and mode overlays onto the inspected page (Shadow DOM), add a spotlight prompt builder (Cmd+K), and implement dogfood mode with mouse-following component name tooltips.

**Architecture:** On-page UI (toolbar, mode overlays, spotlight prompt) renders via a second React root inside the content script's existing `<flow-overlay-root>` Shadow DOM. This isolates Flow's UI from the page DOM so Flow can't inspect itself. The DevTools panel keeps inspection results, designer sections, mutations, context output, and accumulated data. State syncs between on-page and panel via `chrome.runtime` messaging.

**Tech Stack:** React 19, Zustand 5, TypeScript 5.8, Tailwind v4, Shadow DOM (closed), WXT content scripts, chrome.runtime messaging

**Brainstorm:** `docs/brainstorms/2026-02-06-flow-phase7-wiring-brainstorm.md`

---

## Batch 1: Dogfood Mode (Tasks 1-3)

### Task 1: Create DogfoodBoundary component

The `DogfoodBoundary` wrapper shows a mouse-following tooltip with component name + file path when `dogfoodMode` is on. All components already import this but the file doesn't exist yet.

**File:** Create `packages/extension/src/panel/components/ui/DogfoodBoundary.tsx`

```tsx
import { useState, useCallback, useRef, type ReactNode } from 'react';
import { useAppStore } from '../../stores/appStore';

interface DogfoodBoundaryProps {
  name: string;
  file: string;
  category?: 'layout' | 'designer' | 'mode' | 'panel' | 'utility';
  children: ReactNode;
}

const CATEGORY_COLORS: Record<string, string> = {
  layout: '#3b82f6',
  designer: '#22c55e',
  mode: '#f59e0b',
  panel: '#a855f7',
  utility: '#6b7280',
};

export function DogfoodBoundary({ name, file, category = 'utility', children }: DogfoodBoundaryProps) {
  const dogfoodMode = useAppStore((s) => s.dogfoodMode);
  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const boundaryRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);

  if (!dogfoodMode) {
    return <>{children}</>;
  }

  const color = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.utility;

  return (
    <div
      ref={boundaryRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        outline: hovered ? `2px dashed ${color}` : 'none',
        outlineOffset: '-2px',
      }}
      data-dogfood-component={name}
      data-dogfood-file={file}
    >
      {children}
      {hovered && (
        <div
          style={{
            position: 'fixed',
            left: mousePos.x + 12,
            top: mousePos.y - 28,
            background: color,
            color: 'white',
            fontSize: '11px',
            fontFamily: 'ui-monospace, monospace',
            padding: '3px 8px',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 99999,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          {name} <span style={{ opacity: 0.7 }}>({file})</span>
        </div>
      )}
    </div>
  );
}
```

**Verify:** `cd packages/extension && pnpm typecheck`

**Commit:** `feat(flow2): add DogfoodBoundary component with mouse-following tooltip`

---

### Task 2: Add dogfood toggle to SettingsBar

Add a toggle switch in the SettingsDropdown that enables dogfood mode.

**File:** Modify `packages/extension/src/panel/components/layout/SettingsBar.tsx`

Find the `SettingsDropdown` function. Add inside the dropdown menu, after the existing toggle items:

```tsx
// Inside SettingsDropdown, add after existing items:

// Dogfood Mode toggle
const dogfoodMode = useAppStore((s) => s.dogfoodMode);
const setDogfoodMode = useAppStore((s) => s.setDogfoodMode);

// In the dropdown JSX:
<button
  onClick={() => setDogfoodMode(!dogfoodMode)}
  className="w-full flex items-center justify-between px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-700/50 rounded transition-colors"
>
  <span>Dogfood Mode</span>
  <span className={`w-8 h-4 rounded-full transition-colors ${dogfoodMode ? 'bg-blue-600' : 'bg-neutral-600'} relative`}>
    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${dogfoodMode ? 'left-4' : 'left-0.5'}`} />
  </span>
</button>
```

**Verify:** `cd packages/extension && pnpm typecheck`

**Commit:** `feat(flow2): add dogfood mode toggle to SettingsBar dropdown`

---

### Task 3: Verify all DogfoodBoundary wrappings compile

All components already import and wrap with DogfoodBoundary. Now that the component exists, verify everything compiles.

**Verify:**
```bash
cd packages/extension && pnpm typecheck
cd packages/extension && pnpm test
```

**Commit:** (only if fixes needed) `fix(flow2): fix DogfoodBoundary integration issues`

---

## Batch 2: On-Page React Root (Tasks 4-6)

### Task 4: Create content script React renderer

This is the key architectural piece. Create a module that mounts a React root inside the content script's Shadow DOM, enabling React components to render on the inspected page.

**File:** Create `packages/extension/src/content/ui/contentRoot.ts`

```typescript
import { createRoot, type Root } from 'react-dom/client';

let root: Root | null = null;
let container: HTMLDivElement | null = null;

/**
 * Mount a React root inside the given Shadow DOM.
 * The container gets pointer-events: auto so interactive elements work,
 * while the Shadow DOM host stays pointer-events: none.
 */
export function mountContentUI(shadow: ShadowRoot): HTMLDivElement {
  if (container) return container;

  container = document.createElement('div');
  container.id = 'flow-ui-root';
  container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483647;';
  shadow.appendChild(container);

  return container;
}

export function getContentRoot(): Root | null {
  return root;
}

export function getContentContainer(): HTMLDivElement | null {
  return container;
}

export function createContentRoot(container: HTMLDivElement): Root {
  if (root) return root;
  root = createRoot(container);
  return root;
}

export function unmountContentUI(): void {
  root?.unmount();
  root = null;
  container?.remove();
  container = null;
}
```

**File:** Create `packages/extension/src/content/ui/contentStyles.css`

```css
/* Styles for on-page UI components rendered in Shadow DOM */

.flow-toolbar {
  position: fixed;
  pointer-events: auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  line-height: 1;
  color: #e5e5e5;
  -webkit-font-smoothing: antialiased;
}

.flow-toolbar * {
  box-sizing: border-box;
}

.flow-toolbar button {
  all: unset;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flow-panel-overlay {
  position: fixed;
  pointer-events: auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  color: #e5e5e5;
  -webkit-font-smoothing: antialiased;
}

.flow-spotlight {
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  color: #e5e5e5;
  -webkit-font-smoothing: antialiased;
}

.flow-mode-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.flow-mode-overlay.active {
  pointer-events: auto;
  cursor: crosshair;
}
```

**Verify:** `cd packages/extension && pnpm typecheck`

**Commit:** `feat(flow2): add content script React root for on-page UI rendering`

---

### Task 5: Create on-page state bridge

The on-page UI needs to communicate with the panel's Zustand store. Since they run in different contexts (content script vs DevTools panel), we bridge via `chrome.runtime` messages.

**File:** Create `packages/extension/src/content/ui/stateBridge.ts`

```typescript
/**
 * State bridge between on-page UI (content script) and panel (DevTools).
 *
 * On-page UI dispatches actions via port messages.
 * Panel sends state snapshots to keep on-page UI in sync.
 */

import { FLOW_PORT_NAME } from '@flow/shared';

export interface OnPageState {
  editorMode: string;
  activeFeedbackType: string | null;
  dogfoodMode: boolean;
  promptSteps: unknown[];
  pendingSlot: { stepId: string; slot: 'target' | 'reference' } | null;
  activeLanguage: string;
}

type StateListener = (state: OnPageState) => void;

let currentState: OnPageState = {
  editorMode: 'cursor',
  activeFeedbackType: null,
  dogfoodMode: false,
  promptSteps: [],
  pendingSlot: null,
  activeLanguage: 'css',
};

const listeners = new Set<StateListener>();

let port: chrome.runtime.Port | null = null;

export function initStateBridge(existingPort: chrome.runtime.Port): void {
  port = existingPort;

  port.onMessage.addListener((msg: unknown) => {
    if (typeof msg !== 'object' || msg === null) return;
    const m = msg as Record<string, unknown>;

    if (m.type === 'flow:state-sync') {
      currentState = m.state as OnPageState;
      for (const listener of listeners) {
        listener(currentState);
      }
    }
  });
}

export function getOnPageState(): OnPageState {
  return currentState;
}

export function subscribeOnPageState(listener: StateListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Dispatch an action to the panel's Zustand store */
export function dispatchToPanel(action: { type: string; payload?: unknown }): void {
  port?.postMessage({ type: 'flow:action', ...action });
}
```

**File:** Modify `packages/extension/src/entrypoints/panel/Panel.tsx`

Add state sync broadcasting. Inside the `useEffect` that sets up the content bridge, after `const unsubscribe = onContentMessage(...)`, add a Zustand subscriber that sends state to content script:

```typescript
// After the onContentMessage setup, add state sync to on-page UI:
const unsubscribeStore = useAppStore.subscribe((state) => {
  const port = portRef.current;
  if (!port) return;
  port.postMessage({
    type: 'flow:state-sync',
    state: {
      editorMode: state.editorMode,
      activeFeedbackType: (state as Record<string, unknown>).activeFeedbackType ?? null,
      dogfoodMode: state.dogfoodMode,
      promptSteps: state.promptSteps ?? [],
      pendingSlot: state.pendingSlot ?? null,
      activeLanguage: state.activeLanguage ?? 'css',
    },
  });
});

// In cleanup:
return () => {
  unsubscribe();
  unsubscribeStore();
  disconnectContentBridge();
};
```

**Verify:** `cd packages/extension && pnpm typecheck`

**Commit:** `feat(flow2): add state bridge for on-page UI ↔ panel sync`

---

### Task 6: Create on-page toolbar component (vanilla DOM, not React)

The toolbar is the first on-page component. Given the content script runs in an isolated world without the panel's Tailwind/React setup, we render the toolbar as vanilla DOM inside Shadow DOM. This matches VisBug's pattern and avoids bundling React into the content script.

**File:** Create `packages/extension/src/content/ui/toolbar.ts`

```typescript
import { getOnPageState, subscribeOnPageState, dispatchToPanel } from './stateBridge';
import toolbarStyles from './toolbar.css?inline';

interface ToolbarMode {
  id: string;
  label: string;
  shortcut: string;
  icon: string; // SVG string
  editorMode: string;
  disabled?: boolean;
}

const MODES: ToolbarMode[] = [
  {
    id: 'smart-edit',
    label: 'Smart Edit',
    shortcut: 'E',
    editorMode: 'inspector',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
  },
  {
    id: 'select-prompt',
    label: 'Select / Prompt',
    shortcut: 'V',
    editorMode: 'inspector',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>',
  },
  {
    id: 'text',
    label: 'Text Edit',
    shortcut: 'T',
    editorMode: 'designer',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
  },
  {
    id: 'comment',
    label: 'Comment',
    shortcut: 'C',
    editorMode: 'comment',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
  },
  {
    id: 'question',
    label: 'Question',
    shortcut: 'Q',
    editorMode: 'comment',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  },
  {
    id: 'designer',
    label: 'Designer',
    shortcut: 'D',
    editorMode: 'designer',
    disabled: true,
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
  },
  {
    id: 'animation',
    label: 'Animation',
    shortcut: 'A',
    editorMode: 'designer',
    disabled: true,
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  },
  {
    id: 'preview',
    label: 'Preview',
    shortcut: 'P',
    editorMode: 'cursor',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  },
];

let toolbarEl: HTMLElement | null = null;
let buttons: Map<string, HTMLButtonElement> = new Map();

export function createToolbar(shadow: ShadowRoot): HTMLElement {
  if (toolbarEl) return toolbarEl;

  // Inject styles
  const style = document.createElement('style');
  style.textContent = toolbarStyles;
  shadow.appendChild(style);

  toolbarEl = document.createElement('div');
  toolbarEl.className = 'flow-toolbar';
  toolbarEl.setAttribute('data-flow-toolbar', '');
  toolbarEl.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);pointer-events:auto;z-index:2147483647;';

  const bar = document.createElement('div');
  bar.className = 'flow-toolbar-bar';
  toolbarEl.appendChild(bar);

  for (const mode of MODES) {
    const btn = document.createElement('button');
    btn.className = 'flow-toolbar-btn';
    btn.dataset.mode = mode.id;
    btn.title = `${mode.label} (${mode.shortcut})`;
    btn.innerHTML = mode.icon;

    if (mode.disabled) {
      btn.classList.add('disabled');
      btn.title += ' — Coming soon';
    } else {
      btn.addEventListener('click', () => {
        dispatchToPanel({
          type: 'flow:set-editor-mode',
          payload: { mode: mode.editorMode, toolId: mode.id },
        });
      });
    }

    buttons.set(mode.id, btn);
    bar.appendChild(btn);
  }

  shadow.appendChild(toolbarEl);

  // Subscribe to state changes to update active button
  subscribeOnPageState((state) => {
    for (const [id, btn] of buttons) {
      const mode = MODES.find((m) => m.id === id);
      if (!mode) continue;
      const isActive = mode.editorMode === state.editorMode;
      btn.classList.toggle('active', isActive);
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Don't capture when typing in inputs
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

    const mode = MODES.find((m) => m.shortcut.toLowerCase() === e.key.toLowerCase());
    if (mode && !mode.disabled) {
      e.preventDefault();
      dispatchToPanel({
        type: 'flow:set-editor-mode',
        payload: { mode: mode.editorMode, toolId: mode.id },
      });
    }
  });

  return toolbarEl;
}

export function destroyToolbar(): void {
  toolbarEl?.remove();
  toolbarEl = null;
  buttons.clear();
}
```

**File:** Create `packages/extension/src/content/ui/toolbar.css`

```css
.flow-toolbar-bar {
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(23, 23, 23, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(63, 63, 70, 0.5);
  border-radius: 12px;
  padding: 4px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.flow-toolbar-btn {
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: #a1a1aa;
  cursor: pointer;
  transition: all 0.15s ease-out;
  pointer-events: auto;
}

.flow-toolbar-btn:hover {
  color: #e4e4e7;
  background: rgba(63, 63, 70, 0.5);
}

.flow-toolbar-btn.active {
  color: #ffffff;
  background: #2563eb;
}

.flow-toolbar-btn.disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.flow-toolbar-btn.disabled:hover {
  background: none;
  color: #a1a1aa;
}
```

**Verify:** `cd packages/extension && pnpm typecheck`

**Commit:** `feat(flow2): add on-page toolbar rendered in content script Shadow DOM`

---

## Batch 3: Wire Toolbar to Content Script (Tasks 7-9)

### Task 7: Initialize on-page UI in content script

Wire the toolbar and state bridge into the content script entry point.

**File:** Modify `packages/extension/src/entrypoints/content.ts`

Add imports and initialization after the existing `initPanelRouter(port)` call:

```typescript
import { initStateBridge } from '../content/ui/stateBridge';
import { mountContentUI } from '../content/ui/contentRoot';
import { createToolbar } from '../content/ui/toolbar';

// After initPanelRouter(port):
initStateBridge(port);

// Mount on-page UI in the overlay root's shadow DOM
const overlayRoot = ensureOverlayRoot();
mountContentUI(overlayRoot);
createToolbar(overlayRoot);
```

**Verify:** `cd packages/extension && pnpm typecheck`

**Commit:** `feat(flow2): wire on-page toolbar into content script initialization`

---

### Task 8: Handle toolbar actions in the panel

The panel needs to receive `flow:action` and `flow:set-editor-mode` messages from the on-page UI and apply them to the Zustand store.

**File:** Modify `packages/extension/src/entrypoints/panel/Panel.tsx`

Inside the `onContentMessage` callback, add handlers for on-page UI actions (before the `isBackgroundToPanelMessage` type guard):

```typescript
// Handle on-page UI actions
if (typeof msg === 'object' && msg !== null) {
  const anyMsg = msg as Record<string, unknown>;

  if (anyMsg.type === 'flow:set-editor-mode') {
    const payload = anyMsg.payload as { mode: string; toolId: string };
    const store = useAppStore.getState();
    store.setEditorMode(payload.mode as EditorMode);
    return;
  }

  if (anyMsg.type === 'flow:action') {
    // Generic action dispatch — extend as needed
    return;
  }
}
```

Add `EditorMode` to the imports from the store types if not already imported.

**Verify:** `cd packages/extension && pnpm typecheck`

**Commit:** `feat(flow2): handle on-page toolbar actions in DevTools panel`

---

### Task 9: Forward panel messages to content script for state sync

The background service worker needs to forward `flow:state-sync` messages from the panel to the content script.

**File:** Modify `packages/extension/src/entrypoints/background.ts`

In the panel port message handler, add forwarding for state-sync messages:

```typescript
// When a panel port sends a message, check if it's a state sync to forward to content:
if (msg.type === 'flow:state-sync') {
  const contentPort = contentPorts.get(tabId);
  if (contentPort) {
    contentPort.postMessage(msg);
  }
  return; // Don't forward to other panels
}
```

**Verify:** `cd packages/extension && pnpm typecheck`

**Commit:** `feat(flow2): forward state sync messages from panel to content script`

---

## Batch 4: Wire DevTools Panel Components (Tasks 10-13)

### Task 10: Wire ContextOutputPanel into RightPanel

Add a "Prompt" tab to the RightPanel that shows ContextOutputPanel.

**File:** Modify `packages/extension/src/panel/components/layout/RightPanel.tsx`

Add the import and a third tab:

```typescript
import { ContextOutputPanel } from '../ContextOutputPanel';

// Update TABS array:
const TABS: TabConfig[] = [
  { id: "designer", label: "Designer", icon: <PaintbrushIcon /> },
  { id: "mutations", label: "Mutations", icon: <EditIcon /> },
  { id: "prompt", label: "Prompt", icon: <PromptIcon /> },
];

// Add type:
type RightPanelTab = "designer" | "mutations" | "prompt";

// In the tab content switch, add:
case "prompt":
  return <ContextOutputPanel />;

// Add PromptIcon:
function PromptIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}
```

**Verify:** `cd packages/extension && pnpm typecheck`

**Commit:** `feat(flow2): wire ContextOutputPanel as Prompt tab in RightPanel`

---

### Task 11: Wire AssetsPanel and VariablesPanel into LeftPanel

Add Assets and Variables as sections in the LeftPanel.

**File:** Modify `packages/extension/src/panel/components/layout/LeftPanel.tsx`

Add imports and new sections:

```typescript
import { AssetsPanel } from '../AssetsPanel';
import { VariablesPanel } from '../VariablesPanel';

// Update SECTIONS array:
const SECTIONS: SectionConfig[] = [
  { id: "layers", label: "Layers", shortcut: "1", icon: <LayersIcon /> },
  { id: "components", label: "Components", shortcut: "2", icon: <GridIcon /> },
  { id: "assets", label: "Assets", shortcut: "3", icon: <ImageIcon /> },
  { id: "variables", label: "Variables", shortcut: "4", icon: <SwatchIcon /> },
];

// Update type:
export type LeftPanelSection = "layers" | "components" | "assets" | "variables";

// Update PanelContent switch:
case "assets":
  return <AssetsPanel />;
case "variables":
  return <VariablesPanel />;

// Add icons:
function ImageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function SwatchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <path d="M2 12h20" />
      <path d="M12 2v20" />
    </svg>
  );
}
```

**Verify:** `cd packages/extension && pnpm typecheck`

**Commit:** `feat(flow2): wire AssetsPanel and VariablesPanel into LeftPanel`

---

### Task 12: Wire CommentMode and TextEditMode overlays into EditorLayout

These mode overlays need to render in the DevTools panel conditionally based on `editorMode`. Follow the Flow 0 pattern of rendering them at the root level.

**File:** Modify `packages/extension/src/panel/components/layout/EditorLayout.tsx`

```typescript
import { CommentMode } from '../CommentMode';
import { TextEditMode } from '../TextEditMode';
import { ComponentIdMode } from '../ComponentIdMode';

export function EditorLayout() {
  const editorMode = useAppStore((s) => s.editorMode);
  const [previewBg, setPreviewBg] = useState<"dark" | "light">("dark");

  return (
    <DogfoodBoundary name="EditorLayout" file="layout/EditorLayout.tsx" category="layout">
      <div
        className="h-screen flex flex-col bg-neutral-950 overflow-hidden"
        data-devflow-id="editor-layout"
        data-editor-mode={editorMode}
      >
        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden" data-devflow-id="main-content">
          <PreviewCanvas previewBg={previewBg} />
        </div>

        {/* Floating Panels */}
        <LeftPanel />
        <RightPanel />
        <SettingsBar previewBg={previewBg} setPreviewBg={setPreviewBg} />

        {/* Mode Overlays (conditionally visible based on editorMode) */}
        <CommentMode />
        <TextEditMode />
        <ComponentIdMode />
      </div>
    </DogfoodBoundary>
  );
}
```

Note: CommentMode, TextEditMode, and ComponentIdMode already check `editorMode` internally and render nothing when inactive.

**Verify:** `cd packages/extension && pnpm typecheck`

**Commit:** `feat(flow2): wire CommentMode, TextEditMode, ComponentIdMode into EditorLayout`

---

### Task 13: Call useSessionRestore in Panel.tsx

The session restore hook was created but never called.

**File:** Modify `packages/extension/src/entrypoints/panel/Panel.tsx`

Add the import and call at the top of the Panel component:

```typescript
import { useSessionRestore } from '../../panel/hooks/useSessionRestore';

// Inside Panel(), before the return:
const tabId = chrome.devtools.inspectedWindow.tabId;
const restored = useSessionRestore(tabId);
```

Note: `tabId` is already defined on line 70. Just add the `useSessionRestore` call and use the existing `tabId`.

**Verify:** `cd packages/extension && pnpm typecheck`

**Commit:** `feat(flow2): call useSessionRestore on panel open`

---

## Batch 5: Spotlight Prompt Builder (Tasks 14-15)

### Task 14: Create spotlight overlay component in content script

A Cmd+K spotlight that renders the prompt builder as a centered overlay on the inspected page.

**File:** Create `packages/extension/src/content/ui/spotlight.ts`

```typescript
import { getOnPageState, subscribeOnPageState, dispatchToPanel } from './stateBridge';
import spotlightStyles from './spotlight.css?inline';

let spotlightEl: HTMLElement | null = null;
let isVisible = false;
let shadow: ShadowRoot | null = null;

export function initSpotlight(shadowRoot: ShadowRoot): void {
  shadow = shadowRoot;

  // Inject styles
  const style = document.createElement('style');
  style.textContent = spotlightStyles;
  shadow.appendChild(style);

  // Cmd+K / Ctrl+K to toggle
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      toggleSpotlight();
    }
    if (e.key === 'Escape' && isVisible) {
      e.preventDefault();
      hideSpotlight();
    }
  });
}

function toggleSpotlight(): void {
  if (isVisible) {
    hideSpotlight();
  } else {
    showSpotlight();
  }
}

function showSpotlight(): void {
  if (!shadow || isVisible) return;
  isVisible = true;

  spotlightEl = document.createElement('div');
  spotlightEl.className = 'flow-spotlight-overlay';
  spotlightEl.innerHTML = `
    <div class="flow-spotlight-backdrop"></div>
    <div class="flow-spotlight-panel">
      <div class="flow-spotlight-header">
        <span class="flow-spotlight-title">Prompt Builder</span>
        <kbd class="flow-spotlight-kbd">Esc</kbd>
      </div>
      <div class="flow-spotlight-body">
        <div class="flow-spotlight-steps" id="flow-spotlight-steps"></div>
        <button class="flow-spotlight-add" id="flow-spotlight-add">+ Add Step</button>
      </div>
      <div class="flow-spotlight-footer">
        <button class="flow-spotlight-copy" id="flow-spotlight-copy">Copy Prompt</button>
        <span class="flow-spotlight-hint">Cmd+K to toggle</span>
      </div>
    </div>
  `;

  // Backdrop closes spotlight
  spotlightEl.querySelector('.flow-spotlight-backdrop')?.addEventListener('click', hideSpotlight);

  // Add step button
  spotlightEl.querySelector('#flow-spotlight-add')?.addEventListener('click', () => {
    dispatchToPanel({ type: 'flow:add-prompt-step' });
  });

  // Copy button
  spotlightEl.querySelector('#flow-spotlight-copy')?.addEventListener('click', () => {
    dispatchToPanel({ type: 'flow:copy-prompt' });
  });

  shadow.appendChild(spotlightEl);
}

function hideSpotlight(): void {
  if (!isVisible) return;
  isVisible = false;
  spotlightEl?.remove();
  spotlightEl = null;
}

export function destroySpotlight(): void {
  hideSpotlight();
}
```

**File:** Create `packages/extension/src/content/ui/spotlight.css`

```css
.flow-spotlight-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  z-index: 2147483647;
}

.flow-spotlight-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.flow-spotlight-panel {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 560px;
  max-height: 60vh;
  background: rgba(23, 23, 23, 0.98);
  border: 1px solid rgba(63, 63, 70, 0.5);
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.flow-spotlight-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(63, 63, 70, 0.3);
}

.flow-spotlight-title {
  font-size: 14px;
  font-weight: 600;
  color: #e4e4e7;
}

.flow-spotlight-kbd {
  font-size: 11px;
  font-family: ui-monospace, monospace;
  color: #71717a;
  background: rgba(63, 63, 70, 0.3);
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid rgba(63, 63, 70, 0.5);
}

.flow-spotlight-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

.flow-spotlight-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.flow-spotlight-add {
  all: unset;
  cursor: pointer;
  display: block;
  width: 100%;
  margin-top: 12px;
  padding: 10px;
  text-align: center;
  font-size: 13px;
  color: #71717a;
  border: 1px dashed rgba(63, 63, 70, 0.5);
  border-radius: 8px;
  transition: all 0.15s ease-out;
}

.flow-spotlight-add:hover {
  color: #e4e4e7;
  border-color: #3b82f6;
}

.flow-spotlight-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid rgba(63, 63, 70, 0.3);
}

.flow-spotlight-copy {
  all: unset;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #ffffff;
  background: #2563eb;
  padding: 8px 16px;
  border-radius: 8px;
  transition: background 0.15s ease-out;
}

.flow-spotlight-copy:hover {
  background: #1d4ed8;
}

.flow-spotlight-hint {
  font-size: 11px;
  color: #52525b;
}
```

**Verify:** `cd packages/extension && pnpm typecheck`

**Commit:** `feat(flow2): add Cmd+K spotlight prompt builder on inspected page`

---

### Task 15: Wire spotlight into content script and handle actions in panel

**File:** Modify `packages/extension/src/entrypoints/content.ts`

Add import and initialization:

```typescript
import { initSpotlight } from '../content/ui/spotlight';

// After createToolbar(overlayRoot):
initSpotlight(overlayRoot);
```

**File:** Modify `packages/extension/src/entrypoints/panel/Panel.tsx`

Add handlers for spotlight actions in the `onContentMessage` callback:

```typescript
// Inside the flow:action handler:
if (anyMsg.type === 'flow:add-prompt-step') {
  const store = useAppStore.getState();
  store.addPromptStep();
  return;
}

if (anyMsg.type === 'flow:copy-prompt') {
  const store = useAppStore.getState();
  store.copyToClipboard();
  return;
}
```

**Verify:** `cd packages/extension && pnpm typecheck`

**Commit:** `feat(flow2): wire spotlight prompt builder actions to panel store`

---

## Batch 6: Verification and Cleanup (Tasks 16-17)

### Task 16: Run full test suite and typecheck

```bash
cd packages/extension && pnpm typecheck
cd packages/extension && pnpm test
cd packages/shared && pnpm typecheck 2>/dev/null || true
```

Fix any errors.

**Commit:** `fix(flow2): resolve Phase 7 typecheck and test issues`

---

### Task 17: Update Phase 7 plan with completion status

Mark all tasks as completed in this plan file. Update the brainstorm status.

**Commit:** `docs(flow2): mark Phase 7 tasks complete`

---

## Summary

| Batch | Tasks | What it delivers |
|-------|-------|-----------------|
| 1 | 1-3 | Dogfood mode: mouse-following component name tooltips |
| 2 | 4-6 | On-page React root + state bridge + toolbar in Shadow DOM |
| 3 | 7-9 | Toolbar wired end-to-end (content script ↔ panel) |
| 4 | 10-13 | All orphaned components wired into DevTools panel |
| 5 | 14-15 | Cmd+K spotlight prompt builder on inspected page |
| 6 | 16-17 | Verification and cleanup |

**Key architectural decisions:**
- On-page UI uses **vanilla DOM** in Shadow DOM (not React) — matches VisBug pattern, avoids bundling React in content script, keeps bundle small
- State syncs via **chrome.runtime port messages** — panel broadcasts Zustand state snapshots, on-page UI dispatches actions back
- Shadow DOM isolation prevents Flow from inspecting its own on-page UI
- DevTools panel keeps data-heavy views (inspection, designer, mutations, context output)
- On-page UI handles interaction (toolbar, mode selection, spotlight prompt)
