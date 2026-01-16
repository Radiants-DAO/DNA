# fn-8: Comprehensive Spec-to-Implementation Review

## Overview

Full audit of all implemented features against specifications in `/docs/features/`. Produces actionable gap report and prioritized fix list.

**Goal:** Complete spec-to-implementation traceability with P0-P3 prioritized findings.

**Scope:** Code review + smoke testing (not full QA). Focus on:
- Feature presence (implemented vs missing)
- Behavior alignment (matches spec vs divergent)
- Quality issues (bugs, edge cases, error handling)

**Out of Scope:**
- 09-ai-integration.md (Future, no implementation)
- fn-7 open tasks (tracked separately, not "gaps")

**Time Estimate:** 25-35 hours total (3-4 full work days)

---

## Quick Commands

```bash
# Pre-flight check
cd /Users/rivermassey/Desktop/dev/radflow-tauri
pnpm install
pnpm --filter @radflow/bridge build
pnpm --filter @radflow/theme-rad-os build
pnpm tauri dev

# Once running, verify:
# 1. Project picker opens
# 2. Can select theme-rad-os project
# 3. Press V → Component ID Mode activates
# 4. Open Variables panel → tokens load
# 5. No console errors

# List current epics/tasks
.flow/bin/flowctl list
```

---

## Approach

### Methodology
For each spec (12 total, excluding 09-ai-integration):
1. **Re-read spec** (not from memory)
2. **Trace implementation** via file search
3. **Smoke test** key behaviors (see checklist below)
4. **Document findings** using CCER format

### CCER Format Example

**Condition**: Component ID Mode does not show file:line in tooltip on hover.

**Criteria**: Spec 06-tools-and-modes.md states: "Hover State: Pill becomes fully opaque, Element gets subtle highlight outline"

**Effect**: Users cannot see file location without clicking, reducing efficiency.

**Recommendation**: Add file:line to pill on hover. Priority: P1

### Priority Framework
- **P0 (Critical):** Blocks core workflow, data loss risk (~2-3 hours to fix)
- **P1 (High):** Major feature missing, affects core value (~4-8 hours)
- **P2 (Medium):** Feature incomplete, workaround exists (~2-4 hours)
- **P3 (Low):** Polish, minor deviation (~1-2 hours)

### Gap Classification
- **Missing:** Not implemented at all
- **Incomplete:** Partially done, missing edge cases
- **Divergent (Unintentional):** Implementation differs, no clear reason
- **Intentional Deviation:** Implementation differs but documented/justified
- **Stale Spec:** Implementation correct, spec needs update

### Testing Depth
- **Smoke Test:** Happy path only. Does the feature work in the basic case?
- **NOT Testing:** Edge cases, error handling, performance, accessibility

---

## Smoke Test Checklists

### Component ID Mode (fn-8.3)
- [ ] Enter mode with V key
- [ ] Hover shows component pill
- [ ] Click copies to clipboard
- [ ] Shift+click multi-select works
- [ ] Layers panel highlights on hover

### Text Edit Mode (fn-8.4)
- [ ] Enter mode with T key
- [ ] Double-click text element to edit
- [ ] Changes accumulate in clipboard
- [ ] Exit mode with Escape

### Property Panels (fn-8.5)
- [ ] Colors panel shows token picker
- [ ] Typography panel shows font options
- [ ] Spacing panel shows box model
- [ ] Layout panel shows flex/grid controls

### Variables Editor (fn-8.7)
- [ ] Tokens load from theme
- [ ] Edit value inline
- [ ] Changes show pending state
- [ ] Save commits changes

### Typography Editor (fn-8.8)
- [ ] Styleguide renders HTML elements
- [ ] Click element shows properties
- [ ] Font dropdown populated
- [ ] Changes write to file

---

## Task Dependencies

```
fn-8.0 (Pre-flight) ──┬──> fn-8.1 (Tauri Arch)
                      └──> fn-8.2 (Bridge)

fn-8.1 + fn-8.2 ──────┬──> fn-8.3 (Component ID)
                      ├──> fn-8.4 (Text Edit)
                      └──> fn-8.5 (Property Panels)

fn-8.11 (Theme) ──────┬──> fn-8.7 (Variables)
                      └──> fn-8.8 (Typography)

ALL reviews (fn-8.1-8.13) ──> fn-8.14 (Philosophy)
fn-8.14 ──> fn-8.15 (Master Report)
fn-8.15 ──> fn-8.16 (Prioritization)
fn-8.16 ──> fn-8.17 (Follow-up Epics)
fn-8.15 ──> fn-8.18 (Verification)
```

---

## Tasks with Time Estimates

### Phase 0: Pre-flight (fn-8.0)
- **fn-8.0** Pre-flight Check (30 min)

### Phase 1: Infrastructure (fn-8.1-8.2, 4-5 hours)
- **fn-8.1** Review 10-tauri-architecture.md (2-3 hours)
- **fn-8.2** Review 12-target-project-integration.md (2 hours)

### Phase 2: Tools & Modes (fn-8.3-8.6, 8-10 hours)
- **fn-8.3** Review Component ID Mode (2-3 hours)
- **fn-8.4** Review Text Edit Mode (2 hours)
- **fn-8.5** Review Property Panels (2-3 hours)
- **fn-8.6** Review Preview Mode (1.5 hours)

### Phase 3: Editor Features (fn-8.7-8.10, 8-10 hours)
- **fn-8.7** Review Variables Editor (2-3 hours)
- **fn-8.8** Review Typography Editor (2 hours)
- **fn-8.9** Review Component Browser (2 hours)
- **fn-8.10** Review Assets Manager (2 hours)

### Phase 4: Theme & Canvas (fn-8.11-8.12, 5-6 hours)
- **fn-8.11** Review Theme System (3-4 hours)
- **fn-8.12** Review Canvas Editor (2 hours)

### Phase 5: Navigation (fn-8.13, 2 hours)
- **fn-8.13** Review Search & Navigation (2 hours)

### Phase 6: Synthesis (fn-8.14-8.18, 9-11 hours)
- **fn-8.14** Philosophy Alignment Check (2 hours)
- **fn-8.15** Compile Master Report (3-4 hours)
- **fn-8.16** Prioritize Fixes (1 hour)
- **fn-8.17** Draft Follow-up Epics (2 hours)
- **fn-8.18** Review Verification (1 hour)

---

## Master Report Structure

Output: `/docs/reviews/spec-review-master.md`

```markdown
# Spec Review Master Report

## Executive Summary
- Total features reviewed: X/12
- Total gaps found: X (P0: X, P1: X, P2: X, P3: X)
- Top 5 critical gaps

## By Feature
### 01-variables-editor.md
- Completion: X%
- Gaps: [list with priorities]
- Smoke test: PASS/FAIL

## By Priority
### P0 (Critical)
[All P0 gaps]

### P1 (High)
[All P1 gaps]

## Recommendations
1. Immediate fixes (P0)
2. Next sprint (P1)
3. Backlog (P2-P3)

## Follow-up Epics
[Links to remediation epics]
```

---

## Acceptance Criteria

- [ ] Pre-flight check passes
- [ ] 12 feature specs reviewed (excluding 09-ai-integration)
- [ ] Each review has completion percentage
- [ ] All gaps documented with CCER format
- [ ] Smoke tests run for each feature
- [ ] Master report at `/docs/reviews/spec-review-master.md`
- [ ] Prioritized fix list with P0-P3 classification
- [ ] Follow-up epic drafts for remediation work
- [ ] Review verification spot-check completed

---

## References

- Feature Specs: `/docs/features/`
- Implemented Commands: `/src-tauri/src/lib.rs`
- Bridge Package: `/packages/bridge/src/`
- Theme Package: `/packages/theme-rad-os/`
- Existing fn-7 Tasks: 19 open (tracked separately)
