# RadOS Theme Migration Guide

This guide covers migrating existing code to use the enhanced RadOS theme token system. The theme now includes motion tokens, icon size tokens, accessibility tokens, density system, fluid typography, and fluid spacing.

---

## Quick Reference

| Before | After | Token Category |
|--------|-------|----------------|
| `200ms ease-out` | `var(--transition-base)` | Motion |
| `width: 20px; height: 20px` | `var(--icon-md)` | Icons |
| `min-height: 44px` | `min-height: var(--touch-target-default)` | Accessibility |
| `padding: 0.75rem` | `padding: var(--density-padding-md)` | Density |
| `font-size: 1rem` | `font-size: var(--text-base)` | Typography |
| `margin: 1rem` | `margin: var(--space-s)` | Spacing |

---

## 1. Motion Tokens

The theme uses a **duration-scalar pattern** for mode-aware animations:
- **Light mode**: `--duration-scalar: 0` (instant transitions, pixel-crisp aesthetic)
- **Dark mode**: `--duration-scalar: 1` (smooth transitions with glow effects)
- **Reduced motion**: `--duration-scalar: 0` (respects `prefers-reduced-motion`)

### Available Tokens

```css
/* Durations */
--duration-instant: 0ms       /* No animation */
--duration-fast: 100ms        /* Quick feedback */
--duration-base: 150ms        /* Standard transitions */
--duration-moderate: 200ms    /* Deliberate animations */
--duration-slow: 300ms        /* Emphasized animations */

/* Easings */
--ease-default: cubic-bezier(0, 0, 0.2, 1)  /* RadOS standard (ease-out) */
--ease-linear: linear
--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)

/* Pre-composed transition shorthands (respect duration-scalar) */
--transition-fast: calc(100ms * var(--duration-scalar)) var(--ease-out)
--transition-base: calc(150ms * var(--duration-scalar)) var(--ease-out)
--transition-slow: calc(300ms * var(--duration-scalar)) var(--ease-out)

/* Stagger delays for sequential animations */
--stagger-none: 0ms
--stagger-fast: 30ms
--stagger-base: 50ms
--stagger-slow: 80ms
```

### Migration Examples

**Before:**
```css
.button {
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}
```

**After:**
```css
.button {
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}
```

**Before (inline styles in React):**
```tsx
style={{ transition: '150ms ease-out' }}
```

**After:**
```tsx
style={{ transition: 'var(--transition-fast)' }}
```

**Staggered list animation:**
```tsx
{items.map((item, i) => (
  <div
    key={item.id}
    style={{
      animationDelay: `calc(var(--stagger-base) * ${i})`
    }}
  />
))}
```

---

## 2. Icon Size Tokens

Icons now use semantic size tokens that match CSS custom properties.

### Available Tokens

```css
--icon-xs: 12px    /* Inline text, badges */
--icon-sm: 16px    /* Dense UI, tables */
--icon-md: 20px    /* Default buttons, nav */
--icon-lg: 24px    /* Primary actions, headers */
--icon-xl: 32px    /* Feature highlights */
--icon-2xl: 48px   /* Hero sections */
```

### TypeScript Types

```tsx
import { IconSize, ICON_SIZES } from '@radflow/theme-rad-os';

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// ICON_SIZES maps semantic names to pixel values
console.log(ICON_SIZES.md); // 20
```

### Migration Examples

**Before:**
```tsx
<svg width="20" height="20">...</svg>
```

**After (using Icon component):**
```tsx
<Icon name="checkmark" size="md" />
```

**Before (inline size):**
```css
.icon {
  width: 24px;
  height: 24px;
}
```

**After:**
```css
.icon {
  width: var(--icon-lg);
  height: var(--icon-lg);
}
```

---

## 3. Accessibility Tokens

### Focus Ring

```css
--focus-ring-width: 2px
--focus-ring-offset: 2px
--focus-ring-color: var(--color-edge-focus)
```

**Usage:**
```css
.interactive:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}
```

### Touch Targets (WCAG Compliance)

```css
--touch-target-min: 24px        /* WCAG AA minimum */
--touch-target-default: 44px    /* Standard interactive - use for most elements */
--touch-target-comfortable: 48px /* Primary actions, mobile-first */
```

**Migration Example:**

**Before:**
```css
.button {
  min-height: 44px;
}
```

**After:**
```css
.button {
  min-height: var(--touch-target-default);
}
```

**React inline styles:**
```tsx
const buttonStyle: React.CSSProperties = {
  minHeight: 'var(--touch-target-default)',
};
```

---

## 4. Density System

The density system allows UI to adapt between compact, default, and comfortable layouts.

### Tokens

```css
--density-scale: 1              /* 0.5 compact, 1 default, 1.5 comfortable */

/* Scalable padding */
--density-padding-xs: calc(0.25rem * var(--density-scale))
--density-padding-sm: calc(0.5rem * var(--density-scale))
--density-padding-md: calc(0.75rem * var(--density-scale))
--density-padding-lg: calc(1rem * var(--density-scale))
--density-padding-xl: calc(1.5rem * var(--density-scale))

/* Lift/press for buttons */
--lift-distance: calc(2px * var(--density-scale))
--press-distance: calc(1px * var(--density-scale))
```

### Activation via CSS Classes

Apply density classes to container elements:

```html
<!-- Compact mode (scale = 0.5) -->
<div class="density-compact">
  <Button>Compact Button</Button>
</div>

<!-- Comfortable mode (scale = 1.5) -->
<div class="density-comfortable">
  <Button>Comfortable Button</Button>
</div>
```

### Migration Example

**Before:**
```css
.card {
  padding: 0.75rem;
}
```

**After:**
```css
.card {
  padding: var(--density-padding-md);
}
```

---

## 5. Fluid Typography

Typography scales responsively between viewport widths using `clamp()`.

### Available Tokens

```css
--text-xs: clamp(0.625rem, 0.58rem + 0.15vw, 0.75rem)    /* 10-12px */
--text-sm: clamp(0.75rem, 0.7rem + 0.17vw, 0.875rem)     /* 12-14px */
--text-base: clamp(0.875rem, 0.82rem + 0.19vw, 1rem)     /* 14-16px */
--text-lg: clamp(1rem, 0.93rem + 0.24vw, 1.125rem)       /* 16-18px */
--text-xl: clamp(1.125rem, 1.05rem + 0.26vw, 1.25rem)    /* 18-20px */
--text-2xl: clamp(1.25rem, 1.15rem + 0.35vw, 1.5rem)     /* 20-24px */
--text-3xl: clamp(1.5rem, 1.35rem + 0.52vw, 1.875rem)    /* 24-30px */
--text-4xl: clamp(2rem, 1.8rem + 0.7vw, 2.5rem)          /* 32-40px */
```

### Migration Example

**Before:**
```css
.heading {
  font-size: 1.5rem;
}
```

**After:**
```css
.heading {
  font-size: var(--text-2xl);
}
```

---

## 6. Fluid Spacing

Spacing scales responsively with Utopia-style pairs for dramatic jumps.

### Base Scale

```css
--space-3xs: clamp(0.25rem, 0.22rem + 0.1vw, 0.3125rem)   /* 4-5px */
--space-2xs: clamp(0.5rem, 0.45rem + 0.17vw, 0.625rem)    /* 8-10px */
--space-xs: clamp(0.75rem, 0.68rem + 0.24vw, 0.9375rem)   /* 12-15px */
--space-s: clamp(1rem, 0.89rem + 0.37vw, 1.25rem)         /* 16-20px */
--space-m: clamp(1.5rem, 1.28rem + 0.74vw, 2rem)          /* 24-32px */
--space-l: clamp(2rem, 1.78rem + 0.74vw, 2.5rem)          /* 32-40px */
--space-xl: clamp(3rem, 2.67rem + 1.11vw, 3.75rem)        /* 48-60px */
--space-2xl: clamp(4rem, 3.56rem + 1.48vw, 5rem)          /* 64-80px */
--space-3xl: clamp(6rem, 5.33rem + 2.22vw, 7.5rem)        /* 96-120px */
```

### Dramatic Pairs

Use for responsive jumps between sections:

```css
--space-s-m: clamp(1rem, 0.67rem + 1.11vw, 2rem)      /* 16px → 32px */
--space-s-l: clamp(1rem, 0.44rem + 1.85vw, 2.5rem)    /* 16px → 40px */
--space-m-xl: clamp(1.5rem, 0.78rem + 2.41vw, 3.75rem) /* 24px → 60px */
```

### Migration Example

**Before:**
```css
.section {
  margin-bottom: 2rem;
  padding: 1rem;
}
```

**After:**
```css
.section {
  margin-bottom: var(--space-m);
  padding: var(--space-s);
}
```

**Responsive section gaps:**
```css
.page-section {
  margin-bottom: var(--space-s-l); /* 16px on mobile, 40px on desktop */
}
```

---

## 7. Breakpoints & Container Queries

### Breakpoints

```css
--breakpoint-xs: 22.5rem   /* 360px - small phones */
--breakpoint-sm: 40rem     /* 640px - large phones */
--breakpoint-md: 48rem     /* 768px - tablets */
--breakpoint-lg: 64rem     /* 1024px - laptops */
--breakpoint-xl: 80rem     /* 1280px - desktops */
--breakpoint-2xl: 96rem    /* 1536px - large desktops */
```

### Container Query Sizes

```css
--container-sm: 20rem      /* 320px */
--container-md: 28rem      /* 448px */
--container-lg: 36rem      /* 576px */
```

---

## 8. Mode-Specific Transitions

Utility classes for smooth theme switching:

```css
/* All color properties */
.mode-transition { ... }

/* Just backgrounds */
.mode-transition-surface { ... }

/* Just text/icons */
.mode-transition-content { ... }

/* Just borders */
.mode-transition-edge { ... }

/* Full interactive element */
.mode-transition-interactive { ... }
```

**Usage:**
```html
<div class="bg-surface-primary mode-transition-surface">
  Smooth background transition on theme change
</div>
```

---

## Component Migration Checklist

When updating components to use the new token system:

- [ ] **Motion**: Replace hardcoded `200ms ease-out` with `var(--transition-base)`
- [ ] **Icons**: Use `<Icon size="md">` instead of fixed pixel sizes
- [ ] **Touch targets**: Add `min-height: var(--touch-target-default)` to interactive elements
- [ ] **Focus**: Use `outline: var(--focus-ring-width) solid var(--focus-ring-color)` pattern
- [ ] **Density**: Replace fixed padding with `var(--density-padding-*)`
- [ ] **Typography**: Use `var(--text-*)` for fluid responsive text
- [ ] **Spacing**: Replace fixed `1rem` with `var(--space-s)` for fluid responsiveness

---

## Token Validation

Run the validation script to check token completeness:

```bash
node packages/theme-rad-os/scripts/validate-tokens.js
```

Expected output:
```
  ✓ Motion: 18/18 tokens
  ✓ Icons: 6/6 tokens
  ✓ Accessibility: 6/6 tokens
  ✓ Density: 8/8 tokens
  ✓ Typography: 8/8 tokens
  ✓ Spacing: 12/12 tokens
  ✓ Layout: 9/9 tokens
  ✓ Sound: 11/11 tokens
  ✓ Colors: 30/30 tokens
  ✓ Radius: 6/6 tokens
  ✓ Shadows: 7/7 tokens

  Total: 121/121 tokens (100.0%)
  Status: PASS
```

---

## Updated Core Components

The following 10 components have been updated to use the new token system:

| Component | Touch Targets | Motion | Icon Sizes | Focus Ring |
|-----------|--------------|--------|------------|------------|
| Button | ✓ | ✓ | ✓ | ✓ |
| Card | - | ✓ | - | - |
| Input | ✓ | ✓ | - | ✓ |
| Dialog | - | ✓ | - | - |
| Select | ✓ | ✓ | - | ✓ |
| Tabs | - | ✓ | - | - |
| Tooltip | - | ✓ | - | - |
| Badge | - | - | ✓ | - |
| Alert | - | - | ✓ | - |
| Switch | ✓ | ✓ | - | ✓ |

---

## Sound Tokens (Future)

Structure is in place for future audio feedback:

```css
--volume-silent: 0
--volume-whisper: 0.1
--volume-soft: 0.25
--volume-low: 0.4
--volume-medium: 0.6
--volume-high: 0.8
--volume-full: 1.0

--sound-volume-master: var(--volume-medium)
--sound-volume-feedback: var(--volume-soft)
--sound-volume-confirmation: var(--volume-medium)
--sound-volume-error: var(--volume-high)
```

These are placeholders for future implementation.
