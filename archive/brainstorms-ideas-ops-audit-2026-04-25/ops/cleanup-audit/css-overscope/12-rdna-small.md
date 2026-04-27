# RDNA Small-Primitives CSS Over-scope Audit

Scope: `packages/radiants/components/core/*` (excluding AppWindow, Dialog, AlertDialog, Sheet, Drawer, Tabs, Toolbar, Button, Toggle, Slider — owned by other teams).

Pattern legend: `wrapper-collapse`, `duplicate-layout`, `primitive-has-it`, `pass-through`.

---

## High-confidence wrapper collapses

### F1: Popup double-wrapper pattern repeats across every menu/floating primitive — [High]
- Pattern: `wrapper-collapse` + `duplicate-layout`
- Each Base UI `*.Popup` wraps its children in an extra `<div class="pixel-rounded-* bg-* pixel-shadow-raised">` followed by another inner `<div class="py-1 / p-4">` just to provide padding. Both can be collapsed onto the `Popup` itself (Popup already renders one element and accepts className).
- Occurrences:
  - `packages/radiants/components/core/ContextMenu/ContextMenu.tsx:68-77` — two nested divs inside `BaseContextMenu.Popup`
  - `packages/radiants/components/core/DropdownMenu/DropdownMenu.tsx:120-133` — `<BaseMenu.Popup><div pixel-rounded-sm bg-page pixel-shadow-raised><div py-1>...</div></div></BaseMenu.Popup>`
  - `packages/radiants/components/core/Menubar/Menubar.tsx:131-145` — identical pattern
  - `packages/radiants/components/core/Combobox/Combobox.tsx:185-201` — popup chrome div + list
  - `packages/radiants/components/core/NavigationMenu/NavigationMenu.tsx:228-240` — popup chrome div around `Viewport`
  - `packages/radiants/components/core/Select/Select.tsx:194-206` — popup chrome div + `py-1`
  - `packages/radiants/components/core/Popover/Popover.tsx:101-115` — Popup + chrome div + p-4
  - `packages/radiants/components/core/PreviewCard/PreviewCard.tsx:98-113` — Popup + chrome div + p-4
- Proposal: merge the pixel chrome classes into the `Popup`'s className, and either drop the inner padding wrapper (let consumers pad via `className`) or move the padding onto the list element (`BaseMenu.Item` vertical padding already handles menu row height). Net: removes one div per popup × 8 popups.
- Why safe: `BasePopup` renders a single focusable element with no inherent styling; the chrome divs add no ARIA or behavior.

### F2: ScrollArea is a two-div pass-through of native overflow — [High]
- File: `packages/radiants/components/core/ScrollArea/ScrollArea.tsx:20-50`
- Pattern: `wrapper-collapse` / `pass-through`
- `Root` is `<div class="relative overflow-*">`, `Viewport` is `<div class="h-full">`. There is no virtualization, no custom scrollbar, no sticky indicator. Consumers already use Tailwind overflow classes directly elsewhere.
- Proposal: either delete the primitive (no behavior added) or collapse to a single `<div>` and drop `Viewport`. The `Viewport` sub-component is a pure pass-through adding only `h-full`.
- Why safe: does not wrap `@base-ui/react/scroll-area` nor provide a scrollbar track — nothing would be lost.

### F3: Breadcrumb separator uses `<span>` instead of a `::before` — [Med]
- File: `packages/radiants/components/core/Breadcrumbs/Breadcrumbs.tsx:52-59`
- Pattern: `duplicate-layout`
- Each non-first `<li>` renders a separate `<span aria-hidden>/` sibling, doubling the DOM nodes in the `<ol>`.
- Proposal: render separator via `li:not(:first-child)::before { content: var(--sep); }` on the `<ol>` (token-set via `style={{ '--sep': separator }}`). Cuts `<ol>` node count in half.
- Why safe: separator is decorative (`aria-hidden`) and purely visual; no focus target.

### F4: Separator "decorated" variant renders a custom layout instead of pseudo-elements — [Med]
- File: `packages/radiants/components/core/Separator/Separator.tsx:65-78`
- Pattern: `duplicate-layout`
- Three divs (`<div flex-1 border-t /><div diamond /><div flex-1 border-t />`) forked from the Base UI separator. The other variants correctly delegate to `BaseSeparator`.
- Proposal: render `<BaseSeparator />` with a `::before/::after` on a single element for the flanking rules and the diamond, or keep the divs but drop the outer flex wrapper and use grid on the separator itself. At minimum, `<div role="separator">` should be `<BaseSeparator render={...}/>` to preserve the primitive's semantics parity with the other variants.
- Why safe: decorative ornament is purely visual; Base UI already handles `role`/`aria-orientation`.

### F5: Alert.Icon always wraps a non-null icon in an extra flex-shrink div — [Med]
- File: `packages/radiants/components/core/Alert/Alert.tsx:75-83`, used at `147` via `Toast.tsx:246`
- Pattern: `wrapper-collapse`
- `<div class="flex-shrink-0">{children ?? <DefaultIcon />}</div>`. The parent `Root` already has `flex items-start gap-3`; applying `flex-shrink-0` directly to the icon element (or via a utility class on the default icon slot) removes the wrapping div.
- Proposal: return `children ?? <DefaultIcon className="shrink-0" size={16} />` directly, forwarding consumer className onto the icon. For the custom-children path, document that consumers apply `shrink-0`.
- Why safe: no focus/interaction target; purely a flex layout hint.

### F6: DropdownMenu root has a needless positioning wrapper — [Med]
- File: `packages/radiants/components/core/DropdownMenu/DropdownMenu.tsx:52-63`
- Pattern: `wrapper-collapse`
- `<BaseMenu.Root><div className="relative inline-block">{children}</div></BaseMenu.Root>`. The portal-positioned popup doesn't need a positioning context on the trigger side; the context is only needed if the popup were non-portaled. `BaseMenu.Root` itself is a headless context provider and renders nothing — the extra div is purely structural.
- Proposal: drop the `<div className="relative inline-block">` entirely. Let the trigger render as a child of whatever flow layout the caller uses.
- Why safe: the portaled `BaseMenu.Positioner` anchors to the trigger element, not to this wrapper. Consumers already control trigger layout via `asChild`.

### F7: Menubar `Menu` is a pure pass-through of `BaseMenu.Root` — [High]
- File: `packages/radiants/components/core/Menubar/Menubar.tsx:94-100`
- Pattern: `pass-through`
- `function Menu({ children }) { return <BaseMenu.Root>{children}</BaseMenu.Root>; }` — no props, no className, no rendering.
- Proposal: `export const Menu = BaseMenu.Root;` (or alias). Same for `Combobox.Group`/`Combobox.Portal`/`Combobox.Status` pass-throughs below.
- Why safe: identical surface area; direct alias is the canonical shim.

### F8: Combobox pass-through sub-components — [High]
- File: `packages/radiants/components/core/Combobox/Combobox.tsx:172-178` (`Portal`), `267-273` (`Group`), `302-308` (`Status`)
- Pattern: `pass-through`
- All three simply forward children/className to the Base UI equivalent with no added styling.
- Proposal: `export const Portal = BaseCombobox.Portal; export const Group = BaseCombobox.Group; export const Status = BaseCombobox.Status;`
- Why safe: no added styles or ARIA; identical contracts.

### F9: Tooltip trigger always wraps non-elements in `<span>` — [Med]
- File: `packages/radiants/components/core/Tooltip/Tooltip.tsx:71-78`
- Pattern: `wrapper-collapse`
- If `children` is a string or fragment, it is wrapped in `<span>{children}</span>`. Good for strings, but any valid React element gets passed through `render`. Because Base UI composes `render` with the trigger element, the `<span>` fallback is only needed for string children.
- Proposal: keep wrapper only for `!isValidElement(children)`. Already done — but the audit note: add a `display: inline-block` or matching `data-rdna="tooltip-trigger"` to that span so it is not purely an invisible anonymous node, or skip the wrapper entirely and let Base UI warn. Minimal finding; low priority.
- Why safe: current behavior is already correct, just unclear.

### F10: PreviewCardTrigger duplicates Popover/Dropdown trigger wrappers — [Low]
- File: `packages/radiants/components/core/PreviewCard/PreviewCard.tsx:62-68` vs `Popover.tsx:59-76`, `DropdownMenu.tsx:79-96`
- Pattern: `duplicate-layout`
- All three primitives re-implement the same `<*Trigger className="cursor-pointer focus-visible:outline-none" render={children} />` pattern, sometimes with `asChild`, sometimes not.
- Proposal: factor to a shared `createTrigger(BaseComponent)` helper in `components/shared/`, or at minimum unify prop shape (`asChild` everywhere).
- Why safe: behavioral consolidation, no functional change.

---

## Medium / Low findings (grouped)

### F11: Label + control wrappers that repeat the same `<label class="inline-flex items-center gap-2 ...">` — [Med]
- Pattern: `duplicate-layout`
- Files:
  - `Checkbox/Checkbox.tsx:116-124` (root `<label>`)
  - `Checkbox/Checkbox.tsx:264-276` (Radio in-group `<label>`)
  - `Checkbox/Checkbox.tsx:293-316` (Radio standalone `<label>`)
  - `Switch/Switch.tsx:98-105` (label) and `107-109` (`<div inline-flex ...>` wrapper)
- Proposal: extract a shared `<FieldLabelShell disabled={disabled} position="right">` (1 element) that renders the label + slot, replacing the three hand-rolled copies. Switch currently renders `<div><label/><BaseSwitch.Root/></div>` where `<div>` could be the `<label>` itself and avoid needing two wrappers for the `labelPosition` toggle.
- Why safe: native `<label for=id>` wires focus the same way regardless of structural sibling order.

### F12: Card sub-components are padding-only wrappers — [Med]
- File: `packages/radiants/components/core/Card/Card.tsx:93-121`
- Pattern: `wrapper-collapse`
- `CardHeader`, `CardBody`, `CardFooter` exist solely to apply `px-4 py-3 border-b` / `p-4` / `px-4 py-3 border-t`. No ARIA, no context, no slot binding.
- Proposal: collapse to CSS on `[data-slot="card-header"]` etc. so consumers can write `<div data-slot="card-header">…</div>` or drop the sub-components entirely and document the padding conventions. Alternatively, keep as typed API but replace each body with a single `<div>` and move styling to CSS keyed off `data-slot`.
- Why safe: the `data-slot` attribute already exists for styling; sub-components duplicate that intent.

### F13: CountdownTimer inner `Segment` wraps a `<div>` in another `<div>` for `large` variant — [Med]
- File: `packages/radiants/components/core/CountdownTimer/CountdownTimer.tsx:96-114`
- Pattern: `wrapper-collapse`
- For the `large` variant: `<div pixel-rounded-sm inline-block><div min-w-[4rem] bg-depth px-3 py-2>...</div></div>`. The pixel-corner class can be composed onto the inner variant class directly.
- Proposal: append `pixel-rounded-sm inline-block` to the `large` branch of `segmentVariants` and drop the outer `<div>`.
- Why safe: `pixel-rounded-*` is CSS-only (clip-path) and composes fine with flex children.

### F14: Meter triple-nested wrapper — [Med]
- File: `packages/radiants/components/core/Meter/Meter.tsx:100-112`
- Pattern: `wrapper-collapse`
- `<BaseMeter.Root><div w-full class><div pixel-rounded-xs bg-page w-full><BaseMeter.Track>...`. Two of the three wrappers are redundant; className + pixel-corner can land directly on the `Track`.
- Proposal: `<BaseMeter.Root className={cn('pixel-rounded-xs bg-page w-full', className)}>`. Delete both inner `<div>`s.
- Why safe: `BaseMeter.Root` already renders a `<div role="meter">`; it accepts className.

### F15: Input icon wrapper mixes `<div relative><div absolute>` with pixel shell — [Med]
- File: `packages/radiants/components/core/Input/Input.tsx:259-274`
- Pattern: `wrapper-collapse`
- Non-icon branch renders `<div pixel-rounded-xs ...><input/></div>`. Icon branch adds two more wrappers: `<div relative><div absolute left-3>{icon}</div>{wrappedInput}</div>`. Total 3 divs + input.
- Proposal: render `<div class="pixel-rounded-xs relative ..."><div class="absolute ...">{icon}</div><input class="pl-{}"/></div>` — one wrapper total. The pixel shell already supports `relative` positioning for `::after` focus rings.
- Why safe: `pixel-rounded-*` composes with `relative` (see PixelBorder.tsx:485-494 which relies on it).

### F16: Combobox input has an icon-slot wrapper identical to F15 — [Med]
- File: `packages/radiants/components/core/Combobox/Combobox.tsx:127-167`
- Pattern: `wrapper-collapse` / `duplicate-layout`
- `<div class="relative group/pixel">` wraps the input + a `<BaseCombobox.Trigger class="absolute ...">` for the chevron. Same two-wrapper-for-absolute-icon pattern as Input. Plus the chevron is an inline SVG rather than the RDNA icon system used by Collapsible/NavigationMenu (`ChevronDown`).
- Proposal: same collapse as F15; additionally use the RDNA `ChevronDown` icon to unify (consistency finding F20).
- Why safe: same reasoning as F15.

### F17: NumberField Group is a two-class pixel wrapper — [Low]
- File: `packages/radiants/components/core/NumberField/NumberField.tsx:176-182`
- Pattern: `wrapper-collapse`
- `<BaseNumberField.Group class="pixel-rounded-xs flex items-center">`. Good — already uses the Base primitive for classes. Flag only because the same pattern re-implements `border-l` / `border-r` separators on Increment/Decrement (`NumberField.tsx:151-158`, `163-170`) instead of a group CSS rule `> button + button { border-left: 1px solid var(--color-line) }`.
- Proposal: drop per-button border classes; add a single group CSS rule.
- Why safe: border only appears between siblings; the sibling-selector handles it cleanly.

### F18: Collapsible Content wraps panel children in a styled div — [Low]
- File: `packages/radiants/components/core/Collapsible/Collapsible.tsx:116-129`
- Pattern: `wrapper-collapse`
- `<BaseCollapsible.Panel class="overflow-hidden"><div pixel-rounded-xs px-4 py-3 ...>{children}</div></BaseCollapsible.Panel>`. The inner div's styling can be merged onto the `Panel`.
- Proposal: `<BaseCollapsible.Panel className={cn('overflow-hidden pixel-rounded-xs px-4 py-3 font-sans text-main bg-card', className)}>`. Drops one div per collapsible.
- Why safe: Base UI `Panel` is a single element; collapsing height animation uses its own inline style, not overflow of the inner.

### F19: InputSet Root applies outline-on-fieldset directly — [None, good pattern]
- File: `packages/radiants/components/core/InputSet/InputSet.tsx:35-45`
- No finding — good example. Delegates directly to `BaseFieldset.Root` with className, no extra wrapper. Called out as reference for the fixes above.

### F20: Inline SVG chevrons diverge from RDNA icon system — [Med]
- Pattern: `duplicate-layout`
- Files:
  - `NavigationMenu/NavigationMenu.tsx:76-93` — custom `DefaultChevron`
  - `Select/Select.tsx:60-77` — custom `DefaultChevron`
  - `Combobox/Combobox.tsx:150-162` — inline `<polyline>` SVG
  - `DropdownMenu` and `Menubar` have no chevron (fine)
  - `Collapsible/Collapsible.tsx:103` — uses `ChevronDown` from `icons/generated` (correct pattern)
- Proposal: import `ChevronDown` from `icons/generated` in all three and delete local `DefaultChevron`. Matches CLAUDE.md project_icon_source_of_truth rule.
- Why safe: same glyph, already tree-shakeable, canonical source.

### F21: Checkbox/Radio inline `<svg>` pixel-art checkmark — [Low]
- Files:
  - `Checkbox/Checkbox.tsx:77-93` — inline `CheckmarkIcon`
  - `ContextMenu/ContextMenu.tsx:157` and `DropdownMenu/DropdownMenu.tsx:273` — inline `<svg>` for check indicator
- Pattern: `duplicate-layout`
- Same pixel-art check path copied across 3 files.
- Proposal: export a single `<PixelCheckmark size>` from `icons/` and use everywhere.
- Why safe: identical path data; purely visual.

### F22: Radio standalone mode wraps a `BaseRadioGroup` solely to shim `checked`/`onChange` to `RadioGroup`'s `value`/`onValueChange` — [Low]
- File: `packages/radiants/components/core/Checkbox/Checkbox.tsx:278-316`
- Pattern: `duplicate-layout`
- The standalone branch creates a synthetic `<BaseRadioGroup>` with sentinel values `__rdna-radio__` / `__rdna-radio-unchecked__` just to call `onChange` with a synthesized ChangeEvent. 40 LOC of adapter purely to keep a legacy API.
- Proposal: deprecate standalone `<Radio checked onChange>` — require `<RadioGroup>` wrapper. Removes `RadioGroupContext`, the synthetic event path, and both `<label>` copies.
- Why safe: `RadioGroup` is already exported from this file; callers can migrate trivially.

### F23: ToggleGroupItem is a pass-through to `Toggle` with context merge — [Low, keep but flag]
- File: `packages/radiants/components/core/ToggleGroup/ToggleGroup.tsx:94-120`
- Pattern: `pass-through` (borderline)
- `ToggleGroupItem` forwards `tone`/`size`/`rounded` from context into `<Toggle>`. Useful because `Toggle` itself consumes those props, but the context could be read inside `Toggle` directly.
- Proposal: move `ToggleGroupContext` consumption into `Toggle.tsx` so `<Toggle>` read context defaults; then `ToggleGroup.Item = Toggle` alias.
- Why safe: Toggle is owned by another team — flag only.

### F24: Toast `ToastItem` wraps `Alert.Root` which itself wraps two divs — [Low]
- File: `packages/radiants/components/core/Toast/Toast.tsx:235-267` + `Alert/Alert.tsx:131-141`
- Pattern: `duplicate-layout`
- `<BaseToast.Root><Alert.Root><div role="alert" class="pixel-rounded"><div flex items-start gap-3>...</div></div>` — 3 structural elements before content.
- Proposal: `Alert.Root` could apply `flex items-start gap-3` directly to its outer div (no inner `<div class="flex">` wrapper). Cuts one level across every alert and every toast.
- Why safe: role=alert is compatible with any display value; padding + flex compose.

---

## Summary of top wins (by LOC impact)

| # | Primitive | Net div reduction |
|---|-----------|-------------------|
| F1 | 8 popup-style primitives | −2 divs each = −16 |
| F2 | ScrollArea | −1 (or delete file) |
| F3 | Breadcrumbs | −N (per separator) |
| F14 | Meter | −2 |
| F15 | Input | −2 |
| F16 | Combobox input | −2 |
| F18 | Collapsible content | −1 per collapsible |
| F24 | Alert root | −1 |
| F7/F8 | Menubar.Menu + 3 Combobox pass-throughs | 4 component deletions |

**File path:** `/Users/rivermassey/Desktop/dev/DNA-logo-maker/ops/cleanup-audit/css-overscope/12-rdna-small.md`
