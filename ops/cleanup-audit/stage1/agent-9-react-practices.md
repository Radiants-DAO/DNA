# Agent 9 — React Best Practices & useEffect Audit (Stage 1)

**HEAD:** d658b2b568bdb0ff4921f83c4ada8bcedd76df55
**Branch:** main
**Dirty files:** none
**Scope:** all apps/ and packages/ React code EXCEPT `apps/rad-os/lib/dotting/**`
**Method:** direct file reads + `rg`; cross-checked Vercel React Best Practices rules (`rerender-derived-state-no-effect`, `rerender-move-effect-to-event`, `client-event-listeners`, `advanced-event-handler-refs`)

This report is **read-only**. No files were modified. Findings are sorted by severity × confidence within each category. Copy-on-import boundary is respected — identical issues in `apps/rad-os/**` and `packages/radiants/**` are listed separately with `intentional_copy_on_import` nuance flagged where applicable.

---

## Executive Summary

**Total findings:** 21 (IDs REACT-001..REACT-024; REACT-005/008/009 were collapsed into others or re-classified as non-violations).

| Category | Count |
|---|---|
| useEffect anti-patterns | 5 (REACT-001..004, 006) |
| Array-index keys | 3 (REACT-007, 010, 011) |
| Inline-style objects (5+ props) | 3 (REACT-012..014) |
| Click-without-keyboard a11y | 4 (REACT-015..018) |
| Derived state (`useState(prop)` + sync `useEffect`) | 1 (REACT-019) |
| Typography below legible threshold | 3 (REACT-020..022) |
| `bg-black` visible surfaces | 2 (REACT-023..024) |

**Noteworthy density hotspots:**
- `apps/rad-os/app/ctrl-preview/page.tsx` — 9+ inline `fontSize:10` inline-style objects; `bg-black`; 1 unlabeled `<div onClick>`.
- `apps/rad-os/components/apps/goodnews/GoodNewsLegacyApp.tsx` — 6 `key={index}` renders over layout-derived arrays + `DropCapBox` div with `onClick` but no role/keyboard handler.
- `packages/radiants/registry/PropControls.tsx` — 5 × `text-[10px]` plus the only confirmed `useState(prop)+useEffect` derived-state pattern.
- `apps/rad-os/components/apps/RadRadioApp.tsx` — 5 effects inside one controller component; two that sync external state (audio play/pause) via store subscription are correct; `VideoPlayer` has a clean callback-ref pattern already.

**Positive patterns already present:**
- `WebGLSun.tsx` uses `useEffectEvent` + store `subscribe()` to avoid re-rendering on preference changes (exemplary `rerender-use-ref-transient-values`).
- `base.css:948` has `:focus-visible { box-shadow: var(--shadow-focused) }` globally — so most `outline: none` usages inside `packages/ctrl/**` are visually replaced.
- Compound components and `useState(defaultOpen)` in Dialog/Sheet/AlertDialog/Drawer/Tabs/Select are correct uncontrolled-seed patterns (NOT derived state) — reported as NOT violations in the report despite matching the React Doctor lead.

---

## A — useEffect Anti-Patterns

### REACT-001 — Effect-as-event-handler: navigation key listener re-binds on every `openWindow`/`setActiveTab` re-render (`useHashRouting`)
- **Files:** `apps/rad-os/hooks/useHashRouting.ts:37-87` (+ duplicate at `templates/rados-app-prototype/hooks/useHashRouting.ts:15-57`)
- **Confidence:** 0.78 | **Blast radius:** medium
- `syncWindowsFromHash` is declared inside the effect and calls `openWindow/closeWindow/setActiveTab` from `useWindowManager`. Whenever the window store changes identity those callbacks can change; the deps array forces the whole `hashchange` listener to reattach. A window-state ref already exists (`windowsRef`) for one side of the loop — the other side can use the same trick. Per `client-event-listeners` and `advanced-use-latest`, the listener should subscribe once with stable identity refs.
- Classification: `consolidation_candidate` (both files) — but **do NOT unify across the `templates/` boundary** (those are app scaffolding copies).

### REACT-002 — Resize/dim effect chain in `AppWindow.tsx` runs two ResizeObservers with overlapping deps
- **File:** `packages/radiants/components/core/AppWindow/AppWindow.tsx:788-903`
- **Confidence:** 0.71 | **Blast radius:** medium
- `isResizing` pointermove/pointerup listener and the `autoCenter` ResizeObserver both mount/unmount on changes of `effectiveMax.width/height`, `minSize.*`, etc. Because `effectiveMax` is `useMemo`d but `minSize` is a default-initialized object literal that may flip referential identity per render when a parent passes an inline `minSize={{ width, height }}`, both effects can churn. Per `rerender-dependencies`, the effect should depend on primitives only.
- Classification: `keep_with_reason` — not incorrect, just fragile. Suggest explicit `minSize.width` / `minSize.height` destructure in a stable ref if any caller is shown to pass inline.

### REACT-003 — `WebGLSun.tsx` `useEffectEvent` on `resumeAnimationIfNeeded` used inside two separate effects
- **File:** `apps/rad-os/components/background/WebGLSun.tsx:266-308`
- **Confidence:** 0.60 | **Blast radius:** low
- Both the matchMedia effect and the store-subscribe effect invoke `resumeAnimationIfNeeded`. The hook already uses `useEffectEvent` correctly (stale-closure-safe). ESLint will not allow `useEffectEvent` in deps so this is correct by design. **NOT a violation** — flagged here only because an early-career reviewer may try to "fix" it. Do nothing. Classification: `keep_with_reason`.

### REACT-004 — `useTypewriter` relies on a mutable ref graph inside an effect triggered only by `messages`
- **File:** `apps/rad-os/hooks/useTypewriter.ts:26-65`
- **Confidence:** 0.55 | **Blast radius:** low
- `indexRef.current`, `phaseRef.current`, `charRef.current` persist across effect teardown, so switching `messages` will resume mid-character at whatever `charRef` was. If the caller mounts the hook then later changes `messages` length, you can index past the end. Not a bug today because all call sites pass stable arrays — but fragile. Classification: `keep_with_reason`.

### REACT-005 — `useHashRouting` window-syncing effect reads a ref for stability but writes in a way that can desync when `openWindow` is async (classification)
- Already captured in REACT-001; kept as a single finding.

### REACT-006 — `CommandPalette` key listener intentionally not tied to `open` — **CORRECT**
- **File:** `apps/rad-os/components/Rad_os/CommandPalette.tsx:12-21`
- **Confidence:** 0.85 | Classification: `keep_with_reason`
- The `⌘K` listener must fire regardless of open state. Empty-dep effect with stable functional setState. Good pattern per `rerender-functional-setstate`. Noted so reviewers don't "fix" it.

---

## B — Array-index keys (reorderable lists)

### REACT-007 — `key={index}` over annotation-derived word spans in ManifestoBook
- **File:** `apps/rad-os/components/apps/manifesto/ManifestoBook.tsx:74,93` (inside 73-96 range)
- **Confidence:** 0.74 | **Blast radius:** low
- `words.map((w, i) => <span key={i}>…</span>)` and the outer `justified.segments` maps use index as the sole key. The `words` array is rebuilt from `justified.segments.filter(!isSpace)` on every render of `renderAnnotatedLine`, so reordering by re-layout would mis-identify spans. Preferred: `key={`${idx}-${i}-${w.text}`}`.
- Classification: `consolidation_candidate` (reuse a helper that key-ifies by content).

### REACT-008 — `key={i}` over `words` inside ManifestoBook reduce (twice)
- **File:** `apps/rad-os/components/apps/manifesto/ManifestoBook.tsx:74`
- Already covered by REACT-007 — the `reduce` also uses `i` to interleave spaces; if the source array length changes, React will reuse DOM nodes. Same fix. Classification: `consolidation_candidate`.

### REACT-009 — `key={index}` over `SEMANTIC_CATEGORIES` child rows (static array, OK) — **CORRECT**
- **File:** `apps/rad-os/components/apps/BrandAssetsApp.tsx:600-603`
- `cat.name` IS used as the key. The `i` is only passed as `index` prop. Confirmed benign.

### REACT-010 — `key={index}` over layout-derived `result.els` in GoodNewsLegacyApp (6 occurrences)
- **File:** `apps/rad-os/components/apps/goodnews/GoodNewsLegacyApp.tsx:1154, 1177, 1193, 1207, 1232, 1252`
- **Confidence:** 0.62 | **Blast radius:** low
- The `result.els` list is regenerated wholesale each layout pass, so index keys collide with stable-identity assumptions (e.g., imperative focus, measured heights). Suggest composite keys: `element.kind + element.x + element.y`.
- Classification: `keep_with_reason` — lists are in practice deterministic until container width changes, at which point everything re-keys anyway. Flagged for awareness; do not prioritize a fix.

### REACT-011 — `key={i}` over `ruleXs` in GoodNewsLegacyApp
- **File:** `apps/rad-os/components/apps/goodnews/GoodNewsLegacyApp.tsx:1133`
- **Confidence:** 0.65 | **Blast radius:** low
- `ruleXs` is recomputed per render but deterministic from `containerWidth`; using the x-coordinate as key would be safer: `key={`rule-${ruleX}`}`. Classification: `keep_with_reason`.

---

## C — Inline-style objects with 5+ properties (re-created every render)

### REACT-012 — Large inline style objects in `ctrl-preview/page.tsx`
- **File:** `apps/rad-os/app/ctrl-preview/page.tsx:108, 125-131, 156-161, 298-301, 763-770`
- **Confidence:** 0.81 | **Blast radius:** low
- Multiple `style={{ width, padding, border, boxShadow, justifyContent, ... }}` cases with 5–7 properties. Because this is a **preview page** (not a hot component path), the cost is minor, but per `rerender-memo-with-default-value` these could be `const` outside the component. Classification: `consolidation_candidate` — keep scope to this file.

### REACT-013 — Inline style re-creation in `NumberInput.tsx` (ctrl package)
- **File:** `packages/ctrl/controls/NumberInput/NumberInput.tsx:103-107, 116-125`
- **Confidence:** 0.68 | **Blast radius:** low
- `NumberField.Input` render function creates a new style object every parent render. Props like `cursor`, `textShadow`, etc. can be hoisted to a `const` or `useMemo`. Classification: `consolidation_candidate` (local to file).

### REACT-014 — Inline 5+ prop styles on each `masthead-text` / `heading-line` in GoodNewsLegacyApp
- **File:** `apps/rad-os/components/apps/goodnews/GoodNewsLegacyApp.tsx:1156-1168, 1209-1223`
- **Confidence:** 0.45 | **Blast radius:** low
- Pretext-driven dynamic positioning — each element has genuinely unique `left/top/width/fontSize/lineHeight`. The style object MUST be per-item; memoization gives nothing here. Classification: `keep_with_reason`.

---

## D — Clickable non-interactive elements (a11y + keyboard handler)

### REACT-015 — `LayerTreeRow` row `<div onClick>` has no role or keyboard handler
- **File:** `packages/ctrl/layout/LayerTreeRow/LayerTreeRow.tsx:44-57`
- **Confidence:** 0.90 | **Blast radius:** low
- `<div className="cursor-pointer" onClick={onSelect}>` with no `role`, `tabIndex`, or `onKeyDown`. Classification: `consolidation_candidate` (fix in place with `role="button" tabIndex={0} onKeyDown={…}`).

### REACT-016 — `ColorSwatch` has `onClick` and `role="option"` but no keyboard handler / tabIndex
- **File:** `packages/ctrl/selectors/ColorSwatch/ColorSwatch.tsx:39-49`
- **Confidence:** 0.86 | **Blast radius:** low
- `role="option"` is set (good intention) but there's no `tabIndex` and no `onKeyDown`, so keyboard users cannot activate. Classification: `consolidation_candidate`.

### REACT-017 — `DropCapBox` div with `onClick` but no role/keyboard
- **File:** `apps/rad-os/components/apps/goodnews/GoodNewsLegacyApp.tsx:287-301`
- **Confidence:** 0.80 | **Blast radius:** low
- Div has `onClick={() => onScaleChange?.(...)}` + `onMouseEnter/Leave` cycling but no role or keyboard. Also entirely inline-styled — unrelated concern. Classification: `consolidation_candidate`.

### REACT-018 — ctrl-preview mode toggle `<div onClick>` with inline style and no a11y
- **File:** `apps/rad-os/app/ctrl-preview/page.tsx:762-774`
- **Confidence:** 0.75 | **Blast radius:** low
- Preview scaffolding, so impact is marginal, but the pattern appears in user-facing code: `<div onClick={…} style={{…}}>`. Classification: `consolidation_candidate`.

### Manifesto trigger-span onClicks — **acceptable**
- **File:** `apps/rad-os/components/apps/manifesto/ManifestoBook.tsx:123, 194, 493-499`
- These are decorative text-highlight spans that toggle inline images. They have `title="tap to show image"` and use `cursor-pointer`. Classification: `keep_with_reason` — gesture is a progressive enhancement over static content.

---

## E — Derived state stored via `useState + useEffect`

### REACT-019 — `PropControls.NumberControl` mirrors `value` prop into `raw` state via effect
- **File:** `packages/radiants/registry/PropControls.tsx:193-197`
- **Confidence:** 0.92 | **Blast radius:** low
- Pattern: `const [raw, setRaw] = useState(String(value)); useEffect(() => setRaw(String(value)), [value]);`. This is the textbook Vercel `rerender-derived-state-no-effect` anti-pattern, and the `onBlur={() => setRaw(String(value))}` at line 211 shows the real intent is "mirror prop but allow transient editing". Replace with the controlled/uncontrolled pattern using a single source of truth, or drive editing through a ref + controlled prop. Classification: `consolidation_candidate`.

### NOT findings — `useState(defaultOpen)` in Dialog/Sheet/AlertDialog/Drawer
- **Files:** `packages/radiants/components/core/{AlertDialog,Dialog,Drawer,Sheet}.tsx`, `packages/ctrl/layout/Section/Section.tsx`, `packages/radiants/components/core/Tabs/Tabs.tsx`
- These are controlled/uncontrolled patterns — the state is only the seed, and an `isControlled` check routes reads to the prop. This matches React docs' recommended pattern and is **not** derived-state. Explicitly excluded from findings.

---

## F — Typography below legible threshold

### REACT-020 — `text-[10px]` in `PropControls.tsx` user-facing inputs and labels
- **File:** `packages/radiants/registry/PropControls.tsx:179, 212, 232, 257, 295`
- **Confidence:** 0.85 | **Blast radius:** low
- Registry preview UI renders inputs at 10px. While this is in the RDNA previewer (not an end-user surface), the React Doctor flag is valid — the minimum is 12px. Classification: `consolidation_candidate` — bump to `text-xs` (12px) or add a justifying `// eslint-disable-next-line` with owner/expires metadata.

### REACT-021 — `text-[10px]` in `DesignSystemTab.tsx` placeholder label
- **File:** `apps/rad-os/components/ui/DesignSystemTab.tsx:69`
- **Confidence:** 0.70 | **Blast radius:** low
- Single label span. Classification: `consolidation_candidate`.

### REACT-022 — Inline `fontSize: 10` in ctrl-preview + ctrl selectors/readouts
- **Files:** `apps/rad-os/app/ctrl-preview/page.tsx:112,126,157,299,316,623`; `packages/ctrl/selectors/MatrixGrid/MatrixGrid.tsx:97`; `packages/ctrl/selectors/Dropdown/Dropdown.tsx:137,146,203`; `packages/ctrl/selectors/ColorPicker/ColorPicker.tsx:176`; `packages/ctrl/controls/NumberInput/NumberInput.tsx:117`; `packages/ctrl/readouts/ProgressBar/ProgressBar.tsx:94`
- **Confidence:** 0.60 | **Blast radius:** low
- Consistent 10px across the CTRL package — this appears to be a deliberate design decision (DAW-style instrument labels). Classification: `keep_with_reason` — CTRL has `text-ctrl-label` semantic and accepts smaller type as part of the instrument-panel aesthetic. Flag for the design-system team to wrap in a semantic token rather than inline.

### `type-manual-copy.ts:243` uses `fontSize: '6px'` — **NOT a finding**
- Intentional "DON'T" example in the typography playground manual.

---

## G — `bg-black` on visible surfaces

### REACT-023 — `bg-black` on ctrl label cells (ctrl-preview)
- **Files:** `apps/rad-os/app/ctrl-preview/page.tsx:107, 151`
- **Confidence:** 0.55 | **Blast radius:** low
- Hardcoded black backgrounds on preview instrument cells. CTRL theme DOES allow pure-black for the "instrument panel" aesthetic (semantic `bg-ctrl-cell-bg` exists), but some direct `bg-black` is still present. Classification: `consolidation_candidate`.

### REACT-024 — `bg-black` inside CTRL package Dropdown / IconRadioGroup / ControlPanel
- **Files:** `packages/ctrl/selectors/Dropdown/Dropdown.tsx:118`; `packages/ctrl/selectors/IconRadioGroup/IconRadioGroup.tsx:63`; `packages/ctrl/layout/ControlPanel/ControlPanel.tsx:50`
- **Confidence:** 0.48 | **Blast radius:** low
- Same story — the CTRL package has a pure-black aesthetic by design. Classification: `keep_with_reason`. Documentation should confirm.

---

## Overlap with existing Stage 1 findings

| Existing finding | Agent 9 overlap |
|---|---|
| **SLOP-004** (`apps/rad-os/hooks/useWindowManager.ts` — nine `useCallback` wrappers, zero logic) | NO direct overlap. Agent 9 did not audit `useCallback` hygiene; `useHashRouting` (REACT-001) consumes those wrappers but Agent 9's concern is listener rebinding, not wrapper uselessness. |
| **WEAK-005..017** (`packages/radiants/registry/runtime-attachments.tsx` — 13 `as any`) | NO overlap — Agent 9 did not find React anti-patterns in that file; its only effect lives in `Spinner/LoadingDots` (which is fine) and its sample demos. Agent 9 did spot `key={i}` in the ScrollArea demo (line 537) but it's a contrived demo and sibling findings (WEAK-*) already dominate. |
| **DEFENSIVE-001** (`apps/rad-os/components/Rad_os/WindowTitleBar.tsx` — unreachable SSR guard) | NO overlap — Agent 9 did not re-audit `WindowTitleBar.tsx` for React patterns. The `useState(false)` for `copied` and the `setTimeout` pattern are fine. |

No duplicate findings. Agent 9's scope is orthogonal to the three cited reports.

---

## Surprises

1. **WebGLSun is already exemplary** — it correctly uses `useEffectEvent` + `useRadOSStore.subscribe(...)` instead of re-running effects on store changes. This is the pattern other components should adopt.
2. **`useState(defaultOpen)` is NOT a derived-state violation** — the React Doctor signal was a false positive because all five instances (AlertDialog, Dialog, Sheet, Drawer, Tabs) use the controlled/uncontrolled pattern correctly.
3. **The only real derived-state + `useEffect` sync anti-pattern** in the entire monorepo is `PropControls.NumberControl` (REACT-019). Everywhere else the "looks like derived state" matches were controlled/uncontrolled seeds.
4. **`outline: none` in CTRL components is already paired with `focus-visible` rings** — the CSS lives on the buttons themselves (`focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ctrl-glow`). Plus `base.css:948` globally replaces the outline with a box-shadow. Most React Doctor `outline:none` hits are false positives; only `apps/rad-os/app/globals.css:89` (cmdk input) lacks a visible replacement.
5. **Array-index keys cluster in pretext/layout code** — GoodNewsLegacyApp, ManifestoBook. The underlying arrays are regenerated per layout pass so the keys "work" empirically, but any future mid-list identity-sensitive operation (focus preservation, intersection observer on a specific span) will break.
