# Webstudio Architecture Adoption for RadFlow

## Overview

Adopt battle-tested patterns from Webstudio's open-source visual builder (AGPL-3.0) to enhance RadFlow's design system management capabilities. This epic focuses on **selective adoption**—taking Webstudio's mature type systems, canvas interaction patterns, and style infrastructure while preserving RadFlow's unique clipboard-first workflow and DNA's semantic token philosophy.

**Key Decisions from Interview:**
- **DNA philosophy preserved** - Three-tier tokens (Brand→Semantic→Component), StyleValue for value representation
- **Dual-mode output** - Design for clipboard + file writes from day one
- **Panel modes** - Default (Figma-like, clipboard), Focus (all props, clipboard), Advanced (file writes + CSS editor)
- **Hybrid component discovery** - Fiber runtime + static TypeScript types
- **Canvas interaction** - Port Webstudio's selection/hover/overlay system

## Scope

### In Scope
1. **StyleValue Type System** - Port Webstudio's Zod-validated CSS value types
2. **Dual-Mode Output Interface** - Abstraction for clipboard + file writes
3. **Color Space Support** - Add oklch, lab, lch using Culori library
4. **Token Resolution** - Implement `var()` reference chain resolution with cycle detection
5. **Canvas Interaction System** - Selection overlays, hover detection, event interception
6. **Iframe Security Upgrade** - credentialless attribute (with feature detection), rect tracking
7. **Hybrid Component Discovery** - Combine fiber + static TypeScript parsing with specific merge strategy
8. **Component Meta Enhancement** - Merge DNA schema with Webstudio's WsComponentMeta
9. **Style Panel Upgrade** - 16 sections with context awareness (two-phase approach)
10. **Shadow/Gradient Editors** - Layered value editors
11. **DOM Annotator Enhancement** - Inject data-radflow-id attributes for canvas interaction

### Out of Scope
- Webstudio's persistence layer (RadFlow supports clipboard + file, not database)
- Immerhin transaction system (simple undo stack sufficient)
- Collaborative editing features
- Webstudio's full page builder (different paradigm)
- Per-property breakpoints (deferred to Component Canvas spec)

## Architecture Decisions

### ADR-1: Dual-Mode Output
- **Decision**: Design IDesignOutput interface supporting both clipboard AND file writes
- **Rationale**: Direct file editing is critical for RadFlow's future
- **Panel mapping**: Default/Focus → clipboard, Advanced → file writes

### ADR-2: DNA Philosophy + Webstudio Types
- **Decision**: Keep DNA's token naming and philosophy, use StyleValue for value representation
- **Rationale**: DNA's three-tier system is sound; StyleValue enables validation, UI controls, resolution

### ADR-3: Parallel Task Structure
- **Decision**: StyleValue first, then Output Mode + Canvas + Component Meta in parallel
- **Rationale**: Faster execution, Canvas doesn't depend on StyleValue

### ADR-4: Hybrid Component Discovery
- **Decision**: Combine fiber runtime inspection with static TypeScript parsing
- **Rationale**: Runtime gives actual values; static gives full type information. Best of both.
- **Merge Strategy**: Use file:line as primary key, not component name

### ADR-5: Content Model Validation
- **Decision**: Support Webstudio's content model pattern for validating component nesting
- **Rationale**: Prevents invalid structures, provides better AI context

### ADR-6: Type System Bridge (NEW)
- **Decision**: Option B - TypeScript parser for CSS strings → StyleValue
- **Rationale**: Faster to implement than Rust enum equivalents; can upgrade to Option A later if perf issues

### ADR-7: Color Conversions (NEW)
- **Decision**: Use Culori library for color space conversions
- **Rationale**: Well-tested (2.5k stars), avoids reimplementing complex math

## Panel Mode System

| Mode | Output Target | Use Case |
|------|---------------|----------|
| **Default** | Clipboard only | Figma-like experience for newcomers |
| **Focus** | Clipboard only | All properties, power users |
| **Advanced** | File writes | Direct editing + CSS editor |

## Style Panel Organization

| Section | Behavior |
|---------|----------|
| Layout | Always visible |
| FlexChild | **Context-aware**: only when parent is flex |
| GridChild | **Context-aware**: only when parent is grid |
| Space | Always visible |
| Size | Always visible |
| Position | Always visible |
| Typography | Always visible |
| Backgrounds | Always visible |
| Borders | Always visible |
| BoxShadows | **Separate section** |
| Effects | **Combined**: filters, backdrop-filter, transitions, transforms |

## Webstudio Code to Port

### High Value (Port These)
| Source | Target | Purpose |
|--------|--------|---------|
| `canvas/shared/instance-hovering.ts` | `src/hooks/useInstanceHover.ts` | Hover detection + debounce |
| `canvas/shared/instance-selection.ts` | `src/hooks/useInstanceSelection.ts` | Click selection |
| `canvas/shared/interceptor.ts` | `src/utils/canvas/interceptor.ts` | Event interception |
| `canvas-tools/outline/` | `src/components/canvas/Outline.tsx` | Selection overlays |
| `style-panel/shared/scrub.ts` | Integrate into controls | Drag-to-adjust numbers |

### Medium Value (Patterns to Adopt)
- Builder API proxy pattern for cross-frame RPC
- Canvas rect tracking with ResizeObserver
- Pointer events toggle via CSS variable

## Test Project

Use **DNA Radiants** (`/Users/rivermassey/Desktop/dev/dna/packages/radiants`) for testing:
- Real three-tier token system
- Token chains (`var(--a): var(--b)`)
- Dark mode support
- Components folder

## Quick Commands

```bash
# Verify TypeScript types compile
pnpm typecheck

# Test color conversions
pnpm test -- --grep "color"

# Run style panel in dev
pnpm tauri dev

# Test with radiants theme
# (configure project path to /Users/rivermassey/Desktop/dev/dna/packages/radiants)
```

## Acceptance Criteria

### Foundation
- [ ] StyleValue TypeScript types match Webstudio's discriminated union pattern
- [ ] parseStyleValue() converts CSS strings to StyleValue types
- [ ] IDesignOutput interface supports clipboard + file targets
- [ ] Panel mode changes output target correctly

### Canvas Interaction
- [ ] DOM annotator injects data-radflow-id attributes
- [ ] Selection overlay shows on click with element label
- [ ] Hover detection with 100ms debounce
- [ ] Event interception prevents defaults in edit mode
- [ ] Iframe has credentialless attribute (with feature detection fallback)

### Component System
- [ ] Hybrid discovery merges fiber + static TypeScript data using file:line key
- [ ] Content model validates component nesting
- [ ] PropMeta includes control type inference

### Style Panels
- [ ] 16 sections with proper organization (two-phase refactor)
- [ ] FlexChild/GridChild context-aware
- [ ] Scrub controls on number inputs
- [ ] BoxShadows as separate section

### Color & Tokens
- [ ] Color picker supports hex, rgb, hsl, AND oklch (via Culori)
- [ ] Token resolver handles var() chains with visited set (not max depth)
- [ ] Circular references detected immediately with descriptive warning
- [ ] Radiants theme loads and displays correctly

### Output
- [ ] All changes work in clipboard mode (existing behavior)
- [ ] AGPL-3.0 attribution added for Webstudio-derived code
- [ ] Network copyleft implications documented

## Task Dependency Graph

```
fn-2-gnc.1 (StyleValue Types) ─────────────────────────┐
         │                                              │
         ├──→ fn-2-gnc.2 (Color Spaces - Culori)       │
         │                                              │
         ├──→ fn-2-gnc.3 (Token Resolution)            │
         │                                              │
         └──→ fn-2-gnc.8 (Output Mode) ────────────────┤
                                                        │
fn-2-gnc.12 (DOM Annotator) ────────────────────────────┤
         │                                              │
         └──→ fn-2-gnc.9 (Canvas Interaction)    parallel
                                                        │
fn-2-gnc.10 (Iframe Security) ─────────────────  parallel
                                                        │
fn-2-gnc.11 (Hybrid Discovery) ────────────────  parallel
                                                        │
fn-2-gnc.4 (Component Meta) ───────────────────  parallel
                                                        │
                    ┌───────────────────────────────────┘
                    ↓
         fn-2-gnc.5 (Style Panels) ← depends on 1, 8
                    │
                    ↓
         fn-2-gnc.6 (Shadow/Gradient Editors)
                    │
                    ↓
         fn-2-gnc.7 (AGPL Attribution)
```

## Risk Mitigations Applied

| Risk | Mitigation |
|------|------------|
| Type system impedance mismatch | Option B: TypeScript parser (ADR-6) |
| Bridge doesn't inject attributes | New task fn-2-gnc.12 (DOM Annotator) |
| Component meta merge conflicts | Specific merge strategy with file:line key |
| Circular token references | Visited set detection (not max depth) |
| RightPanel refactor breaks features | Two-phase approach in fn-2-gnc.5 |
| credentialless browser support | Feature detection with fallback |
| Color conversion accuracy | Use Culori library |

## References

- Webstudio repo: `/Users/rivermassey/Desktop/dev/webstudio-main`
- DNA spec: `/Users/rivermassey/Desktop/dev/dna/docs/theme-spec.md`
- DNA test project: `/Users/rivermassey/Desktop/dev/dna/packages/radiants`
- RadFlow docs: `/Users/rivermassey/Desktop/vault/radflow/`
- Component Canvas spec: `/Users/rivermassey/Desktop/vault/radflow/02-Features/component-canvas.md`
- Webstudio docs: https://docs.webstudio.is/
