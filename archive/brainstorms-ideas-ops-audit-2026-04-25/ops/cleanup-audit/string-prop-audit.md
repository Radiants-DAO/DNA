# RDNA Core — String Prop Audit (T1d)

Scope: `packages/radiants/components/core/**/*.meta.ts` (source of truth per CLAUDE.md).
Goal: flag string props that should be `boolean` (binary) or a properly-typed enum / discriminated union.

## Flagged props

| Component | Prop | Current type | Suggested shape | Reason |
|---|---|---|---|---|
| Icon | `large` + `size` | `boolean` alongside `size: 16 \| 24` | Pick one. Kill `large`, keep `size`. | Two props encoding the same 2-value axis. `large` is literally documented as "Equivalent to size={24}". Classic redundant boolean shortcut — pick the enum since `size` is the forward-compatible name. |
| Tabs | `indicator` | `"none" \| "dot"` | `showIndicator?: boolean` (or keep enum but drop `"none"` and make prop optional) | Binary on/off where `"none"` is the off state. A boolean reads cleaner and the component only has two indicator styles. |
| Spinner | `variant` | `"default" \| "dots"` | `variant?: "ring" \| "dots"` (rename) OR `dots?: boolean` | Only 2 values and `"default"` is a non-descriptive label for "ring". Either rename for clarity or collapse to a boolean. |
| Toast | `variant` | loose `type: "string"` | `variant?: "default" \| "success" \| "warning" \| "error"` (enum) | Meta declares `string` but the description enumerates 4 values. Should match the `Alert.variant` enum contract — not a boolean candidate, but not a free string either. |
| Menubar / NavigationMenu / ToggleGroup / Toolbar | `orientation` | loose `type: "string"` | `type: "enum", values: ["horizontal", "vertical"]` | Legit 2-value enum — but meta currently types it as raw string, which undermines codegen. Fix the meta, don't change the runtime shape. |
| ScrollArea | `orientation`, `type` | loose `type: "string"` | `orientation: enum ["horizontal","vertical","both"]`; `type: enum ["auto","always","scroll","hover"]` | Same as above — string in meta, enum in practice. |
| DropdownMenu / Popover | `position` | loose `type: "string"` | enum of Base UI `Side` values | Same pattern. `Tooltip.position` already models this correctly as an enum — Dropdown/Popover should match. |
| ToggleGroup | `mode`, `tone`, `size`, `rounded` | loose `type: "string"` | Reuse the `ButtonMode` / `ButtonTone` / `ButtonSize` / `ButtonRounded` enums | Component delegates to Toggle/Button visuals — meta should reference the same enums so schema generation is accurate. |
| Avatar | `shape` | `"circle" \| "square"` | Borderline flag — consider `square?: boolean` | Only 2 values and `"circle"` is the default. Boolean reads as "override from the canonical shape". Keep as enum only if a third shape (e.g., `"rounded"`) is plausible; otherwise simplify. |

## Rejected / left as-is (deliberate)

- **Button `mode` / `tone` / `rounded` / `size`** — genuine enums with 4–9 values representing visual design tokens. Booleans would explode the API. Keep.
- **Button `quiet` / `flush` / `iconOnly` / `textOnly` / `compact` / `active` / `fullWidth`** — these look like "variant soup" but each is a truly orthogonal modifier (e.g., `quiet` + `flush` + `iconOnly` is a valid combination in the toolbar). Collapsing into one enum would lose expressiveness. Keep.
- **Card `variant` (`default` | `inverted` | `raised`)** — 3 values, mutually exclusive surface treatments. Modeling as two booleans (`inverted` + `raised`) opens illegal states (`inverted && raised`). Correctly an enum.
- **Separator `orientation` / `variant`** — genuine enums. Meta already types them correctly. Keep.
- **Drawer `direction` / Sheet `side` / Tooltip `position` / Tabs `position`** — placement unions of 3–4 sides. Real enums, already typed correctly. Keep.
- **Switch `labelPosition` (`left` | `right`)** — 2 values, but `"left"` and `"right"` are both meaningful and neither is a clear "off" state. Enum reads better than `labelLeft?: boolean`. Keep.
- **AppWindow `presentation` (`window` | `fullscreen` | `mobile`)** — 3-way shell mode. Correct as enum. Keep.

## Summary

- **True boolean candidates:** `Icon.large` (kill it), `Tabs.indicator` (collapse), `Spinner.variant` (collapse or rename).
- **Meta hygiene (string → enum, no API change):** `Toast.variant`, `*.orientation`, `ScrollArea.type`, `Dropdown/Popover.position`, `ToggleGroup` visual props. These are schema-correctness fixes, not prop renames.
- **Borderline:** `Avatar.shape` — defensible either way; flag for design-system review.

No source files were modified per task scope.
