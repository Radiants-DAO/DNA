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
- [!] Tabs — Refactor Tasks 1-7 + 12 completed (rename variant→mode, memoize context, unregister on unmount, data-slot/data-mode/data-state attributes, CSS-driven styling, full layout options in schema). Pill mode visually verified. LINE mode known broken (empty CVA classes pre-refactor, now CSS-driven but untested in live view — no line-mode consumers exist yet). Tasks 8-11 deferred (trigger→Button conversion — higher risk, needs dedicated session). Dark mode not yet checked.

### T1c — Toggle
- [x] Toggle — Visually clean in both light and dark. Uses Button's visual system (buttonRootVariants/buttonFaceVariants). No hardcoded hex, no viewport breakpoints, no z-index issues. Fixed: meta/schema were stale (variant string → mode/tone/size/rounded enums). Known checklist issues (pattern inheritance, cascade) appear resolved — Toggle now inherits all Button modes/tones.
- [x] ToggleGroup — Visually clean. LEFT/CENTER/RIGHT renders correctly with separators. Selected item fills with accent, unselected transparent (quiet default). Context passes mode/tone/size/rounded. Dark mode verified.

### T1d — Form Controls
- [!] Select — Light mode clean. Dark mode hover contrast issue confirmed: option hover uses bg-accent + text-accent-inv but accent-inv resolves to cream in dark mode (poor contrast on yellow). Dropdown position issue NOT reproduced (opened downward correctly). No hardcoded hex, no viewport breakpoints. All 3 known issues are design-level (token changes needed).
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
