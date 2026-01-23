# @dna/radiants

Radiants theme package for DNA (Design Nexus Architecture) — a retro pixel aesthetic design system.

## Installation

```bash
npm install @dna/radiants
```

## Usage

### CSS Tokens

Import the theme tokens in your CSS:

```css
/* Import all tokens + base styles */
@import '@dna/radiants';

/* Import dark mode support */
@import '@dna/radiants/dark';
```

Or import individual parts:

```css
@import '@dna/radiants/tokens';      /* Tokens only */
@import '@dna/radiants/typography';  /* Typography styles */
@import '@dna/radiants/fonts';       /* Font declarations */
@import '@dna/radiants/animations';  /* Animation utilities */
@import '@dna/radiants/base';        /* Base element styles */
```

### React Components

```tsx
import { Button, Card, Badge } from '@dna/radiants/components/core';
import { useToast } from '@dna/radiants/components/core';

function App() {
  return (
    <Card>
      <Badge variant="success">New</Badge>
      <Button variant="primary">Click me</Button>
    </Card>
  );
}
```

### Available Components

- **Layout**: Card, Divider
- **Actions**: Button, ContextMenu, DropdownMenu
- **Forms**: Input, TextArea, Select, Checkbox, Radio, Switch, Slider
- **Feedback**: Alert, Badge, Progress, Spinner, Toast, Tooltip
- **Overlays**: Dialog, Popover, Sheet, HelpPanel
- **Navigation**: Tabs, Breadcrumbs, Accordion
- **Specialty**: CountdownTimer, Web3ActionBar

### Hooks

```tsx
import { useMotion } from '@dna/radiants/hooks';

const { duration, easing } = useMotion();
```

## Semantic Tokens

Use semantic token classes instead of hardcoded colors:

```tsx
// ✅ Do this
<div className="bg-surface-primary text-content-primary border-edge-primary">

// ❌ Not this
<div className="bg-[#FEF8E2] text-[#0F0E0C]">
```

### Token Categories

| Category | Examples | Purpose |
|----------|----------|---------|
| `surface-*` | `bg-surface-primary` | Backgrounds |
| `content-*` | `text-content-primary` | Text/foreground |
| `edge-*` | `border-edge-primary` | Borders/outlines |
| `action-*` | `bg-action-primary` | Interactive elements |
| `status-*` | `bg-status-success` | Feedback states |

## Dark Mode

Dark mode is automatic with `prefers-color-scheme`, or manually toggle with classes:

```html
<!-- Force dark -->
<html class="dark">

<!-- Force light -->
<html class="light">
```

## Fonts

This package includes:
- **Joystix Monospace** — Heading font
- **PixelCode** — Monospace/code font

**Mondwest** (body font) must be downloaded separately due to licensing:

1. Purchase/download from [Pangram Pangram](https://pangrampangram.com/products/bitmap-mondwest)
2. Place `Mondwest.woff2` and `Mondwest-Bold.woff2` in your project's fonts directory
3. The theme will fall back to system fonts if Mondwest is not available

## Requirements

- React 18+ or 19
- Tailwind CSS 4
- Next.js 14+ (optional)

## License

GPL-3.0 — See [LICENSE](./LICENSE) for details.

Note: The DNA specification itself is MIT licensed. This theme implementation is GPL-3.0.
