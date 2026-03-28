---
type: "note"
---
# Paper Loop Agent Prompts

## Architecture

```text
Paper File: "Radiants"
├── Page: Brand Assets/Icons/etc    ← Brand manual (from codebase)
├── Page: Social Graphics            ← From Figma node 4369:16269
└── Page: Decks/Pitches              ← From Figma node 4224:290346
```

## Agents Per Workstream

Each workstream runs 3 looped agents:

| Role     | Direction           | Prompt File                                              |
| -------- | ------------------- | -------------------------------------------------------- |
| Worker A | Top → Down          | `brand-worker-topdown.md` or `figma-worker-topdown.md`   |
| Worker B | Bottom → Up         | `brand-worker-bottomup.md` or `figma-worker-bottomup.md` |
| Reviewer | Reviews `[x]` items | `brand-reviewer.md` or `figma-reviewer.md`               |

Workers converge in the middle. When a worker hits items already completed by the other worker, it stops.

## Self-Improvement System

All agents read and write to `LEARNINGS.md` — a shared knowledge base that compounds across iterations:

```
Iteration 1: Worker A hits a Paper CSS gotcha → logs to LEARNINGS.md
Iteration 2: Worker B reads LEARNINGS.md → avoids the same gotcha
Iteration 3: Reviewer notices a pattern → logs a rule → both workers benefit
```

**How it works:**
- Every agent reads `LEARNINGS.md` at the START of each iteration
- When an agent hits something unexpected, it appends a structured entry
- Entries include: category, problem, solution, and a one-line **Rule**
- The Rule is the key — it's actionable without reading the full context

**Categories:** `PAPER-MCP`, `FIGMA-MCP`, `CSS`, `FONTS`, `IMAGES`, `PATTERNS`, `LAYOUT`, `WORKFLOW`

This means loop iteration N+1 is always smarter than iteration N.

## Checklists

| Workstream      | Checklist                                | Items |
| --------------- | ---------------------------------------- | ----- |
| Brand Manual    | `docs/ops/paper/paper-brand-manual-checklist.md`    | 42    |
| Social Graphics | `docs/ops/paper/paper-social-graphics-checklist.md` | 89    |
| Decks/Pitches   | `docs/ops/paper/paper-decks-pitches-checklist.md`   | 33    |

## Status Markers

| Marker | Meaning                         |
| ------ | ------------------------------- |
| `[ ]`  | Not started / needs rework      |
| `[x]`  | Done by worker, awaiting review |
| `[v]`  | Verified by reviewer            |

## Launch Commands

Each workstream runs ONE `/loop` that spawns 3 parallel agents per iteration (worker A top→down, worker B bottom→up, reviewer).

### 1. Brand Manual (Paper on "Brand Assets/Icons/etc" page)

```
/loop 1m Read docs/ops/paper/prompts/orchestrator-brand.md and execute one iteration
```

### 2. Social Graphics (Paper on "Social Graphics" page)

```
/loop 1m Read docs/ops/paper/prompts/orchestrator-social.md and execute one iteration
```

### 3. Decks/Pitches (Paper on "Decks/Pitches" page)

```
/loop 1m Read docs/ops/paper/prompts/orchestrator-decks.md and execute one iteration
```

Run all 3 simultaneously if you want all workstreams active, or one at a time for focused work.

## Key References

* **Brand Brief**: `docs/ops/paper/paper-brand-brief.md` — all resolved color/font/token values

* **Pattern Registry**: `packages/radiants/patterns/registry.ts` — hex bitmap data

* **Icons**: `packages/radiants/assets/icons/*.svg` (153 files)

* **Logos**: `packages/radiants/assets/*.svg` (9 logo SVGs)

* **Figma Import Guide**: Paper only accepts literal CSS — no var(), no Tailwind, no tokens

## Fonts in Paper

| Role        | Paper Font Name | Weights  |
| ----------- | --------------- | -------- |
| Headings/UI | `Joystix`       | 400      |
| Body text   | `Mondwest`      | 400, 700 |
| Code/mono   | `Pixel Code`    | 400      |

## Local File URL Pattern

```text
http://localhost:29979/media/Users/rivermassey/Desktop/dev/DNA/{relative_path}
```

Examples:

* Icon: `http://localhost:29979/media/Users/rivermassey/Desktop/dev/DNA/packages/radiants/assets/icons/heart.svg`

* Logo: `http://localhost:29979/media/Users/rivermassey/Desktop/dev/DNA/apps/rad-os/public/assets/logos/radsun-cream.svg`

⠀