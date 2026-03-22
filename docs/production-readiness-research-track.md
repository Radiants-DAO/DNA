# Production Readiness Research Track

Derived from [production-readiness-checklist.md](./production-readiness-checklist.md).

Source of truth remains `docs/production-readiness-checklist.md`.
This file is a working view for items whose next step is an architecture, policy, or contract decision rather than immediate implementation.

---

## Design-System / Tooling Architecture

### T4 — Tooling & Infrastructure

#### ESLint

- Auto-generate `token-map.mjs` from `tokens.css` + component data
- Expand `prefer-rdna-components` element list without relying on handwritten maps
- `[explore]` CI automated test runs — worth adding?

### T5 — Skills -> Motion Pipeline

#### Phase 1: Skills Audit

- Audit all user-scoped skills for relevance, overlap, and quality
- Design new skills library structure

---

## Product / Scope Decisions

### T3 — App Content & Functionality

#### Brand Assets

- `[explore]` Hardcoded semantic hex values — auto-derive from tokens?
- `[explore]` AI Toolkit tab scope — final or placeholder?

---

## Notes

- These items are good candidates for the architecture research loop.
- The expected output here is a recommendation, contract shape, or policy decision.
- Once a decision is made, implementation work should move into either the execution or mixed track.
