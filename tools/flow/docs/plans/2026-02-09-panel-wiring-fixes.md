# Panel Data Wiring — Fix Catalog

**Date:** 2026-02-09
**Source:** Full implementation review of Phases 0-5
**Branch:** `feat/flow-wiring-tool-modes`
**Prerequisite:** `2026-02-08-panel-data-wiring.md`

All file paths are relative to `packages/extension/src/` unless otherwise noted.

---

## S0: Showstopper

### S0.1: `__flow_selectedElement` world boundary — Phase 5 likely broken

**Files:**
- `entrypoints/content.ts` line 493 — writes `(window as any).__flow_selectedElement = el`
- `panel/api/elementResolver.ts` lines 19-21 — reads via `Runtime.evaluate('window.__flow_selectedElement')`

**Problem:** Content script runs in the ISOLATED world. `Runtime.evaluate` runs in the MAIN world. In MV3, these are separate JS heaps. The property set in the isolated world is not visible in the main world. This means `resolveSelectedNodeId()` likely always returns `null`, making `cascadeScanner`, `pseudoStates`, `highlightSelected`, and `captureSelectedElement` all silently non-functional.

**Fix:** Move the element storage into the agent script (`agent/` directory), which already runs in MAIN world via `chrome.scripting.executeScript({ world: 'MAIN' })`. The agent already has access to selected elements. Options:

1. In the agent script, expose a function like `window.__flow_storeSelectedElement(el)` that stores the reference.
2. Have the content script call `window.__flow_storeSelectedElement(el)` instead of direct assignment.
3. Or: use `inspectedWindow.eval` with `useContentScriptContext: true` to read from the isolated world instead of `Runtime.evaluate`.

**Verify first:** Build the extension, select an element, check if cascade/highlight/pseudo-state features work. If they do, Chrome may be sharing expando properties across worlds (behavior varies by version). If they don't, this fix is mandatory.

**Depends on:** Nothing
**Blocks:** All Phase 5 element-specific features

---

## C: Critical

### C1: Race condition in `ensureCDP` — concurrent attach

**File:** `lib/cdpSession.ts` lines 13-17

**Problem:** Two parallel CDP commands for the same `tabId` both see `sessions.has(tabId) === false`, both call `chrome.debugger.attach`, second throws `"Another debugger is already attached"`.

**Fix:** Use a per-tabId Promise as a mutex:

```ts
const pending = new Map<number, Promise<void>>();

export async function ensureCDP(tabId: number): Promise<void> {
  if (sessions.has(tabId)) return;
  if (pending.has(tabId)) return pending.get(tabId);

  const p = chrome.debugger.attach({ tabId }, '1.3').then(() => {
    sessions.set(tabId, { domains: new Set() });
    pending.delete(tabId);
  }).catch((err) => {
    pending.delete(tabId);
    throw err;
  });

  pending.set(tabId, p);
  return p;
}
```

Apply the same pattern to `enableDomain` (lines 19-25).

**Also fix:** Line 21 has `sessions.get(tabId)!` non-null assertion after an async gap. The session could be removed by `onDetach` between `ensureCDP` returning and this line. Add a null check.

---

### C2: No CDP method whitelist — open proxy

**File:** `entrypoints/background.ts` lines 39-46

**Problem:** The `cdp:command` handler passes `method` and `params` directly to `chrome.debugger.sendCommand` with zero validation. Any extension context can execute arbitrary CDP commands on any tab.

**Fix:** Add a whitelist of allowed methods:

```ts
const ALLOWED_CDP_METHODS = new Set([
  'DOM.enable', 'DOM.getDocument', 'DOM.querySelector', 'DOM.requestNode', 'DOM.getBoxModel',
  'CSS.enable', 'CSS.forcePseudoState', 'CSS.getMatchedStylesForNode',
  'Overlay.enable', 'Overlay.highlightNode', 'Overlay.hideHighlight',
  'Page.captureScreenshot',
  'Runtime.evaluate',
  'Accessibility.enable', 'Accessibility.getFullAXTree',
]);

if (message.type === 'cdp:command') {
  const { method, params } = message.payload;
  if (!ALLOWED_CDP_METHODS.has(method)) {
    sendResponse({ error: `CDP method not allowed: ${method}` });
    return true;
  }
  // ... existing logic
}
```

Also validate `tabId` is a number: `if (typeof tabId !== 'number') { sendResponse({ error: 'Invalid tabId' }); return true; }`

---

### C3: Stack overflow in fiber walk

**File:** `panel/scanners/componentScanner.ts` lines 24-46

**Problem:** `walkFiber()` recurses on both `fiber.child` and `fiber.sibling`. A flat list of 5000+ siblings at one level blows the call stack.

**Fix:** Iterate siblings, recurse only for depth:

```js
function walkFiber(fiber) {
  var current = fiber;
  while (current) {
    if ((current.tag === 0 || current.tag === 1) && current.type) {
      // ... existing component detection logic ...
    }
    walkFiber(current.child);
    current = current.sibling;
  }
}
```

**Also fix (same file):**
- Line ~50-73: The renderer ID fallback logic — iterate `hook._renderers` keys instead of hardcoding `1`.
- Lines 89, 102, 114: Three separate `document.querySelectorAll('*')` calls. Query once at the top and reuse.

---

### C4: Stack overflow in contrast scanner

**File:** `panel/scanners/contrastScanner.ts` lines 54-69

**Problem:** `getEffectiveBackground()` has a recursive call embedded inside an iterative parent walk. A chain of 200+ nested elements with semi-transparent backgrounds can overflow.

**Fix:** Make it fully iterative — collect semi-transparent layers in a list, composite bottom-up:

```js
function getEffectiveBackground(el) {
  var layers = [];
  var node = el;
  while (node && node !== document.documentElement) {
    var style = getComputedStyle(node);
    var bg = parseColor(style.backgroundColor);
    if (bg && bg.a > 0) {
      layers.push(bg);
      if (bg.a >= 1) break; // opaque — stop here
    }
    node = node.parentElement;
  }
  // Start from the deepest opaque layer (or white default)
  var result = { r: 255, g: 255, b: 255, a: 1 };
  for (var i = layers.length - 1; i >= 0; i--) {
    result = blendAlpha(layers[i], result);
  }
  return result;
}
```

---

### C5: Unhandled promise rejections — permanent loading spinner

**Files:**
- `panel/components/VariablesPanel.tsx` line 226 — `scanTokens().then(...)` no `.catch()`
- `panel/components/ComponentsPanel.tsx` line ~217 — `scanComponents().then(...)` no `.catch()`
- `panel/components/AssetsPanel.tsx` line ~365 — scanner `.then(...)` no `.catch()`
- `panel/components/AccessibilityAuditPanel.tsx` line 219 — `Promise.all([...]).then(...)` no `.catch()`

**Problem:** If `inspectedWindow.eval` throws synchronously (DevTools context destroyed, tab closed), the Promise constructor rejects and there is no catch. The panel stays on the loading spinner forever.

**Fix:** Add `.catch()` to every scanner call. Add an `error` state to each panel:

```tsx
const [error, setError] = useState<string | null>(null);

const runScan = useCallback(() => {
  setLoading(true);
  setError(null);
  scanTokens()
    .then((result) => {
      setTokens(result.tokens);
      setFramework(result.framework);
      setLoading(false);
    })
    .catch((err) => {
      console.error('[VariablesPanel] scan failed:', err);
      setError('Failed to scan tokens. Try reopening DevTools.');
      setLoading(false);
    });
}, []);
```

Add an error UI state between the loading check and the main render:

```tsx
if (error) {
  return (
    <div className="p-3 text-center text-red-400 text-xs">
      {error}
      <button onClick={runScan} className="ml-2 underline">Retry</button>
    </div>
  );
}
```

Apply to all four panels.

---

### C6: Navigation listener array mutation during iteration

**File:** `panel/api/navigationWatcher.ts` lines 19-29

**Problem:** `for (const cb of listeners)` iterates the mutable `listeners` array. A callback can trigger a React unmount that calls the unsubscribe function (which does `listeners.splice()`), mutating the array mid-iteration and skipping or crashing.

**Fix:** Snapshot the array before iteration:

```ts
chrome.devtools.network.onNavigated.addListener((_url: string) => {
  setTimeout(() => {
    const snapshot = [...listeners]; // snapshot
    for (const cb of snapshot) {
      try { cb(); } catch (e) { console.error('[navigationWatcher]', e); }
    }
  }, 500);
});
```

---

## I: Important

### I1: No CDP domain reset on navigation

**File:** `lib/cdpSession.ts`

**Problem:** The `sessions[tabId].domains` Set tracks enabled domains but is never cleared on navigation. Chrome may reset domains internally, causing "DOM agent hasn't been enabled" errors from subsequent calls.

**Fix:** Add a navigation listener in the background script or panel that clears the domains set:

```ts
// In cdpSession.ts, export:
export function resetDomains(tabId: number): void {
  const session = sessions.get(tabId);
  if (session) session.domains.clear();
}
```

Wire this to `chrome.devtools.network.onNavigated` in the panel, or to `chrome.webNavigation.onCommitted` in the background.

Also wire `clearCachedNodeId()` from `elementResolver.ts` to the same navigation event.

---

### I2: `clearCachedNodeId` never called

**File:** `panel/api/elementResolver.ts` lines 44-47

**Problem:** Exported but zero call sites. Stale nodeIds persist after navigation.

**Fix:** Call it from the navigation watcher. In whatever panel or module initializes the navigation watcher, add:

```ts
import { clearCachedNodeId } from '../api/elementResolver';
import { onPageNavigated } from '../api/navigationWatcher';

onPageNavigated(() => {
  clearCachedNodeId();
});
```

Or add it to a central initialization file that runs once.

---

### I3: `detachCDP` never called — debugger bar persists

**File:** `lib/cdpSession.ts` lines 32-36

**Problem:** The debugger bar ("Flow is debugging this tab") persists after the DevTools panel closes because `detachCDP` is never called.

**Fix:** Listen for panel disconnect in the background script. When all panel ports for a tab disconnect and no CDP features are active, call `detachCDP(tabId)`:

```ts
// In background.ts, inside registerPanelPort's onDisconnect:
port.onDisconnect.addListener(() => {
  portMap?.delete(tabId);
  // Check if any panel ports remain for this tab
  const hasRemainingPorts = [...panelPortsByType.values()].some(m => m.has(tabId));
  if (!hasRemainingPorts) {
    detachCDP(tabId);
  }
});
```

Import `detachCDP` from `../lib/cdpSession.js` (already imported for `cdpCommand`).

---

### I4: `enableDomain` dedup bypassed

**Files:**
- `panel/api/elementResolver.ts` line 16 — `await cdp('DOM.enable')`
- `panel/api/highlightService.ts` lines 21-22 — `await cdp('DOM.enable')`, `await cdp('Overlay.enable')`
- `panel/scanners/cascadeScanner.ts` line 15 — `await cdp('CSS.enable')`
- `panel/scanners/accessibilityScanner.ts` lines 15-16 — `await cdp('Accessibility.enable')`, `await cdp('DOM.enable')`
- `panel/api/pseudoStates.ts` line 14 — `await cdp('CSS.enable')`

**Problem:** All consumers call `cdp('Domain.enable')` directly through `cdpBridge` → `cdpCommand`, bypassing `enableDomain`'s deduplication. Every operation sends redundant enable commands.

**Fix:** Either:
1. Route enables through a panel-side wrapper that calls `enableDomain` via a dedicated message type, or
2. Make the background's `cdpCommand` function call `enableDomain` when it detects a `.enable` method, or
3. Accept the redundancy (CDP tolerates duplicate enables) and remove the unused `enableDomain` function to reduce confusion.

Option 3 is simplest if performance isn't a concern.

---

### I5: No error state UI in panels

**Files:**
- `panel/components/VariablesPanel.tsx`
- `panel/components/ComponentsPanel.tsx`
- `panel/components/AssetsPanel.tsx`
- `panel/components/AccessibilityAuditPanel.tsx`

**Problem:** When scanners fail, panels show "No X found" — indistinguishable from a page that genuinely has no tokens/components/etc.

**Fix:** Covered by C5 — add `error` state and error UI to each panel. The error message should include a "Retry" button that calls `runScan`.

---

### I6: Inlined logic drift — two divergent `classifyTier` implementations

**Files:**
- `packages/shared/src/scannerUtils.ts` — recognizes: `surface, content, edge, primary, secondary, tertiary, accent, success, warning, error, info, inverse, muted, disabled, hover, active, focus`
- `agent/customProperties.ts` lines 11-20 — recognizes: `surface, content, edge, accent, status, interactive, focus, disabled`
- `panel/scanners/tokenScanner.ts` lines 43-45 — inlined copy of `scannerUtils.ts` version

**Problem:** Three copies, two different pattern lists. No mechanism to detect drift.

**Fix:**
1. Consolidate the semantic purpose list into `scannerUtils.ts` as the single source of truth.
2. Update `agent/customProperties.ts` to import from `@flow/shared` instead of maintaining its own list.
3. For the eval-inlined copy in `tokenScanner.ts`, add a snapshot test that extracts the regex from the eval string and compares it to the exported `classifyTier` function's regex. Or use a build step to generate the eval string from the source function.

---

### I7: `contentBridge.ts` infinite reconnection loop

**File:** `panel/api/contentBridge.ts` lines 47-51

**Problem:** `onDisconnect` retries `connectPort()` every 1 second with no backoff, no max retries.

**Fix:** Add exponential backoff and a retry limit:

```ts
let retryCount = 0;
const MAX_RETRIES = 10;

port.onDisconnect.addListener(() => {
  port = null;
  if (retryCount < MAX_RETRIES) {
    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
    retryCount++;
    setTimeout(connectPort, delay);
  } else {
    console.error('[contentBridge] Max reconnection attempts reached');
  }
});
```

Reset `retryCount = 0` on successful reconnection.

---

### I8: Duplicate `CollapsibleSection`

**Files:**
- `panel/components/VariablesPanel.tsx` lines 175-211
- `panel/components/AccessibilityAuditPanel.tsx` lines 38-74
- `panel/components/ui/CollapsibleSection.tsx` (exists but not used by both)

**Problem:** Same component defined inline in two panels. A shared version exists at `ui/CollapsibleSection.tsx`.

**Fix:** Delete the inline versions in both panels. Import from `./ui/CollapsibleSection`. Ensure the shared version supports the `badge` prop that `AccessibilityAuditPanel` uses.

---

### I9: Duplicate `SearchInput` 3x

**Files:**
- `panel/components/ComponentsPanel.tsx` lines 42-67
- `panel/components/AssetsPanel.tsx` lines 33-55
- `panel/components/context/SearchPanel.tsx` lines 55-87

**Problem:** Nearly identical component with `SearchInputProps` defined three times.

**Fix:** Extract to `panel/components/ui/SearchInput.tsx`. Add `aria-label={placeholder}` (which `AssetsPanel`'s version has but `ComponentsPanel`'s does not).

---

### I10: `LeftTabBar` missing ARIA semantics

**File:** `panel/components/layout/LeftTabBar.tsx`

**Problem:** No `role="tablist"`, no `role="tab"`, no `aria-selected`, no keyboard navigation (arrow keys).

**Fix:** Add ARIA roles to the container and buttons:

```tsx
<div
  className={...}
  role="tablist"
  aria-orientation="vertical"
>
  {TABS.map((tab) => (
    <button
      key={tab.id}
      role="tab"
      aria-selected={isActive}
      aria-controls={`${tab.id}-tabpanel`}
      tabIndex={isActive ? 0 : -1}
      // ... existing props
    >
```

Add `role="tabpanel"` and matching `id={`${activeTab}-tabpanel`}` to the content area in `EditorLayout.tsx` (line 89).

Add keyboard navigation: arrow up/down to move between tabs, Enter/Space to activate.

---

### I11: Accessibility `passed` count is misleading

**File:** `panel/scanners/accessibilityScanner.ts` lines 129-134

**Problem:** `passed = totalNonIgnored - violations.length` counts ALL AX nodes, but violations only check specific roles (img, button, link, form inputs, headings). 2000 nodes - 5 violations = "1995 passed" is meaningless.

**Fix:** Track how many elements were actually checked:

```ts
let checkedCount = 0;

// In the loop, increment when checking:
if (role === 'img') { checkedCount++; if (!name) violations.push(...); }
if (role === 'button') { checkedCount++; if (!name) violations.push(...); }
// etc.

const summary = {
  errors: violations.filter(v => v.severity === 'error').length,
  warnings: violations.filter(v => v.severity === 'warning').length,
  passed: checkedCount - violations.length,
};
```

---

### I12: Heading hierarchy false positive

**File:** `panel/scanners/accessibilityScanner.ts` lines 115-127

**Problem:** `lastLevel` starts at 0. Pages starting with `<h2>` get flagged as "Heading level skipped: h0 -> h2."

**Fix:** Start from the first heading's level:

```ts
for (let i = 0; i < headings.length; i++) {
  if (i === 0) { lastLevel = headings[i].level; continue; }
  if (headings[i].level > lastLevel + 1) {
    violations.push({ ... });
  }
  lastLevel = headings[i].level;
}
```

---

## M: Minor

### M1: `cdpBridge.ts` returns `Promise<any>`

**File:** `panel/api/cdpBridge.ts` line 9

**Fix:** Use a generic:

```ts
export async function cdp<T = unknown>(method: string, params?: object): Promise<T> {
  // ...
  return response?.result as T;
}
```

Consumers can then: `const { nodes } = await cdp<{ nodes: AXNode[] }>('Accessibility.getFullAXTree', ...)`

---

### M2: `contrastScanner` text length skip too aggressive

**File:** `panel/scanners/contrastScanner.ts` line 82

**Current:** `if (!text || text.length > 100) continue;`

**Fix:** Remove the length check or raise to 10000. The text is only used for display (`text.substring(0, 40)` on line 127).

---

### M3: `contrastScanner` dedup too aggressive

**File:** `panel/scanners/contrastScanner.ts` lines 110-119

**Problem:** Deduplicates by first CSS class name. Two different `span.title` elements with different backgrounds are collapsed into one.

**Fix:** Include the contrast ratio or text snippet in the dedup key:

```js
var dedupKey = selector + ':' + fgStr + ':' + bgStr;
if (seen[dedupKey]) continue;
seen[dedupKey] = true;
```

---

### M4: `contrastScanner` `passesAA`/`passesAAA` always false in output

**File:** `panel/scanners/contrastScanner.ts` lines 108-134

**Problem:** Issues are only pushed when `!passesAA`, so `passesAA` is always `false` and `passesAAA` is always `false`. These fields carry no information.

**Fix:** Either remove them from `ContrastIssue` type and the push, or keep them for consistency with the type (acceptable since they document the threshold used).

---

### M5: Token rows use `div onClick` instead of `button`

**File:** `panel/components/VariablesPanel.tsx` lines 66-86, 89-110, 113-130, 133-152, 155-168

**Problem:** All five token row components use `<div onClick>`. Not keyboard-focusable or screen-reader-accessible.

**Fix:** Replace the outer `<div>` with `<button>` and add `className="w-full text-left"` to preserve layout:

```tsx
<button
  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-700/50 cursor-pointer group text-left"
  onClick={() => onCopy(token.cssVar)}
  title={`Click to copy: ${token.cssVar}`}
>
```

---

### M6: `navigator.clipboard.writeText` calls have no `.catch()`

**Files:**
- `panel/components/VariablesPanel.tsx` line 233
- `panel/components/AssetsPanel.tsx` line 391
- `panel/components/ComponentsPanel.tsx` line 123

**Fix:** Add a catch that logs or shows a brief error:

```tsx
navigator.clipboard.writeText(text).then(() => {
  setCopied(text);
  // ...
}).catch(() => {
  console.warn('[copy] Clipboard write failed');
});
```

---

### M7: `AssetsPanel` sub-tab missing `id` and `role="tabpanel"`

**File:** `panel/components/AssetsPanel.tsx` lines 469-482

**Problem:** Tab buttons reference `aria-controls={`${tab.id}-tabpanel`}` but content divs have no matching `id` or `role="tabpanel"`.

**Fix:** Wrap sub-tab content:

```tsx
<div id={`${activeSubTab}-tabpanel`} role="tabpanel" className="pt-1">
  {activeSubTab === "images" && <ImagesContent ... />}
  {/* ... */}
</div>
```

---

### M8: `CollapsibleSection` ARIA violation when collapsed

**File:** `panel/components/ui/CollapsibleSection.tsx` lines 33-36

**Problem:** When collapsed, the `div` with `id={contentId}` is removed from DOM, but the button's `aria-controls` still references it.

**Fix:** Keep the element in DOM but hide it:

```tsx
<div id={contentId} className="space-y-0.5" hidden={!isExpanded}>
  {children}
</div>
```

Or remove `aria-controls` when collapsed.

---

### M9: Tailwind v4 detection via `@theme` only works in dev

**File:** `panel/scanners/tokenScanner.ts` lines 117-124

**Problem:** `@theme` blocks are compiled away by Tailwind's build step. Detection only works in development mode.

**Fix:** Add a secondary heuristic — check for Tailwind v4's characteristic token names (e.g., `--spacing-*`, `--radius-*`, `--color-*` with the Tailwind v4 naming convention) as a fallback when `@theme` is not found.

---

### M10: Component scanner queries DOM 3x

**File:** `panel/scanners/componentScanner.ts` lines 89, 102, 114

**Problem:** Three `document.querySelectorAll('*')` calls for Vue, Svelte, and custom elements.

**Fix:** Query once at the top of the IIFE, reuse the NodeList.

---

### M11: Navigation watcher 500ms is a magic number

**File:** `panel/api/navigationWatcher.ts` line 21

**Fix:** Extract to a named constant. Consider adding a note that this is intentionally short for DevTools responsiveness:

```ts
const NAVIGATION_SETTLE_DELAY_MS = 500;
```

---

### M12: Copy timeout leak in `ComponentsPanel` PreviewPanel

**File:** `panel/components/ComponentsPanel.tsx` line 125

**Problem:** `setTimeout(() => setCopiedSelector(false), 1500)` is not cleaned up on unmount, unlike `VariablesPanel` which properly tracks timeouts with a ref.

**Fix:** Add a ref and cleanup, matching the pattern in `VariablesPanel`:

```tsx
const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// In the copy handler:
copyTimeoutRef.current = setTimeout(() => setCopiedSelector(false), 1500);

// In useEffect cleanup:
useEffect(() => {
  return () => {
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
  };
}, []);
```

---

### M13: `ScannedComponent.hierarchy` declared but never populated

**File:** `packages/shared/src/messages.ts` line 431

**Fix:** Either remove `hierarchy?: string[]` from the type, or populate it in the component scanner from the fiber tree's parent chain.

---

### M14: ARIA tree cap at 500 nodes silently truncates

**File:** `panel/scanners/accessibilityScanner.ts` line 45

**Fix:** Add a `truncated` flag to the result type:

```ts
// In AccessibilityAudit type (packages/shared/src/messages.ts):
export interface AccessibilityAudit {
  // ... existing fields
  ariaTreeTruncated?: boolean;
}

// In scanner:
const truncated = ariaTree.length >= 500;
return { violations, summary, headingHierarchy: headings, landmarks, ariaTree, ariaTreeTruncated: truncated };
```

---

### M15: `cascadeScanner.ts` `extractSourceName` is a stub

**File:** `panel/scanners/cascadeScanner.ts` lines 168-172

**Fix:** Either resolve via `CSS.getStyleSheetText` (returns headers including URL), or rename to `getStyleSheetId` and add a comment that human-readable source resolution is a future enhancement.

---

### M16: `cascadeScanner.ts` `INHERITABLE_PROPERTIES` list incomplete

**File:** `panel/scanners/cascadeScanner.ts` lines 175-183

**Missing:** `border-collapse`, `caption-side`, `empty-cells`, `hyphens`, `overflow-wrap`, `pointer-events`, `speak`.

**Fix:** Add them to the Set.

---

### M17: `EditorLayout` `TabContent` switch has no default case

**File:** `panel/components/layout/EditorLayout.tsx` lines 31-48

**Fix:** Add exhaustive check:

```tsx
default: {
  const _exhaustive: never = tab;
  return null;
}
```

---

## D: Dead Code to Remove

### D1: Token store stubs

**File:** `panel/stores/slices/tokensSlice.ts` lines 116-135

`loadTokens()` and `loadThemeTokens()` are stubs that set error messages. VariablesPanel now uses `scanTokens()` directly with component-local state. Also evaluate `setTokensFromBridge()` — if no caller remains, remove it too.

### D2: Components store

**File:** `panel/stores/slices/componentsSlice.ts`

The new `ComponentsPanel` uses `scanComponents()` with local state, not the Zustand store. The store's `ComponentInfo` type is a different shape from `ScannedComponent`. However, `useBridgeConnection.ts` may still reference it — audit before removing.

### D3: Old component map pipeline (blocked on Task 2.3/2.4)

**Files:**
- `panel/hooks/useBridgeConnection.ts` line 167 — sends `panel:get-component-map`
- `panel/hooks/useBridgeConnection.ts` line 171 — sends `panel:highlight` with `radflowId`
- `content/panelRouter.ts` lines 644, 652 — handles both message types
- `packages/shared/src/messages.ts` — `PanelGetComponentMapMessage`, `PanelHighlightMessage`

**Status:** NOT yet dead. These are still called from `useBridgeConnection`. Remove only after confirming `ComponentsPanel` no longer uses the bridge-based flow and `useBridgeConnection` no longer sends these messages.

### D4: `handleScreenshot()` stub

**File:** `content/panelRouter.ts` lines 337-353

Now replaced by `screenshotService.ts` via CDP. Can be removed once the panel is wired to the new service.

---

## T: Test Gaps

### T1: Zero scanner tests (HIGH)

**Directory:** `panel/scanners/` — no `__tests__/` directory

**What to test:**
- Mock `chrome.devtools.inspectedWindow.eval` and verify each scanner's callback handling (success, error, null result).
- Mock `cdpBridge.cdp` and verify `accessibilityScanner` and `cascadeScanner` responses.
- Extract and test the inlined regex patterns against `scannerUtils.ts` to detect drift.

### T2: Zero panel component tests (MEDIUM)

**What to test with `@testing-library/react`:**
- Loading state renders spinner
- Data state renders token/component/asset rows
- Empty state renders "No X found" message
- Error state renders error message with retry button (after C5 fix)
- Rescan button triggers re-scan

### T3: Zero type guard tests (MEDIUM)

**File:** `packages/shared/src/messages.ts` — 6 type guards: `isSearchResponse`, `isAccessibilityResponse`, `isImagesResponse`, `isImageSwapResponse`, `isScreenshotResponse`, `isFlowWindowMessage`

**What to test:** Valid messages pass, malformed messages (missing fields, wrong types) fail.

### T4: `scannerUtils.test.ts` edge case gaps (LOW)

**File:** `packages/shared/src/__tests__/scannerUtils.test.ts`

Missing cases:
- `classifyTier('')` and `classifyTier('not-a-token')` (no `--` prefix)
- `isUserComponent('A')` (single uppercase letter — should return `true`)
- `dedupByKey` preserving non-instance properties when merging

---

## Recommended Fix Order

```
S0.1 (world boundary) ← verify/fix first, blocks all Phase 5
  ↓
C1 (ensureCDP mutex) + C2 (CDP whitelist)
  ↓
C3 (fiber walk) + C4 (contrast walk) + C5 (catch handlers) + C6 (listener snapshot)
  ↓
I1 (domain reset) + I2 (clearCachedNodeId) + I3 (detachCDP)
  ↓
I8 (CollapsibleSection dedup) + I9 (SearchInput dedup) + I10 (ARIA)
  ↓
I6 (classifyTier consolidation) + I11 (passed count) + I12 (heading hierarchy)
  ↓
M1-M17 (minor fixes, any order)
  ↓
D1-D4 (dead code cleanup)
  ↓
T1-T4 (test coverage)
```
