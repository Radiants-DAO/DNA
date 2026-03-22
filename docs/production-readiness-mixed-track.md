# Production Readiness Mixed Track

Derived from [production-readiness-checklist.md](./production-readiness-checklist.md).

Source of truth remains `docs/production-readiness-checklist.md`.
This file is a working view for items that need a short design or architecture decision first, then an implementation pass.

Typical flow:
1. Decide the contract, primitive, ownership, or product direction.
2. Move the implementation-ready portion into an execution loop.

---

## Cleanup Items That Need One Decision First

### T0 — Fix Now

- Delete dead `components/Rad_os/SunBackground.tsx` `[explore: compare both first]`

---

## Component Architecture / Primitive Decisions

### T1 — Component Visual Quality

#### T1a — Button

- Add pattern lint rules; verify pattern colors switch correctly in dark/light mode
- Investigate/remove `focusableWhenDisabled` if no clear purpose

#### T1b — Tabs

- Execute existing tabs refactor plan
- Fix known tabs bugs after validating that plan/worktree is still the right basis

#### T1c — Toggle / ToggleGroup

- ToggleGroup should cascade from Toggle or Button (switchable), not only flat style
- `[explore]` lightweight fix, needs investigation

#### T1d — Form Controls

- Field / Fieldset: deprecate Field + Fieldset and merge into Input and InputSet

#### T1e — Feedback Components

- Tooltip: add pixelated borders `[explore: feasibility]`

#### T1f — Other Components

- Pattern: fix squished display in UI Toolkit tab
- Pattern: fix ToggleGroup showing too many options
- Pattern: same fix for bg color, with transparency support
- Pattern: dark/light mode adherence should inherit from border semantic variables by default
- Pattern: global rule so pattern colors match parent border color
- Separator / Divider: consolidate redundant components `[explore: which to keep]`

#### T1g — Dropdown Unification

- All dropdowns should share the same hover/interaction patterns
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

- `[explore]` Reference patterns for app drawer and Apple System 7 mobile behavior

---

## App Scope / Handoff Decisions

### T3 — App Content & Functionality

#### RadiantsStudioApp

- `[explore]` Full scope TBD

#### Content

- LinksApp: implement or remove from catalog

---

## Tooling / Sequencing Decisions

### T4 — Tooling & Infrastructure

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

---

## Notes

- These items should not block the whole checklist, but they do need a small decision-making pass before implementation.
- Once the decision is written down, move the implementation portion into the execution track.
