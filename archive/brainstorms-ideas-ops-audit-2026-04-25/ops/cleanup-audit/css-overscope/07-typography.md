# Typography Playground — CSS Over-Scope Audit

Scope: `apps/rad-os/components/apps/typography-playground/**/*.tsx`
Files audited: TypeStyles.tsx, TemplatePreview.tsx, UsageGuide.tsx,
TypeManual.tsx, TypographyPlayground.tsx, layouts/SpecimenLayout.tsx,
layouts/EditorialLayout.tsx, layouts/BroadsheetLayout.tsx,
layouts/MagazineLayout.tsx.

---

### F1: CodeBlock double wrapper with empty inner div — High
- File: apps/rad-os/components/apps/typography-playground/TypeStyles.tsx:360-407
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div className="pixel-rounded-sm">
    <div>
      {/* Header */}
      <div className="bg-inv px-4 py-3 flex ...">...</div>
      {/* Code area */}
      <div className="bg-depth overflow-x-auto">...</div>
    </div>
  </div>
  ```
- Proposal: Drop the inner unstyled `<div>`. The children can sit directly inside the `pixel-rounded-sm` root.
- Why safe: Inner div has no classes, no ref, no layout role — pure pass-through.

---

### F2: FontCard same empty inner div — High
- File: apps/rad-os/components/apps/typography-playground/TypeManual.tsx:62-149
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div className="pixel-rounded-sm">
    <div>
      <div className="bg-inv px-4 py-3 ...">...</div>
      <div className="px-4 py-4 ...">...</div>
      ...
    </div>
  </div>
  ```
- Proposal: Remove unclassed wrapper `<div>`. Children (header/specimen/weights/refs/download) flow directly under the pixel-rounded root.
- Why safe: Inner div carries no styles, no ref. Siblings already define their own padding.

---

### F3: Element Styles table double wrapper — High
- File: apps/rad-os/components/apps/typography-playground/TypeManual.tsx:192-220
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div className="pixel-rounded-sm">
    <div>
      <div className="flex items-center gap-3 px-4 py-2 bg-inv">...</div>
      <div className="divide-y divide-rule">...</div>
    </div>
  </div>
  ```
- Proposal: Delete inner unclassed `<div>`. Header + rows become direct children of `pixel-rounded-sm`.
- Why safe: Identical to F1/F2 — pass-through wrapper.

---

### F4: RuleCard `flex flex-col` is redundant — Med
- File: apps/rad-os/components/apps/typography-playground/UsageGuide.tsx:37-71
- Pattern: primitive-has-it
- Current:
  ```tsx
  <div className="pixel-rounded-sm" style={{ '--color-line': borderOverride }}>
    <div className="flex flex-col">
      <div className="px-4 py-5 bg-depth ...">...</div>
      <div className="px-3 py-2.5 space-y-1 border-t ...">...</div>
    </div>
  </div>
  ```
- Proposal: Remove the `<div className="flex flex-col">` wrapper — block children already stack vertically by default; there is no `gap-*` in use.
- Why safe: `flex-col` with no gap produces the same visual result as block flow for two full-width children.

---

### F5: RuleCard indicator has conflicting `inline-block` + `block` — Med
- File: apps/rad-os/components/apps/typography-playground/UsageGuide.tsx:52-58
- Pattern: duplicate-layout
- Current:
  ```tsx
  <span className={`pixel-rounded-sm inline-block shrink-0 block font-joystix ...`}>
  ```
- Proposal: Drop the duplicate `block` (the later class wins in Tailwind, which silently overrides `inline-block`). Keep only `inline-block shrink-0`.
- Why safe: The `inline-block` intent matches the surrounding `flex items-center gap-2` row; `block` was unintentional.

---

### F6: Quick Reference label duplicated `inline-block` + `block` — Med
- File: apps/rad-os/components/apps/typography-playground/TypeManual.tsx:254
- Pattern: duplicate-layout
- Current:
  ```tsx
  <span className="pixel-rounded-sm inline-block mr-1 align-middle block font-heading ...">
    Clamp
  </span>
  ```
- Proposal: Remove trailing `block`. Keep `inline-block align-middle`.
- Why safe: Same override bug as F5; the span is explicitly inline among adjacent text.

---

### F7: Per-specimen font/alphabet rows duplicated across 4 files — High
- Files:
  - apps/rad-os/components/apps/typography-playground/TypeManual.tsx:80-93
  - apps/rad-os/components/apps/typography-playground/layouts/SpecimenLayout.tsx:85-109
  - apps/rad-os/components/apps/typography-playground/layouts/BroadsheetLayout.tsx:134-145
  - (implicit in EditorialLayout role blocks)
- Pattern: duplicate-layout
- Current: Each file hand-authors `<div className={`${font.className} text-sm text-sub leading-relaxed break-all tracking-wide`}>{UPPER}</div>` three to four times (UPPER, LOWER, DIGITS, PUNCTUATION).
- Proposal: Extract a `<AlphabetRows font={font} />` primitive that renders the uppercase/lowercase/digits/punct specimen block. Accept an optional size override.
- Why safe: The rows are structurally identical across files; divergence today is copy-paste drift (BroadsheetLayout omits punctuation tracking, SpecimenLayout includes punctuation, TypeManual omits it). A shared primitive removes that drift without changing visuals.

---

### F8: FontCard weight rows + FontSpecimen weight rows duplicate layout — Med
- Files:
  - apps/rad-os/components/apps/typography-playground/TypeManual.tsx:96-123
  - apps/rad-os/components/apps/typography-playground/layouts/SpecimenLayout.tsx:130-157
  - apps/rad-os/components/apps/typography-playground/layouts/BroadsheetLayout.tsx:148-172
  - apps/rad-os/components/apps/typography-playground/layouts/MagazineLayout.tsx:119-147
- Pattern: duplicate-layout
- Current: Four nearly-identical `{font.weights.map(...)}` + italic-flag renderers, each building `<div className="flex items-baseline justify-between">`.
- Proposal: Single `<WeightParade font={font} size="sm|base|lg" align="left|right" tone="default|inverted" />` primitive.
- Why safe: All four sites render the same data with only tone/size differences. Props cover the variance.

---

### F9: TemplatePreview templates repeat root `bg-inv text-flip p-[8%]` — Med
- File: apps/rad-os/components/apps/typography-playground/TemplatePreview.tsx:86-143, 146-161, 163-186
- Pattern: duplicate-layout
- Current: `Document`, `Dictionary`, `Quote`, `Poster` each start with `<div className="relative w-full h-full bg-inv text-flip p-[8%] ...">`.
- Proposal: Extract a `TemplateFrame` component accepting `tone="accent"|"inverted"` + optional `padding` that emits the shared `relative w-full h-full ...` scaffold.
- Why safe: Only `Display` uses `bg-accent text-main`; everything else uses `bg-inv text-flip`. The `p-[8%]` is identical where present. Poster explicitly opts out of padding.

---

### F10: Body paragraphs restate element defaults already in typography.css — High
- File: apps/rad-os/components/apps/typography-playground/layouts/EditorialLayout.tsx:147-149, 154-156, 159-161, 178-180, 191-193
- Pattern: primitive-has-it
- Current:
  ```tsx
  <p className="font-sans text-base text-main leading-relaxed">
    {MANIFESTO_BODY_1.slice(1)}
  </p>
  ```
- Proposal: Drop `font-sans text-base text-main` — the base layer (typography.css:97) already applies `text-base font-sans font-normal leading-snug tracking-tight text-main` to every `<p>`. Keep only the overrides that actually diverge (`leading-relaxed` is the only real override).
- Why safe: The classes are tautological with the base layer. `leading-relaxed` alone is the meaningful delta.

---

### F11: EditorialLayout `FontRole` unnecessary component wrapper — Low
- File: apps/rad-os/components/apps/typography-playground/layouts/EditorialLayout.tsx:90-96
- Pattern: wrapper-collapse
- Current:
  ```tsx
  function FontRole({ font, role }: { font: string; role: string }) {
    return (
      <span className="font-mono text-xs text-mute/60 block mt-1">
        {font} — {role}
      </span>
    );
  }
  ```
- Proposal: Fine as-is if reused; however `block` on a `<span>` is the same footgun as F5/F6 — prefer `<p>` or `<div>`, which are natively block and carry semantic intent. `mt-1` already gets dropped by surrounding `space-y-*` in some siblings.
- Why safe: Changing span→p preserves all typography (typography.css `<p>` base already matches the intended role), and it eliminates the `block` override.

---

### F12: MagazineLayout "moment" cards repeat `border border-rule p-6 space-y-*` — Med
- File: apps/rad-os/components/apps/typography-playground/layouts/MagazineLayout.tsx:177-185, 193-207, 215-227
- Pattern: duplicate-layout
- Current: Three successive blocks each structured as `<span accent label /><div className="border border-rule p-6 space-y-X">...</div>`.
- Proposal: Extract `<MomentCard label="Joystix — Display">...</MomentCard>` primitive owning the label + border card. Callers supply only the content.
- Why safe: The three sections are parallel by design (the comments even say "-- Display", "-- Editorial", "-- Technical"). They differ only in `space-y-3`/`space-y-4` and body.

---

### F13: BroadsheetLayout Masthead outer flex rows could be one grid — Low
- File: apps/rad-os/components/apps/typography-playground/layouts/BroadsheetLayout.tsx:44-68
- Pattern: duplicate-layout
- Current: Two sibling `<div className="flex items-center justify-between px-1 [pt-1]">` rows (volume/edition, dateline/date) sandwich a nameplate. `px-1` is repeated.
- Proposal: Either hoist `px-1` to a shared wrapper or collapse the two rows into a single `grid-cols-2` block per row. Minor.
- Why safe: Purely cosmetic refactor; no behavior change.

---

### F14: SpecimenLayout FontSpecimen header has empty-class container — Low
- File: apps/rad-os/components/apps/typography-playground/layouts/SpecimenLayout.tsx:54-69
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div className="flex items-start justify-between gap-4 mb-4">
    <div>
      <div className="flex items-baseline gap-2">...</div>
      {rationale && <span className="...">{...}</span>}
    </div>
    <div className="text-right shrink-0">...</div>
  </div>
  ```
- Proposal: Keep the left `<div>` because it groups two stacked children, but the inner `<div className="flex items-baseline gap-2">` can be collapsed if `rationale` is rendered as a sibling `<span>` already. Mostly leave; note for future inline.
- Why safe: Tiny; only worth doing if touched.

---

### F15: TypographyPlayground legacy dispatch of removed `manual` tab — Low
- File: apps/rad-os/components/apps/typography-playground/TypographyPlayground.tsx:7, 23
- Pattern: pass-through
- Current: `type SubTab = 'manual' | 'editorial' | 'usage'` but there is no `'manual'` branch — the default `return <SpecimenLayout />` covers it. `TypeManual.tsx` is still in the tree but only the default (`'manual'`) branch maps to it, and that branch renders `SpecimenLayout` instead.
- Proposal: Either wire `'manual'` → `<TypeManual />` (intentional) or drop `TypeManual.tsx` from the file list. Today it appears dead.
- Why safe: Removes an entire 285-LOC file or restores its entry; either is a simplification, neither is user-visible today.

---

## Summary

High-impact collapses: **F1, F2, F3, F7, F10** — mechanical removal of
empty wrappers (`<div className="pixel-rounded-sm"><div>...`) across
`CodeBlock`, `FontCard`, element-styles table, and removal of redundant
base-layer classes on `<p>` in `EditorialLayout`. Net LOC savings ~30 +
reduced risk of diverging specimen rows.

Med-impact: **F4, F5, F6, F8, F9, F12** — collapse `flex flex-col`
without gap, fix `inline-block ... block` override bugs, and extract
three reusable primitives (`AlphabetRows`, `WeightParade`,
`TemplateFrame`/`MomentCard`) that are currently hand-rolled 3–4 times.

Low: **F11, F13, F14, F15** — semantic span→p swap, minor masthead
tidy, and a dead-branch `'manual'` subtab in the dispatcher that
renders `SpecimenLayout` instead of the 285-LOC `TypeManual.tsx` —
flag for either re-wire or deletion.

Audit output: `/Users/rivermassey/Desktop/dev/DNA-logo-maker/ops/cleanup-audit/css-overscope/07-typography.md`
