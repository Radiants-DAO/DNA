# Brand Manual Orchestrator

You coordinate three parallel agents to build a brand manual in Paper from the Radiants codebase.

## Setup

- **Checklist**: `/Users/rivermassey/Desktop/dev/DNA/docs/ops/paper/paper-brand-manual-checklist.md`
- **Brand Brief**: `/Users/rivermassey/Desktop/dev/DNA/docs/ops/paper/paper-brand-brief.md`
- **Learnings**: `/Users/rivermassey/Desktop/dev/DNA/docs/ops/paper/prompts/LEARNINGS.md`
- **Pattern Data**: `/Users/rivermassey/Desktop/dev/DNA/docs/ops/paper/prompts/pattern-data-uris.md`
- **Paper page**: "Brand Assets/Icons/etc"

## Each Iteration

### 1. Read state

Read the checklist and LEARNINGS.md. Assess:
- How many `[ ]` items remain from the top? (sections 1-5)
- How many `[ ]` items remain from the bottom? (sections 6-9)
- How many `[x]` items need review?
- Have workers converged? (no `[ ]` items left)

If all items are `[v]` (verified), say "Brand manual complete!" and stop.

### 2. Spawn agents in parallel

Launch up to 3 agents simultaneously using the Agent tool:

**Worker A (top→down)** — if unchecked items remain from sections 1-5:
```
Read docs/ops/paper/prompts/LEARNINGS.md for any rules, then read docs/ops/paper/paper-brand-manual-checklist.md.
Find the FIRST [ ] item. Do ONE item only.

Read docs/ops/paper/paper-brand-brief.md for resolved values. For patterns, read docs/ops/paper/prompts/pattern-data-uris.md.

Create an artboard in Paper, write HTML incrementally (one visual group per write_html call).

CRITICAL PAPER RULES:
- ONLY inline styles (style="...") — NO var(), NO Tailwind, NO CSS variables
- All colors as literal hex: #FCE184, #FEF8E2, #0F0E0C, etc.
- Fonts: "Joystix" (headings/UI, 400), "Mondwest" (body, 400/700), "Pixel Code" (mono, 400)
- display: flex ONLY — no grid, no margins, no tables
- Logos: http://localhost:29979/media/Users/rivermassey/Desktop/dev/DNA/apps/rad-os/public/assets/logos/{name}.svg
- Icons: http://localhost:29979/media/Users/rivermassey/Desktop/dev/DNA/packages/radiants/assets/icons/{name}.svg
- Wrap SVG <img> tags in a sized container div for consistent dimensions
- Type scale: xs=10px, sm=12px, base=16px, lg=20px, xl=24px, 2xl=28px, 3xl=32px

Design style: Swiss editorial, generous whitespace, strong Joystix headlines.
- Light artboards: #FEF8E2 bg, #0F0E0C text, #FCE184 accents
- Dark artboards: #0F0E0C bg, #FEF8E2 text, #FCE184 accents
- Labels: Joystix uppercase 10px
- Values: Pixel Code 12px

Screenshot to verify after every 2-3 write_html calls. Mark [ ] → [x] when done.
Log any gotchas to docs/ops/paper/prompts/LEARNINGS.md.
Call finish_working_on_nodes when done.
```

**Worker B (bottom→up)** — if unchecked items remain from sections 6-9:
```
Read docs/ops/paper/prompts/LEARNINGS.md for any rules, then read docs/ops/paper/paper-brand-manual-checklist.md.
Find the LAST [ ] item. Do ONE item only.

Read docs/ops/paper/paper-brand-brief.md for resolved values. For patterns, read docs/ops/paper/prompts/pattern-data-uris.md.
For pattern hex data, also read packages/radiants/patterns/registry.ts.

Create an artboard in Paper, write HTML incrementally.

CRITICAL PAPER RULES:
- ONLY inline styles — NO var(), NO Tailwind, NO CSS variables
- All colors as literal hex: #FCE184, #FEF8E2, #0F0E0C
- Fonts: "Joystix" (400), "Mondwest" (400/700), "Pixel Code" (400)
- display: flex ONLY — no grid, no margins, no tables
- Icons: http://localhost:29979/media/Users/rivermassey/Desktop/dev/DNA/packages/radiants/assets/icons/{name}.svg
- Wrap SVG <img> in sized container divs
- Type scale: xs=10px, sm=12px, base=16px, lg=20px, xl=24px, 2xl=28px, 3xl=32px

For shadows: Sun Mode uses pixel offsets (e.g., box-shadow: 2px 2px 0 0 #0F0E0C), Moon Mode uses glows (e.g., box-shadow: 0 0 8px rgba(252,225,132,0.6)).

Screenshot to verify. Mark [ ] → [x]. Log gotchas. Call finish_working_on_nodes.
```

**Reviewer** — if any `[x]` items exist:
```
Read docs/ops/paper/prompts/LEARNINGS.md, then read docs/ops/paper/paper-brand-manual-checklist.md.
Find items marked [x] (done but unverified). Review ONE item.

Call get_basic_info to list artboards. Find the matching artboard. Screenshot it.

Check against docs/ops/paper/paper-brand-brief.md:
- Colors: exact hex match?
- Fonts: correct family per role?
- Labels: accurate names, hex values, CSS var names?
- Layout: aligned, spaced well, no clipping?
- Completeness: all sub-items present?

PASS → mark [v] with one-line note.
FAIL → revert to [ ] with specific fix notes (worker will redo).
Minor fixes (wrong color, typo): fix with update_styles or set_text_content, then mark [v].

Log systemic issues to docs/ops/paper/prompts/LEARNINGS.md.
Call finish_working_on_nodes.
```

### 3. Report

After agents complete, summarize:
- Items completed this iteration
- Items reviewed this iteration
- Remaining count
- Any new learnings logged
