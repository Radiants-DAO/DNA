---
type: "note"
---
# Decks/Pitches Orchestrator

You (Opus) coordinate two Haiku worker agents and perform reviews yourself inline.

## Setup

* **Checklist**: `/Users/rivermassey/Desktop/dev/DNA/docs/ops/paper/paper-decks-pitches-checklist.md`

* **Learnings**: `/Users/rivermassey/Desktop/dev/DNA/docs/ops/paper/prompts/LEARNINGS.md`

* **Figma file key**: `MICrnPV32mAQA2kxjGsooA`

* **Paper page**: "Decks/Pitches"

## Each Iteration

### 1. Read state

Read the checklist and LEARNINGS.md. Assess:

* `[ ]` items remaining (top and bottom)

* `[x]` items needing review

* Convergence status

If all items are `[v]`, say "Decks complete!" and stop.

### 2. Spawn Haiku workers (background agents)

Spawn workers as background agents. Both use Haiku.

**Worker A (top→down)** — if `[ ]` items remain from top:

```text
Read docs/ops/paper/prompts/LEARNINGS.md, then docs/ops/paper/paper-decks-pitches-checklist.md.
Find the FIRST [ ] item. Do ONE item only.

Get Figma design: get_design_context with fileKey "MICrnPV32mAQA2kxjGsooA" and nodeId from checklist.
Get screenshot for reference.

Resolve ALL values to literal CSS:
- var(--color-sun-yellow) → #FCE184
- var(--color-cream) → #FEF8E2
- var(--color-ink) → #0F0E0C
- var(--color-page) → #FEF8E2 or #0F0E0C
- var(--color-main) → #0F0E0C or #FEF8E2
- var(--color-flip) → #FEF8E2
- var(--color-accent) → #FCE184
- Fonts: Joystix Monospace → "Joystix", Mondwest → "Mondwest", PixelCode → "Pixel Code"
- Keep Figma image URLs as-is

All slides are 1920x1080. Create artboard at that size.
Write HTML incrementally (one visual group per write_html call).

CRITICAL PAPER RULES:
- ONLY inline styles — NO var(), NO Tailwind, NO CSS variables
- display: flex ONLY — no grid, no margins, no tables
- Wrap SVG <img> in sized container divs

Screenshot and compare to Figma. Mark [ ] → [x].
Log gotchas to LEARNINGS.md. Call finish_working_on_nodes.
```

**Worker B (bottom→up)** — if `[ ]` items remain from bottom:

```text
Same rules as Worker A but find the LAST [ ] item.
Read LEARNINGS.md, read checklist, find LAST [ ] item, do ONE item.
Get Figma design, resolve to literal CSS, create artboard, write HTML incrementally.
Screenshot, verify, mark [x]. Log gotchas. finish_working_on_nodes.
```

### 3. Review pass (inline, Opus orchestrator)

While workers run in background, review any `[x]` items yourself (do NOT spawn a reviewer agent).

For each `[x]` item:

1. Get Figma original screenshot (`get_screenshot` with fileKey and nodeId from checklist)
2. Get Paper artboard screenshot (`get_basic_info` → find artboard → `get_screenshot`)
3. Compare layout, colors, text, images, dimensions
4. Verdict:
   - **PASS** → mark `[v]`
   - **FAIL** → mark `[ ]` with notes
   - **Minor fixes** → fix in Paper (`update_styles`/`set_text_content`/`write_html`), then mark `[v]`
5. Call `finish_working_on_nodes` after any Paper edits
6. Update checklist, log systemic issues to LEARNINGS.md

Review as many `[x]` items as exist — don't stop at one.

### 4. Report

Summarize: completed, reviewed, remaining, learnings.

⠀