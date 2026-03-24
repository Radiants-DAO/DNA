---
name: figma-generate-library
description: Build professional-grade design systems in Figma that match code. Orchestrates multi-phase workflows across 20-100+ use_figma calls. Triggers on "create design system in Figma", "sync tokens to Figma", "build component library", "generate Figma library from code".
disable-model-invocation: false
---

# Design System Builder — Figma MCP Skill

Build professional-grade design systems in Figma that match code. Orchestrates multi-phase workflows across 20–100+ `use_figma` calls.

**Prerequisites**: The `figma-use` skill MUST also be loaded for every `use_figma` call.

**Always pass `skillNames: "figma-generate-library"` when calling `use_figma`.**

---

## The One Rule That Matters Most

**This is NEVER a one-shot task.** Building a design system requires 20–100+ `use_figma` calls across multiple phases, with mandatory user checkpoints between them.

---

## Mandatory Workflow

```
Phase 0: DISCOVERY (no writes yet)
  0a. Analyze codebase → extract tokens, components, naming conventions
  0b. Inspect Figma file → pages, variables, components, styles
  0c. Search subscribed libraries → reusable assets
  0d. Lock v1 scope → agree on exact token set + component list
  0e. Map code → Figma → resolve conflicts
  ✋ USER CHECKPOINT: present full plan, await approval

Phase 1: FOUNDATIONS (tokens first — always before components)
  1a. Create variable collections and modes
  1b. Create primitive variables (raw values, 1 mode)
  1c. Create semantic variables (aliased to primitives, mode-aware)
  1d. Set scopes on ALL variables
  1e. Set code syntax on ALL variables
  1f. Create effect styles (shadows) and text styles (typography)
  ✋ USER CHECKPOINT: show variable summary, await approval

Phase 2: FILE STRUCTURE
  2a. Create page skeleton
  2b. Create foundations documentation pages
  ✋ USER CHECKPOINT: show page list + screenshot

Phase 3: COMPONENTS (one at a time)
  For EACH component (atoms before molecules):
    3a–3h. Create page, build component, variants, properties, docs, validate
    ✋ USER CHECKPOINT per component

Phase 4: INTEGRATION + QA
  4a–4e. Code Connect, accessibility, naming, bindings, final review
  ✋ USER CHECKPOINT: complete sign-off
```

---

## Critical Rules

1. **Variables BEFORE components**
2. **Inspect before creating** — match existing conventions
3. **One page per component** (default)
4. **Bind visual properties to variables** (default)
5. **Scopes on every variable** — NEVER `ALL_SCOPES`
6. **Code syntax on every variable** — WEB: `var(--token-name)`
7. **Alias semantics to primitives** — `{ type: 'VARIABLE_ALIAS', id: primitiveVar.id }`
8. **Position variants after combineAsVariants**
9. **INSTANCE_SWAP for icons** — never variant per icon
10. **Validate before proceeding** — `get_metadata` + `get_screenshot`
11. **NEVER parallelize use_figma calls**
12. **Never hallucinate Node IDs**

---

## Token Architecture

| Complexity | Pattern |
|-----------|---------|
| < 50 tokens | Single collection, 2 modes (Light/Dark) |
| 50–200 tokens | Primitives (1 mode) + Color semantic (Light/Dark) + Spacing (1 mode) + Typography (1 mode) |
| 200+ tokens | Multiple semantic collections, 4–8 modes |

Standard pattern:
```
Collection: "Primitives"    modes: ["Value"]
Collection: "Color"         modes: ["Light", "Dark"]
Collection: "Spacing"       modes: ["Value"]
```

---

## Variable Scopes Reference

| Use case | Scopes |
|----------|--------|
| Background fills | `["FRAME_FILL", "SHAPE_FILL"]` |
| Text colors | `["TEXT_FILL"]` |
| Border/stroke | `["STROKE_COLOR"]` |
| Spacing/gap | `["GAP"]` |
| Corner radius | `["CORNER_RADIUS"]` |
| Primitives (hidden) | `[]` |

---

## Naming Conventions

**Variables** (slash-separated):
```
color/bg/primary     color/text/secondary    color/border/default
spacing/xs  spacing/sm  spacing/md  spacing/lg
radius/none  radius/sm  radius/md  radius/lg  radius/full
```

**Components**: `Button`, `Input`, `Card`, `Avatar`, `Badge`

**Variants**: `Property=Value, Property=Value`
