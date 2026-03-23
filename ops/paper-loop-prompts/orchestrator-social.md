# Social Graphics Orchestrator

You coordinate three parallel agents to recreate Figma social graphics in Paper.

## Setup

- **Checklist**: `/Users/rivermassey/Desktop/dev/DNA/ops/paper-social-graphics-checklist.md`
- **Learnings**: `/Users/rivermassey/Desktop/dev/DNA/ops/paper-loop-prompts/LEARNINGS.md`
- **Figma file key**: `MICrnPV32mAQA2kxjGsooA`
- **Paper page**: "Social Graphics"

## Each Iteration

### 1. Read state

Read the checklist and LEARNINGS.md. Assess:
- How many `[ ]` items remain from the top?
- How many `[ ]` items remain from the bottom?
- How many `[x]` items need review?
- Have workers converged?

If all items are `[v]`, say "Social graphics complete!" and stop.

### 2. Spawn agents in parallel

**Worker A (top→down)** — if `[ ]` items remain from top:
```
Read ops/paper-loop-prompts/LEARNINGS.md, then ops/paper-social-graphics-checklist.md.
Find the FIRST [ ] item. Do ONE item only.

Get the Figma design: call get_design_context with fileKey "MICrnPV32mAQA2kxjGsooA" and the nodeId from the checklist.
Also get a screenshot of the Figma node for reference.

Resolve ALL values to literal CSS before writing to Paper:
- Replace var(--color-sun-yellow) → #FCE184
- Replace var(--color-cream) → #FEF8E2
- Replace var(--color-ink) → #0F0E0C
- Replace var(--color-page) → #FEF8E2 (light) or #0F0E0C (dark)
- Replace var(--color-main) → #0F0E0C (light) or #FEF8E2 (dark)
- Replace var(--color-flip) → #FEF8E2
- Replace var(--color-mute) → rgba(15,14,12,0.6)
- Replace var(--color-line) → #0F0E0C
- Replace var(--color-accent) → #FCE184
- Replace var(--color-sky-blue) → #95BAD2
- Replace var(--color-sunset-fuzz) → #FCC383
- Replace var(--color-sun-red) → #FF7F7F
- Replace var(--color-mint) → #CEF5CA
- Figma fonts: Joystix Monospace → "Joystix", Mondwest → "Mondwest", PixelCode → "Pixel Code"
- Keep Figma image asset URLs as-is (localhost URLs work in Paper)

Create artboard matching Figma frame dimensions. Write HTML incrementally (one visual group per write_html call).

CRITICAL PAPER RULES:
- ONLY inline styles — NO var(), NO Tailwind, NO CSS variables
- display: flex ONLY — no grid, no margins, no tables
- Wrap SVG <img> in sized container divs

Screenshot Paper artboard and compare to Figma screenshot. Fix discrepancies.
Mark [ ] → [x]. Log gotchas to LEARNINGS.md. Call finish_working_on_nodes.
```

**Worker B (bottom→up)** — if `[ ]` items remain from bottom:
```
Same as Worker A but find the LAST [ ] item and work upward.

Read ops/paper-loop-prompts/LEARNINGS.md, then ops/paper-social-graphics-checklist.md.
Find the LAST [ ] item. Do ONE item only.

Get Figma design context (fileKey: MICrnPV32mAQA2kxjGsooA, nodeId from checklist).
Resolve all values to literal CSS (same color/font tables as Worker A).
Create artboard, write HTML incrementally, screenshot to verify.

CRITICAL PAPER RULES:
- ONLY inline styles — NO var(), NO Tailwind
- display: flex ONLY
- All colors as hex, all fonts as literal names

Mark [ ] → [x]. Log gotchas. Call finish_working_on_nodes.
```

**Reviewer** — if any `[x]` items exist:
```
Read ops/paper-loop-prompts/LEARNINGS.md, then ops/paper-social-graphics-checklist.md.
Find an [x] item. Review ONE item.

Get the Figma original: call get_screenshot with fileKey "MICrnPV32mAQA2kxjGsooA" and the nodeId.
Get the Paper recreation: call get_basic_info, find matching artboard, screenshot it.

Compare:
- Layout structure matches?
- Colors match Figma original?
- Text content present and correct?
- Images/assets positioned correctly?
- Artboard dimensions correct?

PASS → mark [v]. FAIL → revert to [ ] with fix notes.
Minor fixes: use update_styles or set_text_content, then mark [v].
Log systemic issues to LEARNINGS.md. Call finish_working_on_nodes.
```

### 3. Report

Summarize: items completed, reviewed, remaining, new learnings.
