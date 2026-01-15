# fn-4.7 Research: Density/responsive system (breakpoints, variants, fluid scales)

## Description
Research and document the density and responsive token architecture for RadFlow's theme-rad-os design system. Covers breakpoint tokens, component density variants, container query patterns, and fluid spacing/typography scales.

## Acceptance
- [x] Breakpoint tokens defined (xs through 2xl with rem values)
- [x] Container queries vs media queries guidance documented
- [x] Component density variants specified (compact/default/comfortable)
- [x] Fluid typography scale with clamp() formulas
- [x] Fluid spacing scale with t-shirt sizes
- [x] Space pairs for dramatic variance documented
- [x] Integration with RadOS design patterns (lift-and-press, shadows)
- [x] Implementation phases recommended

## Done summary
Created comprehensive research document covering:
- Breakpoint tokens: xs (360px) through 2xl (1536px) with rem units and Tailwind v4 @theme integration
- Container queries: When to use container vs media queries, implementation patterns, browser support
- Density system: Three modes (compact/default/comfortable) with 4px base unit scaling and CVA patterns
- Fluid typography: Utopia-style clamp() formulas for all text sizes (text-xs through text-4xl)
- Fluid spacing: T-shirt size tokens (space-3xs through space-3xl) plus space pairs for dramatic variance
- RadOS integration: Density-aware lift effects, responsive component examples

Output: docs/research/density-responsive-system.md
## Evidence
- Commits:
- Tests:
- PRs: