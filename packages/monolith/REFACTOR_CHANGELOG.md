# Refactor Changelog — @rdna/monolith v0.1.0 Post-Review Fixes

All issues from the 3-reviewer audit have been addressed. This changelog documents every change for updating `apps/monolith-hackathon`.

---

## 1. CSS Token Fixes

### tokens.css

| Change | Before | After |
|--------|--------|-------|
| `--color-surface-body` tier | `@theme inline` (private) | `@theme` (semantic) — now generates `bg-surface-body` utility |
| `--color-content-muted` | `rgba(246, 246, 245, 0.6)` | `color-mix(in srgb, var(--color-white) 60%, transparent)` |
| New `--color-green-hover` | — | `#12d9a0` in `@theme inline` |
| New `--color-green-active` | — | `#10c794` in `@theme inline` |
| New `--color-edge-subtle` | — | `color-mix(in srgb, var(--color-white) 20%, transparent)` in `@theme` |
| `--duration-slow` | No comment | Added comment noting intentional 500ms deviation from 300ms spec |

### animations.css

| Class | Before | After |
|-------|--------|-------|
| `.animate-pixel-wobble` | `ease-in-out` | `var(--easing-in-out)` |
| `.animate-bloom-pulse` | `ease-in-out` | `var(--easing-in-out)` |
| `.animate-glowGreen` | `ease-in-out` | `var(--easing-in-out)` |
| `.animate-glowMagma` | `ease-in-out` | `var(--easing-in-out)` |
| `.animate-fadeIn/Out` | `0.15s` | `var(--duration-fast)` |
| `.animate-scaleIn/Out` | `0.15s` | `var(--duration-fast)` |
| `.animate-slideInRight/Out` | `0.2s` | `var(--duration-base)` |
| `.animate-slideInUp/OutDown` | `0.2s` | `var(--duration-base)` |
| `.animate-windowOpen` | `0.2s` | `var(--duration-base)` |
| `.animate-windowClose` | `0.15s` | `var(--duration-base)` |
| `.animate-accordion-down/up` | `200ms ease-out` | `var(--duration-base) var(--easing-out)` |
| New `@keyframes today-glow` | — | Added for CalendarGrid today-cell glow |

### base.css

| Change | Before | After |
|--------|--------|-------|
| `.monolith-body` background | `#060b0a` | `var(--color-surface-body)` |
| Scrollbar thumb hover | `#12d9a0` | `var(--color-green-hover)` |
| Scrollbar thumb active | `#10c794` | `var(--color-green-active)` |
| Firefox scrollbar selector | `*` (universal) | `html, .monolith-body` |

### typography.css

| Change | Before | After |
|--------|--------|-------|
| `ul` margin-bottom | `1rem` | `1em` |
| `figcaption` margin-top | `0.25rem` | `0.25em` |
| `blockquote` border-color | `#e2e2e2` | `var(--color-edge-subtle)` |

---

## 2. Component Fixes

### Button

| Change | Detail |
|--------|--------|
| `ButtonProps` exported | Added `export` to interface, re-exported from `Button/index.ts` and `components/core/index.ts` |
| Mono variant hover shadow | `var(--color-magma)` → `var(--color-action-primary)`, `var(--color-black)` → `var(--color-content-inverted)` |

### AppWindow

| Change | Detail |
|--------|--------|
| CloseButton hover | `hover:bg-[#fce184]` → `hover:bg-[var(--color-selection)]` |
| boxShadow references | `var(--color-ocean)` → `var(--color-surface-elevated)` (3 occurrences) |

### Badge

| Change | Detail |
|--------|--------|
| Added `'use client'` directive | For consistency with other components |
| Custom variant color | `color: '#000'` → `color: 'var(--color-content-inverted)'` |
| Spacing | `px-2 py-0.5` → `px-[0.5em] py-[0.125em]`, `px-3 py-1` → `px-[0.75em] py-[0.25em]` |

### Card

| Change | Detail |
|--------|--------|
| Added `'use client'` directive | For consistency |
| Spacing | `p-2` → `p-[0.5em]`, `p-4` → `p-[1em]`, `p-6` → `p-[1.5em]` |

### ShaderBackground

| Change | Detail |
|--------|--------|
| Removed dead `THEME_COLORS` | Was defined but never used; `HEX_COLORS` is the active constant |

### CalendarGrid

| Change | Detail |
|--------|--------|
| Renamed `intern-post-count` | Replaced with Tailwind inline classes (no BEM class needed) |

---

## 3. BEM → Tailwind Migrations

### CrtTabs

All styling moved from globals.css CSS classes into `CrtTabs.tsx` Tailwind utilities.

| BEM Class Removed | Replacement |
|-------------------|-------------|
| `.crt-tab-list` | `flex gap-[0.375em] px-[0.75em] py-[0.5em] border-b border-[var(--panel-accent-15)]` |
| `.crt-tab-trigger` | Full Tailwind class array with beveled border, hover lift/glow, active press |
| `.crt-tab-trigger:hover` | `hover:` prefixed utilities |
| `.crt-tab-trigger:active` | `active:` prefixed utilities |
| `.crt-tab-trigger--active` | `data-[state=active]:` Radix data attribute selectors (no JS toggling) |
| `.crt-tab-content` | `pt-[0.5em]` |

### CrtAccordion

All styling moved from globals.css CSS classes into `CrtAccordion.tsx` Tailwind utilities.

| BEM Class Removed | Replacement |
|-------------------|-------------|
| `.crt-accordion-item` | Full Tailwind with beveled border, hover lift, active press, `data-[state=open]:` |
| `.crt-accordion-trigger` | `w-full flex items-center justify-between` + font/padding/hover utilities |
| `.crt-accordion-content` | `px-[1em] pb-[1em] pt-[0.75em] mx-[0.5em] font-body text-[0.9375em]` |
| `.accordion-icon` | `group-data-[state=open]:rotate-45` replaces parent-scoped CSS |
| Sibling margin | Root gets `flex flex-col gap-[0.5em]` instead of `+ .item { margin-top }` |

### OrbitalNav

All styling moved from globals.css CSS classes into `OrbitalNav.tsx` Tailwind utilities.

| BEM Class Removed | Replacement |
|-------------------|-------------|
| `.orbital-layer` | `absolute inset-0 z-[5] pointer-events-none` |
| `.orbital-icon` | `group absolute top-0 left-0 pointer-events-auto bg-transparent border-none p-0 cursor-pointer ...` |
| `.orbital-icon img` | `h-[3em] w-auto [image-rendering:pixelated]` + transition with `--easing-drift` |
| `.orbital-icon:hover img` | `group-hover:scale-110 group-hover:[filter:drop-shadow(...)]` |
| `.orbital-icon:active img` | `group-active:scale-90 group-active:duration-100` |
| `.orbital-label` | `absolute top-full left-1/2 -translate-x-1/2 font-mono text-[0.875em] uppercase ...` |
| `.data-stream` | Constant strings `STREAM_BASE` / `STREAM_ACTIVE` (className set via refs) |

Inline rgba colors replaced: `rgba(255,255,255,0.85)` → `color-mix(in srgb, var(--color-content-primary) 85%, transparent)`

### CalendarGrid

All styling moved from globals.css CSS classes into `CalendarGrid.tsx` Tailwind utilities.

| BEM Class Removed | Replacement |
|-------------------|-------------|
| `.cal-month` | `flex flex-col gap-[0.5em]` |
| `.cal-month-header` | `font-mono text-[0.875em] text-[var(--panel-accent-65)] uppercase` |
| `.cal-grid` | `grid grid-cols-7 gap-px` + beveled border |
| `.cal-cell` | Constant `CELL_BASE` with background, padding, min-height, flex layout |
| `.cal-cell--header` | Constant `CELL_HEADER` overrides |
| `.cal-cell--past` | `opacity-40 hover:opacity-60` |
| `.cal-cell--today` | Inline `TODAY_STYLE` object with glow animation |
| `.cal-cell--selected` | `outline outline-1 outline-[var(--panel-accent)]` |
| `.cal-cell--launch/deadline/mtndao` | `SPECIAL_BG_STYLES` map applied via inline style |
| `.cal-date` | `font-ui text-[0.75em] text-[rgba(255,255,255,0.7)]` |
| `.cal-date--bold` | Conditional `font-bold text-[rgba(255,255,255,0.95)]` |
| `.cal-dots` / `.cal-dot` | `flex gap-[0.15em]` / `w-[0.375em] h-[0.375em] rounded-full` |
| `.cal-tooltip` | Full Tailwind on portal div: fixed, z-[9999], beveled border, dark bg |
| `.cal-tooltip-header/time/desc` | Inline font and color utilities |
| `.intern-post-count` | Replaced with inline Tailwind classes |
| `@keyframes today-glow` | Moved to `animations.css` in the package |

---

## 4. Package Changes

| Change | Detail |
|--------|--------|
| CRTShader moved | `components/core/CRTShader/` → `components/dev/CRTShader/` |
| DitheringShader moved | `components/core/DitheringShader/` → `components/dev/DitheringShader/` |
| Homepage URL | `tree/master/` → `tree/main/` |
| dna.config.json version | `1.0.0` → `0.1.0` (matches package.json) |
| New optional peerDeps | `@paper-design/shaders-react`, `@radix-ui/react-accordion`, `@radix-ui/react-tabs`, `use-scramble` |

---

## 5. Breaking Changes for apps/monolith-hackathon

### CSS Classes to Remove from globals.css

The following CSS class blocks can be **deleted** from `apps/monolith-hackathon/app/globals.css` — their styling is now self-contained in the package components:

| Lines (approx) | Classes | Now in |
|----------------|---------|--------|
| 1199–1291 | `.orbital-layer`, `.orbital-icon`, `.orbital-label`, `.data-stream` | `OrbitalNav.tsx` |
| 1365–1472 | `.crt-accordion-*`, `.accordion-icon` | `CrtAccordion.tsx` |
| 1478–1535 | `.crt-tab-*` | `CrtTabs.tsx` |
| 2643–2847 | `.cal-grid`, `.cal-cell*`, `.cal-date*`, `.cal-dots`, `.cal-dot`, `.cal-tooltip*` | `CalendarGrid.tsx` |

**WARNING — DO NOT delete these `.cal-*` classes (lines ~2480–2642).** They are still used by `InfoWindow.tsx` in the hackathon app for the today-hero panel and event detail rendering:

| Class | Used by |
|-------|---------|
| `.cal-today-hero` | `InfoWindow.tsx:1182` |
| `.cal-hero-header` | `InfoWindow.tsx:1185` |
| `.cal-hero-reset` | `InfoWindow.tsx:1189` |
| `.cal-today-event` | `InfoWindow.tsx:1200, 1237` |
| `.cal-event-top` | `InfoWindow.tsx:1201, 1238` |
| `.cal-event-time-block` | `InfoWindow.tsx:1206, 1244` |
| `.cal-event-time-local` | `InfoWindow.tsx:1207, 1245` |
| `.cal-event-time-utc` | `InfoWindow.tsx:1208, 1246` |
| `.cal-event-desc` | `InfoWindow.tsx:1211, 1249` |
| `.cal-event-actions` | `InfoWindow.tsx:1212, 1250` |
| `.cal-event-link` | `InfoWindow.tsx:1214, 1219, 1223, 1252, 1256` |
| `.cal-today-dot` | `InfoWindow.tsx:1202, 1239` |
| `.cal-legend` | `InfoWindow.tsx:1270` |
| `.cal-legend-item` | `InfoWindow.tsx:1272` |

These classes should be migrated to Tailwind when InfoWindow is updated, or kept in globals.css until then.

### Import Changes

None — component imports from `@rdna/monolith/components/*` remain the same.

### Prop Changes

None — all component APIs remain backward compatible.

### Token Changes Affecting globals.css

If globals.css references any of these tokens directly, update accordingly:

| Old Reference | New Reference |
|---------------|---------------|
| Raw `#060b0a` for body bg | Use `var(--color-surface-body)` or `bg-surface-body` |
| `#12d9a0` / `#10c794` for scrollbar | Use `var(--color-green-hover)` / `var(--color-green-active)` |
| `#e2e2e2` for borders | Use `var(--color-edge-subtle)` |

### New Token Available

- `bg-surface-body` — Tailwind utility now generated (was previously tier-1 only)
- `border-edge-subtle` — New semantic token for subtle borders
