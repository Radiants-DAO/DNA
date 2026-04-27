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

- **Actions**: Button, ContextMenu, DropdownMenu, Toggle, ToggleGroup, Toolbar
- **Layout**: Card, Collapsible, Pattern, ScrollArea, Separator
- **Forms**: Checkbox, Combobox, Input, InputSet, NumberField, Radio, Select, Slider, Switch, TextArea
- **Feedback**: Alert, Badge, Meter, Spinner, Toast, Tooltip
- **Navigation**: Breadcrumbs, Menubar, NavigationMenu, Tabs
- **Overlays**: AlertDialog, Dialog, Drawer, Popover, PreviewCard, Sheet
- **Data Display**: Avatar, CountdownTimer
- **Media**: Icon

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

## Pixel Authoring Pipeline

Corners, tiling patterns, and pixel icons are authored in `@rdna/pixel` and then prepared once before Radiants materializes checked-in CSS or registries from that prepared data.

Authoring source-of-truth paths:

- `packages/pixel/src/corners/registry.ts`
- `packages/pixel/src/patterns/registry.ts`
- `packages/pixel/src/icons/registry.ts`

Materialized Radiants artifacts:

- `pixel-corners.generated.css`
- `patterns.css`
- `pixel-icons/registry.ts`

SVG icons remain a separate prepared-manifest pipeline in `packages/radiants/icons/manifest.ts`.

This is a pre-launch replacement flow. If a legacy adapter or re-export still exists, treat it as compatibility glue for the active RadOS surface, not as the authoring source of truth.

## Pixel Corners

Pixel corners use CSS `mask-image` and the `px()` API from `@rdna/pixel` for staircase-shaped masks. Theme-following corners resolve the current `<html data-corner-shape="...">` preference at materialization time; fixed corners stay locked to the authored shape. The `PixelBorder` component provides SVG-based staircase borders when the border itself needs to be visible.

**Key files:**
- `packages/pixel/src/corners/registry.ts` — authored corner definitions and named recipes
- `packages/pixel/src/corners/prepare.ts` — shared prepare step for math-first rasterization plus authored overrides
- `pixel-corners.css` — shell CSS with manual utilities only
- `pixel-corners.generated.css` — checked-in generated artifact (do not edit by hand)
- `components/core/PixelBorder/` — SVG staircase border component

**Regenerate after corner-authoring changes:**
```bash
pnpm --filter @rdna/radiants generate:pixel-corners
```

**Pixel corners are opt-in.** Standard `rounded-*` classes remain plain Tailwind border-radius. Use the pixel-corner utilities or `px()` when the surface should render staircase masks. Chrome tabs are the reference theme-following example; explicitly authored surfaces should use fixed bindings when they must not react to the global corner preference.

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
