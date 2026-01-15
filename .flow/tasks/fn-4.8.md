# fn-4.8 Research: i18n token patterns (RTL/LTR, text expansion, CJK fonts)

## Description
TBD

## Acceptance
- [ ] TBD

## Done summary
- Documented CSS logical properties for automatic RTL/LTR layout mirroring (margin-inline-start, padding-inline, inset-inline-end, etc.)
- Defined language family categories (Western, Tall, Dense/CJK) with typography token overrides per category
- Established text expansion accommodation strategy with 40% buffer for German/Finnish

- Why: RadFlow needs to support global audiences with proper bidirectional text, CJK typography, and locale-sensitive formatting
- Why: CSS logical properties enable single-codebase RTL support without CSS duplication

- Verification: Research document structure matches established pattern (motion-tokens.md, accessibility-tokens.md)
- Verification: All major i18n areas covered: RTL/LTR, expansion, CJK fonts, Arabic/Hebrew, Intl API
## Evidence
- Commits: c59e6127733b93888dfd2780bf1635ca68194660
- Tests: research document review
- PRs: