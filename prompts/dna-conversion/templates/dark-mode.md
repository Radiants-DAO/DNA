# Task Template: Dark Mode

Use this template for tasks that create dark mode overrides for semantic tokens.

---

## Token Behavior in Dark Mode

**CRITICAL:** Not all tokens invert. Understanding which tokens change is key to a correct implementation.

| Token Category | Dark Mode Behavior | Why |
|----------------|-------------------|-----|
| `surface-*` | **INVERT** | Backgrounds flip (light→dark, dark→light) |
| `content-*` | **INVERT** | Text flips to contrast with new backgrounds |
| `edge-*` | **INVERT** | Borders flip for visibility |
| `action-*` | **STAY SAME** | Brand action colors maintain identity |
| `status-*` | **STAY SAME** | Success/error/warning colors are universal |

---

## Activation Methods

Support all three dark mode activation methods for maximum compatibility:

1. **`@media (prefers-color-scheme: dark)`** - System preference
2. **`[data-theme="dark"]`** - Data attribute on html/body
3. **`.dark`** - Class on html/body

---

## Task Structure

```markdown
# Task: Dark Mode Configuration

**Sprint:** 5
**Dependencies:** 01-token-foundation, Sprint 4 complete
**Complexity:** Medium

## Description

Create dark mode overrides for all semantic tokens. In dark mode, surface/content/edge tokens swap their values while action/status tokens remain constant.

## Files to Create/Modify

- `{css_path}/dark.css` - Create dark mode token overrides
- `{css_path}/index.css` - Import dark.css

## Implementation Steps

### 1. Create dark.css

Support all three activation methods. Each section has identical token overrides:

```css
/* Dark mode via prefers-color-scheme */
@media (prefers-color-scheme: dark) {
  :root {
    /* Surface tokens - INVERT */
    --color-surface-primary: var(--color-black);
    --color-surface-secondary: var(--color-white);
    --color-surface-tertiary: var(--color-neutral-neutral-4);
    --color-surface-elevated: var(--color-neutral-neutral-5, #1a1a1a);

    /* Content tokens - INVERT */
    --color-content-primary: var(--color-white);
    --color-content-secondary: var(--color-neutral-neutral-2);
    --color-content-inverted: var(--color-black);
    --color-content-muted: var(--color-neutral-neutral-3);

    /* Edge tokens - INVERT */
    --color-edge-primary: var(--color-white);
    --color-edge-secondary: var(--color-neutral-neutral-3);
    --color-edge-muted: var(--color-neutral-neutral-4);
    --color-edge-inverted: var(--color-black);

    /* Action tokens - STAY SAME (brand identity) */
    --color-action-primary: var(--color-green);
    --color-action-secondary: var(--color-white);
    --color-action-destructive: var(--color-accent-1);

    /* Status tokens - STAY SAME (universal meaning) */
    --color-status-success: var(--color-green);
    --color-status-warning: var(--color-accent-2);
    --color-status-error: var(--color-accent-1);
  }
}

/* Dark mode via data-theme attribute */
[data-theme="dark"] {
  /* Same overrides as above */
}

/* Dark mode via .dark class */
.dark {
  /* Same overrides as above */
}
```

### 2. Add prefers-color-scheme support (optional)

```css
@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    /* Same overrides as .dark */
  }
}
```

### 3. Import in index.css

```css
@import "./dark.css";
```

## Validation Criteria

- [ ] `.dark` class toggles all semantic tokens
- [ ] Surface tokens invert (light → dark, dark → light)
- [ ] Content tokens maintain contrast
- [ ] Text is readable on all backgrounds (WCAG AA)
- [ ] Focus states are visible in dark mode
- [ ] Status colors remain distinguishable

## Commit Message

```
feat(dark-mode): add dark mode token overrides

- Surface tokens invert for dark backgrounds
- Content tokens maintain contrast
- Status tokens adjusted for dark visibility
```
```

---

## Reference Implementation

### Minimal dark.css

```css
/* =============================================================================
   Dark Mode Token Overrides
   ============================================================================= */

.dark {
  /* Surface - Invert primary/secondary */
  --color-surface-primary: var(--color-black);
  --color-surface-secondary: var(--color-white);
  --color-surface-tertiary: #1a1a1a;
  --color-surface-elevated: #2a2a2a;
  --color-surface-muted: #0a0a0a;

  /* Content - Invert for contrast */
  --color-content-primary: var(--color-white);
  --color-content-inverted: var(--color-black);
  --color-content-muted: rgba(255, 255, 255, 0.6);
  --color-content-link: var(--color-blue);

  /* Edge - Adjust for dark backgrounds */
  --color-edge-primary: var(--color-white);
  --color-edge-muted: rgba(255, 255, 255, 0.2);
  --color-edge-focus: var(--color-blue);

  /* Action - May need brightness adjustment */
  --color-action-primary: var(--color-green);
  --color-action-secondary: var(--color-white);
  --color-action-destructive: var(--color-red);

  /* Status - Often need dark-optimized variants */
  --color-status-success: var(--color-success-green-dark);
  --color-status-warning: var(--color-warning-yellow-dark);
  --color-status-error: var(--color-error-red-dark);
  --color-status-info: var(--color-blue);
}

/* Prefers-color-scheme automatic switching */
@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    --color-surface-primary: var(--color-black);
    --color-surface-secondary: var(--color-white);
    /* ... same overrides ... */
  }
}
```

---

## Color Contrast Guidelines

### WCAG AA Requirements

| Text Size | Minimum Contrast |
|-----------|------------------|
| Normal text (< 18px) | 4.5:1 |
| Large text (≥ 18px bold or ≥ 24px) | 3:1 |
| UI components | 3:1 |

### Common Dark Mode Patterns

1. **Pure inversion:** Swap black ↔ white
   - Simple but can be harsh

2. **Soft dark:** Use off-black (#1a1a1a) and off-white (#f0f0f0)
   - Easier on eyes, less contrast strain

3. **Elevated surfaces:** Lighter shades for cards/modals
   - Creates depth hierarchy

### Testing Dark Mode

```tsx
// Toggle dark mode class
document.documentElement.classList.toggle('dark');

// Or with prefers-color-scheme
// Browser handles automatically
```

---

## Status Colors in Dark Mode

Status colors often need separate dark variants for visibility:

| Status | Light Mode | Dark Mode | Why |
|--------|------------|-----------|-----|
| Success | #22C55E | #87BB82 | Brighter greens wash out on dark |
| Error | #FF6B63 | #9E433E | Desaturate for dark backgrounds |
| Warning | #FCE184 | #BE9D2B | Darken to maintain contrast |
| Info | #95BAD2 | #95BAD2 | Often works in both |

---

## Text Selection Styles

Don't forget to override text selection for dark mode:

```css
@media (prefers-color-scheme: dark) {
  ::selection {
    background: var(--color-white);
    color: var(--color-black);
  }

  ::-moz-selection {
    background: var(--color-white);
    color: var(--color-black);
  }
}

[data-theme="dark"] ::selection,
.dark ::selection {
  background: var(--color-white);
  color: var(--color-black);
}

[data-theme="dark"] ::-moz-selection,
.dark ::-moz-selection {
  background: var(--color-white);
  color: var(--color-black);
}
```

---

## Checklist Before Committing

- [ ] Test toggle between light/dark modes
- [ ] Check all component states (default, hover, focus, disabled)
- [ ] Verify shadows are visible in dark mode
- [ ] Test with browser's prefers-color-scheme
- [ ] Test with `[data-theme="dark"]` attribute
- [ ] Test with `.dark` class
- [ ] Check text selection colors
- [ ] Check for any hardcoded colors that bypass tokens
- [ ] Verify action/status tokens did NOT change (should stay constant)
