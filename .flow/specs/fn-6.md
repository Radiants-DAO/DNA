# fn-6: Theme System Build - RadOS Perfect Theme

## Summary

Convert the existing RadOS theme to a "perfect" design theme implementing all fn-3/fn-4 research findings. Copy the full `theme-rad-os` package from the radflow repo into radflow-tauri, then enhance with motion tokens, icon size tokens, accessibility tokens, density system, fluid typography/spacing, and updated components.

**Input:** `/Users/rivermassey/Desktop/dev/radflow/packages/theme-rad-os`
**Output:** `/Users/rivermassey/Desktop/dev/radflow-tauri/packages/theme-rad-os` (enhanced)

## Key Decisions

| Decision | Choice | Notes |
|----------|--------|-------|
| **Package location** | radflow-tauri repo | Standalone development, parallel to fn-7 |
| **Package name** | @radflow/theme-rad-os | Same name for future migration back |
| **Copy scope** | Full package | All CSS + components + preview |
| **Light mode motion** | Instant (0ms) | Pixel-crisp aesthetic, no transitions |
| **Dark mode motion** | Actual durations | Smooth transitions with glow effects |
| **Easings** | All defined | ease-out as RadOS default |
| **Density activation** | CSS classes | .density-compact, .density-comfortable |
| **Link contrast fix** | Always underline | Keep Sky Blue #95BAD2 |
| **Icons** | Custom SVGs | Add size tokens + update Icon component |
| **Fluid typography** | clamp() based | Responsive text scaling |
| **Fluid spacing** | Utopia pairs | --space-s-m, --space-s-l, --space-m-xl |
| **i18n** | Deferred | Skip logical properties migration |
| **Focus rings** | Tokens only | No utility class |
| **Reduced motion** | Duration scalar | --duration-scalar: 0 in prefers-reduced-motion |
| **Touch targets** | Enforce in components | min-height: var(--touch-target-default) |
| **Component updates** | Core 10 only | Button, Card, Input, Dialog, Select, Tabs, Tooltip, Badge, Alert, Switch |
| **Stagger tokens** | Full set | 0ms, 30ms, 50ms, 80ms |
| **Breakpoints** | Add xs (360px) | Full set: xs, sm, md, lg, xl, 2xl |
| **Container queries** | Yes | --container-sm, --container-md, --container-lg |
| **Sound tokens** | Structure only | Placeholders for future |
| **Validation** | Node.js script | Check token completeness |
| **Exclusions** | View Transitions, AI UX | Defer to fn-8 |

## Token Systems to Implement

### Motion Tokens
```css
/* Durations */
--duration-instant: 0ms       /* Light mode default */
--duration-fast: 100ms
--duration-base: 150ms
--duration-moderate: 200ms
--duration-slow: 300ms

/* Duration scalar (0 in light mode, 1 in dark mode, 0 in reduced-motion) */
--duration-scalar: 0          /* Light mode */
.dark { --duration-scalar: 1 }
@media (prefers-reduced-motion: reduce) { --duration-scalar: 0 }

/* Easings */
--ease-default: cubic-bezier(0, 0, 0.2, 1)  /* RadOS standard */
--ease-linear: linear
--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)

/* Transition shorthands */
--transition-fast: calc(100ms * var(--duration-scalar)) var(--ease-out)
--transition-base: calc(150ms * var(--duration-scalar)) var(--ease-out)
--transition-slow: calc(300ms * var(--duration-scalar)) var(--ease-out)

/* Stagger */
--stagger-none: 0ms
--stagger-fast: 30ms
--stagger-base: 50ms
--stagger-slow: 80ms
```

### Icon Size Tokens
```css
--icon-xs: 12px    /* Inline text, badges */
--icon-sm: 16px    /* Dense UI, tables */
--icon-md: 20px    /* Default buttons, nav */
--icon-lg: 24px    /* Primary actions, headers */
--icon-xl: 32px    /* Feature highlights */
--icon-2xl: 48px   /* Hero sections */
```

### Accessibility Tokens
```css
/* Focus ring */
--focus-ring-width: 2px
--focus-ring-offset: 2px
--focus-ring-color: var(--color-edge-focus)

/* Touch targets */
--touch-target-min: 24px        /* WCAG AA minimum */
--touch-target-default: 44px    /* Standard interactive */
--touch-target-comfortable: 48px /* Primary actions */
```

### Density Tokens
```css
--density-scale: 1              /* 0.5 compact, 1 default, 1.5 comfortable */
--density-padding-xs: calc(0.25rem * var(--density-scale))
--density-padding-sm: calc(0.5rem * var(--density-scale))
--density-padding-md: calc(0.75rem * var(--density-scale))
--density-padding-lg: calc(1rem * var(--density-scale))
--density-padding-xl: calc(1.5rem * var(--density-scale))

/* Lift/press for buttons */
--lift-distance: calc(2px * var(--density-scale))
--press-distance: calc(1px * var(--density-scale))
```

### Fluid Typography (Utopia-style)
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

### Fluid Spacing (with Utopia pairs)
```css
/* Base scale */
--space-3xs: clamp(0.25rem, 0.22rem + 0.1vw, 0.3125rem)
--space-2xs: clamp(0.5rem, 0.45rem + 0.17vw, 0.625rem)
--space-xs: clamp(0.75rem, 0.68rem + 0.24vw, 0.9375rem)
--space-s: clamp(1rem, 0.89rem + 0.37vw, 1.25rem)
--space-m: clamp(1.5rem, 1.28rem + 0.74vw, 2rem)
--space-l: clamp(2rem, 1.78rem + 0.74vw, 2.5rem)
--space-xl: clamp(3rem, 2.67rem + 1.11vw, 3.75rem)
--space-2xl: clamp(4rem, 3.56rem + 1.48vw, 5rem)
--space-3xl: clamp(6rem, 5.33rem + 2.22vw, 7.5rem)

/* Dramatic pairs (responsive jumps) */
--space-s-m: clamp(1rem, 0.67rem + 1.11vw, 2rem)
--space-s-l: clamp(1rem, 0.44rem + 1.85vw, 2.5rem)
--space-m-xl: clamp(1.5rem, 0.78rem + 2.41vw, 3.75rem)
```

### Breakpoints & Container Queries
```css
/* Breakpoints */
--breakpoint-xs: 22.5rem   /* 360px - small phones */
--breakpoint-sm: 40rem     /* 640px - large phones */
--breakpoint-md: 48rem     /* 768px - tablets */
--breakpoint-lg: 64rem     /* 1024px - laptops */
--breakpoint-xl: 80rem     /* 1280px - desktops */
--breakpoint-2xl: 96rem    /* 1536px - large desktops */

/* Container query sizes */
--container-sm: 20rem      /* 320px */
--container-md: 28rem      /* 448px */
--container-lg: 36rem      /* 576px */
```

### Sound Tokens (Structure Only)
```css
/* Volume scale - placeholders */
--volume-silent: 0
--volume-whisper: 0.1
--volume-soft: 0.25
--volume-low: 0.4
--volume-medium: 0.6
--volume-high: 0.8
--volume-full: 1.0

/* Sound categories - placeholders */
--sound-volume-master: var(--volume-medium)
--sound-volume-feedback: var(--volume-soft)
--sound-volume-confirmation: var(--volume-medium)
--sound-volume-error: var(--volume-high)
```

## Components to Update (Core 10)

1. **Button** - Touch targets, motion tokens (lift/press already exists)
2. **Card** - Motion tokens for hover transitions
3. **Input** - Touch targets, focus ring tokens
4. **Dialog** - Mode-specific animation (instant light, transform dark)
5. **Select** - Touch targets, focus ring tokens
6. **Tabs** - Motion tokens for indicator animation
7. **Tooltip** - Mode-specific animation
8. **Badge** - Icon size token integration
9. **Alert** - Icon size token integration
10. **Switch** - Touch targets, motion tokens

## Acceptance Criteria

- [ ] Package copied to radflow-tauri/packages/theme-rad-os
- [ ] All motion tokens defined in tokens.css
- [ ] Duration scalar pattern working (0 in light, 1 in dark)
- [ ] Icon size tokens defined and Icon component updated
- [ ] Accessibility tokens (focus ring, touch targets) defined
- [ ] Density system with CSS class activation working
- [ ] Fluid typography scale implemented with clamp()
- [ ] Fluid spacing scale with Utopia pairs implemented
- [ ] xs breakpoint added, container query tokens defined
- [ ] Sound token structure defined (placeholders)
- [ ] Core 10 components updated to use new tokens
- [ ] animations.css migrated to use motion tokens
- [ ] dark.css updated with mode-specific transitions
- [ ] Visual parity with original theme maintained
- [ ] Preview setup working (duplicated + modified)
- [ ] Node.js validation script checks token completeness
- [ ] Migration guide documented

## Quick Commands

```bash
# List tasks
.flow/bin/flowctl tasks --epic fn-6

# Start a task
.flow/bin/flowctl start fn-6.1

# Mark done
.flow/bin/flowctl done fn-6.1 --summary-file summary.md
```

## Dependencies

- **Reads:** fn-3 (theme-spec.md), fn-4 (design-system-infrastructure.md)
- **Parallel:** fn-7 (Theme UI Panel) can work in parallel
- **Deferred to fn-8:** View Transitions API, AI UX patterns

## Migration Guide

When migrating existing code to use the new theme:

1. **Motion**: Replace hardcoded `200ms ease-out` with `var(--transition-base)`
2. **Icons**: Replace fixed sizes with `var(--icon-md)` etc.
3. **Touch targets**: Add `min-height: var(--touch-target-default)` to interactive elements
4. **Density**: Wrap density-sensitive areas with `.density-compact` or `.density-comfortable`
5. **Spacing**: Replace fixed `1rem` with `var(--space-s)` for fluid responsiveness
6. **Focus**: Use `outline: var(--focus-ring-width) solid var(--focus-ring-color)` pattern
