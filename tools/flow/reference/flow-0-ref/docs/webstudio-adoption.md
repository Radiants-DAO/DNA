# Webstudio Architecture Adoption

This document explains the architectural decisions behind RadFlow's adoption of patterns from [Webstudio](https://github.com/webstudio-is/webstudio), an open-source visual builder licensed under AGPL-3.0.

## Why Webstudio?

Webstudio provides battle-tested patterns for:
- Type-safe CSS value representation
- Style panel UI organization
- Layered value editors (shadows, gradients)
- Canvas interaction patterns

Rather than reinventing these patterns, RadFlow adopts and adapts them while preserving its unique focus on:
- Clipboard-first workflows for design system management
- DNA's three-tier token philosophy (Brand > Semantic > Component)
- LLM CLI tool integration (Claude Code, Cursor)

## What Was Adopted

### 1. StyleValue Type System

**Source**: Webstudio's `packages/css-engine/src/schema.ts`

Webstudio uses a discriminated union pattern for representing CSS values. Each value has a `type` field that determines its structure:

```typescript
// Webstudio pattern adopted by RadFlow
type StyleValue =
  | { type: "unit"; value: number; unit: string }
  | { type: "keyword"; value: string }
  | { type: "color"; colorSpace: ColorSpace; components: [number, number, number]; alpha: number }
  | { type: "var"; value: string; fallback?: VarFallback }
  | { type: "layers"; value: LayerValueItem[] }
  // ... etc
```

**RadFlow adaptations**:
- Extended `ColorValue` to support modern color spaces (oklch, oklab, lab, lch) for DNA's color system
- Added `ShadowValue` as a first-class type for structured shadow editing
- Integrated Zod schemas for runtime validation

### 2. CSS String Parser (Option B)

**Decision**: TypeScript-side parser rather than Rust enum equivalents

Per ADR-6, RadFlow parses CSS strings to StyleValue on the TypeScript side. This was faster to implement than creating equivalent Rust enums and can be upgraded to Rust parsing later if performance becomes an issue.

```typescript
// Parse any CSS string to StyleValue
parseStyleValue("10px")           // { type: "unit", value: 10, unit: "px" }
parseStyleValue("var(--color)")   // { type: "var", value: "color" }
parseStyleValue("#ff0000")        // { type: "color", colorSpace: "srgb", ... }
```

### 3. Style Panel Organization

**Source**: Webstudio's style panel sections

RadFlow adopts Webstudio's section-based style panel organization:

| Section | Behavior |
|---------|----------|
| Layout | Always visible (display, flex, grid) |
| FlexChild | Context-aware: only when parent is flex |
| GridChild | Context-aware: only when parent is grid |
| Spacing | Always visible (margin, padding) |
| Size | Always visible (width, height) |
| Position | Always visible |
| Typography | Always visible |
| Backgrounds | Always visible |
| Borders | Always visible |
| BoxShadows | Separate section with layered editor |
| Effects | Combined filters, transitions, transforms |

### 4. Layered Value Editors

**Source**: Webstudio's shadow and gradient editor patterns

For properties with comma-separated values (box-shadow, background), RadFlow adopts Webstudio's layered editor pattern:

- List of layers with individual controls
- Add/Remove/Reorder operations
- Per-layer property editing
- Live preview

### 5. Dual-Mode Output (Inspired)

While not directly ported from Webstudio, the output interface design was inspired by their persistence patterns. RadFlow's `IDesignOutput` interface supports:

| Mode | Target | Use Case |
|------|--------|----------|
| Default | Clipboard | Figma-like experience |
| Focus | Clipboard | All properties visible |
| Advanced | File | Direct file writes |

## What Was NOT Adopted

### Persistence Layer
Webstudio uses a database-backed persistence layer. RadFlow uses clipboard + file writes instead.

### Immerhin Transaction System
Webstudio's complex undo system was replaced with a simpler undo stack.

### Collaborative Editing
Not in RadFlow's scope as a local desktop tool.

### Full Page Builder
Different paradigm - RadFlow focuses on design system management, not page building.

## Architecture Decisions

### ADR-1: Dual-Mode Output
Design `IDesignOutput` interface supporting both clipboard AND file writes from day one.

### ADR-2: DNA Philosophy + Webstudio Types
Keep DNA's three-tier token naming philosophy while using StyleValue for value representation.

### ADR-6: TypeScript Parser
Parse CSS strings to StyleValue in TypeScript rather than Rust (faster to implement, can upgrade later).

### ADR-7: Color Conversions
Use Culori library for color space conversions rather than reimplementing complex math.

## File Mapping

| RadFlow | Webstudio Equivalent | Notes |
|---------|---------------------|-------|
| `src/types/styleValue.ts` | `packages/css-engine/src/schema.ts` | Extended with color spaces |
| `src/utils/styleValueToCss.ts` | `packages/css-engine/src/core/to-value.ts` | Modern color support |
| `src/utils/parseStyleValue.ts` | N/A | Original implementation |
| `src/utils/colorConversions.ts` | N/A | Uses Culori |
| `src/utils/tokenResolver.ts` | Inspired by variable resolution | Cycle detection |
| `src/components/designer/*.tsx` | Style panel patterns | Adapted for RadFlow UI |

## License Implications

By adopting Webstudio code (AGPL-3.0), RadFlow is also licensed under AGPL-3.0-or-later.

**For desktop use**: Standard AGPL distribution requirements apply.

**If web service**: Network copyleft requires source disclosure to users.

See [ATTRIBUTION.md](/ATTRIBUTION.md) for full attribution details.
