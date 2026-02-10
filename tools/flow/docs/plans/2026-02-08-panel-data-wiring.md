# Panel Data Wiring — Implementation Plan (Revised)

**Date:** 2026-02-08 (revised 2026-02-09)
**Branch:** `feat/flow-wiring-tool-modes`
**Prerequisite docs:** `panel-data-pipeline-audit.md`, `panel-wiring-phases.md`

---

## Goal

Wire all 4 tab panels (Variables, Components, Assets, Accessibility) to load **real data** from the inspected page. Maximize use of Chrome DevTools built-in APIs (`inspectedWindow.eval()`, `getResources()`, CDP domains) to avoid reinventing what the browser already provides.

## Architecture: Two Tiers

### Tier 1 — No Extra Permissions (available now)

```
Panel (DevTools page)
  │
  ├── inspectedWindow.eval(expression)  ──→  Page MAIN world
  │     Returns JSON-serialized result         (React fibers, window globals,
  │     No content script hop needed            document.fonts, CSS custom props)
  │
  ├── inspectedWindow.getResources()    ──→  All loaded page resources
  │     URLs + getContent() for each           (stylesheets, images, fonts, scripts)
  │
  └── sendToContent(msg)  ──→  Background  ──→  Content Script
        Existing port pipeline                    (DOM manipulation, mutations,
        For writes and DOM operations              element selection, overlays)
```

**Strategy:** Use `inspectedWindow.eval()` for all **read-only page scans** (tokens, components, fonts, icons). Use the content script pipeline only for **DOM manipulation** (mutations, highlighting, feature activation) and **per-element inspection** (existing Designer tab).

### Tier 2 — CDP via `chrome.debugger` (requires `"debugger"` permission)

```
Background (service worker)
  │
  └── chrome.debugger.attach({ tabId }, "1.3")
        │
        ├── CSS.getMatchedStylesForNode    → Full cascade (not just computed)
        ├── CSS.getStyleSheetText           → Cross-origin stylesheet content
        ├── CSS.forcePseudoState            → Force :hover/:focus/:active
        ├── Accessibility.queryAXTree       → Browser's real a11y tree
        ├── Overlay.highlightNode           → Native box-model highlights
        ├── DOM.getBoxModel                 → Precise measurements
        └── Page.captureScreenshot          → Full-page / element screenshots
```

**Trade-off:** Adds install warning ("Read and change all your data") + yellow infobar on debugged tab. But enables features that are impossible without it.

## Tech Stack

- **Framework:** WXT 0.20 (Chrome Extension MV3)
- **UI:** React 19 + Tailwind v4 + Zustand 5
- **Testing:** Vitest 3.0 + jsdom + @testing-library/react
- **Types:** `@types/chrome ^0.0.287`
- **Build:** `npx wxt build`
- **Test:** `npm test` (from `packages/extension/`)

## Existing Infrastructure

| What | File | Reuse Strategy |
|------|------|----------------|
| `collectAllCustomPropertyNames()` | `colorTokens.ts:79` | Port logic into `inspectedWindow.eval()` expression |
| `classifyTier()` | `agent/customProperties.ts:29` | Inline into eval expression |
| `handleScanImages()` | `panelRouter.ts:283-307` | Keep for DOM-based image scanning (needs element registration) |
| `handleAccessibility()` | `panelRouter.ts:232-281` | Replace with CDP `Accessibility.queryAXTree` |
| `findFiberForElement()` | `agent/fiberWalker.ts:53` | Keep for per-element inspection; port tree-walk into eval for component scan |
| `sendToContent()` / `onContentMessage()` | `panel/api/contentBridge.ts` | Keep for mutations and features |
| `setTokensFromBridge()` | `tokensSlice.ts:219` | Wire after token scan |

---

## Phase 0: CDP Infrastructure

**Why first:** Multiple phases depend on CDP. Set up the plumbing once, then every phase can use it.

### Task 0.1: Add Debugger Permission

**File:** `packages/extension/wxt.config.ts`

```ts
manifest: {
  name: 'Flow',
  description: 'Visual context tool for AI-assisted web development',
  permissions: ['activeTab', 'scripting', 'storage', 'tabs', 'debugger'],
  host_permissions: ['<all_urls>'],
},
```

**Commit:** `feat: add debugger permission for CDP access`

---

### Task 0.2: CDP Session Manager

**File:** `packages/extension/src/lib/cdpSession.ts` (NEW)

Manages CDP debugger sessions per tab. Attaches lazily on first use, reuses across features, handles detach on tab close.

```ts
/**
 * CDP session manager. Lives in the background service worker.
 * Attaches LAZILY on first CDP call — no debugger bar until a feature needs it.
 * Reuses sessions across features, cleans up on tab close.
 */
const sessions = new Map<number, { domains: Set<string> }>();

// Register cleanup listener ONCE at module level (not per-attach, avoids listener leak)
chrome.debugger.onDetach.addListener((source) => {
  if (source.tabId) sessions.delete(source.tabId);
});

export async function ensureCDP(tabId: number): Promise<void> {
  if (sessions.has(tabId)) return;
  await chrome.debugger.attach({ tabId }, '1.3');
  sessions.set(tabId, { domains: new Set() });
}

export async function enableDomain(tabId: number, domain: string): Promise<void> {
  await ensureCDP(tabId);
  const session = sessions.get(tabId)!;
  if (session.domains.has(domain)) return;
  await chrome.debugger.sendCommand({ tabId }, `${domain}.enable`);
  session.domains.add(domain);
}

export async function cdpCommand(tabId: number, method: string, params?: object): Promise<any> {
  await ensureCDP(tabId);
  return chrome.debugger.sendCommand({ tabId }, method, params);
}

export async function detachCDP(tabId: number): Promise<void> {
  if (!sessions.has(tabId)) return;
  await chrome.debugger.detach({ tabId });
  sessions.delete(tabId);
}
```

**File:** `packages/extension/src/entrypoints/background.ts`

Wire CDP commands into the background message router. **Note:** This uses `chrome.runtime.onMessage` (request/response), which is a separate channel from the existing port-based messaging (`chrome.runtime.connect`). This is intentional — CDP commands are one-shot request/response, while the port pipeline handles streaming events (hover, selection, inspection results). Document this in a comment.

```ts
// CDP command channel — separate from port-based pipeline.
// Ports handle streaming events (hover, selection, inspection).
// sendMessage handles one-shot CDP requests from the panel.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'cdp:command') {
    const { method, params } = message.payload;
    const tabId = message.tabId;
    cdpCommand(tabId, method, params)
      .then(result => sendResponse({ result }))
      .catch(err => sendResponse({ error: err.message }));
    return true; // async response
  }
  // ... existing get-sidecar-status handler
});
```

**File:** `packages/extension/src/panel/api/cdpBridge.ts` (NEW)

Panel-side helper to send CDP commands through the background script:

```ts
/**
 * Send a CDP command from the panel through the background service worker.
 * Uses chrome.runtime.sendMessage (not ports) for one-shot request/response.
 */
export async function cdp(method: string, params?: object): Promise<any> {
  const tabId = chrome.devtools.inspectedWindow.tabId;
  const response = await chrome.runtime.sendMessage({
    type: 'cdp:command',
    tabId,
    payload: { method, params },
  });
  if (response?.error) throw new Error(response.error);
  return response?.result;
}
```

**UX decision — lazy attachment:** CDP attaches a yellow "this tab is being debugged" infobar. The session manager attaches **lazily** on first `cdp()` call, NOT eagerly on panel open. Users who only use token scanning (eval-based) or component detection will never see the bar. It only appears when a CDP feature is first used (a11y audit, cascade view, pseudo-state forcing, screenshots).

**Test:** Build, load extension, verify no debugger bar on panel open. Trigger a CDP feature (e.g., a11y audit), verify bar appears and CDP commands succeed.

**Commit:** `feat: add CDP session manager and panel bridge`

---

## Phase 0.5: Extractable Testable Utilities

**Why before scanners:** The eval strings inline classification logic that can't be unit tested as-is. Extract the pure functions first, test them, then inline into eval expressions with confidence.

### Task 0.5.1: Scanner Utility Functions

**File:** `packages/shared/src/scannerUtils.ts` (NEW)

Extract the logic that will be inlined into eval strings so it can be tested independently:

```ts
/**
 * Pure utility functions used by panel scanners.
 * These are tested here, then inlined (copy-pasted) into
 * inspectedWindow.eval() expressions. Keep them self-contained
 * with no imports.
 */

/** Classify a CSS custom property as brand, semantic, or unknown. */
export function classifyTier(name: string): 'brand' | 'semantic' | 'unknown' {
  const semanticPattern = /^--(?:color|spacing|size|radius|shadow|font|motion)-(?:surface|content|edge|primary|secondary|tertiary|accent|success|warning|error|info|inverse|muted|disabled|hover|active|focus)/;
  if (semanticPattern.test(name)) return 'semantic';
  if (/^--(color|spacing|size|radius|shadow|font|motion)-/.test(name)) return 'brand';
  return 'unknown';
}

/** Infer a token category from its CSS custom property name prefix. */
export function inferCategory(name: string): 'color' | 'spacing' | 'radius' | 'shadow' | 'font' | 'motion' | 'size' | 'other' {
  if (name.startsWith('--color-')) return 'color';
  if (name.startsWith('--spacing-')) return 'spacing';
  if (name.startsWith('--radius-')) return 'radius';
  if (name.startsWith('--shadow-')) return 'shadow';
  if (name.startsWith('--font-')) return 'font';
  if (name.startsWith('--motion-')) return 'motion';
  if (name.startsWith('--size-')) return 'size';
  return 'other';
}

/** Dedup scanned items by a composite key, summing instance counts. */
export function dedupByKey<T extends { instances: number }>(
  items: T[],
  keyFn: (item: T) => string,
): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    const key = keyFn(item);
    const existing = map.get(key);
    if (existing) {
      existing.instances += item.instances;
    } else {
      map.set(key, { ...item });
    }
  }
  return Array.from(map.values());
}

/** Check if a React component name looks like a user component (not internal). */
export function isUserComponent(name: string | null): boolean {
  if (!name) return false;
  if (name.startsWith('_')) return false;
  if (name[0] !== name[0].toUpperCase()) return false;
  return true;
}
```

**File:** `packages/shared/src/__tests__/scannerUtils.test.ts` (NEW)

```ts
import { describe, it, expect } from 'vitest';
import { classifyTier, inferCategory, dedupByKey, isUserComponent } from '../scannerUtils';

describe('classifyTier', () => {
  it('classifies semantic tokens', () => {
    expect(classifyTier('--color-surface-primary')).toBe('semantic');
    expect(classifyTier('--spacing-content-primary')).toBe('semantic');
  });

  it('classifies brand tokens', () => {
    expect(classifyTier('--color-sun-yellow')).toBe('brand');
    expect(classifyTier('--spacing-lg')).toBe('brand');
  });

  it('classifies unknown tokens', () => {
    expect(classifyTier('--custom-thing')).toBe('unknown');
    expect(classifyTier('--tw-ring-offset')).toBe('unknown');
  });
});

describe('inferCategory', () => {
  it('maps prefixes to categories', () => {
    expect(inferCategory('--color-primary')).toBe('color');
    expect(inferCategory('--spacing-4')).toBe('spacing');
    expect(inferCategory('--radius-md')).toBe('radius');
    expect(inferCategory('--shadow-lg')).toBe('shadow');
    expect(inferCategory('--font-sans')).toBe('font');
    expect(inferCategory('--motion-ease')).toBe('motion');
    expect(inferCategory('--size-lg')).toBe('size');
    expect(inferCategory('--tw-ring')).toBe('other');
  });
});

describe('dedupByKey', () => {
  it('merges items with same key, summing instances', () => {
    const items = [
      { name: 'Button', instances: 3 },
      { name: 'Button', instances: 5 },
      { name: 'Card', instances: 1 },
    ];
    const result = dedupByKey(items, i => i.name);
    expect(result).toEqual([
      { name: 'Button', instances: 8 },
      { name: 'Card', instances: 1 },
    ]);
  });
});

describe('isUserComponent', () => {
  it('accepts PascalCase names', () => {
    expect(isUserComponent('Button')).toBe(true);
    expect(isUserComponent('NavBar')).toBe(true);
  });

  it('rejects internal/private names', () => {
    expect(isUserComponent('_Internal')).toBe(false);
    expect(isUserComponent('useEffect')).toBe(false);
    expect(isUserComponent(null)).toBe(false);
  });
});
```

**Key pattern:** Write the logic as importable functions, verify with tests, then copy the function bodies into eval strings. If the logic changes, update the source function, run tests, then update the eval inline copy. Add a comment in each eval string: `// Inlined from scannerUtils.ts — keep in sync`.

**Commit:** `feat: add scanner utility functions with tests`

---

## Phase 1: Variables / Design Tokens (Critical Path)

**Why first:** The color tool, spacing tool, and typography tool all need token data.

### Task 1.1: Token Scan Types

**File:** `packages/shared/src/messages.ts`

```ts
export interface ScannedToken {
  name: string;
  value: string;
  resolvedValue: string;
  darkValue?: string;
  category: 'color' | 'spacing' | 'radius' | 'shadow' | 'font' | 'motion' | 'size' | 'other';
  tier: 'brand' | 'semantic' | 'unknown';
}

export interface TokenScanResult {
  tokens: ScannedToken[];
  framework?: string;
  colorScheme: 'light' | 'dark' | 'both';
}
```

No message types needed — the scan runs directly in the panel via `inspectedWindow.eval()`, not through the port pipeline.

**Commit:** `feat: add ScannedToken types`

---

### Task 1.2: Token Scanner via `inspectedWindow.eval()`

**File:** `packages/extension/src/panel/scanners/tokenScanner.ts` (NEW)

Runs from the panel directly. No content script hop. The eval expression is a self-contained IIFE that walks stylesheets and reads computed values.

```ts
import type { ScannedToken, TokenScanResult } from '@flow/shared';

/**
 * Scan all CSS custom properties from the inspected page.
 * Uses inspectedWindow.eval() to run in the page's MAIN world.
 */
export async function scanTokens(): Promise<TokenScanResult> {
  const [result, exceptionInfo] = await chrome.devtools.inspectedWindow.eval(`
    (function() {
      // ── Collect custom property names from all stylesheets ──
      const names = new Set();

      function walkRules(rules) {
        for (let i = 0; i < rules.length; i++) {
          const rule = rules[i];
          if (rule instanceof CSSStyleRule) {
            for (let j = 0; j < rule.style.length; j++) {
              const prop = rule.style[j];
              if (prop.startsWith('--')) names.add(prop);
            }
          } else if (rule.cssRules) {
            walkRules(rule.cssRules); // @media, @supports, @layer
          }
          // @property rules
          if (rule.constructor.name === 'CSSPropertyRule' && rule.name?.startsWith('--')) {
            names.add(rule.name);
          }
        }
      }

      try {
        for (const sheet of document.styleSheets) {
          try { walkRules(sheet.cssRules); } catch(e) { /* cross-origin */ }
        }
      } catch(e) {}

      // ── Resolve values ──
      const computed = getComputedStyle(document.documentElement);
      const canvas = document.createElement('canvas').getContext('2d');
      const tokens = [];

      for (const name of names) {
        const value = computed.getPropertyValue(name).trim();
        if (!value) continue;

        // Resolve color values via canvas
        let resolvedValue = value;
        if (name.startsWith('--color-') && canvas) {
          try { canvas.fillStyle = value; resolvedValue = canvas.fillStyle; } catch(e) {}
        }

        // Classify tier
        const semantic = /^--(?:color|spacing|size|radius|shadow|font|motion)-(?:surface|content|edge|primary|secondary|tertiary|accent|success|warning|error|info|inverse|muted|disabled|hover|active|focus)/.test(name);
        const tier = semantic ? 'semantic' : name.match(/^--(color|spacing|size|radius|shadow|font|motion)-/) ? 'brand' : 'unknown';

        // Infer category
        let category = 'other';
        if (name.startsWith('--color-')) category = 'color';
        else if (name.startsWith('--spacing-')) category = 'spacing';
        else if (name.startsWith('--radius-')) category = 'radius';
        else if (name.startsWith('--shadow-')) category = 'shadow';
        else if (name.startsWith('--font-')) category = 'font';
        else if (name.startsWith('--motion-')) category = 'motion';
        else if (name.startsWith('--size-')) category = 'size';

        tokens.push({ name, value, resolvedValue, category, tier });
      }

      // ── Detect dark mode values ──
      const darkTokens = {};
      try {
        for (const sheet of document.styleSheets) {
          try {
            for (const rule of sheet.cssRules) {
              const isDark = (rule instanceof CSSMediaRule && rule.conditionText?.includes('prefers-color-scheme: dark'))
                || (rule instanceof CSSStyleRule && (rule.selectorText?.includes('.dark') || rule.selectorText?.includes('[data-theme="dark"]')));
              if (isDark && rule.cssRules) {
                for (const inner of rule.cssRules) {
                  if (inner instanceof CSSStyleRule) {
                    for (let i = 0; i < inner.style.length; i++) {
                      const prop = inner.style[i];
                      if (prop.startsWith('--')) darkTokens[prop] = inner.style.getPropertyValue(prop).trim();
                    }
                  }
                }
              }
              if (isDark && rule instanceof CSSStyleRule) {
                for (let i = 0; i < rule.style.length; i++) {
                  const prop = rule.style[i];
                  if (prop.startsWith('--')) darkTokens[prop] = rule.style.getPropertyValue(prop).trim();
                }
              }
            }
          } catch(e) {}
        }
      } catch(e) {}

      // Merge dark values
      for (const token of tokens) {
        if (darkTokens[token.name] && darkTokens[token.name] !== token.value) {
          token.darkValue = darkTokens[token.name];
        }
      }

      // ── Detect framework ──
      let framework = undefined;
      try {
        for (const sheet of document.styleSheets) {
          try {
            for (const rule of sheet.cssRules) {
              if (rule.cssText?.includes('@theme')) { framework = 'tailwind-v4'; break; }
            }
          } catch(e) {}
          if (framework) break;
        }
      } catch(e) {}
      if (!framework) {
        const hasTw = tokens.some(t => t.name.startsWith('--tw-'));
        if (hasTw) framework = 'tailwind-v3';
      }

      return {
        tokens,
        framework,
        colorScheme: Object.keys(darkTokens).length > 0 ? 'both' : 'light',
      };
    })()
  `);

  if (exceptionInfo?.isError) {
    console.error('[tokenScanner] eval error:', exceptionInfo.description);
    return { tokens: [], colorScheme: 'light' };
  }

  return result as TokenScanResult;
}
```

**Why `eval()` over content script:** Skips the panel→background→content→background→panel round-trip. The token scan is a pure read with no DOM side effects — perfect for eval.

**Test file:** `packages/extension/src/panel/scanners/__tests__/tokenScanner.test.ts` — test the classification/category inference logic extracted as pure functions.

**Commit:** `feat: add token scanner via inspectedWindow.eval()`

---

### Task 1.3: Wire VariablesPanel to Real Data

**File:** `packages/extension/src/panel/components/VariablesPanel.tsx`

1. Import `scanTokens` from `../scanners/tokenScanner`
2. Call `scanTokens()` on mount (async, no message passing needed)
3. Update state with real tokens
4. Delete `mockTokens` object (lines 252-265)
5. Add loading/empty states, "Rescan" button

```tsx
useEffect(() => {
  let cancelled = false;
  setLoading(true);
  scanTokens().then(result => {
    if (!cancelled) {
      setTokens(result.tokens);
      setFramework(result.framework);
      setLoading(false);
    }
  });
  return () => { cancelled = true; };
}, []);
```

**Commit:** `feat: wire VariablesPanel to real token scan`

---

### Task 1.4: CDP Enhancement — Cross-Origin Stylesheets

Content script stylesheet walking throws `SecurityError` on cross-origin sheets. CDP bypasses this.

**File:** `packages/extension/src/panel/scanners/tokenScanner.ts`

Add a fallback that uses `CSS.getStyleSheetText` via CDP to read cross-origin stylesheets:

```ts
import { cdp } from '../api/cdpBridge';

async function scanCrossOriginTokens(): Promise<ScannedToken[]> {
  await cdp('CSS.enable');
  // CSS.enable triggers CSS.styleSheetAdded events for all sheets
  // Listen for them, then getStyleSheetText for cross-origin ones
  // Parse the text for custom property declarations
}
```

This supplements the eval-based scanner by catching tokens defined in third-party stylesheets (CDN-hosted design systems, etc.).

**Commit:** `feat: scan cross-origin stylesheets via CDP`

---

## Phase 2: Universal Component Detection

### Task 2.1: Component Scan Types

**File:** `packages/shared/src/messages.ts`

```ts
export interface ScannedComponent {
  name: string;
  framework: 'react' | 'vue' | 'svelte' | 'angular' | 'web-component' | 'html';
  instances: number;
  selector: string;
  source?: { fileName: string; lineNumber: number; columnNumber: number };
  hierarchy?: string[];
}

export interface ComponentScanResult {
  components: ScannedComponent[];
  framework?: string;
}
```

**Commit:** `feat: add ScannedComponent types`

---

### Task 2.2: Component Scanner via `inspectedWindow.eval()`

**File:** `packages/extension/src/panel/scanners/componentScanner.ts` (NEW)

```ts
import type { ScannedComponent, ComponentScanResult } from '@flow/shared';

export async function scanComponents(): Promise<ComponentScanResult> {
  const [result, exceptionInfo] = await chrome.devtools.inspectedWindow.eval(`
    (function() {
      const components = [];
      let framework = undefined;

      // ── Tier 1: React fiber tree ──
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (hook) {
        framework = 'react';
        try {
          // Iterate ALL renderers — don't hardcode renderer ID.
          // hook._renderers is a Map<number, Renderer>. Each renderer
          // has its own set of fiber roots via hook.getFiberRoots(id).
          const rendererIds = hook._renderers ? Array.from(hook._renderers.keys()) : [];
          // Fallback: if _renderers is empty, try the __reactFiber$ key approach
          // (same pattern as fiberWalker.ts:58-64 — works without DevTools hook)
          if (rendererIds.length === 0) {
            // Walk all DOM elements, find those with __reactFiber$ keys
            document.querySelectorAll('*').forEach(el => {
              const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
              if (fiberKey) {
                let fiber = el[fiberKey];
                // Walk up to the root to find the component fiber
                while (fiber && fiber.return) fiber = fiber.return;
                if (fiber) {
                  function walkFiber(f) {
                    if (!f) return;
                    if ((f.tag === 0 || f.tag === 1) && f.type) {
                      const name = f.type.displayName || f.type.name || null;
                      if (name && !name.startsWith('_') && name[0] === name[0].toUpperCase()) {
                        let sel = '';
                        if (f.stateNode instanceof HTMLElement) {
                          sel = f.stateNode.tagName.toLowerCase();
                          if (f.stateNode.id) sel += '#' + f.stateNode.id;
                        }
                        const source = f._debugSource ? {
                          fileName: f._debugSource.fileName,
                          lineNumber: f._debugSource.lineNumber,
                          columnNumber: f._debugSource.columnNumber || 0,
                        } : undefined;
                        components.push({ name, framework: 'react', selector: sel, instances: 1, source });
                      }
                    }
                    walkFiber(f.child);
                    walkFiber(f.sibling);
                  }
                  walkFiber(fiber);
                }
              }
            });
          }
          // Primary path: iterate each renderer's fiber roots
          for (const id of rendererIds) {
            const fiberRoots = hook.getFiberRoots ? hook.getFiberRoots(id) : null;
            if (!fiberRoots) continue;
            for (const root of fiberRoots) {
              function walkFiber(fiber) {
                if (!fiber) return;
                // Function/class components have a tag of 0 (FunctionComponent) or 1 (ClassComponent)
                if ((fiber.tag === 0 || fiber.tag === 1) && fiber.type) {
                  const name = fiber.type.displayName || fiber.type.name || null;
                  if (name && !name.startsWith('_') && name[0] === name[0].toUpperCase()) {
                    let selector = '';
                    if (fiber.stateNode instanceof HTMLElement) {
                      selector = fiber.stateNode.tagName.toLowerCase();
                      if (fiber.stateNode.id) selector += '#' + fiber.stateNode.id;
                    }
                    const source = fiber._debugSource ? {
                      fileName: fiber._debugSource.fileName,
                      lineNumber: fiber._debugSource.lineNumber,
                      columnNumber: fiber._debugSource.columnNumber || 0,
                    } : undefined;
                    components.push({ name, framework: 'react', selector, instances: 1, source });
                  }
                }
                walkFiber(fiber.child);
                walkFiber(fiber.sibling);
              }
              walkFiber(root.current);
            }
          }
        } catch(e) {}
      }

      // ── Tier 2: Vue components ──
      if (window.__VUE__) {
        framework = framework || 'vue';
        document.querySelectorAll('*').forEach(el => {
          const vm = el.__vue__ || el.__vueParentComponent;
          if (vm) {
            const name = vm.$options?.name || vm.type?.name || vm.type?.__name;
            if (name) components.push({ name, framework: 'vue', selector: el.tagName.toLowerCase(), instances: 1 });
          }
        });
      }

      // ── Tier 3: Svelte ──
      document.querySelectorAll('*').forEach(el => {
        if (el.__svelte_meta) {
          framework = framework || 'svelte';
          const name = el.__svelte_meta?.loc?.file?.split('/')?.pop()?.replace('.svelte', '') || 'SvelteComponent';
          components.push({ name, framework: 'svelte', selector: el.tagName.toLowerCase(), instances: 1 });
        }
      });

      // ── Tier 4: Custom Elements ──
      const customEls = new Map();
      document.querySelectorAll('*').forEach(el => {
        if (el.localName.includes('-') && customElements.get(el.localName)) {
          const existing = customEls.get(el.localName);
          if (existing) { existing.instances++; }
          else { customEls.set(el.localName, { name: el.localName, framework: 'web-component', selector: el.localName, instances: 1 }); }
        }
      });
      components.push(...customEls.values());

      // ── Tier 5: Semantic HTML landmarks ──
      const landmarks = {};
      document.querySelectorAll('header, nav, main, section, article, aside, footer, form, dialog').forEach(el => {
        const tag = el.tagName.toLowerCase();
        if (landmarks[tag]) { landmarks[tag].instances++; }
        else { landmarks[tag] = { name: tag, framework: 'html', selector: tag, instances: 1 }; }
      });
      components.push(...Object.values(landmarks));

      // ── Dedup by name ──
      const grouped = new Map();
      for (const c of components) {
        const key = c.framework + ':' + c.name;
        const existing = grouped.get(key);
        if (existing) { existing.instances += c.instances; }
        else { grouped.set(key, { ...c }); }
      }

      return { components: Array.from(grouped.values()), framework };
    })()
  `);

  if (exceptionInfo?.isError) {
    console.error('[componentScanner] eval error:', exceptionInfo.description);
    return { components: [] };
  }

  return result as ComponentScanResult;
}
```

**Commit:** `feat: add universal component scanner via inspectedWindow.eval()`

---

### Task 2.3: Wire ComponentsPanel

**File:** `packages/extension/src/panel/components/ComponentsPanel.tsx`

1. Import `scanComponents` from `../scanners/componentScanner`
2. Call `scanComponents()` on mount (direct async, no message passing)
3. Replace `DisplayComponent` with `ScannedComponent`
4. Show framework badges, instance counts, source locations
5. Remove `panel:get-component-map` listener and `data-radflow-id` references

**Commit:** `feat: wire ComponentsPanel to universal component scanner`

---

### Task 2.4: Clean Up Dead Component Code

- Remove `handleGetComponentMap()` from `panelRouter.ts:378-400`
- Remove `PanelGetComponentMapMessage` from `messages.ts`
- Evaluate `componentsSlice.ts` — delete if unused

**Commit:** `chore: remove dead component-map code`

---

## Phase 3: Assets (Images + Icons + Fonts)

### Task 3.1: Resource Discovery via `getResources()`

**File:** `packages/extension/src/panel/scanners/resourceScanner.ts` (NEW)

Use `chrome.devtools.inspectedWindow.getResources()` as the **primary** asset discovery method. This catches everything loaded over the network — even resources not in the DOM.

```ts
export interface PageResources {
  stylesheets: ResourceInfo[];
  images: ResourceInfo[];
  fonts: ResourceInfo[];
  scripts: ResourceInfo[];
}

export interface ResourceInfo {
  url: string;
  type: 'stylesheet' | 'image' | 'font' | 'script';
  fileName: string;
  extension: string;
}

export async function discoverResources(): Promise<PageResources> {
  const resources = await chrome.devtools.inspectedWindow.getResources();

  // Extension → resource type → PageResources key
  const EXT_MAP: Record<string, { type: ResourceInfo['type']; key: keyof PageResources }> = {
    css:   { type: 'stylesheet', key: 'stylesheets' },
    png:   { type: 'image', key: 'images' },
    jpg:   { type: 'image', key: 'images' },
    jpeg:  { type: 'image', key: 'images' },
    gif:   { type: 'image', key: 'images' },
    svg:   { type: 'image', key: 'images' },
    webp:  { type: 'image', key: 'images' },
    avif:  { type: 'image', key: 'images' },
    ico:   { type: 'image', key: 'images' },
    woff:  { type: 'font', key: 'fonts' },
    woff2: { type: 'font', key: 'fonts' },
    ttf:   { type: 'font', key: 'fonts' },
    otf:   { type: 'font', key: 'fonts' },
    eot:   { type: 'font', key: 'fonts' },
    js:    { type: 'script', key: 'scripts' },
    mjs:   { type: 'script', key: 'scripts' },
  };

  const result: PageResources = { stylesheets: [], images: [], fonts: [], scripts: [] };
  for (const r of resources) {
    const fileName = r.url.split('/').pop()?.split('?')[0] || '';
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const mapping = EXT_MAP[ext];
    if (mapping) {
      result[mapping.key].push({ url: r.url, type: mapping.type, fileName, extension: ext });
    }
  }
  return result;
}

// Listen for new resources loaded after initial scan
export function onNewResource(callback: (info: ResourceInfo) => void): void {
  chrome.devtools.inspectedWindow.onResourceAdded.addListener((resource) => {
    // classify and callback
  });
}
```

**Commit:** `feat: add resource discovery via getResources()`

---

### Task 3.2: Font Scanner via `inspectedWindow.eval()`

**File:** `packages/extension/src/panel/scanners/fontScanner.ts` (NEW)

Combines `document.fonts` API with `@font-face` rule parsing. Enriches the `getResources()` font URLs with usage data.

```ts
export interface FontAsset {
  family: string;
  weights: string[];
  styles: string[];
  source?: string;
  format?: string;
  usageCount: number;
}

export async function scanFonts(): Promise<FontAsset[]> {
  const [result, exceptionInfo] = await chrome.devtools.inspectedWindow.eval(`
    (function() {
      const fontMap = {};

      // 1. document.fonts API (all loaded FontFace objects)
      for (const face of document.fonts) {
        const family = face.family.replace(/['"]/g, '');
        if (!fontMap[family]) fontMap[family] = { family, weights: [], styles: [], usageCount: 0 };
        if (!fontMap[family].weights.includes(face.weight)) fontMap[family].weights.push(face.weight);
        if (!fontMap[family].styles.includes(face.style)) fontMap[family].styles.push(face.style);
      }

      // 2. @font-face rules from stylesheets (source URLs, formats)
      try {
        for (const sheet of document.styleSheets) {
          try {
            for (const rule of sheet.cssRules) {
              if (rule instanceof CSSFontFaceRule) {
                const family = rule.style.getPropertyValue('font-family').replace(/['"]/g, '').trim();
                const src = rule.style.getPropertyValue('src');
                const weight = rule.style.getPropertyValue('font-weight') || '400';
                const style = rule.style.getPropertyValue('font-style') || 'normal';
                if (!fontMap[family]) fontMap[family] = { family, weights: [], styles: [], usageCount: 0 };
                if (src) fontMap[family].source = src.match(/url\\(["']?([^"')]+)/)?.[1];
                const fmt = src?.match(/format\\(["']?([^"')]+)/)?.[1];
                if (fmt) fontMap[family].format = fmt;
                if (!fontMap[family].weights.includes(weight)) fontMap[family].weights.push(weight);
                if (!fontMap[family].styles.includes(style)) fontMap[family].styles.push(style);
              }
            }
          } catch(e) {}
        }
      } catch(e) {}

      // 3. Usage count (sample visible elements)
      const sample = document.querySelectorAll('body *');
      const limit = Math.min(sample.length, 500);
      for (let i = 0; i < limit; i++) {
        const computed = getComputedStyle(sample[i]);
        const families = computed.fontFamily.split(',').map(f => f.trim().replace(/['"]/g, ''));
        for (const f of families) {
          if (fontMap[f]) fontMap[f].usageCount++;
        }
      }

      return Object.values(fontMap);
    })()
  `);

  if (exceptionInfo?.isError) return [];
  return result as FontAsset[];
}
```

**Commit:** `feat: add font scanner via inspectedWindow.eval()`

---

### Task 3.3: Icon/SVG Scanner via `inspectedWindow.eval()`

**File:** `packages/extension/src/panel/scanners/iconScanner.ts` (NEW)

```ts
export interface IconAsset {
  name: string;
  type: 'inline-svg' | 'sprite' | 'icon-font';
  svgSource?: string;
  selector: string;
  size: { width: number; height: number };
  className?: string;
}

export async function scanIcons(): Promise<IconAsset[]> {
  const [result, exceptionInfo] = await chrome.devtools.inspectedWindow.eval(`
    (function() {
      const icons = [];

      // 1. Inline SVGs (< 64px = likely icon)
      document.querySelectorAll('svg').forEach((svg, i) => {
        const rect = svg.getBoundingClientRect();
        if (rect.width > 0 && rect.width <= 64 && rect.height <= 64) {
          icons.push({
            name: svg.id || svg.getAttribute('aria-label') || svg.closest('[class]')?.className?.split(' ')[0] || 'svg-' + i,
            type: 'inline-svg',
            svgSource: svg.outerHTML,
            selector: 'svg:nth-of-type(' + (i + 1) + ')',
            size: { width: Math.round(rect.width), height: Math.round(rect.height) },
          });
        }
      });

      // 2. SVG sprites (<use href="#...">)
      document.querySelectorAll('use').forEach(use => {
        const href = use.getAttribute('href') || use.getAttribute('xlink:href');
        if (href?.startsWith('#')) {
          const symbol = document.querySelector(href);
          if (symbol) {
            const parent = use.closest('svg');
            const rect = parent?.getBoundingClientRect() || { width: 24, height: 24 };
            icons.push({
              name: href.slice(1),
              type: 'sprite',
              svgSource: symbol.outerHTML,
              selector: href,
              size: { width: Math.round(rect.width), height: Math.round(rect.height) },
            });
          }
        }
      });

      // 3. Icon fonts (FontAwesome, Material Icons, etc.)
      document.querySelectorAll('[class*="fa-"], .material-icons, [class*="icon-"]').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width <= 64) {
          icons.push({
            name: el.className,
            type: 'icon-font',
            selector: '.' + [...el.classList].join('.'),
            size: { width: Math.round(rect.width), height: Math.round(rect.height) },
            className: el.className,
          });
        }
      });

      return icons;
    })()
  `);

  if (exceptionInfo?.isError) return [];
  return result as IconAsset[];
}
```

**Commit:** `feat: add icon/SVG scanner via inspectedWindow.eval()`

---

### Task 3.4: Wire AssetsPanel

**File:** `packages/extension/src/panel/components/AssetsPanel.tsx`

1. On mount, call all scanners in parallel:
   ```ts
   const [resources, fonts, icons] = await Promise.all([
     discoverResources(),
     scanFonts(),
     scanIcons(),
   ]);
   ```
2. Also send `panel:scan-images` for DOM-based image data (alt text, render size)
3. Merge `resources.images` (network URLs) with DOM scan (alt/dimensions) for richest data
4. Sub-tabs: **Fonts** (replace Logos), **Images**, **Icons**
5. Delete all `mockIcons`, `mockLogos`, `mockImages` arrays
6. Remove dead `useAppStore` import

**Commit:** `feat: wire AssetsPanel to real asset scanners`

---

## Phase 4: Accessibility (CDP-Powered)

### Task 4.1: CDP Accessibility Tree Scanner

**File:** `packages/extension/src/panel/scanners/accessibilityScanner.ts` (NEW)

Use CDP `Accessibility.queryAXTree` as the **primary** approach. This is the browser's actual computed accessibility tree — the same data Chrome DevTools' Accessibility panel shows.

```ts
import { cdp } from '../api/cdpBridge';

export interface AuditViolation {
  nodeSelector: string;
  nodeName: string;
  severity: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  suggestion: string;
}

export interface AccessibilityAudit {
  violations: AuditViolation[];
  summary: { errors: number; warnings: number; passed: number };
  headingHierarchy: { level: number; text: string; nodeSelector: string }[];
  landmarks: { role: string; name: string; nodeSelector: string }[];
  ariaTree: AXNodeSummary[];
}

export interface AXNodeSummary {
  role: string;
  name: string;
  nodeId: string;
  children: string[];
  ignored: boolean;
  properties: Record<string, string>;
}

export async function auditAccessibility(): Promise<AccessibilityAudit> {
  // Enable required domains
  await cdp('Accessibility.enable');
  await cdp('DOM.enable');

  // Get document root
  const { root } = await cdp('DOM.getDocument', { depth: 0 });

  // ── Get full accessibility tree ──
  const { nodes } = await cdp('Accessibility.getFullAXTree', { depth: 10 });

  const violations: AuditViolation[] = [];
  const headings: AccessibilityAudit['headingHierarchy'] = [];
  const landmarks: AccessibilityAudit['landmarks'] = [];
  const ariaTree: AXNodeSummary[] = [];

  // Process AX nodes
  for (const node of nodes) {
    if (node.ignored) continue;

    const role = node.role?.value || '';
    const name = node.name?.value || '';

    // Build tree summary
    ariaTree.push({
      role,
      name,
      nodeId: node.nodeId,
      children: node.childIds || [],
      ignored: node.ignored,
      properties: Object.fromEntries((node.properties || []).map(p => [p.name, String(p.value?.value)])),
    });

    // Collect headings
    if (role === 'heading') {
      const level = node.properties?.find(p => p.name === 'level')?.value?.value || 0;
      headings.push({ level, text: name, nodeSelector: '' });
    }

    // Collect landmarks
    if (['banner', 'navigation', 'main', 'contentinfo', 'complementary', 'form', 'search', 'region'].includes(role)) {
      landmarks.push({ role, name, nodeSelector: '' });
    }

    // ── Violation checks ──

    // Images without names
    if (role === 'img' && !name) {
      violations.push({
        nodeSelector: '', nodeName: 'img',
        severity: 'error', rule: 'img-alt',
        message: 'Image missing accessible name',
        suggestion: 'Add alt text or aria-label',
      });
    }

    // Buttons without names
    if (role === 'button' && !name) {
      violations.push({
        nodeSelector: '', nodeName: 'button',
        severity: 'error', rule: 'button-name',
        message: 'Button missing accessible name',
        suggestion: 'Add text content, aria-label, or aria-labelledby',
      });
    }

    // Links without names
    if (role === 'link' && !name) {
      violations.push({
        nodeSelector: '', nodeName: 'a',
        severity: 'error', rule: 'link-name',
        message: 'Link missing accessible name',
        suggestion: 'Add text content or aria-label',
      });
    }

    // Form inputs without labels
    if (['textbox', 'combobox', 'listbox', 'checkbox', 'radio', 'spinbutton', 'slider'].includes(role) && !name) {
      violations.push({
        nodeSelector: '', nodeName: role,
        severity: 'error', rule: 'input-label',
        message: `${role} missing accessible label`,
        suggestion: 'Add a <label>, aria-label, or aria-labelledby',
      });
    }
  }

  // ── Heading hierarchy check ──
  let lastLevel = 0;
  for (const h of headings) {
    if (h.level > lastLevel + 1) {
      violations.push({
        nodeSelector: h.nodeSelector, nodeName: `h${h.level}`,
        severity: 'warning', rule: 'heading-order',
        message: `Heading level skipped: h${lastLevel} → h${h.level}`,
        suggestion: `Use h${lastLevel + 1} instead`,
      });
    }
    lastLevel = h.level;
  }

  // ── Contrast checks (via inspectedWindow.eval for DOM access) ──
  // CDP doesn't directly provide contrast ratios, so we supplement with
  // the existing getContrastRatio() logic via eval

  const summary = {
    errors: violations.filter(v => v.severity === 'error').length,
    warnings: violations.filter(v => v.severity === 'warning').length,
    passed: nodes.filter(n => !n.ignored).length - violations.length,
  };

  return { violations, summary, headingHierarchy: headings, landmarks, ariaTree };
}
```

**Why CDP over DOM scanning:** The browser's accessibility tree includes computed roles (not just explicit ARIA), computed accessible names (resolved from `<label>`, `aria-labelledby`, `title`, content), focus order, and ignored reasons. Our existing `handleAccessibility()` manually checks a fraction of this.

**Commit:** `feat: add CDP-powered accessibility auditor`

---

### Task 4.2: Contrast Checking via `inspectedWindow.eval()`

CDP doesn't provide contrast ratios directly. Supplement the a11y audit with a contrast check via eval:

```ts
export async function checkContrast(): Promise<ContrastIssue[]> {
  const [result] = await chrome.devtools.inspectedWindow.eval(`
    (function() {
      const issues = [];
      const textElements = document.querySelectorAll('p, span, a, h1, h2, h3, h4, h5, h6, li, td, th, label, button');
      const limit = Math.min(textElements.length, 200);

      for (let i = 0; i < limit; i++) {
        const el = textElements[i];
        const style = getComputedStyle(el);
        const fg = style.color;
        const bg = style.backgroundColor;
        // ... compute contrast ratio, flag AA/AAA failures
      }
      return issues;
    })()
  `);
  return result;
}
```

Reuses the existing `getContrastRatio()` math from `features/accessibility.ts`, inlined in the eval.

**Commit:** `feat: add contrast checking via inspectedWindow.eval()`

---

### Task 4.3: Wire AccessibilityPanel as Full Tab

**File:** `packages/extension/src/panel/components/context/AccessibilityPanel.tsx` (EXISTS — currently a per-element context panel)

This component already receives `accessibility:result` messages and renders ARIA info, contrast, and violations for a single element. We're **extending** it, not building from scratch:

1. Add "Accessibility" to `LeftTabBar` tabs
2. Add route in `EditorLayout.tsx` TabContent switch
3. Add a **page-wide audit mode** alongside the existing per-element mode:
   - Per-element mode: triggered by element selection (existing behavior)
   - Page-wide mode: triggered on tab mount via `auditAccessibility()` + `checkContrast()` in parallel
4. Sub-sections (page-wide mode):
   - **Violations** — grouped by severity, click to highlight element via `Overlay.highlightNode`
   - **Headings** — heading hierarchy tree view
   - **Landmarks** — landmark region map
   - **ARIA Tree** — collapsible tree view of the full a11y tree
   - **Contrast** — color contrast issues with foreground/background swatches
5. Click any violation → highlight the offending element on page via CDP `Overlay.highlightNode`

**Commit:** `feat: wire AccessibilityPanel as full tab`

---

## Phase 5: Designer Tab Enhancements (CDP-Powered)

### Element Identity: Content Script → CDP nodeId

The Designer tab works with elements selected via content script (Alt+click → `element:selected`). Phase 5 features need CDP `nodeId` for the same element. We **cannot** use `DOM.querySelector` because:
1. Not all elements have unique CSS selectors (e.g., anonymous `<div>` inside a list)
2. The content script already has the exact element reference — we shouldn't re-discover it

**Solution: `DOM.pushNodeByPathToFrontend` + content script cooperation**

When the user selects an element, the content script already knows the DOM node. We add a step to resolve its CDP `backendNodeId`:

**File:** `packages/extension/src/panel/api/elementResolver.ts` (NEW)

```ts
import { cdp } from './cdpBridge';

let cachedNodeId: number | null = null;

/**
 * Resolve the currently inspected element to a CDP nodeId.
 * Uses inspectedWindow.eval() to call __flow_getBackendNodeId()
 * which the content script sets up on element selection.
 *
 * The content script stores the selected element in a known variable.
 * eval() reads it and uses DOM.pushNodeByPathToFrontend or
 * DOM.resolveNode to get the CDP nodeId.
 */
export async function resolveSelectedNodeId(): Promise<number | null> {
  await cdp('DOM.enable');

  // Use $0 — Chrome DevTools' built-in "last inspected element" reference.
  // When our content script selects an element, we also call
  // chrome.devtools.inspectedWindow.eval('inspect(el)') to sync it to $0.
  // Alternatively, use Runtime.evaluate to get a RemoteObject, then
  // DOM.requestNode to convert it to a nodeId.

  try {
    // Step 1: Get a RemoteObject for the selected element via eval
    const [objectId] = await chrome.devtools.inspectedWindow.eval(
      `window.__flow_selectedElement ? JSON.stringify({__flowElement: true}) : null`
    );

    if (!objectId) return null;

    // Step 2: Use Runtime.evaluate to get a RemoteObject handle
    const { result: remoteObj } = await cdp('Runtime.evaluate', {
      expression: 'window.__flow_selectedElement',
      returnByValue: false,
    });

    if (!remoteObj?.objectId) return null;

    // Step 3: Convert RemoteObject → CDP nodeId
    const { nodeId } = await cdp('DOM.requestNode', {
      objectId: remoteObj.objectId,
    });

    cachedNodeId = nodeId;
    return nodeId;
  } catch (e) {
    console.error('[elementResolver] Failed to resolve nodeId:', e);
    return null;
  }
}

export function getCachedNodeId(): number | null {
  return cachedNodeId;
}
```

**Content script side:** When `content.ts` handles Alt+click, also store the element:

```ts
// In content.ts onClick handler, after setting selectedElement:
(window as any).__flow_selectedElement = element;
```

This way Phase 5 functions take a `nodeId` (resolved once per selection), not a CSS selector.

---

### Task 5.1: Full CSS Cascade View

**File:** `packages/extension/src/panel/scanners/cascadeScanner.ts` (NEW)

Currently the Designer tab shows only computed styles via `getComputedStyle()`. CDP `CSS.getMatchedStylesForNode` provides the **full cascade** — which stylesheet, which rule, which selector, specificity order.

```ts
import { cdp } from '../api/cdpBridge';
import { resolveSelectedNodeId } from '../api/elementResolver';

export interface CascadeEntry {
  property: string;
  value: string;
  selector: string;
  source: string; // stylesheet URL or "inline"
  specificity: string;
  isInherited: boolean;
  isOverridden: boolean;
}

export async function getCascade(): Promise<CascadeEntry[]> {
  const nodeId = await resolveSelectedNodeId();
  if (!nodeId) return [];

  await cdp('CSS.enable');

  const matched = await cdp('CSS.getMatchedStylesForNode', { nodeId });

  // Parse matchedCSSRules into CascadeEntry[]
  // Include inline styles, matched rules (with selectors), and inherited rules
  // Mark overridden properties
}
```

This could be shown as a collapsible "Cascade" section in the Designer tab, similar to Chrome DevTools' Styles panel.

**Commit:** `feat: add CSS cascade view via CDP`

---

### Task 5.2: Pseudo-State Forcing

**File:** `packages/extension/src/panel/api/pseudoStates.ts` (NEW)

Enable designers to inspect `:hover`, `:focus`, `:active` styles without actually hovering (which would hide the panel).

```ts
import { cdp } from './cdpBridge';
import { resolveSelectedNodeId } from './elementResolver';

export async function forcePseudoState(
  states: ('hover' | 'focus' | 'active' | 'visited' | 'focus-within')[]
): Promise<void> {
  const nodeId = await resolveSelectedNodeId();
  if (!nodeId) return;

  await cdp('CSS.enable');

  await cdp('CSS.forcePseudoState', {
    nodeId,
    forcedPseudoClasses: states,
  });
}

export async function clearPseudoState(): Promise<void> {
  const nodeId = await resolveSelectedNodeId();
  if (!nodeId) return;
  await cdp('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
}
```

Add toggle buttons (`:hover`, `:focus`, `:active`) to the Designer tab's header bar.

**Commit:** `feat: add pseudo-state forcing via CDP`

---

### Task 5.3: Native Element Highlighting

Replace the custom shadow DOM overlay system for **basic element highlighting** (panel hover → highlight on page). Keep custom overlays only for interactive tools (spacing drag handles, etc.).

For **hover highlighting** (panel list items → page element), we still need a selector since the user hasn't "selected" the element yet. Use `DOM.querySelector` here — it's fine for hover because it's best-effort visual feedback:

```ts
import { cdp } from '../api/cdpBridge';

export async function highlightBySelector(selector: string): Promise<void> {
  await cdp('DOM.enable');
  await cdp('Overlay.enable');

  const { root } = await cdp('DOM.getDocument', { depth: 0 });
  const { nodeId } = await cdp('DOM.querySelector', { nodeId: root.nodeId, selector });
  if (!nodeId) return; // Selector didn't match — fail silently

  await cdp('Overlay.highlightNode', {
    highlightConfig: {
      showInfo: true,
      contentColor: { r: 111, g: 168, b: 220, a: 0.66 },
      paddingColor: { r: 147, g: 196, b: 125, a: 0.55 },
      borderColor: { r: 255, g: 229, b: 153, a: 0.66 },
      marginColor: { r: 246, g: 178, b: 107, a: 0.66 },
    },
    nodeId,
  });
}

/** Highlight the currently selected element (uses resolved nodeId). */
export async function highlightSelected(): Promise<void> {
  const { resolveSelectedNodeId } = await import('../api/elementResolver');
  const nodeId = await resolveSelectedNodeId();
  if (!nodeId) return;

  await cdp('Overlay.enable');
  await cdp('Overlay.highlightNode', {
    highlightConfig: {
      showInfo: true,
      contentColor: { r: 111, g: 168, b: 220, a: 0.66 },
      paddingColor: { r: 147, g: 196, b: 125, a: 0.55 },
      borderColor: { r: 255, g: 229, b: 153, a: 0.66 },
      marginColor: { r: 246, g: 178, b: 107, a: 0.66 },
    },
    nodeId,
  });
}

export async function clearHighlight(): Promise<void> {
  await cdp('Overlay.hideHighlight');
}
```

**Commit:** `feat: replace panel highlights with CDP Overlay`

---

### Task 5.4: Screenshots via CDP

Replace the stubbed `handleScreenshot()` with CDP `Page.captureScreenshot`:

```ts
import { cdp } from '../api/cdpBridge';
import { resolveSelectedNodeId } from '../api/elementResolver';

export async function captureScreenshot(options?: {
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  clip?: { x: number; y: number; width: number; height: number; scale: number };
}): Promise<string> {
  const result = await cdp('Page.captureScreenshot', {
    format: options?.format || 'png',
    quality: options?.quality,
    clip: options?.clip,
  });
  return 'data:image/png;base64,' + result.data;
}

/** Capture a screenshot of the currently selected element. */
export async function captureSelectedElement(): Promise<string | null> {
  const nodeId = await resolveSelectedNodeId();
  if (!nodeId) return null;

  const { model } = await cdp('DOM.getBoxModel', { nodeId });
  const [x, y] = model.content; // top-left corner
  const width = model.content[2] - model.content[0];
  const height = model.content[5] - model.content[1];

  return captureScreenshot({
    clip: { x, y, width, height, scale: 1 },
  });
}
```

**Note:** `window.devicePixelRatio` is not available in the DevTools panel context. Use `1` as the scale, or query it via `inspectedWindow.eval('window.devicePixelRatio')` if a retina-accurate screenshot is needed.

**Commit:** `feat: implement screenshots via CDP Page.captureScreenshot`

---

## Implementation Order

```
Phase 0 (CDP Infrastructure)  ←← START HERE
  Task 0.1 (permission) → 0.2 (session manager + bridge)
  ↓
Phase 0.5 (Testable Utilities)
  Task 0.5.1 (scannerUtils.ts + tests)
  ↓
Phase 1 (Variables)                    ┐
  Task 1.1 → 1.2 → 1.3 → 1.4         │
Phase 2 (Components)                   ├── Can be parallelized
  Task 2.1 → 2.2 → 2.3 → 2.4         │
Phase 3 (Assets)                       │
  Task 3.1 → 3.2 → 3.3 → 3.4         ┘
  ↓
Cross-cutting: Navigation watcher (wire into all panels)
  ↓
Phase 4 (Accessibility)
  Task 4.1 (CDP a11y tree) → 4.2 (contrast) → 4.3 (wire panel)
  ↓
Phase 5 (Designer Enhancements)
  elementResolver.ts → 5.1 (cascade) + 5.2 (pseudo states) + 5.3 (highlights) + 5.4 (screenshots)
```

Phases 1-3 can be parallelized after Phase 0.5 — they're independent. Phase 5 tasks require the element resolver to be built first, then can be parallelized.

---

## Chrome DevTools API Usage Summary

| API | Phase | What It Powers |
|-----|-------|----------------|
| `inspectedWindow.eval()` | 1, 2, 3, 4 | Token scan, component scan, font scan, icon scan, contrast check |
| `inspectedWindow.getResources()` | 3 | Primary asset discovery (all loaded resources by URL) |
| `inspectedWindow.onResourceAdded` | 3 | Live resource listener for dynamically loaded assets |
| `devtools.network.onNavigated` | All | SPA navigation detection → trigger re-scans |
| `Accessibility.getFullAXTree` | 4 | Browser's computed accessibility tree |
| `Accessibility.queryAXTree` | 4 | Filtered a11y queries by role |
| `CSS.getMatchedStylesForNode` | 5 | Full CSS cascade (not just computed) |
| `CSS.getStyleSheetText` | 1 | Cross-origin stylesheet content |
| `CSS.forcePseudoState` | 5 | Force :hover/:focus/:active for inspection |
| `Overlay.highlightNode` | 4, 5 | Native box-model element highlighting |
| `Overlay.hideHighlight` | 4, 5 | Clear highlighting |
| `Runtime.evaluate` | 5 | Get RemoteObject for selected element |
| `DOM.requestNode` | 5 | Convert RemoteObject → CDP nodeId |
| `DOM.getDocument` | 4, 5 | Get DOM tree root for selector-based lookups |
| `DOM.querySelector` | 5 | Best-effort hover highlights (not for selected element) |
| `DOM.getBoxModel` | 5 | Precise element measurements for screenshots |
| `Page.captureScreenshot` | 5 | Full-page and element screenshots |

---

## Testing Strategy

| Layer | Approach |
|-------|----------|
| Panel scanners (eval-based) | Extract pure functions (classifyTier, inferCategory, dedup) and unit test. The eval string itself needs integration testing. |
| CDP bridge | Mock `chrome.runtime.sendMessage` in tests |
| Message types | Type-level tests (compile-time), type guard unit tests |
| Panel components | `@testing-library/react` — verify scan triggers, loading/data/empty states |
| CDP integration | Manual: build extension, load in Chrome, test on diverse pages |
| A11y scanner | Test violation detection against known-bad HTML fixtures |

---

## Dead Code to Remove

| Code | File | When |
|------|------|------|
| `mockTokens` object | `VariablesPanel.tsx:252-265` | Phase 1, Task 1.3 |
| `mockIcons`, `mockLogos`, `mockImages` | `AssetsPanel.tsx` | Phase 3, Task 3.4 |
| `handleGetComponentMap()` | `panelRouter.ts:378-400` | Phase 2, Task 2.4 |
| `PanelGetComponentMapMessage` | `messages.ts:116-118` | Phase 2, Task 2.4 |
| `PanelHighlightMessage` (radflowId) | `messages.ts:120-124` | Phase 2, Task 2.4 |
| Dead `useAppStore` import | `AssetsPanel.tsx:2` | Phase 3, Task 3.4 |
| `loadTokens()` / `loadThemeTokens()` stubs | `tokensSlice.ts:116-135` | Phase 1, Task 1.3 |
| `componentsSlice.ts` (if unused) | `stores/slices/componentsSlice.ts` | Phase 2, Task 2.4 |
| `handleScreenshot()` stub | `panelRouter.ts:337-353` | Phase 5, Task 5.4 |
| `buildScreenshotRequest()` | `features/screenshot.ts` | Phase 5, Task 5.4 |
| Panel highlight overlay | `panelRouter.ts:111-145` | Phase 5, Task 5.3 |

---

## Cross-Cutting: SPA Navigation Handling

None of the scanners currently re-scan after SPA navigation (React Router pushes, Next.js page transitions, etc.). The scanned data goes stale as the user navigates.

### Strategy: `chrome.devtools.network.onNavigated`

This event fires on both full page loads and SPA navigations (History API pushes). Use it as the central "page changed" signal.

**File:** `packages/extension/src/panel/api/navigationWatcher.ts` (NEW)

```ts
type ScanCallback = () => void;

const listeners: ScanCallback[] = [];

/**
 * Register a callback to re-run when the inspected page navigates.
 * Fires on both full page loads and SPA pushState/replaceState.
 */
export function onPageNavigated(callback: ScanCallback): () => void {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

// Set up once — this runs in the DevTools panel context
chrome.devtools.network.onNavigated.addListener((_url: string) => {
  // Small delay to let the new page's DOM settle
  setTimeout(() => {
    for (const cb of listeners) {
      try { cb(); } catch (e) { console.error('[navigationWatcher]', e); }
    }
  }, 500);
});
```

### Panel Integration Pattern

Each panel registers its scan function with the watcher:

```tsx
// In VariablesPanel, ComponentsPanel, AssetsPanel, AccessibilityPanel
useEffect(() => {
  // Initial scan
  runScan();
  // Re-scan on navigation
  const unsubscribe = onPageNavigated(runScan);
  return unsubscribe;
}, []);
```

### Manual Rescan

Every panel should also have a **"Rescan" button** (using the existing `RefreshCw` icon) for manual re-triggering. Pattern:

```tsx
<button onClick={runScan} title="Rescan page" className="...">
  <RefreshCw className="w-3 h-3" />
</button>
```

This covers both automatic (navigation) and manual (user-triggered) re-scanning
