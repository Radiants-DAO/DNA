# fn-4.3 Research: Icon system architecture (grid, naming, SVG optimization, animation)

## Description

Research and document icon system architecture for RadFlow, covering grid standards, naming conventions, SVG optimization pipeline, and animation patterns. Analyze industry-standard icon libraries (Lucide, Heroicons, Phosphor, Radix) and recommend approach aligned with RadOS design system.

## Acceptance

- [x] Analyze icon library grid systems (Lucide, Heroicons, Phosphor, Radix)
- [x] Define grid standard (24×24px, 2px stroke)
- [x] Define size tokens (xs/sm/md/lg/xl/2xl)
- [x] Establish naming conventions (kebab-case files, PascalCase components)
- [x] Document SVGO optimization configuration
- [x] Define animation patterns (spin, pulse, draw, transitions)
- [x] Address prefers-reduced-motion accessibility
- [x] Solve icon + text baseline alignment
- [x] Recommend base library (Lucide)
- [x] Document findings in docs/research/icon-system-architecture.md

## Done summary
- Researched 4 major icon libraries (Lucide, Heroicons, Phosphor, Radix Icons)
- Established 24×24px grid with 2px stroke as RadFlow standard
- Defined 6-level size token system (xs/sm/md/lg/xl/2xl) aligned with 8-point grid
- Created naming conventions (kebab-case files, PascalCase React components)
- Configured SVGO optimization pipeline with recommended plugins
- Documented animation patterns (spin, pulse, draw) within RadOS 300ms constraint
- Added prefers-reduced-motion accessibility requirements
- Provided 3 icon + text baseline alignment strategies
- Recommended Lucide Icons as base library with custom extension path
## Evidence
- Commits: 1e3b69cc88b5dcc7fe8beafd364afe0851f945c3
- Tests:
- PRs: