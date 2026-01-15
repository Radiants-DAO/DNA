# Motion Token System Architecture

> Research document for fn-4.4: Motion token system (durations, easings, springs, reduced-motion)

## Executive Summary

This document defines RadFlow's motion token architecture for the theme-rad-os design system. It establishes duration scales, easing functions, orchestration patterns, and accessibility compliance through `prefers-reduced-motion`. The system prioritizes CSS-first implementation for performance while supporting JavaScript animation libraries when needed.

**Key Decision:** RadOS uses ease-out easing only (no springs/bounce) per DESIGN_SYSTEM.md. Motion tokens are theme-specific, allowing other themes (e.g., Phase) to use different motion profiles while sharing the same token API.

---

## Existing RadOS Motion Philosophy

From DESIGN_SYSTEM.md and icon-system-architecture.md:

| Constraint | Value | Rationale |
|------------|-------|-----------|
| Max duration | 300ms | UI responsiveness |
| Easing | ease-out only | Retro aesthetic |
| No bounce | — | Too playful/modern |
| No springs | — | Too modern |
| No color animations | — | Feels cheap |
| Lift-and-press | hover/active | Physical button feel |

This establishes RadOS as a **simple motion theme**. The token system must support this while remaining flexible for other themes.

---

## Duration Token Scale

### Semantic Duration Tokens

Durations use semantic names that describe intent, not raw values. This allows themes to define their own timing while components use consistent APIs.

| Token | RadOS Value | Description | Use Cases |
|-------|-------------|-------------|-----------|
| `--duration-instant` | 0ms | No transition | Reduced motion fallback |
| `--duration-fast` | 100ms | Micro-interactions | Hover states, opacity changes, focus rings |
| `--duration-base` | 150ms | Standard transitions | Fades, small transforms |
| `--duration-moderate` | 200ms | Medium complexity | Slides, state changes |
| `--duration-slow` | 300ms | Max for RadOS | Complex animations, entrances |
| `--duration-slower` | 400ms | Extended (non-RadOS) | Page transitions, large movements |
| `--duration-slowest` | 600ms | Emphasis (non-RadOS) | Dramatic reveals |

**Note:** RadOS clamps at `--duration-slow` (300ms). Other themes may use `--duration-slower` and `--duration-slowest`.

### Duration Scalar Pattern

Adopt the Norton Design System's `duration-scalar` approach for global animation speed control:

```css
:root {
  --duration-scalar: 1;

  /* Computed durations */
  --duration-instant: 0ms;
  --duration-fast: calc(100ms * var(--duration-scalar));
  --duration-base: calc(150ms * var(--duration-scalar));
  --duration-moderate: calc(200ms * var(--duration-scalar));
  --duration-slow: calc(300ms * var(--duration-scalar));
  --duration-slower: calc(400ms * var(--duration-scalar));
  --duration-slowest: calc(600ms * var(--duration-scalar));
}

/* Reduced motion: set scalar to 0 */
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-scalar: 0;
  }
}
```

This enables:
- Global animation speed adjustment for debugging
- Automatic reduced-motion compliance
- Theme-level duration customization

---

## Easing Token Scale

### Semantic Easing Tokens

| Token | RadOS Value | CSS | Use Case |
|-------|-------------|-----|----------|
| `--ease-default` | ease-out | `cubic-bezier(0, 0, 0.2, 1)` | All standard transitions |
| `--ease-linear` | linear | `linear` | Progress indicators, loaders |
| `--ease-in` | ease-in | `cubic-bezier(0.4, 0, 1, 1)` | Exiting elements |
| `--ease-out` | ease-out | `cubic-bezier(0, 0, 0.2, 1)` | Entering elements (default) |
| `--ease-in-out` | ease-in-out | `cubic-bezier(0.4, 0, 0.2, 1)` | Symmetric transitions |
| `--ease-spring` | disabled | N/A | Other themes (bouncy UI) |
| `--ease-bounce` | disabled | N/A | Other themes (playful UI) |

### Cubic Bezier Reference

```
ease-out:     cubic-bezier(0, 0, 0.2, 1)      Fast start, slow end
ease-in:      cubic-bezier(0.4, 0, 1, 1)      Slow start, fast end
ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1)    Slow-fast-slow
linear:       linear                           Constant speed
```

### RadOS-Specific: Why No Springs?

Springs suit **user-input-driven** interactions (drag, flick, gesture) because they:
- Remain responsive when interrupted
- Reflect input energy naturally
- Have no fixed end time

RadOS uses **system-driven** transitions (button hovers, panel slides) where:
- Timing is predictable
- Duration is controlled
- Ease-out provides sufficient polish

**Recommendation:** Reserve spring tokens for themes with gesture-heavy UIs (e.g., mobile-first themes).

---

## Transition Composition Tokens

### Shorthand Tokens

Combine duration + easing for common patterns:

| Token | Value | Use Case |
|-------|-------|----------|
| `--transition-fast` | `var(--duration-fast) var(--ease-default)` | Hover states |
| `--transition-base` | `var(--duration-base) var(--ease-default)` | Standard UI |
| `--transition-slow` | `var(--duration-slow) var(--ease-default)` | Entrances |

### Usage Example

```css
.button {
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
}

.panel {
  transition: transform var(--transition-base);
}

.modal {
  transition:
    opacity var(--transition-slow),
    transform var(--transition-slow);
}
```

---

## Spring Physics (Non-RadOS Themes)

For themes that use spring animations, define physics-based tokens:

### Physics-Based Spring Tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--spring-stiffness` | 100 | Spring tension (higher = snappier) |
| `--spring-damping` | 10 | Resistance (higher = less bounce) |
| `--spring-mass` | 1 | Weight (higher = more inertia) |

### Duration-Based Spring Tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--spring-duration` | 300ms | Visual duration |
| `--spring-bounce` | 0.25 | Overshoot amount (0-1) |

### JavaScript Usage (Framer Motion)

```tsx
// Using physics-based springs
const springConfig = {
  stiffness: getCssVar('--spring-stiffness'),
  damping: getCssVar('--spring-damping'),
  mass: getCssVar('--spring-mass'),
};

// Using duration-based springs
const springConfig = {
  duration: getCssVar('--spring-duration'),
  bounce: getCssVar('--spring-bounce'),
};
```

### When Springs Apply

| Interaction | Easing | Spring | Why |
|-------------|--------|--------|-----|
| Button hover | Default | — | System-driven, predictable |
| Modal open | Default | — | System-driven |
| Drag gesture | — | Spring | User-driven, interruptible |
| Pull-to-refresh | — | Spring | User-driven, physics feel |
| Card flick | — | Spring | User-driven, momentum |

---

## Orchestration Patterns

### Stagger Tokens

For animating lists and groups with cascading timing:

| Token | Value | Use Case |
|-------|-------|----------|
| `--stagger-none` | 0ms | Simultaneous |
| `--stagger-fast` | 30ms | Quick cascade |
| `--stagger-base` | 50ms | Standard list |
| `--stagger-slow` | 80ms | Emphasized sequence |

### Implementation

```css
.list-item {
  animation: fadeSlideIn var(--duration-base) var(--ease-out) backwards;
}

.list-item:nth-child(1) { animation-delay: calc(var(--stagger-base) * 0); }
.list-item:nth-child(2) { animation-delay: calc(var(--stagger-base) * 1); }
.list-item:nth-child(3) { animation-delay: calc(var(--stagger-base) * 2); }
/* ... */
```

### JavaScript Stagger (Motion.dev)

```tsx
import { stagger, animate } from "motion";

animate(".list-item", { opacity: [0, 1], y: [20, 0] }, {
  delay: stagger(0.05), // 50ms per item
  duration: 0.15,
  easing: [0, 0, 0.2, 1], // ease-out
});
```

### Choreography Hierarchy

Per Fluent 2 guidance:

1. **Primary elements**: Longer duration, prominent easing
2. **Secondary elements**: Standard duration, grouped timing
3. **Background elements**: Instant or minimal motion

Example:
```css
/* Modal entrance */
.modal-backdrop { animation-delay: 0ms; }    /* First: background fades */
.modal-card { animation-delay: 50ms; }       /* Second: card slides */
.modal-content { animation-delay: 100ms; }   /* Third: content fades */
```

---

## Accessibility: prefers-reduced-motion

### Implementation Strategy

Use the **duration-scalar** pattern (set to 0) rather than disabling animations entirely. This:
- Preserves state changes (visibility toggles still work)
- Avoids breaking functionality
- Reduces cognitive load without jarring instant changes

### CSS Implementation

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-scalar: 0;
  }

  /* Fallback for non-scalar animations */
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

**Why 0.001ms instead of 0ms?**
Setting to 0ms can break some JavaScript animation libraries. Near-zero duration achieves the same effect safely.

### JavaScript Detection

```tsx
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// React hook
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}
```

### Component Usage

```tsx
function AnimatedPanel({ children }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.15,
        ease: [0, 0, 0.2, 1]
      }}
    >
      {children}
    </motion.div>
  );
}
```

### What to Reduce vs. Preserve

| Animation Type | Reduced Motion Behavior |
|----------------|-------------------------|
| Decorative (parallax, hover effects) | Remove entirely |
| State feedback (toggle, check) | Keep, reduce duration |
| Loading indicators | Keep rotation, remove pulse |
| Page transitions | Fade only, no slide |
| Error jiggle | Fade to red only |

---

## View Transitions API Integration

### Browser Support (2025)

The View Transitions API is now Baseline Newly Available (Firefox 144+, October 2025). RadFlow should progressively enhance with view transitions.

### CSS Setup

```css
@view-transition {
  navigation: auto;
}

::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: var(--duration-slow);
  animation-timing-function: var(--ease-out);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 0.001ms;
  }
}
```

### JavaScript Integration

```tsx
function navigateWithTransition(url: string) {
  if (!document.startViewTransition) {
    window.location.href = url;
    return;
  }

  document.startViewTransition(() => {
    window.location.href = url;
  });
}
```

### Named Transitions

```css
.hero-image {
  view-transition-name: hero;
}

::view-transition-group(hero) {
  animation-duration: var(--duration-slow);
}
```

---

## Token File Structure

### Recommended Organization

```
packages/theme-rad-os/
├── tokens/
│   ├── motion.css          # Duration + easing tokens
│   └── animations.css      # Keyframe definitions
└── styles/
    └── transitions.css     # Component transition utilities
```

### motion.css

```css
:root {
  /* Duration scalar (0 for reduced motion) */
  --duration-scalar: 1;

  /* Duration scale */
  --duration-instant: 0ms;
  --duration-fast: calc(100ms * var(--duration-scalar));
  --duration-base: calc(150ms * var(--duration-scalar));
  --duration-moderate: calc(200ms * var(--duration-scalar));
  --duration-slow: calc(300ms * var(--duration-scalar));
  --duration-slower: calc(400ms * var(--duration-scalar));
  --duration-slowest: calc(600ms * var(--duration-scalar));

  /* Easing scale (RadOS: ease-out only) */
  --ease-default: cubic-bezier(0, 0, 0.2, 1);
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* Transition shorthands */
  --transition-fast: var(--duration-fast) var(--ease-default);
  --transition-base: var(--duration-base) var(--ease-default);
  --transition-moderate: var(--duration-moderate) var(--ease-default);
  --transition-slow: var(--duration-slow) var(--ease-default);

  /* Stagger scale */
  --stagger-none: 0ms;
  --stagger-fast: 30ms;
  --stagger-base: 50ms;
  --stagger-slow: 80ms;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-scalar: 0;
  }
}
```

### animations.css

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* RadOS lift-and-press already in components */
```

---

## Component Motion Patterns

### Button (Lift and Press)

```css
.button {
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
}

.button:hover {
  transform: translateY(-0.125rem);
}

.button:active {
  transform: translateY(0.125rem);
}
```

### Modal

```css
.modal-backdrop {
  animation: fadeIn var(--duration-base) var(--ease-out);
}

.modal-content {
  animation: scaleIn var(--duration-slow) var(--ease-out);
}
```

### Dropdown

```css
.dropdown {
  animation: slideInDown var(--duration-base) var(--ease-out);
}
```

### Toast

```css
.toast {
  animation: slideInUp var(--duration-base) var(--ease-out);
}
```

---

## Recommendations for RadFlow

### Immediate Implementation

1. **Add motion tokens** to theme-rad-os package
2. **Implement duration-scalar** for global control + reduced motion
3. **Update DESIGN_SYSTEM.md** with motion token reference
4. **Add motion linting** to prevent non-token animation values

### Future Considerations

1. **View Transitions API** for page navigation (progressive enhancement)
2. **Spring presets** for future themes (not RadOS)
3. **Motion debugging tools** (scalar slider in dev mode)
4. **Animation performance monitoring** (frame rate tracking)

### Implementation Priority

| Phase | Task | Complexity |
|-------|------|------------|
| 1 | Duration tokens | Low |
| 1 | Easing tokens | Low |
| 1 | Reduced motion handling | Low |
| 2 | Transition utilities | Medium |
| 2 | Animation keyframes | Medium |
| 3 | Stagger utilities | Medium |
| 3 | View Transitions | Medium |
| 4 | Spring presets | High (non-RadOS) |

---

## References

### Research Sources

- [Framer Motion Transitions](https://www.framer.com/motion/transition/)
- [Framer Time-Based Springs](https://www.framer.com/updates/time-based-springs)
- [Motion.dev Spring Configuration](https://motion.dev/docs/spring)
- [Norton Design System Motion](https://wwnorton.github.io/design-system/docs/foundations/motion/)
- [PatternFly Motion](https://www.patternfly.org/design-foundations/motion/)
- [Fluent 2 Motion](https://fluent2.microsoft.design/motion)
- [UserInterface.wiki: To Spring or Not to Spring](https://www.userinterface.wiki/to-spring-or-not-to-spring)
- [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
- [Chrome View Transitions 2025](https://developer.chrome.com/blog/view-transitions-in-2025)
- [W3C WCAG C39 Technique](https://www.w3.org/WAI/WCAG21/Techniques/css/C39)

### Project Context

- DESIGN_SYSTEM.md animation constraints
- icon-system-architecture.md animation patterns
- 01-variables-editor.md animation token categories

---

## Appendix: Token Quick Reference

### Duration Tokens

```css
--duration-instant   /* 0ms     | No motion */
--duration-fast      /* 100ms   | Micro-interactions */
--duration-base      /* 150ms   | Standard UI */
--duration-moderate  /* 200ms   | Medium complexity */
--duration-slow      /* 300ms   | Complex/entrance */
--duration-slower    /* 400ms   | Extended (non-RadOS) */
--duration-slowest   /* 600ms   | Emphasis (non-RadOS) */
--duration-scalar    /* 1 or 0  | Global multiplier */
```

### Easing Tokens

```css
--ease-default  /* ease-out    | Standard */
--ease-linear   /* linear      | Progress */
--ease-in       /* ease-in     | Exit */
--ease-out      /* ease-out    | Enter */
--ease-in-out   /* ease-in-out | Symmetric */
```

### Transition Shorthand

```css
--transition-fast      /* 100ms ease-out */
--transition-base      /* 150ms ease-out */
--transition-moderate  /* 200ms ease-out */
--transition-slow      /* 300ms ease-out */
```

### Stagger Tokens

```css
--stagger-none  /* 0ms  | Simultaneous */
--stagger-fast  /* 30ms | Quick cascade */
--stagger-base  /* 50ms | Standard list */
--stagger-slow  /* 80ms | Emphasized */
```
