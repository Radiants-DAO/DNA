# DNA: Design Nexus Architecture

A theme system specification for AI-assisted development workflows. DNA provides standardized tokens, component schemas, and theme structures that enable portable, customizable design systems.

## Overview

DNA is the **factory standard** for building themes. It defines:

- **Two-tier token system** — Brand → Semantic
- **Three-file component pattern** — `.tsx` + `.schema.json` + `.dna.json`
- **Tailwind v4 native** — Uses `@theme` blocks for CSS custom properties

```
┌─────────────────────────────────────────────────────────────┐
│                    DNA (The Standard)                       │
│                                                             │
│   Defines how themes are structured, how tokens are named,  │
│   how components are organized.                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
            implements the standard
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
   │ @dna/       │   │ @dna/       │   │ @dna/       │
   │ radiants    │   │ layer33     │   │ your-theme  │
   │             │   │             │   │             │
   │ Retro pixel │   │ Coalition   │   │ Your brand  │
   │ aesthetic   │   │ theme       │   │ here        │
   └─────────────┘   └─────────────┘   └─────────────┘
```

## Repository Structure

```
dna/
├── docs/
│   ├── theme-spec.md              # Full specification (v1.0.0)
│   ├── dna-conversion.md          # Migration guide
│   └── migration-guide-rad_os.md  # Example migration
│
├── packages/
│   ├── radiants/                  # Reference theme (full DNA compliance)
│   │   ├── tokens.css             # Semantic tokens
│   │   ├── dark.css               # Dark mode overrides
│   │   ├── typography.css         # Element styles
│   │   ├── fonts.css              # @font-face declarations
│   │   └── components/core/       # 25+ components with schemas
│   │
│   └── layer33/                   # Coalition theme (semantic tokens, port in-progress)
│       ├── app/globals.css        # Tokens entry point
│       ├── app/dark.css           # Dark mode overrides
│       └── components/ui/         # 25 components
│
├── prompts/
│   └── dna-conversion/            # AI prompts for theme migration
│       ├── 00-controller.prompt.md
│       ├── 01-phase0-assessment.prompt.md
│       ├── 02-sprint-generator.prompt.md
│       └── templates/
│
└── CLAUDE.md                      # AI assistant instructions
```

## Theme Packages

| Package | Components | Schemas | Status |
|---------|------------|---------|--------|
| `@dna/radiants` | 25+ | Full three-file pattern | Reference implementation |
| `@dna/layer33` | 25 | Semantic tokens complete | Schemas in progress |

## Token System

DNA uses a **two-tier semantic token system**:

```css
/* Tier 1: Brand Tokens (internal reference) */
@theme inline {
  --color-black: #0F0E0C;
  --color-cream: #FEF8E2;
  --color-green: #27FF93;
}

/* Tier 2: Semantic Tokens (components use these) */
@theme {
  --color-surface-primary: var(--color-cream);
  --color-surface-secondary: var(--color-black);
  --color-content-primary: var(--color-black);
  --color-content-inverted: var(--color-cream);
  --color-edge-primary: var(--color-black);
  --color-action-primary: var(--color-green);
}
```

### Required Semantic Tokens

Every DNA theme must define:

| Category | Tokens |
|----------|--------|
| Surface | `surface-primary`, `surface-secondary` |
| Content | `content-primary`, `content-inverted` |
| Edge | `edge-primary` |

### Recommended Tokens

| Category | Tokens |
|----------|--------|
| Surface | `surface-tertiary`, `surface-elevated`, `surface-muted` |
| Content | `content-secondary`, `content-muted`, `content-link` |
| Edge | `edge-secondary`, `edge-muted`, `edge-focus` |
| Action | `action-primary`, `action-secondary`, `action-destructive` |
| Status | `status-success`, `status-warning`, `status-error`, `status-info` |
| Motion | `duration-fast`, `duration-base`, `duration-slow`, `easing-default` |

## Component Pattern

Each component has three files:

```
Button/
├── Button.tsx           # React implementation
├── Button.schema.json   # Props interface for AI tools
└── Button.dna.json      # Token bindings per variant
```

### Schema File (AI Interface)

```json
{
  "name": "Button",
  "description": "Primary action trigger",
  "props": {
    "variant": {
      "type": "enum",
      "values": ["primary", "secondary", "ghost"],
      "default": "primary"
    },
    "size": {
      "type": "enum",
      "values": ["sm", "md", "lg"],
      "default": "md"
    }
  },
  "slots": ["icon", "children"],
  "examples": [
    { "props": { "variant": "primary" }, "children": "Click me" }
  ]
}
```

### DNA File (Token Bindings)

```json
{
  "component": "Button",
  "tokenBindings": {
    "primary": {
      "background": "action-primary",
      "text": "content-primary",
      "border": "edge-primary"
    },
    "secondary": {
      "background": "surface-secondary",
      "text": "content-inverted"
    }
  }
}
```

## Styling Rules

```tsx
// DO: Use semantic tokens
className="bg-surface-primary text-content-primary border-edge-primary"

// DON'T: Hardcode colors
className="bg-[#FEF8E2] text-[#0F0E0C]"

// DO: Use token-based shadows
className="shadow-[2px_2px_0_0_var(--color-edge-primary)]"

// DON'T: Hardcoded shadow colors
className="shadow-[2px_2px_0_0_#000]"
```

## Dark Mode

DNA supports three activation methods:

```css
/* 1. System preference */
@media (prefers-color-scheme: dark) {
  :root { /* overrides */ }
}

/* 2. Data attribute */
[data-theme="dark"] { /* overrides */ }

/* 3. Class */
.dark { /* overrides */ }
```

**Key insight:** Surface/content/edge tokens **invert**, action/status tokens **stay the same**.

## Converting Existing Projects

Use the DNA conversion prompts in `prompts/dna-conversion/`:

1. **Phase 0: Assessment** — Scan codebase for tokens and components
2. **Sprint Generator** — Create task breakdown
3. **Templates** — Token foundation, component schemas, refactoring, dark mode

See `docs/dna-conversion.md` for the full guide.

## Integration

DNA is designed for:

- **[RadFlow](https://github.com/Radiants-DAO)** — Theme editor that reads DNA schemas
- **[json-render](https://github.com/vercel-labs/json-render)** — AI-generated UI runtime
- **Claude Code / Cursor** — AI assistants that use schemas for context

## Roadmap

- [ ] CLI tooling (`dna init`, `dna add`, `dna validate`)
- [ ] Component catalog generator
- [ ] Visual theme editor integration
- [ ] Additional reference themes

## Key Decisions

| Area | Choice |
|------|--------|
| CSS | Tailwind v4 native (`@theme` blocks) |
| Token naming | `surface-*`, `content-*`, `edge-*`, `action-*`, `status-*` |
| Components | Copy-on-import (like shadcn) |
| Color modes | Light + Dark only (v1) |
| Motion | CSS-first, ease-out only, max 300ms |
| Icons | Lucide base (24x24 grid, 2px stroke) |

## Documentation

- **[Theme Specification](docs/theme-spec.md)** — Complete v1.0.0 spec
- **[Conversion Guide](docs/dna-conversion.md)** — Migrate existing projects
- **[CLAUDE.md](CLAUDE.md)** — AI assistant instructions

## License

MIT
