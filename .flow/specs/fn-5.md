# fn-5 Target Project Integration

## Overview

Integrate a Next.js target project into RadFlow for local development via a
dev-only bridge package. The bridge hooks React's fiber tree to build a
`componentMap` — the single source of truth for element ↔ component lookups.

All downstream features (selection, style injection, file writes) consume
`componentMap` via `radflowId` selectors. No separate registries or detection
systems needed.

## Scope

- Next.js App Router projects (Pages Router deferred)
- Dev-time integration only (no production builds)
- Single `componentMap` as the data backbone
- Local dev server orchestration
- Bridge installed on first open, excluded from git

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ RadFlow (Tauri Host)                                            │
│  ┌──────────────┐    postMessage     ┌────────────────────────┐ │
│  │ Preview Shell│◄──────────────────►│ Bridge (in iframe)     │ │
│  │              │   { radflowId }    │                        │ │
│  │ - Selection  │                    │ - Fiber hook           │ │
│  │ - Style edit │                    │ - componentMap         │ │
│  │ - Clipboard  │                    │ - DOM annotation       │ │
│  └──────────────┘                    └────────────────────────┘ │
│         │                                       │               │
│         ▼                                       ▼               │
│  ┌──────────────┐                    ┌────────────────────────┐ │
│  │ Zustand Store│                    │ Next.js Dev Server     │ │
│  │ - edits[]    │                    │ (localhost:3000)       │ │
│  │ - selection  │                    └────────────────────────┘ │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Data Model: componentMap

The `componentMap` is the central data structure. All tasks consume it.

**Important Constraints:**
- **Client components only.** React Server Components (RSC) render on the server and never reach the browser DOM. Only `'use client'` components appear in `componentMap`.
- **Global name:** Always `window.__RADFLOW__` (not `__RADFLOW_HOOK__`).
- **Serialization:** Internal bridge uses `Map<RadflowId, ComponentEntry>`. Over postMessage, the host receives `SerializedComponentEntry[]` (array, not Map).

### TypeScript Interface

```typescript
// Exposed via window.__RADFLOW__ in target iframe (INTERNAL)
interface RadflowBridge {
  version: string;
  componentMap: Map<RadflowId, ComponentEntry>;  // Internal Map
  getEntry(id: RadflowId): ComponentEntry | undefined;
  getEntryByElement(el: HTMLElement): ComponentEntry | undefined;
}

type RadflowId = string; // e.g., "rf_a1b2c3"

interface ComponentEntry {
  // Identity
  radflowId: RadflowId;
  name: string;                    // "Button", "Card", "anonymous"
  displayName: string | null;      // From Component.displayName

  // DOM binding
  element: HTMLElement;            // Live reference (NOT serialized)
  selector: string;                // CSS selector: [data-radflow-id="rf_a1b2c3"]

  // Source location (for file writes)
  source: SourceLocation | null;   // null for node_modules components

  // React internals (readonly, for inspection)
  fiber: {
    type: string;                  // 'function' | 'class' | 'forward_ref' | 'memo'
    props: Record<string, unknown>;
    key: string | null;
  };

  // Hierarchy
  parentId: RadflowId | null;
  childIds: RadflowId[];
}

interface SourceLocation {
  filePath: string;                // Absolute: /Users/.../src/components/Button.tsx
  relativePath: string;            // Relative: src/components/Button.tsx
  line: number;                    // 1-indexed
  column: number;                  // 1-indexed
}

// HOST receives this over postMessage (array, not Map)
interface SerializedComponentEntry {
  radflowId: RadflowId;
  name: string;
  displayName: string | null;
  selector: string;                // No live element ref
  fallbackSelectors: string[];
  source: SourceLocation | null;
  fiberType: string;
  props: Record<string, unknown>;
  parentId: RadflowId | null;
  childIds: RadflowId[];
}
```

### DOM Annotation

Every **client** React component with a DOM node gets annotated:

```html
<button data-radflow-id="rf_a1b2c3" class="btn-primary">
  Click me
</button>
```

**Note:** Server components (`app/page.tsx` without `'use client'`) do not appear in componentMap. Only their client children do.

- IDs are stable across re-renders (keyed by fiber identity)
- IDs regenerate on full page reload (not persisted)
- Only client components annotated (no SSR markers)

### Source Resolution

**Problem:** Next.js uses SWC by default, which does NOT inject `__source` props like Babel did. We need a multi-strategy approach.

**Strategy (in priority order):**

1. **React DevTools Internal API** (preferred)
   ```typescript
   // React 18+ exposes source via DevTools hook
   function getSourceFromDevTools(fiber: Fiber): SourceLocation | null {
     const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
     if (!hook?.rendererInterfaces) return null;

     // Renderer ID is not guaranteed to be 1 - iterate all renderers
     for (const [_id, renderer] of hook.rendererInterfaces) {
       const source = renderer.getSourceForFiber?.(fiber);
       if (source) return source; // { fileName, lineNumber, columnNumber }
     }
     return null;
   }
   ```

2. **Error Stack Parsing** (fallback)
   ```typescript
   // Capture stack trace during render
   function captureSource() {
     const err = new Error();
     const stack = err.stack?.split('\n')[2]; // Caller's frame
     return parseStackFrame(stack); // Extract file:line:col
   }
   ```

3. **Source Maps** (last resort)
   - Fetch `.map` files from Next.js dev server
   - Map minified locations to original source
   - Cache parsed source maps

**Requirements:**
- React 18+ for DevTools API
- Dev mode only (source maps not available in prod)
- node_modules components will have `source: null` (expected)

### Selector Payload (for LLM/Agent Targeting)

Each `ComponentEntry` includes stable selectors for agent-driven edits:

```typescript
interface ComponentEntry {
  // ... other fields ...

  // Primary selector (always available)
  selector: string;                // [data-radflow-id="rf_a1b2c3"]

  // Fallback selectors (for resilience)
  fallbackSelectors: string[];     // ['button[aria-label="Submit"]', '.btn-primary']

  // Context root for scoping
  contextRoot: string;             // [data-radflow-root="preview"]
}
```

This enables:
- Direct element targeting via `radflowId`
- Graceful degradation if IDs regenerate
- Scoped queries within preview iframe

---

## postMessage Protocol

Minimal protocol — all lookups happen via `radflowId`.

### Message Types

```typescript
// Host → Bridge
type HostMessage =
  | { type: 'PING' }
  | { type: 'GET_COMPONENT_MAP' }
  | { type: 'HIGHLIGHT'; radflowId: RadflowId }
  | { type: 'CLEAR_HIGHLIGHT' }
  | { type: 'INJECT_STYLE'; css: string }
  | { type: 'CLEAR_STYLES' };

// Bridge → Host
type BridgeMessage =
  | { type: 'PONG'; version: string }
  | { type: 'COMPONENT_MAP'; entries: SerializedComponentEntry[] }
  | { type: 'SELECTION'; radflowId: RadflowId; source: SourceLocation | null }
  | { type: 'HOVER'; radflowId: RadflowId | null }
  | { type: 'ERROR'; message: string };

// Serialized for postMessage (no live DOM refs)
interface SerializedComponentEntry {
  radflowId: RadflowId;
  name: string;
  displayName: string | null;
  selector: string;
  source: SourceLocation | null;
  fiberType: string;
  props: Record<string, unknown>;
  parentId: RadflowId | null;
  childIds: RadflowId[];
}
```

### Handshake

```
Host                          Bridge
  │                              │
  │──── PING ───────────────────►│
  │                              │
  │◄─── PONG { version } ────────│
  │                              │
  │──── GET_COMPONENT_MAP ──────►│
  │                              │
  │◄─── COMPONENT_MAP ───────────│
  │                              │
```

Bridge sends `COMPONENT_MAP` automatically on:
- Initial handshake
- React commit (debounced 100ms)
- HMR update

---

## Bridge Package Structure

```
@radflow/bridge/
├── package.json
├── src/
│   ├── index.ts           # Entry point, installs hook
│   ├── fiber-hook.ts      # __REACT_DEVTOOLS_GLOBAL_HOOK__ integration
│   ├── component-map.ts   # Map management + source resolution
│   ├── dom-annotator.ts   # data-radflow-id injection
│   ├── message-bridge.ts  # postMessage handler
│   └── types.ts           # Shared types
├── next.config.wrapper.ts # withRadflow() export
└── tsconfig.json
```

### Installation Flow

1. User opens project in RadFlow
2. RadFlow detects Next.js (`next` in dependencies)
3. Detects package manager from lockfile:
   - `pnpm-lock.yaml` → `pnpm add -D`
   - `yarn.lock` → `yarn add -D`
   - `package-lock.json` → `npm install -D`
4. Copies `@radflow/bridge` to `.radflow/bridge/`
5. Runs detected package manager: `{pm} add -D file:.radflow/bridge`
6. Prompts user to wrap `next.config.js`:

```javascript
// next.config.js
const { withRadflow } = require('@radflow/bridge');

module.exports = withRadflow({
  // existing config
});
```

7. Adds `.radflow/` to `.gitignore`
8. User restarts dev server

### Bridge Injection Mechanism

The `withRadflow()` wrapper injects the bridge via Next.js webpack config:

```typescript
// next.config.wrapper.ts
export function withRadflow(nextConfig: NextConfig): NextConfig {
  return {
    ...nextConfig,
    webpack(config, options) {
      // Only inject in dev + client build
      if (options.dev && !options.isServer) {
        // 1. Add bridge as entry point (runs before app)
        const originalEntry = config.entry;
        config.entry = async () => {
          const entries = await originalEntry();

          // Next.js entry names vary by version - try all known client entries
          const clientEntryNames = ['main-app', 'main', 'webpack'];
          let injected = false;

          for (const entryName of clientEntryNames) {
            if (entries[entryName] && Array.isArray(entries[entryName])) {
              entries[entryName].unshift('@radflow/bridge');
              injected = true;
              console.log(`[RadFlow] Injected bridge into entry: ${entryName}`);
              break; // Only inject once
            }
          }

          // Fallback: log warning, don't inject blindly
          if (!injected) {
            console.warn(
              '[RadFlow] Could not find known client entry. Available entries:',
              Object.keys(entries)
            );
            // DO NOT inject into unknown entry - better to fail visibly
            // than inject into server bundle
          }

          return entries;
        };

        // 2. Define globals for bridge detection
        config.plugins.push(
          new webpack.DefinePlugin({
            'process.env.__RADFLOW_ENABLED__': JSON.stringify(true),
          })
        );
      }

      return nextConfig.webpack?.(config, options) ?? config;
    },
  };
}
```

**Health Endpoint via API Route:**

The bridge installer creates an API route (avoids middleware.ts conflicts):

```typescript
// For App Router: app/api/__radflow/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    version: process.env.__RADFLOW_VERSION__ || '0.0.0',
    timestamp: Date.now(),
  });
}

// For Pages Router: pages/api/__radflow/health.ts
// import type { NextApiRequest, NextApiResponse } from 'next';
// export default function handler(req, res) {
//   res.status(200).json({ ok: true, version: '...' });
// }
```

**Why API route instead of middleware:**
- Next.js only allows ONE `middleware.ts` — would conflict with user's existing middleware
- API routes are additive, no collision risk
- Bridge installer detects App Router vs Pages Router and creates appropriate file

**Key points:**
- Entry injection tries multiple known entry names with fallback
- API route handles health endpoint (no middleware conflicts)
- DefinePlugin allows conditional code in bridge

---

## Tasks (Revised)

### fn-5.1 — Bridge Package + Next.js Wrapper

Build the `@radflow/bridge` package with `withRadflow()` config wrapper.

**Acceptance:**
- [ ] Package builds and can be installed via `file:` protocol
- [ ] `withRadflow()` injects bridge script in dev mode only
- [ ] `/__radflow/health` endpoint returns `{ ok: true, version: string }`
- [ ] No injection in production builds
- [ ] Works with Next.js 14+ App Router

**Files:**
- `packages/bridge/` (new)
- Build script to copy into Tauri bundle

---

### fn-5.2 — Fiber Hook + componentMap

Implement React fiber integration and componentMap construction.

**Acceptance:**
- [ ] Hook installs without crashing target app
- [ ] Chains existing DevTools hooks (doesn't replace)
- [ ] `window.__RADFLOW__.componentMap` populated on commit
- [ ] `data-radflow-id` attributes added to DOM elements
- [ ] Source locations resolved via DevTools API → stack parsing → source maps
- [ ] componentMap updates on React re-renders (debounced 100ms)
- [ ] Warning logged when browser DevTools detected
- [ ] Fallback selectors generated (aria-label, className, role)

**Files:**
- `packages/bridge/src/fiber-hook.ts`
- `packages/bridge/src/component-map.ts`
- `packages/bridge/src/dom-annotator.ts`
- `packages/bridge/src/source-resolver.ts`

---

### fn-5.3 — postMessage Protocol

Implement bidirectional messaging between RadFlow host and bridge iframe.

**Acceptance:**
- [ ] Handshake completes within 2s of iframe load
- [ ] Host can request componentMap on demand
- [ ] Bridge pushes componentMap on React commits
- [ ] Selection events (click) sent from bridge to host
- [ ] Highlight commands sent from host to bridge
- [ ] Reconnects automatically on iframe navigation/refresh

**Files:**
- `packages/bridge/src/message-bridge.ts`
- `src/hooks/useBridgeConnection.ts` (RadFlow side)

---

### fn-5.4 — Project Detection + Dev Server Management

Detect Next.js projects and manage dev server lifecycle.

**Acceptance:**
- [ ] Detects Next.js from `package.json` dependencies
- [ ] Identifies package manager (pnpm/npm/yarn) from lockfile
- [ ] Extracts dev command and port from scripts/config
- [ ] Can start/stop dev server from RadFlow
- [ ] Captures stdout/stderr for error display
- [ ] Detects already-running server on expected port

**Files:**
- `src-tauri/src/commands/project.rs`
- `src-tauri/src/commands/dev_server.rs`
- `src/stores/slices/projectSlice.ts`

---

### fn-5.5 — Preview Shell + Style Injection

Build the iframe preview shell with live style injection.

**Acceptance:**
- [ ] Preview shell loads target dev server URL
- [ ] Status UI shows: disconnected / connecting / connected / error
- [ ] Click in iframe sends SELECTION to host
- [ ] Host can inject CSS via INJECT_STYLE message
- [ ] Injected styles scoped via `[data-radflow-id]` selectors
- [ ] Styles cleared on CLEAR_STYLES

**Files:**
- `src/components/PreviewShell.tsx`
- `src/hooks/useStyleInjection.ts`

---

### fn-5.6 — Edit Accumulation + File Write

Accumulate style edits in clipboard and write to source files.

**Acceptance:**
- [ ] Edits stored as `{ radflowId, property, oldValue, newValue }`
- [ ] Edits grouped by source file for batch writing
- [ ] Diff preview shown before write
- [ ] Write only touches target project files (path validation)
- [ ] Backup created before write (`.radflow/backups/`)
- [ ] Clear and undo-last supported

**Files:**
- `src/stores/slices/editsSlice.ts`
- `src-tauri/src/commands/file_write.rs`
- `src/components/EditClipboard.tsx`

---

### fn-5.7 — First-Run Wizard

Guide user through project setup on first open.

**Acceptance:**
- [ ] Step 1: Select project folder (must contain `package.json` with `next`)
- [ ] Step 2: Confirm bridge installation (shows commands to run)
- [ ] Step 3: Prompt to add `withRadflow()` to config
- [ ] Step 4: Start dev server and verify connection
- [ ] Wizard skipped if project already configured
- [ ] Can re-run wizard from settings

**Files:**
- `src/components/FirstRunWizard.tsx`
- `src/stores/slices/wizardSlice.ts`

---

## Deferred / Cut

| Original Task | Disposition |
|---------------|-------------|
| fn-5.12 Hot reload | **Cut** — Next.js HMR works automatically; bridge re-sends componentMap on module updates |
| Pages Router support | **Deferred** — App Router only for v1 |
| Multi-project | **Deferred** — Single project per RadFlow window for v1 |

---

## Quick Commands

```bash
pnpm test                    # Run all tests
pnpm --filter bridge build   # Build bridge package
pnpm tauri dev               # Run RadFlow with dev server
```

## Acceptance (Epic Level)

- [ ] Opening a Next.js App Router project installs bridge locally
- [ ] componentMap populated with source locations for user components
- [ ] Click-to-select works in preview iframe
- [ ] Style edits write back to source files
- [ ] Bridge excluded from git via `.radflow/`

## References

- `docs/reference/component-editor-patterns.md`
- React DevTools source: `facebook/react/packages/react-devtools-shared`
- Next.js plugin patterns: `@next/bundle-analyzer`
