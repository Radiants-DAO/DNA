## Session Status — 2026-04-10 (Ctrl NumberInput + IconRadioGroup + Tooltip)

**Plan:** `~/.claude/plans/melodic-wiggling-dongarra.md` (Visual Fidelity Pass)
**Branch:** main (clean)
**Working surface:** `apps/rad-os/app/ctrl-preview/page.tsx` — Layout Inspector Panel

### Completed this session
- [x] **NumberInput** — `packages/ctrl/controls/NumberInput/NumberInput.tsx` wraps `@base-ui/react/number-field`. Uses `NumberField.Root` + `NumberField.ScrubArea` (horizontal pointer-lock scrub, 2px sensitivity) + `NumberField.Input`. Cell shape matches Dropdown trigger (24px, black bg). Props: `value`, `onValueChange`, `min/max/step/smallStep/largeStep`, `placeholder`, `active`, `prefix`, `suffix`, `pixelSensitivity`, `format`.
- [x] **Tooltip** — `packages/ctrl/readouts/Tooltip/Tooltip.tsx` wraps `@base-ui/react/tooltip` with dark cell styling (8px uppercase cream on black, pixel-art drop shadow). Exports `Tooltip` + `TooltipProvider`. Children render via `cloneElement(child, triggerProps)` so it works with any single React element trigger.
- [x] **IconRadioGroup** — `packages/ctrl/selectors/IconRadioGroup/IconRadioGroup.tsx` wraps `@base-ui/react/radio-group` + `@base-ui/react/radio`. Each item = 20px-tall black cell with icon centered; active = accent color + glow. Every item auto-wrapped in a ctrl `Tooltip` for hover discovery.
- [x] **Dropdown.hideLabel** prop — Dropdown trigger now supports `hideLabel` so the suffix can be a caret-only (▾) control in keyword mode.
- [x] **ctrl-preview wired** —
  - W row: `KeywordCell` (FILL/FIT/AUTO) OR `NumberInput` (numeric) based on unit. Unit dropdown uses `hideLabel` in keyword mode, `hideCaret` in numeric mode. Switching unit flips the cell mode.
  - H row: same pattern (defaults to `10 VH`).
  - MIN/MAX cells: `NumberInput` with `placeholder="-"` and `SuffixLabel` showing "MIN"/"MAX" text.
  - Icon strip: `IconRadioGroup` with 5 options (Visible/Resize/Position/Float/Auto) + tooltips.
  - Whole page wrapped in `TooltipProvider`.
- [x] Flex min-w-0 chain added through box-model visualizer so NumberInput cells shrink to panel width (353px).
- [x] Typecheck clean across `packages/ctrl` and `apps/rad-os`.
- [x] Verified in browser: dropdown popup opens, mode switching works (FILL → PX flips to numeric cell), tooltips render on hover, radio selection updates.

### Remaining (backlog from earlier session)
- [ ] Refactor PanelTitle (L-shape trailing rule)
- [ ] Refactor Section (header controls slot)
- [ ] Refactor PropertyRow (multi-cell grid)
- [ ] Build Toggle micro-size (16px) for Section MIN/MAX
- [ ] Namespace migration: `--ctrl-*` → `--color-ctrl-*` so Tailwind utilities pick them up
- [ ] Replace Trap/LabelCell inline helpers with refactored ctrl primitives
- [ ] Padding/Margin labeled bars (new Paper selection shows MARGIN / BORDER / PADDING as labeled horizontal bars instead of just trapezoids)

### Next Action
> User-directed. Likely the new Paper selection: MARGIN/BORDER/PADDING labeled bars, or continue on Section/PropertyRow refactors.

### What to test
- [ ] `localhost:3000/ctrl-preview` — drag a numeric cell (H=10) to scrub; click FILL dropdown → pick PX → type a number; hover an icon to see tooltip; click a different radio.
- [ ] Keyboard a11y on NumberField inputs (arrow keys to step).

### Key learnings
1. BaseUI `NumberField.ScrubArea` handles pointer-lock drag natively — no custom hook needed for numeric scrubbing.
2. `NumberField` is strictly numeric (`value: number | null`); for mixed text/keyword cells, composite at the page level with a separate `KeywordCell`.
3. BaseUI Tooltip.Trigger must wrap its target via render prop + `cloneElement` so the child element receives the trigger's event handlers.
4. Flex containers need `min-w-0` all the way down the chain — otherwise children demand their content width and overflow.
5. `Dropdown` with `hideLabel` gives a compact caret-only trigger; `hideCaret` gives label-only — combine as needed per layout.
