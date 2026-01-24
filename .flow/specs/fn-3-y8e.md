# DNA Spec Compliance for @dna/radiants

## Overview

Bring the @dna/radiants theme package into full compliance with the DNA specification (docs/theme-spec.md). Currently 25 components exist but only 3 have the three-file pattern, and many use brand tokens instead of semantic tokens.

## Scope

### In Scope
- Add missing semantic tokens (surface-tertiary, content-secondary, action-destructive, spacing-*)
- Add motion tokens (duration-*, easing-*)
- Create .schema.json and .dna.json for all 22 components lacking them
- Refactor all component classes from brand tokens to semantic tokens (clean break)
- Update package.json exports (add ./typography, ./fonts)
- Add dna.config.json

### Out of Scope
- Moving components to app (Web3ActionBar, MockStatesPopover stay in theme for now)
- Density system (compact/default/comfortable)
- Visual regression testing setup
- i18n tokens

## Key Decisions

| Decision | Resolution |
|----------|------------|
| Opacity handling | **Use Tailwind opacity modifiers**: `text-content-primary/70`, `bg-surface-primary/50` |
| Brand token utilities | Replace with semantic equivalents; brand tokens stay in @theme inline only |
| Compound component schemas | Include `subcomponents` array documenting all exports |
| Motion tokens | **Define tokens but DO NOT apply to components in v1**; keep existing durations; tokens enable future theming |
| Naming alignment | Add `--color-content-secondary`; use with opacity modifiers |

## Approach

### Phase 1: Token Foundation (Tasks 1-4)
1. Add missing semantic tokens to tokens.css (surface-tertiary, content-secondary, action-destructive)
2. Add motion tokens (duration-*, easing-*) - defined but not applied
3. Add spacing tokens (spacing-xs through spacing-2xl)
4. Update dark.css with explicit overrides for new tokens

**Verification Gate**: All tokens resolve; `pnpm dev` starts

### Phase 2: Package Configuration (Tasks 5-6)
5. Update package.json exports (./typography, ./fonts, ./animations, ./base)
6. Create dna.config.json

**Verification Gate**: All exports import correctly

### Phase 3: Component Schema + Token Refactoring (Tasks 7-28)
For each of 22 components:
- Create .schema.json (props, variants, slots, examples)
- For compound components: include `subcomponents` array
- Create .dna.json (token bindings)
- Refactor classes from brand tokens to semantic tokens using Tailwind opacity modifiers

**Components by complexity:**
- **Simple (6)**: Badge, Divider, Progress, Switch, Slider, Tooltip
- **Form (3)**: Select, Checkbox, Alert
- **Feedback (3)**: Toast, Accordion, Breadcrumbs
- **Overlay helpers (5)**: ContextMenu, HelpPanel, CountdownTimer, Web3ActionBar, MockStatesPopover
- **Compound overlays (5)**: Dialog, Popover, Sheet, DropdownMenu, Tabs

**Verification Gate per component**: Renders in both light/dark modes

### Phase 4: Final Verification (Task 29)
- Full smoke test of all components
- Validate all exports
- Test dark mode toggle
- Grep check: no brand tokens in component className props

## Token Mapping Reference

| Brand Token | Semantic Token |
|-------------|----------------|
| `bg-warm-cloud` | `bg-surface-primary` |
| `bg-black` | `bg-surface-secondary` |
| `bg-sunset-fuzz` | `bg-surface-tertiary` |
| `text-black` | `text-content-primary` |
| `text-cream` | `text-content-inverted` |
| `text-black/70` | `text-content-primary/70` (Tailwind opacity) |
| `border-black` | `border-edge-primary` |
| `ring-sun-yellow` | `ring-edge-focus` |
| `bg-sun-yellow` | `bg-action-primary` |
| `bg-sun-red` | `bg-action-destructive` |
| `bg-green` | `bg-status-success` |
| `bg-success-green` | `bg-status-success` |
| `bg-sky-blue` | `bg-status-info` |
| `bg-error-red` | `bg-status-error` |
| `border-sun-red` | `border-status-error` |
| `border-black/20` | `border-edge-primary/20` (Tailwind opacity) |

## Quick commands

```bash
# Install dependencies
pnpm install

# Start dev server (verify after each phase)
cd packages/radiants/apps/rad_os && pnpm dev

# Check TypeScript
pnpm --filter @dna/radiants tsc --noEmit

# Grep check: no brand tokens in components
grep -r "bg-warm-cloud\|bg-black\|text-black\|border-black" packages/radiants/components/core/

# Validate exports
node -e "require('@dna/radiants/typography'); console.log('OK')"
```

## Acceptance

- [ ] All semantic tokens defined per spec (surface-*, content-*, edge-*, action-*, status-*)
- [ ] Motion tokens defined (duration-*, easing-*) - not applied to components
- [ ] Spacing tokens defined (spacing-xs through spacing-2xl)
- [ ] All 25 components have .schema.json (with subcomponents array for compound)
- [ ] All 25 components have .dna.json
- [ ] No brand tokens in component className props (clean break)
- [ ] package.json exports ./typography, ./fonts, ./animations, ./base
- [ ] dna.config.json exists
- [ ] All components render correctly in light mode
- [ ] All components render correctly in dark mode
- [ ] Dev server starts without errors

## References

- DNA Spec: `docs/theme-spec.md`
- Migration Guide: `docs/migration-guide-rad_os.md`
- Existing schemas: `packages/radiants/components/core/Button/Button.schema.json`
- Existing dna: `packages/radiants/components/core/Button/Button.dna.json`
