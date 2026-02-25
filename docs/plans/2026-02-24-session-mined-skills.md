# Session-Mined Skills — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build 6 Claude Code skills derived from mining 2,101 session transcripts (~5 GB) across 17 projects. Each skill addresses a high-frequency workflow pattern identified in the user's actual usage.

**Architecture:** Each skill is a single `SKILL.md` file in `~/.claude/skills/<name>/`. Skills follow the existing conventions: YAML frontmatter (name + description), markdown body with overview, process steps, and rules. No code dependencies — skills are prompt-driven.

**Tech Stack:** Markdown (SKILL.md format), Claude Code skill system

**Execution model:** Parallel team — one agent per skill. All 6 are independent. Each agent receives this plan section + the miner findings as context.

---

## Pre-Execution: Skill Format Reference

Every skill follows this structure:

```markdown
---
name: skill-name
description: One-line trigger description for the skill registry
---

# Skill Name

## Overview
What this skill does and why. 2-3 sentences.
**Announce at start:** "I'm using the [name] skill to [action]."

## When to Use
Trigger conditions and anti-patterns.

## The Process
Numbered phases with clear steps.

## Rules
Constraints and red flags.
```

**Conventions from existing skills:**
- Use imperative voice
- Tables for decision matrices
- Code blocks for exact commands/templates
- "Red Flags - STOP" section for anti-patterns
- Cross-reference other skills with `superpowers:skill-name`
- Keep sections to 200 words max
- No fluff — every line earns its place

---

## Task 1: `/spawn-review-team`

**Files:**
- Create: `~/.claude/skills/spawn-review-team/SKILL.md`

**What it does:** Spawns parallel reviewer agents with pre-defined personas, structured severity output, and automatic review-to-fix handoff.

**Miner findings to incorporate:**

1. **Personas observed in sessions (15+ sessions, 6+ projects):**
   - PM (user stories, acceptance criteria, feature completeness)
   - Sr Developer (code quality, race conditions, type safety, architecture)
   - Design Lead (visual consistency, token compliance, responsive behavior)
   - Researcher (reverse-engineer external tools, compare feature matrices)

2. **Severity format used across sessions:**
   - `[blocking]` — must fix before merge
   - `[important]` — should fix, creates tech debt if skipped
   - `[nit]` — style/preference, optional
   - `[suggestion]` — enhancement idea, not a fix

3. **Frustrations to solve:**
   - Subagents failed due to permission denials (Edit/Write/Bash denied) — skill should specify mode
   - Findings were scattered across teammate messages — skill must consolidate
   - Review-to-fix handoff was always manual ("Spawn a team to fix 1-10!") — skill should offer auto-fix
   - No structured output format — reviews were freeform prose

4. **Trigger phrases from sessions:**
   - "spawn a team to review"
   - "spawn pm subagent"
   - "create a team to review"
   - "spawn agents to fix"
   - "check on the team progress"

5. **Team presets to support:**
   - `review` (PM + Sr Dev) — default
   - `design-review` (PM + Sr Dev + Design Lead)
   - `research` (multiple researchers + comparator)
   - `fix` (workers from review findings)

6. **Edge cases:**
   - Teams of 5+ agents need coordination (not just fire-and-forget)
   - Cross-repo research (external apps, reference code)
   - Plan reviews that discover the plan is wrong → should output "rewrite needed"
   - Session continuation — async teammate notifications

**The skill should define:**
- How to spawn agents (Task tool with specific prompts per persona)
- Structured finding format (severity, file, line, description, suggested fix)
- Consolidation template (merge all findings into one report)
- Fix handoff ("Want me to spawn fixers for blocking/important items?")
- Permission guidance (agents should run in appropriate mode)

---

## Task 2: `/diagnose`

**Files:**
- Create: `~/.claude/skills/diagnose/SKILL.md`

**What it does:** Accepts pasted errors, console output, or "it's broken" reports. Identifies error type, traces root cause, tracks elimination attempts, prevents repeated guessing.

**Miner findings to incorporate:**

1. **Error formats observed (10+ sessions, 5+ projects):**
   - Terminal build output (Gradle, webpack, tsc, Next.js)
   - Browser console logs (WebSocket errors, React warnings)
   - Node.js stack traces (EPERM, ENOENT, module resolution)
   - CSS/performance issues (no error — "it feels slow around 2000ms")
   - Screenshots of broken UI + text description
   - Android Studio UI text (non-code upgrade blockers)

2. **The 8-round elimination anti-pattern (75f4f116):**
   - User: "slight animation hangup on load, add a timer"
   - 8 rounds of "nope not that, add it back" before finding letter-fill animation
   - Skill MUST track what's been tried and systematically narrow scope

3. **Frustrations to solve:**
   - First fix is wrong ~60% of the time, requiring multiple rounds
   - User has intuition ("I think it must be the animations") but needs systematic verification
   - Context mismatch ("that was a new terminal tab" — error from wrong context)
   - Platform-specific issues (Safari vs Chrome, Android vs iOS)
   - Cascading errors where root cause is buried in stack trace

4. **Trigger phrases (should auto-activate on these patterns):**
   - Pasted error output (detect `Error:`, `FAILED`, `FAILURE`, stack traces)
   - "not working", "still broken", "investigate", "diagnose"
   - "why is this", "what's wrong"
   - "still there" (elimination tracking)

5. **Relationship to existing skills:**
   - `/systematic-debugging` covers the general debugging methodology
   - `/diagnose` is the **entry point** — it classifies the error and decides whether to invoke systematic-debugging or handle it directly
   - Simple errors (typo, missing import, wrong path) → fix directly
   - Complex errors (race conditions, cascade failures, perf issues) → invoke systematic-debugging

**The skill should define:**
- Error classification (build, runtime, network, CSS/visual, performance, platform)
- Elimination tracker template (what was tried, result, conclusion)
- Auto-detection of error patterns in user input
- Escalation path to `/systematic-debugging` for complex issues
- "Ask before guessing" rule after 2 failed fixes

---

## Task 3: `/deploy`

**Files:**
- Create: `~/.claude/skills/deploy/SKILL.md`

**What it does:** Named deploy targets (preview/prod/localhost) with Vercel CLI handling, URL confirmation, and monorepo awareness.

**Miner findings to incorporate:**

1. **Deploy confusion incidents (7+ sessions, 3+ projects):**
   - "push to prod" meant Vercel preview, not git push, not Vercel production
   - User had to specify "only preview environment tho" repeatedly
   - "deploy to vercel preview via cli" — the canonical phrasing
   - Monorepo deploy was a session-killer (user gave up in 96fb4b92)

2. **Target mapping from sessions:**
   - `preview` (DEFAULT) → `npx vercel` or `vercel` CLI
   - `prod` → `npx vercel --prod` (requires explicit confirmation)
   - `localhost` → kill existing dev server + restart (`npm run dev` / `pnpm dev`)

3. **Frustrations to solve:**
   - "push to prod" ambiguity — skill must ask "Vercel prod or git push?"
   - Monorepo config: `workspace:*` deps, pnpm detection, root directory confusion
   - Post-deploy visual regression ("background blur missing from deployment")
   - Typos should still work: "redepploy", "prev", "push to vercel prev"

4. **Trigger phrases:**
   - "deploy", "push to vercel", "push to prod", "push to prev"
   - "redeploy", "deploy to preview", "deploy to localhost"
   - "kill the server and restart"

5. **Workflow observed:**
   - Deploy → check URL → report visual issue → fix → redeploy
   - Skill should output the live URL after deploy
   - Skill should remember last successful deploy config per project

**The skill should define:**
- Target resolution table (user phrase → action)
- Default = preview (never prod without confirmation)
- Monorepo detection (check for pnpm-workspace.yaml, root directory heuristic)
- Post-deploy checklist (URL, build status, visual spot-check reminder)
- Dev server management for localhost target

---

## Task 4: `/session-status`

**Files:**
- Create: `~/.claude/skills/session-status/SKILL.md`

**What it does:** Outputs structured status block showing completed/in-progress/remaining tasks, what to test, and next action. Persists to disk to survive session continuations.

**Miner findings to incorporate:**

1. **Status check phrasings (10+ sessions with context overflow):**
   - "where are we", "where are we at in the plan"
   - "what's next", "what's left"
   - "what features should work at the current juncture"
   - "what should i test"
   - "good to continue", "good to move on"
   - "check on the team progress"
   - "status", "recap"

2. **What the user needs when they ask "where are we":**
   - Completed tasks (checked off)
   - Current task (in progress)
   - Remaining tasks (with count)
   - Next concrete action
   - What to manually test right now
   - Team status if agents are running

3. **Frustrations to solve:**
   - Context overflow — 16 session continuations across 10 sessions lost context
   - No persistent task state — user must mentally reconstruct
   - Team progress is opaque until explicitly asked
   - "What should I test?" needs understanding of what changed, not just the checklist

4. **Session continuation pattern:**
   - "This session is being continued from a previous conversation..."
   - Summaries are auto-generated but don't provide quick-glance status
   - Skill should persist a `session-status.md` file that survives continuations

**The skill should define:**
- Status block template (structured markdown)
- Persistence mechanism (write to `ops/session-status.md` or similar)
- Auto-update trigger (after task completion, after batch completion)
- Team status integration (show running agent status)
- "What to test" heuristic (based on files changed in current batch)

---

## Task 5: `/checkpoint`

**Files:**
- Create: `~/.claude/skills/checkpoint/SKILL.md`

**What it does:** Named snapshots before risky changes with instant rollback. Uses git stash or temp commits under the hood.

**Miner findings to incorporate:**

1. **Undo/rollback incidents (8+ sessions, 5+ projects):**
   - "undo that last step, it was working better before"
   - "revert the issettled implementation, i liked it more before"
   - "undo, add a small box around them" (undo + new instruction in one)
   - User pasted 2KB of raw HTML because no rollback mechanism existed
   - "the colors have been completely overridden" — unintended side effects

2. **What triggered rollback requests:**
   - CSS change broke unrelated component ("that fixed it but now all backgrounds are gone")
   - Animation experiment went wrong ("completely paused the animation")
   - Multiple rapid changes made it unclear what was working before
   - Feature toggle as pseudo-checkpoint ("add the glow back, that wasn't the problem")

3. **Frustrations to solve:**
   - No way to mark "known good" state during rapid iteration
   - Git commits too coarse — dozens of micro-changes between commits
   - "It was working before" without knowing exactly when
   - Manual undo requires remembering what the old code was
   - Multi-file changes need atomic rollback (CSS + TSX + config)

4. **Trigger phrases:**
   - "checkpoint", "save this state", "save checkpoint"
   - "undo", "revert", "restore", "go back to"
   - "it was working before", "put it back", "roll back"

**The skill should define:**
- `save [name]` — git stash-like snapshot with a human-readable name
- `list` — show named checkpoints with timestamps
- `restore [name]` — restore to that state (default: last checkpoint)
- `diff [name]` — show what changed since checkpoint
- Auto-checkpoint suggestion before risky changes (refactors, sweeping CSS changes)
- Implementation: git stash with message, or temp branch + commit
- "Undo" without a name = restore last checkpoint

---

## Task 6: `/rdna-qa`

**Files:**
- Create: `~/.claude/skills/rdna-qa/SKILL.md`

**What it does:** Three-pass design system linter for RDNA/DNA projects. Catches token violations, unit inconsistencies, icon source issues, z-index problems, and 7 other categories drawn from 40+ sessions of real violations.

**Miner findings to incorporate:**

1. **11 violation categories found across sessions, ordered by frequency:**

   | # | Category | Sessions | Severity | Lint-able |
   |---|----------|----------|----------|-----------|
   | 1 | Hardcoded hex/rgba in classNames | 8+ | Critical | High |
   | 2 | Tailwind v4 `max-w` t-shirt size trap | 5+ | Critical | High |
   | 3 | `@theme` token chain resolution bug | 3+ | Critical | Medium-High |
   | 4 | z-index/stacking/pointer-events | 8+ | High | Medium |
   | 5 | Icon source (Lucide vs Radiants) | 5+ | High | High |
   | 6 | CSS unit inconsistency (px/em/rem) | 3+ | Medium | Medium |
   | 7 | Dark mode missing overrides | 4+ | High | Medium |
   | 8 | Motion/animation violations | 6+ | Medium | Medium |
   | 9 | Responsive breakpoint misuse | 4+ | Medium | Medium |
   | 10 | Typography/font inconsistency | 3+ | Medium | Medium |
   | 11 | Component pattern drift (missing schema/dna) | 2+ | Low | High |

2. **Three-pass structure:**

   **Pass 1 — Static Analysis (run on any file save/change):**
   - Hardcoded hex/rgba in `className` strings (`bg-[#`, `text-[#`, `border-[#`)
   - `max-w-xs` through `max-w-7xl` (Tailwind v4 trap — should be explicit rem)
   - `import ... from 'lucide-react'` outside approved barrel file
   - Missing `.schema.json` / `.dna.json` siblings for components in `components/core/`
   - `@theme inline` blocks with cross-referencing tokens

   **Pass 2 — Token Audit (run before commit):**
   - Every semantic token in `tokens.css` has dark mode override in `dark.css`
   - All `z-index` values from defined scale (0, 10, 20, 30, 40, 50, 100)
   - Font families reference only fonts in theme's `fonts.css`
   - No `px` in spacing/sizing (except `1px` borders, which spec allows)
   - `transition-duration` <= 300ms, `transition-timing-function: ease-out`

   **Pass 3 — Structural Review (run before PR/merge):**
   - No viewport breakpoints (`md:`, `lg:`, `sm:`) inside window/panel components
   - All `var()` chains resolve within same `@theme` block
   - `pointer-events: none` overlays have `pointer-events: auto` on interactive children
   - Glow/shadow colors reference parent component's color token

3. **Verbatim violations from sessions:**
   - "Ah, make sure you use semantic variables. Check for other non-semantic uses" (flow)
   - "radiants theme should not be using lucide icons, should use its own icons" (flow)
   - "we're using a bunch of px, em, and rem everywhere aren't we" (monolith)
   - "still unclickable" x4 — z-index 5 behind z-index 10 overlay (monolith)
   - `transition-duration: 500ms; transition-timing-function: ease;` — both violate spec (flow)

4. **The skill should support these invocation modes:**
   - `/rdna-qa` — run all 3 passes on current working directory
   - `/rdna-qa pass1` — static analysis only (fast)
   - `/rdna-qa [file]` — check a specific file
   - `/rdna-qa --fix` — auto-fix what's fixable (hardcoded colors → token suggestions, max-w → rem values)

**The skill should define:**
- Check definitions with exact grep/glob patterns for each rule
- Pass/fail output format with file:line references
- Auto-fix mappings where possible (max-w-md → max-w-[28rem])
- Per-theme overrides (monolith allows space-physics easing, radiants doesn't)
- Reference to DNA spec sections for each rule

---

## Execution Order

All 6 tasks are independent. Execute in parallel via team:

| Agent | Skill | Complexity | Est. Size |
|-------|-------|------------|-----------|
| Agent 1 | `/spawn-review-team` | Medium | ~150 lines |
| Agent 2 | `/diagnose` | Medium | ~150 lines |
| Agent 3 | `/deploy` | Low | ~100 lines |
| Agent 4 | `/session-status` | Low | ~100 lines |
| Agent 5 | `/checkpoint` | Low | ~120 lines |
| Agent 6 | `/rdna-qa` | High | ~250 lines |

**Review checkpoint:** After all 6 agents complete, review each SKILL.md for:
- Consistent formatting across all 6 skills
- Cross-references between skills are correct
- Trigger phrases don't overlap/conflict
- No redundancy with existing skills

---

## Post-Execution

After all skills are written and reviewed:
1. Verify each skill appears in the skill registry (restart Claude Code)
2. Test each skill with a real invocation
3. Run `/compound-knowledge` to document the session-mining methodology
4. Clean up session transcripts (now that patterns are captured as skills)
