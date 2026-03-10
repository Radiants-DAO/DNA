---
status: active
date: 2026-01-18
tags: [dna, theme, design-system]
sources:
  - tools/flow/docs/theme-spec.md (originally radflow-tauri)
  - tools/flow/docs/design-system-infrastructure.md (originally radflow-tauri)
  - ~/Downloads/dna-theme-spec.md
---

# DNA Theme Specification

**Version:** 1.0.0

DNA (Design Nexus Architecture) is a theme system optimized for AI-assisted development workflows. It provides a standardized token system, component schema format, and theme structure that enables portable, customizable design systems across projects.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Core Principles](#2-core-principles)
3. [Token Structure](#3-token-structure)
4. [Package Structure](#4-package-structure)
5. [Typography System](#5-typography-system)
6. [Color Modes](#6-color-modes)
7. [Component Schema Format](#7-component-schema-format)
8. [Extended Token Systems](#8-extended-token-systems)
9. [Asset Management](#9-asset-management)
10. [Configuration](#10-configuration)
11. [AI Skills Integration](#11-ai-skills-integration)
12. [Validation Rules](#12-validation-rules)

---

## 1. Overview

A **theme** in DNA is a self-contained design system package. It provides everything needed to render a consistent UI: tokens, typography, components, and assets.

**Core principle:** DNA discovers what themes provide and presents visual editing interfaces for them. The theme is the "game" — the tooling is just the "console."

### Integration with json-render

DNA uses [vercel-labs/json-render](https://github.com/vercel-labs/json-render) as the runtime format for AI-generated UI.

- DNA component schemas auto-generate json-render catalogs
- The catalog defines what AI can use; DNA defines how it looks
- Source mapping metadata (`__source`) is added to JSON nodes for editor integration

 The Correct Model                                                                                                                                 
                                                                                                                                                    
  ┌─────────────────────────────────────────────────────────────────────────┐                                                                       
  │                        DNA (Factory Standards)                          │                                                                       
  │                                                                         │                                                                       
  │   "How themes are structured, how tokens are named, how components      │                                                                       
  │    are organized. Anyone COULD follow this, but you're building it      │                                                                       
  │    for your Flow workflow."                                          │                                                                       
  │                                                                         │                                                                       
  │   Standards:                                                            │
  │   ├── Two-tier tokens (brand → semantic)                                │
  │   ├── Token naming (surface-*, content-*, edge-*, action-*)             │
  │   ├── Component pattern (tsx + schema.json + dna.json)                  │
  │   └── Package structure (@rdna/<brand>/components, tokens, etc.)        │                                                                       
  │                                                                         │                                                                       
  └─────────────────────────────────────────────────────────────────────────┘                                                                       
                                      │                                                                                                             
                      implements the standard                                                                                                       
                                      │                                                                                                             
          ┌───────────────────────────┼───────────────────────────┐                                                                                 
          │                           │                           │                                                                                 
          ▼                           ▼                           ▼                                                                                 
  ┌───────────────┐          ┌───────────────┐          ┌───────────────┐
  │ @rdna/radiants│          │ @rdna/client-a│          │ @rdna/minimal │                                                                           
  │               │          │               │          │               │                                                                           
  │ Your default  │          │ Client A's    │          │ Future:       │                                                                           
  │ retro pixel   │          │ brand colors, │          │ clean, simple │                                                                           
  │ aesthetic     │          │ their assets  │          │ starter       │                                                                           
  │               │          │               │          │               │                                                                           
  │ ┌───────────┐ │          │ ┌───────────┐ │          │ ┌───────────┐ │                                                                           
  │ │ tokens.css│ │          │ │ tokens.css│ │          │ │ tokens.css│ │                                                                           
  │ │ Button/   │ │          │ │ Button/   │ │          │ │ Button/   │ │                                                                           
  │ │ Card/     │ │          │ │ Card/     │ │          │ │ Card/     │ │                                                                           
  │ │ Input/    │ │          │ │ (imports  │ │          │ │ ...       │ │                                                                           
  │ │ ...       │ │          │ │  from     │ │          │ └───────────┘ │                                                                           
  │ └───────────┘ │          │ │ radiants?)│ │          └───────────────┘                                                                           
  └───────────────┘          │ └───────────┘ │                                                                                                      
          │                  └───────────────┘                                                                                                      
          │                           │                                                                                                             
          │     ┌─────────────────────┘                                                                                                             
          │     │                                                                                                                                   
          ▼     ▼                                                                                                                                   
  ┌─────────────────────────────────────────────────────────────────────────┐                                                                       
  │                          FLOW (The Studio)                              │                                                                       
  │                                                                         │                                                                       
  │   "Open any DNA-compliant project. Browse components. Edit tokens.      │                                                                       
  │    Copy to clipboard. Let LLMs do the heavy lifting."                   │                                                                       
  │                                                                         │                                                                       
  │   ┌─────────────────────────────────────────────────────────────────┐   │                                                                       
  │   │  Project Selector: [ @rdna/radiants ▼ ]                          │   │                                                                       
  │   └─────────────────────────────────────────────────────────────────┘   │                                                                       
  │                                                                         │                                                                       
  │   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐          │                                                                        
  │   │ Variables  │ │ Typography │ │ Components │ │   Assets   │          │                                                                        
  │   └────────────┘ └────────────┘ └────────────┘ └────────────┘          │                                                                        
  │                                                                         │                                                                       
  │   ┌─────────────────────────────────────────────────────────────────┐   │                                                                       
  │   │                    Component Canvas                              │   │                                                                      
  │   │                                                                  │   │                                                                      
  │   │     Components from selected DNA brand render here               │   │                                                                      
  │   │                                                                  │   │                                                                      
  │   └─────────────────────────────────────────────────────────────────┘   │                                                                       
  │                                                                         │                                                                       
  │                         [ Copy to Clipboard ]                           │                                                                       
  │                                                                         │                                                                       
  └─────────────────────────────────────────────────────────────────────────┘                                                                       
                                      │                                                                                                             
                                      │ LLM context                                                                                                 
                                      ▼                                                                                                             
                          ┌───────────────────────┐                                                                                                 
                          │  Claude Code / Cursor │                                                                                                 
                          │                       │                                                                                                 
                          │  "Here's the Button   │                                                                                                 
                          │   component schema,   │                                                                                                 
                          │   the tokens it uses, │                                                                                                 
                          │   and examples..."    │                                                                                                 
                          └───────────────────────┘                                                                                                 
                                                                                                                                                    
  ---                                                                                                                                               
  The Growth Path (Like shadcn)                                                                                                                     
                                                                                                                                                    
          NOW                      6 MONTHS                    1 YEAR                                                                               
           │                           │                          │                                                                                 
           ▼                           ▼                          ▼                                                                                 
  ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐                                                                         
  │  @rdna/radiants  │        │  @rdna/radiants  │        │  @rdna/radiants  │                                                                         
  │                 │        │                 │        │                 │                                                                         
  │  3 components:  │        │  12 components: │        │  30+ components │                                                                         
  │  Button         │   →    │  Button, Card   │   →    │  Full library   │                                                                         
  │  Card           │        │  Input, Modal   │        │                 │                                                                         
  │  Input          │        │  Table, Tabs    │        │  + variants     │                                                                         
  │                 │        │  Toast, etc.    │        │  + animations   │                                                                         
  └─────────────────┘        └─────────────────┘        └─────────────────┘                                                                         
                                      │                                                                                                             
                                      │ fork/customize                                                                                              
                                      ▼                                                                                                             
                             ┌─────────────────┐                                                                                                    
                             │ @rdna/client-a  │                                                                                                    
                             │                 │                                                                                                    
                             │ Inherits from   │                                                                                                    
                             │ radiants, adds  │                                                                                                    
                             │ client branding │                                                                                                    
                             └─────────────────┘           

---

## 2. Core Principles

1. **CSS-native tokens** — All design tokens compile to CSS custom properties
2. **Tailwind v4 first** — Built around Tailwind's native CSS theming
3. **Copy-on-import components** — Components are copied into projects, not installed as dependencies
4. **AI-parseable schemas** — Every component has a machine-readable schema for AI tooling
5. **Minimal semantic layer** — Token naming is intentional but not over-abstracted

### Key Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Token naming | `surface-*`, `content-*`, `edge-*` | Semantic, clear purpose |
| Token states | `success`, `warning`, `error` | Merged accent into state tokens |
| Strictness | Flexible validation | Accept both patterns (spec preferred + reality) |
| Config file | Optional (`dna.config.json` OR `package.json.dna`) | Accept both approaches |
| CSS location | Package root (preferred) OR `theme/` subfolder | Simpler is preferred |
| Component organization | Flat `core/` (preferred) OR by type | Simpler for ~30 components |
| Typography | `@apply` directive | Consistent with Tailwind token system |
| Asset location | Optional (bundled OR external libraries) | Themes can use Phosphor, Lucide, etc. |
| Color modes | Light + Dark only | Keep it simple for v1 |
| Motion | CSS-First, Ease-Out Only | Simple, predictable animations (max 300ms) |
| Icons | Lucide Base + Custom Pipeline | 24x24 grid, 2px stroke, SVGO optimization |
| Accessibility | WCAG 2.2 AA Minimum | Focus rings, touch targets, contrast validation |

---

## 3. Token Structure

### 3.1 Token Philosophy

Tokens are organized in **two tiers** that build on each other:

```
┌─────────────────────────────────────────────────────────────┐
│  TIER 2: SEMANTIC TOKENS                                    │
│  --color-surface-primary, --color-content-primary           │
│  Purpose-based tokens that flip in color modes              │
│  Components use these directly in className props           │
├─────────────────────────────────────────────────────────────┤
│  TIER 1: BRAND TOKENS                                       │
│  --color-sun-yellow, --color-ink, --color-sky-blue           │
│  Raw palette values - the source of truth                   │
│  Defined in @theme inline (internal reference only)         │
└─────────────────────────────────────────────────────────────┘
```

Components use semantic tokens directly (e.g., `bg-surface-primary`). There is no intermediate component token layer - this keeps the system simple and matches shadcn's approach.

### 3.2 Naming Convention

All tokens use CSS custom property syntax with kebab-case naming:

```
--{category}-{semantic}-{variant}
```

**Rules:**
1. **Kebab-case only**: `--color-surface-primary` not `--colorSurfacePrimary`
2. **Category prefix**: All tokens start with their category (`--color-`, `--radius-`, `--shadow-`)
3. **No abbreviations**: `--color-background` not `--color-bg` (except established `sm`, `md`, `lg`)
4. **Semantic over visual**: `--color-surface-primary` not `--color-light-gray`
5. **Levels over numbers**: `primary`, `secondary`, `tertiary` not `1`, `2`, `3`

### 3.3 Required Semantic Tokens

**REQUIRED (theme won't work without):**

```css
/* Surfaces */
--color-surface-primary      /* Main background */
--color-surface-secondary    /* Contrast/muted background */

/* Content */
--color-content-primary      /* Main text */
--color-content-inverted     /* Text on secondary surfaces */

/* Edges */
--color-edge-primary         /* Main border */
```

**RECOMMENDED:**

```css
/* Surfaces */
--color-surface-tertiary     /* Accent background */
--color-surface-elevated     /* Cards, modals */

/* Content */
--color-content-secondary    /* Muted text */
--color-content-link         /* Link text */

/* Edges */
--color-edge-focus           /* Focus rings */

/* Status */
--color-status-success
--color-status-warning
--color-status-error
--color-status-info

/* Actions (alternative naming) */
--color-action-primary       /* Primary buttons */
--color-action-secondary     /* Secondary actions */
--color-action-destructive   /* Delete, danger */

/* Radius */
--radius-sm
--radius-md
--radius-lg

/* Shadows */
--shadow-sm
--shadow-card
```

### 3.4 Token Categories Reference

| Category | Pattern | Purpose | Example |
|----------|---------|---------|---------|
| Brand | `--color-{name}` | Raw palette | `--color-sun-yellow: oklch(0.9126 0.1170 93.68)` |
| Surface | `--color-surface-{level}` | Backgrounds | `--color-surface-primary` |
| Content | `--color-content-{level}` | Text/icons | `--color-content-primary` |
| Edge | `--color-edge-{level}` | Borders | `--color-edge-primary` |
| Action | `--color-action-{type}` | Interactive | `--color-action-primary` |
| Status | `--color-status-{state}` | Feedback | `--color-status-success` |
| Radius | `--radius-{size}` | Border radius | `--radius-md: 8px` |
| Shadow | `--shadow-{name}` | Box shadows | `--shadow-card` |
| Spacing | `--spacing-{size}` | Margins/padding | `--spacing-md: 1rem` |
| Font Family | `--font-{name}` | Typefaces | `--font-heading` |
| Font Size | `--font-size-{size}` | Type scale | `--font-size-lg` |
| Duration | `--duration-{speed}` | Animation timing | `--duration-fast: 100ms` |
| Easing | `--easing-{type}` | Animation curves | `--easing-default` |

### 3.5 CSS Syntax (Tailwind v4)

```css
/* tokens.css */

/* @theme inline - Internal reference tokens (NOT exposed as utilities) */
@theme inline {
  /* Brand colors (raw values) */
  --color-sun-yellow: oklch(0.9126 0.1170 93.68);
  --color-ink: oklch(0.1641 0.0044 84.59);
  --color-cream: oklch(0.9780 0.0295 94.34);

  /* Semantic mappings */
  --color-surface-primary: var(--color-cream);
  --color-content-primary: var(--color-ink);
}

/* @theme - Public tokens (generate Tailwind utilities) */
@theme {
  /* Surface tokens → bg-surface-primary */
  --color-surface-primary: var(--color-cream);
  --color-surface-secondary: var(--color-ink);

  /* Content tokens → text-content-primary */
  --color-content-primary: var(--color-ink);
  --color-content-inverted: var(--color-cream);

  /* Edge tokens → border-edge-primary */
  --color-edge-primary: var(--color-ink);
  --color-edge-focus: var(--color-sun-yellow);

  /* Radius → rounded-sm, rounded-md */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  /* Shadows → shadow-btn, shadow-card */
  --shadow-btn: 0 2px 0 0 var(--color-ink);
  --shadow-card: 4px 4px 0 0 var(--color-ink);
}
```

---

## 4. Package Structure

### 4.1 Repository Structure

Themes are **separate repositories** linked via pnpm workspaces:

```
dna-themes/
├── packages/
│   ├── core/                # Base component library
│   │   ├── components/
│   │   ├── tokens/
│   │   └── package.json
│   │
│   ├── theme-rad-os/        # Theme package
│   └── theme-phase/         # Another theme
│
├── tools/
│   ├── dna-cli/             # CLI tooling
│   └── catalog-generator/   # Schema → json-render catalog
│
└── pnpm-workspace.yaml
```

### 4.2 Theme Package Structure

**Preferred Structure (CSS at package root):**

```
theme-{name}/
├── package.json               # REQUIRED
├── index.css                  # REQUIRED: Entry point
├── tokens.css                 # REQUIRED: Design tokens
├── typography.css             # REQUIRED: Element typography
├── fonts.css                  # REQUIRED: @font-face declarations
├── dark.css                   # REQUIRED: Dark mode overrides
├── base.css                   # OPTIONAL: html/body/root styles
├── animations.css             # OPTIONAL: @keyframes definitions
│
├── components/                # REQUIRED: Theme components
│   └── core/
│       ├── index.ts           # Barrel export
│       ├── Button/
│       │   ├── Button.tsx
│       │   ├── Button.schema.json
│       │   └── Button.dna.json
│       └── ...
│
├── assets/                    # OPTIONAL
│   ├── icons/
│   └── logos/
│
├── ai-skills/                 # OPTIONAL: AI context docs
│   ├── component-generation.md
│   └── brand-voice.md
│
└── dna.config.json            # OPTIONAL (or use package.json.dna)
```

**Alternative Structure (CSS in subfolder):**

```
theme-{name}/
├── package.json
├── theme/                     # CSS in dedicated subfolder
│   ├── index.css
│   ├── tokens.css
│   └── ...
├── components/
└── dna.config.json
```

### 4.3 File Requirements

| File | Required | Purpose |
|------|----------|---------|
| `package.json` | Yes | Package identity |
| `index.css` | Yes | CSS entry point |
| `tokens.css` | Yes | Design tokens |
| `typography.css` | Yes | Element styles |
| `fonts.css` | Yes | Font declarations |
| `dark.css` or `modes.css` | Yes | Color modes |
| `components/core/` | Yes | UI components |
| `dna.config.json` | No | Theme metadata |

---

## 5. Typography System

### 5.1 Approach

Typography is defined in `@layer base` using Tailwind's `@apply` directive:

```css
/* typography.css */

@layer base {
  /* Headings */
  h1 { @apply text-4xl font-bold leading-tight text-content-primary; }
  h2 { @apply text-3xl font-semibold leading-tight text-content-primary; }
  h3 { @apply text-2xl font-semibold leading-snug text-content-primary; }
  h4 { @apply text-xl font-medium leading-snug text-content-primary; }
  h5 { @apply text-lg font-medium leading-normal text-content-primary; }
  h6 { @apply text-base font-medium leading-normal text-content-primary; }

  /* Body */
  p { @apply text-base font-normal leading-relaxed text-content-primary; }

  /* Links */
  a { @apply text-base text-content-link underline hover:opacity-80; }

  /* Lists */
  ul, ol { @apply text-base leading-relaxed text-content-primary pl-6; }
  li { @apply text-base leading-relaxed text-content-primary mb-2; }

  /* Code */
  code { @apply text-sm bg-surface-secondary px-1 py-0.5 rounded-sm; }
  pre { @apply text-sm bg-surface-secondary p-4 rounded-sm overflow-x-auto; }
}
```

### 5.2 Font Declaration

```css
/* fonts.css */

@font-face {
  font-family: 'ThemeSans';
  src: url('./fonts/ThemeSans-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@theme {
  --font-sans: 'ThemeSans', system-ui, sans-serif;
  --font-heading: 'ThemeDisplay', var(--font-sans);
  --font-mono: 'ThemeMono', ui-monospace, monospace;
}
```

### 5.3 Fluid Typography (Optional)

```css
/* Utopia-style fluid scales */
--text-base: clamp(0.875rem, 0.82rem + 0.19vw, 1rem);
--text-lg: clamp(1.125rem, 1.07rem + 0.19vw, 1.25rem);
```

---

## 6. Color Modes

### 6.1 Approach

Color modes override semantic tokens. Base theme defines "light" mode; separate CSS provides dark mode overrides.

**Supported modes:** Light and Dark only (v1).

### 6.2 Mode Structure

```css
/* dark.css */

.dark {
  --color-surface-primary: var(--color-ink);
  --color-surface-secondary: var(--color-cream);
  --color-content-primary: var(--color-cream);
  --color-content-inverted: var(--color-ink);
  --color-edge-primary: var(--color-cream);
}

/* Optional: System preference support */
@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    /* Same overrides as .dark */
  }
}
```

### 6.3 Mode Switching Rules

1. **Class-based**: `.dark` and `.light` classes on `<html>` or `<body>`
2. **System preference**: Respected unless explicit class is set
3. **Semantic tokens only**: Modes override semantic tokens, never brand tokens
4. **Complete sets**: If overriding surface, override all surface tokens

---

## 7. Component Schema Format

### 7.1 Three-File Pattern

Each component has three files:

```
components/
├── Button/
│   ├── Button.tsx           # Implementation
│   ├── Button.schema.json   # Prop types + AI interface
│   └── Button.dna.json      # Token bindings
```

### 7.2 Schema File

Defines the component's interface for AI tools:

```json
{
  "name": "Button",
  "description": "Primary action trigger",
  "props": {
    "variant": {
      "type": "enum",
      "values": ["primary", "secondary", "ghost", "destructive"],
      "default": "primary",
      "description": "Visual style variant"
    },
    "size": {
      "type": "enum",
      "values": ["sm", "md", "lg"],
      "default": "md"
    },
    "disabled": {
      "type": "boolean",
      "default": false
    }
  },
  "slots": ["icon", "children"],
  "examples": [
    { "props": { "variant": "primary" }, "children": "Get Started" }
  ]
}
```

### 7.3 DNA File

Maps variants to token bindings:

```json
{
  "base": {
    "borderRadius": "var(--radius-md)",
    "transition": "all var(--duration-fast) var(--easing-default)"
  },
  "variants": {
    "primary": {
      "background": "var(--color-action-primary)",
      "color": "var(--color-content-inverted)"
    },
    "secondary": {
      "background": "var(--color-surface-secondary)",
      "color": "var(--color-content-primary)"
    }
  },
  "sizes": {
    "sm": { "padding": "var(--spacing-xs) var(--spacing-sm)" },
    "md": { "padding": "var(--spacing-sm) var(--spacing-md)" },
    "lg": { "padding": "var(--spacing-md) var(--spacing-lg)" }
  }
}
```

### 7.4 Implementation Requirements

| Requirement | Required | Reason |
|-------------|----------|--------|
| Default export | Yes | Scanner identifies by default exports |
| TypeScript | Yes | Props extraction requires type definitions |
| `.tsx` extension | Yes | Scanner filters by extension |
| Located in `components/` | Yes | Scanner searches this directory |

### 7.5 Styling Rules

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

---

## 8. Extended Token Systems

### 8.1 Motion Tokens

**Philosophy:** Ease-out easing only, max 300ms duration, no springs or bounce.

**Duration Scale:**

| Token | Value | Use Case |
|-------|-------|----------|
| `--duration-instant` | 0ms | Reduced motion fallback |
| `--duration-fast` | 100ms | Hover states |
| `--duration-base` | 150ms | Standard transitions |
| `--duration-moderate` | 200ms | Medium complexity |
| `--duration-slow` | 300ms | Complex animations |

**Easing Tokens:**

| Token | Value | Use Case |
|-------|-------|----------|
| `--easing-default` | `cubic-bezier(0, 0, 0.2, 1)` | All standard transitions |
| `--easing-out` | `cubic-bezier(0, 0, 0.2, 1)` | Entering elements |
| `--easing-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exiting elements |

**Reduced Motion:**

```css
:root {
  --duration-scalar: 1;
}

@media (prefers-reduced-motion: reduce) {
  :root { --duration-scalar: 0; }
}
```

### 8.2 Icon System

**Base Library:** Lucide Icons (24x24 grid, 2px stroke)

| Token | Size | Use Case |
|-------|------|----------|
| `--icon-xs` | 12px | Inline text, badges |
| `--icon-sm` | 16px | Dense UI, tables |
| `--icon-md` | 20px | Default buttons |
| `--icon-lg` | 24px | Primary actions |
| `--icon-xl` | 32px | Feature highlights |

### 8.3 Accessibility Tokens

**Focus Ring System:**

| Token | Value |
|-------|-------|
| `--focus-ring-width` | 2px |
| `--focus-ring-offset` | 2px |
| `--focus-ring-color` | var(--color-edge-focus) |

**Touch Targets:**

| Token | Value | Use Case |
|-------|-------|----------|
| `--touch-target-min` | 24px | WCAG AA minimum |
| `--touch-target-default` | 44px | Standard interactive |
| `--touch-target-comfortable` | 48px | Primary actions |

**Contrast Requirements:**
- Normal text (<24px): 4.5:1
- Large text (24px+): 3:1
- UI components: 3:1

### 8.4 Density System

**Three Modes:**

| Mode | Scale | Use Case |
|------|-------|----------|
| Compact | 0.5x | Data tables |
| Default | 1x | General UI |
| Comfortable | 1.5x | Content-focused |

### 8.5 Responsive Breakpoints

| Token | Value | Device |
|-------|-------|--------|
| `--breakpoint-xs` | 360px | Small phones |
| `--breakpoint-sm` | 640px | Large phones |
| `--breakpoint-md` | 768px | Tablets |
| `--breakpoint-lg` | 1024px | Laptops |
| `--breakpoint-xl` | 1280px | Desktops |

**Query Strategy:**
- Container queries for components
- Media queries for page layouts

### 8.6 i18n Tokens

**Core Principle:** Use CSS logical properties for automatic RTL support.

```css
/* Use logical properties */
margin-inline-start  /* instead of margin-left */
text-align: start    /* instead of text-align: left */
```

**Language Family Line Heights:**

| Category | Languages | Line Height |
|----------|-----------|-------------|
| Western | Latin, Greek | 1.6 |
| Tall | Arabic, Hindi | 1.8 |
| CJK | Chinese, Japanese, Korean | 1.7 |

---

## 9. Asset Management

### 9.1 Icons

**Option A: Bundled Icons**

```
assets/icons/
├── arrow-right.svg
├── check.svg
└── ...
```

Requirements:
- SVG format only
- Monochrome (`currentColor`)
- kebab-case naming

**Option B: External Library** (equally valid)

```tsx
import { ArrowRight } from 'lucide-react';
```

### 9.2 Logos

```
assets/logos/
├── wordmark.svg
├── logomark.svg
├── wordmark-inverted.svg  # For dark backgrounds
└── logomark-inverted.svg
```

### 9.3 Fonts

**Option A: Bundled** — WOFF2 format in `fonts/` directory
**Option B: External** — Reference from consuming app's public directory

---

## 10. Configuration

### 10.1 Option A: dna.config.json

```json
{
  "$schema": "https://dna.dev/schema/theme-config.json",
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

### 10.2 Option B: package.json.dna section

```json
{
  "name": "@rdna/theme-rad-os",
  "version": "1.0.0",
  "dna": {
    "type": "theme",
    "displayName": "Rad OS",
    "colorMode": "light",
    "icons": { "library": "phosphor", "style": "bold" }
  }
}
```

### 10.3 package.json Requirements

```json
{
  "name": "@rdna/theme-rad-os",
  "version": "1.0.0",
  "main": "./index.css",
  "exports": {
    ".": "./index.css",
    "./tokens": "./tokens.css",
    "./dark": "./dark.css",
    "./components/core": "./components/core/index.ts"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "tailwindcss": "^4.0.0"
  }
}
```

---

## 11. AI Skills Integration

### 11.1 AI-Skills Directory

Themes can include AI context documents:

```
ai-skills/
├── component-generation.md   # How to generate new components
├── migration-guide.md        # How to migrate existing projects
└── brand-voice.md            # Brand personality for content
```

### 11.2 AI UX Pattern Framework

DNA implements AI as an **assistant**, not autonomous agent. All code changes require human approval.

**Pattern Categories:**

| Category | Implementation |
|----------|---------------|
| **Wayfinders** | Prompt gallery, contextual suggestions |
| **Tuners** | Parameters (WCAG level), filters (locked tokens) |
| **Governors** | Action plans, verification gates, visual preview |
| **Trust Builders** | AI disclosure badges, data ownership controls |

**Verification Flow:** Plan Review → Visual Preview → Confirm Apply

### 11.3 CLI Commands

```bash
# Initialize a new theme
dna init my-theme

# Add components from core
dna add button card input

# Generate json-render catalog
dna catalog generate

# Validate theme
dna validate

# Build tokens
dna build

# Migration wizard
dna migrate ./existing-project
```

---

## 12. Validation Rules

### 12.1 Required File Checks

```
✓ package.json exists and has "name" field
✓ Entry CSS exists (index.css at root OR theme/index.css)
✓ Tokens CSS contains @theme block
✓ Typography CSS contains @layer base
✓ Fonts CSS exists
✓ Color modes CSS exists (dark.css OR modes.css)
✓ components/core/ directory exists
✓ components/core/index.ts exports at least one component
```

### 12.2 Token Checks

```
✓ All @theme tokens use kebab-case
✓ Required semantic tokens present:
  - --color-surface-primary
  - --color-surface-secondary
  - --color-content-primary
  - --color-content-inverted
  - --color-edge-primary
```

### 12.3 Component Checks

```
✓ All .tsx files have default export
✓ No hardcoded hex colors in className strings
✓ TypeScript interfaces defined for props
```

---

## Appendix A: Quick Token Reference

```css
/* Colors */
--color-surface-{primary|secondary|tertiary|elevated|inverse}
--color-content-{primary|secondary|inverted|link}
--color-edge-{primary|focus|error}
--color-action-{primary|secondary|destructive|disabled}
--color-status-{success|warning|error|info}

/* Spacing */
--spacing-{xs|sm|md|lg|xl|2xl}

/* Radius */
--radius-{sm|md|lg|full}

/* Shadows */
--shadow-{sm|md|lg|card|elevated}

/* Motion */
--duration-{instant|fast|base|moderate|slow}
--easing-{default|in|out|in-out}

/* Icons */
--icon-{xs|sm|md|lg|xl|2xl}

/* Accessibility */
--focus-ring-{width|offset|color}
--touch-target-{min|default|comfortable}

/* Breakpoints */
--breakpoint-{xs|sm|md|lg|xl|2xl}
```

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-18 | 1.0.0 | Merged spec from 3 sources: radflow theme-spec, design-system-infrastructure, dna-theme-spec |
| 2026-01-15 | 0.2.0 | Updated per gap analysis |
| 2026-01-14 | 0.1.0 | Initial draft |



