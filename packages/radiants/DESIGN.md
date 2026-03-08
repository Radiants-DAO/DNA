# RDNA Design System

> Radiant Design Nexus Architecture — the design language for Radiants.

## How to Use This Document

This document is the **canonical source of truth** for the RDNA design system. It defines what the system _should_ be — current code may not match. When code and this document conflict, this document wins.

**Audience:** Designers, engineers, and AI agents implementing UI.

**Scope:** Part 1 (Design System) applies to all RDNA consumers. Part 2 (RadOS Application) applies only to the rad-os app. Part 3 captures cross-cutting hard-won implementation rules.

### Normative Language

- `MUST`: Required for RDNA conformance.
- `MUST NOT`: Prohibited for RDNA conformance.
- `SHOULD`: Strong default. Deviations require explicit rationale.
- `MAY`: Optional, implementation-dependent.

### Intent vs Implementation

RDNA is defined in three layers:

1. **Intent layer** (Section 1): Philosophy, emotional goals, and invariants.
2. **System contract layer** (Sections 2-9): Tokens, interaction rules, and architecture.
3. **Product adapter layer** (Part 2+): RadOS-specific behaviors and constraints.

Implementations in different stacks (React, native mobile, desktop, game engines, etc.) MAY change syntax, but MUST preserve intent and semantic roles.

### Conformance Checklist

An implementation is RDNA-conformant only if all are true:

- [ ] Uses RDNA semantic token names and role mappings (no deprecated aliases) instead of raw primitives in component code.
- [ ] Implements Sun Mode and Moon Mode as distinct mood systems, not simple inversion.
- [ ] Preserves `Environment > Surface > Chrome` hierarchy.
- [ ] Applies motion, spacing, interaction, and accessibility guardrails from this spec.
- [ ] Keeps Easter eggs optional, non-blocking, and non-destructive.
- [ ] Documents any intentional divergence and migration strategy.

### Extension Governance

All design-system changes MUST declare a change type and migration impact:

| Change Type | Example | Semver Guidance | Requirements |
|-------------|---------|-----------------|--------------|
| **Additive** | New optional token, new variant | Minor | Backward compatible; docs and usage examples |
| **Behavioral** | Adjusted interaction timing or defaults | Minor (or major if disruptive) | Rationale, regression review, accessibility check |
| **Breaking** | Token removal/rename, removed variant | Major | Deprecation path, codemod/manual migration, clear cutoff date |

Deprecation policy:
- Mark deprecated in this file first.
- Provide at least one replacement.
- Keep compatibility shims until next planned major.

### Portability Mapping (Canonical Names)

Canonical names are stable. Platform syntax is an adapter concern.

| Concept | Canonical Name | Web CSS | Tailwind | iOS/Swift (example) | Android/Kotlin (example) |
|--------|----------------|---------|----------|---------------------|--------------------------|
| Surface background | `surface-primary` | `--color-surface-primary` | `bg-surface-primary` | `ColorToken.surfacePrimary` | `ColorToken.SurfacePrimary` |
| Primary text | `content-primary` | `--color-content-primary` | `text-content-primary` | `ColorToken.contentPrimary` | `ColorToken.ContentPrimary` |
| Primary border | `edge-primary` | `--color-edge-primary` | `border-edge-primary` | `ColorToken.edgePrimary` | `ColorToken.EdgePrimary` |
| Primary action fill | `action-primary` | `--color-action-primary` | `bg-action-primary` | `ColorToken.actionPrimary` | `ColorToken.ActionPrimary` |
| Raised elevation | `shadow-raised` | `--shadow-raised` | `shadow-raised` | `Elevation.raised` | `Elevation.Raised` |
| Base motion | `duration-base` | `--duration-base` | `duration-base` | `MotionDuration.base` | `MotionDuration.Base` |
| Base spacing step | `space-1` | `--space-1` | `p-1` / `gap-1` | `Spacing.s1` | `Spacing.S1` |

### Global Anti-Patterns

- Using raw brand tokens (`cream`, `sun-yellow`, etc.) in component code.
- Using ambiguous absolute names (`black`, `white`) for non-absolute values.
- Hardcoding color hex values, pixel font sizes, or ad-hoc animation timings.
- Treating Sun/Moon as invert filters instead of mood systems.
- Letting chrome visually dominate the environment layer.
- Shipping Boolean-prop-heavy component APIs when explicit variants are clearer.
- Making discovery features mandatory, persistent without consent, or state-destructive.

---

# Part 1: Design System

## 1. Design Philosophy

### Why This Exists

The corporate web is becoming non-human. Pages are generated, layouts are optimized by algorithm, and content is produced at scale for metrics, not people. In that context, UI/UX becomes a distinctly human design function. Interface design is one of the last places where craft, taste, and emotional intention can still reach a person directly.

Radiants exists because the modern web forgot a quality of attention. The feeling that someone made this for you on purpose. The details are not there because a system produced them, but because a person chose them. Every polished, intentional detail is a quiet declaration: _authored_, not generated. Not optimized. _Made._

The goal of every design decision in this system is **meaning**. Not usability alone, not beauty alone. Usability and beauty serve meaning, but they are not the point. Memorability is how you know meaning landed. If someone forgets the experience as soon as they leave, the design failed, no matter how clean the grid was.

### Core Beliefs

**Nostalgia is the emotional vocabulary.**
Nostalgia is one of the strongest emotions a web experience can evoke, and one of the most misunderstood. It is not retreat. At its best, nostalgia dissolves anxiety by grounding you in something warm and known, or gives you something to carry into the unknown. Radiants uses both registers. The design should sometimes feel like a warm blanket; other times, like a torch you are carrying forward.

The modern web, homogenized and optimized into sameness, amplifies fear of a flattening future. Radiants answers this directly: build toward uncertainty with reverence for the wisdom of the past. The past is full of work dismissed as inefficient that was actually an expression of care. This system honors that work.

**Curation over abundance.**
In a world of infinite generated content, knowledge is no longer the scarce resource. Curation is. Radiants is opinionated. Every design choice is an act of curation, saying _this and not that_. In an age of abundance, signal is the luxury.

**UI is fashion. Software is music.**
Interaction patterns should remain familiar. Nobody should have to relearn basic software to use Radiants. Identity lives in the visual and emotional layer. UI is increasingly an expression of taste, like clothing.

Software production is following the same path music did when studios gave way to laptops and distribution platforms. AI lowers the cost of execution, so the differentiator shifts from access to taste. The hard question is no longer "can this be built?" but "should this exist, and what should it feel like?" Craft does not disappear when tools get easier; it migrates from execution to vision, direction, and care.

**Familiar hands, new skin.**
Radiants reuses old forms in new contexts: desktop windows, record player metaphors, VHS grain. These are not decorative references. They are provocations.

A record-player UI in a streaming world asks: _what does it mean to choose again?_ When everything is instantly accessible and infinitely abundant, deliberate selection becomes the meaningful gesture. The form is familiar so the body knows what to do. The atmosphere, texture, and personality are where meaning lives.

### Philosophy Invariants

These are non-negotiable regardless of platform:

- Design for meaning first; usability and beauty are supporting forces.
- Prioritize curation and intentionality over feature abundance.
- Keep interaction familiar; express identity through visual and emotional direction.
- Preserve authorship signals: details should feel chosen, not generated.

### Art Is the Environment, UI Is the Overlay

These beliefs manifest as a spatial hierarchy. Radiants treats art as the centerpiece. The background canvas, fullscreen video, and dithered textures are the _environment_. UI floats on top as translucent, minimal chrome: functional, present, and never competing with the atmosphere underneath.

**Three-layer model:**

| Layer | Role | Examples |
|-------|------|----------|
| **Environment** | Art, video, canvas — the deepest layer. This is where emotion lives. | WebGL sun, Rad Radio fullscreen video, dither textures |
| **Surface** | Windows, cards, panels — containers for content. The familiar interaction layer. | AppWindow, Card, Dialog, Sheet |
| **Chrome** | Title bars, buttons, controls — minimal and functional. The thinnest layer. | WindowTitleBar, Button, Tabs, Taskbar |

**Rule:** Chrome should never compete with art. When in doubt, reduce chrome.

### Sun Mode / Moon Mode

The design system has two named modes that go beyond light/dark color swapping:

| | Sun Mode (Light) | Moon Mode (Dark) |
|---|---|---|
| **Metaphor** | Harsh overhead sun | Soft ambient moonlight |
| **Shadows** | Sharp pixel-art offsets (directional, hard-edged) | Soft ambient glows (omnidirectional, diffused) |
| **Borders** | Solid ink, high contrast | Translucent cream, subtle |
| **Surfaces** | Warm cream backgrounds | Deep ink backgrounds with selective pure-black elevation |
| **Personality** | Bold, graphic, printwork | Atmospheric, cinematic, neon |

Swapping modes does not just invert colors; it changes the character of every visual element.

### The Discovery Layer

Easter eggs are a first-class design concern. In a web increasingly mediated by AI, where answers are summarized and surfaces are flattened for efficiency, human delight lives in what you _find_, not what is served.

Discovery is user-side curation: choosing to look closer, dig deeper, and notice what was not announced. Radiants should always have more in it than what is visible on first pass.

**Rules for Easter eggs:**
- Delightful, never annoying
- Non-destructive - never alter user data or state
- Session-scoped - reset on page reload unless explicitly persisted
- Never block functionality - always dismissible
- Do not document specific Easter eggs in this file

## 2. Color System

Source: [`tokens.css`](https://github.com/Radiants-DAO/DNA/blob/master/packages/radiants/tokens.css) (brand + semantic) | [`dark.css`](https://github.com/Radiants-DAO/DNA/blob/master/packages/radiants/dark.css) (Moon Mode overrides)

### Brand Palette (Tier 1)

Raw color values. Never use these directly in component code — they exist only to be referenced by semantic tokens.

| Token | Value | Name |
|-------|-------|------|
| `--color-cream` | `#FEF8E2` | Primary warm neutral |
| `--color-ink` | `#0F0E0C` | Primary dark (default dark tone) |
| `--color-pure-black` | `#000000` | Absolute black (reserved) |
| `--color-sun-yellow` | `#FCE184` | Brand accent |
| `--color-sky-blue` | `#95BAD2` | Secondary accent |
| `--color-sunset-fuzz` | `#FCC383` | Warm accent |
| `--color-sun-red` | `#FF6B63` | Error / destructive |
| `--color-mint` | `#CEF5CA` | Success |
| `--color-pure-white` | `#FFFFFF` | Absolute white (reserved) |

> **Deprecated:** `--color-warm-cloud` is removed. Use `--color-cream` instead. They were identical (`#FEF8E2`).

> **Removed aliases (hard fail in CI):** `--color-black`, `--color-white`, `--color-green`, `--color-success-green`, `--glow-green`. Use `--color-ink`, `--color-pure-white`, `--color-mint`, `--color-success-mint`, and `--glow-mint`.

> **Removed:** `--color-success-green-dark`, `--color-warning-yellow-dark`, `--color-error-red-dark` are dead tokens. Use the semantic status tokens (`--color-status-success`, `--color-status-warning`, `--color-status-error`) instead.

### Token Naming Precision Rules

- `ink` means the default dark tone (`#0F0E0C`), not absolute black.
- `pure-black` means absolute black (`#000000`) and SHOULD be used sparingly for deepest Moon Mode surfaces.
- `pure-white` means absolute white (`#FFFFFF`) and SHOULD be used sparingly for hard contrast points.
- `black` and `white` are ambiguous names and MUST NOT be introduced as new canonical tokens.
- Generic hue names SHOULD be avoided for new primitives (prefer `mint`, `amber`, `sky`, etc. over broad names like `green`).
- Raw hue tokens (`mint`, `sun-red`, etc.) are primitives only; component code MUST use semantic tokens (`status-*`, `action-*`, `content-*`, etc.).

### Semantic Tokens (Tier 2)

Purpose-based tokens that flip between Sun Mode and Moon Mode. **All component code MUST use these.**

#### Surface Tokens

| Token | Sun Mode | Moon Mode |
|-------|----------|-----------|
| `--color-surface-primary` | cream | ink |
| `--color-surface-secondary` | ink | cream |
| `--color-surface-tertiary` | sunset-fuzz | `#3D2E1A` |
| `--color-surface-elevated` | pure-white | pure-black |
| `--color-surface-muted` | cream | `rgba(252,225,132, 0.08)` |
| `--color-surface-overlay-subtle` | cream | cream (5% opacity) |
| `--color-surface-overlay-medium` | sun-yellow | cream (10% opacity) |

#### Overlay Tokens

| Token | Sun Mode | Moon Mode |
|-------|----------|-----------|
| `--color-hover-overlay` | sun-yellow | cream (8% opacity) |
| `--color-active-overlay` | sun-yellow | cream (12% opacity) |

Sun Mode opacity policy: overlays are fully opaque primitive colors. In Sun Mode, opacity is reserved for text-secondary and explicitly muted/disabled states.

#### Content Tokens

Content uses a **three-tier opacity hierarchy** in Sun Mode: primary (100%) → secondary (85%) → muted (60%). This gives subtle text differentiation while respecting the 3-color palette. In Moon Mode, cream replaces ink at comparable opacities.

| Token | Sun Mode | Moon Mode |
|-------|----------|-----------|
| `--color-content-primary` | ink (100%) | cream |
| `--color-content-secondary` | ink (85% opacity) | cream (85% opacity) |
| `--color-content-heading` | ink | pure-white |
| `--color-content-muted` | ink (60% opacity) | cream (60% opacity) |
| `--color-content-inverted` | cream | ink |
| `--color-content-link` | sky-blue | sky-blue |

#### Edge Tokens (Borders)

| Token | Sun Mode | Moon Mode |
|-------|----------|-----------|
| `--color-edge-primary` | ink | cream (20% opacity) |
| `--color-edge-muted` | ink (20% opacity) | cream (12% opacity) |
| `--color-edge-hover` | ink (30% opacity) | cream (35% opacity) |
| `--color-edge-focus` | sun-yellow | sun-yellow |

#### Action Tokens

| Token | Sun Mode | Moon Mode |
|-------|----------|-----------|
| `--color-action-primary` | sun-yellow | sun-yellow |
| `--color-action-secondary` | ink | cream |
| `--color-action-destructive` | sun-red | sun-red |
| `--color-action-accent` | sunset-fuzz | sunset-fuzz |

#### Window Chrome Tokens

| Token | Sun Mode | Moon Mode |
|-------|----------|-----------|
| `--color-window-chrome-from` | sun-yellow | ink |
| `--color-window-chrome-to` | cream | ink |

#### Status Tokens

| Token | Value |
|-------|-------|
| `--color-status-success` | mint |
| `--color-status-warning` | sun-yellow |
| `--color-status-error` | sun-red |
| `--color-status-info` | sky-blue |

### Token Usage Rules

<!-- DO -->
```tsx
// DO: Use semantic tokens
<div className="bg-surface-primary text-content-primary border-edge-primary">
  <p className="text-content-secondary">Description text</p>
  <span className="text-content-muted">Metadata</span>
</div>
```

<!-- DON'T -->
```tsx
// DON'T: Use brand tokens in component code
<div className="bg-cream text-ink border-ink">
  <p className="text-ink/85">Description text</p>
</div>
```

<!-- DON'T -->
```tsx
// DON'T: Hardcode hex values
<div className="bg-[#FEF8E2] text-[#0F0E0C]">
```

**Rule:** If you need a color that doesn't exist as a semantic token, propose a new semantic token — don't reach for a brand token.

### Tailwind v4 Gotchas

These are known footguns in Tailwind v4 that AI agents will encounter:

#### `@theme` Block Chaining Rule

All tokens that reference each other via `var()` must be in the **same `@theme` block**. Tailwind v4 only resolves `var()` chains within its own `@theme` processing context. Splitting brand tokens into `@theme inline` (or `:root {}`) while keeping semantic tokens in `@theme` will silently drop some tokens with no error.

<!-- DO -->
```css
/* DO: Keep referencing tokens in the same @theme block */
@theme {
  --color-cream: #FEF8E2;
  --color-surface-primary: var(--color-cream); /* resolves correctly */
}
```

<!-- DON'T -->
```css
/* DON'T: Split tokens across blocks — var() chains break silently */
@theme inline {
  --color-cream: #FEF8E2;
}
@theme {
  --color-surface-primary: var(--color-cream); /* may silently resolve to nothing */
}
```

#### `max-w` T-Shirt Size Bug

In Tailwind v4, `max-w-{T-shirt-size}` classes resolve to tiny spacing values, NOT the old content-width values:

| Class | Tailwind v4 value | Expected (v3) |
|-------|-------------------|---------------|
| `max-w-md` | 16px | 448px |
| `max-w-lg` | 24px | 512px |
| `max-w-xl` | 32px | 576px |
| `max-w-2xl` | 48px | 672px |

<!-- DO -->
```tsx
// DO: Use explicit rem values for max-width
<div className="max-w-[28rem]">448px container</div>
<div className="max-w-[32rem]">512px container</div>
<div className="max-w-[42rem]">672px container</div>
```

<!-- DON'T -->
```tsx
// DON'T: T-shirt sizes produce wrong values in Tailwind v4
<div className="max-w-md">This is 16px, not 448px</div>
<div className="max-w-2xl">This is 48px, not 672px</div>
```

## 3. Typography

Source: [`typography.css`](https://github.com/Radiants-DAO/DNA/blob/master/packages/radiants/typography.css) (base styles) | [`fonts.css`](https://github.com/Radiants-DAO/DNA/blob/master/packages/radiants/fonts.css) (font-face declarations)

### Fonts

| Semantic Name | Font Family | Tailwind Class | Usage |
|---------------|-------------|----------------|-------|
| `--font-heading` | Joystix Monospace | `font-joystix` | **Default body font.** Headings, buttons, labels, all UI chrome |
| `--font-sans` | Mondwest | `font-mondwest` | Paragraphs, descriptions, form inputs, long-form text |
| `--font-mono` | PixelCode | `font-mono` | Code blocks, monospace data |

> **Important:** The default body font is Joystix (the pixel/heading font), NOT Mondwest. This is intentional — the retro OS aesthetic means most UI text uses the pixel font. Mondwest is applied explicitly where readability of longer text matters. Do not "fix" this to a conventional sans-serif default.

### Type Scale

rem-based on a uniform 0.25rem (4px) grid. The entire scale flexes with the root font size clamp.

| Token | Value | At 16px root |
|-------|-------|-------------|
| `--font-size-xs` | `0.5rem` | 8px |
| `--font-size-sm` | `0.75rem` | 12px |
| `--font-size-base` | `1rem` | 16px |
| `--font-size-lg` | `1.25rem` | 20px |
| `--font-size-xl` | `1.5rem` | 24px |
| `--font-size-2xl` | `1.75rem` | 28px |
| `--font-size-3xl` | `2rem` | 32px |

### Root Font Size Clamp

```css
html {
  font-size: clamp(14px, 1vw + 12px, 16px);
}
```

This means:
- On narrow viewports (~200px): base = 14px
- On wide viewports (>400px): base = 16px
- All rem values scale proportionally

### Usage Rules

<!-- DO -->
```tsx
// DO: Use Joystix for UI chrome (it's the default, no class needed)
<button className="text-sm uppercase">Submit</button>
<h2 className="text-lg">Section Title</h2>

// DO: Apply Mondwest explicitly for body text
<p className="font-mondwest text-base">This is a longer description...</p>
```

<!-- DON'T -->
```tsx
// DON'T: Override the default font to sans on UI elements
<button className="font-mondwest text-sm">Submit</button>

// DON'T: Use px-based font sizes
<p className="text-[14px]">Text</p>

// DON'T: Use deprecated text-2xs naming from pre-migration examples
<span className="text-2xs">Deprecated naming — use text-xs instead</span>
```

## 4. Shadow & Elevation

Source: [`tokens.css`](https://github.com/Radiants-DAO/DNA/blob/master/packages/radiants/tokens.css) (Sun Mode shadows) | [`dark.css`](https://github.com/Radiants-DAO/DNA/blob/master/packages/radiants/dark.css) (Moon Mode glows)

Shadows tell an elevation story. In Sun Mode, a harsh overhead sun casts sharp directional shadows — higher elements cast longer offsets. In Moon Mode, objects emit soft ambient glow — higher elements radiate wider halos.

### Elevation Scale (7 levels)

| Level | Token | Sun Mode | Moon Mode | Used by |
|-------|-------|----------|-----------|---------|
| **Inset** | `shadow-inset` | `inset 0 0 0 1px ink` | `inset 0 0 8px glow-subtle` | Slider tracks, recessed containers |
| **Surface** | `shadow-surface` | `0 1px 0 0 ink` | `0 0 2px glow-subtle` | Nested containers, sections within cards |
| **Resting** | `shadow-resting` | `0 2px 0 0 ink` | `0 0 6px glow-subtle` | Buttons at rest, badges, inputs |
| **Lifted** | `shadow-lifted` | `0 4px 0 0 ink` | `0 0 10px glow + 20px subtle` | Interactive hover (buttons, selects, switches) — vertical only |
| **Raised** | `shadow-raised` | `2px 2px 0 0 ink` | `0 0 10px glow + 20px subtle` | Cards, panels, popovers — diagonal |
| **Floating** | `shadow-floating` | `4px 4px 0 0 ink` | `0 0 12px glow + 24px subtle` | Windows, dialogs, sheets — diagonal |
| **Focused** | `shadow-focused` | `4px 4px 0 0 ink` | `0 0 12px + 24px + 36px glow` | Active/focused window only |

### Status Glows

Colored variants of the `raised` level for status feedback:

| Token | Sun Mode | Moon Mode |
|-------|----------|-----------|
| `shadow-glow-success` | `2px 2px 0 0 mint` | `0 0 8px glow-mint` |
| `shadow-glow-error` | `2px 2px 0 0 sun-red` | `0 0 8px glow-sun-red` |
| `shadow-glow-info` | `2px 2px 0 0 sky-blue` | `0 0 8px glow-sky-blue` |

### Usage Rules

<!-- DO -->
```tsx
// DO: Match shadow level to component role
<Card className="shadow-raised">...</Card>
<Dialog className="shadow-floating">...</Dialog>
<Button className="shadow-resting hover:shadow-raised">...</Button>
```

<!-- DON'T -->
```tsx
// DON'T: Use raw shadow values
<div className="shadow-[4px_4px_0_0_#0F0E0C]">...</div>

// DON'T: Over-elevate — a card shouldn't float like a window
<Card className="shadow-floating">...</Card>

// DON'T: Mix elevation metaphors — no glows in Sun Mode
<div className="shadow-resting dark:shadow-[0_0_20px_gold]">...</div>
```

**Rule:** Shadows are managed entirely by the token system. The same utility class produces pixel offsets in Sun Mode and ambient glows in Moon Mode automatically. Never override shadow values per-mode in component code.

## 5. Motion & Animation

### Duration Scale

| Token | Value | Use |
|-------|-------|-----|
| `--duration-instant` | `0ms` | Immediate state changes, reduced-motion fallback |
| `--duration-fast` | `100ms` | Hover states, focus rings, micro-interactions |
| `--duration-base` | `150ms` | Standard transitions (opacity, color, border) |
| `--duration-moderate` | `200ms` | Medium complexity (accordion expand, tab switch) |
| `--duration-slow` | `300ms` | Complex animations (dialog open, sheet slide, toast enter) |

**Hard ceiling:** No animation may exceed 300ms.

### Easing

| Token | Value | Use |
|-------|-------|-----|
| `--easing-default` | `cubic-bezier(0, 0, 0.2, 1)` | All transitions |

**Rule:** Ease-out only. No ease-in, no ease-in-out, no linear (except progress bars). One easing curve for the entire system.

### Sun Mode Motion: Snap on Input, Ease on State

Old hardware gave instant mechanical feedback — keys clicked, switches snapped, buttons bottomed out. But mechanical _movement_ was smooth: dials turned with inertia, sliders glided along tracks, the carriage return swept across. No ease-in on pressing a key — it snapped. But the carriage return had inertia.

RDNA Sun Mode follows this same split:

| Category | Trigger | Easing | Examples |
|----------|---------|--------|----------|
| **Cursor response** | hover, press, focus | Instant (no transition) | Button lift + shadow, switch thumb lift, tab highlight |
| **State transition** | toggle, slide, open/close | Eased (`duration-base`) | Switch thumb slide, switch track color, accordion expand |

**Rules:**

- Interactive elements MUST NOT apply `transition` to hover/active/focus feedback in Sun Mode. The snap is the point.
- State transitions (checked, selected, expanded) SHOULD ease with `duration-base` to communicate that the change landed.
- Components with both cursor feedback _and_ state transitions (e.g., Switch) MUST separate the two onto different CSS properties so they can be independently eased.

**Implementation pattern (Switch example):**
- Thumb slide (state) → `transition-[translate] duration-150` on `translate-x`
- Thumb hover lift (cursor) → `top` property (no transition, snaps)
- Track color (state) → `transition-colors duration-150`

### Moon Mode Motion

Moon Mode eases everything. Glow effects need smooth transitions to feel ambient — the snap aesthetic doesn't apply. `dark.css` provides `transition` declarations on all `[data-variant]` selectors, overriding the Sun Mode no-transition default.

### Reduced Motion

All durations multiply by `--duration-scalar`:
- Default: `--duration-scalar: 1`
- `prefers-reduced-motion: reduce`: `--duration-scalar: 0`

When scalar is 0, all transitions resolve to `0ms` — instant state changes with no animation.

### Defined Animations

| Class | Effect | Duration |
|-------|--------|----------|
| `animate-fadeIn` | Opacity 0 → 1 | `--duration-base` |
| `animate-scaleIn` | Scale 0.95 + opacity → 1 | `--duration-base` |
| `animate-slideIn` | TranslateX(100%) → 0 + opacity | `--duration-moderate` |
| `animate-slide-in-right` | TranslateX(100%) → 0 | `--duration-moderate` |

> **Note:** These are enter-only animations. No exit animations are defined — elements are removed immediately.

### Usage Rules

<!-- DO -->
```tsx
// DO: Use duration tokens via Tailwind
<div className="transition-colors duration-fast">...</div>
<div className="transition-opacity duration-base ease-default">...</div>
```

<!-- DON'T -->
```tsx
// DON'T: Hardcode durations
<div className="transition-all duration-[250ms]">...</div>

// DON'T: Use non-standard easing
<div className="ease-in-out">...</div>

// DON'T: Exceed 300ms
<div className="duration-[500ms]">...</div>
```

## 6. Interactive Elements

### Size Scale

All interactive elements (buttons, inputs, selects) share a consistent height scale on an 8px grid:

| Size | Height | Use |
|------|--------|-----|
| `sm` | 24px (`h-6`) | Compact UI: title bar buttons, inline actions, tight layouts |
| `md` | 32px (`h-8`) | Standard: most buttons, inputs, selects |
| `lg` | 40px (`h-10`) | Hero CTAs, primary form inputs, prominent actions |

### Borders

**One width: 1px.** No exceptions.

All containers, inputs, cards, dialogs, alerts, and windows use `border` (1px). There is no `border-2` in the system.

| Token | Use |
|-------|-----|
| `border-edge-primary` | Standard borders (inputs, cards, windows, buttons) |
| `border-edge-muted` | Subtle separators (dividers, internal section borders) |
| `border-edge-hover` | Hover state borders |
| `border-edge-focus` | Focus state (sun-yellow in both modes) |

### Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `rounded-xs` | 2px | Checkbox |
| `rounded-sm` | 4px | Buttons, inputs, badges, toasts |
| `rounded-md` | 8px | Cards, windows, dialogs |
| `rounded-full` | 50% | Switch tracks, Radio buttons |

### Focus Rings

All interactive elements use a consistent focus ring:

```css
ring-2 ring-edge-focus ring-offset-1
```

Sun-yellow in both modes — high contrast against cream and ink backgrounds.

**Touch targets:** Minimum 44px (WCAG AA). All `sm` (24px) buttons must have padding or margin to reach 44px effective tap area.

### Scrollbar

The custom scrollbar is a signature design element:

| Part | Sun Mode | Moon Mode |
|------|----------|-----------|
| **Track** | SVG dot pattern background | Transparent |
| **Thumb** | Cream fill, 1px ink inset border | 15% cream, no dot pattern |
| **Thumb hover** | Sun-yellow fill | 25% cream |
| **Width** | Oversized container (1.75rem) with border-clip trick for visual narrowing |

Apply via `.custom-scrollbar` utility class. Dark mode variant: `.custom-scrollbar-dark`.

### Usage Rules

<!-- DO -->
```tsx
// DO: Use consistent size prop across element types
<Button size="md">Save</Button>
<Input size="md" />
<Select size="md" />

// DO: Use 1px borders everywhere
<Card className="border border-edge-primary">...</Card>
<Dialog className="border border-edge-primary">...</Dialog>
```

<!-- DON'T -->
```tsx
// DON'T: Use border-2 on any component
<Dialog className="border-2 border-edge-primary">...</Dialog>
<Alert className="border-2">...</Alert>

// DON'T: Mix size scales
<Button size="lg">Next to<Input size="sm" /></Button>

// DON'T: Use hardcoded heights
<button className="h-[36px]">Odd height</button>
```

## 7. Component Architecture

Source: [`components/core/`](https://github.com/Radiants-DAO/DNA/tree/master/packages/radiants/components/core)

### Three-File Pattern

Every component in `@rdna/radiants` follows this structure:

```
ComponentName/
├── ComponentName.tsx          # Implementation
├── ComponentName.schema.json  # Prop types and AI interface
└── ComponentName.dna.json     # Token bindings per variant
```

### Tiered Composition Model

Choose the pattern based on component complexity:

| Tier | Pattern | When | Example |
|------|---------|------|---------|
| **Simple** | Flat props + variant enum | 1-2 variants, no internal structure | `<Button variant="primary" size="md">` |
| **Container** | Children composition | Named regions, no shared state | `<Card><CardHeader /><CardBody /></Card>` |
| **Complex** | Compound + Context | Shared internal state, interactive sub-parts | `<Dialog.Provider><Dialog.Trigger /><Dialog.Content /></Dialog.Provider>` |

### Variant Definitions with CVA

All component variants MUST use [class-variance-authority](https://cva.style/docs) (CVA) for type-safe variant resolution:

<!-- DO -->
```tsx
// DO: Define variants with CVA
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-heading uppercase rounded-sm cursor-pointer border border-edge-primary',
  {
    variants: {
      variant: {
        primary: 'bg-action-primary text-content-primary shadow-resting hover:shadow-raised',
        secondary: 'bg-surface-secondary text-content-inverted shadow-resting hover:shadow-raised',
        outline: 'bg-transparent hover:bg-surface-muted',
        ghost: 'border-transparent hover:bg-hover-overlay',
      },
      size: {
        sm: 'h-6 px-2 text-xs',
        md: 'h-8 px-3 text-sm',
        lg: 'h-10 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);
```

<!-- DON'T -->
```tsx
// DON'T: Manual conditional class building
const classes = [
  'inline-flex items-center',
  variant === 'primary' ? 'bg-sun-yellow' : '',
  variant === 'secondary' ? 'bg-ink text-cream' : '',
  size === 'sm' ? 'h-8' : size === 'lg' ? 'h-8' : 'h-8', // all the same!
].join(' ');
```

### No Boolean Prop Proliferation

<!-- DO -->
```tsx
// DO: Create explicit variant components
<ThreadComposer channelId="abc" />
<EditMessageComposer messageId="xyz" />
```

<!-- DON'T -->
```tsx
// DON'T: Boolean props create exponential state space
<Composer isThread isDMThread={false} isEditing={false} isForwarding />
```

### React 19 Rules

- **No `forwardRef`** — ref is a regular prop in React 19
- **Use `use()` hook** for reading Context (not `useContext`)
- Children composition over render props for static structure

### State Management

**Two lanes:**

| Lane | Mechanism | Scope | Examples |
|------|-----------|-------|---------|
| **Component UI state** | React Context (as DI interface) | Local to a compound component tree | Dialog open/close, Accordion expanded, Select highlighted |
| **Application state** | Zustand (slices) | Global, cross-component | Windows, preferences, radio playback, mock data |

Context is dependency injection, not state management. The Provider decides the state implementation (useState, Zustand, server sync). UI sub-components consume the interface.

<!-- DO -->
```tsx
// DO: Context for compound component internal state
const DialogContext = createContext<DialogContextValue | null>(null);

function DialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <DialogContext value={{ open, setOpen }}>
      {children}
    </DialogContext>
  );
}

// DO: Zustand for app-level state
const useRadOSStore = create<RadOSStore>()((...args) => ({
  ...createWindowsSlice(...args),
  ...createPreferencesSlice(...args),
}));
```

<!-- DON'T -->
```tsx
// DON'T: Context for global/cross-component state
const AppContext = createContext<{ windows: Window[], preferences: Prefs }>(null);

// DON'T: Zustand for component-local UI state
const useAccordionStore = create(() => ({ openItems: new Set() }));
```

## 8. Spacing

Use Tailwind's native 4px grid directly. No custom spacing tokens.

| Tailwind | Value | Common use |
|----------|-------|-----------|
| `p-1` / `gap-1` | 4px | Tight gaps (icon + label) |
| `p-2` / `gap-2` | 8px | Standard gap (button groups, form fields) |
| `p-3` / `gap-3` | 12px | Card internal padding |
| `p-4` / `gap-4` | 16px | Window content padding, section spacing |
| `p-6` / `gap-6` | 24px | Large section spacing |
| `p-8` / `gap-8` | 32px | Page-level spacing |

### Usage Rules

<!-- DO -->
```tsx
// DO: Use Tailwind spacing utilities from the 4px grid
<div className="flex gap-2">
  <Button>Save</Button>
  <Button variant="outline">Cancel</Button>
</div>
<Card className="p-4">
  <CardHeader className="pb-3">...</CardHeader>
  <CardBody>...</CardBody>
</Card>
```

<!-- DON'T -->
```tsx
// DON'T: Arbitrary spacing values off the 4px grid
<div className="p-[7px] gap-[13px]">...</div>

// DON'T: Inline styles for spacing
<div style={{ padding: '10px', gap: '15px' }}>...</div>
```

## 9. Accessibility

### Approach: Pragmatic

RDNA targets practical accessibility for a creative/art project — not enterprise WCAG compliance. Cover the basics well.

### What We Do

- **Focus rings** on all interactive elements: `ring-2 ring-edge-focus ring-offset-1` (sun-yellow, visible in both modes)
- **ARIA labels** on icon-only buttons and non-text interactive elements
- **Escape to close** all overlays (dialogs, sheets, menus, start menu)
- **Reduced motion** via `--duration-scalar: 0` when `prefers-reduced-motion: reduce`
- **Touch targets** minimum 44px effective area (WCAG AA)

### What We Don't Do

- No keyboard shortcuts for window management (conflicts with OS shortcuts)
- No full screen reader navigation optimization
- No WCAG AAA color contrast targets (the cream/yellow palette doesn't support it)

### Usage Rules

<!-- DO -->
```tsx
// DO: ARIA labels on icon-only buttons
<Button variant="ghost" size="sm" iconOnly aria-label="Close window">
  <Icon name="close" />
</Button>

// DO: Respect reduced motion
<div className="transition-colors duration-base">
  {/* duration-base resolves to 0ms when reduced motion is on */}
</div>
```

<!-- DON'T -->
```tsx
// DON'T: Icon buttons without labels
<Button variant="ghost" size="sm" iconOnly>
  <Icon name="close" />
</Button>

// DON'T: Hardcode animation durations (bypasses reduced motion)
<div style={{ transition: 'all 200ms ease-out' }}>...</div>
```

## 10. Machine Enforcement

These rules are enforced by `eslint-plugin-rdna`. Rule names map 1:1 to policy.

| Rule | Enforces | Severity |
|---|---|---|
| `rdna/no-hardcoded-colors` | Ban hex/rgb/hsl literals and arbitrary Tailwind color classes | warn in shared configs, target: error |
| `rdna/no-hardcoded-spacing` | Ban arbitrary spacing values (`p-[13px]`, inline pixel spacing); allow standard Tailwind scale classes for now | warn in shared configs, target: error |
| `rdna/no-hardcoded-typography` | Ban raw font-size/font-weight utilities | warn in shared configs, target: error |
| `rdna/prefer-rdna-components` | Ban raw HTML elements when RDNA equivalent exists | warn in shared configs, target: error |
| `rdna/no-removed-aliases` | Ban removed token aliases | warn in shared configs, target: error |

### How to run

```bash
pnpm lint:design-system          # Full scan of all in-scope paths
pnpm lint:design-system:staged   # Staged files only (pre-commit)
```

### Exceptions

Use `// eslint-disable-next-line rdna/<rule> -- reason:<reason> owner:<team-slug> expires:YYYY-MM-DD issue:DNA-123` for intentional violations.

Exception policy:
- Only `eslint-disable-next-line` is allowed for `rdna/*` rules.
- `owner` MUST be a lowercase team slug such as `design-system` or `frontend-platform`.
- `issue` MUST be either a `DNA-123` style ticket id or a full `https://...` URL.
- `expires` MUST be a real UTC date in `YYYY-MM-DD` form. Dates earlier than today are invalid.
- New `rdna/*` exceptions are reported in CI and require explicit code-review approval.

### Scope

Enforced in:
- `packages/radiants/components/core/**/*.tsx` (token rules only — wrapper rule exempt for internals)
- `apps/rad-os/**/*.tsx`
- `apps/radiator/**/*.tsx`
- Any package/app with `eslint-plugin-rdna` in its ESLint config

Not enforced (yet):
- `apps/monolith-hackathon/` (separate theme, separate migration)
- `tools/` (non-UI code)

---

# Part 2: RadOS Application

> These patterns apply specifically to the rad-os desktop application, not to all RDNA consumers.

## 10. Window System

### Window Chrome

| Property | Value |
|----------|-------|
| Border | `border border-edge-primary rounded-md` |
| Shadow | `shadow-floating` (active: `shadow-focused`) |
| Background | Gradient: `linear-gradient(0deg, window-chrome-from, window-chrome-to)` |
| Title bar height | Compact: `pt-[4px] pb-1 pl-4 pr-1` |
| Min size | 300 x 200px |
| Content max height | `--app-content-max-height` CSS variable |

### Window Chrome in Sun/Moon Mode

| | Sun Mode | Moon Mode |
|---|---|---|
| Gradient | Yellow-to-cream (bottom up) | Flat ink |
| Focused shadow | 4px 4px hard ink offset | Multi-layer sun-yellow glow |
| Border | Solid ink | 20% translucent cream |

### Window Behaviors

| Behavior | Description |
|----------|-------------|
| **Open** | Appears at default position, cascaded if multiple |
| **Focus** | Click anywhere → highest z-index, receives `data-focused` attribute |
| **Minimize** | Hides window, restore from Start Menu |
| **Close** | Removes window, state persists for reopening |
| **Drag** | Title bar is drag handle (`data-drag-handle`) |
| **Resize** | Per-app configuration (some apps fixed size) |
| **Fullscreen** | Toggle via title bar button |
| **Edge snap** | Drag to left/right screen edge → outline appears → snaps to half-screen width |

### Window-Internal Layout

**Critical rule:** Do not use viewport breakpoints (`md:block`, `lg:flex`) for layout inside windows. Tailwind breakpoints fire on the viewport width, not the window width. A window can be any size regardless of viewport.

**Container queries are built in.** Both `AppWindow` and `MobileAppModal` set `@container` on their content wrapper. Use Tailwind v4 container query variants (`@sm:`, `@md:`, `@lg:`, etc.) for responsive layout inside any app — they fire based on the window's actual width.

Container query breakpoints (Tailwind v4 defaults):
- `@xs` — 320px (minimum window width)
- `@sm` — 384px
- `@md` — 448px
- `@lg` — 512px
- `@xl` — 576px
- `@2xl` — 672px

This means **mobile optimization is mostly handled by the window manager**, not by individual apps. On mobile, `MobileAppModal` renders apps full-screen — the same `@` breakpoints fire correctly at the device width. On desktop, they fire at whatever width the user drags the window to.

<!-- DO -->
```tsx
// DO: Container query breakpoints — respond to window width
<div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">...</div>
<span className="hidden @sm:inline">Extra detail</span>

// DO: Fixed layout when the window size is known
<div className="flex flex-col">
  <nav className="w-48 shrink-0">...</nav>
  <main className="flex-1 overflow-auto">...</main>
</div>
```

<!-- DON'T -->
```tsx
// DON'T: Viewport breakpoints inside windows — they respond to browser width, not window width
<nav className="hidden md:block w-48">...</nav>
<main className="md:ml-48">...</main>
<div className="grid grid-cols-1 sm:grid-cols-2">...</div>
```

### Window Limit

Soft limit of 5 windows. Opening a 6th shows a toast warning about performance but does not block.

### Title Bar Buttons

All use `Button variant="ghost" size="md" iconOnly`:
- Help (optional, per-app config)
- MockStates (dev only, per-app config)
- Widget/PiP (optional)
- Fullscreen toggle
- Copy link
- Close

## 11. Desktop & Taskbar

### Desktop
- Icons in grid layout, left side
- Double-click to open (no single-click selection)
- Icon positions saved to localStorage

### Taskbar
- Fixed at bottom of viewport, 48px height
- **Start Button** → opens Start Menu
- **Window Buttons** → shown only when >1 window open
- **Social Links** → Twitter, Discord, GitHub (GitHub hidden on mobile)
- **System Tray** → Invert toggle, volume (if Rad Radio active)
- **Clock** → Real time, HH:MM format, updates every minute

### Start Menu
- Full-screen overlay on mobile
- Popup menu on desktop
- Sections: Apps, Connect (social links)

### Usage Rules

<!-- DO -->
```tsx
// DO: Use APP_REGISTRY as the single source of app metadata
const apps = Object.values(APP_REGISTRY);
const icon = APP_REGISTRY[appId].icon;
```

<!-- DON'T -->
```tsx
// DON'T: Hardcode app lists or duplicate registry data
const apps = [
  { id: 'brand', title: 'Brand Assets', icon: <BrandIcon /> },
  { id: 'radio', title: 'Rad Radio', icon: <RadioIcon /> },
];
```

## 12. App Registration

All apps register in `lib/constants.tsx` via `APP_REGISTRY`:

```typescript
const APP_REGISTRY: Record<AppId, AppConfig> = {
  [APP_IDS.BRAND]: {
    id: APP_IDS.BRAND,
    title: 'Brand Assets',
    icon: <RadMarkIcon size={20} />,
    component: BrandAssetsApp,
    resizable: true,
    defaultSize: { width: 800, height: 600 },
    contentPadding: false,
  },
  // ...
};
```

### AppConfig Shape

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `AppId` | Yes | Unique identifier, used in URL hash |
| `title` | `string` | Yes | Window title bar text |
| `icon` | `ReactNode` | Yes | Icon for desktop, taskbar, start menu |
| `component` | `ComponentType<AppProps>` | Yes | Lazy-loaded app component |
| `resizable` | `boolean` | Yes | Whether window can be resized |
| `defaultSize` | `{ width, height }` | No | Initial window dimensions |
| `contentPadding` | `boolean` | No | Bottom padding below scroll area (default: true) |
| `helpConfig` | object | No | Help panel configuration |
| `mockStatesConfig` | object | No | Mock state switcher (dev only) |
| `showWidgetButton` | `boolean` | No | PiP/widget mode in title bar |

## 13. Hash Routing

```
https://rados.app/#brand           → Opens Brand Assets
https://rados.app/#brand,manifesto → Opens multiple windows
```

- Valid IDs open windows; invalid IDs silently ignored
- Opening/closing updates URL hash
- Comma-separated for multiple windows

## 14. Mobile (Unresolved)

> **Status:** Mobile aesthetic is not yet defined. This section is a placeholder.

**Current behavior (to be redesigned):**
- Windows → fullscreen modals (`MobileAppModal`)
- Taskbar → simplified (Start button + essential icons)
- Desktop icons → horizontal row at top
- Start Menu → full-screen overlay
- Breakpoint: 768px

**Open questions:**
- What is the mobile-native aesthetic for Radiants?
- How does "art is the environment" translate to mobile?
- Does the window metaphor work on mobile at all?

Mobile design requires its own dedicated brainstorm session.

---

# Part 3: Hard-Won Rules

> These rules were extracted from recurring bugs across multiple development sessions. Each one caused repeated debugging cycles before the root cause was identified. Treat them as load-bearing.

## 15. Z-Index Scale

Without a defined scale, every agent invents values. One session uses `z-5`, another `z-[999]`, another `z-50`. Then they collide and elements become unclickable.

### RadOS Stacking Order

| Band | Range | Layer | Notes |
|------|-------|-------|-------|
| `base` | `0` | Background (WebGL, canvas art) | Always bottom |
| `desktop` | `10` | Desktop icons | Above background only |
| `windows` | `100–199` | AppWindows | Dynamic — `useWindowManager` assigns within this range for focus ordering |
| `chrome` | `200` | Taskbar | Always above all windows |
| `menus` | `300` | Start Menu, dropdown menus | Above taskbar |
| `toasts` | `400` | Toast notifications | Above menus, always visible |
| `modals` | `500` | MobileAppModal, Dialog portals | Highest interactive layer |
| `system` | `900` | Invert overlay, system-level effects | Non-interactive, covers everything |

### In-App Z-Indexes

Panels, overlays, and controls _within_ a window use z-10/z-20/z-30 **relative to the window's own stacking context**. Since each AppWindow creates a stacking context via its positioned + z-indexed root, internal values don't leak to the global scale.

<!-- DO -->
```tsx
// DO: Use defined bands
<div className="fixed bottom-0 z-[200]">Taskbar</div>
<div className="fixed top-4 right-4 z-[400]">Toast container</div>

// DO: In-app panels use low relative values
<div className="absolute inset-0 z-10">Panel overlay within window</div>
```

<!-- DON'T -->
```tsx
// DON'T: Arbitrary high values
<div className="z-[9999]">I just want to be on top</div>
<div className="z-[999]">Me too</div>

// DON'T: Global-scale values inside a window
<div className="z-[300]">Panel inside AppWindow — this bleeds into global scale</div>
```

## 16. Pointer-Events on Overlay Layers

**The bug:** A full-viewport positioned element (for layout/decoration) has `pointer-events: auto` by default. Everything underneath becomes unclickable. This caused "still unclickable" bugs across 3+ separate debugging arcs in monolith, flow, and rad-os.

**The rule:** Any positioned element covering a large area that is NOT itself interactive MUST have `pointer-events: none`. Its interactive children get `pointer-events: auto`.

<!-- DO -->
```tsx
// DO: Full-viewport containers are non-interactive, children opt in
<div className="absolute inset-0 z-[100] pointer-events-none">
  {/* This overlay covers the viewport for positioning but doesn't block clicks */}
  <div className="pointer-events-auto">
    {/* Only this child receives mouse events */}
    <AppWindow />
  </div>
</div>
```

<!-- DON'T -->
```tsx
// DON'T: Full-viewport overlay without pointer-events: none
<div className="absolute inset-0 z-[100]">
  {/* BLOCKS ALL CLICKS to elements below — desktop icons, background, etc */}
  <AppWindow />
</div>
```

**When to apply:** Every time you write `absolute inset-0`, `fixed inset-0`, or any positioned element that covers more than its visible content, ask: "Should this block clicks?" If no → `pointer-events-none`.

## 17. Icon Source — No Emojis, Ever

**The rule:** All visual symbols in RDNA are icons, never emojis. Emojis MUST NOT appear anywhere in the UI — not in buttons, labels, headings, toasts, badges, empty states, or placeholder text. No exceptions. Emojis break visual consistency, render differently across platforms, and undermine the design system's typographic control.

Use an icon from [`@rdna/radiants/icons`](https://github.com/Radiants-DAO/DNA/tree/master/packages/radiants/components/icons) instead. The icon set is built on a 24x24 grid with 2px stroke — see the [icon components source](https://github.com/Radiants-DAO/DNA/tree/master/packages/radiants/components/icons) and [icon assets](https://github.com/Radiants-DAO/DNA/tree/master/packages/radiants/assets/icons) for the full inventory.

### Three icon types

| Type | Import | Use |
|------|--------|-----|
| **CoreIcons** (inline SVGs) | `import { X, Check, Plus } from '@rdna/radiants/icons'` | ~80 pre-rendered icons. Best performance — no network requests. |
| **DesktopIcons** (pixel-art) | `import { RadMarkIcon, TreeIcon } from '@rdna/radiants/icons'` | Brand-specific pixel art icons for desktop, taskbar, start menu. |
| **Dynamic Icon** (runtime SVG loader) | `import { Icon } from '@rdna/radiants/icons'` | `<Icon name="icon-name" />` — loads from `/assets/icons/`. Use for custom or less common icons. |

### Priority order

1. **CoreIcons** — check if the icon exists in the barrel export first
2. **Dynamic Icon** — use `<Icon name="..." />` for icons in the asset folder
3. **DesktopIcons** — use for brand/pixel-art icons only
4. **Never** reach for lucide-react, heroicons, or any external icon library

<!-- DO -->
```tsx
// DO: Import from radiants
import { X, Check, ChevronDown } from '@rdna/radiants/icons';
import { Icon } from '@rdna/radiants/icons';

<X size={16} />
<Icon name="broadcast-dish" size={20} />
```

<!-- DON'T -->
```tsx
// DON'T: Import from external icon libraries
import { X } from 'lucide-react';
import { XMarkIcon } from '@heroicons/react/24/solid';
```

## 18. CSS Unit Rules

Mixed `px`/`em`/`rem` was a recurring source of inconsistency. Here are the definitive rules:

| Context | Unit | Why |
|---------|------|-----|
| **Font sizes** | `rem` (via Tailwind tokens) | Respects root clamp — scales with viewport |
| **Spacing/padding** | Tailwind utilities (`p-4`, `gap-2`) | Resolves to rem internally on the 4px grid |
| **Borders** | `1px` | Only place px is correct — sub-pixel borders render inconsistently |
| **Shadows** | `px` in token definitions | Shadow offsets are fixed visual effects, not scalable |
| **Max-width** | `rem` (e.g., `max-w-[28rem]`) | Scales with root. See Tailwind v4 `max-w` gotcha in Section 2. |
| **Inline styles** | Avoid entirely | Use Tailwind utilities. If forced, use `rem`. |

<!-- DO -->
```tsx
// DO: rem-based via Tailwind tokens
<p className="text-base p-4 max-w-[32rem]">Content</p>

// DO: px only for borders
<div className="border border-edge-primary">1px border</div>
```

<!-- DON'T -->
```tsx
// DON'T: px for font sizes or spacing
<p style={{ fontSize: '14px', padding: '16px' }}>Content</p>

// DON'T: em units anywhere
<div style={{ marginBottom: '1.5em' }}>Content</div>

// DON'T: Arbitrary px values in Tailwind
<div className="text-[14px] p-[12px] mt-[18px]">Breaks the grid</div>
```

## 19. Dark Mode Completeness

**The bug:** An agent adds a new semantic token to `tokens.css` but forgets to add the dark mode override in `dark.css`. The token works in Sun Mode and silently falls back to the light value in Moon Mode.

**The rule:** Every semantic token in `tokens.css` that changes between modes MUST have a corresponding override in `dark.css`. There are no exceptions.

### Parity checklist

When adding or modifying tokens:

1. Add the token to `tokens.css` (in the `@theme` block)
2. **Immediately** add its dark mode override to `dark.css`
3. Verify both modes visually — don't assume the dark value is correct

### Tokens that DON'T need dark overrides

Some tokens are mode-invariant (same in both modes):
- `--color-action-primary` (sun-yellow in both)
- `--color-edge-focus` (sun-yellow in both)
- `--color-content-link` (sky-blue in both)
- `--color-status-*` tokens (status colors don't change per mode)

If a token is intentionally the same in both modes, add a comment in `dark.css` documenting this decision so future agents don't "fix" it.

<!-- DO -->
```css
/* tokens.css */
@theme {
  --color-surface-new: var(--color-cream);
}

/* dark.css — IMMEDIATELY add the override */
.dark {
  --color-surface-new: #1A1A18;
}
```

<!-- DON'T -->
```css
/* tokens.css */
@theme {
  --color-surface-new: var(--color-cream);
}

/* dark.css — nothing added. Moon Mode silently shows cream on ink. */
```

## 20. Font Source

**The bug:** System fonts like SF Mono, Consolas, or Arial crept into `@theme` token definitions. The `@theme` block is where RDNA's design fonts live — it's the design system's font authority.

**The rule:**

| Location | Allowed fonts |
|----------|---------------|
| `@theme` block (`--font-*` tokens) | Joystix, Mondwest, PixelCode **only** |
| `font-family` CSS stack (fallbacks) | Design font first, then generic: `font-family: 'Joystix Monospace', monospace` |
| `@font-face` declarations | Every declared font MUST have a corresponding `.woff2` file in `packages/radiants/fonts/` |

<!-- DO -->
```css
/* DO: Design fonts in @theme, generic fallback in font-family */
@theme {
  --font-heading: 'Joystix Monospace';
  --font-mono: 'PixelCode';
}

body {
  font-family: var(--font-heading), monospace;
}
```

<!-- DON'T -->
```css
/* DON'T: System fonts in @theme */
@theme {
  --font-mono: 'SF Mono', 'Consolas', 'PixelCode';
}

/* DON'T: @font-face without a local woff2 */
@font-face {
  font-family: 'CoolFont';
  src: url('https://fonts.example.com/cool.woff2'); /* No external font URLs */
}
```
