# Production Readiness Research Track

Derived from [production-readiness-checklist.md](./production-readiness-checklist.md).
Updated 2026-03-22 by audit swarm.

Source of truth remains `docs/production-readiness-checklist.md`.
This file is a working view for items whose next step is an architecture, policy, or contract decision rather than immediate implementation.

---

## Design-System / Tooling Architecture

### T4 — Tooling & Infrastructure

#### ESLint

- Expand `prefer-rdna-components` element list without relying on handwritten maps `[needs decision: which elements to enforce in v1]`
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

### Web3 Scope

- `[confirm]` Is Web3/wallet in v1? If no → delete walletSlice, Web3Shell, Web3ActionBar, all NFT mock data (~500 lines). If yes → wire up the wallet connect flow.

---

## Open Research Questions (from audit swarm)

### 1. Canonical Dropdown Hover Pattern
DropdownMenu uses `hover:bg-inv hover:text-flip`, Menubar uses `hover:bg-hover`, Select uses `hover:bg-accent hover:text-accent-inv`. Which is canonical? Decision unlocks T1g dropdown unification and shared overlay primitive.

### 2. Toast ↔ Alert Alignment Pattern
Do they share CVA variants? Same color bands? Same icon treatment? Toast is ephemeral, Alert is inline. Should they share a `FeedbackPrimitive` or just visual tokens?

### 3. Exit Animation Easing
DNA spec says "ease-out only" but exit animations commonly use ease-in. Should the spec clarify that ease-in is acceptable for exits?

---

## Notes

- These items are good candidates for the architecture research loop.
- The expected output here is a recommendation, contract shape, or policy decision.
- Once a decision is made, implementation work should move into either the execution or mixed track.
- ⚡ token-map.mjs auto-generation moved to mixed track — Architecture A already decided.
- ⚡ T1a Pattern lint rules moved here — part of design-contract migration, not button work.
