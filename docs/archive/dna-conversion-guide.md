# DNA Conversion Guide

**Status:** DRAFT
**Version:** 0.1.0
**Date:** 2026-01-21

> **Note:** This guide is a draft. The radiants DNA conversion (fn-3-y8e) has not been fully tested in a consuming application yet.

---

## Purpose

This document abstracts the conversion process from two completed epics:
- **fn-2-zcd:** App → Monorepo migration (rad_os → DNA workspace)
- **fn-3-y8e:** Theme → DNA spec compliance (brand tokens → semantic tokens)

The goal is to define stable patterns that can be automated via conversion agents/skills.

---

## Table of Contents

1. [Conversion Types](#1-conversion-types)
2. [The DNA Target](#2-the-dna-target)
3. [Conversion Process](#3-conversion-process)
4. [Agent Architecture](#4-agent-architecture)
5. [Detection Rules](#5-detection-rules)
6. [Token Mapping](#6-token-mapping)
7. [Schema Generation](#7-schema-generation)
8. [Project-Specific Decisions](#8-project-specific-decisions)
9. [Validation Checklist](#9-validation-checklist)

---

## 1. Conversion Types

### Type A: App → Monorepo Migration

**When to use:** Standalone app needs to consume a DNA theme package.

**Input:** Standalone Next.js/React app with inline styles or local components
**Output:** App in workspace consuming `@dna/<theme>` package

**Steps:**
1. Configure pnpm workspace + turbo.json
2. Extract shared code to theme package (CSS, hooks, components)
3. Update app to import from workspace package
4. Remove duplicates from app

**Reference:** `docs/migration-guide-rad_os.md`

### Type B: Theme → DNA Spec Compliance

**When to use:** Theme exists but doesn't follow DNA spec patterns.

**Input:** Theme with brand tokens, components lacking schemas
**Output:** DNA-compliant theme with semantic tokens, three-file pattern

**Steps:**
1. Add semantic token layer
2. Add motion/spacing tokens
3. Generate schema files (.schema.json, .dna.json)
4. Refactor components (brand → semantic tokens)
5. Update package exports + config

**Reference:** `.flow/specs/fn-3-y8e.md`

### Type C: Greenfield Theme (not yet implemented)

**When to use:** Starting fresh with DNA spec as guide.

**Input:** Brand guidelines, color palette, typography choices
**Output:** New DNA-compliant theme package

---

## 2. The DNA Target

All conversions converge to the DNA spec (`docs/theme-spec.md`). Key requirements:

### Token System (Two Tiers)

```
┌─────────────────────────────────────────────────────────────┐
│  TIER 2: SEMANTIC TOKENS                                    │
│  --color-surface-primary, --color-content-primary           │
│  Purpose-based tokens - components use these directly       │
├─────────────────────────────────────────────────────────────┤
│  TIER 1: BRAND TOKENS                                       │
│  --color-sun-yellow, --color-black, --color-sky-blue        │
│  Raw palette in @theme inline (internal reference only)     │
└─────────────────────────────────────────────────────────────┘
```

Components use semantic tokens directly (e.g., `bg-surface-primary`). No intermediate component token layer.

### Required Semantic Tokens

```css
/* Surfaces (backgrounds) */
--color-surface-primary      /* Main background */
--color-surface-secondary    /* Contrast/inverted background */

/* Content (text/icons) */
--color-content-primary      /* Main text */
--color-content-inverted     /* Text on secondary surfaces */

/* Edges (borders) */
--color-edge-primary         /* Main border */
```

### Recommended Semantic Tokens

```css
/* Extended surfaces */
--color-surface-tertiary     /* Accent background */
--color-surface-elevated     /* Cards, modals */

/* Extended content */
--color-content-secondary    /* Muted text (use with opacity modifiers) */
--color-content-link         /* Link text */

/* Extended edges */
--color-edge-focus           /* Focus rings */

/* Status */
--color-status-success
--color-status-warning
--color-status-error
--color-status-info

/* Actions */
--color-action-primary       /* Primary buttons */
--color-action-secondary     /* Secondary actions */
--color-action-destructive   /* Delete, danger */
```

### Three-File Component Pattern

```
components/core/
├── Button/
│   ├── Button.tsx           # Implementation
│   ├── Button.schema.json   # Props, variants, examples (AI interface)
│   └── Button.dna.json      # Token bindings
```

### Package Structure

```
@dna/<theme>/
├── package.json
├── index.css                # Entry point
├── tokens.css               # Design tokens (@theme blocks)
├── typography.css           # Element styles (@layer base)
├── fonts.css                # @font-face declarations
├── dark.css                 # Dark mode overrides
├── components/core/         # UI components
└── dna.config.json          # Theme metadata
```

---

## 3. Conversion Process

### Phase 1: Analysis

**Goal:** Understand what exists and what's missing.

1. **Detect existing tokens**
   - Find CSS custom properties in stylesheets
   - Identify naming patterns (brand-specific vs semantic)
   - Map to DNA token categories

2. **Inventory components**
   - List all component files
   - Check for existing schemas
   - Identify token usage in className props

3. **Gap analysis**
   - Compare against DNA spec requirements
   - Generate list of missing tokens
   - Generate list of components needing schemas

### Phase 2: Token Foundation

**Goal:** Establish the semantic token layer.

1. **Create/update tokens.css**
   - Add brand tokens to `@theme inline` (internal reference)
   - Add semantic tokens to `@theme` (public utilities)
   - Map brand → semantic

2. **Add extended tokens**
   - Motion tokens (duration-*, easing-*)
   - Spacing tokens (spacing-xs through spacing-2xl)
   - Status tokens (if components need them)

3. **Create/update dark.css**
   - Override semantic tokens (not brand)
   - Ensure all semantic tokens have dark equivalents

### Phase 3: Component Migration

**Goal:** Apply three-file pattern and semantic tokens.

For each component:

1. **Generate .schema.json**
   - Extract props from TypeScript interface
   - Document variants, slots, examples
   - For compound components: add `subcomponents` array

2. **Generate .dna.json**
   - Map variants to token bindings
   - Document which tokens each state uses

3. **Refactor .tsx**
   - Replace brand tokens with semantic equivalents
   - Use Tailwind opacity modifiers (e.g., `text-content-primary/70`)
   - Remove hardcoded colors

### Phase 4: Configuration

**Goal:** Wire up package for consumption.

1. **Update package.json exports**
   ```json
   {
     "exports": {
       ".": "./index.css",
       "./tokens": "./tokens.css",
       "./dark": "./dark.css",
       "./typography": "./typography.css",
       "./fonts": "./fonts.css",
       "./components/core": "./components/core/index.ts"
     }
   }
   ```

2. **Create dna.config.json**
   ```json
   {
     "name": "theme-name",
     "displayName": "Theme Display Name",
     "colorModes": { "default": "light", "available": ["light", "dark"] },
     "fonts": { "heading": "...", "body": "...", "mono": "..." }
   }
   ```

### Phase 5: Verification

**Goal:** Confirm everything works.

1. **Token resolution** - All tokens resolve without errors
2. **TypeScript compilation** - No type errors
3. **Component rendering** - Light and dark modes work
4. **No brand token leakage** - grep check passes

---

## 4. Agent Architecture

### Recommended Agent Decomposition

```
┌─────────────────────────────────────────────────────────────┐
│                    DNA Conversion System                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Gap Analyst │───▶│ Plan Builder │───▶│  Coordinator │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                                       │           │
│         ▼                                       ▼           │
│  "Missing:                              Spawns workers      │
│   - 3 semantic tokens                   for each task       │
│   - 22 schema files                                         │
│   - dark mode overrides"                                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                     Execution Agents                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐│
│  │ Token          │  │ Schema         │  │ Token          ││
│  │ Foundation     │  │ Generator      │  │ Refactor       ││
│  └────────────────┘  └────────────────┘  └────────────────┘│
│                                                             │
│  - Analyze existing    - Parse .tsx        - Apply mapping  │
│  - Add semantic layer  - Generate schema   - Update classes │
│  - Add motion/spacing  - Generate dna.json - Use opacity    │
│  - Generate dark.css                         modifiers      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Agent Responsibilities

| Agent | Input | Output | Stable? |
|-------|-------|--------|---------|
| **Gap Analyst** | Theme directory | List of missing items | Yes |
| **Plan Builder** | Gap list | Flow epic with tasks | Yes |
| **Token Foundation** | tokens.css + mapping | Updated tokens.css | Yes |
| **Schema Generator** | Component .tsx | .schema.json + .dna.json | Yes |
| **Token Refactor** | Component + mapping | Updated .tsx | Yes |
| **Dark Mode Generator** | Semantic tokens | dark.css overrides | Yes |

### Why This Decomposition?

1. **Isolation** - Each agent has clear input/output contract
2. **Reusability** - Schema generator works for any component
3. **Parallelization** - Component tasks can run concurrently
4. **Debugging** - When something fails, you know which agent broke

---

## 5. Detection Rules

### Detecting Brand Tokens

Pattern: CSS custom properties that reference raw colors or brand-specific names.

```css
/* Brand token indicators */
--color-{brand-name}         /* e.g., --color-sun-yellow */
--color-{descriptive-color}  /* e.g., --color-warm-cloud */
#{6-digit-hex}               /* e.g., #FCE184 */
```

### Detecting Semantic Tokens

Pattern: CSS custom properties following DNA naming.

```css
/* Semantic token indicators */
--color-surface-{level}      /* surface-primary, surface-secondary */
--color-content-{level}      /* content-primary, content-inverted */
--color-edge-{level}         /* edge-primary, edge-focus */
--color-action-{type}        /* action-primary, action-destructive */
--color-status-{state}       /* status-success, status-error */
```

### Detecting Token Usage in Components

```bash
# Find brand tokens in className props
grep -r "bg-warm-cloud\|bg-black\|text-black\|border-black" components/

# Find hardcoded colors
grep -r "bg-\[#\|text-\[#\|border-\[#" components/

# Find semantic tokens (good)
grep -r "bg-surface-\|text-content-\|border-edge-" components/
```

### Detecting Missing Schemas

```bash
# Components without schema.json
for dir in components/core/*/; do
  if [[ ! -f "${dir}*.schema.json" ]]; then
    echo "Missing schema: $dir"
  fi
done
```

---

## 6. Token Mapping

### Generic Mapping Strategy

| Source Pattern | Target Pattern | Example |
|----------------|----------------|---------|
| `bg-{brand}` | `bg-surface-*` | `bg-warm-cloud` → `bg-surface-primary` |
| `text-{brand}` | `text-content-*` | `text-black` → `text-content-primary` |
| `border-{brand}` | `border-edge-*` | `border-black` → `border-edge-primary` |
| `ring-{brand}` | `ring-edge-focus` | `ring-sun-yellow` → `ring-edge-focus` |

### Opacity Handling

**Use Tailwind opacity modifiers, not baked-in tokens.**

```css
/* DO: Tailwind opacity modifier */
text-content-primary/70
bg-surface-primary/50

/* DON'T: Baked-in opacity token */
--color-black-60: rgba(15, 14, 12, 0.6);
text-black-60
```

### radiants-Specific Mapping (Reference)

| Brand Token | Semantic Token |
|-------------|----------------|
| `bg-warm-cloud` | `bg-surface-primary` |
| `bg-black` | `bg-surface-secondary` |
| `bg-sunset-fuzz` | `bg-surface-tertiary` |
| `bg-cream` | `bg-surface-muted` |
| `text-black` | `text-content-primary` |
| `text-cream` | `text-content-inverted` |
| `text-black/70` | `text-content-primary/70` |
| `border-black` | `border-edge-primary` |
| `border-black/20` | `border-edge-primary/20` |
| `ring-sun-yellow` | `ring-edge-focus` |
| `bg-sun-yellow` | `bg-action-primary` |
| `bg-sun-red` | `bg-action-destructive` |
| `bg-green`, `bg-success-green` | `bg-status-success` |
| `bg-sky-blue` | `bg-status-info` |
| `bg-error-red` | `bg-status-error` |
| `border-sun-red` | `border-status-error` |

---

## 7. Schema Generation

### Schema Structure

```json
{
  "name": "ComponentName",
  "description": "Brief description",
  "props": {
    "variant": {
      "type": "enum",
      "values": ["primary", "secondary"],
      "default": "primary",
      "description": "Visual style"
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
    { "props": { "variant": "primary" }, "children": "Click me" }
  ]
}
```

### Compound Component Schemas

For components with multiple exports (Dialog, Sheet, etc.):

```json
{
  "name": "Dialog",
  "description": "Modal dialog",
  "subcomponents": [
    "DialogTrigger",
    "DialogContent",
    "DialogHeader",
    "DialogTitle",
    "DialogDescription",
    "DialogBody",
    "DialogFooter",
    "DialogClose"
  ],
  "props": { ... }
}
```

### DNA Binding Structure

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
  }
}
```

### Extraction Rules

1. **Props** - Parse TypeScript interface, map types to schema format
2. **Variants** - Look for cva/CVA definitions or conditional className logic
3. **Slots** - Identify `children`, icon props, custom render props
4. **Examples** - Generate from default props + common use cases

---

## 8. Project-Specific Decisions

These require human input and cannot be fully automated:

| Decision | Options | How to Decide |
|----------|---------|---------------|
| **Which components to theme** | All vs selective | Business logic components stay in app |
| **Brand token palette** | Project-specific | From brand guidelines or existing code |
| **Opacity strategy** | Tailwind modifiers vs baked-in | Tailwind modifiers preferred |
| **Motion application** | Apply to components vs define-only | Define-only for v1, apply later |
| **Component API changes** | Keep vs refactor | Avoid breaking changes unless necessary |
| **What stays in app** | Project-specific | Custom business logic, iconName props |

### Decision Prompts for Agents

When an agent encounters these, it should ask:

```
Opacity handling: Use Tailwind opacity modifiers (text-content-primary/70)
or create baked-in tokens (--color-content-primary-70)?

Options:
a) Tailwind opacity modifiers (recommended)
b) Baked-in opacity tokens

[User chooses, agent proceeds]
```

---

## 9. Validation Checklist

### Token Validation

- [ ] All required semantic tokens defined (surface-primary/secondary, content-primary/inverted, edge-primary)
- [ ] All tokens resolve without CSS errors
- [ ] Brand tokens in `@theme inline`, semantic in `@theme`
- [ ] Motion tokens defined (duration-*, easing-*)
- [ ] Spacing tokens defined (spacing-xs through spacing-2xl)

### Dark Mode Validation

- [ ] All semantic tokens have dark overrides
- [ ] `.dark` class selector works
- [ ] `@media (prefers-color-scheme: dark)` works
- [ ] WCAG AA contrast in dark mode

### Component Validation

- [ ] Every component has .schema.json
- [ ] Every component has .dna.json
- [ ] Compound components have `subcomponents` array
- [ ] No brand tokens in className props (grep check)
- [ ] TypeScript compiles without errors

### Package Validation

- [ ] package.json exports all CSS entry points
- [ ] dna.config.json exists with required fields
- [ ] Components export from index.ts
- [ ] pnpm install succeeds
- [ ] Dev server starts

### Integration Validation

- [ ] App imports work (`import '@dna/<theme>'`)
- [ ] Components render in light mode
- [ ] Components render in dark mode
- [ ] No console errors

---

## Appendix: Quick Commands

```bash
# Check for brand token leakage
grep -r "bg-warm-cloud\|bg-black\|text-black\|border-black" packages/radiants/components/

# Count schema files
find packages/radiants/components -name "*.schema.json" | wc -l

# Count dna files
find packages/radiants/components -name "*.dna.json" | wc -l

# Validate JSON files
for f in packages/radiants/components/**/*.json; do
  node -e "JSON.parse(require('fs').readFileSync('$f'))" || echo "Invalid: $f"
done

# Check TypeScript
pnpm --filter @dna/radiants tsc --noEmit

# Test exports
node -e "require('@dna/radiants/typography'); console.log('OK')"
```

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-21 | 0.1.0 | Initial draft from fn-2-zcd and fn-3-y8e |
