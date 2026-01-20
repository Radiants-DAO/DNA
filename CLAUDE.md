# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DNA (Design Nexus Architecture) is a theme system specification for AI-assisted development workflows. It provides a standardized token system, component schema format, and theme structure for portable design systems.

**Current Status:** Specification-driven project with documentation complete (v1.0.0). The `packages/` directory is scaffolded but empty—no theme implementations exist yet.

## Architecture

### Core Concepts

1. **Three-tier token system:**
   - Tier 1 (Brand): Raw palette values (`--color-sun-yellow`)
   - Tier 2 (Semantic): Purpose-based tokens that flip in color modes (`--color-surface-primary`)
   - Tier 3 (Component): Optional component-specific mappings (`--button-bg`)

2. **Three-file component pattern:**
   - `Component.tsx` — Implementation
   - `Component.schema.json` — Prop types and AI interface
   - `Component.dna.json` — Token bindings per variant

3. **Integration:** Uses [vercel-labs/json-render](https://github.com/vercel-labs/json-render) as the runtime format for AI-generated UI

### Theme Package Structure (when implemented)

```
theme-{name}/
├── package.json           # Required
├── index.css              # CSS entry point
├── tokens.css             # Design tokens (@theme blocks)
├── typography.css         # Element styles (@layer base)
├── fonts.css              # @font-face declarations
├── dark.css               # Dark mode overrides
├── components/core/       # UI components
└── dna.config.json        # Optional metadata
```

### Required Semantic Tokens

All themes must define these minimum tokens:
- `--color-surface-primary`, `--color-surface-secondary`
- `--color-content-primary`, `--color-content-inverted`
- `--color-edge-primary`

## Key Decisions

| Area | Choice |
|------|--------|
| CSS | Tailwind v4 native (`@theme` blocks) |
| Token naming | Semantic: `surface-*`, `content-*`, `edge-*` |
| Components | Copy-on-import, not installed as dependencies |
| Color modes | Light + Dark only (v1) |
| Motion | CSS-first, ease-out only, max 300ms |
| Icons | Lucide base (24x24 grid, 2px stroke) |

## Styling Rules

```tsx
// DO: Use semantic tokens
className="bg-surface-primary text-content-primary border-edge-primary"

// DON'T: Hardcode colors
className="bg-[#FEF8E2] text-[#0F0E0C]"
```

## Commands (planned CLI)

```bash
dna init my-theme        # Initialize new theme
dna add button card      # Add components from core
dna validate             # Validate theme structure
dna catalog generate     # Generate json-render catalog
```

## Specification

The complete specification is in `docs/theme-spec.md`. Key sections:
- Section 3: Token structure and naming conventions
- Section 4: Package structure options
- Section 7: Component schema format
- Section 12: Validation rules
