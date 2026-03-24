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
- [x] NumberField — Fixed: border-l on both step buttons → decrement now border-r, increment border-l (inner edges only). Dark mode: text-main resolves to cream on bg-accent (yellow) — icons nearly invisible. Same accent-inv token issue as Select (design-level, not auto-fixable). No hardcoded hex, no viewport breakpoints, no z-index issues.
- [x] Slider — Fixed: removed pixel-rounded-xs from Indicator (caused extra border on filled part; Track clip-path handles clipping). Dark mode clean. z-[1]/z-[2] are local stacking (indicator below thumb), not global magic. No hardcoded hex, no viewport breakpoints. Known: fader/stepped variants not yet implemented (feature request, not a bug).
- [x] Switch — Fixed: base.css + dark.css used `data-state="checked"` but Base UI uses `data-checked` → checked track style never applied. Now ink (off) → yellow (on) works in both modes. Remaining design-level: (1) hover glow applies to both states (spec wants on-state only), (2) thumb hover/press → white not implemented, (3) switch-thumb bevel uses hardcoded rgba (cosmetic, same as Button). No hardcoded hex in component, no viewport breakpoints, no z-index issues.
- [!] Checkbox — Visually functional in both modes: unchecked=page/card bg, checked=accent bg with pixel-art checkmark. Checkmark uses text-accent-inv (cream in dark mode on yellow — low contrast but visible). No hardcoded hex, no viewport breakpoints, no z-index. Known: full System 7 visual refactor pending (design-level). Radio focus glow has hardcoded rgba(254,248,226,0.3) in shared file (should use glow token).
- [!] Radio — Visually functional both modes: unselected=page bg + border-line circle, selected=accent bg + dark dot. Dark mode dot uses bg-main (cream on yellow — low contrast, same pattern). Focus glow has hardcoded rgba(254,248,226,0.3) in Checkbox.tsx:245 (should use glow token). No hardcoded hex, no viewport breakpoints, no z-index. Known: System 7 visual refactor pending (design-level).
- [v] Input — Clean pass. Light: cream bg, pixel-rounded, muted placeholder. Dark: dark bg, correct token flipping. Label, description, error sub-components all use semantic tokens. No hardcoded hex, no viewport breakpoints, no z-index issues.
- [v] InputSet — Clean pass. Pixel-rounded fieldset with legend heading, nested inputs correctly grouped. Both light and dark modes render clean. All semantic tokens. No hardcoded hex, no viewport breakpoints, no z-index issues.

### T1e — Feedback
- [v] Alert — Clean pass. All 5 variants render correctly (default/success/warning/error/info) with appropriate bg tokens and auto-icons. Title, description, close button all functional. Pixel-rounded + pixel-shadow. Both light and dark modes clean. No hardcoded hex, no viewport breakpoints, no z-index issues.
- [!] Badge — All 5 variants render correctly (default/success/warning/error/info) with semantic tokens. pixel-rounded-xs + pixel-shadow-raised. SM/MD sizes. No hardcoded hex, no viewport breakpoints, no z-index issues. Playground demo renders empty (no children passed — demo gap, not component bug). Dark mode: text-accent-inv on colored bg variants (success/warning/error/info) has poor contrast (cream on light color) — same design-level token issue as Select/NumberField/Checkbox/Radio.
- [x] Toast — Already consumes Alert compound component (aligned styling). Fixed: replaced inline SVG close icon with CloseIcon from icon system (matches Alert). Animation: animate-slideIn 200ms ease-out (in spec). z-[400] on viewport is legitimate overlay stacking. No hardcoded hex, no viewport breakpoints. Known limitation: no ToastProvider in playground demo — toast can't be visually triggered (demo gap). `fixed top-4 right-4` positions relative to viewport not window (design consideration for windowed app).
- [v] Tooltip — Clean pass. Dark pill with light text (bg-inv + text-flip) renders correctly in both modes — permanent inverted pair, always high contrast. TOP/BOTTOM positions verified. rounded-xs (not pixel-rounded). z-[1000] legitimate overlay. duration-100 ease-out transition in spec. No hardcoded hex, no viewport breakpoints. Known feature requests: compact variant (PixelCode font) and pixelated borders — not bugs.

### T1f — Other
- [!] Pattern — Component code is clean: CSS mask-image with semantic color token (--color-main via --pat-color fallback), correctly flips in dark mode. No hardcoded hex, no viewport breakpoints, no z-index. Known demo issues confirmed: (1) preview renders 0-height (pattern div has no intrinsic height — demo needs explicit dimensions), (2) pat ToggleGroup overflows horizontally (too many options for available width — needs dropdown/grid selector). Both are playground/demo issues, not component bugs.
- [v] ScrollArea — Clean pass. Themed scrollbar with bg-line/40 thumb (hover: bg-line), auto-hide via data-[scrolling]/data-[hovering] attrs, duration-150 ease-out transition. Corner uses bg-page. Both light and dark modes clean — thumb uses semantic --color-line token which flips correctly. No hardcoded hex, no viewport breakpoints, no z-index issues.
- [v] Separator — Clean pass. All 3 variants verified: solid (bg-line 1px), dashed (border-rule border-dashed), decorated (border-rule lines + bg-accent diamond ornament). Both light and dark modes clean — semantic tokens (bg-line, border-rule, bg-accent) flip correctly. No hardcoded hex, no viewport breakpoints, no z-index issues.
- [x] Combobox — Fixed: removed overflow-hidden from pixel-rounded-xs popup (breaks clip-path ::after pseudo-border). Input + popup both use pixel-rounded-xs correctly. pixel-shadow-raised on dropdown. Hover/highlight states work (bg-accent + text-accent-inv). Dark mode: same accent-inv contrast issue on hover (cream on yellow — design-level). Inline SVGs for chevron/checkmark (icon system has equivalents but different style — design decision). No hardcoded hex, no viewport breakpoints. z-50/z-10 are Tailwind utilities.
- [v] CountdownTimer — Clean pass. All 3 variants (default/compact/large) render correctly with proper hierarchy: label (text-mute), countdown digits (font-heading text-main), unit labels. Large variant uses segment boxes (pixel-rounded-sm + bg-depth). Dark mode: all semantic tokens flip correctly, good contrast. No hardcoded hex, no viewport breakpoints, no z-index issues. Known non-visual issue: type mismatch (schema says string, implementation accepts number|Date).

### T1g — Dropdowns
- [v] ContextMenu — Clean pass. Right-click trigger opens popup with Edit/Duplicate/Delete items. Hover uses bg-inv + text-flip (inverted pair). Destructive items (Delete) keep text-danger on hover (intentional). Separator uses border-rule. pixel-rounded-sm + pixel-shadow-raised on popup. Dark mode: all tokens flip correctly, good contrast in both default and hover states. z-[1000] legitimate overlay. No hardcoded hex, no viewport breakpoints. Note: items use text-base while Combobox uses text-sm — cross-dropdown consistency is a design-level concern (T1g checklist item).
- [ ] DropdownMenu — hover/interaction patterns
- [ ] Menubar — hover/interaction patterns
- [ ] NavigationMenu — hover/interaction patterns
