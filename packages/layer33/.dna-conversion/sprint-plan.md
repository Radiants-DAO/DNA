# DNA Conversion Sprint Plan: layer33

**Generated:** 2026-01-21
**Assessment:** packages/layer33/.dna-conversion/assessment.md

## Overview

| Sprint | Name | Tasks | Status |
|--------|------|-------|--------|
| 1 | Token Foundation | 1 | Pending |
| 2 | Simple Component Schemas | 4 | Pending |
| 3 | Compound/Complex Schemas | 3 | Pending |
| 4 | Token Refactor | 2 | Pending |
| 5 | Configuration & Dark Mode | 2 | Pending |

**Total Tasks:** 12

## Sprint 1: Token Foundation

| Task | Description | Dependencies |
|------|-------------|--------------|
| 01-token-foundation | Rename non-standard semantic tokens to DNA format, add missing tokens | None |

## Sprint 2: Simple Component Schemas

| Task | Description | Dependencies |
|------|-------------|--------------|
| 02-hero-cta-mission-schema | HeroSection, CTASection, MissionSection | 01 |
| 03-quote-backstop-schema | QuoteSection, BackstopSection | 01 |
| 04-dashboard-cards-schema | DashboardCard, DashboardListItem | 01 |
| 05-validator-stats-schema | ValidatorCard, StatsCard, StakingPositionCard | 01 |

## Sprint 3: Compound/Complex Component Schemas

| Task | Description | Dependencies |
|------|-------------|--------------|
| 06-faq-section-schema | FAQSection with accordion pattern | 01 |
| 07-dashboards-validators-schema | DashboardsSection, ValidatorsSection, ValidatorGrid | 01 |
| 08-staking-form-schema | StakingForm complex component | 01 |

## Sprint 4: Token Refactor

| Task | Description | Dependencies |
|------|-------------|--------------|
| 09-refactor-surface-content | Replace bg-*, text-* brand tokens | 01 |
| 10-refactor-edge-action | Replace border-*, action brand tokens | 01 |

## Sprint 5: Configuration & Dark Mode

| Task | Description | Dependencies |
|------|-------------|--------------|
| 11-dark-mode | Create dark.css with token overrides | 01, 09, 10 |
| 12-final-validation | Run all validation checks | All above |

## Dependency Graph

```
01-token-foundation
├── 02-hero-cta-mission-schema
├── 03-quote-backstop-schema
├── 04-dashboard-cards-schema
├── 05-validator-stats-schema
├── 06-faq-section-schema
├── 07-dashboards-validators-schema
├── 08-staking-form-schema
├── 09-refactor-surface-content
│   └── 11-dark-mode
├── 10-refactor-edge-action
│   └── 11-dark-mode
│       └── 12-final-validation
```

## Execution Notes

- Sprints 2-3 (schemas) can run in parallel with Sprint 4 (refactor)
- Sprint 5 requires Sprint 1 and Sprint 4 complete
- Each task should be committed separately for easy rollback
