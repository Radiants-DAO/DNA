# Asset Pipeline & Codebase Consolidation Brainstorm

**Date:** 2026-02-20
**Status:** Open — defer until all static modes are shipped

## What We're Building

A consolidation pass that unifies duplicated scanning, extraction, and UI patterns across the codebase. The trigger is the new Asset Mode (per-element scanner) being the third independent asset extraction system alongside the page-wide `assetScanner.ts` (eval) and `handleScanImages` (content-side). Rather than letting this drift further, consolidate when the mode interfaces stabilize.

## Why Later, Not Now

The scanning code runs in three execution contexts (content script, agent/page context, `inspectedWindow.eval`) that can't share imports. Consolidation requires deciding which context wins — which depends on how all modes settle. Premature unification would mean refactoring the abstraction every time a mode's data needs change.

---

## Consolidation Areas

### 1. Asset Scanning — Three Independent Systems

**Current state:**
- `panel/scanners/assetScanner.ts` — page-wide, runs via `eval()`, feeds `AssetsPanel`
- `content/panelRouter.ts` `handleScanImages()` — content-side, `<img>` only, feeds `ImageSwapPanel`
- `content/modes/tools/assetScanner.ts` (new) — per-element, content-side, feeds Asset Mode

**Consolidation:** Retire the `eval()` scanner. Have `AssetsPanel` request asset data from the content script via the message bus (same as how mutation state works). The content-side scanner becomes the single source of truth, with a `scanPage()` wrapper that calls `scanElementAssets(document.body)`.

**Benefit:** One scanner, one set of types, one execution context. `PageImage` and `ScannedImage` merge into one type.

### 2. CSS Custom Property Walking — Three Copies

**Current state:**
- `agent/customProperties.ts` — misses `@layer` and `@property` rules
- `content/modes/tools/colorTokens.ts` — handles `CSSGroupingRule` + `@property` (superset)
- `panel/scanners/tokenScanner.ts` — inline eval string copy

**Consolidation:** Update `customProperties.ts` to match `colorTokens.ts` (add `CSSGroupingRule` + `@property` support). Export from there. `colorTokens.ts` imports instead of defining its own. The eval copy in `tokenScanner.ts` is unavoidable but should have a sync test.

### 3. `resolveToHex` — Five Inline Copies

**Current state:** Canvas-based color resolution (`ctx.fillStyle = color; return ctx.fillStyle`) duplicated in `colorTokens.ts`, `colorTool.ts`, `typographyTool.ts` (×2), `effectsTool.ts`.

**Consolidation:** Export from `colorTokens.ts` (or a shared `colorUtils.ts`). All tools import.

### 4. `getEffectiveBackground` — Two Implementations (One Wrong)

**Current state:**
- `panelRouter.ts` — simple ancestor walk, returns first non-transparent (wrong for layered alpha)
- `contrastScanner.ts` — correct alpha compositing

**Consolidation:** Extract the correct version to a shared utility. Fix the panelRouter one.

### 5. Accessibility Violations — Three Implementations

**Current state:**
- `panelRouter.ts` `checkAccessibilityViolations()` — single element, content-side
- `panel/scanners/accessibilityScanner.ts` — page-wide, CDP AX tree
- `panel/scanners/contrastScanner.ts` — separate WCAG contrast math

**Consolidation:** Extract rule definitions (IDs, messages, suggestions, severities) to a shared constants file. Both scanners reference the same rules. The contrast math divergence (colorjs.io vs inline) should be resolved — pick one.

### 6. Dead Zustand `AssetsSlice`

**Current state:** `AssetsSlice` manages theme/design-system assets (ported from Flow 0). `loadThemeAssets()` and `loadProjectAssets()` immediately error. Nothing calls the bridge setters. `AssetsPanel` uses `useState` independently.

**Consolidation:** Either wire the slice to the scanner output and drop the `useState` pattern, or delete the slice entirely. Currently it's dead weight that confuses the naming.

### 7. Duplicate UI Components

**`SeverityBadge`** — defined locally in both `AccessibilityPanel.tsx` and `AccessibilityAuditPanel.tsx` with near-identical code.

**Consolidation:** Extract to `panel/components/ui/SeverityBadge.tsx`.

### 8. Repeated Panel Scan Pattern

**Current state:** `AssetsPanel`, `VariablesPanel`, `AccessibilityAuditPanel`, `ComponentsPanel` all implement the same `useState` + `useEffect` + `onPageNavigated` + loading/error pattern.

**Consolidation:** Extract `useScan(scanFn)` hook that handles loading state, error state, and page navigation re-scan. Extract `useCopyToClipboard()` for the clipboard feedback pattern.

---

## Priority Order

| Priority | Area | Impact | Effort |
|----------|------|--------|--------|
| 1 | Asset scanning unification (#1) | Eliminates eval scanner, unifies types | Medium |
| 2 | Custom property walker (#2) | Fixes missing `@layer`/`@property` bug | Small |
| 3 | `resolveToHex` (#3) | Pure cleanup, 5 files | Small |
| 4 | `getEffectiveBackground` (#4) | Fixes incorrect contrast ratios | Small |
| 5 | Dead `AssetsSlice` (#6) | Removes confusion | Small |
| 6 | `useScan` hook (#8) | DRYs 4 panel components | Small |
| 7 | `SeverityBadge` (#7) | Pure cleanup | Tiny |
| 8 | A11y rule constants (#5) | Keeps rules in sync | Medium |

## Open Questions

- Should the content-side scanner replace the eval scanner entirely, or should eval be kept as a fallback for pages with aggressive CSP that blocks content scripts?
- When `AssetsSlice` is removed or repurposed, should the panel tab be renamed to clarify it's a page scanner, not a design system asset library?
- Should `classifyTier` in the eval string be replaced with a message-bus round-trip (content script classifies, panel displays) to eliminate the inline regex copy?

## Research Notes

- `agent/customProperties.ts` — canonical CSS variable extractor, used by colorTool and will be used by assetTool
- `content/modes/tools/colorTokens.ts` — superset stylesheet walker with `@property` support
- `panel/scanners/` — all eval-based scanners (assets, tokens, accessibility, contrast)
- `content/features/accessibility.ts` — uses colorjs.io for contrast; eval scanner uses inline math
- `@flow/shared/src/scannerUtils.ts` — canonical `classifyTier` function
