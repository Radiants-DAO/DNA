# RDNA Design System

> Radiant Design Nexus Architecture — the design language for Radiants.

## How to Use This Document

This document is the **canonical source of truth** for the RDNA design system. It defines intent and source-backed implementation contracts. Generated regions are rewritten from `tokens.css`, `dark.css`, `generated/typography-tokens.css`, and `eslint/index.mjs`; when a generated table conflicts with prose, the generated table wins until the source file changes.

**Audience:** Designers, engineers, and AI agents implementing UI.

**Scope:** Part 1 applies to all RDNA consumers. Part 2 links RadOS product-specific behavior to the RadOS spec while retaining portable AppWindow guidance. Part 3 captures cross-cutting hard-won implementation rules.

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
| Surface background | `page` | `--color-page` | `bg-page` | `ColorToken.surfacePrimary` | `ColorToken.SurfacePrimary` |
| Primary text | `main` | `--color-main` | `text-main` | `ColorToken.contentPrimary` | `ColorToken.ContentPrimary` |
| Primary border | `line` | `--color-line` | `border-line` | `ColorToken.edgePrimary` | `ColorToken.EdgePrimary` |
| Primary action fill | `accent` | `--color-accent` | `bg-accent` | `ColorToken.actionPrimary` | `ColorToken.ActionPrimary` |
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
| **Chrome** | Title bars, buttons, controls — minimal and functional. The thinnest layer. | AppWindow chrome, Button, Tabs, Taskbar |

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

<!-- BEGIN GENERATED:color-brand-palette -->
| Token | Value | Usage |
|---|---|---|
| `--color-cream` | `oklch(0.9780 0.0295 94.34)` | Primary warm neutral |
| `--color-ink` | `oklch(0.1641 0.0044 84.59)` | Primary dark tone |
| `--color-pure-black` | `oklch(0.0000 0.0000 0)` | Absolute black, reserved for deepest Moon surfaces |
| `--color-sun-yellow` | `oklch(0.9126 0.1170 93.68)` | Brand accent |
| `--color-sky-blue` | `oklch(0.7701 0.0527 236.81)` | Secondary accent and links |
| `--color-sunset-fuzz` | `oklch(0.8546 0.1039 68.93)` | Warm accent |
| `--color-sun-red` | `oklch(0.7429 0.1568 21.43)` | Error and destructive states |
| `--color-mint` | `oklch(0.9312 0.0702 142.51)` | Success states |
| `--color-pure-white` | `oklch(99.1% 0.012 91.5)` | Warm white, reserved for hard contrast |
<!-- END GENERATED:color-brand-palette -->

> **Deprecated:** `--color-warm-cloud` is removed. Use `--color-cream` instead. They were identical (`#FEF8E2`).

> **Removed aliases (hard fail in CI):** `--color-black`, `--color-white`, `--color-green`, `--color-success-green`, `--glow-green`. Use `--color-ink`, `--color-pure-white`, `--color-mint`, `--color-success-mint`, and `--glow-mint`.

> **Removed:** `--color-success-green-dark`, `--color-warning-yellow-dark`, `--color-error-red-dark` are dead tokens. Use the semantic status tokens (`--color-success`, `--color-warning`, `--color-danger`) instead.

> **Color format:** All token values use [OKLCH](https://oklch.com/) — a perceptually uniform color space. The format is `oklch(lightness chroma hue)` or `oklch(lightness chroma hue / alpha)`. Legacy hex values are noted in `/* was #HEX */` comments in the CSS source during migration, and the token-color scanner intentionally ignores those comments.

### Token Naming Precision Rules

- `ink` means the default dark tone (`#0F0E0C`), not absolute black.
- `pure-black` means absolute black (`#000000`) and SHOULD be used sparingly for deepest Moon Mode surfaces.
- `pure-white` means warm white (`#FFFCF3`) and SHOULD be used sparingly for hard contrast points.
- `black` and `white` are ambiguous names and MUST NOT be introduced as new canonical tokens.
- Generic hue names SHOULD be avoided for new primitives (prefer `mint`, `amber`, `sky`, etc. over broad names like `green`).
- Raw hue tokens (`mint`, `sun-red`, etc.) are primitives only; component code MUST use semantic tokens (`status-*`, `action-*`, `content-*`, etc.).

### Semantic Tokens (Tier 2)

Purpose-based tokens that flip between Sun Mode and Moon Mode. **All component code MUST use these.**

<!-- BEGIN GENERATED:color-surface -->
#### Surface Tokens

| Token | Sun Mode | Moon Mode |
|---|---|---|
| `--color-page` | `var(--color-cream)` | `var(--color-ink)` |
| `--color-card` | `var(--color-pure-white)` | `var(--color-pure-black)` |
| `--color-tinted` | `var(--color-sunset-fuzz)` | `oklch(0.3129 0.0389 73.57)` |
| `--color-inv` | `var(--color-ink)` | `var(--color-ink)` |
| `--color-depth` | `var(--color-cream)` | `oklch(0.22 0.0100 84.59)` |
| `--color-surface-primary` | _(not defined in Sun)_ | `var(--color-ink)` |
| `--color-surface-secondary` | _(not defined in Sun)_ | `var(--color-cream)` |
| `--color-surface-tertiary` | _(not defined in Sun)_ | `oklch(0.3129 0.0389 73.57)` |
| `--color-surface-elevated` | _(not defined in Sun)_ | `var(--color-pure-black)` |
| `--color-surface-muted` | _(not defined in Sun)_ | `oklch(0.9126 0.1170 93.68 / 0.08)` |
<!-- END GENERATED:color-surface -->

<!-- BEGIN GENERATED:color-overlay -->
#### Overlay Tokens

| Token | Sun Mode | Moon Mode |
|---|---|---|
| `--color-hover` | `var(--color-sun-yellow)` | `oklch(0.9126 0.1170 93.68 / 0.08)` |
| `--color-active` | `var(--color-sun-yellow)` | `oklch(0.9126 0.1170 93.68 / 0.12)` |
| `--color-hover-overlay` | _(not defined in Sun)_ | `oklch(0.9126 0.1170 93.68 / 0.08)` |
| `--color-active-overlay` | _(not defined in Sun)_ | `oklch(0.9126 0.1170 93.68 / 0.12)` |
| `--color-surface-overlay-subtle` | _(not defined in Sun)_ | `oklch(0.9126 0.1170 93.68 / 0.04)` |
| `--color-surface-overlay-medium` | _(not defined in Sun)_ | `oklch(0.9126 0.1170 93.68 / 0.08)` |
<!-- END GENERATED:color-overlay -->

Sun Mode opacity policy: overlays are fully opaque primitive colors. In Sun Mode, opacity is reserved for text-secondary and explicitly muted/disabled states. In Moon Mode, overlays use a sun-yellow opacity ladder for depth and hover feedback.

Content uses a **three-tier opacity hierarchy** in Sun Mode: primary (100%) → secondary (85%) → muted (60%). This gives subtle text differentiation while respecting the 3-color palette. In Moon Mode, cream replaces ink at comparable opacities.

<!-- BEGIN GENERATED:color-content -->
#### Content Tokens

| Token | Sun Mode | Moon Mode |
|---|---|---|
| `--color-main` | `var(--color-ink)` | `var(--color-cream)` |
| `--color-head` | `var(--color-ink)` | `var(--color-pure-white)` |
| `--color-sub` | `oklch(0.1641 0.0044 84.59 / 0.85)` | `oklch(0.9780 0.0295 94.34 / 0.85)` |
| `--color-mute` | `var(--color-ink)` | `oklch(0.9126 0.1170 93.68 / 0.6)` |
| `--color-flip` | `var(--color-cream)` | `var(--color-cream)` |
| `--color-link` | `var(--color-sky-blue)` | `var(--color-sky-blue)` |
| `--color-content-primary` | `var(--color-ink)` | `var(--color-cream)` |
| `--color-content-heading` | `var(--color-ink)` | `var(--color-pure-white)` |
| `--color-content-secondary` | `oklch(0.1641 0.0044 84.59 / 0.85)` | `oklch(0.9780 0.0295 94.34 / 0.85)` |
| `--color-content-inverted` | `var(--color-cream)` | `var(--color-ink)` |
| `--color-content-muted` | `oklch(0.1641 0.0044 84.59 / 0.6)` | `oklch(0.9126 0.1170 93.68 / 0.6)` |
| `--color-content-link` | `var(--color-sky-blue)` | `var(--color-sky-blue)` |
<!-- END GENERATED:color-content -->

<!-- BEGIN GENERATED:color-edge -->
#### Edge Tokens

| Token | Sun Mode | Moon Mode |
|---|---|---|
| `--color-line` | `var(--color-ink)` | `oklch(0.9126 0.1170 93.68 / 0.2)` |
| `--color-rule` | `var(--color-ink)` | `oklch(0.9126 0.1170 93.68 / 0.12)` |
| `--color-line-hover` | `oklch(0.1641 0.0044 84.59 / 0.3)` | `oklch(0.9780 0.0295 94.34 / 0.35)` |
| `--color-focus` | `var(--color-sun-yellow)` | `var(--color-sun-yellow)` |
| `--color-edge-primary` | `var(--color-ink)` | `oklch(0.9126 0.1170 93.68 / 0.2)` |
| `--color-edge-muted` | `var(--color-ink)` | `oklch(0.9126 0.1170 93.68 / 0.12)` |
| `--color-edge-hover` | `oklch(0.1641 0.0044 84.59 / 0.3)` | `oklch(0.9780 0.0295 94.34 / 0.35)` |
| `--color-edge-focus` | `var(--color-sun-yellow)` | `var(--color-sun-yellow)` |
<!-- END GENERATED:color-edge -->

<!-- BEGIN GENERATED:color-action -->
#### Action Tokens

| Token | Sun Mode | Moon Mode |
|---|---|---|
| `--color-accent` | `var(--color-sun-yellow)` | `var(--color-sun-yellow)` |
| `--color-accent-inv` | `var(--color-ink)` | `var(--color-ink)` |
| `--color-accent-soft` | `var(--color-sunset-fuzz)` | `var(--color-sunset-fuzz)` |
| `--color-danger` | `var(--color-sun-red)` | `var(--color-sun-red)` |
| `--color-success` | `var(--color-mint)` | `var(--color-mint)` |
| `--color-warning` | `var(--color-sun-yellow)` | `var(--color-sun-yellow)` |
| `--color-action-primary` | `var(--color-sun-yellow)` | `var(--color-sun-yellow)` |
| `--color-action-secondary` | `var(--color-ink)` | `var(--color-ink)` |
| `--color-action-destructive` | `var(--color-sun-red)` | `var(--color-sun-red)` |
| `--color-action-accent` | `var(--color-sunset-fuzz)` | `var(--color-sunset-fuzz)` |
<!-- END GENERATED:color-action -->

<!-- BEGIN GENERATED:color-window-chrome -->
#### Window Chrome Tokens

| Token | Sun Mode | Moon Mode |
|---|---|---|
| `--color-window-chrome-from` | `var(--color-sun-yellow)` | `var(--color-ink)` |
| `--color-window-chrome-to` | `var(--color-cream)` | `var(--color-ink)` |
<!-- END GENERATED:color-window-chrome -->

<!-- BEGIN GENERATED:color-status -->
#### Status Tokens

| Token | Sun Mode | Moon Mode |
|---|---|---|
| `--color-status-success` | `var(--color-mint)` | `var(--color-mint)` |
| `--color-status-warning` | `var(--color-sun-yellow)` | `var(--color-sun-yellow)` |
| `--color-status-error` | `var(--color-sun-red)` | `var(--color-sun-red)` |
| `--color-status-info` | `var(--color-sky-blue)` | `var(--color-sky-blue)` |
<!-- END GENERATED:color-status -->

### Token Usage Rules

<!-- DO -->
```tsx
// DO: Use semantic tokens
<div className="bg-page text-main border-line">
  <p className="text-sub">Description text</p>
  <span className="text-mute">Metadata</span>
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
  --color-page: var(--color-cream); /* resolves correctly */
}
```

<!-- DON'T -->
```css
/* DON'T: Split tokens across blocks — var() chains break silently */
@theme inline {
  --color-cream: #FEF8E2;
}
@theme {
  --color-page: var(--color-cream); /* may silently resolve to nothing */
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

Source: [`typography.css`](https://github.com/Radiants-DAO/DNA/blob/master/packages/radiants/typography.css) (base styles) | [`fonts.css`](https://github.com/Radiants-DAO/DNA/blob/master/packages/radiants/fonts.css) (font-face declarations) | [`generated/typography-tokens.css`](https://github.com/Radiants-DAO/DNA/blob/master/packages/radiants/generated/typography-tokens.css) (generated scale)

### Fonts

| Semantic Name | Font Family | Tailwind Class | Usage |
|---------------|-------------|----------------|-------|
| `--font-heading` | Joystix Monospace | `font-joystix` | **Default body font.** Headings, buttons, labels, all UI chrome |
| `--font-sans` | Mondwest | `font-mondwest` | Paragraphs, descriptions, form inputs, long-form text |
| `--font-mono` | PixelCode | `font-mono` | Code blocks, monospace data |

> **Important:** The default body font is Joystix (the pixel/heading font), NOT Mondwest. This is intentional — the retro OS aesthetic means most UI text uses the pixel font. Mondwest is applied explicitly where readability of longer text matters. Do not "fix" this to a conventional sans-serif default.

### Type Scale

Generated by `packages/radiants/scripts/generate-typography-tokens.ts` from `pretext-type-scale.ts`. The scale uses fixed small UI sizes, then a modular progression for display sizes.

<!-- BEGIN GENERATED:typography-scale -->
| Token | Value | At 16px Root |
|---|---|---|
| `--font-size-xs` | `0.625rem` | 10px |
| `--font-size-sm` | `0.75rem` | 12px |
| `--font-size-base` | `1rem` | 16px |
| `--font-size-lg` | `1.333rem` | 21px |
| `--font-size-xl` | `1.777rem` | 28px |
| `--font-size-2xl` | `2.369rem` | 38px |
| `--font-size-3xl` | `3.157rem` | 51px |
| `--font-size-4xl` | `4.209rem` | 67px |
| `--font-size-5xl` | `5.61rem` | 90px |
| `--font-size-display` | `5.61rem` | 90px |
<!-- END GENERATED:typography-scale -->

Fluid variants also ship for container-aware editorial layouts: `--font-size-fluid-{sm,base,lg,xl,2xl,3xl,4xl}`. Use them only when the surrounding layout can absorb fluid text changes without clipping controls.

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
| **Inset** | `shadow-inset` | `inset 0 0 0 1px ink` | rule inset ring + 6px subtle glow | Slider tracks, recessed containers |
| **Surface** | `shadow-surface` | `0 1px 0 0 ink` | rule ring + 1px/2px subtle glow | Nested containers, sections within cards |
| **Resting** | `shadow-resting` | `0 2px 0 0 ink` | rule ring + 4px/8px subtle glow | Buttons at rest, badges, inputs |
| **Lifted** | `shadow-lifted` | `0 4px 0 0 ink` | line ring + 8px glow + 16px subtle glow | Interactive hover (buttons, selects, switches) — vertical only |
| **Raised** | `shadow-raised` | `2px 2px 0 0 ink` | line ring + 8px glow + 20px subtle glow | Cards, panels, popovers — diagonal |
| **Floating** | `shadow-floating` | `4px 4px 0 0 ink` | line ring + 10px glow + 24px subtle glow | Windows, dialogs, sheets — diagonal |
| **Focused** | `shadow-focused` | 2px sun-yellow focus glow | line-hover ring + 12px/24px glow + 36px subtle glow | Active/focused window only |

### Status Glows

Colored variants of the `raised` level for status feedback:

| Token | Sun Mode | Moon Mode |
|-------|----------|-----------|
| `shadow-glow-success` | `2px 2px 0 0 mint` | `0 0 8px glow-mint` |
| `shadow-glow-error` | `2px 2px 0 0 sun-red` | `0 0 8px glow-sun-red` |
| `shadow-glow-info` | `2px 2px 0 0 sky-blue` | `0 0 8px glow-sky-blue` |

### Pixel-Cornered Shadows

Elements with pixel corners (`pixel-rounded-4/6/8/12/20` or `pixel-corners`) MUST use `pixel-shadow-*` utilities instead of `shadow-*`. Standard `box-shadow` gets clipped by the mask layer. The `pixel-shadow-*` utilities use `filter: drop-shadow()` which renders outside the clipped shape.

```tsx
// DO: Use pixel-shadow on clipped elements
<Card className="rounded-md pixel-shadow-raised">...</Card>
<Dialog className="rounded-md pixel-shadow-floating">...</Dialog>

// DON'T: box-shadow gets clipped by clip-path
<Card className="rounded-md shadow-raised">...</Card>
```

Inset `box-shadow` (bevels) works fine inside clip-path and is used for the retro-OS pressed/raised effect on button faces.

### Usage Rules

<!-- DO -->
```tsx
// DO: Match shadow level to component role
<Card className="pixel-shadow-raised">...</Card>
<Dialog className="pixel-shadow-floating">...</Dialog>

// DO: Use standard shadow on non-pixel-cornered elements
<div className="rounded-full shadow-resting">...</div>
```

<!-- DON'T -->
```tsx
// DON'T: Use raw shadow values
<div className="shadow-[4px_4px_0_0_#0F0E0C]">...</div>

// DON'T: Use box-shadow on pixel-cornered elements (gets clipped)
<Card className="rounded-md shadow-raised">...</Card>

// DON'T: Mix elevation metaphors — no glows in Sun Mode
<div className="shadow-resting dark:shadow-[0_0_20px_gold]">...</div>
```

**Rule:** Shadows are managed entirely by the token system. The same utility class produces pixel offsets in Sun Mode and ambient glows in Moon Mode automatically. Never override shadow values per-mode in component code.

## 5. Motion & Animation

### Motion Tokens

<!-- BEGIN GENERATED:motion-tokens -->
#### Durations

| Token | Value |
|---|---|
| `--duration-instant` | `0ms` |
| `--duration-fast` | `100ms` |
| `--duration-base` | `150ms` |
| `--duration-moderate` | `200ms` |
| `--duration-slow` | `300ms` |
| `--duration-scalar` | `1` |

#### Easings

| Token | Value |
|---|---|
| `--easing-default` | `cubic-bezier(0, 0, 0.2, 1)` |
| `--easing-out` | `cubic-bezier(0, 0, 0.2, 1)` |
| `--easing-in` | `cubic-bezier(0.4, 0, 1, 1)` |
| `--easing-spring` | `cubic-bezier(0.22, 1, 0.36, 1)` |
<!-- END GENERATED:motion-tokens -->

**Hard ceiling:** No animation may exceed 300ms. `--easing-default` and `--easing-out` currently share the same curve; `--easing-in` exists for exits, and `--easing-spring` exists for popover/badge settle-in motion. Do not introduce ad hoc easing literals in component code.

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

> **Note:** `animations.css` still carries hardcoded `0.15s` and `0.2s` literals that numerically match the duration tokens. Tokenizing those animation declarations is a follow-up; do not add new hardcoded animation literals.

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

Buttons currently ship five size presets; inputs and selects should align to the nearest equivalent control height unless their component contract says otherwise.

| Size | Height | Use |
|------|--------|-----|
| `xs` | 20px (`h-5`) | Ultra-compact chrome and dense icon controls |
| `sm` | 24px (`h-6`) | Title bar buttons, inline actions, tight layouts |
| `md` | 28px (`h-7`) | Standard compact RDNA button |
| `lg` | 32px (`h-8`) | Prominent controls inside panels |
| `xl` | 40px (`h-10`) | Hero CTAs and large primary actions |

Button modes are `solid`, `flat`, `text`, and `pattern`; tones are `accent`, `danger`, `success`, `neutral`, `cream`, `white`, `info`, `tinted`, and `transparent`. Mode controls treatment, tone controls semantic color through `data-color`, and size controls height/padding/text scale.

### Borders

**One width: 1px.** No exceptions.

All containers, inputs, cards, dialogs, alerts, and windows use `border` (1px). There is no `border-2` in the system.

| Token | Use |
|-------|-----|
| `border-line` | Standard borders (inputs, cards, windows, buttons) |
| `border-rule` | Subtle separators (dividers, internal section borders) |
| `border-line-hover` | Hover state borders |
| `border-focus` | Focus state (sun-yellow in both modes) |

### Border Radius — Pixel Corners

RDNA uses **pixel-staircase corners** instead of smooth CSS `border-radius`. The system uses CSS `mask-image` (via `pixel-rounded-*` classes) and the `px()` API from `@rdna/pixel` to generate staircase masks at build time. The `PixelBorder` component wraps elements that need pixel corners with SVG-based borders.

#### How It Works

Pixel corners use **CSS `mask-image`** to clip elements to a staircase shape. Apply a `pixel-rounded-*` class to opt in:

1. **`mask-image`** — a generated CSS mask that clips the element to the pixelated staircase shape
2. **`PixelBorder` component** — wraps elements that need visible pixel-staircase borders (SVG path overlay)
3. **`pixel-shadow-*` utilities** — `filter: drop-shadow()` for shadows on masked elements

| Class | Radius | Use |
|-------|--------|-----|
| `pixel-rounded-4` | 4px staircase | Buttons, inputs, badges, checkboxes |
| `pixel-rounded-6` | 6px staircase | Tabs, toasts |
| `pixel-rounded-8` | 8px staircase | Cards, menus |
| `pixel-rounded-12` | 12px staircase | Windows, dialogs |
| `pixel-rounded-20` | 20px staircase | Large panels |
| `rounded-full` | Unchanged | Switch tracks, radio buttons (no pixel corners) |

**Pixel corners are opt-in.** Standard `rounded-*` classes remain plain Tailwind border-radius with no clip-path or mask side effects.

**PixelBorder component:** For elements that need visible staircase borders (not just masked corners), wrap them in `<PixelBorder size="sm">`. The component renders an SVG border path and supports per-corner radii via the `radius` prop and background clipping via the `background` prop.

#### Critical Rules

**MUST NOT set `border-*` on pixel-cornered elements.** The `PixelBorder` component or `::after` pseudo-element handles visible borders. Setting `border-color` causes double borders.

```tsx
// DO: Use PixelBorder for borders
<PixelBorder size="sm" background="bg-page">...</PixelBorder>

// DON'T: CSS border on pixel-cornered elements
<div className="pixel-rounded-6 border border-line bg-page">...</div>
```

**MUST NOT use `box-shadow` for external shadows on pixel-cornered elements.** `mask-image` clips `box-shadow`. Use `filter: drop-shadow()` via the `pixel-shadow-*` utilities instead.

| Utility | Sun Mode | Moon Mode |
|---------|----------|-----------|
| `pixel-shadow-surface` | `drop-shadow(0 1px 0 ink)` | Moon override in `dark.css`: subtle ambient glow |
| `pixel-shadow-resting` | `drop-shadow(0 2px 0 ink)` | Moon override in `dark.css`: soft ambient glow |
| `pixel-shadow-lifted` | `drop-shadow(0 4px 0 ink)` | Moon override in `dark.css`: medium ambient glow |
| `pixel-shadow-raised` | `drop-shadow(2px 2px 0 ink)` | Moon override in `dark.css`: warm raised glow |
| `pixel-shadow-floating` | `drop-shadow(4px 4px 0 ink)` | Moon override in `dark.css`: strongest floating glow |

**MUST NOT nest pixel-cornered elements that both need visible borders.** When a parent and child both have `rounded-*`, both generate `::after` borders. Suppress the parent's `::after` via CSS (e.g. `[data-slot="button-root"]::after { display: none }`).

**MUST use `data-no-clip` on containers that need overflow.** `clip-path` clips all overflow content including absolutely/fixed positioned children like popovers, tooltips, and dropdowns. Add the `data-no-clip` attribute to opt out:

```tsx
// Container needs overflow for popover children
<div data-no-clip className="rounded-sm border border-line bg-page">
  <MyPopover /> {/* Won't be clipped */}
</div>
```

`data-no-clip` resets `clip-path: none`, restores `border` and `border-radius`, and hides the `::after` pseudo-element. The element gets standard Tailwind rounding instead of pixel corners.

#### Void Elements

Void elements (`<img>`, `<input>`) cannot have `::after`. Wrap them in a `--wrapper` div:

```tsx
<div className="pixel-rounded-6--wrapper">
  <img className="pixel-rounded-6" src="..." />
</div>
```

#### Opt-Out Patterns

| Scenario | Approach |
|----------|----------|
| Ghost/text buttons (no border) | Don't apply `rounded-xs` — omit from variant |
| Containers needing overflow | Add `data-no-clip` attribute |
| Line-variant tabs (3-sided border) | Use `rounded-none` to opt out entirely |
| Toolbar inline items | Omit `rounded-xs`, use plain hover bg |

### Focus Rings

Pixel-cornered elements use CSS `outline` instead of `ring-*` (which uses `box-shadow` and gets clipped):

```css
outline: 2px solid var(--color-focus);
outline-offset: 2px;
```

This is applied automatically to all `.pixel-rounded-4/6/8/12/20:focus-visible` and `.pixel-corners:focus-visible` elements in `pixel-corners.css`. The outline is rectangular (doesn't follow the staircase shape), but is accessible and visible.

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
<Card className="border border-line">...</Card>
<Dialog className="border border-line">...</Dialog>
```

<!-- DON'T -->
```tsx
// DON'T: Use border-2 on any component
<Dialog className="border-2 border-line">...</Dialog>
<Alert className="border-2">...</Alert>

// DON'T: Mix size scales
<Button size="lg">Next to<Input size="sm" /></Button>

// DON'T: Use hardcoded heights
<button className="h-[36px]">Odd height</button>
```

## 7. Component Architecture

Source: [`components/core/`](https://github.com/Radiants-DAO/DNA/tree/master/packages/radiants/components/core)

### Package Map

| Package | Role | Contract note |
|---------|------|---------------|
| `@rdna/radiants` | Core tokens, CSS, icons, component primitives, registry metadata, ESLint plugin | Core components follow `*.meta.ts` plus generated schemas |
| `@rdna/ctrl` | Dense control surfaces, selectors, rows, rails, and editor-style layout primitives | Shares RDNA lint and token rules; currently schema-free by design until a ctrl registry is introduced |
| `@rdna/pixel` | Pixel masks, pattern preparation, icons, and low-level pixel geometry | Owns the pixel math used by radiants generators |
| `@rdna/preview` | Registry/schema generation and preview tooling | Provides the current schema generator entrypoint used by `registry:generate` |

### Two-File Pattern

Every core component in `@rdna/radiants/components/core` follows this structure:

```
ComponentName/
├── ComponentName.tsx          # Implementation
├── ComponentName.meta.ts      # Metadata, token bindings, registry config
└── ComponentName.schema.json  # Prop types and AI interface (generated from meta)
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
  'inline-flex items-center justify-center font-heading uppercase cursor-pointer',
  {
    variants: {
      variant: {
        // rounded-xs on pixel-cornered variants — ::after handles border, pixel-shadow handles elevation
        primary: 'rounded-xs shadow-none',
        secondary: 'rounded-xs shadow-none',
        outline: 'rounded-xs shadow-none',
        // ghost/text opt OUT of pixel corners — no rounded-xs
        ghost: 'shadow-none',
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
  variant === 'outline' ? 'bg-page text-main border-line' : '',
  size === 'sm' ? 'h-8' : size === 'lg' ? 'h-8' : 'h-8', // all the same!
].join(' ');
```

### Registry Architecture

- `registry:generate` runs `@rdna/radiants` schema generation through `packages/preview/src/generate-schemas.ts`, then figma contract generation.
- `runtime-attachments.tsx` is the only runtime wiring layer for custom demos.
- Shared consumers should use canonical registry metadata instead of ad hoc manifest joins.

### Registry Variant Coverage

Every component's `*.meta.ts` MUST explicitly declare a `variants` array. This prevents components from silently missing variant sub-cards in the playground.

| Render mode | Component type | `variants` value |
|-------------|---------------|-----------------|
| `custom` | Simple (prop-spread works) | Populated array with one entry per visual variant |
| `custom` | Compound/controlled (Demo handles it) | `[]` (explicitly empty) |
| `inline` | Any | Auto-generated from schema enum props; override only when curation is needed |

**Rules:**
- A missing `variants` key on a `custom` component is a conformance violation. The playground cannot distinguish "forgot to add variants" from "intentionally no variants" without the explicit array.
- Components with `variants: []` MUST demonstrate all meaningful variants inside their `Demo` component instead.
- When a new component is added, its `variants` array MUST be defined before the entry is considered complete.

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
- **Use `createCompoundContext()`** for compound component state contexts so the provider/hook pair stays consistent
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

- **Focus rings** on all interactive elements: `ring-2 ring-focus ring-offset-1` (sun-yellow, visible in both modes)
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

These rules are exported by `eslint-plugin-rdna`. Rule names map 1:1 to policy; the generated table also records whether each rule is included in `recommended`, `internals`, and `recommended-strict`.

<!-- BEGIN GENERATED:eslint-rules -->
| Rule | Enforces | recommended | internals | recommended-strict |
|---|---|---|---|---|
| `rdna/no-appwindow-scroll-conflict` | Ban conflicting or unbounded scroll ownership in AppWindow layouts | warn | warn | error |
| `rdna/no-arbitrary-icon-size` | Restrict Icon size to approved literal sizes and ban removed iconSet prop | error | error | error |
| `rdna/no-backdrop-blur` | Ban backdrop-blur utilities and backdrop-filter in style props. RDNA chrome is opaque. | error | error | error |
| `rdna/no-broad-rdna-disables` | Ban broad or same-line eslint-disable comments for rdna/* rules; only eslint-disable-next-line is allowed | — | — | — |
| `rdna/no-clipped-shadow` | Ban box-shadow tokens on pixel-cornered elements; use pixel-shadow-* (filter: drop-shadow) instead | error | error | error |
| `rdna/no-dynamic-tailwind-token-construction` | Ban dynamic Tailwind token construction in className/class builders | warn | warn | error |
| `rdna/no-hardcoded-colors` | Ban non-semantic color usage; require RDNA semantic color tokens | error | error | error |
| `rdna/no-hardcoded-motion` | Ban arbitrary duration/easing values; require RDNA motion tokens | — | — | — |
| `rdna/no-hardcoded-spacing` | Ban arbitrary spacing bracket values; allow standard Tailwind scale utilities | warn | warn | error |
| `rdna/no-hardcoded-typography` | Ban arbitrary font sizes/weights; require RDNA typography tokens | error | error | error |
| `rdna/no-inline-svg-icons` | Ban raw inline/SVG icon sources; use RDNA bitmap-backed Icon assets | error | error | error |
| `rdna/no-mixed-style-authority` | Ban mixing local semantic color utilities with theme-targeted data-variant hooks | — | — | — |
| `rdna/no-pattern-color-override` | Ban hardcoded colors on pattern-mode buttons and rdna-pat elements — use semantic tokens so dark/light mode works correctly | warn | warn | error |
| `rdna/no-pixel-border` | Ban border-* and overflow-hidden on pixel-cornered elements. ::after handles borders; clip-path handles overflow. | error | error | error |
| `rdna/no-raw-font-family` | Ban hardcoded font-family in style props; require RDNA font tokens | warn | warn | error |
| `rdna/no-raw-layout-values` | Ban fixed arbitrary layout sizing/positioning values | warn | warn | error |
| `rdna/no-raw-line-height` | Ban arbitrary line-height values; require RDNA leading tokens | error | error | error |
| `rdna/no-raw-radius` | Ban arbitrary and standard Tailwind border-radius values; require pixel-rounded-* classes | error | error | error |
| `rdna/no-raw-shadow` | Ban arbitrary shadow values; require RDNA elevation/shadow tokens | error | error | error |
| `rdna/no-removed-aliases` | Ban removed RDNA token aliases | warn | warn | error |
| `rdna/no-translucent-bg` | Ban translucent bg utilities (bg-*/N). Chrome surfaces must be opaque — use semantic tokens (bg-depth, bg-card, bg-tinted, bg-accent-soft, bg-line). | error | error | error |
| `rdna/no-translucent-ink` | Ban semi-transparent ink/black styling. Use opaque semantic surfaces instead. | warn | warn | error |
| `rdna/no-unregistered-design-token-vars` | Ban references to unknown RDNA design-token CSS variables | warn | warn | error |
| `rdna/no-viewport-breakpoints-in-window-layout` | Ban viewport breakpoint prefixes in window layout; use container queries instead | — | — | — |
| `rdna/no-viewport-units-in-window-layout` | Ban viewport units and fixed positioning in RadOS window layouts | — | — | — |
| `rdna/no-z-index-literals` | Ban numeric z-index classes and style literals; use named RDNA layer tokens | warn | warn | error |
| `rdna/prefer-ctrl-components` | Prefer @rdna/ctrl primitives inside data-ctrl-surface control surfaces | warn | warn | error |
| `rdna/prefer-rdna-components` | Prefer RDNA components over raw HTML elements | warn | off | error |
| `rdna/require-exception-metadata` | Require valid reason, owner, expires, and issue metadata on rdna/* eslint-disable-next-line comments | — | — | — |
| `rdna/require-icon-button-label` | Require accessible labels for icon-only controls | error | error | error |
<!-- END GENERATED:eslint-rules -->

Repo-local governance rules such as exception metadata and broad-disable checks are exported by the plugin but are scoped by the repository ESLint config. Use owner slugs `design-system`, `frontend-platform`, and `rad-os` for new exceptions unless the owning team has published a narrower slug.

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
- Design-owned exceptions that are intentional rendering surfaces, not cleanup debt, are tracked in `docs/solutions/tooling/rdna-approved-exceptions.md`.

### Scope

Enforced in:
- `packages/radiants/components/core/**/*.tsx` (token rules only — wrapper rule exempt for internals)
- `apps/rad-os/**/*.tsx`
- `tools/playground/**/*.tsx`
- Any package/app with `eslint-plugin-rdna` in its ESLint config

Not enforced (yet):
- `tools/` (non-UI code)

---

# Part 2: RadOS Application

> RadOS-specific design (windows, desktop/taskbar, app registration, hash routing, mobile) lives in [`apps/rad-os/SPEC.md`](../../apps/rad-os/SPEC.md). DESIGN.md is the portable design system; SPEC.md is the product adapter.

## 10. Portable AppWindow Guidance

`AppWindow` is a core Radiants component, so its portable component contract remains here. RadOS-specific catalog fields, taskbar behavior, routing, desktop icon behavior, and mobile adaptation belong in `apps/rad-os/SPEC.md`.

### Window Chrome

| Property | Value |
|----------|-------|
| Border | Pixel-corner border supplied by AppWindow/pixel-corner layers |
| Shadow | `pixel-shadow-floating` by default; focused state uses the focused elevation token |
| Background | `linear-gradient(0deg, var(--color-window-chrome-from), var(--color-window-chrome-to))` |
| Min size | 300 x 200px in the core component |
| Content max height | `--app-content-max-height` CSS variable |

### Window-Internal Layout

Do not use viewport breakpoints (`md:block`, `lg:flex`) for layout inside windows. Tailwind breakpoints fire on viewport width, not window width. Use Tailwind v4 container query variants (`@sm:`, `@md:`, `@lg:`, etc.) inside AppWindow content so layouts respond to the actual window width.

<!-- DO -->
```tsx
// DO: Container query breakpoints respond to window width
<div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">...</div>
<span className="hidden @sm:inline">Extra detail</span>
```

<!-- DON'T -->
```tsx
// DON'T: Viewport breakpoints respond to browser width, not window width
<nav className="hidden md:block w-48">...</nav>
<div className="grid grid-cols-1 sm:grid-cols-2">...</div>
```

---

# Part 3: Hard-Won Rules

> These rules were extracted from recurring bugs across multiple development sessions. Each one caused repeated debugging cycles before the root cause was identified. Treat them as load-bearing.

## 15. Z-Index Scale

Without a defined scale, every agent invents values. One session uses `z-5`, another `z-[999]`, another `z-50`. Then they collide and elements become unclickable.

This section is documentation only for the current rewrite. The codebase still has known leaks outside the documented bands (`z-[9999]`, `z-[1000]`, `z-[950]`, `z-[80]`, and `z-[5]` in app/component code). Those are cleanup-plan items, not part of this DESIGN.md rewrite.

### RadOS Stacking Order

| Band | Range | Layer | Notes |
|------|-------|-------|-------|
| `base` | `0` | Background (WebGL, canvas art) | Always bottom |
| `desktop` | `10` | Desktop icons | Above background only |
| `windows` | `100–199` | AppWindows | Dynamic — `useWindowManager` assigns within this range for focus ordering |
| `chrome` | `200` | Taskbar | Always above all windows |
| `menus` | `300` | Start Menu, dropdown menus | Above taskbar |
| `toasts` | `400` | Toast notifications | Above menus, always visible |
| `modals` | `500` | Dialog portals and app modal overlays | Highest interactive layer |
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

**The bug:** A full-viewport positioned element (for layout/decoration) has `pointer-events: auto` by default. Everything underneath becomes unclickable. This caused repeated "still unclickable" bugs across flow and rad-os debugging arcs.

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

Use an icon from [`@rdna/radiants/icons`](https://github.com/Radiants-DAO/DNA/tree/master/packages/radiants/icons) instead. The default `Icon` component is bitmap-backed: it resolves names and aliases against the baked 16px and 24px registries and renders through `@rdna/pixel`'s `BitmapIcon`. Public `Icon` sizes are `16` and `24` only; use the default 16px size, `large`, or `size={24}`.

### Icon entrypoints

| Type | Import | Use |
|------|--------|-----|
| **Bitmap `Icon`** | `import { Icon } from '@rdna/radiants/icons'` | Default for UI affordances. Bitmap-backed, no asset fetches, and constrained to 16px or 24px. |
| **Lean runtime `Icon` entrypoint** | `import { Icon } from '@rdna/radiants/icons/runtime'` | Same bitmap-backed `Icon`, exposed from the runtime entrypoint when you only need that lean surface plus the brand/runtime exports. |
| **Brand/runtime marks** | `import { RadMarkIcon, RadSunLogo, WordmarkLogo, FontAaIcon } from '@rdna/radiants/icons'` | Product marks and special cases. Not a generic UI icon set. |

### Priority order

1. **Bitmap `Icon`** — use `<Icon name="..." />` for almost all UI icons
2. **Lean runtime entrypoint** — use it only when you intentionally want the runtime import surface
3. **Brand/runtime marks** — use for product identity and special cases only
4. **Never** reach for heroicons, emojis, or any external icon library

<!-- DO -->
```tsx
// DO: Import from radiants
import { Icon, RadMarkIcon } from '@rdna/radiants/icons';

<Icon name="close" />
<Icon name="broadcast-dish" size={24} />
<RadMarkIcon size={20} />
```

<!-- DON'T -->
```tsx
// DON'T: Import from external icon libraries
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
<div className="border border-line">1px border</div>
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

Some tokens are mode-invariant by design (same in both modes):
- `--color-accent` (sun-yellow in both)
- `--color-focus` (sun-yellow in both)
- `--color-link` (sky-blue in both)
- `--color-status-*` tokens (status colors don't change per mode)

Status tokens intentionally keep their semantic hue across modes so success, warning, error, and info do not shift meaning between Sun and Moon. If a future code cleanup adds comments or explicit same-value overrides in `dark.css`, it should preserve that invariant rather than recoloring status tokens.

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
