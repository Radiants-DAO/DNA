# Sample Output: DNA Conversion for layer33

This example shows what the prompt system generates for the layer33 package.

---

## Generated: assessment.md

```markdown
# DNA Assessment: layer33

**Generated:** 2026-01-21
**Project:** packages/layer33

## Summary

| Metric | Count |
|--------|-------|
| Total components | 15 |
| Components with schema | 0 |
| Components without schema | 15 |
| Brand tokens defined | 12 |
| Semantic tokens defined | 12 |
| DNA-compliant tokens | 0 |
| Non-standard semantic tokens | 12 |

## Token Inventory

### Brand Tokens (Tier 1)

| Token | Value | Used In |
|-------|-------|---------|
| `--color-white` | #FFFFFF | Global background |
| `--color-black` | #000000 | Text, borders |
| `--color-green` | #27FF93 | Success, CTA |
| `--color-blue` | #32D6FF | Info, links |
| `--color-purple` | #AF9FFF | Accents |
| `--color-accent-1` | #D8006C | Error, destructive |
| `--color-neutral-neutral-1` | #E5E4E3 | Backgrounds |
| `--color-neutral-neutral-2` | #C8C8C8 | Borders |
| `--color-neutral-neutral-3` | #7D7D7D | Muted text |
| `--color-neutral-neutral-4` | #424242 | Borders |

### Current Semantic Tokens (Non-Standard)

| Token | Value | DNA-Compliant? |
|-------|-------|----------------|
| `--color-text-primary` | var(--color-black) | No → content-primary |
| `--color-text-secondary` | var(--color-white) | No → content-inverted |
| `--color-text-alternate` | var(--color-neutral-neutral-3) | No → content-muted |
| `--color-bg-primary` | var(--color-white) | No → surface-primary |
| `--color-bg-secondary` | var(--color-black) | No → surface-secondary |
| `--color-bg-tertiary` | var(--color-neutral-neutral-1) | No → surface-tertiary |
| `--color-border-primary` | var(--color-black) | No → edge-primary |
| `--color-border-secondary` | var(--color-neutral-neutral-4) | No → edge-muted |

### DNA-Compliant Tokens

| Token | Value |
|-------|-------|
| (none found) | |

## Component Inventory

| Component | Path | Schema? | DNA? | Complexity | Needs Refactor? |
|-----------|------|---------|------|------------|-----------------|
| HeroSection | app/components/HeroSection.tsx | No | No | Simple | Yes |
| CTASection | app/components/CTASection.tsx | No | No | Simple | Yes |
| FAQSection | app/components/FAQSection.tsx | No | No | Compound | Yes |
| ServicesSection | app/components/ServicesSection.tsx | No | No | Simple | Yes |
| DashboardCard | app/components/DashboardCard.tsx | No | No | Simple | Yes |
| ValidatorCard | app/components/validators/ValidatorCard.tsx | No | No | Simple | Yes |
| StatsCard | app/components/validators/StatsCard.tsx | No | No | Simple | Yes |
| ValidatorGrid | app/components/validators/ValidatorGrid.tsx | No | No | Compound | Yes |
| StakingForm | app/staking/components/StakingForm.tsx | No | No | Complex | Yes |
| StakingPositionCard | app/staking/components/StakingPositionCard.tsx | No | No | Simple | Yes |
| ColorSwatch | app/media/components/ColorSwatch.tsx | No | No | Simple | No |
| LogoCard | app/media/components/LogoCard.tsx | No | No | Simple | No |

## Token Usage Analysis

### Non-Standard Semantic Tokens in Components

| Token | Component | Usage |
|-------|-----------|-------|
| `bg-bg-primary` | body (globals.css) | Background color |
| `text-text-primary` | various | Text color |
| `border-border-primary` | various | Border color |

### Brand Tokens in Components

| Token | Component | className Usage |
|-------|-----------|-----------------|
| `bg-green` | CTASection | Action backgrounds |
| `bg-black` | Various | Dark sections |
| `text-white` | Dark sections | Inverted text |
| `border-black` | Cards, inputs | Borders |

## Recommended Token Mapping

| Current | DNA Semantic | Notes |
|---------|--------------|-------|
| `--color-bg-primary` | `--color-surface-primary` | Rename |
| `--color-bg-secondary` | `--color-surface-secondary` | Rename |
| `--color-bg-tertiary` | `--color-surface-tertiary` | Rename |
| `--color-text-primary` | `--color-content-primary` | Rename |
| `--color-text-secondary` | `--color-content-inverted` | Rename |
| `--color-text-alternate` | `--color-content-muted` | Rename |
| `--color-border-primary` | `--color-edge-primary` | Rename |
| `--color-border-secondary` | `--color-edge-muted` | Rename |
| `bg-green` | `bg-action-primary` or `bg-status-success` | Context-dependent |
| `bg-blue` | `bg-status-info` | Status indicator |
| `bg-purple` | `bg-surface-tertiary` or keep as accent | Design choice |

## Gap Analysis

### Missing Required Tokens

- [ ] `--color-surface-primary` (has --color-bg-primary)
- [ ] `--color-surface-secondary` (has --color-bg-secondary)
- [ ] `--color-content-primary` (has --color-text-primary)
- [ ] `--color-content-inverted` (has --color-text-secondary)
- [ ] `--color-edge-primary` (has --color-border-primary)

### Missing Recommended Tokens

- [ ] `--color-action-primary`
- [ ] `--color-action-destructive`
- [ ] `--color-status-success`
- [ ] `--color-status-error`
- [ ] `--color-edge-focus`
- [ ] `--duration-fast`
- [ ] `--duration-base`
- [ ] `--easing-default`

### Components Needing Schemas

1. HeroSection (simple)
2. CTASection (simple)
3. FAQSection (compound - has accordion items)
4. ServicesSection (simple)
5. DashboardCard (simple)
6. ValidatorCard (simple)
7. StatsCard (simple)
8. StakingForm (complex)
9. StakingPositionCard (simple)

### Components Needing Token Refactor

All components using brand tokens (bg-green, bg-black, text-white, border-black)

## Motion Analysis

### Current Motion Values

| Location | Property | Value | Tokenize? |
|----------|----------|-------|-----------|
| globals.css | animation | 0.2s ease-out | Yes |
| globals.css | animation | 0.15s ease-out | Yes |
| globals.css | ease-btn | cubic-bezier(0.25, 0.46, 0.45, 0.94) | Yes |

### Recommended Motion Tokens

```css
--duration-fast: 100ms;     /* Replaces 0.15s */
--duration-base: 150ms;
--duration-moderate: 200ms; /* Replaces 0.2s */
--duration-slow: 300ms;
--easing-default: cubic-bezier(0, 0, 0.2, 1);
```

## Conversion Complexity Estimate

| Phase | Items | Complexity |
|-------|-------|------------|
| Token Foundation | 15 tokens to rename/add | Low |
| Component Schemas | 9 components | Medium |
| Token Refactor | ~10 components | Medium |
| Dark Mode | 15 tokens to override | Low |

**Recommended approach:** Full conversion (tokens already exist, just need renaming)
```

---

## Generated: sprint-plan.md

```markdown
# DNA Conversion Sprint Plan: layer33

**Generated:** 2026-01-21
**Assessment:** packages/layer33/.dna-conversion/assessment.md

## Overview

| Sprint | Name | Tasks | Status |
|--------|------|-------|--------|
| 1 | Token Foundation | 1 | Pending |
| 2 | Simple Component Schemas | 4 | Pending |
| 3 | Compound/Complex Schemas | 2 | Pending |
| 4 | Token Refactor | 2 | Pending |
| 5 | Configuration & Dark Mode | 3 | Pending |

**Total Tasks:** 12

## Sprint 1: Token Foundation

| Task | Description | Dependencies |
|------|-------------|--------------|
| 01-token-foundation | Rename non-standard semantic tokens to DNA format, add missing tokens | None |

## Sprint 2: Simple Component Schemas

| Task | Description | Dependencies |
|------|-------------|--------------|
| 02-hero-cta-schema | HeroSection, CTASection schemas | 01 |
| 03-services-dashboard-schema | ServicesSection, DashboardCard schemas | 01 |
| 04-validator-cards-schema | ValidatorCard, StatsCard schemas | 01 |
| 05-staking-position-schema | StakingPositionCard schema | 01 |

## Sprint 3: Compound/Complex Component Schemas

| Task | Description | Dependencies |
|------|-------------|--------------|
| 06-faq-section-schema | FAQSection with accordion subcomponents | 01 |
| 07-staking-form-schema | StakingForm complex component | 01 |

## Sprint 4: Token Refactor

| Task | Description | Dependencies |
|------|-------------|--------------|
| 08-refactor-surface-content | Replace bg-*, text-* brand tokens | 01 |
| 09-refactor-edge-action | Replace border-*, action brand tokens | 01 |

## Sprint 5: Configuration & Dark Mode

| Task | Description | Dependencies |
|------|-------------|--------------|
| 10-dark-mode | Create dark.css with token overrides | 01, 08, 09 |
| 11-package-config | Update exports, create dna.config.json | All above |
| 12-final-validation | Run all validation checks | All above |

## Dependency Graph

```
01-token-foundation
├── 02-hero-cta-schema
├── 03-services-dashboard-schema
├── 04-validator-cards-schema
├── 05-staking-position-schema
├── 06-faq-section-schema
├── 07-staking-form-schema
├── 08-refactor-surface-content
│   └── 10-dark-mode
├── 09-refactor-edge-action
│   └── 10-dark-mode
│       └── 11-package-config
│           └── 12-final-validation
```
```

---

## Generated: tasks/01-token-foundation.md

```markdown
# Task: Token Foundation

**Sprint:** 1
**Dependencies:** None
**Complexity:** Medium

## Description

Rename existing non-standard semantic tokens to DNA format and add missing required tokens. layer33 already has semantic tokens, but they use non-standard naming (bg-*, text-*, border-*) instead of DNA naming (surface-*, content-*, edge-*).

## Token Mapping

| Current Token | DNA Semantic Token | Value |
|---------------|-------------------|-------|
| `--color-bg-primary` | `--color-surface-primary` | var(--color-white) |
| `--color-bg-secondary` | `--color-surface-secondary` | var(--color-black) |
| `--color-bg-tertiary` | `--color-surface-tertiary` | var(--color-neutral-neutral-1) |
| `--color-text-primary` | `--color-content-primary` | var(--color-black) |
| `--color-text-secondary` | `--color-content-inverted` | var(--color-white) |
| `--color-text-alternate` | `--color-content-muted` | var(--color-neutral-neutral-3) |
| `--color-border-primary` | `--color-edge-primary` | var(--color-black) |
| `--color-border-secondary` | `--color-edge-muted` | var(--color-neutral-neutral-4) |
| (new) | `--color-action-primary` | var(--color-green) |
| (new) | `--color-action-destructive` | var(--color-accent-1) |
| (new) | `--color-status-success` | var(--color-green) |
| (new) | `--color-status-error` | var(--color-accent-1) |
| (new) | `--color-status-info` | var(--color-blue) |
| (new) | `--color-edge-focus` | var(--color-blue) |

## Files to Modify

- `app/globals.css` - Rename tokens in @layer base, add new tokens to @theme

## Implementation Steps

1. In the `@theme` block, add the new semantic tokens
2. In the `@layer base :root` block, rename existing tokens
3. Add motion tokens to @theme:
   ```css
   --duration-fast: 100ms;
   --duration-base: 150ms;
   --duration-moderate: 200ms;
   --duration-slow: 300ms;
   --easing-default: cubic-bezier(0, 0, 0.2, 1);
   ```
4. Update any direct usages of old token names in globals.css

## Validation Criteria

- [ ] All required DNA semantic tokens are defined
- [ ] Old non-standard tokens still work (for backwards compat)
- [ ] `npm run build` succeeds
- [ ] Tailwind generates `bg-surface-primary`, `text-content-primary`, etc.

## Commit Message

```
feat(tokens): add DNA semantic token layer

- Rename bg-* tokens to surface-*
- Rename text-* tokens to content-*
- Rename border-* tokens to edge-*
- Add action-* and status-* tokens
- Add motion tokens (duration-*, easing-*)
```
```

---

## Generated: tasks/08-refactor-surface-content.md

```markdown
# Task: Refactor Surface and Content Tokens

**Sprint:** 4
**Dependencies:** 01-token-foundation
**Complexity:** Medium

## Description

Replace brand token usage with DNA semantic tokens in component className props. This task covers surface (background) and content (text) tokens.

## Token Mapping

| Find | Replace With |
|------|--------------|
| `bg-black` | `bg-surface-secondary` |
| `bg-white` | `bg-surface-primary` |
| `bg-neutral-neutral-1` | `bg-surface-tertiary` |
| `bg-green` (action context) | `bg-action-primary` |
| `bg-green` (status context) | `bg-status-success` |
| `text-black` | `text-content-primary` |
| `text-white` | `text-content-inverted` |
| `text-neutral-neutral-3` | `text-content-muted` |

## Files to Modify

- `app/components/HeroSection.tsx`
- `app/components/CTASection.tsx`
- `app/components/ServicesSection.tsx`
- `app/components/FAQSection.tsx`
- `app/components/DashboardCard.tsx`
- `app/components/validators/ValidatorCard.tsx`
- `app/staking/components/StakingForm.tsx`

## Validation Criteria

- [ ] No brand tokens in modified files:
  ```bash
  grep -rn "bg-black\|bg-white\|text-black\|text-white" app/components/
  # Should return nothing (or only intentional uses)
  ```
- [ ] TypeScript compiles without errors
- [ ] Components render correctly

## Commit Message

```
refactor(components): replace brand tokens with semantic tokens

- bg-black → bg-surface-secondary
- bg-white → bg-surface-primary
- text-black → text-content-primary
- text-white → text-content-inverted
```
```

---

This example demonstrates the output format. Actual generation would create all 12 task files with specific details from the assessment.
