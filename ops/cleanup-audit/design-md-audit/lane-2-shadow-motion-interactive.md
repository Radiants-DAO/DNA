# Lane 2: Shadow + Motion + Interactive Audit

> Source agent ran read-only and reported findings inline; transcribed verbatim here.

## Summary
- 3 high, 2 medium, 0 low
- Heaviest drift: easing-token claim ("one curve") is false; moon-mode shadow blur values don't match doc; Button size scale is off by one Tailwind step.

## §4 Shadow & Elevation (lines 419-487)

### Verified ✓
- Status glow values (`shadow-glow-success/error/info`) match doc exactly.
- Sun-mode `pixel-shadow-*` utilities match doc descriptions.

### High-severity drift

**Moon-mode shadow values are simplified in doc; reality includes border rings + different blur radii** (`packages/radiants/dark.css:180-206`):

| Token | Doc claim (line) | Reality |
|---|---|---|
| `--shadow-inset` (429) | `inset 0 0 8px glow-subtle` | `inset 0 0 0 1px var(--color-rule), inset 0 0 6px var(--glow-sun-yellow-subtle)` |
| `--shadow-surface` (430) | `0 0 2px glow-subtle` | `0 0 0 1px var(--color-rule), 0 1px 2px var(--glow-sun-yellow-subtle)` |
| `--shadow-resting` (431) | `0 0 6px glow-subtle` | `0 0 0 1px rule, 0 0 4px subtle, 0 0 8px subtle` |
| `--shadow-lifted` (432) | `0 0 10px + 20px subtle` | `0 0 0 1px line, 0 0 8px glow, 0 0 16px subtle` |
| `--shadow-raised` (433) | `0 0 10px + 20px subtle` | `0 0 0 1px line, 0 0 8px glow, 0 0 20px subtle` |
| `--shadow-floating` (434) | `0 0 12px + 24px subtle` | `0 0 0 1px line, 0 0 10px glow, 0 0 24px subtle` |
| `--shadow-focused` (435) | `0 0 12px + 24px + 36px glow` | `0 0 0 1px line-hover, 12px glow, 24px glow, 36px subtle` (mixes glow + subtle) |

Border-ring layer is consistently undocumented and blur radii differ throughout.

### Undocumented in DESIGN.md
- **Moon-mode `pixel-shadow-*` overrides** (`dark.css:347-361`): different blur values than Sun mode, not documented.

## §5 Motion & Animation (lines 488-575)

### Verified ✓
- All five duration tokens match doc (`tokens.css:188-192`): `instant`, `fast`, `base`, `moderate`, `slow`.
- Reduced-motion `--duration-scalar` correctly implemented (`tokens.css:255-264`).
- "Snap on input, ease on state" pattern verified in `base.css:376-389` (transform = no transition; color/bg = transitioned). Same pattern in Button + Switch.

### High-severity drift

**"One easing curve for the entire system" is false** (DESIGN.md line 506-508). `tokens.css:199-202` defines THREE easings:
- `--easing-default: cubic-bezier(0, 0, 0.2, 1)` ✓ (matches doc)
- `--easing-in: cubic-bezier(0.4, 0, 1, 1)` — undocumented; doc explicitly says "no ease-in"
- `--easing-spring: cubic-bezier(0.22, 1, 0.36, 1)` — undocumented (used for popover/badge spring)

### Medium-severity drift

**Animation durations hardcoded, not tokenized** (`packages/radiants/animations.css:54-68`):
- `.animate-slide-in-right`: `0.2s ease-out` (literal)
- `.animate-fadeIn`: `0.15s ease-out` (literal)
- `.animate-scaleIn`: `0.15s ease-out` (literal)
- `.animate-slideIn`: `0.2s ease-out` (literal)

Numeric values match `--duration-base`/`--duration-moderate` but don't reference the tokens. Contradicts doc claim that durations come from token system.

## §6 Interactive Elements (lines 576-734)

### Verified ✓
- Pixel-corners radius scale matches (`pixel-rounded-xs/sm/md/lg/xl`).
- `rdna/no-pixel-border` enforces the "no border-* on pixel-cornered" rule.
- Focus-ring pattern uses `outline` (not `ring-*`), implemented in `pixel-corners.css:37-66`.
- Custom scrollbar (`base.css:150-200`) matches doc description.
- Button modes (`solid`/`flat`/`text`/`pattern`) and tones (`accent`/`danger`/`success`/...) all match `Button.meta.ts`.

### Medium-severity drift

**Button size scale is off by one Tailwind step** (`Button.tsx:127-131` vs DESIGN.md lines 582-586):

| Size | Doc | Real |
|---|---|---|
| `xs` | (n/a / 24px) | `h-5` (20px) |
| `sm` | 24px (h-6) | `h-6` ✓ |
| `md` | 32px (h-8) | `h-7` (28px) |
| `lg` | 40px (h-10) | `h-8` (32px) |
| `xl` | (n/a) | `h-10` (40px) ✓ |

Doc skips `xs` entirely and md/lg are one step too tall.

### Undocumented in DESIGN.md
- `data-quiet` mode + dark-mode override rules (`dark.css:465-490`).
- `[data-force-state="hover"|"pressed"]` selectors for Figma/preview forcing (`dark.css:857-1041`).
- Tailwind v4 transition shorthand `transition-[border-color,background-color,color]` used in Button.tsx CVA.
