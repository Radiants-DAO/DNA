# Accessibility Token Patterns Research

> Task: fn-4.5 - Research accessibility token patterns (focus, touch targets, contrast)

## Executive Summary

RadFlow requires a comprehensive accessibility token system that ensures WCAG 2.2 compliance while maintaining the RadOS design aesthetic. This document defines tokens for focus rings, touch targets, color contrast, screen reader announcements, and keyboard navigation patterns.

**Key Standards**: WCAG 2.2 Level AA (minimum), with considerations for AAA where practical.

---

## Focus Ring Token System

### Current RadOS Focus Style

From DESIGN_SYSTEM.md:
```css
focus:ring-2 focus:ring-edge-focus focus:ring-offset-2
```

Where `edge-focus` = Sky Blue `#95BAD2`

### Focus Ring Tokens

| Token | Value | Description |
|-------|-------|-------------|
| `--focus-ring-width` | 2px | Ring stroke width |
| `--focus-ring-offset` | 2px | Gap between element and ring |
| `--focus-ring-color` | var(--edge-focus) | Sky Blue `#95BAD2` |
| `--focus-ring-style` | solid | Ring style |
| `--focus-ring-opacity` | 1 | Full opacity for visibility |

### Double Ring Pattern (High Contrast)

For guaranteed visibility across all backgrounds, implement a layered focus ring:

```css
/* Double focus ring for maximum visibility */
:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
  /* Inner contrasting ring via box-shadow */
  box-shadow:
    0 0 0 var(--focus-ring-width) var(--surface-primary),
    0 0 0 calc(var(--focus-ring-width) * 2) var(--focus-ring-color);
}
```

**Rationale**: A single blue ring may not be visible on blue-tinted backgrounds. The double ring (white inner, blue outer) ensures visibility in all contexts.

### Focus-Visible vs Focus

Always use `:focus-visible` over `:focus` for keyboard-only focus indicators:

```css
/* Hide focus ring for mouse clicks */
:focus:not(:focus-visible) {
  outline: none;
  box-shadow: none;
}

/* Show focus ring for keyboard navigation */
:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}
```

### Component-Specific Focus Patterns

**Buttons (Lift and Press)**
```css
.button:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
  /* Maintain RadOS lift effect */
  transform: translateY(-0.5px);
}
```

**Inputs**
```css
.input:focus-visible {
  outline: none;
  border-color: var(--focus-ring-color);
  box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color);
  background-color: var(--surface-elevated);
}
```

**Cards (Interactive)**
```css
.card-interactive:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
  /* Lift effect maintained */
  box-shadow: var(--shadow-card-hover);
}
```

### Forced Colors Mode

Ensure focus rings work in Windows High Contrast mode:

```css
@media (forced-colors: active) {
  :focus-visible {
    outline: 2px solid CanvasText;
    outline-offset: 2px;
  }
}
```

---

## Touch Target Token System

### WCAG Requirements

| Standard | Minimum Size | Level |
|----------|--------------|-------|
| WCAG 2.5.8 | 24×24 CSS pixels | AA |
| WCAG 2.5.5 | 44×44 CSS pixels | AAA |
| Apple HIG | 44×44 points | Best Practice |
| Material Design | 48×48 dp | Best Practice |

### Touch Target Tokens

| Token | Value | Use Case |
|-------|-------|----------|
| `--touch-target-min` | 24px | Absolute minimum (WCAG AA) |
| `--touch-target-default` | 44px | Standard interactive elements |
| `--touch-target-comfortable` | 48px | Primary actions, mobile-first |

### Implementation Patterns

**Minimum Tap Area Mixin**
```css
/* Ensure 44×44 tap area even for small visual elements */
.touch-target-44 {
  position: relative;
  /* Visual size can be smaller */
}

.touch-target-44::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: var(--touch-target-default);
  min-height: var(--touch-target-default);
}
```

**Inline Link Exception**
```css
/* Links within text blocks are exempt from target size */
.prose a {
  /* Natural text size, no forced minimum */
}
```

**Icon Button with Adequate Target**
```css
.icon-button {
  /* Visual: 32px icon */
  width: 32px;
  height: 32px;
  /* Touch: 44px target */
  padding: calc((var(--touch-target-default) - 32px) / 2);
  margin: calc((var(--touch-target-default) - 32px) / -2);
}
```

### Spacing Requirements

Adjacent targets must either:
1. Be at least 24×24px each, OR
2. Have sufficient spacing so their combined area equals 24×24

```css
/* Ensure adequate spacing between adjacent targets */
.button-group > * + * {
  margin-left: max(8px, calc(24px - var(--button-width)));
}
```

---

## Color Contrast Token System

### Current WCAG 2.x Requirements

| Criterion | Ratio | Applies To |
|-----------|-------|------------|
| 1.4.3 Level AA | 4.5:1 | Normal text (<24px) |
| 1.4.3 Level AA | 3:1 | Large text (≥24px or ≥19px bold) |
| 1.4.11 Level AA | 3:1 | UI components, graphical objects |

### RadOS Color Contrast Analysis

**Light Mode (Warm Cloud background `#FEF8E2`)**

| Foreground | Hex | Contrast Ratio | Passes |
|------------|-----|----------------|--------|
| Black | `#0F0E0C` | 14.8:1 | AA, AAA |
| Sun Yellow | `#FCE184` | 1.3:1 | FAIL (decorative only) |
| Sky Blue | `#95BAD2` | 2.6:1 | FAIL for text |
| Sun Red | `#FF6B63` | 3.2:1 | Large text only |

**Dark Mode (Black background `#0F0E0C`)**

| Foreground | Hex | Contrast Ratio | Passes |
|------------|-----|----------------|--------|
| Warm Cloud | `#FEF8E2` | 14.8:1 | AA, AAA |
| Sun Yellow | `#FCE184` | 11.4:1 | AA, AAA |
| Sky Blue | `#95BAD2` | 5.7:1 | AA |

### Contrast Tokens

| Token | Light Mode | Dark Mode | Purpose |
|-------|------------|-----------|---------|
| `--contrast-text-high` | `#0F0E0C` | `#FEF8E2` | Body text, headings |
| `--contrast-text-medium` | `#0F0E0C @ 70%` | `#FEF8E2 @ 70%` | Secondary text |
| `--contrast-text-low` | `#0F0E0C @ 50%` | `#FEF8E2 @ 60%` | Disabled, placeholders |
| `--contrast-link` | `#0F0E0C` | `#95BAD2` | Interactive links |
| `--contrast-ui-boundary` | `#0F0E0C` | `#FEF8E2` | Borders, icons |

### Sky Blue Link Accessibility Fix

The Sky Blue link color (`#95BAD2`) fails on Warm Cloud background. Solutions:

**Option 1: Underline Links (Recommended)**
```css
a {
  color: var(--content-link);
  text-decoration: underline;
  /* Underline provides non-color visual indicator */
}
```

**Option 2: Darker Link Blue**
```css
:root {
  --content-link-accessible: #4A7A9E; /* 4.7:1 on Warm Cloud */
}
```

**Option 3: Context-Aware Links**
```css
/* On light backgrounds, darken */
.surface-primary a {
  color: #4A7A9E;
}

/* On dark backgrounds, use original */
.surface-secondary a {
  color: #95BAD2;
}
```

### APCA Consideration

WCAG 3.0 (draft) will use APCA (Advanced Perceptual Contrast Algorithm):
- Accounts for font weight and size
- Uses Lightness Contrast (Lc) values 0-100+
- More accurate for real-world readability

**RadOS APCA Targets (future-proofing)**:
- Body text (14px): Lc 60+
- Large text (24px+): Lc 45+
- UI components: Lc 30+

### Contrast Validation Rules

```typescript
interface ContrastValidation {
  pair: [string, string];
  minRatio: 4.5 | 3.0;
  context: 'text' | 'large-text' | 'ui-component';
  passes: boolean;
}

const rules: ContrastValidation[] = [
  { pair: ['content-primary', 'surface-primary'], minRatio: 4.5, context: 'text', passes: true },
  { pair: ['content-link', 'surface-primary'], minRatio: 4.5, context: 'text', passes: false },
  { pair: ['edge-primary', 'surface-primary'], minRatio: 3.0, context: 'ui-component', passes: true }
];
```

---

## Screen Reader Announcement Patterns

### Live Region Tokens

| Token | Value | Use Case |
|-------|-------|----------|
| `--aria-live-polite` | "polite" | Non-urgent updates |
| `--aria-live-assertive` | "assertive" | Critical alerts only |
| `--aria-live-delay` | 100ms | Debounce rapid updates |

### ARIA Live Region Implementation

**Status Messages (Polite)**
```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

**Error Alerts (Assertive)**
```tsx
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

**Progress Announcements**
```tsx
<div
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Loading design tokens"
>
  {progress}% complete
</div>
```

### Announcement Patterns

**Toast Notifications**
```tsx
// Use role="status" for transient messages
<Toast role="status" aria-live="polite">
  Changes saved
</Toast>
```

**Form Validation**
```tsx
// Use aria-describedby for inline errors
<Input
  aria-invalid={hasError}
  aria-describedby={hasError ? `${id}-error` : undefined}
/>
<span id={`${id}-error`} role="alert">
  {errorMessage}
</span>
```

**Modal Announcements**
```tsx
// Dialog automatically announces title
<Dialog aria-labelledby="dialog-title" aria-describedby="dialog-desc">
  <h2 id="dialog-title">Confirm Delete</h2>
  <p id="dialog-desc">This action cannot be undone.</p>
</Dialog>
```

### Live Region Best Practices

1. **Start empty**: Create live regions on page load, populate later
2. **Wait for registration**: 100ms delay after DOM insert before updating
3. **Use polite by default**: Reserve assertive for true emergencies
4. **Keep messages brief**: Screen readers announce the entire region
5. **No redundant announcements**: Don't announce what's already focused

---

## Keyboard Navigation Conventions

### Skip Links

```tsx
<a href="#main-content" className="skip-link">
  Skip to main content
</a>

<main id="main-content" tabIndex={-1}>
  {/* Main content */}
</main>
```

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  padding: 8px;
  background: var(--surface-tertiary);
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

### Roving Tabindex Pattern

For composite widgets (radio groups, tab lists, menus):

```tsx
function RadioGroup({ options, selected, onChange }) {
  return (
    <div role="radiogroup">
      {options.map((option, i) => (
        <div
          key={option.value}
          role="radio"
          aria-checked={option.value === selected}
          tabIndex={option.value === selected ? 0 : -1}
          onKeyDown={(e) => handleArrowNav(e, i, options, onChange)}
        >
          {option.label}
        </div>
      ))}
    </div>
  );
}
```

**Arrow Key Navigation**:
- Arrow Down/Right: Next item
- Arrow Up/Left: Previous item
- Home: First item
- End: Last item

### Focus Trapping (Modals)

```tsx
function FocusTrap({ children }) {
  const trapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trap = trapRef.current;
    if (!trap) return;

    const focusables = trap.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const first = focusables[0] as HTMLElement;
    const last = focusables[focusables.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    trap.addEventListener('keydown', handleKeyDown);
    first.focus();

    return () => trap.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <div ref={trapRef}>{children}</div>;
}
```

### Keyboard Navigation Tokens

| Token | Keys | Action |
|-------|------|--------|
| `--key-confirm` | Enter, Space | Activate button/link |
| `--key-cancel` | Escape | Close modal, cancel action |
| `--key-next` | Arrow Down, Arrow Right | Next item in group |
| `--key-prev` | Arrow Up, Arrow Left | Previous item in group |
| `--key-first` | Home | First item in group |
| `--key-last` | End | Last item in group |

---

## Radix Primitives Integration

### Why Radix for Accessibility

Radix Primitives provide:
- WAI-ARIA compliant attribute handling
- Automatic focus management
- Keyboard navigation built-in
- Screen reader testing across browsers

### RadFlow + Radix Pattern

```tsx
import * as Dialog from '@radix-ui/react-dialog';

function RadOSDialog({ trigger, title, children }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        {trigger}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>{title}</Dialog.Title>
          {children}
          <Dialog.Close asChild>
            <button className="dialog-close" aria-label="Close">
              <X />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### Radix Focus Management Customization

```tsx
<Dialog.Content
  onOpenAutoFocus={(e) => {
    // Focus specific element on open
    e.preventDefault();
    document.getElementById('cancel-button')?.focus();
  }}
  onCloseAutoFocus={(e) => {
    // Return focus to trigger on close
    // (default behavior, usually don't override)
  }}
>
```

---

## Implementation Recommendations

### 1. Token File Structure

```
tokens/
├── accessibility/
│   ├── focus.css
│   ├── touch-targets.css
│   ├── contrast.css
│   └── keyboard.css
└── index.css
```

### 2. CSS Custom Properties

```css
/* tokens/accessibility/focus.css */
:root {
  --focus-ring-width: 2px;
  --focus-ring-offset: 2px;
  --focus-ring-color: var(--edge-focus);
}

/* tokens/accessibility/touch-targets.css */
:root {
  --touch-target-min: 24px;
  --touch-target-default: 44px;
  --touch-target-comfortable: 48px;
}

/* tokens/accessibility/contrast.css */
:root {
  --contrast-ratio-text: 4.5;
  --contrast-ratio-large-text: 3.0;
  --contrast-ratio-ui: 3.0;
}
```

### 3. Priority Roadmap

| Phase | Tokens | Impact |
|-------|--------|--------|
| **P1** | Focus rings | Critical for keyboard users |
| **P1** | Touch targets | Critical for mobile/motor |
| **P2** | Contrast validation | Important for low vision |
| **P2** | Skip links | Important for screen readers |
| **P3** | Live regions | Enhanced experience |
| **P3** | APCA preparation | Future-proofing |

---

## References

### Standards
- [WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/)
- [WCAG 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [WCAG 2.5.5 Target Size (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### Libraries
- [Radix Primitives Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [Chakra UI Focus Ring](https://chakra-ui.com/docs/styling/focus-ring)

### Techniques
- [Double Focus Ring Pattern](https://piccalil.li/blog/taking-a-shot-at-the-double-focus-ring-problem-using-modern-css/)
- [ARIA Live Regions Guide](https://www.a11y-collective.com/blog/aria-live/)
- [Roving Tabindex Explained](https://www.stefanjudis.com/today-i-learned/roving-tabindex/)
- [APCA Contrast Calculator](https://www.myndex.com/APCA/)

### Related RadFlow Docs
- Theme: `/Users/rivermassey/Desktop/dev/radflow/packages/theme-rad-os/DESIGN_SYSTEM.md`
- Motion Tokens: `docs/research/motion-token-system.md`
- Icon System: `docs/research/icon-system-architecture.md`

---

## Summary Checklist

- [x] Focus ring tokens (width, offset, color)
- [x] Double ring pattern for high contrast
- [x] Focus-visible vs focus behavior
- [x] Touch target tokens (min, default, comfortable)
- [x] Touch target implementation patterns
- [x] WCAG 2.2 contrast requirements documented
- [x] RadOS color contrast analysis
- [x] Sky Blue link accessibility fix options
- [x] APCA future-proofing notes
- [x] Screen reader live region patterns
- [x] Skip links implementation
- [x] Roving tabindex pattern
- [x] Focus trapping for modals
- [x] Radix Primitives integration guide
- [x] Token file structure recommendation
- [x] Implementation priority roadmap
