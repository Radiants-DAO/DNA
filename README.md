# DNA: Design Nexus Architecture

A theme system specification for AI-assisted development workflows. DNA provides standardized tokens, component schemas, and theme structures that enable portable, customizable design systems.

## Overview

DNA is the **factory standard** for building themes. It defines:

- **Two-tier token system** — Brand → Semantic
- **Component pattern** — `.tsx` + `.meta.ts` (`.schema.json` generated from meta)
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
              ▼                 ▼
       ┌─────────────┐   ┌─────────────┐
       │ @rdna/      │   │ @rdna/      │
       │ radiants    │   │ your-theme  │
       │             │   │             │
       │ Retro pixel │   │ Your brand  │
       │ aesthetic   │   │ here        │
       └─────────────┘   └─────────────┘
```

## Repository Structure

```
dna/
├── packages/                      # Publishable themes
│   ├── radiants/                  # @rdna/radiants - Reference theme
│   │   ├── tokens.css             # Semantic tokens
│   │   ├── dark.css               # Dark mode overrides
│   │   ├── typography.css         # Element styles
│   │   ├── fonts.css              # @font-face declarations
│   │   └── components/core/       # 25+ components with schemas
│   │
│   └── layer33/                   # Coalition app (uses DNA themes)
│       └── ...
│
├── tools/
│   ├── playground/                # Component playground + agent workflow surface
│
├── apps/
│   └── rad-os/                    # RadOS showcase app
│
├── docs/
│   ├── archive/
│   │   └── dna-conversion.md      # Archived migration guide
│   ├── theme-spec.md              # Full specification (v1.0.0)
│   └── migration-guide-rad_os.md  # Example migration
│
├── prompts/
│   └── dna-conversion/            # AI prompts for theme migration
│
├── templates/                     # Scaffolding for `dna create`
├── ideas/                         # Future explorations
└── CLAUDE.md                      # AI assistant instructions
```

## Theme Packages

| Package | Components | Schemas | Status |
|---------|------------|---------|--------|
| `@rdna/radiants` | 42 | Full meta + schema pattern | Reference implementation |

## Token System

DNA uses a **two-tier semantic token system**:

```css
/* Tier 1: Brand Tokens (internal reference) */
@theme inline {
  --color-ink: #0F0E0C;
  --color-cream: #FEF8E2;
  --color-mint: #CEF5CA;
}

/* Tier 2: Semantic Tokens (components use these) */
@theme {
  --color-page: var(--color-cream);
  --color-inv: var(--color-ink);
  --color-main: var(--color-ink);
  --color-flip: var(--color-cream);
  --color-line: var(--color-ink);
  --color-accent: var(--color-mint);
}
```

### Required Semantic Tokens

Every DNA theme must define:

| Category | Tokens |
|----------|--------|
| Surface | `page`, `inv` |
| Content | `main`, `flip` |
| Edge | `line` |

### Recommended Tokens

| Category | Tokens |
|----------|--------|
| Surface | `tinted`, `card`, `depth` |
| Content | `sub`, `mute`, `link` |
| Edge | `edge-secondary`, `rule`, `focus` |
| Action | `accent`, `accent-inv`, `danger` |
| Status | `success`, `warning`, `danger`, `link` |
| Motion | `duration-fast`, `duration-base`, `duration-slow`, `easing-default` |

## Component Pattern

Each component has an implementation and a meta file (schema is generated):

```
Button/
├── Button.tsx           # React implementation
├── Button.meta.ts       # Metadata, token bindings, registry config
└── Button.schema.json   # Generated from meta — prop types for AI tools
```

### Schema File (AI Interface, generated from meta)

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

## Styling Rules

```tsx
// DO: Use semantic tokens
className="bg-page text-main border-line"

// DON'T: Hardcode colors
className="bg-[#FEF8E2] text-[#0F0E0C]"

// DO: Use token-based shadows
className="shadow-[2px_2px_0_0_var(--color-line)]"

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

See `docs/archive/dna-conversion.md` for the archived guide.

## Integration

DNA is designed for:

- **Flow** (external repo) — Visual context tool that can consume DNA schemas
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
- **[Archived Conversion Guide](docs/archive/dna-conversion.md)** — Historical migration reference
- **[CLAUDE.md](CLAUDE.md)** — AI assistant instructions

## License

MIT
