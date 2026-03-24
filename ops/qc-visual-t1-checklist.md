---
type: "note"
---
# T1 Visual QA Checklist

Tracks `/qc-visual` pass status for each T1 component from `docs/production-readiness-checklist.md`.
Dev server: `localhost:3004` (playground) or `localhost:3000` (rad-os).

## Status Markers

| Marker | Meaning |
|--------|---------|
| `[ ]`  | Not yet QA'd |
| `[x]`  | QA'd, issues found and fixed |
| `[!]`  | QA'd, issues found, needs manual work |
| `[v]`  | QA'd, clean pass |

## Components

### T1a — Button
- [!] Button — 6 known issues confirmed, 1 new. CONFIRMED: (1) flat mode no hover/pressed differentiation, (2) focus uses outline not drop-shadow, (3) active/selected has strange ink/cream gradient on ::after border, (4) pattern mode transparent at rest (acts like ghost), (5) pattern hover makes text invisible (mask covers entire face), (6) no "transparent" tone. NEW: bevel gradients use hardcoded rgba(255,255,255) / rgba(0,0,0) in base.css quiet modifier (lines 399-430) — cosmetic, not brand-color violations. Dark mode: solid/accent renders correctly. No hardcoded hex in Button.tsx, no viewport breakpoints, no z-index magic numbers.

### T1b — Tabs
- [ ] Tabs — all variants; overflow behavior; dark+light

### T1c — Toggle
- [ ] Toggle — all states; dark+light
- [ ] ToggleGroup — cascade from Toggle/Button; dark+light

### T1d — Form Controls
- [ ] Select — dropdown position, border clipping, dark mode hover
- [ ] NumberField — button borders, dark mode
- [ ] Slider — border on filled part, variants
- [ ] Switch — dark mode colors, glow states, thumb colors
- [ ] Checkbox — System 7 styling, dark+light
- [ ] Radio — System 7 styling, dark+light
- [ ] Input — baseline visual check
- [ ] InputSet — layout and grouping

### T1e — Feedback
- [ ] Alert — string/icon/heading props, closable
- [ ] Badge — string prop, visual variants
- [ ] Toast — alignment with Alert styling
- [ ] Tooltip — compact variant, dark+light

### T1f — Other
- [ ] Pattern — display in UI Toolkit, ToggleGroup options, dark/light adherence
- [ ] ScrollArea — themed scrollbar, auto-hide
- [ ] Separator — visual check
- [ ] Combobox — pixelated borders, dropdown behavior
- [ ] CountdownTimer — visual check

### T1g — Dropdowns
- [ ] ContextMenu — hover/interaction patterns
- [ ] DropdownMenu — hover/interaction patterns
- [ ] Menubar — hover/interaction patterns
- [ ] NavigationMenu — hover/interaction patterns
