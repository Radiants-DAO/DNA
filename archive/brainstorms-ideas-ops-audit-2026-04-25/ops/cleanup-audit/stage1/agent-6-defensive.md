# Agent 6: Defensive Programming Cleanup — Stage 1 Report

**Dispatch HEAD:** d658b2b568bdb0ff4921f83c4ada8bcedd76df55
**Branch:** main
**Tree state:** clean
**Mode:** read-only audit

## Summary

The repo has very few defensive anti-patterns. Most try/catch sites genuinely wrap boundary I/O: `localStorage`, `navigator.clipboard`, `fetch`, dynamic imports, git subprocesses, HTTP routes, or JSON.parse of externally-sourced text. The @ts-nocheck vendored `lib/dotting/` canvas engine is out of scope (explicitly deferred).

- Total findings: **27**
- `remove`: **2**
- `keep_with_reason`: **25**

The two remove candidates are small and local. No catch-and-log sites warrant removal because every logging catch in this codebase is attached to a real boundary (clipboard API, fetch, dynamic import, subprocess, JSON.parse).

## Findings ordered by severity

### DEFENSIVE-001 — remove — confidence 0.92, blast low

- **File:** `apps/rad-os/components/Rad_os/WindowTitleBar.tsx:134`
- **Pattern:** `if (typeof window === 'undefined') return;` inside `handleCopyLink` click handler
- **Why unnecessary:** The surrounding component is `'use client'` and the guarded code is an `async` click handler on a `<Button onClick={handleCopyLink} />`. React never invokes `onClick` handlers during SSR, and the component never renders server-side (`'use client'`). The SSR window check is unreachable.
- **Verification:** `pnpm turbo typecheck --filter=rad-os`, manual: check `'use client'` directive + confirm handler only invoked from onClick.

### DEFENSIVE-002 — remove — confidence 0.72, blast low

- **File:** `apps/rad-os/components/apps/RadRadioApp.tsx:108, 111, 115`
- **Pattern:** `const handleError = () => {}; video.addEventListener('error', handleError); … video.removeEventListener('error', handleError);`
- **Why unnecessary:** The handler body is empty and attaching a no-op `error` listener does not suppress the error event — it simply runs an empty function. The addEventListener/removeEventListener pair is pure bookkeeping with no behavioral effect. If the intent was "swallow errors", the current code does not achieve that; if the intent was placeholder-for-future, the empty handler + attach/detach is still dead.
- **Verification:** `pnpm turbo typecheck --filter=rad-os`. Manual: confirm the `<video>` element's default error surface is unchanged either way; verify no listener-presence invariant elsewhere.
- **Note:** borderline — flagging per brief's "catches that only log and hide the error" spirit even though it's an event listener not a catch. Lower confidence because intent may be "reserve slot for future handler".

### DEFENSIVE-003 through DEFENSIVE-027 — keep_with_reason

See JSON for details. All remaining catch sites are genuine boundary handlers:

- **Clipboard API boundary** (can reject on permission denial): `AppWindow.tsx:267-273`, `BrandAssetsApp.tsx:187-207` and `444-451`, `WindowTitleBar.tsx:138-144`.
- **`localStorage` / `JSON.parse` of external string** (hostile input boundary): `store/index.ts:37-45`, `use-scratchpad-docs.ts:42-56` and `77-89`, `serialization.ts:177-181` and `193-198`.
- **`fetch` / dynamic import failure**: `Icon.tsx:117-124` and `146-153`, `radnom.ts:29-32`, `PixelArtEditor.tsx:47-55`.
- **Autoplay policy rejection** (expected rejection, not an error): `RadRadioApp.tsx:102, 505-507, 517`.
- **HTTP route error surface** (API route boundary): `app/assets/logos/[assetFile]/route.ts:25-48`, `app/assets/fonts/[fontFile]/route.ts:18-29`.
- **Subprocess / git boundary**: `scripts/install-git-hooks.mjs:29-32, 37-40`, `scripts/registry-guard.mjs:32-36, 62-68`, `scripts/lint-design-system-staged.mjs:48-59, 64-72`, `ops/skills-cleanup/build-inventory.mjs:77-92`, `ops/skills-cleanup/mine-usage.mjs:136-140`.
- **CLI `main().catch` transform** (meaningful log+exit): `packages/create/src/cli.ts:55-59`, `apps/rad-os/scripts/import-radiants-pfps.mjs:134-148` (classifies script skips).
- **HTTP server body parser** (user input → 400): `ideas/spikes/type-playground-wireframes/type-playground-wireframe-server.mjs:56-64`.
- **Meaningful catch-and-rethrow** (filters known-ok error types, rethrows others): `packages/radiants/eslint/contract.mjs:64-71`, `archive/research/design-guard/reference/token-map-wrapper.mjs:22-29`.
- **Try/finally for test cleanup** (not strictly defensive — resource restoration): `packages/pixel/src/__tests__/transition.test.ts:87, 141, 179` and `renderer.test.ts:89`. Included for completeness — none are catch blocks.
- **SSR-safe window check** in sync computed helper called during render: `apps/rad-os/lib/windowSizing.ts:17`, `packages/radiants/components/core/AppWindow/AppWindow.tsx:196, 265`. Keep — genuinely reachable from SSR render path.

## Patterns audited but not flagged

- `useRef(null)` — React pattern, not defensive.
- `?.` / `??` on results of `.find()` / `useState` — contract-correct, not defensive.
- `@ts-nocheck` files under `apps/rad-os/lib/dotting/` — vendored, explicitly deferred; null-check noise in that tree was not considered.
- `if (!ref.current) return;` inside `useEffect` / `useCallback` — React refs are legitimately nullable by framework contract; not defensive.
- `|| []` / `?? []` on arrays parsed from JSON / optional args — feeding real nullable inputs.
- `if (visible === false) return null;` rendering patterns — branching, not defense.

## Observations

- No empty `catch (e) {}` blocks found. Every catch either logs (at a real boundary), transforms (e.g. Response 400, return fallback), or rethrows after discrimination.
- No try/catch around demonstrably non-throwing synchronous code.
- No null checks on hook return types that React guarantees non-null.
- The most interesting "load-bearing" surprise: `eslint/contract.mjs` and `token-map-wrapper.mjs` both filter `MODULE_NOT_FOUND` / `SyntaxError` and rethrow — the catches look defensive at a glance but are structurally meaningful because the contract JSON is a generated artifact that may not exist during cold-start / pre-generation.
