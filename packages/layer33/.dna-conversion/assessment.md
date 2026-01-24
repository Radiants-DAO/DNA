# DNA Assessment: layer33

**Generated:** 2026-01-21
**Project:** packages/layer33

## Summary

| Metric | Count |
|--------|-------|
| Total components | 20 |
| Components with schema | 0 |
| Components without schema | 20 |
| Brand tokens defined | 12 |
| Semantic tokens defined | 17 |
| DNA-compliant tokens | 0 |
| Non-standard semantic tokens | 17 |

## Token Inventory

### Brand Tokens (Tier 1)

| Token | Value | Used In |
|-------|-------|---------|
| `--color-white` | #FFFFFF | Global background, cards |
| `--color-black` | #000000 | Text, borders, dark sections |
| `--color-green` | #27FF93 | Success, CTA, action buttons |
| `--color-blue` | #32D6FF | Info, links, focus state |
| `--color-purple` | #AF9FFF | Accents, card variants |
| `--color-accent-1` | #D8006C | Error, destructive actions |
| `--color-accent-2` | #CD2900 | Warning (unused) |
| `--color-accent-3` | #506000 | (unused) |
| `--color-neutral-neutral-1` | #E5E4E3 | Muted backgrounds |
| `--color-neutral-neutral-2` | #C8C8C8 | Borders |
| `--color-neutral-neutral-3` | #7D7D7D | Muted text |
| `--color-neutral-neutral-4` | #424242 | Secondary borders |

### Current Semantic Tokens (Non-Standard)

| Token | Value | DNA-Compliant? | Rename To |
|-------|-------|----------------|-----------|
| `--color-bg-primary` | var(--color-white) | No | `--color-surface-primary` |
| `--color-bg-secondary` | var(--color-black) | No | `--color-surface-secondary` |
| `--color-bg-tertiary` | var(--color-neutral-neutral-1) | No | `--color-surface-tertiary` |
| `--color-bg-alternate` | var(--color-green) | No | `--color-action-primary` |
| `--color-bg-success` | var(--color-green) | No | `--color-status-success` |
| `--color-bg-error` | var(--color-accent-1) | No | `--color-status-error` |
| `--color-bg-warning` | var(--color-blue) | No | `--color-status-warning` |
| `--color-text-primary` | var(--color-black) | No | `--color-content-primary` |
| `--color-text-secondary` | var(--color-white) | No | `--color-content-inverted` |
| `--color-text-alternate` | var(--color-neutral-neutral-3) | No | `--color-content-muted` |
| `--color-text-success` | var(--color-green) | No | (remove, use status token) |
| `--color-text-error` | var(--color-accent-1) | No | (remove, use status token) |
| `--color-text-warning` | var(--color-blue) | No | (remove, use status token) |
| `--color-border-primary` | var(--color-black) | No | `--color-edge-primary` |
| `--color-border-secondary` | var(--color-neutral-neutral-4) | No | `--color-edge-muted` |
| `--color-border-tertiary` | var(--color-neutral-neutral-3) | No | `--color-edge-secondary` |
| `--color-border-alternate` | var(--color-white) | No | `--color-edge-inverted` |

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
| MissionSection | app/components/MissionSection.tsx | No | No | Simple | Yes |
| QuoteSection | app/components/QuoteSection.tsx | No | No | Simple | Yes |
| BackstopSection | app/components/BackstopSection.tsx | No | No | Simple | Yes |
| DashboardCard | app/components/DashboardCard.tsx | No | No | Simple | Yes |
| DashboardListItem | app/components/DashboardListItem.tsx | No | No | Simple | Yes |
| DashboardsSection | app/components/DashboardsSection.tsx | No | No | Compound | Yes |
| ValidatorCard | app/components/validators/ValidatorCard.tsx | No | No | Simple | Yes |
| ValidatorGrid | app/components/validators/ValidatorGrid.tsx | No | No | Compound | Yes |
| StatsCard | app/components/validators/StatsCard.tsx | No | No | Simple | Yes |
| ValidatorsSection | app/components/validators/ValidatorsSection.tsx | No | No | Compound | Yes |
| StakingForm | app/staking/components/StakingForm.tsx | No | No | Complex | Yes |
| StakingPositionCard | app/staking/components/StakingPositionCard.tsx | No | No | Simple | Yes |
| ColorSwatch | app/brand-assets/components/ColorSwatch.tsx | No | No | Simple | No |
| LogoCard | app/brand-assets/components/LogoCard.tsx | No | No | Simple | No |
| ColorSwatch | app/media/components/ColorSwatch.tsx | No | No | Simple | No |
| LogoCard | app/media/components/LogoCard.tsx | No | No | Simple | No |

## Token Usage Analysis

### Brand Tokens in Components

| Token | Component | Example Usage |
|-------|-----------|---------------|
| `bg-black` | ServicesSection, QuoteSection | Dark section backgrounds |
| `bg-white` | DashboardsSection, DashboardListItem | Light backgrounds |
| `bg-purple` | DashboardCard, DashboardListItem, ServicesSection | Accent card variant |
| `bg-green` | Various buttons | Action/success backgrounds |
| `text-white` | CTASection, ServicesSection | Inverted text on dark |
| `text-black` | DashboardCard, DashboardListItem | Primary text |
| `border-black` | DashboardCard, DashboardListItem, ServicesSection | Primary borders |
| `text-neutral-neutral-3` | Various | Muted/secondary text |
| `text-neutral-neutral-4` | DashboardListItem, DashboardCard | Meta text |
| `hover:bg-neutral-neutral-1` | DashboardListItem | Hover states |

### Hardcoded Colors

| Component | Line | Value |
|-----------|------|-------|
| QuoteSection.tsx | 6 | `rgba(0,0,0,1)` in gradient |
| globals.css | 119-174 | Keyframe animations with hex values |

## Recommended Token Mapping

Based on the analysis, here's the recommended mapping from current tokens to DNA semantic tokens:

| Current | DNA Semantic | Notes |
|---------|--------------|-------|
| `--color-bg-primary` | `--color-surface-primary` | Rename only |
| `--color-bg-secondary` | `--color-surface-secondary` | Rename only |
| `--color-bg-tertiary` | `--color-surface-tertiary` | Rename only |
| `--color-text-primary` | `--color-content-primary` | Rename only |
| `--color-text-secondary` | `--color-content-inverted` | Rename + semantic change |
| `--color-text-alternate` | `--color-content-muted` | Rename only |
| `--color-border-primary` | `--color-edge-primary` | Rename only |
| `--color-border-secondary` | `--color-edge-muted` | Rename only |
| `bg-black` | `bg-surface-secondary` | Usage update |
| `bg-white` | `bg-surface-primary` | Usage update |
| `bg-green` (action) | `bg-action-primary` | Context-dependent |
| `bg-green` (status) | `bg-status-success` | Context-dependent |
| `bg-purple` | `bg-surface-tertiary` | Or new accent token |
| `text-black` | `text-content-primary` | Usage update |
| `text-white` | `text-content-inverted` | Usage update |
| `border-black` | `border-edge-primary` | Usage update |

## Gap Analysis

### Missing Required Tokens

- [ ] `--color-surface-primary` (has --color-bg-primary, needs rename)
- [ ] `--color-surface-secondary` (has --color-bg-secondary, needs rename)
- [ ] `--color-content-primary` (has --color-text-primary, needs rename)
- [ ] `--color-content-inverted` (has --color-text-secondary, needs rename)
- [ ] `--color-edge-primary` (has --color-border-primary, needs rename)

### Missing Recommended Tokens

- [ ] `--color-action-primary` (new - map from green)
- [ ] `--color-action-destructive` (new - map from accent-1)
- [ ] `--color-status-success` (has bg-success, needs rename)
- [ ] `--color-status-error` (has bg-error, needs rename)
- [ ] `--color-edge-focus` (new - map from blue)
- [ ] `--duration-fast` (new)
- [ ] `--duration-base` (new)
- [ ] `--duration-moderate` (new)
- [ ] `--duration-slow` (new)
- [ ] `--easing-default` (has --ease-btn, needs standardization)

### Components Needing Schemas

**Simple (2-3 per task):**
1. HeroSection
2. CTASection
3. ServicesSection
4. MissionSection
5. QuoteSection
6. BackstopSection
7. DashboardCard
8. DashboardListItem
9. ValidatorCard
10. StatsCard
11. StakingPositionCard

**Compound (1 per task):**
1. FAQSection (accordion items)
2. DashboardsSection (tab groups)
3. ValidatorGrid (grid layout)
4. ValidatorsSection (section + grid)

**Complex (1 per task):**
1. StakingForm (multi-step form)

### Components Needing Token Refactor

All components using brand tokens:
- CTASection - `text-white`
- DashboardCard - `bg-purple`, `text-black`, `border-black`
- DashboardListItem - `bg-purple`, `text-black`, `border-black`, `bg-white`
- DashboardsSection - `bg-white`, `text-black`, `border-black`
- ServicesSection - `bg-black`, `text-white`, `bg-purple`, `text-black`, `border-black`
- QuoteSection - `bg-black`, `text-white`
- ValidatorCard - (likely similar patterns)
- StakingForm - (likely similar patterns)

## Motion Analysis

### Current Motion Values

| Location | Property | Value | Tokenize? |
|----------|----------|-------|-----------|
| globals.css:88 | animation | 0.2s ease-out | Yes → duration-moderate |
| globals.css:101 | animation | 0.15s ease-out | Yes → duration-base |
| globals.css:116 | animation | 0.15s ease-out | Yes → duration-base |
| globals.css:188 | animation | 0.2s ease-out | Yes → duration-moderate |
| globals.css:245 | --ease-btn | cubic-bezier(0.25, 0.46, 0.45, 0.94) | Yes → easing-default |
| various | transition-all | hardcoded durations | Yes |

### Recommended Motion Tokens

```css
--duration-fast: 100ms;
--duration-base: 150ms;      /* replaces 0.15s */
--duration-moderate: 200ms;  /* replaces 0.2s */
--duration-slow: 300ms;
--easing-default: cubic-bezier(0, 0, 0.2, 1);  /* DNA standard ease-out */
```

## Conversion Complexity Estimate

| Phase | Items | Complexity |
|-------|-------|------------|
| Token Foundation | ~20 tokens to rename/add | Low |
| Component Schemas | 16 components | Medium |
| Token Refactor | ~12 components | Medium |
| Dark Mode | ~15 tokens to override | Low |

**Recommended approach:** Full conversion

**Rationale:** layer33 already has semantic tokens, just with non-standard naming. The conversion is primarily renaming (low risk) rather than creating new token mappings. Components use consistent patterns that can be batch-refactored.

## Next Steps

1. Run `02-sprint-generator.prompt.md` with this assessment
2. Review generated sprint plan for accuracy
3. Create feature branch: `git checkout -b dna-convert/layer33`
4. Execute tasks in order, validating after each
