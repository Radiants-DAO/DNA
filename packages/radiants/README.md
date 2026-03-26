# @rdna/radiants

Radiants theme package for DNA (Design Nexus Architecture) — a retro pixel aesthetic design system.

## Installation

```bash
npm install @rdna/radiants
```

## Usage

### CSS Tokens

Import the theme tokens in your CSS:

```css
/* Import all tokens + base styles */
@import '@rdna/radiants';

/* Import dark mode support */
@import '@rdna/radiants/dark';
```

Or import individual parts:

```css
@import '@rdna/radiants/tokens';      /* Tokens only */
@import '@rdna/radiants/typography';  /* Typography styles */
@import '@rdna/radiants/fonts';       /* Font declarations */
@import '@rdna/radiants/animations';  /* Animation utilities */
@import '@rdna/radiants/base';        /* Base element styles */
```

### React Components

```tsx
import { Button, Card, Badge } from '@rdna/radiants/components/core';
import { useToast } from '@rdna/radiants/components/core';

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

- **Layout**: Card
- **Actions**: Button, ContextMenu, DropdownMenu
- **Forms**: Input, InputSet, TextArea, Select, Checkbox, Radio, Switch, Slider
- **Feedback**: Alert, Badge, Spinner, Toast, Tooltip
- **Overlays**: Dialog, Popover, Sheet
- **Navigation**: Tabs, Breadcrumbs
- **Specialty**: CountdownTimer

### Hooks

```tsx
import { useMotion } from '@rdna/radiants/hooks';

const { duration, easing } = useMotion();
```

## Semantic Tokens

Use semantic token classes instead of hardcoded colors:

```tsx
// ✅ Do this
<div className="bg-page text-main border-line">

// ❌ Not this
<div className="bg-[#FEF8E2] text-[#0F0E0C]">
```

## Generated Figma Contracts

The authored sources of truth stay the same:

- `tokens.css`
- `dark.css`
- `components/core/*/*.meta.ts`

Generate Figma-ready artifacts from those files with:

```bash
pnpm --filter @rdna/radiants generate:figma-contracts
```

Or run the full pipeline:

```bash
pnpm registry:generate
```

Generated outputs:

- `generated/figma/primitive/color.tokens.json`
- `generated/figma/primitive/space.tokens.json`
- `generated/figma/primitive/shape.tokens.json`
- `generated/figma/primitive/motion.tokens.json`
- `generated/figma/primitive/typography.tokens.json`
- `generated/figma/semantic/semantic.tokens.json`
- `generated/figma/contracts/*.contract.json`

The generator also refreshes `.component-contracts.example` at the repo root. Copy it to `.component-contracts`, add `FIGMA_ACCESS_TOKEN` and `FIGMA_FILE_KEY`, then point agents to:

- `TOKENS_DIR=packages/radiants/generated/figma`
- `CONTRACTS_DIR=packages/radiants/generated/figma/contracts`

That matches the local Figma skills shipped in this repo, including `.claude/skills/cc-figma-tokens/SKILL.md` and `.claude/skills/cc-figma-component/SKILL.md`.

### Token Categories

| Category | Examples | Purpose |
|----------|----------|---------|
| `surface-*` | `bg-page` | Backgrounds |
| `content-*` | `text-main` | Text/foreground |
| `edge-*` | `border-line` | Borders/outlines |
| `action-*` | `bg-accent` | Interactive elements |
| `status-*` | `bg-success` | Feedback states |

## Dark Mode

Dark mode is activated by the `.dark` class — this is the only activation contract:

```html
<!-- Enable dark mode -->
<html class="dark">
```

There is no `prefers-color-scheme` fallback. Consumers are responsible for toggling the `.dark` class (e.g. via a theme switch or reading the system preference in JS).

`dark.css` contains two things:
1. **Token overrides** — semantic tokens flipped for dark backgrounds
2. **Component slot styling** — `[data-slot]`/`[data-variant]` selectors for Moon Mode interaction (glow instead of lift)

The generic class layer (`.btn-*`, `.card`, `.badge-*`, etc.) was removed. Use RDNA components or semantic tokens instead.

## Fonts

This package includes:
- **Joystix Monospace** — Heading font
- **PixelCode** — Monospace/code font

**Mondwest** (body font) must be downloaded separately due to licensing:

1. Purchase/download from [Pangram Pangram](https://pangrampangram.com/products/bitmap-mondwest)
2. Place `Mondwest.woff2` and `Mondwest-Bold.woff2` in your project's fonts directory
3. The theme will fall back to system fonts if Mondwest is not available

## Pixel Corners

Pixel-corner geometry (`clip-path: polygon()` staircase shapes) is generated from config, not handwritten.

**Files:**
- `scripts/pixel-corners.config.mjs` — profiles (point arrays) and variant definitions
- `scripts/pixel-corners-lib.mjs` — generator library
- `scripts/generate-pixel-corners.mjs` — CLI that writes `pixel-corners.generated.css`
- `pixel-corners.css` — shell file: imports generated CSS, contains manual utilities (shadows, focus rings, border overrides)
- `pixel-corners.generated.css` — checked-in generated artifact (do not edit by hand)

**Regenerate after config changes:**
```bash
pnpm --filter @rdna/radiants generate:pixel-corners
```

**Adding a new profile:** Define TL corner points in the config (verify with the [Pixel Corners Calculator](https://pixelcorners.lukeb.co.uk/)), add `innerPoints` for the 1px-inset border boundary, then add a variant referencing the profile. The generator mirrors TL to TR/BR/BL automatically.

**V1 boundaries:** Per-corner composition is supported (any combination of profiles per corner slot). Runtime size-aware pixel corners (`rounded-full` as a pixel staircase) are not supported — `rounded-full` remains smooth CSS `border-radius`.

## Internal Primitive Engine

Interactive primitives in this package use `@base-ui/react` internally for accessibility and keyboard/focus behavior. Public `@rdna/radiants/components/core` APIs remain stable.

Components backed by Base UI internals: Tabs, Dialog, Sheet, Popover, DropdownMenu, ContextMenu, Select, Tooltip, Toast, Checkbox, Switch, Slider.

## Requirements

- React 18+ or 19
- Tailwind CSS 4
- Next.js 14+ (optional)

## License

GPL-3.0 — See [LICENSE](./LICENSE) for details.

Note: The DNA specification itself is MIT licensed. This theme implementation is GPL-3.0.
