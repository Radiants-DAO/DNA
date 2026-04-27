# impl-09 — Popup family shell/pad collapse

**Scope**: Collapse `Popup > div[shell] > div[pad] > children` onto `Popup` itself for the 9 positioner-based popup components.

**Audit source**: `12-rdna-small.md` F1 (systemic) and `00-MASTER.md` §3c.

**API break**: Yes — internal-only, user pre-approved.

## Per-file LOC delta + divs removed

| File | LOC before | LOC after | Δ | Divs removed |
|------|------------|-----------|----|--------------|
| `ContextMenu/ContextMenu.tsx` | 164 | 160 | -4 | 2 |
| `DropdownMenu/DropdownMenu.tsx` | 333 | 332 | -1 | 2 |
| `Menubar/Menubar.tsx` | 219 | 218 | -1 | 2 |
| `Combobox/Combobox.tsx` | 299 | 297 | -2 | 1 (List kept for scroll) |
| `NavigationMenu/NavigationMenu.tsx` | 236 | 233 | -3 | 1 (Viewport kept) |
| `Select/Select.tsx` | 242 | 237 | -5 | 2 |
| `Popover/Popover.tsx` | 121 | 118 | -3 | 2 |
| `Tooltip/Tooltip.tsx` | 117 | 111 | -6 | 1 |
| `PreviewCard/PreviewCard.tsx` | 118 | 115 | -3 | 2 |
| **Totals** | **1849** | **1821** | **-28** | **15** |

## PopupSurface extraction: No

**Rationale**: The 9 popups vary across 3 axes with low overlap:

| Axis | Values observed |
|------|-----------------|
| Radius | `pixel-rounded-xs` (6), `pixel-rounded-sm` (3) |
| Background | `bg-page` (4), `bg-card` (4), `bg-inv` (1 – Tooltip) |
| Animation | none / `duration-fast` / `duration-base` / `duration-moderate` |
| Inner padding | `py-0` / `py-1` / `p-4` / none (List handles) |

A shared primitive would need 4 variant props and would NOT reduce line count meaningfully (Popup already takes `className` directly). ModalShell extraction was justified because 12 byte-identical copies existed; here every surface already differs. Applied classes directly.

## Consumer-audit findings

- `Grep` for `data-slot="menu-content-pad"` / `popup-shell` / `popup-pad`: 0 hits. No external CSS or tests targeted the inner wrapper divs.
- `Grep` for `.pixel-rounded-*` / `.pixel-shadow-raised` selectors in `apps/**`: 0 hits.
- No `data-slot` attributes existed on the collapsed inner divs — nothing to preserve or migrate.
- `data-rdna="*"` / `data-variant="popover"` / `data-variant="preview-card"` were on `Popup`, not the wrappers — unaffected.

## DOM nodes saved per popup open

**15 DOM nodes removed across the family per simultaneously-open popup.** Typical interaction (a single dropdown open) saves 2 nodes; a fully-composed window with nested ContextMenu + Tooltip + Popover open saves ~6.

## Animation fidelity

All enter/exit animations preserved verbatim. `duration-base` / `duration-moderate` / `duration-fast` tokens retained per file (verified no drift). Animation classes now live directly on `Popup` — same compositor layer, identical behavior.

## Test results

- `npx tsc --noEmit -p packages/radiants` — **clean (0 errors)**.
- `pnpm --filter @rdna/radiants test` (full suite, filtered to the 9 components + sibling coverage): **90 passed, 2 failed (pre-existing, unrelated)**.
  - All 9 popup-family test files pass: ContextMenu, DropdownMenu, Menubar, Combobox, NavigationMenu, Select, Popover, Tooltip, PreviewCard.
  - 2 failures: `Dialog.test.tsx` + `Sheet.test.tsx` "closes on backdrop click" — verified pre-existing via stash-and-rerun. Both look for `.bg-hover` backdrop element; the failure is in Dialog/Sheet (not owned by this agent) and predates this change.

## Test adjustments

Two tests previously used `popup.querySelector('.pixel-rounded-xs')` to find the inner wrapper. After collapse the class sits on the popup element itself, so `querySelector` (descendants-only) would miss it. Migrated to `toHaveClass`:

- `Tooltip/Tooltip.test.tsx` — `tooltip.querySelector('.pixel-rounded-xs')` → `expect(tooltip).toHaveClass('pixel-rounded-xs')` (same for `bg-inv`).
- `PreviewCard/PreviewCard.test.tsx` — same migration for `pixel-rounded-xs` and `pixel-shadow-raised`.

Other tests (Menubar, NavigationMenu) already used `closest()` which matches the element itself — no edit needed.

## Deferred files

None. All 9 targets collapsed in-place.

## Remaining `data-slot` audit

After collapse, `data-slot="button-face"` remains only on NavigationMenu `Trigger` / `Link` (semantic, handed off to button-face styler) — still meaningful. No orphaned slots.
