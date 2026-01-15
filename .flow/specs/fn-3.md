# fn-3 Theme Spec Research: Best Practices Deep Dive

## Overview

Create the definitive theme specification for RadFlow by synthesizing best practices from leading design systems and UI libraries. The goal is a theme spec that is:

- **Industry-aligned**: Following established patterns from Tailwind v4, Radix, Chakra, shadcn/ui
- **Developer-friendly**: Intuitive naming, clear structure, good DX
- **Future-proof**: Compatible with DTCG format, extensible architecture
- **Parseable**: Easy for lightningcss/SWC to parse and modify

## Scope

### In Scope
- Token naming conventions (finalize bg/fg/border vs alternatives)
- Token architecture (tiers, categories, relationships)
- Color mode implementation patterns
- Typography system structure
- Component library requirements
- Validation rules and tooling patterns

### Out of Scope
- Actual implementation (that's fn-2)
- POC work (already done in fn-1)
- Component code patterns (covered in feature specs)

## Approach

1. **Deep research** on each topic area (tasks fn-3.1 through fn-3.5)
2. **Document findings** in research notes with pros/cons
3. **Make decisions** with clear rationale
4. **Update theme-spec.md** with finalized patterns (task fn-3.6)

### Systems to Research
- Tailwind CSS v4 (primary - we're building on this)
- Radix Themes (excellent token architecture)
- Chakra UI v3 (mature semantic token system)
- shadcn/ui (popular, Tailwind-native)
- Open Props (CSS-first design tokens)
- Design Tokens Community Group (DTCG) spec

### Key Questions to Answer
1. **Token naming**: `bg-*/fg-*/border-*` vs `surface-*/content-*/edge-*` — which is more intuitive?
2. **Token tiers**: Is 3-tier (brand→semantic→component) optimal or overkill?
3. **Color modes**: Best pattern for light/dark that works with Tailwind v4?
4. **Typography**: `@apply` vs raw CSS custom properties?
5. **Required tokens**: What's the minimum viable set?

## Quick commands
- `cat docs/theme-spec.md` — Current theme spec
- `cat research/design-systems-notes.md` — Existing research notes

## Acceptance
- [ ] Token naming decision made with documented rationale
- [ ] Token architecture finalized (tiers, categories)
- [ ] Color mode pattern documented
- [ ] Typography approach decided
- [ ] Component requirements clarified
- [ ] theme-spec.md updated with all decisions
- [ ] Research notes preserved for future reference

## References
- Current spec: `docs/theme-spec.md`
- Prior research: `research/design-systems-notes.md`
- Tailwind v4 docs: https://tailwindcss.com/docs/theme
- DTCG spec: https://design-tokens.github.io/community-group/format/
- Radix Themes: https://www.radix-ui.com/themes/docs/theme/color
- Chakra tokens: https://chakra-ui.com/docs/theming/semantic-tokens
- Open Props: https://open-props.style/
