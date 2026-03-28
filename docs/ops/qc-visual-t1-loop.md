# T1 Visual QA Loop

You run one iteration of visual QA on one component per cycle.

## Setup

- **Checklist**: `/Users/rivermassey/Desktop/dev/DNA/docs/ops/qc-visual-t1-checklist.md`
- **Known issues**: `/Users/rivermassey/Desktop/dev/DNA/docs/production-readiness-checklist.md` (T1 section)
- **Components dir**: `/Users/rivermassey/Desktop/dev/DNA/packages/radiants/components/core/`
- **App**: rad-os at `localhost:3000` — open the Design System tab in RadiantsStudioApp to view components

## Each Iteration

### 1. Read state

Read `docs/ops/qc-visual-t1-checklist.md`. Find the FIRST `[ ]` item. That is your target for this iteration.

If no `[ ]` items remain, say "T1 visual QA complete!" and stop.

### 2. Run /qc-visual on one component

Invoke `/qc-visual` scoped to the target component. Specifically:

1. **Navigate** to the component in the running app (RadiantsStudioApp → Design System tab, or the playground at localhost:3004 if available).
2. **Screenshot** the component in its default state.
3. **Judge** against these criteria (from the production readiness checklist + RDNA design rules):
   - Spacing: even gaps, visual rhythm
   - Typography: correct RDNA fonts and scale
   - Contrast: text legible in both light and dark modes
   - Alignment: consistent lanes, no jitter
   - Clipping: nothing cut off
   - Token usage: no hardcoded hex, correct semantic tokens
   - Pixel corners: no `border-*` or `overflow-hidden` on `pixel-rounded-*` elements
   - Dark mode: toggle to dark, screenshot again, verify token flipping
   - Motion: transitions ≤ 300ms, correct easing
4. **Cross-reference** the known issues for this component in `docs/production-readiness-checklist.md` (T1 section). Verify which known issues are still present and flag any NEW issues not in the checklist.
5. **Fix** auto-fixable issues (token replacements, small CSS corrections). For each fix: edit → re-screenshot → verify.
6. **Do NOT fix** issues that require design decisions, structural refactors, or new component variants. Flag these instead.

### 3. Update checklist

In `docs/ops/qc-visual-t1-checklist.md`, update the item:

- `[v]` — Clean pass, no issues found
- `[x]` — Issues found and auto-fixed. Append a one-line summary.
- `[!]` — Issues found that need manual work. Append specifics:

```
- [!] Button — 3 issues: pattern mode invisible text (needs design decision), active gradient on border (structural), dark mode flat hover uses wrong token (fixed). 2 NEW: focus ring clips pixel corners, disabled opacity inconsistent between flat/default.
```

### 4. Report

Print a one-line summary:
```
[qc-visual] Button: [!] 5 issues (1 fixed, 4 manual) | 23 components remaining
```

## Rules

- ONE component per iteration. Stay focused.
- Always screenshot BEFORE judging. Never code-only.
- Always test BOTH light and dark modes.
- Do not fix structural/design issues — only token swaps, small CSS, and mechanical fixes.
- If the dev server is not running, say so and stop. Do not attempt to start it.
- If browser MCP tools are unavailable, fall back to code-only analysis (read component source + CSS) but note the limitation in the checklist entry.
