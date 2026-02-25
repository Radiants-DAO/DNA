# Radiants Production-Ready Brainstorm

**Date:** 2026-02-25
**Status:** Decided

## What We're Building

Make `@rdna/radiants` a production-ready npm package that can be consumed by any web3 app via `npm install @rdna/radiants`. Within the DNA monorepo, apps continue to consume source directly via `workspace:*` for live updates. Externally, consumers get a properly built package with TypeScript declarations, CSS exports, and versioned releases.

## Why Approach A (Build-First)

Build pipeline is the bottleneck for everything else. You can't publish without a build step, and you can't meaningfully test the published artifact without building it first. Each sprint produces a demoable, shippable increment:

1. Build pipeline = radiants is publishable
2. Validation + schemas = radiants is spec-compliant
3. Tests = radiants is regression-proof
4. CI + publish = radiants is automated

## Key Decisions

- **Distribution model:** Dual - workspace linking (monorepo) + npm public (external)
- **Consumption model:** Direct npm import (`import { Button } from '@rdna/radiants/components/core'`)
- **Registry:** npm public under `@rdna` scope
- **Approach:** Build-First (4 sprints)
- **layer33:** Removed from monorepo (standalone at `/dev/layer33`)
- **Clean break on brand tokens:** No fallbacks, semantic tokens only in components
- **Two-tier token system:** Brand (internal) + Semantic (public). No Tier 3 component tokens.

## Sprint Breakdown

### Sprint 1: TypeScript Build Pipeline
- Add `tsconfig.build.json` to packages/radiants
- Build script producing `dist/` with `.js` + `.d.ts`
- Conditional exports in package.json (`types`, `import`, `require`)
- CSS files pass through (no build needed)
- Monorepo apps keep consuming source via `workspace:*`
- **Gate:** `npm pack` produces valid tarball, types resolve in a test consumer

### Sprint 2: Validation & Schema Consistency
- Build `dna validate` script (simple Node.js, not full CLI)
- Fix schema inconsistencies (Card slots format differs from Button)
- Decide `.meta.ts` source-of-truth strategy for all 25 components
- Validate token naming, three-file pattern, required fields
- **Gate:** `dna validate` passes on radiants package

### Sprint 3: Tests
- Component render tests (Vitest + React Testing Library)
- Light/dark mode snapshot tests
- Token presence/resolution tests
- Schema validity tests (JSON structure, required fields)
- **Gate:** `pnpm test` passes, coverage on all 25 components

### Sprint 4: CI & Publish
- GitHub Actions: test + typecheck on PR
- Changesets for versioning (`@changesets/cli`)
- Automated npm publish on release
- **Gate:** Tag a release, package appears on npm

## Open Questions

- Should `MockStatesPopover` and `Web3ActionBar` ship in the public package? They're dev/domain-specific.
- Font licensing: Mondwest requires purchase. Should the package include fallback font stacks?
- Should `@rdna/radiants` re-export the schema barrel for AI tooling, or keep that as a separate `@rdna/radiants/schemas` entry?

## Research Notes

- radiants currently has no build step - ships raw `.ts` source (works for workspace, not npm)
- 25 components all have three-file pattern (`.tsx`, `.schema.json`, `.dna.json`)
- Only Button has `.meta.ts` - other 24 schemas are hand-maintained JSON
- Card's `slots` field uses array format vs Button's object format (inconsistency)
- `packages/preview/src/generate-schemas.ts` exists but only works for components with `.meta.ts`
- rad-os already fully consumes radiants via `workspace:*` with live updates
- radmark has `workspace:*` link but actual usage unclear
- Relevant skills: `design-system-patterns`, `tailwind-v4-shadcn`, `vercel-composition-patterns`
