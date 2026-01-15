# fn-4.4 Research: Motion token system (durations, easings, springs, reduced-motion)

## Description
Research and document motion token architecture for RadFlow's design system, covering duration scales, easing functions, spring physics (for non-RadOS themes), orchestration patterns, and accessibility compliance through `prefers-reduced-motion`.

## Acceptance
- [x] Duration token scale documented (instant → slowest)
- [x] Duration-scalar pattern for global control + reduced motion
- [x] Easing token scale documented (default, linear, in, out, in-out)
- [x] Spring physics tokens documented (for non-RadOS themes)
- [x] RadOS constraints validated (ease-out only, max 300ms, no springs)
- [x] Orchestration patterns documented (stagger, hierarchy, choreography)
- [x] prefers-reduced-motion implementation strategy defined
- [x] View Transitions API integration researched
- [x] Token file structure recommended
- [x] Component motion patterns documented (button, modal, dropdown, toast)
- [x] Implementation priority roadmap provided

## Done summary
## What changed
- Created `docs/research/motion-token-system.md` with complete motion token architecture
- Updated task spec with detailed acceptance criteria

## Why
- Research task fn-4.4 required documenting motion tokens (durations, easings, springs, reduced-motion)
- Establishes motion vocabulary for theme-rad-os and future themes
- Validates RadOS constraints against industry best practices

## Verification
- Reviewed DESIGN_SYSTEM.md motion constraints (ease-out only, max 300ms)
- Cross-referenced Norton, PatternFly, Fluent 2 design systems
- Researched Framer Motion, Motion.dev, View Transitions API

## Follow-ups
- Implementation in fn-4.11 synthesis document
- Integration with actual CSS token files when frontend scaffolded
## Evidence
- Commits: 601386c309821e73139239394ad4299322c78bf7
- Tests:
- PRs: