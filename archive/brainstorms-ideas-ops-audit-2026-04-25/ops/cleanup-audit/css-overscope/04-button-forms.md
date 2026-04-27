# CSS Over-Scope Audit — Button & Form Primitives

Scope: Button, Toggle, Slider, Input, Select, Checkbox/Radio, Switch, NumberField, InputSet.

---

### F1: Button always wraps children in a `<span data-slot="button-face">` — [High]
- File: `packages/radiants/components/core/Button/Button.tsx:242-257`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <BaseButton className={rootClasses} data-rdna="button" ...>
    <span className={`${pixelClass ...} ${faceClasses}`} data-slot="button-face"
          data-mode={mode} data-color={tone} data-state={dataState} ...>
      {content}
    </span>
  </BaseButton>
  ```
  The root `<button>` carries `data-mode/color/state` and the inner `<span>` re-declares the exact same attributes. The outer element only adds `focus-visible:shadow-focused` and `cursor`; the inner element holds every visual property (pixel-rounded, size, padding, fill). Two nodes, one visual concern.
- Proposal: collapse the face into the root. Apply `pixelClass + faceClasses` directly to `BaseButton`/`<a>`; drop the `<span data-slot="button-face">`. The only thing the span currently buys is "lift on hover" via `group-*` selectors — that can live on `::before`/`::after` of the root, or on the root itself with `data-state` driving the transform.
- Why safe: all data attributes are duplicated on root already; no child of Button targets `[data-slot="button-face"]` as a container (it's styled, not queried).

### F2: Button leader-line `<span>` is a layout artefact, not a semantic unit — [Med]
- File: `packages/radiants/components/core/Button/Button.tsx:232-240`
- Pattern: primitive-has-it
- Current:
  ```tsx
  content = (
    <>
      {children}
      {children && <span className="flex-1 h-px bg-line opacity-30" />}
      {resolvedIcon}
    </>
  );
  ```
- Proposal: replace with a `::after` on the label span (or a flex `gap` + `border-b` on a pseudo) keyed off `data-icon-only="false"` and icon presence. At minimum, label + icon can be two siblings and the line lives on the label's `::after`.
- Why safe: the span has no interactive behaviour, no data-slot, no queries. Purely decorative.

### F3: Select trigger replicates the same leader-line `<span>` — [Med]
- File: `packages/radiants/components/core/Select/Select.tsx:181-184`
- Pattern: duplicate-layout (with F2)
- Current:
  ```tsx
  <BaseSelect.Value ... />
  <span className="flex-1 h-px bg-line opacity-30" />
  <span className={`shrink-0 ... ${isOpen ? 'rotate-180' : ''}`}>
    {chevron || <DefaultChevron size={chevronSize} />}
  </span>
  ```
- Proposal: the chevron wrapper span is pass-through (only adds `shrink-0` + rotate). Put `data-open` on the chevron SVG itself and key `rotate-180` off it, drop the wrapper. The leader-line should become a shared pattern with F2 (single utility/pseudo), not inlined in two primitives.
- Why safe: chevron is a leaf SVG; rotation can apply directly.

### F4: Input always wraps control in a `<div className="pixel-rounded-xs ...">` — [High]
- File: `packages/radiants/components/core/Input/Input.tsx:259-263, 309-313`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  const wrappedInput = (
    <div className={`pixel-rounded-xs ${INPUT_BACKGROUND} ${fullWidth ? 'w-full' : ''} ${INPUT_DISABLED_WRAPPER} ${showStandaloneError ? 'pixel-border-danger' : ''}`}>
      {inputWithRef}
    </div>
  );
  ```
  The wrapper exists solely to carry `pixel-rounded-xs` + bg + disabled state. The `<input>` itself could host those classes.
- Proposal: move `pixel-rounded-xs`, `bg-page focus-within:bg-card`, `pixel-border-danger`, and `disabled:*` onto the `<input>` directly in the no-icon branch (and the `<textarea>` in TextArea). Keep the wrapper only when an icon is present (icon needs an absolute-positioned sibling).
- Why safe: `has-[:disabled]` on the wrapper becomes `disabled:*` on the input — simpler and standard Tailwind. Pixel-rounded is a CSS class, not tied to element type. Eliminates a DOM node for ~95% of inputs (no icon).

### F5: Input icon branch adds a second positioning wrapper — [Med]
- File: `packages/radiants/components/core/Input/Input.tsx:265-274`
- Pattern: wrapper-collapse
- Current: outer `<div className="relative">` → inner `pixel-rounded-xs` wrapper → input. Two divs for "icon + input".
- Proposal: single `<div className="relative pixel-rounded-xs bg-page ...">` containing absolute icon + input. Merge the two wrappers — `position: relative` and `pixel-rounded-xs` coexist fine on one element.
- Why safe: no `overflow-hidden` on pixel-rounded (would break clip-path anyway), icon is `absolute`, input is static — single wrapper establishes the containing block and the corner shape.

### F6: Switch thumb has a redundant `<div>` around the Base thumb `<span>` — [High]
- File: `packages/radiants/components/core/Switch/Switch.tsx:125-132`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <BaseSwitch.Thumb
    render={(props) => (
      <div className={`pixel-rounded-xs ${thumbClasses}`}>
        <span {...props} className="absolute inset-0 switch-thumb" />
      </div>
    )}
  />
  ```
  The outer `<div>` holds `pixel-rounded-xs` + size + transforms; the inner `<span>` is `absolute inset-0`. Two nodes for one thumb.
- Proposal: spread `props` onto the sized/rounded element directly: `<span {...props} className="pixel-rounded-xs switch-thumb ${thumbClasses}" />`. Drop the div entirely.
- Why safe: `switch-thumb` styles apply to whichever element carries the class; `pixel-rounded-xs` works on any block-ish element; Base UI just needs its props on the DOM node it controls focus/state for.

### F7: Slider thumb wraps the Base thumb node in an extra `<div>` — [High]
- File: `packages/radiants/components/core/Slider/Slider.tsx:163-184`
- Pattern: wrapper-collapse (mirrors F6)
- Current:
  ```tsx
  <BaseSlider.Thumb render={(thumbProps) => {
    const { style, className: _cn, ...rest } = thumbProps;
    return (
      <div className={`pixel-rounded-xs group/pixel bg-page hover:bg-accent ...`} style={style}>
        <div {...rest} data-slot="slider-thumb" className="block w-full h-full border-none outline-none switch-thumb focus-visible:..." />
      </div>
    );
  }} />
  ```
  The `_cn` from Base is explicitly dropped, and the two divs split "box shape/color" (outer) from "interaction surface" (inner). There's no visual reason for two nodes.
- Proposal: single `<div {...rest} className="pixel-rounded-xs bg-page hover:bg-accent switch-thumb ${thumb} ..." style={style} />`. One node owns size + shape + fill + focus + Base UI props.
- Why safe: `group/pixel` doesn't appear to be targeted elsewhere in this file; the inner `w-full h-full` is only needed because of the wrapper. Confirm with grep for `group/pixel` before collapsing.

### F8: Slider has a `<div className="pixel-rounded-xs bg-cream">` outside `BaseSlider.Track` — [Med]
- File: `packages/radiants/components/core/Slider/Slider.tsx:142-146`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div className={`pixel-rounded-xs bg-cream ${vertical ? 'h-full' : 'w-full'}`}>
    <BaseSlider.Track className={trackClasses} data-slot="slider-track">
  ```
  The wrapper provides pixel corners + cream fill; `BaseSlider.Track` renders its own element right inside it.
- Proposal: apply `pixel-rounded-xs bg-cream` to `BaseSlider.Track` directly (merge into `trackClasses`). One node instead of two.
- Why safe: the comment at L98-100 already notes the track bg lives on a mask-image layer — the wrapper duplicates that intent. Merge collapses them.

### F9: Slider root has a `min-w-[8rem]` + `space-y-2` wrapper used only for label layout — [Low]
- File: `packages/radiants/components/core/Slider/Slider.tsx:108-117`
- Pattern: pass-through
- Current: outer `<div data-rdna="slider">` exists even when `label`/`showValue` are both unset. When no label, the outer `<div>` plus `BaseSlider.Root` is 2 nodes where 1 suffices.
- Proposal: when `!label && !showValue`, render `BaseSlider.Root` at the top level with `data-rdna="slider"` attached. Only introduce the wrapper div when a header row actually renders.
- Why safe: `data-rdna="slider"` is an identifier marker — works on any element. Avoids a wrapper for the common "slider without label" case (e.g. Radio effects rows).

### F10: Toggle root `<button>` + inner `<span data-slot="toggle-face">` duplicate Button's pattern — [High]
- File: `packages/radiants/components/core/Toggle/Toggle.tsx:142-160`
- Pattern: wrapper-collapse (identical shape to F1)
- Current: `<button>` carries `data-rdna="toggle"`, `data-slot="toggle-root"`, `data-state`, `data-color`; inner `<span data-slot="toggle-face">` re-declares `data-state`, `data-color`, `data-size`. Outer only adds focus ring + disabled cursor.
- Proposal: collapse face into the root button. Apply `pixelClass + faceClasses` directly to the `<button>`; drop the `<span>`. Same fix as F1.
- Why safe: no descendant selectors target `[data-slot="toggle-face"]` as an interior container; it's only styled via its CVA classes which apply equally to the root.

### F11: NumberField `Group` wrapper is a no-behaviour wrapper — [Low]
- File: `packages/radiants/components/core/NumberField/NumberField.tsx:176-182`
- Pattern: primitive-has-it
- Current: `<BaseNumberField.Group className="pixel-rounded-xs flex items-center ...">` — Base UI's Group is a semantic grouping container; consumers must always pair it with Root + Input + Increment + Decrement.
- Proposal: if every consumer uses the same Group wrapper, hoist `pixel-rounded-xs flex items-center` into Root (make Root render Group implicitly) and let sub-components be direct children. One less required compound node.
- Why safe: NumberField is a compound; removing a required layer simplifies usage without losing the Base UI accessibility hookup (Group's role is visual, not ARIA).

### F12: Checkbox/Radio wrap the control in a `<label>` that also duplicates `cursor-pointer` / `disabled` styling already on the control — [Med]
- File: `packages/radiants/components/core/Checkbox/Checkbox.tsx:116-124, 265-275, 293-316`
- Pattern: duplicate-layout
- Current: the `<label>` gets `cursor-pointer` + `opacity-50 cursor-not-allowed`, and the inner pixel-rounded `<span>` also gets `cursor-pointer` + `outline-none focus-visible:shadow-focused`. Three sites (Checkbox, Radio-in-group, Radio-standalone) repeat nearly identical `<label className="inline-flex items-center gap-2 ...">`.
- Proposal: extract a shared `<ControlLabel>` primitive (or reuse a single helper) — the repetition across Checkbox, Radio, Switch (L98-105) is a smell. A single `FormControlLabel` handles `htmlFor`, disabled styling, and label-side (`left`/`right` like Switch). Also cut `cursor-pointer` from the inner control — the parent label already owns click behaviour.
- Why safe: removes 3 copies of the same `<label>` shape; the label's `htmlFor` / implicit association keeps a11y intact. Shared primitive aligns Switch's `labelPosition` API across all binary controls.

### F13: Radio-standalone renders its own `<BaseRadioGroup>` inside a `<label>` just to expose a `checked` API — [Low]
- File: `packages/radiants/components/core/Checkbox/Checkbox.tsx:278-316`
- Pattern: wrapper-collapse
- Current: a 38-line branch exists solely so a standalone `<Radio checked onChange />` works outside a group. Adds an extra BaseRadioGroup node per standalone radio.
- Proposal: drop standalone `checked`/`onChange` support (document "Radio must be inside a RadioGroup"), or back it with a single-item internal hook rather than a DOM `<BaseRadioGroup>`. Either removes the wrapper-in-wrapper shape.
- Why safe: the in-group branch (L263-276) is already the primary use case; standalone radio outside a group is rare and can be replaced by a Checkbox styled as a radio or by `RadioGroup` of length 1.

### F14: Shared "field wrapper" pattern is inlined across primitives — [Med]
- Files:
  - `Input/Input.tsx:260` `pixel-rounded-xs bg-page ... pixel-border-danger`
  - `Input/Input.tsx:310` (TextArea — identical)
  - `Select/Select.tsx:160` `pixel-rounded-xs ... pixel-border-danger`
  - `NumberField/NumberField.tsx:178` `pixel-rounded-xs flex items-center` (Group)
- Pattern: duplicate-layout across primitives
- Current: each form control redeclares the same "pixel-rounded container + `bg-page` + `pixel-border-danger` on error" treatment inline.
- Proposal: introduce a shared `FormFieldShell` (or CVA `fieldShellVariants`) that owns pixel corners, background, error border, and disabled opacity. Input, Select, NumberField, and TextArea wrap their control in it. Reduces drift between controls and gives a single knob for form-control styling.
- Why safe: the treatment is already identical in intent; extracting doesn't change rendering, only centralises the class set. Aligns with the F4 collapse (once Input drops its own wrapper for non-icon case, the shared shell becomes the only wrapper when needed).

---

## Summary

Audit of 9 primitives (Button, Toggle, Slider, Input, Select, Checkbox/Radio, Switch, NumberField, InputSet) — 14 findings.

Highest-impact collapses:
- **F1/F10** — Button and Toggle both render an outer `<BaseButton|button>` + inner `<span data-slot="*-face">` where the outer only carries focus/cursor and the inner owns all visuals. Both data-attribute sets are duplicated across the two nodes. Single-node render would halve DOM for every button/toggle in the app.
- **F6/F7** — Switch thumb and Slider thumb each wrap the Base UI render node in a second `<div>` purely to split "shape/color" from "Base UI props". No reason; merge to one node.
- **F4** — Input wraps every `<input>`/`<textarea>` in a `<div className="pixel-rounded-xs bg-page ...">` even when there's no icon. The pixel-rounded class and background can live on the input directly in the common case.

Cross-primitive patterns:
- **F14** — `pixel-rounded-xs bg-page ... pixel-border-danger` shell is inlined in Input, TextArea, Select trigger, and NumberField Group. Strong candidate for a shared `FormFieldShell` / `fieldShellVariants`.
- **F12** — Checkbox, Radio (×2 branches), and Switch each roll their own `<label className="inline-flex items-center gap-2 ...">` with duplicated disabled styling. Shared `ControlLabel` would unify labelPosition handling and cut 3 copies.
- **F2/F3** — Button and Select both inline the same `<span className="flex-1 h-px bg-line opacity-30" />` leader line; promote to a pseudo-element or a tiny `<LeaderLine>` utility.

Lower priority: F5 (Input icon double-wrapper), F8 (Slider track double-wrapper), F9 (Slider root wrapper for absent label row), F11 (NumberField Group could fold into Root), F13 (Radio standalone branch extra group).

Report file: `/Users/rivermassey/Desktop/dev/DNA-logo-maker/ops/cleanup-audit/css-overscope/04-button-forms.md`
