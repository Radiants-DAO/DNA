# Theme Structure Specification

**Status:** Draft - Research Phase
**Last Updated:** 2026-01-14
**Purpose:** Define the canonical theme structure that RadFlow Tauri understands and edits

---

## Overview

A **theme** in RadFlow is a self-contained design system package. It provides everything needed to render a consistent UI: tokens, typography, components, and assets.

**Core principle:** RadFlow discovers what themes provide and presents visual editing interfaces for them. The theme is the "game" — RadFlow is just the "console."

This specification defines:
1. What files a theme must/should/may contain
2. How those files must be structured for RadFlow to parse them
3. Naming conventions and patterns
4. Validation rules for theme compliance

---

## Decisions Summary

Key architectural decisions made for this spec:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Token naming | `surface-*`, `content-*`, `edge-*` | Semantic, clear purpose |
| Token states | `success`, `warning`, `error` (no accent-*) | Merged accent into state tokens |
| Strictness | Flexible validation | Accept both patterns (spec preferred + reality) |
| Config file | Optional (`radflow.config.json` OR `package.json.radflow`) | Accept both approaches |
| CSS location | Package root (preferred) OR `theme/` subfolder | Simpler is preferred |
| Component organization | Flat `core/` (preferred) OR by type | Simpler for ~30 components |
| Typography | `@apply` directive | Consistent with Tailwind token system |
| Asset location | Optional (bundled OR external libraries) | Themes can use Phosphor, Lucide, etc. |
| Color modes | Light + Dark only | Keep it simple for v1 |

> **Note:** After research phase gap analysis, this spec was updated to accept both the original spec patterns and the reality of existing implementations. The parser should handle both flexibly.

---

## Table of Contents

1. [Package Structure](#1-package-structure)
2. [Token Architecture](#2-token-architecture)
3. [Typography System](#3-typography-system)
4. [Color Modes](#4-color-modes)
5. [Component Requirements](#5-component-requirements)
6. [Assets](#6-assets)
7. [Configuration](#7-configuration)
8. [Validation Rules](#8-validation-rules)
9. [Research Questions](#9-research-questions)
10. [Open Decisions](#10-open-decisions)

---

## 1. Package Structure

### 1.1 Repository Structure

Themes are **separate repositories** linked via pnpm workspaces:

```
radflow-dev/                    # Parent development folder
├── radflow/                    # Core RadFlow repo
│   ├── packages/
│   │   ├── devtools/          # Visual editor (Tauri app)
│   │   └── primitives/        # Headless component hooks
│   └── pnpm-workspace.yaml    # Links to ../theme-*
│
├── theme-rad-os/              # Theme repo (separate git)
│   ├── package.json           # "@radflow/theme-rad-os"
│   ├── theme/                 # Theme CSS + assets
│   ├── components/            # Theme components
│   └── app/                   # Theme pages (optional)
│
└── theme-phase/               # Another theme repo
    └── ...
```

### 1.2 Theme Package Structure

**Preferred Structure (CSS at package root):**
```
theme-{name}/
├── package.json               # REQUIRED: Package metadata (with optional radflow section)
├── index.css                  # REQUIRED: Entry point (imports all CSS)
├── tokens.css                 # REQUIRED: Design tokens (@theme blocks)
├── typography.css             # REQUIRED: Element typography (@layer base)
├── fonts.css                  # REQUIRED: @font-face declarations
├── dark.css                   # REQUIRED: Dark mode overrides (or modes.css)
├── base.css                   # OPTIONAL: html/body/root styles
├── scrollbar.css              # OPTIONAL: Scrollbar customization
├── animations.css             # OPTIONAL: @keyframes definitions
│
├── components/                # REQUIRED: Theme components
│   └── core/                  # Flat structure (preferred for ≤30 components)
│       ├── index.ts           # Barrel export
│       ├── Button.tsx
│       ├── Card.tsx
│       └── ...
│
├── assets/                    # OPTIONAL: Theme assets (or use external libraries)
│   ├── icons/                 # SVG icons (if bundled)
│   └── logos/                 # Brand logos
│
└── radflow.config.json        # OPTIONAL: Theme config (or use package.json.radflow)
```

**Alternative Structure (CSS in subfolder):**
```
theme-{name}/
├── package.json
├── theme/                     # CSS in dedicated subfolder
│   ├── index.css
│   ├── tokens.css
│   ├── typography.css
│   ├── fonts.css
│   ├── modes.css              # or dark.css
│   └── ...
├── components/
│   ├── index.ts               # Barrel export (re-exports all)
│   ├── inputs/                # Type-based organization (for large libraries)
│   ├── layout/
│   ├── feedback/
│   └── overlay/
└── radflow.config.json
```

> **Note:** RadFlow supports both patterns. The parser checks for CSS files at both package root and in `theme/` subfolder.

### 1.3 File Requirements

| File | Required | Purpose | RadFlow Parses |
|------|----------|---------|----------------|
| `package.json` | Yes | Package identity | Name, version, radflow section |
| `index.css` (or `theme/index.css`) | Yes | CSS entry point | Import order |
| `tokens.css` (or `theme/tokens.css`) | Yes | Design tokens | Full parse + write |
| `typography.css` (or `theme/typography.css`) | Yes | Element styles | Full parse + write |
| `fonts.css` (or `theme/fonts.css`) | Yes | Font declarations | Parse only |
| `dark.css` or `modes.css` | Yes | Color modes | Full parse + write |
| `components/core/` | Yes | UI components | Discovery + props |
| `radflow.config.json` | No | Theme metadata | Full read (or use package.json.radflow) |

> **Note:** The parser checks both package root and `theme/` subfolder for CSS files.

---

## 2. Token Architecture

### 2.1 Philosophy

Tokens are organized in **tiers** that build on each other:

```
┌─────────────────────────────────────────────────────────────┐
│  TIER 3: COMPONENT TOKENS (optional)                        │
│  --button-bg, --card-border, --input-ring                   │
│  Component-specific mappings for complex overrides          │
├─────────────────────────────────────────────────────────────┤
│  TIER 2: SEMANTIC TOKENS                                    │
│  --color-surface-primary, --color-content-primary           │
│  Purpose-based tokens that flip in color modes              │
├─────────────────────────────────────────────────────────────┤
│  TIER 1: BRAND TOKENS                                       │
│  --color-sun-yellow, --color-black, --color-sky-blue        │
│  Raw palette values - the source of truth                   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Token Categories

#### Colors

| Category | Pattern | Purpose | Example |
|----------|---------|---------|---------|
| Brand | `--color-{name}` | Raw palette | `--color-sun-yellow: #FCE184` |
| Surface | `--color-surface-{level}` | Backgrounds | `--color-surface-primary` |
| Content | `--color-content-{level}` | Text/icons | `--color-content-primary` |
| Edge | `--color-edge-{level}` | Borders | `--color-edge-primary` |
| State | `--color-{state}` | Feedback | `--color-success`, `--color-error` |

#### Spacing & Sizing

| Category | Pattern | Purpose | Example |
|----------|---------|---------|---------|
| Radius | `--radius-{size}` | Border radius | `--radius-sm: 4px` |
| Shadow | `--shadow-{name}` | Box shadows | `--shadow-card` |
| Spacing | `--spacing-{size}` | Margins/padding | `--spacing-4: 1rem` |

#### Typography

| Category | Pattern | Purpose | Example |
|----------|---------|---------|---------|
| Font Family | `--font-{name}` | Typefaces | `--font-heading` |
| Font Size | `--font-size-{size}` | Type scale | `--font-size-sm` |
| Line Height | `--line-height-{size}` | Leading | `--line-height-tight` |

### 2.3 CSS Syntax (Tailwind v4)

```css
/* tokens.css */

/* ═══════════════════════════════════════════════════════════
   @theme inline - Internal reference tokens
   These are NOT exposed as Tailwind utilities
   Use for semantic mappings and internal references
   ═══════════════════════════════════════════════════════════ */

@theme inline {
  /* Brand colors (raw values) */
  --color-sun-yellow: #FCE184;
  --color-black: #0F0E0C;
  --color-warm-cloud: #FEF8E2;

  /* Semantic mappings (reference brand colors) */
  --color-surface-primary: var(--color-warm-cloud);
  --color-surface-secondary: var(--color-black);
  --color-content-primary: var(--color-black);
  --color-content-inverted: var(--color-warm-cloud);
  --color-edge-primary: var(--color-black);
}

/* ═══════════════════════════════════════════════════════════
   @theme - Public tokens
   These generate Tailwind utilities: bg-*, text-*, border-*, etc.
   ═══════════════════════════════════════════════════════════ */

@theme {
  /* Brand colors (exposed for direct use) */
  --color-sun-yellow: #FCE184;
  --color-black: #0F0E0C;
  --color-warm-cloud: #FEF8E2;

  /* Surface tokens → bg-surface-primary, bg-surface-secondary */
  --color-surface-primary: var(--color-warm-cloud);
  --color-surface-secondary: var(--color-black);
  --color-surface-tertiary: var(--color-sun-yellow);

  /* Content tokens → text-content-primary, text-content-secondary */
  --color-content-primary: var(--color-black);
  --color-content-secondary: var(--color-sun-yellow);
  --color-content-inverted: var(--color-warm-cloud);

  /* Edge tokens → border-edge-primary, ring-edge-focus */
  --color-edge-primary: var(--color-black);
  --color-edge-focus: var(--color-sun-yellow);

  /* Radius → rounded-sm, rounded-md, rounded-lg */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  /* Shadows → shadow-btn, shadow-card */
  --shadow-btn: 0 2px 0 0 var(--color-black);
  --shadow-card: 4px 4px 0 0 var(--color-black);
}
```

### 2.4 Token Naming Rules

1. **Kebab-case only**: `--color-surface-primary` not `--colorSurfacePrimary`
2. **Category prefix**: All tokens start with their category (`--color-`, `--radius-`, `--shadow-`)
3. **No abbreviations**: `--color-background` not `--color-bg` (except established ones like `sm`, `md`, `lg`)
4. **Semantic over visual**: `--color-surface-primary` not `--color-light-gray`
5. **Levels over numbers**: `primary`, `secondary`, `tertiary` not `1`, `2`, `3`

---

## 3. Typography System

### 3.1 Approach

Typography is defined in `@layer base` using Tailwind's `@apply` directive. This ensures:
- Predictable cascade order
- Easy parsing by RadFlow
- Consistent with Tailwind v4 patterns

### 3.2 Required Elements

```css
/* typography.css */

@layer base {
  /* Headings - REQUIRED */
  h1 { @apply text-4xl font-bold leading-tight text-content-primary; }
  h2 { @apply text-3xl font-semibold leading-tight text-content-primary; }
  h3 { @apply text-2xl font-semibold leading-snug text-content-primary; }
  h4 { @apply text-xl font-medium leading-snug text-content-primary; }
  h5 { @apply text-lg font-medium leading-normal text-content-primary; }
  h6 { @apply text-base font-medium leading-normal text-content-primary; }

  /* Body text - REQUIRED */
  p { @apply text-base font-normal leading-relaxed text-content-primary; }

  /* Links - REQUIRED */
  a { @apply text-base text-content-link underline hover:opacity-80; }

  /* Lists - REQUIRED */
  ul { @apply text-base leading-relaxed text-content-primary pl-6; }
  ol { @apply text-base leading-relaxed text-content-primary pl-6; }
  li { @apply text-base leading-relaxed text-content-primary mb-2; }

  /* Inline elements - OPTIONAL */
  strong { @apply font-bold; }
  em { @apply italic; }
  code { @apply text-sm bg-surface-primary px-1 py-0.5 rounded-sm; }

  /* Block elements - OPTIONAL */
  blockquote { @apply border-l-4 border-edge-primary pl-4 italic; }
  pre { @apply text-sm bg-surface-primary p-4 rounded-sm overflow-x-auto; }

  /* Form elements - OPTIONAL */
  label { @apply text-sm font-medium text-content-primary; }
}
```

### 3.3 Font Declaration

```css
/* fonts.css */

@font-face {
  font-family: 'ThemeSans';
  src: url('../fonts/ThemeSans-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'ThemeSans';
  src: url('../fonts/ThemeSans-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

/* Register with Tailwind */
@theme {
  --font-sans: 'ThemeSans', system-ui, sans-serif;
  --font-heading: 'ThemeDisplay', var(--font-sans);
  --font-mono: 'ThemeMono', ui-monospace, monospace;
}
```

---

## 4. Color Modes

### 4.1 Approach

Color modes override semantic tokens. The base theme defines "light" mode; a separate CSS file provides dark mode overrides.

**Supported modes:** Light and Dark only. (High contrast and custom modes out of scope for v1.)

**Accepted filenames:** `dark.css` (preferred) or `modes.css`

### 4.2 Mode Structure

```css
/* dark.css (or modes.css) */

/* Dark mode - applied via .dark class on html/body */
.dark {
  --color-surface-primary: var(--color-black);
  --color-surface-secondary: var(--color-warm-cloud);
  --color-content-primary: var(--color-warm-cloud);
  --color-content-inverted: var(--color-black);
  --color-edge-primary: var(--color-warm-cloud);
}

/* Optional: System preference support */
@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    /* Same overrides as .dark */
  }
}

/* Optional: Force light mode in preview areas */
.preview-light {
  /* Force light mode tokens */
}
```

### 4.3 Mode Switching Rules

1. **Class-based**: `.dark` and `.light` classes on `<html>` or `<body>`
2. **System preference**: Respected unless explicit class is set
3. **Semantic tokens only**: Modes override semantic tokens, never brand tokens
4. **Complete sets**: If overriding surface, override all surface tokens

---

## 5. Component Requirements

### 5.1 Discovery Rules

For RadFlow to discover components:

| Requirement | Required | Reason |
|-------------|----------|--------|
| Default export | Yes | Scanner identifies components by default exports |
| TypeScript | Yes | Props extraction requires type definitions |
| File extension `.tsx` | Yes | Scanner filters by extension |
| Located in `components/` | Yes | Scanner searches this directory |

### 5.2 Props Interface

```tsx
// Recommended pattern - NOT strictly required

interface ButtonProps {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Size preset */
  size?: 'sm' | 'md' | 'lg';
  /** Additional classes */
  className?: string;
  /** Content */
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
}: ButtonProps) {
  // ...
}
```

**Notes:**
- `variant` and `size` are common but NOT required
- Default values help RadFlow show meaningful previews
- JSDoc comments become prop descriptions in RadFlow

### 5.3 Styling Rules

```tsx
// DO: Use semantic tokens
className="bg-surface-primary text-content-primary border-edge-primary"

// DON'T: Hardcode colors
className="bg-[#FEF8E2] text-[#0F0E0C]"

// DO: Use token-based shadows
className="shadow-card hover:shadow-card-hover"

// DON'T: Arbitrary shadows
className="shadow-[4px_4px_0_0_#000]"
```

### 5.4 Component Manifest (Optional)

```json
// components/core/manifest.json (OPTIONAL)
{
  "Button": {
    "category": "actions",
    "description": "Primary interaction element",
    "status": "stable"
  },
  "Card": {
    "category": "layout",
    "description": "Content container with elevation",
    "status": "stable"
  }
}
```

---

## 6. Assets

Assets are **optional**. Themes can bundle their own icons/logos or use external libraries.

### 6.1 Icons

**Option A: Bundled Icons**
```
assets/icons/
├── arrow-right.svg
├── check.svg
├── close.svg
└── ...
```

**Icon requirements (if bundled):**
- SVG format only
- Monochrome (use `currentColor` for fill/stroke)
- Named in kebab-case
- No size in filename (sizing handled by Icon component)

**Option B: External Icon Library (equally valid)**

Themes can use external icon packages instead of bundling SVGs:
- Phosphor Icons (`@phosphor-icons/react`)
- Lucide Icons (`lucide-react`)
- Heroicons (`@heroicons/react`)

```tsx
// components/core/Icon.tsx - wrapping Phosphor
import * as PhosphorIcons from '@phosphor-icons/react';

interface IconProps {
  name: string;
  size?: number;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

export function Icon({ name, size = 24, weight = 'bold' }: IconProps) {
  const IconComponent = PhosphorIcons[name];
  return <IconComponent size={size} weight={weight} />;
}
```

### 6.2 Logos

```
assets/logos/
├── wordmark.svg          # Full brand name
├── logomark.svg          # Icon/symbol only
├── wordmark-inverted.svg # For dark backgrounds (optional)
└── logomark-inverted.svg # (optional)
```

### 6.3 Fonts

**Option A: Bundled Fonts**
```
fonts/
├── ThemeSans-Regular.woff2
├── ThemeSans-Bold.woff2
└── ...
```

**Option B: Fonts from Consuming App**

Fonts can be served from the consuming app's `/public/fonts/` directory. The theme references them via relative paths in `fonts.css`.

**Font requirements (if bundled):**
- WOFF2 format preferred (best compression)
- Include only weights actually used
- Register in `fonts.css` via `@font-face`

---

## 7. Configuration

Two approaches are supported for theme configuration:

### 7.1 Option A: radflow.config.json (dedicated file)

```json
{
  "$schema": "https://radflow.dev/schema/theme-config.json",
  "name": "rad-os",
  "displayName": "Rad OS",
  "version": "1.0.0",
  "description": "Retro pixel aesthetic with warm colors",

  "colorModes": {
    "default": "light",
    "available": ["light", "dark"]
  },

  "fonts": {
    "heading": "Joystix Monospace",
    "body": "Mondwest",
    "mono": "PixelCode"
  },

  "icons": {
    "style": "bold",
    "source": "phosphor"
  }
}
```

### 7.2 Option B: package.json.radflow section (inline)

Configuration can be embedded in package.json under a `radflow` key:

```json
{
  "name": "@radflow/theme-rad-os",
  "version": "1.0.0",
  "radflow": {
    "type": "theme",
    "displayName": "Rad OS",
    "colorMode": "light",
    "icons": { "library": "phosphor", "style": "bold" },
    "fonts": { "heading": "Joystix Monospace", "body": "Mondwest", "mono": "PixelCode" }
  }
}
```

> **Note:** The parser checks for `radflow.config.json` first, then falls back to `package.json.radflow` section.

### 7.3 package.json Requirements

```json
{
  "name": "@radflow/theme-rad-os",
  "version": "1.0.0",
  "main": "./index.css",
  "exports": {
    ".": "./index.css",
    "./tokens": "./tokens.css",
    "./dark": "./dark.css",
    "./fonts": "./fonts.css",
    "./typography": "./typography.css",
    "./components/core": "./components/core/index.ts"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "tailwindcss": "^4.0.0"
  }
}
```

> **Note:** Export paths reflect the preferred flat structure (CSS at root). Themes using `theme/` subfolder would use paths like `"./theme/index.css"`.

---

## 8. Validation Rules

Validation is **flexible** — the parser accepts both the preferred patterns and alternatives.

### 8.1 Required File Checks

```
✓ package.json exists and has "name" field
✓ Entry CSS exists (index.css at root OR theme/index.css)
✓ Tokens CSS exists (tokens.css at root OR theme/tokens.css) and contains @theme block
✓ Typography CSS exists and contains @layer base
✓ Fonts CSS exists
✓ Color modes CSS exists (dark.css OR modes.css, at root or in theme/)
✓ components/core/ directory exists
✓ components/core/index.ts exports at least one component
```

### 8.2 Token Checks

```
✓ All @theme tokens use kebab-case
✓ Required semantic tokens present:
  - --color-surface-primary
  - --color-surface-secondary
  - --color-content-primary
  - --color-content-inverted
  - --color-edge-primary
✓ Recommended semantic tokens present (warning if missing, not error):
  - --color-surface-tertiary
  - --color-content-secondary
  - --color-edge-focus
  - --color-surface-success/warning/error
  - --color-content-success/warning/error
```

### 8.3 Component Checks

```
✓ All .tsx files in components/core/ have default export
✓ No hardcoded hex colors in className strings
✓ TypeScript interfaces defined for props
```

### 8.4 Configuration Checks

```
✓ Theme config exists (radflow.config.json OR package.json.radflow section)
✓ Display name is defined
✓ Color mode default is specified
```

---

## 9. Research Questions

These questions require investigation before finalizing the spec.

### 9.1 Token Architecture

- [ ] **DTCG Alignment**: Should we follow [Design Tokens Community Group](https://design-tokens.github.io/community-group/format/) format? Pros: industry standard, tooling. Cons: more complex, different from Tailwind patterns.

- [ ] **Token Tiers**: Is the 3-tier model (brand → semantic → component) optimal? Some systems use 2 tiers, some use 4+.

- [ ] **Naming Convention**: Current `surface-*`/`content-*`/`edge-*` pattern vs alternatives:
  - `bg-*`/`fg-*`/`border-*` (CSS-native)
  - `fill-*`/`text-*`/`stroke-*` (design-tool aligned)
  - Numbered levels: `surface-1`, `surface-2` (Radix pattern)

### 9.2 CSS Parsing

- [ ] **lightningcss capabilities**: Can it parse `@theme` and `@theme inline` blocks? Need POC to verify.

- [ ] **@apply parsing**: Can we extract the Tailwind classes from `@apply` directives?

- [ ] **CSS custom property references**: Can we build a dependency graph of `var()` references?

### 9.3 Component Discovery

- [ ] **SWC capabilities**: Can we reliably extract TypeScript interfaces and default values?

- [ ] **Compound components**: How do we handle patterns like `<Tabs><Tabs.List><Tabs.Tab/></Tabs.List></Tabs>`?

- [ ] **Polymorphic components**: How do we handle `as` prop typing?

### 9.4 Multi-Theme

- [ ] **Theme switching**: How does runtime theme switching work without page reload?

- [ ] **Shared vs theme-specific components**: Should some components be in `primitives` (shared) vs theme-specific?

- [ ] **Token conflicts**: How do we prevent token name collisions between themes?

---

## 10. Open Decisions

Decisions needed from stakeholders before implementation.

### 10.1 Token Naming

**Current:** `surface-*`, `content-*`, `edge-*`

**Question:** Is this the right naming convention?

| Option | Example | Pros | Cons |
|--------|---------|------|------|
| Current | `bg-surface-primary` | Semantic, clear purpose | Less familiar |
| CSS-native | `bg-background-primary` | Familiar | Redundant (`bg-background`) |
| Short | `bg-s1`, `text-c1` | Compact | Cryptic |
| Radix-style | `bg-surface1` | Proven pattern | Less descriptive |

**Decision:** `surface-*`, `content-*`, `edge-*` (keep current pattern)

### 10.2 Required Semantic Tokens

**Question:** What is the minimum set of semantic tokens a theme MUST define?

**Proposal:**

```
REQUIRED (theme won't work without):
- --color-surface-primary      (main background)
- --color-surface-secondary    (contrast background)
- --color-content-primary      (main text)
- --color-content-inverted     (text on secondary)
- --color-edge-primary         (main border)

RECOMMENDED (theme should have):
- --color-surface-tertiary     (accent background)
- --color-content-secondary    (secondary text)
- --color-edge-focus           (focus rings)
- --color-success/warning/error (feedback states)
- --radius-sm/md/lg            (border radius scale)
- --shadow-* (at least one)    (elevation)

OPTIONAL (theme may have):
- --color-surface-elevated     (raised elements)
- --color-surface-sunken       (recessed elements)
- Component-specific tokens
```

**Decision:** Use the "REQUIRED" set above as minimum. Strict validation.

### 10.3 Typography Approach

**Question:** Should typography use `@apply` or raw CSS?

| Option | Example | Pros | Cons |
|--------|---------|------|------|
| @apply | `h1 { @apply text-4xl font-bold; }` | Uses tokens, familiar | Tailwind-specific |
| Raw CSS | `h1 { font-size: var(--font-size-4xl); }` | Standard CSS | More verbose |
| Hybrid | Mix both | Flexible | Inconsistent |

**Decision:** `@apply` — Use Tailwind's directive for consistency with token system.

### 10.4 Asset Organization

**Question:** Where should theme assets live?

| Option | Structure | Pros | Cons |
|--------|-----------|------|------|
| Theme root | `theme-rad-os/assets/` | Simple, obvious | Mixed with components |
| Inside theme/ | `theme-rad-os/theme/assets/` | CSS-adjacent | Deeper nesting |
| External library | Phosphor, Lucide, etc. | No bundling | Dependency |

**Decision:** Assets are **optional**. Themes can:
- Bundle icons in `assets/icons/`
- Use external icon libraries (Phosphor, Lucide, Heroicons)
- Reference fonts from consuming app's public directory

### 10.5 Component Categories

**Question:** How should components be organized within a theme?

| Option | Structure | When to use |
|--------|-----------|-------------|
| Flat (preferred) | `components/core/` | ≤30 components |
| By type | `inputs/`, `layout/`, `feedback/`, `overlay/` | Larger libraries |

**Decision:** **Flat structure preferred** for simplicity. Type-based organization supported for larger libraries.

### 10.6 Config File Location

**Question:** Should `radflow.config.json` be required or optional?

| Option | Pros | Cons |
|--------|------|------|
| Dedicated file | Explicit, namespaced | Extra file |
| package.json section | One less file, DRY | Less discoverable |

**Decision:** **Both approaches supported**. Parser checks for `radflow.config.json` first, falls back to `package.json.radflow` section.

---

## Appendix A: Example Theme (Minimal)

The smallest valid RadFlow theme (using preferred flat structure):

```
theme-minimal/
├── package.json             # With radflow section (or use radflow.config.json)
├── index.css                # Entry point
├── tokens.css               # Design tokens
├── typography.css           # Element styles
├── fonts.css                # Font declarations
├── dark.css                 # Dark mode overrides
└── components/
    └── core/
        ├── index.ts         # Barrel export
        └── Button.tsx       # At least one component
```

> **Note:** Assets directory is optional. Themes can use external icon libraries like Phosphor instead of bundling SVGs.

---

## Appendix B: Comparison with Other Systems

| System | Token Format | Component Model | Theming |
|--------|--------------|-----------------|---------|
| **RadFlow** | CSS custom props + Tailwind v4 | React + TypeScript | CSS class toggle |
| **Chakra UI** | JS theme object | React + styled-system | ThemeProvider |
| **Radix** | CSS custom props | React + Radix primitives | CSS class toggle |
| **shadcn/ui** | CSS custom props + Tailwind | React + Radix | CSS variables |
| **MUI** | JS theme object | React + emotion | ThemeProvider |

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-15 | 0.2.0 | Updated per gap analysis: flexible validation, accept both CSS-at-root and theme/ subfolder, optional assets, config in package.json or separate file |
| 2026-01-14 | 0.1.0 | Initial draft |

