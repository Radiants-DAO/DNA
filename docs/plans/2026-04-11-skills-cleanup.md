# Skills Library Cleanup & Archive Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Audit all installed Claude skills across global and project scopes, classify each as keep-global / keep-DNA / archive via human review, and execute destructive cleanup with a durable markdown index of everything archived.

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA-pixel-art` on `feat/pixel-art-system` (docs-only additions; no source conflict expected)

**Architecture:** Read-only research phase (3 parallel subagents) → synthesized checkbox review doc in Collaborator note tile → hard review gate → sequential destructive execution with write-before-delete guarantee. The archive is a single flat markdown index (`~/Desktop/dev/ai-skills/INDEX.md`) with install commands, not a folder move.

**Tech Stack:**
- `npx skills` CLI for managed skill operations
- `collab-canvas` CLI for note tile creation
- Bash + `jq` + `rg` for session mining and filesystem traversal
- Claude Code subagents (Explore type for research, general-purpose for synthesis)

**Out of scope:**
- MCP audit (user toggles MCPs manually)
- Multi-agent parity for Gemini/Codex (user copies from `.claude/` afterward)
- The "auto-tile new .md next to creator" feature (follow-up skill design)
- Any source code changes in DNA-pixel-art

---

## Context Captured From Planning Discussion

- **Skill locations (pre-audit counts):**
  - `~/.claude/skills/` → 59 global entries (hand-installed, most not tracked by `npx skills`)
  - `.claude/skills/` (project, DNA-pixel-art) → ~17 figma/design skills
  - `.agents/skills/` (project, multi-agent) → 4 typography skills
  - `npx skills list` sees 21 (project-level only)
- **User-authored prefixes to scrutinize:** `/p-`, `/op-`, `/wf-`, `/qc-`. Most should end up global. Some may lack upstream repos.
- **Session miner reference:** `/Users/rivermassey/Desktop/dev/reforge/prompts/session-miner.md` — adapt for skill-invocation frequency, not full transcript mining.
- **Session corpus:** 1290 `.jsonl` files under `~/.claude/projects/`. Must filter to last 90 days.
- **Archive path:** `/Users/rivermassey/Desktop/dev/ai-skills/INDEX.md` (single flat file, table format, placeholder for usefulness ratings).
- **Review file:** `ops/skills-cleanup-review-2026-04-11.md` (in-repo, spawned as Collaborator note tile).

## Open Decisions Surfaced For User

These are flagged in the review file, not decided in this plan:

1. **Final INDEX.md path** — recommended `~/Desktop/dev/ai-skills/INDEX.md`; user confirms in T11 before execution.
2. **User-authored skill detection heuristic** — proposed: prefix match (`p-`, `op-`, `wf-`, `qc-`) + SKILL.md author frontmatter + file mtime > 90 days since first seen. Provenance tracer will surface candidates; user tags.
3. **Figma `.claude/skills/` scope** — currently project-level in DNA-pixel-art. Probably leaked there; most belong global. Staleness auditor flags; user decides per-skill in review.
4. **`.agents/skills/` typography audit** — 4 skills, already multi-agent. Proposal: leave alone unless staleness auditor finds dead refs. User confirms.

---

## Task 1: Prerequisite checks and session corpus sizing

**Files:**
- Read: `~/.claude/skills/` (directory listing)
- Read: `~/Desktop/dev/ai-skills/` (verify exists)
- Read: `/Users/rivermassey/Desktop/dev/reforge/prompts/session-miner.md` (verify readable)

**Step 1: Verify all input paths exist**

```bash
test -d ~/.claude/skills && echo ok-global
test -d .claude/skills && echo ok-project
test -d ~/Desktop/dev/ai-skills && echo ok-archive
test -f /Users/rivermassey/Desktop/dev/reforge/prompts/session-miner.md && echo ok-miner
test -d ~/.claude/projects && echo ok-sessions
```

Expected: all five `ok-*` lines.

**Step 2: Count sessions modified in the last 90 days**

```bash
find ~/.claude/projects -name '*.jsonl' -mtime -90 | wc -l
```

Record the number; usage miner uses it as its corpus cap.

**Step 3: Confirm `collab-canvas` CLI and viewport location**

```bash
which collab-canvas && collab-canvas tile list > /tmp/skills-cleanup-tiles-baseline.json
```

Saves a baseline tile list so we can diff after spawning the review tile.

**Step 4: No commit — this is pure reconnaissance.**

---

## Task 2: Build canonical skill inventory

**Files:**
- Create: `ops/skills-cleanup/inventory.json` (working file, untracked, git-ignored if needed)

**Step 1: Generate inventory**

Write a single-file bash script or inline pipeline that produces `ops/skills-cleanup/inventory.json` with one row per skill:

```json
{
  "id": "collab-canvas",
  "scope": "global",
  "path": "/Users/rivermassey/.claude/skills/collab-canvas",
  "skill_md_path": "/Users/rivermassey/.claude/skills/collab-canvas/SKILL.md",
  "managed_by_npx": false,
  "frontmatter": { "name": "...", "description": "..." },
  "size_kb": 12,
  "mtime": "2026-03-28T14:22:00Z"
}
```

**Step 2: Implementation**

```bash
mkdir -p ops/skills-cleanup
node -e "
const fs=require('fs');
const path=require('path');
const yaml=require('js-yaml');
// ...traverse the three skill roots, read SKILL.md frontmatter, stat the dir
" > ops/skills-cleanup/inventory.json
```

If `js-yaml` isn't available, do plain line-parsing of the YAML frontmatter (first-block between `---` lines). Don't add npm deps.

**Step 3: Cross-reference with `npx skills list` to flag managed vs hand-installed**

```bash
npx -y skills list > ops/skills-cleanup/npx-managed.txt 2>&1
```

Parse the `[36m...[0m` ANSI-colored names out, match against `inventory.json` IDs, set `managed_by_npx: true` where matched.

**Step 4: Sanity check**

```bash
jq 'length' ops/skills-cleanup/inventory.json
jq '[.[] | .scope] | group_by(.) | map({scope: .[0], count: length})' ops/skills-cleanup/inventory.json
```

Expected: total ≈ 80 (59 global + 17 project-figma + 4 typography), grouped by scope.

**Step 5: Commit the inventory**

```bash
git add ops/skills-cleanup/inventory.json
git commit -m "ops(skills-cleanup): snapshot skill inventory"
```

---

## Task 3: Spawn three parallel research subagents

All three run in the same message (parallel). None of them write outside `ops/skills-cleanup/`. All use `Read` input: `ops/skills-cleanup/inventory.json`.

### Task 3a: Usage miner

**Subagent type:** `general-purpose`

**Writes:** `ops/skills-cleanup/usage-report.json`

**Prompt template (exact, paste into Agent tool):**

```
You are a usage miner for a Claude Code skills cleanup. Your job is narrow:
rank skills by invocation frequency in the last 90 days of Claude sessions.

Reference prompt (read for methodology, but narrow its scope to skill usage only):
/Users/rivermassey/Desktop/dev/reforge/prompts/session-miner.md

Inputs:
- ops/skills-cleanup/inventory.json — list of skills to rank (one row per skill, id field)
- ~/.claude/projects/**/*.jsonl — Claude Code session transcripts

Scope:
- Only files with mtime within last 90 days (use: find ~/.claude/projects -name '*.jsonl' -mtime -90)
- Session JSONL lines are one JSON object per line; tool calls appear as { "type": "tool_use", "name": "...", "input": {...} }
- Skills are invoked via the Skill tool (name: "Skill") with input.skill set to the skill id
- Skills also appear in <command-name> tags inside user messages when the user types /skill-name

What to count per skill id:
1. invocations: number of times Skill tool was called with that skill
2. last_used: ISO timestamp of most recent invocation
3. user_slash_invocations: times the user typed /skill-name directly
4. sessions_touched: number of distinct session files containing any invocation

Output: ops/skills-cleanup/usage-report.json
Format: array of {id, invocations, last_used, user_slash_invocations, sessions_touched}
Skills with zero invocations in the window should still appear with zeros.

Constraints:
- Do NOT read full session content into memory. Stream line-by-line. Some sessions are > 100 MB.
- Cache progress to ops/skills-cleanup/usage-report.partial.json every ~100 files so reruns skip already-processed.
- If a session JSONL is malformed, log the path to ops/skills-cleanup/usage-report.errors.log and skip.
- Do not spawn your own subagents. Do the work in-process.
- Report under 200 words when done; the full data lives in usage-report.json.
```

### Task 3b: Staleness auditor

**Subagent type:** `general-purpose`

**Writes:** `ops/skills-cleanup/staleness-report.json`

**Prompt template:**

```
You are a staleness auditor for a Claude Code skills cleanup.

Input:
- ops/skills-cleanup/inventory.json — skills to audit (one row per skill with path, skill_md_path)

For EACH skill, read its SKILL.md and check:

1. Dead file path references: grep SKILL.md for /paths and bash commands that reference files.
   For each referenced path, check if it exists NOW. Flag misses.
   Special attention to: packages/radiants/, apps/rad-os/, tools/playground/, docs/, ops/
   (the DNA-pixel-art tree has moved several times)

2. Dead CLI references: commands like `pnpm X`, `npx Y`, `foo-cli Z`.
   For pnpm scripts: check if the script is defined in the referenced package.json.
   For standalone CLIs: check `which <cmd>` returns 0.

3. Frontmatter quality: the SKILL.md should have name + description in YAML frontmatter.
   Flag missing frontmatter, vague descriptions ("helps with stuff"), or stale descriptions.

4. Size red flag: SKILL.md > 500 lines OR < 10 lines.
   Very large skills may be outdated procedural docs; very small ones may be stubs.

Output: ops/skills-cleanup/staleness-report.json
Format: array of {
  id,
  dead_paths: [string],
  dead_commands: [string],
  frontmatter_issues: [string],
  size_lines: number,
  size_red_flag: bool,
  overall: "fresh" | "stale" | "dead"
}

Overall rating:
- fresh: no issues
- stale: minor issues (1-2 dead refs, size flag)
- dead: major issues (many dead refs, broken CLIs, missing frontmatter)

Constraints:
- Read-only. Do not modify any SKILL.md.
- Check each referenced path under the current working directory AND user home.
- Do not spawn subagents.
- Report under 200 words.
```

### Task 3c: Provenance tracer

**Subagent type:** `general-purpose`

**Writes:** `ops/skills-cleanup/provenance-report.json`

**Prompt template:**

```
You are a provenance tracer for a Claude Code skills cleanup.

Input:
- ops/skills-cleanup/inventory.json — skills to trace

For each skill, try to identify WHERE IT CAME FROM so we have an install path for the archive.

Sources to check (in priority order):

1. npx skills manifest: look for skills-lock.json in parent dirs of the skill path.
   If present and mentions this skill, extract the source URL.

2. SKILL.md frontmatter: sometimes contains a source or upstream field.

3. GitHub search: grep SKILL.md and accompanying files for github.com URLs.
   If the skill dir is a git submodule or contains .git, read the remote.

4. Known-source patterns:
   - Skills under ~/.claude/skills/ prefixed with "figma:", "claude-hud:", "arscontexta:" are
     likely bundled with those apps. Check installed apps/packages with matching names.
   - Skills matching user-authored prefixes (p-, op-, wf-, qc-) with no external source
     are candidates for USER-AUTHORED. Flag these explicitly.

5. skills.sh lookup: for skills whose id matches a known vercel-labs/skills or
   anthropics/skills entry, assume source = github.com/{org}/skills/tree/main/skills/{id}.
   Only claim this if the SKILL.md content actually matches (compare first 20 lines against
   the GitHub version via `gh api`).

Output: ops/skills-cleanup/provenance-report.json
Format: array of {
  id,
  source_kind: "npx-lock" | "frontmatter" | "github-url" | "bundled-app" | "user-authored" | "unknown",
  source_url: string | null,
  install_command: string | null,  // e.g. "npx skills add https://github.com/foo/bar --skill baz"
  user_authored_candidate: bool,
  notes: string
}

Constraints:
- Do NOT clone anything. Use gh api for remote reads.
- Do NOT write outside ops/skills-cleanup/.
- Do not spawn subagents.
- Report under 200 words.
```

**Step 1: Spawn all three agents in parallel using a single message with three Agent tool calls.**

**Step 2: Wait for all three to finish.**

**Step 3: Verify all three output files exist and are valid JSON.**

```bash
for f in usage-report staleness-report provenance-report; do
  jq 'length' ops/skills-cleanup/$f.json || echo "MISSING/INVALID: $f"
done
```

**Step 4: Commit research outputs**

```bash
git add ops/skills-cleanup/usage-report.json ops/skills-cleanup/staleness-report.json ops/skills-cleanup/provenance-report.json
git commit -m "ops(skills-cleanup): research reports from parallel agents"
```

---

## Task 4: Synthesize review table

**Files:**
- Create: `ops/skills-cleanup-review-2026-04-11.md`

**Step 1: Merge the four JSON files into one table row per skill**

Join `inventory.json`, `usage-report.json`, `staleness-report.json`, `provenance-report.json` on `id`.

**Step 2: Write the review file with this structure**

```markdown
# Skills Cleanup Review — 2026-04-11

> **Instructions:** Tick ONE box per row. Default is "archive" (unchecked = archive).
> When done, tell Claude "review complete" to trigger execution.

## How to read the columns

- **Global** — keep as user-scope skill (`~/.claude/skills/`, all agents)
- **DNA** — keep as project-scope skill in DNA-pixel-art only
- **Archive** — remove from all scopes, log into `~/Desktop/dev/ai-skills/INDEX.md` with install command

## Open decisions (answer these first)

- [ ] INDEX.md path = `~/Desktop/dev/ai-skills/INDEX.md` (change here if wrong)
- [ ] Audit `.agents/skills/` typography (4 skills)? Default: skip unless marked dead
- [ ] Figma skills currently in `.claude/skills/` — default scope if "keep"? Global / DNA / per-skill
- [ ] User-authored heuristic confirmed: prefixes p-, op-, wf-, qc- + no external source

## User-authored candidates

(skills flagged user_authored_candidate by provenance tracer)

| Skill | Last used | Uses (90d) | Staleness | Global | DNA | Archive |
|-------|-----------|-----------|-----------|:---:|:---:|:---:|
| op-status | 2026-04-08 | 12 | fresh | [ ] | [ ] | [ ] |
| ... | | | | | | |

## Global skills (~/.claude/skills/)

| Skill | Last used | Uses (90d) | Staleness | Source | Global | DNA | Archive |
|-------|-----------|-----------|-----------|--------|:---:|:---:|:---:|
| collab-canvas | ... | ... | fresh | local | [ ] | [ ] | [ ] |
| ... | | | | | | | |

## Project skills (.claude/skills/)

| Skill | Last used | Uses (90d) | Staleness | Source | Global | DNA | Archive |
|-------|-----------|-----------|-----------|--------|:---:|:---:|:---:|
| cc-figma-component | ... | ... | ... | ... | [ ] | [ ] | [ ] |
| ... | | | | | | | |

## Project skills (.agents/skills/)

(multi-agent; default = skip unless staleness = dead)

| Skill | Last used | Uses (90d) | Staleness | Global | DNA | Archive |
|-------|-----------|-----------|-----------|:---:|:---:|:---:|
| typography | ... | ... | ... | [ ] | [ ] | [ ] |
| ... | | | | | | |
```

**Step 3: Sort within each section by uses-descending, then by staleness (fresh first).**

**Step 4: Commit review file**

```bash
git add ops/skills-cleanup-review-2026-04-11.md
git commit -m "ops(skills-cleanup): review table for human triage"
```

---

## Task 5: Spawn note tile for the review file

**Step 1: Create the tile via collab-canvas CLI**

```bash
collab-canvas tile create note --file /Users/rivermassey/Desktop/dev/DNA-pixel-art/ops/skills-cleanup-review-2026-04-11.md
```

Capture the returned tile ID.

**Step 2: Focus the tile so the user can see it**

```bash
collab-canvas tile focus <tile-id>
```

**Step 3: Notify the user**

```bash
SOCK=$(cat ~/.collaborator/socket-path)
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"app.notify","params":{"title":"Skills cleanup","body":"Review table ready. Tick keep/archive boxes, then say review complete."}}' | nc -U "$SOCK" -w 1
```

**Step 4: No commit needed.** The tile is runtime state, not a file.

---

## Task 6: REVIEW GATE — HARD STOP

**Wait for explicit user confirmation before proceeding.**

User signals via:
- Editing the review file and ticking checkboxes
- Saying "review complete" or equivalent in chat

**Verification:**

```bash
# Parse the review file and confirm every row has exactly one checkbox ticked
node ops/skills-cleanup/verify-review.mjs ops/skills-cleanup-review-2026-04-11.md
```

If any row has 0 or 2+ ticks, report which rows are ambiguous and wait for the user to fix.

**Do NOT proceed past this gate without:**
1. A `review complete` signal from the user
2. All rows passing `verify-review.mjs`
3. Open decisions at the top of the file all ticked

---

## Task 7: Write archive index BEFORE any destruction

**Files:**
- Create or append: `/Users/rivermassey/Desktop/dev/ai-skills/INDEX.md`

**Step 1: Parse the reviewed file and collect every skill marked Archive**

**Step 2: Append one row per archived skill to INDEX.md with this format**

```markdown
## YYYY-MM-DD Archive batch

| Skill | Description | Install | Usefulness |
|-------|-------------|---------|------------|
| foo-skill | One-line description from SKILL.md frontmatter | `npx skills add github.com/...` or `(local, no upstream)` | _pending_ |
```

If INDEX.md does not yet have the header, create it with:

```markdown
# Skills Archive Index

A flat record of skills that have been removed from active installations.
Each row preserves enough information to reinstall the skill later if needed.
The `Usefulness` column is a placeholder for future ratings.
```

**Step 3: Verify write succeeded and row count matches archive count**

```bash
ARCHIVE_COUNT=$(node ops/skills-cleanup/count-archived.mjs ops/skills-cleanup-review-2026-04-11.md)
INDEX_ADDED=$(tail -n $((ARCHIVE_COUNT + 2)) ~/Desktop/dev/ai-skills/INDEX.md | grep -c '^|')
test "$ARCHIVE_COUNT" -eq "$((INDEX_ADDED - 1))" && echo ok || echo MISMATCH
```

**Step 4: Commit INDEX.md (if it's under git). If not, stop at write.**

---

## Task 8: Remove skills marked Archive — managed-by-npx first

**Step 1: Collect the list of archived skills that have `managed_by_npx: true`**

**Step 2: Remove them via npx skills, one at a time with verification**

```bash
for skill in $(cat ops/skills-cleanup/to-remove-managed.txt); do
  echo "Removing managed: $skill"
  npx -y skills remove -s "$skill" -y
  sleep 0.5
done
```

**Step 3: Verify removal**

```bash
npx -y skills list | grep -F -f ops/skills-cleanup/to-remove-managed.txt && echo STILL_PRESENT || echo clean
```

Expected: `clean`.

**Step 4: Commit (if any tracked files changed, e.g. skills-lock.json)**

```bash
git add -u
git diff --cached --name-only
git commit -m "ops(skills-cleanup): remove managed skills" || echo "nothing to commit"
```

---

## Task 9: Remove hand-installed skills marked Archive

**Step 1: Collect the list of archived skills that have `managed_by_npx: false`**

**Step 2: Remove each skill directory**

```bash
while read -r skill_path; do
  test -d "$skill_path" || { echo "MISSING: $skill_path"; continue; }
  rm -rf "$skill_path"
  echo "removed: $skill_path"
done < ops/skills-cleanup/to-remove-paths.txt
```

**Step 3: Verify**

```bash
while read -r skill_path; do
  test -d "$skill_path" && echo STILL_PRESENT: "$skill_path"
done < ops/skills-cleanup/to-remove-paths.txt
```

Expected: no output.

**Step 4: No commit — these paths are outside the repo.**

---

## Task 10: Move skills marked DNA (from global → project)

**Step 1: Collect skills ticked DNA that are currently in `~/.claude/skills/`**

**Step 2: For each, install into project scope via npx skills (if possible) OR copy the directory**

```bash
# Managed skills: use npx skills (project scope)
npx -y skills add <source-url> --skill <skill-id>

# Hand-installed skills: cp -r into .claude/skills/
cp -r ~/.claude/skills/<skill-id> .claude/skills/<skill-id>
rm -rf ~/.claude/skills/<skill-id>
```

**Step 3: Verify both removal from global and presence in project**

```bash
test ! -d ~/.claude/skills/<skill-id> && test -d .claude/skills/<skill-id> && echo ok
```

**Step 4: Commit project skills**

```bash
git add .claude/skills/
git commit -m "ops(skills-cleanup): demote global → DNA scope"
```

---

## Task 11: Move skills marked Global (from project → global)

Mirror of Task 10 in reverse.

**Step 1: Collect skills ticked Global that are currently in `.claude/skills/` or `.agents/skills/`**

**Step 2: For each, install into global scope or copy**

```bash
# Managed: npx skills add -g
npx -y skills add <source-url> --skill <skill-id> -g

# Hand-installed: cp -r into ~/.claude/skills/
cp -r .claude/skills/<skill-id> ~/.claude/skills/<skill-id>
git rm -rf .claude/skills/<skill-id>
```

**Step 3: Verify**

```bash
test -d ~/.claude/skills/<skill-id> && test ! -d .claude/skills/<skill-id> && echo ok
```

**Step 4: Commit project deletions**

```bash
git add -u
git commit -m "ops(skills-cleanup): promote DNA → global scope"
```

---

## Task 12: Create `~/.claude/CLAUDE.md` with preferences

**Files:**
- Create: `~/.claude/CLAUDE.md`

**Step 1: Write the file**

```markdown
# Global Claude Code Preferences

## Tool preferences

- **Canvas operations:** prefer the `collab-canvas` CLI (at `~/.local/bin/collab-canvas`)
  for any tile creation, movement, or terminal driving. The raw Collaborator JSON-RPC
  `canvas.tileCreate` silently coerces non-note tile types; always go through the CLI.
- **Browser automation:** prefer the `agent-browser` CLI for all browser work
  (navigation, clicks, screenshots, eval, CDP attach). Do not use `claude-in-chrome` MCP
  or `chrome-devtools-mcp` unless explicitly requested.
- **Session skill discovery:** use `find-skills` skill before implementing new capabilities
  that might already exist on skills.sh.

## Canvas conventions

- New `.md` docs created during a session should be auto-added to the Collaborator
  canvas as a note tile near the creating agent. **TODO:** semantics for "near creator"
  are unresolved — tracked as a follow-up skill design. For now, create tiles at
  viewport center and let the user reposition.

## Skills cleanup reference

- Archive index: `~/Desktop/dev/ai-skills/INDEX.md`
- Reinstall pattern: `npx skills add <source-url>` (pull from INDEX.md row)
```

**Step 2: Verify**

```bash
test -f ~/.claude/CLAUDE.md && wc -l ~/.claude/CLAUDE.md
```

**Step 3: No git commit** — this lives outside the repo.

---

## Task 13: Final verification and cleanup summary

**Step 1: Re-run the inventory script and diff against the original**

```bash
node ops/skills-cleanup/build-inventory.mjs > ops/skills-cleanup/inventory.post.json
diff <(jq -S 'map(.id) | sort' ops/skills-cleanup/inventory.json) \
     <(jq -S 'map(.id) | sort' ops/skills-cleanup/inventory.post.json)
```

Expected diff should match exactly the set of skills removed.

**Step 2: Verify INDEX.md row count = archive count**

```bash
ARCHIVED=$(node ops/skills-cleanup/count-archived.mjs ops/skills-cleanup-review-2026-04-11.md)
INDEX_ROWS=$(grep -c '^| [^-]' ~/Desktop/dev/ai-skills/INDEX.md)
echo "archived=$ARCHIVED  index_rows=$INDEX_ROWS"
```

**Step 3: Write summary report**

```bash
cat > ops/skills-cleanup/SUMMARY.md <<EOF
# Skills Cleanup Summary — 2026-04-11

- Audited: $(jq length ops/skills-cleanup/inventory.json) skills
- Kept global: $KEEP_GLOBAL
- Kept DNA: $KEEP_DNA
- Archived: $ARCHIVED
- INDEX.md rows added: $INDEX_ROWS
- Global CLAUDE.md: created at ~/.claude/CLAUDE.md

## Follow-ups
- Auto-tile new .md next to creator (deferred skill design)
- Multi-agent parity for Gemini/Codex (user handles manually)
- MCP cleanup (user handles manually)
EOF
```

**Step 4: Commit everything**

```bash
git add ops/skills-cleanup/ ops/skills-cleanup-review-2026-04-11.md
git commit -m "ops(skills-cleanup): complete cleanup — $ARCHIVED archived, summary logged"
```

**Step 5: Notify**

```bash
SOCK=$(cat ~/.collaborator/socket-path)
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"app.notify","params":{"title":"Skills cleanup","body":"Cleanup complete. See ops/skills-cleanup/SUMMARY.md."}}' | nc -U "$SOCK" -w 1
```

---

## Execution Options

**Plan complete and saved to `docs/plans/2026-04-11-skills-cleanup.md`. Two execution options:**

**1. Subagent-Driven (this session)** — I dispatch fresh subagent per task, review between tasks. Good here because Task 3 already involves parallel subagents and the coordination is tight.

**2. Parallel Session (separate)** — Open new session with wf-execute, batch execution with checkpoints. Good if you want to free this context window for other work.

**Recommendation:** Given this session's context is nearly full, option 2 is safer. Start a fresh session, point it at this plan, invoke wf-execute.

**Which approach?**
