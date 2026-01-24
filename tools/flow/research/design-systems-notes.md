# Design System Best Practices Research

**Status:** Validated
**Date:** 2026-01-14
**Purpose:** Quick validation of theme-spec.md decisions against industry patterns

---

## Summary

**Our approach aligns with industry best practices.** The `surface-*`/`content-*`/`edge-*` semantic naming and 3-tier token architecture are standard patterns used across Tailwind v4, Radix Themes, shadcn/ui, and Chakra UI.

---

## Systems Reviewed

### 1. Tailwind CSS v4 `@theme` Syntax

**Token Structure:**
- Uses `@theme` blocks in CSS (replaces tailwind.config.js)
- Namespaces: `--color-*`, `--font-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, `--ease-*`
- All tokens become CSS variables AND generate utility classes

**Key Feature: `@theme inline`**
- `@theme` = tokens resolved at build time, generates utilities
- `@theme inline` = preserves CSS variable references at runtime
- Use `@theme inline` when tokens reference other variables (e.g., semantic tokens)

```css
/* Brand tokens - generate utilities */
@theme {
  --color-sun-yellow: #FCE184;
}

/* Semantic tokens - preserve var() references */
@theme inline {
  --color-surface-primary: var(--color-sun-yellow);
}
```

**Alignment:** Our spec correctly uses `@theme inline` for semantic tokens. This is the correct pattern.

### 2. Radix Themes

**Token Structure:**
- 12-step color scales (1-12) + alpha variants (a1-a12)
- Steps 1-2: backgrounds
- Steps 3-5: interactive components
- Steps 6-8: borders/separators
- Steps 9-10: solid colors
- Steps 11-12: accessible text

**Semantic Tokens:**
- `--[color]-surface` - form component backgrounds
- `--[color]-indicator` - status indicators
- `--[color]-track` - progress/slider tracks
- `--[color]-contrast` - high-contrast text
- `--color-background` - page background
- `--color-panel-solid` / `--color-panel-translucent` - card surfaces

**Naming Pattern:** Numbered scales (surface1, surface2) + functional suffixes

**Alignment:** Our `surface-primary`/`surface-secondary` is semantically equivalent to Radix's numbered approach. Our naming is more descriptive.

### 3. shadcn/ui

**Token Structure:**
- Paired tokens: `--[name]` and `--[name]-foreground`
- Core pairs: background, foreground, card, popover, primary, secondary, muted, accent
- Status: destructive (no foreground pair)
- UI elements: border, input, ring
- Component-specific: sidebar-* variants

**Full Variable List:**
```
background, foreground
card, card-foreground
popover, popover-foreground
primary, primary-foreground
secondary, secondary-foreground
muted, muted-foreground
accent, accent-foreground
destructive
border, input, ring
```

**Naming Pattern:** Simple semantic names + `-foreground` suffix pattern

**Alignment:** Our `surface-*` ≈ their `background`/`card`/`popover`, our `content-*` ≈ their `-foreground` variants, our `edge-*` ≈ their `border`/`ring`.

### 4. Chakra UI v3

**Token Structure:**
- Background: `bg`, `bg-subtle`, `bg-muted`, `bg-emphasized`, `bg-inverted`, `bg-panel`
- Foreground: `fg`, `fg-muted`, `fg-subtle`, `fg-inverted`
- Border: `border`, `border-muted`, `border-subtle`, `border-emphasized`, `border-inverted`
- Status: `bg-error`, `bg-warning`, `bg-success`, `bg-info` + foreground variants

**Key Features:**
- Built on Panda CSS
- Semantic tokens support conditional values (light/dark)
- Uses `{token.reference}` syntax for token chaining
- `strictTokens` config enforces token usage

**Naming Pattern:** Category prefix (`bg-`, `fg-`) + modifiers (`-muted`, `-subtle`, `-inverted`)

**Alignment:** Our `surface-*` ≈ their `bg-*`, our `content-*` ≈ their `fg-*`, our `edge-*` ≈ their `border-*`. Very similar architecture.

---

## Comparison Table

| Feature | RadFlow | Tailwind v4 | Radix | shadcn/ui | Chakra v3 |
|---------|---------|-------------|-------|-----------|-----------|
| **Background** | `surface-*` | `--color-*` | `--color-surface*` | `background/card/popover` | `bg-*` |
| **Text** | `content-*` | `--color-*` | `--*-11/12` | `*-foreground` | `fg-*` |
| **Borders** | `edge-*` | `--color-*` | `--*-6/7/8` | `border/ring` | `border-*` |
| **Token tiers** | 3 (brand→semantic→component) | 1-2 | 2 (scale→semantic) | 2 | 2-3 |
| **Mode toggle** | `.dark` class | `.dark` class | `data-*` attrs | `.dark` class | conditions |

---

## Key Insights

### 1. Our Naming Convention is Valid
The `surface-*`/`content-*`/`edge-*` pattern:
- Maps directly to Chakra's `bg-*`/`fg-*`/`border-*`
- More semantic than shadcn's generic `background`/`foreground`
- Less cryptic than Radix's numbered scales

**Recommendation:** Keep current naming. It's clear and purpose-driven.

### 2. 3-Tier Architecture is Standard
Brand → Semantic → Component tokens is the established pattern:
- Tailwind v4: primitive tokens + semantic mapping via `@theme inline`
- Radix: scale colors + semantic tokens (surface, indicator)
- Chakra: primitive tokens + semantic tokens + conditions
- shadcn: primitive + semantic pairs

**Recommendation:** Keep 3-tier architecture. It's industry standard.

### 3. We're Missing Some Common Tokens

**Consider Adding:**
- `--color-surface-muted` (Chakra's `bg-muted`)
- `--color-surface-elevated` / `--color-surface-sunken` (depth tokens)
- `--color-content-muted` (for secondary/disabled text)
- Focus ring tokens (shadcn's `ring` pattern)

**Not Critical for v1:** These can be added as themes mature.

### 4. `@theme inline` Usage is Correct
Our spec's use of `@theme inline` for semantic tokens is the right approach for Tailwind v4. This allows runtime variable resolution for color mode switching.

### 5. Status Tokens Need Consistency
Current spec has `--color-success`, `--color-warning`, `--color-error`.

Other systems also define:
- `--color-info` (informational, often blue)
- Foreground variants for status colors (`--color-success-content`)

**Recommendation:** Add `--color-info` to match industry patterns.

---

## Recommended Spec Changes

### High Priority (for v1)
1. Add `--color-info` state token (alongside success/warning/error)
2. Add `--color-content-muted` for secondary text
3. Ensure `@theme inline` is documented for semantic tokens

### Medium Priority (post-v1)
1. Add `--color-surface-muted` for subtle backgrounds
2. Add depth tokens (`elevated`, `sunken`) if needed
3. Consider adding foreground variants for state tokens

### Low Priority
1. Investigate Radix-style 12-step scales (more granular but more complex)
2. Component-level token overrides (if themes need per-component customization)

---

## Sources

- [Tailwind CSS v4 Theme Variables](https://tailwindcss.com/docs/theme)
- [Tailwind CSS v4 Announcement](https://tailwindcss.com/blog/tailwindcss-v4)
- [Radix Themes Color Documentation](https://www.radix-ui.com/themes/docs/theme/color)
- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming)
- [shadcn Colors Naming Analysis](https://isaichenko.dev/blog/shadcn-colors-naming/)
- [Chakra UI Semantic Tokens](https://chakra-ui.com/docs/theming/semantic-tokens)
- [Chakra UI Design Tokens](https://chakra-ui.com/blog/building-consistent-uis-with-design-tokens)
- [Tailwind v4 @theme inline Discussion](https://github.com/tailwindlabs/tailwindcss/discussions/15600)
