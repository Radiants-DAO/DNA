# CSS Over-Scope Audit — Tabs & Toolbar

Files audited:
- `packages/radiants/components/core/Tabs/Tabs.tsx` (450 LOC)
- `packages/radiants/components/core/Toolbar/Toolbar.tsx` (253 LOC)
- `packages/radiants/components/core/Accordion/` — **does not exist** (skipped)

Tabs siblings: List, Trigger, Content, Indicator, DotPill all live inline in `Tabs.tsx` (single-file compound). No per-sibling directories.

---

## Findings

### F1: Capsule `List` extra centering wrapper — Med
- File: `Tabs/Tabs.tsx:272-282`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div className="shrink-0 flex items-center justify-center p-2">
    <BaseTabs.List className={`pixel-rounded-xs bg-card ${listClasses}`}>
      {children}
    </BaseTabs.List>
  </div>
  ```
- Proposal: Drop the outer div. Move `shrink-0` + outer `p-2` (as `m-2` or a parent-defined pad) onto `BaseTabs.List`; root is already `flex flex-col`, so `self-center` on List replaces `justify-center`.
- Why safe: `BaseTabs.List` renders a DOM element; the centering is a single-child flex hack that `self-center` + `mx-auto` achieves directly.

### F2: `DotPill` double-div — Med
- File: `Tabs/Tabs.tsx:159-180`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div className="pixel-rounded-sm bg-main w-fit ...">
    <div className="flex flex-row items-center justify-center w-fit h-4 py-0.5 px-1 gap-1">
      {...buttons}
    </div>
  </div>
  ```
- Proposal: Single div — `<div className="pixel-rounded-sm bg-main w-fit flex items-center justify-center h-4 py-0.5 px-1 gap-1">`.
- Why safe: Outer only carries `pixel-rounded-sm bg-main`; inner only carries flex layout. Merging preserves both; `flex-row` is default.

### F3: Sidebar `List` wrapper duplicates root orientation — Med
- File: `Tabs/Tabs.tsx:300-307`
- Pattern: duplicate-layout
- Current:
  ```tsx
  <div className="shrink-0 flex flex-col h-full w-fit bg-card border-r border-line">
    {indicator === 'dot' && <DotPill />}
    <BaseTabs.List className="flex flex-col gap-0 p-1 ...">
  ```
- Proposal: The wrapper only exists to stack `DotPill` above `BaseTabs.List`. Either (a) render `DotPill` as a sibling of `BaseTabs.List` inside `BaseTabs.Root` (root is already `flex flex-row`; wrap just these two in a `flex-col` only if DotPill is present), or (b) when `indicator==='none'` emit `BaseTabs.List` directly with `bg-card border-r border-line` applied to it. Removes one div in the common no-indicator case.
- Why safe: Chrome/left state is known at render; `BaseTabs.List` accepts any className.

### F4: `Trigger` always wraps `<button>` in a div — High
- File: `Tabs/Tabs.tsx:397-409`
- Pattern: pass-through / wrapper-collapse
- Current (non-chrome branch):
  ```tsx
  return <div className="pixel-rounded-xs">{buttonEl}</div>;
  ```
- Proposal: Put `pixel-rounded-xs` on the `<button>` directly (append to `classes`). The wrapper adds nothing in capsule mode — it's purely a className holder.
- Why safe: `pixel-rounded-*` is a clip-path utility; it composes with any element including `<button>`. No border/overflow-hidden present to conflict.

### F5: Chrome `Trigger` wrapper is unavoidable, but className is redundant — Low
- File: `Tabs/Tabs.tsx:397-406`
- Pattern: duplicate-layout
- Current: `pxProps.className` + `chromeBackground` + `chromeWrapperClasses` on wrapper, plus `bg-transparent z-10` on inner button for selected.
- Proposal: Keep wrapper (needed for `px()` mask). But the inner button's `bg-transparent text-main z-10` vs `bg-transparent text-accent-inv group` means `bg-transparent` is always set — pull it onto `tabsTriggerVariants({ mode: 'chrome' })` base.
- Why safe: Chrome always wants transparent button; moves the constant into CVA.

### F6: `tabsListVariants` `mode` variant is dead for `chrome` — Med
- File: `Tabs/Tabs.tsx:103-116` and `Tabs/Tabs.tsx:286-296`
- Pattern: duplicate-layout
- Current: `tabsListVariants` defines a `chrome` mode (`'absolute right-2 gap-1 items-end bg-transparent border-none p-0'`) but `List` **bypasses** CVA for chrome entirely and hand-builds `` `flex ${CHROME_ALIGN_CLASS[align]} gap-1 items-end` ``.
- Proposal: Delete the `mode.chrome` branch from `tabsListVariants` (unreachable). Or use it. Pick one.
- Why safe: Static audit — the chrome code path never calls CVA, so the variant is dead code.

### F7: `tabsRootVariants` duplicates what `BaseTabs.Root` orientation already does — Low
- File: `Tabs/Tabs.tsx:92-101`
- Pattern: primitive-has-it (partially)
- Current: `position` → `flex flex-col` or `flex flex-row items-start`. Also passes `orientation` to `BaseTabs.Root` (line 251).
- Proposal: `BaseTabs.Root` is `display: block` by default in @base-ui; the flex layout is ours. Keep — but collapse the two identical `top`/`bottom` entries (`flex flex-col w-full h-full`).
- Why safe: `top` and `bottom` resolve to the same classes; rendering order is determined by child order, not flex-direction here.

### F8: Toolbar `Root` has `inline-block` + `inline-flex` fighting — High
- File: `Toolbar/Toolbar.tsx:157` and `Toolbar/Toolbar.tsx:66`
- Pattern: duplicate-layout / pass-through
- Current:
  ```tsx
  // rootClasses from CVA:  inline-flex items-center gap-0.5 bg-page px-0.5 py-0.5 flex-row
  // applied:  `pixel-rounded-sm inline-block ${className} ${rootClasses}`
  ```
  Final className has both `inline-block` and `inline-flex` — `inline-flex` wins due to later position, but `inline-block` is tokenized nonsense alongside it.
- Proposal: Drop `inline-block` from the template string. Same pattern appears on `ToolbarButton:180` (`pixel-rounded-xs inline-block ${classes}` where `classes` starts with `inline-flex`) and `ToolbarLink:216`.
- Why safe: `inline-flex` fully subsumes `inline-block` for outer-display semantics; removing the loser is a no-op.

### F9: `ToolbarGroup` uses raw `inline-flex` — could share with Root — Low
- File: `Toolbar/Toolbar.tsx:232`
- Pattern: duplicate-layout
- Current: `'inline-flex items-center gap-0.5'` — identical to `toolbarRootVariants` base minus bg/pad.
- Proposal: Extract a `segmentRowVariants` or reuse `toolbarRootVariants` sans paint. Minor.
- Why safe: Same layout primitive. Not a correctness issue, just duplication.

### F10: `ToolbarSeparator` CVA `horizontal`/`vertical` swapped — High (bug)
- File: `Toolbar/Toolbar.tsx:106-119`
- Pattern: primitive-has-it (misused)
- Current:
  ```tsx
  horizontal: 'w-px mx-0.5 self-stretch',   // vertical line in a horizontal toolbar
  vertical:   'h-px mx-1',                  // horizontal line in a vertical toolbar
  ```
  The variant keys name the **toolbar's** orientation, but values describe the **separator's** geometry. Readable but misleading — and `self-stretch` is already on the base (`'bg-line self-stretch'` line 107), so the horizontal override re-declares it while the vertical variant silently lacks it, producing a zero-height line in vertical toolbars.
- Proposal: Rename variant to `toolbarOrientation` and, for vertical: `'h-px w-full mx-0 my-1'`. Drop redundant `self-stretch` from horizontal.
- Why safe: Current vertical path is broken (no stretch, no width). Fix restores working separator; horizontal unchanged.

### F11: Shared `<SegmentGroup>` primitive opportunity — Med
- Files: `Tabs/Tabs.tsx:103-116` (tabsList capsule) + `Toolbar/Toolbar.tsx:65-83` (toolbarRoot)
- Pattern: duplicate-layout
- Current: Both render `pixel-rounded-* bg-card|bg-page inline-flex items-center gap-{0.5|1} p-{0.5|1}` — a segmented-control container. Tabs.List (capsule), Toolbar.Root, ToolbarGroup (minus paint) are three instances.
- Proposal: Extract `components/core/SegmentGroup/SegmentGroup.tsx` with `{ orientation, density, surface: 'card'|'page', corner: 'xs'|'sm' }`. Tabs.List capsule, Toolbar.Root, and ToolbarGroup all compose it. Also lets Accordion header use the same bar when it lands.
- Why safe: Purely compositional — each consumer keeps its own primitive (BaseTabs.List / BaseToolbar.Root) rendered via `render` prop or `asChild`.

### F12: `tabsContentVariants` top/bottom branches are empty — Low
- File: `Tabs/Tabs.tsx:140-149`
- Pattern: pass-through
- Current: `position.top: ''`, `position.bottom: ''`, only `left` carries classes.
- Proposal: Replace CVA with `position === 'left' ? 'flex-1 min-w-0 h-full overflow-auto' : ''` — drop CVA dependency for this sibling.
- Why safe: Two of three variants are empty strings; CVA overhead > benefit.

---

## Summary

**12 findings across Tabs + Toolbar.**

High-severity (3): F4 (always-wraps-button div in Tabs.Trigger), F8 (`inline-block` + `inline-flex` collision in 3 Toolbar sub-components), F10 (ToolbarSeparator vertical variant is broken — missing width/stretch).

Med (5): F1, F2, F3, F6, F11 — mostly collapsible wrappers + a shared `SegmentGroup` primitive opportunity that unifies Tabs.List-capsule, Toolbar.Root, and ToolbarGroup layout.

Low (4): F5, F7, F9, F12 — CVA simplifications and duplicated-variant cleanup.

**Biggest single win:** Extracting `<SegmentGroup>` (F11) eliminates F1, F2 (partial), F6, F8 (partial), and F9 in one move. Pairs naturally with the future Accordion.

**Biggest correctness fix:** F10 — vertical toolbar separators currently render 0-width; low-risk CSS fix.

Report path: `/Users/rivermassey/Desktop/dev/DNA-logo-maker/ops/cleanup-audit/css-overscope/03-tabs-toolbar.md`
