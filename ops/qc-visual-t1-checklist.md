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
- [x] Select — Light mode clean. Dark mode accent-inv contrast issue resolved by batch 2 token fix (accent-inv now ink in both modes). Dropdown position issue NOT reproduced (opened downward correctly). No hardcoded hex, no viewport breakpoints.
- [x] NumberField — Fixed: border-l on both step buttons → decrement now border-r, increment border-l (inner edges only). Batch 2 fixed both the accent-inv token (ink in both modes) and the step button code (text-main → text-accent-inv). Dark mode contrast now correct. No hardcoded hex, no viewport breakpoints, no z-index issues.
- [x] Slider — Fixed: removed pixel-rounded-xs from Indicator (caused extra border on filled part; Track clip-path handles clipping). Dark mode clean. z-[1]/z-[2] are local stacking (indicator below thumb), not global magic. No hardcoded hex, no viewport breakpoints. Known: fader/stepped variants not yet implemented (feature request, not a bug).
- [x] Switch — Fixed: base.css + dark.css used `data-state="checked"` but Base UI uses `data-checked` → checked track style never applied. Now ink (off) → yellow (on) works in both modes. Remaining design-level: (1) hover glow applies to both states (spec wants on-state only), (2) thumb hover/press → white not implemented, (3) switch-thumb bevel uses hardcoded rgba (cosmetic, same as Button). No hardcoded hex in component, no viewport breakpoints, no z-index issues.
- [x] Checkbox — Visually functional in both modes: unchecked=page/card bg, checked=accent bg with pixel-art checkmark. Accent-inv contrast resolved by batch 2 token fix (ink checkmark on yellow in both modes). No hardcoded hex, no viewport breakpoints, no z-index. Known: full System 7 visual refactor pending (design-level). Focus glow has hardcoded rgba(254,248,226,0.3) in shared file (should use glow token).
- [x] Radio — Visually functional both modes: unselected=page bg + border-line circle, selected=accent bg + dark dot. Batch 2 fixed dot from bg-main to bg-accent-inv (ink in both modes) + token fix. Dark mode contrast now correct. Focus glow has hardcoded rgba(254,248,226,0.3) in Checkbox.tsx:245 (should use glow token). No hardcoded hex, no viewport breakpoints, no z-index. Known: System 7 visual refactor pending (design-level).
- [v] Input — Clean pass. Light: cream bg, pixel-rounded, muted placeholder. Dark: dark bg, correct token flipping. Label, description, error sub-components all use semantic tokens. No hardcoded hex, no viewport breakpoints, no z-index issues.
- [v] InputSet — Clean pass. Pixel-rounded fieldset with legend heading, nested inputs correctly grouped. Both light and dark modes render clean. All semantic tokens. No hardcoded hex, no viewport breakpoints, no z-index issues.

### T1e — Feedback
- [v] Alert — Clean pass. All 5 variants render correctly (default/success/warning/error/info) with appropriate bg tokens and auto-icons. Title, description, close button all functional. Pixel-rounded + pixel-shadow. Both light and dark modes clean. No hardcoded hex, no viewport breakpoints, no z-index issues.
- [x] Badge — All 5 variants render correctly (default/success/warning/error/info) with semantic tokens. pixel-rounded-xs + pixel-shadow-raised. SM/MD sizes. No hardcoded hex, no viewport breakpoints, no z-index issues. Playground demo renders empty (no children passed — demo gap, not component bug). Dark mode accent-inv contrast resolved by batch 2 token fix (ink text on colored bg variants).
- [x] Toast — Already consumes Alert compound component (aligned styling). Fixed: replaced inline SVG close icon with CloseIcon from icon system (matches Alert). Animation: animate-slideIn 200ms ease-out (in spec). z-[400] on viewport is legitimate overlay stacking. No hardcoded hex, no viewport breakpoints. Known limitation: no ToastProvider in playground demo — toast can't be visually triggered (demo gap). `fixed top-4 right-4` positions relative to viewport not window (design consideration for windowed app).
- [v] Tooltip — Clean pass. Dark pill with light text (bg-inv + text-flip) renders correctly in both modes — permanent inverted pair, always high contrast. TOP/BOTTOM positions verified. rounded-xs (not pixel-rounded). z-[1000] legitimate overlay. duration-100 ease-out transition in spec. No hardcoded hex, no viewport breakpoints. Known feature requests: compact variant (PixelCode font) and pixelated borders — not bugs.

### T1f — Other
- [!] Pattern — Component code is clean: CSS mask-image with semantic color token (--color-main via --pat-color fallback), correctly flips in dark mode. No hardcoded hex, no viewport breakpoints, no z-index. Known demo issues confirmed: (1) preview renders 0-height (pattern div has no intrinsic height — demo needs explicit dimensions), (2) pat ToggleGroup overflows horizontally (too many options for available width — needs dropdown/grid selector). Both are playground/demo issues, not component bugs.
- [v] ScrollArea — Clean pass. Themed scrollbar with bg-line/40 thumb (hover: bg-line), auto-hide via data-[scrolling]/data-[hovering] attrs, duration-150 ease-out transition. Corner uses bg-page. Both light and dark modes clean — thumb uses semantic --color-line token which flips correctly. No hardcoded hex, no viewport breakpoints, no z-index issues.
- [v] Separator — Clean pass. All 3 variants verified: solid (bg-line 1px), dashed (border-rule border-dashed), decorated (border-rule lines + bg-accent diamond ornament). Both light and dark modes clean — semantic tokens (bg-line, border-rule, bg-accent) flip correctly. No hardcoded hex, no viewport breakpoints, no z-index issues.
- [x] Combobox — Fixed: removed overflow-hidden from pixel-rounded-xs popup (breaks clip-path ::after pseudo-border). Input + popup both use pixel-rounded-xs correctly. pixel-shadow-raised on dropdown. Hover/highlight states work (bg-accent + text-accent-inv). Dark mode accent-inv contrast resolved by batch 2 token fix (ink on yellow in both modes). Inline SVGs for chevron/checkmark (icon system has equivalents but different style — design decision). No hardcoded hex, no viewport breakpoints. z-50/z-10 are Tailwind utilities.
- [v] CountdownTimer — Clean pass. All 3 variants (default/compact/large) render correctly with proper hierarchy: label (text-mute), countdown digits (font-heading text-main), unit labels. Large variant uses segment boxes (pixel-rounded-sm + bg-depth). Dark mode: all semantic tokens flip correctly, good contrast. No hardcoded hex, no viewport breakpoints, no z-index issues. Known non-visual issue: type mismatch (schema says string, implementation accepts number|Date).

### T1g — Dropdowns
- [v] ContextMenu — Clean pass. Right-click trigger opens popup with Edit/Duplicate/Delete items. Hover uses bg-inv + text-flip (inverted pair). Destructive items (Delete) keep text-danger on hover (intentional). Separator uses border-rule. pixel-rounded-sm + pixel-shadow-raised on popup. Dark mode: all tokens flip correctly, good contrast in both default and hover states. z-[1000] legitimate overlay. No hardcoded hex, no viewport breakpoints. Note: items use text-base while Combobox uses text-sm — cross-dropdown consistency is a design-level concern (T1g checklist item).
- [v] DropdownMenu — Clean pass. Click trigger opens popup with group label (ACCOUNT), items (Profile/Settings), separator, destructive item (Sign out). Hover uses bg-inv + text-flip matching ContextMenu pattern. Destructive keeps text-danger on hover. pixel-rounded-sm + pixel-shadow-raised. Open/close animation: duration-150 ease-out with blur-sm on exit. Dark mode: all tokens flip correctly. z-50 Tailwind utility. No hardcoded hex, no viewport breakpoints, no z-index issues.
- [v] Menubar — Clean pass. Dark bar (bg-inv) with cream triggers (text-flip) — System 7-style. File menu opens with items + keyboard shortcuts (right-aligned text-mute). Hover uses bg-hover (softer than ContextMenu/DropdownMenu's bg-inv). Content uses bg-card + pixel-rounded-xs. Separator uses bg-rule. Dark mode: bar stays dark (already bg-inv), popup flips correctly. Animation: duration-150 ease-out + blur-sm exit. z-50 Tailwind utility. No hardcoded hex, no viewport breakpoints. Note: different hover/size/bg tokens than ContextMenu/DropdownMenu — design-level consistency concern (T1g).
- [v] NavigationMenu — Clean pass. Horizontal nav with trigger+flyout items (Components, Documentation) and standalone link (About). Triggers use Button visual system via data-slot="button-face" data-quiet data-color="accent". Chevron rotates on open (duration-150 ease-out). Flyout uses bg-card + pixel-rounded-xs + pixel-shadow-raised. Links are underlined in flyout. Dark mode: all tokens flip correctly, good contrast. No z-index values, no hardcoded hex, no viewport breakpoints.

## Batch 2 — Dark Mode accent-inv Contrast Fix

**Root cause:** `--color-accent-inv` resolves to `var(--color-cream)` in dark mode (dark.css:91 + base.css:702). Cream text on yellow accent bg = low contrast. Rule: always high-contrast pairs (ink on yellow, cream on ink). Fix: change dark mode `--color-accent-inv` to `var(--color-ink)`, then verify each affected component.

### Token Fix
- [x] Fix `--color-accent-inv` in dark.css and base.css dark theme — changed from `var(--color-cream)` to `var(--color-ink)`. Now ink (dark) on yellow in both modes. All 4 definitions verified: tokens.css:102, base.css:702, base.css:731, dark.css:91 — all `var(--color-ink)`.

### Visual Verification (post-fix)
- [v] Select — dark mode hover/selected contrast verified. Ink text (L=4%) on yellow accent (L=90%) = high contrast. Both hover and selected states correct.
- [x] NumberField — fixed: step buttons used `text-main` (cream in dark) on `bg-accent` (yellow). Changed to `text-accent-inv` (ink in both modes). Dark + light verified.
- [v] Checkbox — dark mode checkmark contrast verified. Ink checkmark on yellow accent bg. Uses text-accent-inv (token fix sufficient, no code change needed).
- [x] Radio — fixed: selected dot used `bg-main` (cream in dark) on accent circle. Changed to `bg-accent-inv` (ink in both modes). Dark + light verified.
- [v] Badge — dark mode colored variant text contrast verified via token inspection. Ink (L=4%) on success (L=93%), warning (L=90%), danger (L=69%), link (L=73%) — all high contrast. Demo renders empty (no children — known demo gap), but code uses text-accent-inv on all colored bg variants.
- [v] Combobox — dark mode hover/highlight contrast verified. Ink text on yellow accent bg on hover/highlighted states. Token fix sufficient, no code change needed.
