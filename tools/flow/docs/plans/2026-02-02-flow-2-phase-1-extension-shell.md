# Phase 1: Monorepo Scaffold + Extension Shell

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Stand up a working WXT Chrome extension with element highlighting, page-context agent script, DevTools panel, and verified end-to-end message passing across all four extension contexts.

**Architecture:** A pnpm workspace at `tools/flow/` containing two packages: `packages/shared` (TypeScript types and message schemas) and `packages/extension` (WXT Chrome extension with React 19 DevTools panel). The content script renders highlight overlays in a closed Shadow DOM. An agent script injected into the page's MAIN world verifies access to `window` globals. A service worker routes messages by tabId. The DevTools panel is a minimal React 19 app that receives and displays messages.

**Tech Stack:** pnpm workspaces, WXT 0.19+, React 19, TypeScript 5.8, Tailwind v4, Chrome MV3

---

## Task 1 — Initialize pnpm workspace

Create the root workspace configuration at `tools/flow/`.

**Files:**

### `tools/flow/package.json`

```json
{
  "name": "@flow/root",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "pnpm --filter @flow/extension dev",
    "build": "pnpm --filter @flow/extension build",
    "typecheck": "pnpm -r typecheck"
  },
  "engines": {
    "node": ">=20",
    "pnpm": ">=9"
  }
}
```

### `tools/flow/pnpm-workspace.yaml`

```yaml
packages:
  - "packages/*"
```

### `tools/flow/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true
  },
  "references": [
    { "path": "packages/shared" },
    { "path": "packages/extension" }
  ]
}
```

**Verify:**

```bash
cd tools/flow && pnpm install
```

**Commit:** `feat(flow2): initialize pnpm workspace with packages structure`

---

## Task 2 — Create `packages/shared` types package

Shared types, constants, and message schemas used by all extension contexts.

**Files:**

### `packages/shared/package.json`

```json
{
  "name": "@flow/shared",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.8.0"
  }
}
```

### `packages/shared/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

### `packages/shared/src/index.ts`

```typescript
export * from './messages';
export * from './constants';
```

### `packages/shared/src/constants.ts`

```typescript
/**
 * Message source identifier used for window.postMessage origin filtering.
 * Both the agent script and content script check this to ignore unrelated messages.
 */
export const FLOW_MESSAGE_SOURCE = '__flow__' as const;

/**
 * Port name for chrome.runtime.connect between content script and service worker.
 */
export const FLOW_PORT_NAME = 'flow-content' as const;

/**
 * Port name for chrome.runtime.connect between DevTools panel and service worker.
 */
export const FLOW_PANEL_PORT_NAME = 'flow-panel' as const;
```

### `packages/shared/src/messages.ts`

```typescript
import { FLOW_MESSAGE_SOURCE } from './constants';

// ─── Direction: Agent → Content (via window.postMessage) ───

export interface AgentPongMessage {
  type: 'agent:pong';
  source: typeof FLOW_MESSAGE_SOURCE;
  payload: {
    timestamp: number;
    globals: string[]; // list of detected globals (e.g. ['React', 'gsap'])
  };
}

// ─── Direction: Content → Agent (via window.postMessage) ───

export interface ContentPingMessage {
  type: 'content:ping';
  source: typeof FLOW_MESSAGE_SOURCE;
  payload: {
    timestamp: number;
  };
}

// ─── Direction: Content → Service Worker (via chrome.runtime port) ───

export interface ElementHoveredMessage {
  type: 'element:hovered';
  payload: {
    tagName: string;
    id: string;
    classList: string[];
    rect: { top: number; left: number; width: number; height: number };
    textPreview: string; // first 80 chars of textContent
  };
}

export interface ElementUnhoveredMessage {
  type: 'element:unhovered';
  payload: null;
}

export interface AgentReadyMessage {
  type: 'agent:ready';
  payload: {
    globals: string[];
  };
}

// ─── Direction: Panel → Service Worker ───

export interface PanelInitMessage {
  type: 'panel:init';
  payload: {
    tabId: number;
  };
}

// ─── Union types ───

/** Messages sent via window.postMessage (agent ↔ content) */
export type WindowMessage = ContentPingMessage | AgentPongMessage;

/** Messages sent via chrome.runtime port (content → service worker) */
export type ContentToBackgroundMessage =
  | ElementHoveredMessage
  | ElementUnhoveredMessage
  | AgentReadyMessage;

/** Messages sent via chrome.runtime port (service worker → panel) */
export type BackgroundToPanelMessage =
  | ElementHoveredMessage
  | ElementUnhoveredMessage
  | AgentReadyMessage;

/** Messages sent via chrome.runtime port (panel → service worker) */
export type PanelToBackgroundMessage = PanelInitMessage;

/** Type guard for Flow window messages */
export function isFlowWindowMessage(event: MessageEvent): event is MessageEvent<WindowMessage> {
  return (
    event.data &&
    typeof event.data === 'object' &&
    'source' in event.data &&
    event.data.source === FLOW_MESSAGE_SOURCE
  );
}
```

**Verify:**

```bash
cd tools/flow && pnpm --filter @flow/shared typecheck
```

**Commit:** `feat(flow2): add shared types package with message schemas`

---

## Task 3 — Scaffold WXT extension with React 19 + Tailwind v4

Create the extension package using WXT. Per spec section 13.2: WXT + React 19 + TypeScript 5.8 + Tailwind v4.

**Commands:**

```bash
cd tools/flow/packages
pnpm dlx wxt@latest init extension --template react
```

Then modify the generated files:

### `packages/extension/package.json`

Ensure these fields (merge with WXT-generated):

```json
{
  "name": "@flow/extension",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wxt",
    "build": "wxt build",
    "zip": "wxt zip",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@flow/shared": "workspace:*"
  },
  "devDependencies": {
    "wxt": "^0.19.0",
    "@wxt-dev/module-react": "^1.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/chrome": "^0.0.287",
    "typescript": "^5.8.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0"
  }
}
```

### `packages/extension/wxt.config.ts`

```typescript
import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Flow',
    description: 'Visual context tool for AI-assisted web development',
    permissions: ['activeTab', 'scripting', 'storage', 'tabs'],
    host_permissions: ['<all_urls>'],
  },
});
```

**Note on host permissions:** Flow injects an agent script via `chrome.scripting.executeScript` and runs content scripts on inspected pages. To support “inspect any page,” we set `host_permissions` to `<all_urls>`. Restricted pages (e.g. `chrome://`, `edge://`, extension pages) still block injection and should fail gracefully.

### `packages/extension/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "types": ["chrome"]
  },
  "include": ["src"],
  "references": [
    { "path": "../shared" }
  ]
}
```

### `packages/extension/src/assets/main.css`

```css
@import "tailwindcss";
```

**Verify:**

```bash
cd tools/flow && pnpm install && pnpm --filter @flow/extension dev
```

Extension should load in Chrome with no errors. Check `chrome://extensions/`.

**Commit:** `feat(flow2): scaffold WXT extension with React 19 + Tailwind v4`

---

## Task 4 — Content script: element picker with highlight overlay

Per spec sections 5, 6.1, 18, 20: Shadow DOM + Popover API, `deepElementFromPoint`, CSS custom properties for overlay positioning, closed shadow root, `requestAnimationFrame` throttling, `MutationObserver` for DOM changes.

### `packages/extension/src/entrypoints/content.ts`

```typescript
import {
  FLOW_MESSAGE_SOURCE,
  FLOW_PORT_NAME,
  type ContentToBackgroundMessage,
  type WindowMessage,
  isFlowWindowMessage,
} from '@flow/shared';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',

  main() {
    // ── Shadow DOM host for overlay ──
    const host = document.createElement('flow-overlay');
    const shadow = host.attachShadow({ mode: 'closed' });

    const styles = new CSSStyleSheet();
    styles.replaceSync(`
      :host {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 2147483647;
      }

      .highlight {
        position: fixed;
        border: 2px solid #3b82f6;
        background: rgba(59, 130, 246, 0.08);
        border-radius: 2px;
        pointer-events: none;
        transition: all 0.05s ease-out;
        display: none;

        /* Positioned via CSS custom properties (VisBug pattern, spec section 20) */
        top: var(--flow-top, 0);
        left: var(--flow-left, 0);
        width: var(--flow-width, 0);
        height: var(--flow-height, 0);
      }

      .highlight[data-visible] {
        display: block;
      }

      .label {
        position: fixed;
        top: var(--flow-label-top, 0);
        left: var(--flow-label-left, 0);
        background: #3b82f6;
        color: white;
        font: 11px/1.4 ui-monospace, monospace;
        padding: 2px 6px;
        border-radius: 2px;
        pointer-events: none;
        white-space: nowrap;
        display: none;
      }

      .label[data-visible] {
        display: block;
      }
    `);
    shadow.adoptedStyleSheets = [styles];

    const highlight = document.createElement('div');
    highlight.className = 'highlight';
    shadow.appendChild(highlight);

    const label = document.createElement('div');
    label.className = 'label';
    shadow.appendChild(label);

    document.documentElement.appendChild(host);

    // ── Connect to service worker ──
    const port = chrome.runtime.connect({ name: FLOW_PORT_NAME });

    // ── Element picker state ──
    let currentElement: Element | null = null;
    let rafId: number | null = null;

    /**
     * Penetrate shadow DOM boundaries to find the deepest element at point.
     * Pattern from VisBug (spec section 20): deepElementFromPoint.
     */
    function deepElementFromPoint(x: number, y: number): Element | null {
      let el = document.elementFromPoint(x, y);
      if (!el) return null;

      while (el?.shadowRoot) {
        const deeper = el.shadowRoot.elementFromPoint(x, y);
        if (!deeper || deeper === el) break;
        el = deeper;
      }
      return el;
    }

    function updateOverlay(el: Element): void {
      const rect = el.getBoundingClientRect();

      highlight.style.setProperty('--flow-top', `${rect.top}px`);
      highlight.style.setProperty('--flow-left', `${rect.left}px`);
      highlight.style.setProperty('--flow-width', `${rect.width}px`);
      highlight.style.setProperty('--flow-height', `${rect.height}px`);
      highlight.toggleAttribute('data-visible', true);

      // Label above element, or below if near top of viewport
      const labelTop = rect.top > 24 ? rect.top - 22 : rect.bottom + 4;
      label.style.setProperty('--flow-label-top', `${labelTop}px`);
      label.style.setProperty('--flow-label-left', `${rect.left}px`);

      const tagName = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : '';
      const cls =
        el.classList.length > 0 ? `.${[...el.classList].slice(0, 2).join('.')}` : '';
      label.textContent = `${tagName}${id}${cls}`;
      label.toggleAttribute('data-visible', true);
    }

    function hideOverlay(): void {
      highlight.removeAttribute('data-visible');
      label.removeAttribute('data-visible');
    }

    function getTextPreview(el: Element): string {
      const text = el.textContent?.trim() ?? '';
      return text.length > 80 ? text.slice(0, 80) + '...' : text;
    }

    // ── Mouse event handlers (throttled to rAF per spec section 13.6) ──

    function onMouseMove(e: MouseEvent): void {
      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        const el = deepElementFromPoint(e.clientX, e.clientY);

        // Skip our own overlay host
        if (!el || el === host || host.contains(el)) return;
        if (el === currentElement) return;

        currentElement = el;
        updateOverlay(el);

        const rect = el.getBoundingClientRect();
        const msg: ContentToBackgroundMessage = {
          type: 'element:hovered',
          payload: {
            tagName: el.tagName.toLowerCase(),
            id: el.id,
            classList: [...el.classList],
            rect: {
              top: Math.round(rect.top),
              left: Math.round(rect.left),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            },
            textPreview: getTextPreview(el),
          },
        };
        port.postMessage(msg);
      });
    }

    function onMouseLeave(): void {
      currentElement = null;
      hideOverlay();
      const msg: ContentToBackgroundMessage = {
        type: 'element:unhovered',
        payload: null,
      };
      port.postMessage(msg);
    }

    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    // ── MutationObserver: reposition overlay if DOM changes (spec section 20) ──
    const observer = new MutationObserver(() => {
      if (currentElement && currentElement.isConnected) {
        updateOverlay(currentElement);
      } else {
        hideOverlay();
        currentElement = null;
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    // ── Listen for agent script messages (spec section 5.1) ──
    window.addEventListener('message', (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!isFlowWindowMessage(event)) return;

      const msg = event.data;
      if (msg.type === 'agent:pong') {
        const bgMsg: ContentToBackgroundMessage = {
          type: 'agent:ready',
          payload: { globals: msg.payload.globals },
        };
        port.postMessage(bgMsg);
      }
    });

    // ── Ping agent script to verify it's alive ──
    const pingMsg: WindowMessage = {
      type: 'content:ping',
      source: FLOW_MESSAGE_SOURCE,
      payload: { timestamp: Date.now() },
    };
    window.postMessage(pingMsg, window.location.origin);

    // ── Cleanup on port disconnect ──
    port.onDisconnect.addListener(() => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      observer.disconnect();
      host.remove();
    });
  },
});
```

**Verify:** Load extension, open any page, hover elements. Blue highlight box should follow the cursor with a label showing the tag name.

**Commit:** `feat(flow2): add content script with element picker and highlight overlay`

---

## Task 4.5 — Element picker selection API + registry

Phase 2 requires a click-selection callback and a stable element index for agent lookups.

**Additions:**
- `elementPicker.onSelect?: (element: Element, meta: SelectedMeta) => void`
- `ElementRegistry` (`packages/extension/src/content/elementRegistry.ts`) that assigns numeric IDs and sets `data-flow-index` on targets
- `elementRegistry.register(element): number` and `elementRegistry.unregister(element): void` (cleans up `data-flow-index`)
- Emit `flow:content:element-selected` with `{ elementIndex, selector, rect }`

**Verify:** Unit test that registration assigns stable IDs and cleans up `data-flow-index` on unregister.

**Commit:** `feat(flow2): add element selection API and registry`

---

## Task 5 — Agent script: inject into page context

Per spec sections 5, 13.1: inject via `world: 'MAIN'` to access React fiber, GSAP globals, window. Uses `defineUnlistedScript` so WXT builds it as a standalone asset.

### `packages/extension/src/entrypoints/agent.ts`

```typescript
import { FLOW_MESSAGE_SOURCE, type AgentPongMessage } from '@flow/shared';

export default defineUnlistedScript({
  main() {
    /**
     * Agent script — runs in the page's MAIN world.
     * Has access to window globals (React, gsap, etc.)
     * Communicates with content script via window.postMessage.
     */

    function detectGlobals(): string[] {
      const globals: string[] = [];
      const win = window as Record<string, unknown>;

      if (win.__REACT_DEVTOOLS_GLOBAL_HOOK__) globals.push('React');
      if (win.gsap) globals.push('gsap');
      if (win.__NEXT_DATA__) globals.push('Next.js');
      if (win.__NUXT__) globals.push('Nuxt');
      if (win.__VUE__) globals.push('Vue');

      return globals;
    }

    // Listen for pings from content script
    window.addEventListener('message', (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (
        !event.data ||
        event.data.source !== FLOW_MESSAGE_SOURCE ||
        event.data.type !== 'content:ping'
      ) {
        return;
      }

      const pong: AgentPongMessage = {
        type: 'agent:pong',
        source: FLOW_MESSAGE_SOURCE,
        payload: {
          timestamp: Date.now(),
          globals: detectGlobals(),
        },
      };
      window.postMessage(pong, window.location.origin);
    });
  },
});
```

**Note:** The agent script is injected by the service worker into the MAIN world (see Task 6). WXT's `defineUnlistedScript` builds it as `/agent.js` in the extension output.

**Commit:** `feat(flow2): add agent script for page-context global detection`

---

## Task 6 — Service worker: message router

Per spec section 5.1: routes messages by tabId between content scripts and DevTools panels. Also injects the agent script when a content script connects.

### `packages/extension/src/entrypoints/background.ts`

```typescript
import {
  FLOW_PORT_NAME,
  FLOW_PANEL_PORT_NAME,
  type ContentToBackgroundMessage,
  type PanelToBackgroundMessage,
} from '@flow/shared';

export default defineBackground(() => {
  /**
   * Service worker — message router keyed by tabId.
   *
   * Content script connects via FLOW_PORT_NAME.
   * DevTools panel connects via FLOW_PANEL_PORT_NAME.
   * Messages from content are forwarded to the panel for the same tab.
   */

  const panelPorts = new Map<number, chrome.runtime.Port>();
  const contentPorts = new Map<number, chrome.runtime.Port>();

  chrome.runtime.onConnect.addListener((port) => {
    // ── Panel connection ──
    if (port.name === FLOW_PANEL_PORT_NAME) {
      const onMessage = (msg: PanelToBackgroundMessage) => {
        if (msg.type === 'panel:init') {
          const tabId = msg.payload.tabId;
          panelPorts.set(tabId, port);

          port.onDisconnect.addListener(() => {
            panelPorts.delete(tabId);
          });
        }
      };
      port.onMessage.addListener(onMessage);
      return;
    }

    // ── Content script connection ──
    if (port.name === FLOW_PORT_NAME) {
      const tabId = port.sender?.tab?.id;
      if (tabId === undefined) return;

      contentPorts.set(tabId, port);

      // Inject agent script into MAIN world now that content script is ready
      chrome.scripting
        .executeScript({
          target: { tabId },
          world: 'MAIN',
          files: ['/agent.js'],
        })
        .catch(() => {
          // Expected to fail on chrome://, edge://, extension pages, etc.
        });

      port.onMessage.addListener((msg: ContentToBackgroundMessage) => {
        // Forward to panel for this tab
        const panelPort = panelPorts.get(tabId);
        if (panelPort) {
          panelPort.postMessage(msg);
        }
      });

      port.onDisconnect.addListener(() => {
        contentPorts.delete(tabId);
      });

      return;
    }
  });
});
```

**Commit:** `feat(flow2): add service worker with tabId message routing and agent injection`

---

## Task 6.5 — Router extension points for future panel ports

Add a helper that can register additional panel ports (mutations, text edit) even if Phase 1 doesn't use them yet.

**Why:** Avoid a Phase 4 router rewrite for extra ports.

**Additions:**
- `registerPanelPort(map, port)` helper
- Allow `FLOW_MUTATION_PORT_NAME` / `FLOW_TEXT_EDIT_PORT_NAME` to register

**Commit:** `chore(flow2): add extensible router for future panel ports`

---

## Task 7 — DevTools panel: minimal React 19 app

Per spec sections 6.2, 13.2: React 19 app in DevTools that receives and displays messages from the content script via the service worker.

### `packages/extension/src/entrypoints/devtools.html`

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <script src="./devtools.ts" type="module"></script>
  </body>
</html>
```

### `packages/extension/src/entrypoints/devtools.ts`

```typescript
// DevTools entry point — creates the Flow panel.
// This runs in the hidden devtools page context (not visible to the user).
chrome.devtools.panels.create('Flow', '', '/panel.html');
```

### `packages/extension/src/entrypoints/panel.html`

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body>
    <div id="root"></div>
    <script src="./panel/main.tsx" type="module"></script>
  </body>
</html>
```

### `packages/extension/src/entrypoints/panel/main.tsx`

```tsx
import { createRoot } from 'react-dom/client';
import { Panel } from './Panel';
import '../../assets/main.css';

const root = document.getElementById('root')!;
createRoot(root).render(<Panel />);
```

### `packages/extension/src/entrypoints/panel/Panel.tsx`

```tsx
import { useState, useEffect, useRef } from 'react';
import {
  FLOW_PANEL_PORT_NAME,
  type BackgroundToPanelMessage,
  type PanelToBackgroundMessage,
  type ElementHoveredMessage,
} from '@flow/shared';

export function Panel() {
  const [hoveredElement, setHoveredElement] =
    useState<ElementHoveredMessage['payload'] | null>(null);
  const [agentGlobals, setAgentGlobals] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const portRef = useRef<chrome.runtime.Port | null>(null);

  useEffect(() => {
    const tabId = chrome.devtools.inspectedWindow.tabId;
    const port = chrome.runtime.connect({ name: FLOW_PANEL_PORT_NAME });
    portRef.current = port;

    // Register this panel with the service worker
    const initMsg: PanelToBackgroundMessage = {
      type: 'panel:init',
      payload: { tabId },
    };
    port.postMessage(initMsg);
    setConnected(true);

    port.onMessage.addListener((msg: BackgroundToPanelMessage) => {
      switch (msg.type) {
        case 'element:hovered':
          setHoveredElement(msg.payload);
          break;
        case 'element:unhovered':
          setHoveredElement(null);
          break;
        case 'agent:ready':
          setAgentGlobals(msg.payload.globals);
          break;
      }
    });

    port.onDisconnect.addListener(() => {
      setConnected(false);
      portRef.current = null;
    });

    return () => {
      port.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 font-mono text-sm">
      <header className="mb-4 flex items-center gap-3">
        <h1 className="text-lg font-bold tracking-tight">Flow</h1>
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            connected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-neutral-500 text-xs">
          {connected ? 'connected' : 'disconnected'}
        </span>
      </header>

      {agentGlobals.length > 0 && (
        <section className="mb-4 p-3 rounded bg-neutral-900 border border-neutral-800">
          <h2 className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
            Detected Globals
          </h2>
          <div className="flex gap-2">
            {agentGlobals.map((g) => (
              <span
                key={g}
                className="px-2 py-0.5 rounded bg-neutral-800 text-xs"
              >
                {g}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="p-3 rounded bg-neutral-900 border border-neutral-800">
        <h2 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
          Hovered Element
        </h2>
        {hoveredElement ? (
          <div className="space-y-1">
            <div>
              <span className="text-blue-400">
                &lt;{hoveredElement.tagName}
              </span>
              {hoveredElement.id && (
                <span className="text-yellow-400">
                  #{hoveredElement.id}
                </span>
              )}
              {hoveredElement.classList.length > 0 && (
                <span className="text-green-400">
                  .{hoveredElement.classList.join('.')}
                </span>
              )}
              <span className="text-blue-400">&gt;</span>
            </div>
            <div className="text-neutral-500 text-xs">
              {hoveredElement.rect.width}x{hoveredElement.rect.height} at (
              {hoveredElement.rect.left}, {hoveredElement.rect.top})
            </div>
            {hoveredElement.textPreview && (
              <div className="text-neutral-400 text-xs truncate">
                &quot;{hoveredElement.textPreview}&quot;
              </div>
            )}
          </div>
        ) : (
          <p className="text-neutral-600 text-xs">
            Hover over an element on the page...
          </p>
        )}
      </section>
    </div>
  );
}
```

**Verify:**

```bash
cd tools/flow && pnpm --filter @flow/extension dev
```

1. Open `chrome://extensions/`, enable Developer mode, load unpacked from `packages/extension/.output/chrome-mv3/`
2. Open any page, open DevTools, find the "Flow" tab
3. Hover elements on the page — panel should update with element info

**Commit:** `feat(flow2): add DevTools panel with React 19 message display`

---

## Task 8 — Wire full message chain end-to-end

At this point all four contexts exist. This task verifies the full chain per spec section 5.1:

```
Agent (MAIN world)
  | window.postMessage + origin check
Content Script (isolated world)
  | chrome.runtime.connect (FLOW_PORT_NAME)
Service Worker
  | port.postMessage (FLOW_PANEL_PORT_NAME)
DevTools Panel
```

### Verification steps (no new code — integration test):

1. **Agent to Content:** Content script sends `content:ping` on load. Agent responds with `agent:pong` including detected globals. Content script receives it via `window.addEventListener('message')` and forwards as `agent:ready` to service worker.

2. **Content to Service Worker to Panel:** Hover an element. Content script sends `element:hovered` via port. Service worker forwards to panel port for the matching tabId. Panel displays the element info.

3. **Panel connection:** Open DevTools, panel sends `panel:init` with `tabId`. Service worker registers the panel port.

4. **Disconnection:** Close DevTools. Panel port disconnects. Service worker removes the port from its map. Content script overlay remains functional (it does not depend on the panel being open).

### Manual test script:

```
1. pnpm --filter @flow/extension dev
2. Load extension in chrome://extensions/ (developer mode, load unpacked)
3. Navigate to http://localhost:3000 (or any page)
4. Open DevTools → "Flow" tab
5. Verify: green "connected" indicator
6. Hover elements → panel shows tagName, id, classList, rect, textPreview
7. On a React page: verify "Detected Globals" shows "React"
8. On a plain HTML page: "Detected Globals" section absent
9. Close DevTools → overlay still highlights on hover
10. Reopen DevTools → Flow tab → reconnects, hover data flows again
```

If any step fails, debug the message chain by adding `console.log` at each relay point (agent, content, background, panel) and checking:
- Background service worker console: `chrome://extensions/` → Flow → "Inspect views: service worker"
- Content script console: page's DevTools console
- Panel console: right-click Flow panel → "Inspect"

**Commit:** `test(flow2): verify end-to-end message chain across all extension contexts`

---

## Task 9 — Handle edge cases for agent injection

The content script sends a `content:ping` immediately on load, but the agent script may not be injected yet (the service worker injects it when the content port connects, which is async). Add a retry mechanism.

### Update `packages/extension/src/entrypoints/content.ts`

Replace the single ping at the bottom with a retry:

```typescript
    // ── Ping agent script with retry (agent may not be injected yet) ──
    function pingAgent(retries = 3): void {
      const pingMsg: WindowMessage = {
        type: 'content:ping',
        source: FLOW_MESSAGE_SOURCE,
        payload: { timestamp: Date.now() },
      };
      window.postMessage(pingMsg, window.location.origin);

      if (retries > 0) {
        setTimeout(() => pingAgent(retries - 1), 500);
      }
    }

    // Start pinging after a short delay to let agent inject
    setTimeout(() => pingAgent(), 200);
```

Remove the old single-ping code:

```typescript
    // DELETE THESE LINES:
    const pingMsg: WindowMessage = {
      type: 'content:ping',
      source: FLOW_MESSAGE_SOURCE,
      payload: { timestamp: Date.now() },
    };
    window.postMessage(pingMsg, window.location.origin);
```

**Commit:** `fix(flow2): retry agent ping to handle async injection timing`

---

## Task 10 — Smoke test checklist

### `packages/extension/SMOKE_TEST.md`

```markdown
# Flow Extension — Phase 1 Smoke Test

## Prerequisites
- Chrome or Chromium-based browser (Arc, Brave, Edge, Vivaldi)
- Node.js 20+
- pnpm 9+

## Setup
1. `cd tools/flow && pnpm install`
2. `pnpm dev` (starts WXT dev server with HMR)
3. Open `chrome://extensions/`
4. Enable "Developer mode" toggle
5. Click "Load unpacked" and select `packages/extension/.output/chrome-mv3/`

## Tests

### 1. Extension loads
- [ ] Extension appears in chrome://extensions/ with no errors
- [ ] No red error badges on the extension card

### 2. Content script highlight overlay
- [ ] Open any page (e.g. https://example.com)
- [ ] Hover over elements — blue highlight box follows cursor
- [ ] Label shows tag name, id, and first 2 classes above the element
- [ ] Label repositions below element when near top of viewport
- [ ] Overlay disappears when mouse leaves the page
- [ ] Overlay does not block clicks or scrolling (pointer-events: none)

### 3. Shadow DOM isolation
- [ ] Page styles do not bleed into the overlay
- [ ] Overlay renders above all page content including modals/popovers

### 4. DevTools panel
- [ ] Open DevTools (F12 or Cmd+Opt+I) — "Flow" tab exists
- [ ] Green dot and "connected" text visible
- [ ] Hover elements on the page — panel updates with tagName, id, classList, dimensions, text preview

### 5. Agent script global detection
- [ ] On a React app: "Detected Globals" section shows "React"
- [ ] On a Next.js app: shows "React" and "Next.js"
- [ ] On a plain HTML page: "Detected Globals" section is not shown

### 6. Disconnect and reconnect
- [ ] Close DevTools — overlay continues working on page (hover highlights still appear)
- [ ] Reopen DevTools — Flow tab reconnects, hover data resumes

### 7. Restricted pages (graceful failure)
- [ ] Navigate to chrome://settings — no errors in extension service worker console
- [ ] Navigate to chrome://extensions — no errors
```

**Commit:** `docs(flow2): add Phase 1 smoke test checklist`

---

## Summary

| Task | Description | Key Files | Est. Time |
|------|-------------|-----------|-----------|
| 1 | pnpm workspace init | `package.json`, `pnpm-workspace.yaml`, `tsconfig.json` | 3 min |
| 2 | Shared types package | `packages/shared/src/{index,messages,constants}.ts` | 5 min |
| 3 | WXT + React 19 scaffold | `packages/extension/{wxt.config.ts,package.json}` | 5 min |
| 4 | Content script overlay | `packages/extension/src/entrypoints/content.ts` | 5 min |
| 4.5 | Selection API + registry | `packages/extension/src/content/elementRegistry.ts` | 5 min |
| 5 | Agent script | `packages/extension/src/entrypoints/agent.ts` | 3 min |
| 6 | Service worker router | `packages/extension/src/entrypoints/background.ts` | 5 min |
| 6.5 | Router extension points | `packages/extension/src/entrypoints/background.ts` | 3 min |
| 7 | DevTools panel | `devtools.{html,ts}`, `panel.html`, `panel/{main.tsx,Panel.tsx}` | 5 min |
| 8 | E2E message chain test | No new files — integration verification | 5 min |
| 9 | Agent injection retry | Update `content.ts` ping logic | 3 min |
| 10 | Smoke test doc | `packages/extension/SMOKE_TEST.md` | 2 min |

**Total: ~49 minutes, ~12 commits, ~900 lines of new code**
