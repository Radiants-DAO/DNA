# Density and Responsive System Architecture

> Research document for fn-4.7: Density/responsive system (breakpoints, variants, fluid scales)

## Executive Summary

This document defines RadFlow's responsive and density token architecture for the theme-rad-os design system. It establishes breakpoint tokens, component density variants (compact/default/comfortable), container query patterns, and fluid spacing/typography scales. The system prioritizes CSS-first implementation with container queries for component-level responsiveness while using viewport breakpoints for layout-level decisions.

**Key Decisions:**
1. **Container queries for components, media queries for layouts** - Components respond to their container; page layouts respond to viewport.
2. **Three density modes** - Compact, default, comfortable with 4px base unit scaling.
3. **Fluid scales** - Adopt Utopia-style fluid typography and spacing using CSS `clamp()`.
4. **Mobile-first breakpoints** - Follow Tailwind v4 conventions with rem units.

---

## Breakpoint Token System

### Design Space Boundaries

Define the "design space" - the viewport range RadFlow optimizes for:

| Boundary | Value | Rationale |
|----------|-------|-----------|
| `--bp-min` | 360px (22.5rem) | Modern smartphone minimum |
| `--bp-max` | 1440px (90rem) | Large desktop/laptop |

Beyond these boundaries, layouts clamp (no further scaling).

### Semantic Breakpoint Tokens

Following Tailwind v4's rem-based approach for consistent scaling with user font preferences:

| Token | Value (rem) | Value (px) | Device Target |
|-------|-------------|------------|---------------|
| `--breakpoint-xs` | 22.5rem | 360px | Small phones |
| `--breakpoint-sm` | 40rem | 640px | Large phones, small tablets |
| `--breakpoint-md` | 48rem | 768px | Tablets portrait |
| `--breakpoint-lg` | 64rem | 1024px | Tablets landscape, small laptops |
| `--breakpoint-xl` | 80rem | 1280px | Laptops, desktops |
| `--breakpoint-2xl` | 96rem | 1536px | Large desktops |

### CSS Custom Properties Definition

```css
:root {
  /* Design space boundaries */
  --bp-min: 22.5rem;   /* 360px */
  --bp-max: 90rem;     /* 1440px */

  /* Semantic breakpoints */
  --breakpoint-xs: 22.5rem;
  --breakpoint-sm: 40rem;
  --breakpoint-md: 48rem;
  --breakpoint-lg: 64rem;
  --breakpoint-xl: 80rem;
  --breakpoint-2xl: 96rem;
}
```

### Tailwind v4 Integration

Using Tailwind v4's `@theme` block:

```css
@import "tailwindcss";

@theme {
  --breakpoint-xs: 22.5rem;
  --breakpoint-sm: 40rem;
  --breakpoint-md: 48rem;
  --breakpoint-lg: 64rem;
  --breakpoint-xl: 80rem;
  --breakpoint-2xl: 96rem;
}
```

This generates utilities like `xs:`, `sm:`, `md:`, `lg:`, `xl:`, `2xl:`.

### Mobile-First Approach

RadFlow uses mobile-first breakpoints:

```css
/* Base styles apply to all viewports (mobile) */
.component {
  padding: var(--space-s);
}

/* Tablet and up */
@media (min-width: 48rem) {
  .component {
    padding: var(--space-m);
  }
}

/* Desktop and up */
@media (min-width: 64rem) {
  .component {
    padding: var(--space-l);
  }
}
```

---

## Container Queries vs Media Queries

### When to Use Each

| Query Type | Use Case | Example |
|------------|----------|---------|
| **Media queries** | Page-level layout shifts | Sidebar visibility, grid columns |
| **Container queries** | Component-level adaptation | Card layout, button sizing |

### Container Query Implementation

Container queries enable truly reusable components that adapt to their container rather than the viewport:

```css
/* Define container */
.card-container {
  container-type: inline-size;
  container-name: card;
}

/* Component responds to container width */
@container card (min-width: 400px) {
  .card {
    display: flex;
    flex-direction: row;
  }
}

@container card (max-width: 399px) {
  .card {
    display: flex;
    flex-direction: column;
  }
}
```

### Container Query Length Units

| Unit | Description | Use Case |
|------|-------------|----------|
| `cqw` | 1% of container width | Fluid widths |
| `cqh` | 1% of container height | Fluid heights |
| `cqi` | 1% of container inline size | Preferred for width |
| `cqb` | 1% of container block size | Preferred for height |
| `cqmin` | Smaller of cqi/cqb | Safe fluid sizing |
| `cqmax` | Larger of cqi/cqb | Maximum fluid sizing |

### Best Practices

1. **Use `container-type: inline-size`** - Avoid `size` unless block-size queries are needed.
2. **Name containers** - `container-name: sidebar;` for clarity.
3. **Don't over-nest** - Each container establishes a new query context.

### Browser Support (2025-2026)

Container queries have 90%+ browser support in 2025. Graceful degradation for older browsers:

```css
/* Fallback: condensed layout for all */
.card {
  display: flex;
  flex-direction: column;
}

/* Modern browsers: expand when space allows */
@container (min-width: 400px) {
  .card {
    flex-direction: row;
  }
}
```

---

## Component Density Variants

### Three Density Modes

Following Cloudscape and Material Design patterns:

| Mode | Description | Vertical Spacing | Use Case |
|------|-------------|------------------|----------|
| **Compact** | High density | Base spacing ÷ 2 | Data tables, dashboards, power users |
| **Default** | Standard | Base spacing | General UI, balanced readability |
| **Comfortable** | Low density | Base spacing × 1.5 | Content-focused, accessibility, onboarding |

### Spacing Scale by Density

Using RadOS's 4px base unit:

| Token | Compact | Default | Comfortable |
|-------|---------|---------|-------------|
| `--density-padding-xs` | 2px | 4px | 6px |
| `--density-padding-sm` | 4px | 8px | 12px |
| `--density-padding-md` | 8px | 16px | 24px |
| `--density-padding-lg` | 12px | 24px | 36px |
| `--density-padding-xl` | 16px | 32px | 48px |

### CSS Implementation

```css
:root {
  /* Density multiplier */
  --density-scale: 1;

  /* Base spacing (4px grid) */
  --spacing-unit: 4px;

  /* Computed density values */
  --density-padding-xs: calc(var(--spacing-unit) * var(--density-scale));
  --density-padding-sm: calc(var(--spacing-unit) * 2 * var(--density-scale));
  --density-padding-md: calc(var(--spacing-unit) * 4 * var(--density-scale));
  --density-padding-lg: calc(var(--spacing-unit) * 6 * var(--density-scale));
  --density-padding-xl: calc(var(--spacing-unit) * 8 * var(--density-scale));
}

/* Density modes */
[data-density="compact"] {
  --density-scale: 0.5;
}

[data-density="default"] {
  --density-scale: 1;
}

[data-density="comfortable"] {
  --density-scale: 1.5;
}
```

### Component Density with CVA

Using Class Variance Authority for type-safe density variants:

```typescript
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-joystix",
  {
    variants: {
      density: {
        compact: "h-7 px-2 text-xs gap-1",
        default: "h-9 px-4 text-sm gap-2",
        comfortable: "h-11 px-6 text-base gap-3",
      },
    },
    defaultVariants: {
      density: "default",
    },
  }
);
```

### Density Context Provider (React)

```typescript
type Density = "compact" | "default" | "comfortable";

const DensityContext = createContext<Density>("default");

function DensityProvider({
  density,
  children
}: {
  density: Density;
  children: ReactNode
}) {
  return (
    <DensityContext.Provider value={density}>
      <div data-density={density}>
        {children}
      </div>
    </DensityContext.Provider>
  );
}

function useDensity() {
  return useContext(DensityContext);
}
```

### Density Selection Guidelines

| Scenario | Recommended Density |
|----------|-------------------|
| Data tables with many rows | Compact |
| Dashboards with dense information | Compact |
| General application UI | Default |
| Marketing/landing pages | Comfortable |
| Accessibility requirements | Comfortable |
| First-time user onboarding | Comfortable |
| Touch-primary interfaces | Comfortable |

---

## Fluid Typography Scale

### Utopia-Style Fluid Type

Instead of jumping between fixed sizes at breakpoints, use CSS `clamp()` for smooth scaling:

```css
:root {
  /* Design space for fluid interpolation */
  --fluid-min-width: 360;   /* px, without unit */
  --fluid-max-width: 1440;  /* px, without unit */
  --fluid-min-size: 16;     /* px, base font at min viewport */
  --fluid-max-size: 18;     /* px, base font at max viewport */

  /* Fluid calculation helper */
  --fluid-bp: (100vw - var(--fluid-min-width) * 1px) /
              (var(--fluid-max-width) - var(--fluid-min-width));
}
```

### RadOS Fluid Type Scale

Mapped to existing DESIGN_SYSTEM.md sizes with fluid interpolation:

| Token | Min (360px) | Max (1440px) | CSS `clamp()` |
|-------|-------------|--------------|---------------|
| `--text-xs` | 10px (0.625rem) | 11px (0.6875rem) | `clamp(0.625rem, 0.6rem + 0.09vw, 0.6875rem)` |
| `--text-sm` | 12px (0.75rem) | 13px (0.8125rem) | `clamp(0.75rem, 0.72rem + 0.11vw, 0.8125rem)` |
| `--text-base` | 14px (0.875rem) | 16px (1rem) | `clamp(0.875rem, 0.82rem + 0.19vw, 1rem)` |
| `--text-lg` | 18px (1.125rem) | 20px (1.25rem) | `clamp(1.125rem, 1.07rem + 0.19vw, 1.25rem)` |
| `--text-xl` | 20px (1.25rem) | 24px (1.5rem) | `clamp(1.25rem, 1.14rem + 0.37vw, 1.5rem)` |
| `--text-2xl` | 24px (1.5rem) | 30px (1.875rem) | `clamp(1.5rem, 1.33rem + 0.56vw, 1.875rem)` |
| `--text-3xl` | 30px (1.875rem) | 38px (2.375rem) | `clamp(1.875rem, 1.64rem + 0.74vw, 2.375rem)` |
| `--text-4xl` | 36px (2.25rem) | 48px (3rem) | `clamp(2.25rem, 1.92rem + 1.11vw, 3rem)` |

### Fluid Type CSS

```css
:root {
  --text-xs: clamp(0.625rem, 0.6rem + 0.09vw, 0.6875rem);
  --text-sm: clamp(0.75rem, 0.72rem + 0.11vw, 0.8125rem);
  --text-base: clamp(0.875rem, 0.82rem + 0.19vw, 1rem);
  --text-lg: clamp(1.125rem, 1.07rem + 0.19vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1.14rem + 0.37vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.33rem + 0.56vw, 1.875rem);
  --text-3xl: clamp(1.875rem, 1.64rem + 0.74vw, 2.375rem);
  --text-4xl: clamp(2.25rem, 1.92rem + 1.11vw, 3rem);
}
```

### Accessibility: Fluid Type and Zoom

**Problem:** Pure `vw` units don't respond to browser zoom.

**Solution:** Always combine `vw` with `rem` in `clamp()`:

```css
/* WRONG: Won't scale with zoom */
font-size: 2vw;

/* RIGHT: Respects user zoom preferences */
font-size: clamp(1rem, 0.82rem + 0.19vw, 1.25rem);
```

The `rem` component ensures text scales when users zoom, meeting WCAG 2.2 criteria for text resizing.

---

## Fluid Spacing Scale

### T-Shirt Size Spacing Tokens

Following Utopia's t-shirt naming with fluid interpolation:

| Token | Min (360px) | Max (1440px) | CSS `clamp()` |
|-------|-------------|--------------|---------------|
| `--space-3xs` | 4px | 4px | `0.25rem` (fixed) |
| `--space-2xs` | 8px | 8px | `0.5rem` (fixed) |
| `--space-xs` | 12px | 14px | `clamp(0.75rem, 0.71rem + 0.19vw, 0.875rem)` |
| `--space-s` | 16px | 20px | `clamp(1rem, 0.89rem + 0.37vw, 1.25rem)` |
| `--space-m` | 24px | 32px | `clamp(1.5rem, 1.28rem + 0.74vw, 2rem)` |
| `--space-l` | 32px | 48px | `clamp(2rem, 1.56rem + 1.48vw, 3rem)` |
| `--space-xl` | 48px | 72px | `clamp(3rem, 2.33rem + 2.22vw, 4.5rem)` |
| `--space-2xl` | 64px | 96px | `clamp(4rem, 3.11rem + 2.96vw, 6rem)` |
| `--space-3xl` | 96px | 144px | `clamp(6rem, 4.67rem + 4.44vw, 9rem)` |

### Space Pairs (Dramatic Variance)

For dramatic spacing changes between viewport sizes, use space pairs:

| Token | Min | Max | Description |
|-------|-----|-----|-------------|
| `--space-s-m` | 16px | 32px | Small → Medium |
| `--space-s-l` | 16px | 48px | Small → Large |
| `--space-m-xl` | 24px | 72px | Medium → Extra Large |

```css
:root {
  --space-s-m: clamp(1rem, 0.56rem + 1.48vw, 2rem);
  --space-s-l: clamp(1rem, 0.11rem + 2.96vw, 3rem);
  --space-m-xl: clamp(1.5rem, 0.17rem + 4.44vw, 4.5rem);
}
```

### Fluid Spacing CSS

```css
:root {
  /* Fixed small spaces (don't need to be fluid) */
  --space-3xs: 0.25rem;  /* 4px */
  --space-2xs: 0.5rem;   /* 8px */

  /* Fluid spaces */
  --space-xs: clamp(0.75rem, 0.71rem + 0.19vw, 0.875rem);
  --space-s: clamp(1rem, 0.89rem + 0.37vw, 1.25rem);
  --space-m: clamp(1.5rem, 1.28rem + 0.74vw, 2rem);
  --space-l: clamp(2rem, 1.56rem + 1.48vw, 3rem);
  --space-xl: clamp(3rem, 2.33rem + 2.22vw, 4.5rem);
  --space-2xl: clamp(4rem, 3.11rem + 2.96vw, 6rem);
  --space-3xl: clamp(6rem, 4.67rem + 4.44vw, 9rem);

  /* Space pairs for dramatic variance */
  --space-s-m: clamp(1rem, 0.56rem + 1.48vw, 2rem);
  --space-s-l: clamp(1rem, 0.11rem + 2.96vw, 3rem);
  --space-m-xl: clamp(1.5rem, 0.17rem + 4.44vw, 4.5rem);
}
```

---

## Integration with RadOS Design System

### Alignment with DESIGN_SYSTEM.md

The responsive system integrates with existing RadOS patterns:

| Existing Pattern | Responsive Enhancement |
|-----------------|----------------------|
| 4px border radius default | Scale with density (2px compact, 4px default, 6px comfortable) |
| `shadow-btn`, `shadow-card` | Same shadows across densities |
| Lift-and-press interactions | Reduce transform distances in compact mode |
| Joystix/Mondwest typography | Maintain fonts, scale sizes fluidly |

### Density-Aware Lift Effect

```css
:root {
  --lift-distance: 2px;
  --press-distance: 1px;
}

[data-density="compact"] {
  --lift-distance: 1px;
  --press-distance: 0.5px;
}

[data-density="comfortable"] {
  --lift-distance: 3px;
  --press-distance: 1.5px;
}

.button {
  transform: translateY(0);
}

.button:hover {
  transform: translateY(calc(var(--lift-distance) * -1));
}

.button:active {
  transform: translateY(var(--press-distance));
}
```

### Responsive RadOS Component Example

```tsx
function Card({ children, className }: CardProps) {
  const density = useDensity();

  return (
    <div
      className={cn(
        // Base styles
        "bg-surface-elevated border border-edge-primary shadow-card",
        // Responsive padding
        "p-[var(--space-s)] md:p-[var(--space-m)]",
        // Density variants
        density === "compact" && "rounded-xs",
        density === "default" && "rounded-sm",
        density === "comfortable" && "rounded-md",
        className
      )}
    >
      {children}
    </div>
  );
}
```

---

## Implementation Recommendations

### Phase 1: Breakpoint Tokens

1. Define breakpoint CSS custom properties.
2. Configure Tailwind v4 `@theme` block.
3. Migrate existing media queries to use tokens.

### Phase 2: Fluid Scales

1. Implement fluid typography scale.
2. Implement fluid spacing scale.
3. Update component styles to use fluid tokens.

### Phase 3: Container Queries

1. Identify components that should respond to container.
2. Add `container-type` to wrapper elements.
3. Replace component media queries with container queries.

### Phase 4: Density System

1. Implement density CSS custom properties.
2. Create DensityProvider context.
3. Add density variants to components via CVA.
4. Add density toggle to RadFlow settings.

---

## Token Summary Table

| Category | Token Pattern | Example |
|----------|---------------|---------|
| Breakpoints | `--breakpoint-{size}` | `--breakpoint-md: 48rem` |
| Fluid Text | `--text-{size}` | `--text-lg: clamp(...)` |
| Fluid Space | `--space-{size}` | `--space-m: clamp(...)` |
| Space Pairs | `--space-{from}-{to}` | `--space-s-l: clamp(...)` |
| Density Scale | `--density-scale` | `0.5`, `1`, `1.5` |
| Density Padding | `--density-padding-{size}` | `--density-padding-md` |
| Lift/Press | `--lift-distance`, `--press-distance` | Density-aware transforms |

---

## References

- [Tailwind CSS 4 @theme Documentation](https://tailwindcss.com/docs/responsive-design)
- [Utopia Fluid Responsive Design](https://utopia.fyi/)
- [Utopia Fluid Space Calculator](https://utopia.fyi/space/calculator/)
- [Cloudscape Content Density](https://cloudscape.design/foundation/visual-foundation/content-density/)
- [Container Queries - Josh W. Comeau](https://www.joshwcomeau.com/css/container-queries-unleashed/)
- [LogRocket: Container Queries in 2026](https://blog.logrocket.com/container-queries-2026)
- [Smashing Magazine: Fluid Typography](https://www.smashingmagazine.com/2022/01/modern-fluid-typography-css-clamp/)
- [CSS Breakpoints for Responsive Design](https://blog.logrocket.com/css-breakpoints-responsive-design/)
- [CVA Enterprise Patterns](https://www.thedanielmark.com/blog/enterprise-component-architecture-type-safe-design-systems-with-class-variance-authority)
