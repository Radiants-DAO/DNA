# impl-05-modals — Modal family extraction + Drawer lint fix

Date: 2026-04-20
Scope: Dialog, AlertDialog, Sheet, Drawer. Single-pass refactor covering
02-modals F1–F5, F9–F11, plus 00-MASTER §1 B and §3a/3b collapses.

## Shared modules created

- `packages/radiants/components/core/_shared/PatternBackdrop.tsx` — confetti-mask backdrop wrapper. Accepts `as` (Base UI backdrop primitive), `duration` (`'base'` | `'moderate'`), `className`. Eliminates 4× duplicated inline-style blocks. Centralises the duration token so Drawer can't drift again (F10).
- `packages/radiants/components/core/_shared/ModalShell.tsx` — `{Header, Body, Footer, Title, Description}` sub-primitives. Header/Body/Footer are plain divs; Body takes `scrollable` (Sheet/Drawer), Header takes `compact` (Drawer uses `pt-4`). Title/Description take `as={Base*.Title}` so each modal wires its namespaced Base UI primitive. Also exports `MODAL_TRIGGER_CLASS` constant (F11).

## Files changed

| File | Before | After | Δ LOC |
|---|---:|---:|---:|
| Dialog.tsx | 283 | 249 | -34 |
| AlertDialog.tsx | 281 | 252 | -29 |
| Sheet.tsx | 278 | 242 | -36 |
| Drawer.tsx | 324 | 291 | -33 |
| _shared/PatternBackdrop.tsx | — | 79 | +79 (new) |
| _shared/ModalShell.tsx | — | 128 | +128 (new) |
| **Net** |  |  | **+75** (but 12 byte-identical functions collapsed; drift fixed) |

## Drawer lint fix (00-MASTER §1 B)

`BaseDrawer.Popup` previously carried `border border-line` + `shadow-floating` on a `pixel-rounded-sm` surface (violates `rdna/no-pixel-border` + `rdna/no-clipped-shadow`). Fix:

- Dropped `border border-line` entirely — `pixel-rounded-sm`'s `::after` renders the visible edge.
- Swapped `shadow-floating` → `pixel-shadow-floating` so the box-shadow isn't clipped by the corner mask.
- Backdrop duration moved from raw `duration-200` to `duration-[var(--duration-moderate)]` (aligns with Sheet; F10).
- Popup transition-transform already used `var(--duration-moderate)` via the same token.

## §3a collapse (Dialog / AlertDialog)

The animation wrapper div is load-bearing (carries `group-data-[starting-style]` + width). I merged the inner `pixel-rounded-sm bg-page pixel-shadow-floating` card-div INTO the animation wrapper, saving one DOM node per open dialog. Dialog test assertion `dialog.querySelector('.pixel-rounded-sm')` still passes (classes moved up one level, still inside `BaseDialog.Popup`).

## §3b (Sheet / Drawer)

Sheet left structurally alone (already the canonical shape). Drawer now matches Sheet's single-node-per-surface shape with lint-legal tokens. Drawer keeps its drag-handle affordance; no border/overflow-hidden on pixel-rounded popup.

## F11 (duplicated trigger class)

Extracted `MODAL_TRIGGER_CLASS = 'cursor-pointer focus-visible:outline-none'` constant in `_shared/ModalShell.tsx`, imported in all 4 files. Eliminates 16 copies (Trigger asChild/non-asChild + Close asChild/non-asChild × 4 files). Did not collapse the Trigger/Close branching into a helper — the Base UI `render` vs child-body split is narrow and wrapping it hides the asChild contract for readers; constant is the cleaner win.

## Consumer APIs touched

**None.** Public surface (`Dialog.Header`, `AlertDialog.Footer`, `Sheet.Body`, `Drawer.Title`, `SheetHeader`, etc.) unchanged — consumers only pass `className`/`children`/`asChild`. Validated against `registry/runtime-attachments.tsx` and all 4 component test files; test-only assertions on `.pixel-rounded-sm` + `.pixel-shadow-floating` still pass because those classes now live on the animation-wrapper div (still inside `role=dialog`).

## Validation

- `npx tsc --noEmit` on `apps/rad-os`: zero new errors from this change. (One unrelated pre-existing error on `tabsContentVariants` export.)
- Grep of consumers (`Dialog.Header`, `AlertDialog.Body`, `Sheet.Title`, `Drawer.Footer`) turned up only `registry/runtime-attachments.tsx` + `*.test.tsx` — all still match the unchanged public API.

## Deferred

- F6 (Popover triple-wrapper) and F7 (Tooltip inner wrapper) — out of scope per the task brief (positioner-based popups are §3c, separate PR per 00-MASTER rollout plan).
- Did not merge Trigger/Close asChild branching into a helper (see above).
