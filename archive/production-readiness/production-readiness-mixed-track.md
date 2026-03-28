# Production Readiness Mixed Track

Derived from [production-readiness-checklist.md](./production-readiness-checklist.md).
Updated 2026-03-22 by audit swarm.

Source of truth remains `docs/production-readiness-checklist.md`.
This file is a working view for items that need a short design or architecture decision first, then an implementation pass.

Typical flow:
1. Decide the contract, primitive, ownership, or product direction.
2. Move the implementation-ready portion into an execution loop.

---

## Component Architecture / Primitive Decisions

### T1 — Component Visual Quality

#### T1a — Button

- Add pattern lint rules; verify pattern colors switch correctly in dark/light mode `[→ part of design-contract migration, moved to research]`

#### T1b — Tabs

- Execute existing tabs refactor plan
- Fix known tabs bugs after validating that plan is still the right basis
- ⚡ Worktree needs recreation — old `/private/tmp/claude/tabs-refactor` was pruned

#### T1c — Toggle / ToggleGroup

- ToggleGroup should cascade from Toggle or Button (switchable), not only flat style
- `[explore]` lightweight fix, needs investigation

#### T1d — Form Controls

- ⚡ Checkbox + Radio: "full visual refactor — match macOS System 7 styling" (moved from execution — needs reference design and pixel art specs)

#### T1e — Feedback Components

- Tooltip: add pixelated borders `[explore: feasibility]`
- ⚡ Toast: align with Alert (moved from execution — "align" pattern undefined, needs shared primitive decision)

#### T1f — Other Components

- Pattern: fix squished display in UI Toolkit tab
- Pattern: fix ToggleGroup showing too many options
- Pattern: same fix for bg color, with transparency support
- Pattern: dark/light mode adherence should inherit from border semantic variables by default
- Pattern: global rule so pattern colors match parent border color
- DarkModeToggle: raw `<button>` in Taskbar — intentional for icon-on-thumb variant? `[explore]`

#### T1g — Dropdown Unification

- All dropdowns should share the same hover/interaction patterns `[blocked: needs canonical hover pattern decision — see research track]`
- `[explore]` create shared Dropdown overlay primitive they all consume

#### T1h — Cross-Cutting

- Audit string props vs toggle groups / booleans and standardize
- HelpPanel replacement: SidePanel pattern and priority rules

#### T1i — Missing Components

- AppWindow as RDNA component
- AppWindow layout presets
- StartMenu as RDNA component
- System 7-inspired OS patterns `[explore]`
- Widget component defaults

---

## Mobile / UX Decisions

### T2 — Mobile Rebuild

- ⚡ Design + implement mobile app drawer / launcher (moved from execution — no UX design exists, needs pattern decision)
- `[explore]` Reference patterns for app drawer and Apple System 7 mobile behavior

---

## Tooling / Sequencing Decisions

### T4 — Tooling & Infrastructure

#### token-map.mjs Auto-Generation

- ⚡ Architecture A (Meta-First Generation) already decided and documented
- Ready for phased execution (5 phases, ~8.5 days total)
- Phase 1: generate eslint-contract.json from meta
- Phase 5: deprecate hand-maintained token-map.mjs
- Refs: `docs/solutions/tooling/design-contract-architecture-decision.md`, `archive/research/design-guard/recommendation.md`

#### Component Testing

- Decide testing scope and ordering after T1 refactoring completes

### T5 — Skills -> Motion Pipeline

#### Phase 1: Skills Audit

- Move skills from user settings -> skills library -> repo
- Create project-specific skills for app scaffolding, visual QA, deployment, and code review

#### Phase 2: Motion Refactor

- Create motion-specific skills and lint rules before refactor execution

### T6 — Documentation & Cleanup

- Docs audit: review brainstorms + plans before deleting
- `[explore]` `prompts/dna-conversion/`: add "unmaintained" banner or archive
- Session files (2,631 / 10MB): mine for potential RDNA skills, then purge

---

## Closed Items (resolved by audit swarm)

These were in the mixed track but are no longer needed:

- ~~SunBackground.tsx `[explore: compare both first]`~~ — already deleted
- ~~focusableWhenDisabled investigation~~ — already documented in meta, tested
- ~~Separator / Divider consolidation~~ — Divider never existed, only Separator
- ~~HelpPanel/MockStatesPopover removal~~ — already deleted from core/
- ~~Field / Fieldset: deprecate + merge into Input and InputSet~~ — Field and Fieldset never existed as components; InputSet already exists and is exported

---

## Notes

- These items should not block the whole checklist, but they do need a small decision-making pass before implementation.
- Once the decision is written down, move the implementation portion into the execution track.
