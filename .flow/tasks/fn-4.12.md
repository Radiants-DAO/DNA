# fn-4.12 Review fn-3 scope: update, merge, or mark complete based on fn-4 findings

## Description

Review fn-3 (Theme Spec Research) in light of fn-4's completed research to determine its fate.

## Analysis

### fn-3 Original Scope
fn-3 was designed to research and finalize:
1. Token naming conventions (bg/fg/border vs surface/content/edge)
2. Token architecture tiers and DTCG format
3. Color mode patterns (Tailwind v4, Radix, Chakra)
4. Typography system approaches
5. Component library structure patterns
6. Synthesize into theme-spec.md

### Current State
- **theme-spec.md** (864 lines) already contains comprehensive decisions on ALL fn-3 topics
- Token naming: `surface-*`, `content-*`, `edge-*` documented with rationale
- Token tiers: 3-tier model (brand → semantic → component) specified
- Color modes: `.dark` class-based switching with system preference support
- Typography: `@apply` directive approach with complete examples
- Component structure: Flat `components/core/` pattern documented

### fn-4 Relationship
fn-4 (Design System Infrastructure) extended research into areas fn-3 never scoped:
- Tooling (Storybook, RepoPrompt)
- Extended tokens (icons, motion, a11y, sound, density, i18n)
- AI integration patterns
- Prompt library architecture

fn-3's core token research was foundational context that fn-4 built upon.

## Decision: **Mark fn-3 Complete (Superseded)**

### Rationale
1. **All fn-3 research questions have answers** - theme-spec.md documents decisions for every fn-3 task
2. **No remaining work** - fn-3.1 through fn-3.6 are answered by existing documentation
3. **fn-4 did not duplicate fn-3** - fn-4 extended into infrastructure, not core tokens
4. **theme-spec.md is the deliverable** - This is exactly what fn-3.6 would have produced

### What This Means
- fn-3 tasks (fn-3.1 through fn-3.6) should NOT be executed
- fn-3 epic status should be set to `done` with note "superseded by theme-spec.md"
- theme-spec.md serves as the synthesized output of fn-3's intended work

### Alternative Considered
- **Keep separate**: Execute fn-3 tasks anyway for formality
- **Rejected because**: Work is already done; executing would duplicate existing docs

## Acceptance
- [x] Reviewed fn-3 scope against current documentation
- [x] Compared fn-3 tasks to theme-spec.md content
- [x] Analyzed fn-4 overlap/extension
- [x] Made decision with documented rationale
- [x] Documented recommendation for fn-3 epic status

## Done summary
Reviewed fn-3 (Theme Spec Research) scope against fn-4 findings. Decision: **Mark fn-3 complete (superseded)**.

Key findings:
1. theme-spec.md already contains all fn-3 deliverables (token naming, architecture, color modes, typography, component structure)
2. fn-4 extended into infrastructure areas (tooling, extended tokens, AI) beyond fn-3's original scope
3. Executing fn-3 tasks would duplicate existing documentation

Recommendation: Set fn-3 epic status to `done` with note "superseded by theme-spec.md documentation".
## Evidence
- Commits:
- Tests:
- PRs: