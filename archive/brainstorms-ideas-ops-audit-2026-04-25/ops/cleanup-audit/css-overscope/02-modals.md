# Modal/Overlay Primitive Family — CSS Over-scope Audit

Scope: Dialog, AlertDialog, Sheet, Drawer, Popover, Tooltip. Each wraps `@base-ui/react` primitives that already render a root, backdrop, positioner, and popup. Findings below enumerate extra wrapper divs, duplicated layouts, and patterns that should collapse into a shared primitive.

---

### F1: Double wrapper inside `BaseDialog.Popup` (two nested `<div>`s where one suffices) — High
- File: `packages/radiants/components/core/Dialog/Dialog.tsx:121-137`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <BaseDialog.Popup className="group fixed inset-0 z-50 flex items-center justify-center">
    <div className="relative z-10 w-full max-w-[32rem] mx-4 transition-[opacity,transform,filter] ... group-data-[starting-style]:opacity-0 ...">
      <div className={`pixel-rounded-sm bg-page pixel-shadow-floating ${className}`.trim()}>
        {children}
      </div>
    </div>
  </BaseDialog.Popup>
  ```
- Proposal: Base UI's `Popup` element is already the animated/styled node and exposes `data-[starting-style]`/`data-[ending-style]` directly — no need for the `group` indirection. Collapse to a single element:
  ```tsx
  <BaseDialog.Popup
    className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-[32rem] mx-4
      pixel-rounded-sm bg-page pixel-shadow-floating
      transition-[opacity,transform,filter] duration-[var(--duration-base)] ease-out
      data-[starting-style]:opacity-0 data-[starting-style]:scale-95
      data-[ending-style]:opacity-0 data-[ending-style]:-translate-y-2 data-[ending-style]:blur-sm
      ${className}`}
  >
    {children}
  </BaseDialog.Popup>
  ```
- Why safe: Base UI documents `Popup` as the styled content surface; the outer `flex items-center justify-center` is only to center the inner div — replaceable with `left-1/2 top-1/2 -translate-*` on the popup itself. Eliminates 2 DOM nodes per dialog.

---

### F2: Same double-wrapper pattern in AlertDialog — High
- File: `packages/radiants/components/core/AlertDialog/AlertDialog.tsx:115-131`
- Pattern: cross-file-duplication (mirrors F1)
- Current: identical `BaseAlertDialog.Popup > div.group-data-* > div.pixel-rounded-sm` stack as Dialog.
- Proposal: same collapse strategy as F1, applied to `BaseAlertDialog.Popup`.
- Why safe: AlertDialog content shell has no reason to diverge from Dialog — wrappers are byte-identical.

---

### F3: Duplicate `Backdrop` block across four files (confetti mask pattern) — High
- File:
  - `packages/radiants/components/core/Dialog/Dialog.tsx:110-120`
  - `packages/radiants/components/core/AlertDialog/AlertDialog.tsx:104-114`
  - `packages/radiants/components/core/Sheet/Sheet.tsx:137-147`
  - `packages/radiants/components/core/Drawer/Drawer.tsx:145-155`
- Pattern: cross-file-duplication
- Current: every file inlines the same `fixed inset-0 z-50 transition-opacity ... data-[starting-style]:opacity-0 data-[ending-style]:opacity-0` + inline `style={{ background, maskImage, WebkitMaskImage, maskSize, WebkitMaskSize, imageRendering }}` block. Only the duration token differs (`--duration-base` vs `--duration-moderate` vs hard-coded `200`).
- Proposal: extract a shared internal `<PatternBackdrop backdrop={BaseDialog.Backdrop} duration="base" />` primitive (or a `pattern-backdrop` utility class that bundles the mask declarations). Each surface becomes a one-liner.
- Why safe: styles are literally identical; consolidating removes ~40 LOC and a recurring maintenance hazard (Drawer already drifted to a hard-coded `200` instead of a token — see F10).

---

### F4: Duplicate `Header`/`Body`/`Footer` sub-primitives across four files — High
- File:
  - Dialog: `Dialog.tsx:151-213` (`Header`, `Body`, `Footer`)
  - AlertDialog: `AlertDialog.tsx:145-207`
  - Sheet: `Sheet.tsx:176-246`
  - Drawer: `Drawer.tsx:188-250`
- Pattern: cross-file-duplication
- Current: Header = `px-6 pt-6 pb-4 border-b border-rule` (Drawer: `pt-4`), Body = `px-6 py-4` (+ `flex-1 overflow-auto` in Sheet/Drawer), Footer = `px-6 pb-6 pt-4 border-t border-rule flex justify-end gap-2` — copy-pasted four times.
- Proposal: introduce a single internal `ModalShell` module (e.g. `packages/radiants/components/core/_shared/ModalShell.tsx`) exporting `Header`, `Body`, `Footer`, `Title`, `Description`. Dialog/AlertDialog/Sheet/Drawer re-export them. Title/Description would need to accept the concrete `BaseXxx.Title` element via prop since each wires to its own Base UI namespace.
- Why safe: four files currently hold 12 structurally identical sub-components; any future change to modal padding/rule currently requires four edits and drifts silently. One shared module is the obvious refactor.

---

### F5: Duplicate `Title`/`Description` wrappers (only Base UI element varies) — Med
- File:
  - Dialog: `Dialog.tsx:164-183`
  - AlertDialog: `AlertDialog.tsx:158-177`
  - Sheet: `Sheet.tsx:191-212`
  - Drawer: `Drawer.tsx:201-220`
- Pattern: cross-file-duplication
- Current: same `font-heading text-base uppercase tracking-tight leading-none text-main text-balance` class string and same `font-sans text-base text-sub mt-2 text-pretty` string repeated 4× each.
- Proposal: in the shared module, accept the Base UI primitive as a generic (`<ModalShell.Title as={BaseDialog.Title}>…`) or expose a simple `modalTitleClass`/`modalDescriptionClass` string constant imported by all four.
- Why safe: classes are byte-identical; no caller-visible surface changes.

---

### F6: Popover has 3 wrappers around `BasePopover.Popup` content — Med
- File: `packages/radiants/components/core/Popover/Popover.tsx:101-116`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <BasePopover.Popup className="z-50 transition-... data-[starting-style]:...">
    <div className={`pixel-rounded-sm bg-page pixel-shadow-raised ${className}`}>
      <div className="p-4">
        {children}
      </div>
    </div>
  </BasePopover.Popup>
  ```
- Proposal: collapse onto the Popup itself — animation tokens, surface tokens, and padding all belong on one element:
  ```tsx
  <BasePopover.Popup
    className={`z-50 p-4 pixel-rounded-sm bg-page pixel-shadow-raised
      transition-[opacity,transform,filter] duration-[var(--duration-base)] ease-out
      data-[starting-style]:opacity-0 data-[starting-style]:translate-y-1
      data-[ending-style]:opacity-0 data-[ending-style]:blur-sm ${className}`}
  >
    {children}
  </BasePopover.Popup>
  ```
- Why safe: Popup is a single element with no structural dependants — the two inner divs purely carry classes. `p-4` applied directly is equivalent to a padding wrapper.

---

### F7: Tooltip has an inner content wrapper that can merge into `Popup` — Med
- File: `packages/radiants/components/core/Tooltip/Tooltip.tsx:81-105`
- Pattern: wrapper-collapse
- Current: outer `BaseTooltip.Popup` owns animation tokens; inner `<div>` owns the surface (`pixel-rounded-xs bg-inv px-2 py-1 text-flip font-heading …`). Two nodes for one visual bubble.
- Proposal: merge the inner classes onto `BaseTooltip.Popup` directly. No content ever goes between them.
- Why safe: Popup already carries `data-rdna="tooltip"`; the inner div is purely cosmetic. Removes one DOM node per tooltip, which matters because tooltips are dense on dashboards.

---

### F8: Sheet has no inner shell wrapper — use as the canonical pattern — Low
- File: `packages/radiants/components/core/Sheet/Sheet.tsx:148-160`
- Pattern: primitive-has-it
- Current: Sheet already applies `bg-page`, `border-line`, `shadow-floating`, transition, and side styles directly on `BaseDialog.Popup` — no inner div. This is what Dialog/AlertDialog/Popover should look like.
- Proposal: use Sheet's structure as the reference for flattening F1, F2, F6. (No change to Sheet itself.)
- Why safe: noted as exemplar, not a defect.

---

### F9: Drawer still uses `border` + `shadow-floating` on `pixel-rounded-sm` popup (lint violation risk) — Med
- File: `packages/radiants/components/core/Drawer/Drawer.tsx:156-166`
- Pattern: primitive-has-it
- Current:
  ```tsx
  <BaseDrawer.Popup
    className={`fixed z-50 ${directionStyles[direction]} bg-card border border-line shadow-floating transition-transform …`}
  >
  ```
  `directionStyles` all include `pixel-rounded-sm`, yet the popup also adds `border border-line` and `shadow-floating` — both flagged by `rdna/no-pixel-border` and `rdna/no-clipped-shadow` (see repo CLAUDE.md). Sheet avoided this because it doesn't use `pixel-rounded-*`.
- Proposal: drop `border border-line` entirely (pixel-rounded renders its border via `::after`), and switch `shadow-floating` to `pixel-shadow-floating`.
- Why safe: brings Drawer in line with the documented pixel-corner rules; no visual regression once the correct tokens are wired.

---

### F10: Duplicate/drift on backdrop + popup transition durations — Low
- File:
  - Dialog backdrop: `Dialog.tsx:111` uses `duration-[var(--duration-base)]`
  - AlertDialog backdrop: `AlertDialog.tsx:105` uses `duration-[var(--duration-base)]`
  - Sheet backdrop: `Sheet.tsx:138` uses `duration-[var(--duration-moderate)]`
  - Drawer backdrop: `Drawer.tsx:146,164` uses raw `duration-200` (no token)
- Pattern: cross-file-duplication (with drift)
- Current: same transition intent, three different sources of truth.
- Proposal: as part of F3's `PatternBackdrop` extraction, centralise the duration tokens (one variant per modal archetype). Move Drawer off raw `200` onto `var(--duration-moderate)` to match Sheet.
- Why safe: tokens already exist; this is a data-entry normalisation, not a visual change beyond Drawer picking up the token value (which is already 200ms).

---

### F11: Repeated `cursor-pointer focus-visible:outline-none` on Trigger/Close — Low
- File:
  - Dialog: `Dialog.tsx:83,91,228,236`
  - AlertDialog: `AlertDialog.tsx:77,85,222,230`
  - Sheet: `Sheet.tsx:97,104,263,270`
  - Drawer: `Drawer.tsx:90,97,265,272`
  - Popover: `Popover.tsx:63,71`
- Pattern: cross-file-duplication
- Current: every Trigger and Close passes the exact same `className="cursor-pointer focus-visible:outline-none"`, in both `asChild` and non-`asChild` branches (4 uses per file).
- Proposal: a shared `MODAL_TRIGGER_CLASS` constant (or a thin internal `TriggerShell({ primitive, asChild, children })` helper that handles the branching). Removes 18+ identical literals.
- Why safe: literal strings, no behavior change.

---

## Summary

Highest-leverage finding is **F4** (cross-file Header/Body/Footer duplication) combined with **F3** (shared backdrop) and **F1/F2/F6** (collapsing the always-present double-wrapper around `*.Popup`). A single `_shared/ModalShell.tsx` primitive plus a `PatternBackdrop` helper would:

- delete ~2 wrapper divs from every Dialog/AlertDialog/Popover/Tooltip render,
- reduce 4 files by ~60% in the sub-primitive region (Header/Body/Footer/Title/Description repeated verbatim),
- fix latent drift (Drawer's raw `duration-200`, Drawer's `border` + `shadow-*` on pixel-rounded popup flagged by `rdna/no-pixel-border` + `rdna/no-clipped-shadow`),
- make future modal styling changes one-edit instead of four-edit.

Sheet is already the flat reference shape — migrate the others toward it.

Report path: `/Users/rivermassey/Desktop/dev/DNA-logo-maker/ops/cleanup-audit/css-overscope/02-modals.md`
