You are a provenance tracer for a Claude Code skills cleanup. Your job is narrow: for each installed skill, determine WHERE IT CAME FROM so we have an install path for the archive index.

Working directory: /Users/rivermassey/Desktop/dev/DNA-pixel-art (already cd'd by the runner script — use absolute paths to be safe)

Input:
- /Users/rivermassey/Desktop/dev/DNA-pixel-art/ops/skills-cleanup/inventory.json — skills to trace

For each skill, try to identify the source in this priority order:

1. **npx skills manifest:** look for `skills-lock.json` in parent dirs of the skill path. If present and the skill id appears, extract the source URL. Also re-check: `inventory.json` already has `managed_by_npx: true` for 17 skills — for those, the source is likely a vercel-labs/skills or skills.sh entry.

2. **SKILL.md frontmatter:** some frontmatter blocks contain `source:` or `upstream:` or `repo:` fields.

3. **GitHub URL search:** grep the skill dir (SKILL.md and any accompanying files) for `github.com` URLs. If the skill dir is a git submodule or contains a .git, read `git config --get remote.origin.url`.

4. **Known-source patterns:**
   - Skills under ~/.claude/skills/ prefixed with `figma:`, `claude-hud:`, `arscontexta:` are bundled with desktop apps. Flag as `bundled-app`.
   - Skills matching user-authored prefixes (`p-`, `op-`, `wf-`, `qc-`) with NO external source found are candidates for `user-authored`. Flag these explicitly with `user_authored_candidate: true`.

5. **skills.sh / github.com/anthropics/skills lookup:** for skills whose id matches a known registry entry, construct an install URL. ONLY claim this if the SKILL.md content actually matches the upstream version. You can use `gh api` for remote reads if `gh` is authenticated, but do not block on it — leave source_url null if verification isn't possible offline.

Output file (REQUIRED):
/Users/rivermassey/Desktop/dev/DNA-pixel-art/ops/skills-cleanup/provenance-report.json

Format: JSON array of {
  id,
  source_kind: "npx-lock" | "frontmatter" | "github-url" | "bundled-app" | "user-authored" | "unknown",
  source_url: string | null,
  install_command: string | null,  // e.g. "npx skills add https://github.com/foo/bar --skill baz"
  user_authored_candidate: boolean,
  notes: string  // short free-text, <200 chars
}

Hard constraints:
- Do NOT clone any repos.
- Do NOT spawn subagents (no Task tool).
- Do NOT write outside /Users/rivermassey/Desktop/dev/DNA-pixel-art/ops/skills-cleanup/.
- When finished, print a ONE-LINE summary: "PROVENANCE TRACER DONE — npx: <N>, bundled: <N>, user-authored: <N>, unknown: <N>"

Do NOT decide which skills to archive. Do NOT write the review file. Just the provenance report.
