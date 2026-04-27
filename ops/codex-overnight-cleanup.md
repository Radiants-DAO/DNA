# Codex 5.5 — Overnight DNA Cleanup Prompt

> **How to use:** copy this entire file into Codex 5.5 as the task. It is the full
> brief — Codex has no other context. Run from repo root
> `/Users/rivermassey/Desktop/dev/DNA-logo-maker`.

---

## Mission

You are running unattended for **4 hours** on the `DNA-logo-maker`
monorepo. Your job is to execute as much of a 14-goal cleanup sweep as
fits in that window, leaving the repo in a strictly better state by the
end: working tree green, every commit reviewable, no surprise destructive
operations.

**The window is tight — you will NOT finish all 17 phases.** That is
expected and fine. The phase order below is risk-sorted so even a partial
run leaves the repo strictly improved. **It is far better to stop and
document a blocker, or skip a phase, than to ship a broken main path.**

Phases 1–7 are the high-value cheap wins (root dirt, tools/, scripts,
fonts, ops, ideas, archive mining). If you only finish those, the run is
a success. Phases 10–11 (radiants split) are plan-only-with-gated-exec
and should never overrun. Phases 12–15 (package finalize + docs writes)
are the ones to TRUNCATE if running short — defer to morning report.

The user will wake up and read your **morning report** (path below). Optimize
for: (a) the report being honest, (b) every change being on a separate commit
the user can revert, (c) build/lint/test still passing.

---

## Hard rules (read first — these override everything below)

1. **NEVER force-push, NEVER `git reset --hard`, NEVER amend a published
   commit, NEVER skip hooks (`--no-verify`).** If a hook fails, fix the cause.
2. **NEVER delete a file without first moving it to the cleanup archive** at
   `/Users/rivermassey/Desktop/dev/_vault/3 archive/DNA-cleanup archive/<YYYY-MM-DD>/`
   (path has spaces — quote it). The only exceptions are:
   - Empty zero-byte files at repo root (`88`, `This`)
   - Files explicitly listed in §"Outright deletes" below
   - Generated artifacts (`dist/`, `.turbo/`, `.next/`, `node_modules/`, `*.tsbuildinfo`)
3. **One bucket = one commit.** Use Conventional Commits (`chore:`, `docs:`,
   `refactor:`, `feat:`, `fix:`). Never combine unrelated changes.
4. **After every phase, run the validation gate** (§"Validation gate"). If it
   fails and you cannot fix in 3 attempts → stop the phase, write the failure
   to the report, move on to the next phase.
5. **Plan-first for risky work.** Goals 2 and 14 require you to write a plan
   doc and only execute the safe subset. Do NOT do a speculative refactor.
6. **Anything ambiguous → preserve, don't delete.** When in doubt: archive,
   don't `rm`. Disk is cheap.
7. **State file is sacred.** Update `ops/codex-cleanup-state.json` after every
   phase so you (or a fresh agent) can resume.
8. **No new dependencies.** No new packages, no new tools, no new dev deps.
9. **No backwards-compat shims, no `// removed` tombstones, no renamed `_var`
   placeholders.** If something is unused, delete it cleanly. **Greenfield
   project**: actively remove any existing backwards-compat code you find
   (deprecated re-exports, "legacy" aliases, "v1" parallel paths, "old"
   helper functions, fallback branches for removed features). See
   §"Backwards-compat hunt".
10. **The user is asleep — do not ask questions.** When you would normally ask,
    pick the conservative option (archive, skip, document blocker) and move on.
11. **No version bumps outside the dedicated deps phase.** Hard Rule #8 forbids
    new deps; this rule extends it to bumps. `package.json`
    `dependencies`/`devDependencies`/`peerDependencies` versions are immutable
    in every phase except Phase 9.5 (deps bumps). Lockfile changes outside
    Phase 9.5 only via `pnpm install` after a structural workspace edit (e.g.
    removing `templates/*` from `pnpm-workspace.yaml`).

---

## Repo facts (verified at brief-time)

- **GREENFIELD PROJECT.** No external consumers, no shipped versions, no
  customers, no API stability promises. There is **zero need** to maintain
  backwards compatibility on anything. Internal callers can be migrated
  freely in the same commit as the breaking change. See "Backwards-compat
  hunt" below — there is likely existing compat-shim cruft slopped in by
  prior agent runs that should be **actively removed** as you encounter it.
- **Stack**: Turborepo + pnpm 10.26.0, Next.js 16, Tailwind v4, TypeScript.
- **Branch**: `feat/logo-asset-maker` (currently dirty — many uncommitted
  edits). Main branch is `main`.
- **Packages** (`packages/`): `radiants` (`@rdna/radiants`), `pixel`
  (`@rdna/pixel`), `ctrl` (`@rdna/ctrl`), `preview` (`@rdna/preview`),
  `monolith` (`@rdna/monolith` — appears scaffolded only).
- **Apps** (`apps/`): `rad-os` (Next.js 16, the only app).
- **Canonical design spec**: `packages/radiants/DESIGN.md`. When code and
  DESIGN.md disagree, code wins for "what is", DESIGN.md wins for "what should
  be".
- **Project memory / conventions**: `CLAUDE.md` at repo root and in
  `apps/rad-os/`, `packages/radiants/`. Read these for conventions; do NOT
  rewrite them.
- **Knip is configured** at `knip.json` — use `pnpm deadcode:check` for dead
  code evidence.
- **ESLint custom rules** at `packages/radiants/eslint/` and
  `eslint.rdna.config.mjs` (repo-local). Don't break them.

---

## Setup (do this first, before any phase)

```bash
cd /Users/rivermassey/Desktop/dev/DNA-logo-maker

# 1. Record starting branch (whatever it is — may be a fork branch already
#    prepared by the human). Don't assume a specific name.
START_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "Starting from branch: $START_BRANCH"

# 2. Snapshot any in-flight work as a single commit on the current branch.
#    Will be a no-op if the tree is already clean.
git status --short | head -100
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -m "chore: snapshot pre-cleanup state $(date -u +%Y%m%dT%H%M%SZ)"
fi

# 3. Branch off for the cleanup work (only if not already on a chore/* branch)
case "$START_BRANCH" in
  chore/*) echo "Already on cleanup branch $START_BRANCH — staying here." ;;
  *) git checkout -b "chore/overnight-cleanup-$(date +%Y%m%d)" ;;
esac

# 4. Create the archive root (note the space in "3 archive")
ARCHIVE_ROOT="/Users/rivermassey/Desktop/dev/_vault/3 archive/DNA-cleanup archive/$(date +%Y-%m-%d)"
mkdir -p "$ARCHIVE_ROOT"
echo "$ARCHIVE_ROOT" > ops/codex-cleanup-archive-path.txt

# 5. Initialize state file (use unquoted heredoc so the substitutions resolve)
mkdir -p ops
NOW_UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
CUR_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
cat > ops/codex-cleanup-state.json <<JSON
{
  "started": "$NOW_UTC",
  "branch": "$CUR_BRANCH",
  "archive_root": "$ARCHIVE_ROOT",
  "phases": {
    "0_setup": "done",
    "1_root_dirt": "pending",
    "2_tools_playground": "pending",
    "3_scripts_audit": "pending",
    "4_fonts": "pending",
    "5_ops_review": "pending",
    "6_ideas_consolidate": "pending",
    "7_archive_mining": "pending",
    "8_docs_classify": "pending",
    "9_packages_audit": "pending",
    "9_5_safe_deps_bumps": "pending",
    "10_radiants_split_PLAN": "pending",
    "11_radiants_split_EXEC": "blocked-on-10",
    "12_pixel_finalize": "pending",
    "13_other_packages_finalize": "pending",
    "14_rad_os_audit": "pending",
    "14a_reconcile_deletions": "pending",
    "15_docs_write_and_package_docs": "pending",
    "16_vault_sync": "pending",
    "17_final_report": "pending"
  },
  "blockers": [],
  "deferred_to_human": [],
  "radiants_split_safe_subset": null
}
JSON

# 6. Verify disk space in vault before we start writing to it
df -h "$ARCHIVE_ROOT" | tail -1   # at least 5GB free recommended

# 7. Establish baseline — record what was passing BEFORE we started.
#    Note: --frozen-lockfile may fail if the lockfile is already drifted
#    (likely with 22 outdated deps). Fall back to plain install but log it.
if ! pnpm install --frozen-lockfile 2>&1 | tee ops/codex-cleanup-baseline-install.log | tail -20 ; then
  echo "BASELINE: frozen-lockfile failed, falling back to plain install" \
    >> ops/codex-cleanup-baseline-install.log
  pnpm install 2>&1 | tee -a ops/codex-cleanup-baseline-install.log | tail -20
fi
pnpm lint 2>&1 | tail -40 > ops/codex-cleanup-baseline-lint.log || true
pnpm test:ci 2>&1 | tail -40 > ops/codex-cleanup-baseline-test.log || true
pnpm build 2>&1 | tail -40 > ops/codex-cleanup-baseline-build.log || true

# 8. Tag the pre-cleanup state so revert recovery is bulletproof.
#    (Hard Rule #1 forbids reset --hard; this tag is a safety NET, not a
#    reset target — only reference it from the morning report if needed.)
git tag codex-cleanup-baseline-$(date +%Y%m%d-%H%M)

git add ops/codex-cleanup-state.json ops/codex-cleanup-archive-path.txt \
  ops/codex-cleanup-baseline-*.log
git commit -m "chore: codex overnight cleanup setup + baseline logs"
```

If the baseline shows pre-existing failures, **note them in the state file**
and do not treat them as your responsibility — your bar is "no NEW
regressions", not "fix everything."

---

## Validation gate (run after every phase)

```bash
pnpm lint          2>&1 | tail -40   # must not have NEW errors vs baseline
pnpm test:ci       2>&1 | tail -40   # must not have NEW failures vs baseline
pnpm build         2>&1 | tail -40   # must succeed (or fail same as baseline)
```

If a phase introduces a regression you can't resolve in 3 fix attempts:
1. `git revert HEAD` for that phase's commit(s) — do NOT reset.
2. Mark the phase `reverted` in state and add a `blockers[]` entry.
3. Continue to the next phase.

---

## Backwards-compat hunt (cross-cutting)

This is a greenfield project. Prior agent runs likely left backwards-compat
cruft that has zero purpose now. **Hunt and remove it as you go**, not as a
separate phase. Patterns to grep for, with what to do:

```bash
# Deprecated re-exports — delete the re-export, migrate any callers
grep -rn "@deprecated\|/\* deprecated\|// deprecated\|DEPRECATED" \
  --include='*.ts' --include='*.tsx' --include='*.css' \
  packages/ apps/ | grep -v node_modules > ops/codex-compat-deprecated.txt

# "Legacy" / "old" / "v1" markers in code
grep -rn "legacy\|Legacy\|LEGACY\|/\*\s*old\b\|//\s*old\b\|v1Compat\|backwardCompat\|backCompat\|backwards.compat" \
  --include='*.ts' --include='*.tsx' --include='*.mjs' --include='*.css' \
  packages/ apps/ | grep -v node_modules | grep -v "GoodNewsLegacyApp" \
  > ops/codex-compat-legacy.txt
# (GoodNewsLegacyApp is a real app name, not a shim — exclude.)

# Aliased token shims in CSS — `--color-foo` aliasing to `--color-bar`
# where -bar already has a real value, but -foo is no longer used anywhere
grep -rn "^\s*--color-.*:\s*var(--color-" packages/radiants/*.css \
  > ops/codex-compat-token-aliases.txt

# Renamed-and-still-exported pairs (e.g. `oldName` re-exporting newName)
grep -rn "export.*as " --include='*.ts' --include='*.tsx' \
  packages/ apps/ | grep -v node_modules \
  > ops/codex-compat-renamed-exports.txt

# Fallback branches for removed flags / removed env vars
grep -rn "process\.env\.\|FEATURE_FLAG\|EXPERIMENTAL\|FALLBACK" \
  --include='*.ts' --include='*.tsx' \
  packages/ apps/ | grep -v node_modules \
  > ops/codex-compat-feature-flags.txt

# Author-marked debt with a self-described removal trigger
grep -rn "TODO.*remove after\|TODO.*drop\|HACK.*until\|XXX.*remove\|FIXME.*remove" \
  --include='*.ts' --include='*.tsx' --include='*.css' --include='*.mjs' \
  packages/ apps/ | grep -v node_modules \
  > ops/codex-compat-removal-todos.txt

# Transitional / migration markers (common agent-cruft language)
grep -rn "transitional\|migration shim\|bridge \|intermediate compat" \
  --include='*.ts' --include='*.tsx' \
  packages/ apps/ | grep -v node_modules \
  > ops/codex-compat-transitional.txt

# Symbol.for shims and "private but accessible" cross-package coupling
grep -rn "Symbol\.for\|__internal_\|__legacy_\|_unstable_" \
  --include='*.ts' --include='*.tsx' \
  packages/ apps/ | grep -v node_modules \
  > ops/codex-compat-symbol-shims.txt

# Expired ESLint exceptions — past-dated `expires:` lines
grep -rn "eslint-disable.*expires:" --include='*.ts' --include='*.tsx' \
  packages/ apps/ | grep -v node_modules \
  | awk -F'expires:' '{ split($2, a, " "); print a[1]"\t"$0 }' \
  | awk -v today="$(date +%Y-%m-%d)" '$1 < today' \
  > ops/codex-compat-expired-eslint.txt

# `export type { OldName } from './new-location'` — common after renames
grep -rn "^export type.*from\s*['\"]" --include='*.ts' --include='*.tsx' \
  packages/ apps/ | grep -v node_modules \
  > ops/codex-compat-renamed-type-exports.txt

# `export { foo as default }` shims (default-export wrappers)
grep -rn "export.*as default" --include='*.ts' --include='*.tsx' \
  packages/ apps/ | grep -v node_modules \
  > ops/codex-compat-default-shims.txt

# Explicit dead branches — `if (false)`, `if (0)`, etc.
grep -rn -E "if\s*\(\s*(false|0|null|undefined)\s*\)" \
  --include='*.ts' --include='*.tsx' \
  packages/ apps/ | grep -v node_modules \
  > ops/codex-compat-dead-branches.txt
```

For each hit:
1. **Trace usage** with the same grep across the workspace.
2. If unused → delete the shim and any imports of it.
3. If used internally → migrate the callers AND delete the shim, in the
   same commit. Do NOT leave the shim "for the migration".
4. If unsure → leave it and note it in `ops/codex-compat-uncertain.md` for
   the morning report.

Common types of cruft to expect:
- Token aliases in `packages/radiants/tokens.css` left over from rename
  passes (e.g. an old name pointing at a brand primitive that's still
  reachable under its new name)
- Re-exports in package `index.ts` files that point at moved-and-renamed
  internals
- "Legacy*" components or hooks in `apps/rad-os/` (verify each — some are
  real, like `GoodNewsLegacyApp`)
- Optional props in `*.meta.ts` files marked deprecated
- ESLint exception lines with `expires:` dates already in the past

Treat compat removal as part of the phase you're already in — don't make a
mega-commit at the end. One compat-shim deletion = one commit (or fold into
the phase commit if it's directly related).

---

## Archiving protocol

The archive lives **outside the git worktree** (`/Users/rivermassey/Desktop/dev/_vault/...`).
This means `git mv` will FAIL ("destination not under repo"). Use this
two-step pattern instead — `cp` + `git rm` keeps the file on disk in the
vault while removing it from the repo cleanly.

```bash
ARCHIVE_ROOT="$(cat ops/codex-cleanup-archive-path.txt)"
SRC='<relative-path-inside-repo>'           # e.g. references or docs/foo.md
DST="$ARCHIVE_ROOT/$SRC"

mkdir -p "$(dirname "$DST")"
# Tracked file or directory:
cp -R "$SRC" "$DST"
git rm -r "$SRC"
# Untracked (rare — only if file isn't in git):
# mv "$SRC" "$DST"

# Append to manifest with file lock so parallel sub-agents don't race
( exec 9>"$ARCHIVE_ROOT/.manifest.lock" && flock 9 && \
  printf -- '- %s — %s\n' "$SRC" '<one-line reason>' >> "$ARCHIVE_ROOT/MANIFEST.md" )
```

Always preserve directory structure inside the archive so the original
location is recoverable.

**Recovery**: if a phase needs to be reverted, `git revert <sha>` restores
the repo-side state, then copy the file back from the vault:
```bash
cp -R "$ARCHIVE_ROOT/$SRC" "$SRC"
```
The pre-cleanup git tag (`codex-cleanup-baseline-*`, set in setup step 8)
is the ultimate fallback for catastrophic recovery — but Hard Rule #1
forbids `git reset --hard` to it; only mention it in the morning report
if recovery is genuinely needed.

---

## Outright deletes (no archive needed)

- `./88` (empty file)
- `./This` (empty file)
- `./.DS_Store` (and any nested ones)
- `./studio-after-fix.png`, `./studio-initial.png`,
  `./studio-selected.png`, `./studio-transparent-selected.png` (debug
  screenshots)
- `./tsconfig.tsbuildinfo` and any nested `*.tsbuildinfo`
- `docs/placeholder.png` (1.6 MB, name suggests temporary)
- Any `.turbo/`, `dist/`, `.next/`, `node_modules/` accidentally tracked

Add a `.gitignore` entry for `*.tsbuildinfo` if missing.

---

## Phases

Phases are ordered by **dependency** and **risk**: cheapest/safest first, so
that if you run out of time, the morning state is still strictly better.

> **Wall-clock budget**: 4 hours total. Phases 1–7 should fit in ~90 min.
> Phases 8–9.5 in ~45 min. Phase 10 (plan-only) ~20 min. Phases 11–15 take
> what's left. If you're past 3h and only at Phase 9, **skip directly to
> Phase 17** (final report) — do not start phases you can't finish.

### Phase 1 — Root dirt (Goal 6, partial Goal 10)

Target: repo root + `references/` + `templates/` + obvious junk.

```bash
ARCHIVE_ROOT="$(cat ops/codex-cleanup-archive-path.txt)"

# Root dirt
rm -f ./88 ./This ./.DS_Store
rm -f ./studio-after-fix.png ./studio-initial.png \
      ./studio-selected.png ./studio-transparent-selected.png
# Restrict find scope so it never reaches archive/, .git/, .next/, .turbo/,
# .pnpm-store/, the vault, etc.
find apps packages docs scripts ideas ops -name '.DS_Store' -delete 2>/dev/null
find apps packages docs scripts ideas ops -name '*.tsbuildinfo' -delete 2>/dev/null
rm -f ./tsconfig.tsbuildinfo

# Add to .gitignore if missing
grep -qxF '*.tsbuildinfo' .gitignore || echo '*.tsbuildinfo' >> .gitignore
grep -qxF '.DS_Store' .gitignore || echo '.DS_Store' >> .gitignore

# References — archive first per Hard rule #2 (cross-filesystem: cp + git rm)
mkdir -p "$ARCHIVE_ROOT/references"
cp -R references "$ARCHIVE_ROOT/references"
git rm -r references

# Templates — verify nothing references it
grep -rn "templates/" --include='*.json' --include='*.ts' --include='*.tsx' \
  --include='*.mjs' --include='*.md' . 2>/dev/null \
  | grep -v node_modules | grep -v archive/ \
  > ops/codex-templates-refs.txt || true

# Remove templates/* from pnpm-workspace.yaml. macOS sed needs `-i ''` or
# `-i.bak`; verify the line is actually gone afterwards rather than trusting
# the regex.
BEFORE_LINES=$(grep -c 'templates/' pnpm-workspace.yaml || echo 0)
sed -i.bak '/templates\/\*/d' pnpm-workspace.yaml
rm -f pnpm-workspace.yaml.bak
AFTER_LINES=$(grep -c 'templates/' pnpm-workspace.yaml || echo 0)
if [ "$AFTER_LINES" -ge "$BEFORE_LINES" ]; then
  echo "FATAL: pnpm-workspace.yaml templates removal didn't take. Aborting phase."
  exit 1
fi

# Verify pnpm-lock.yaml has no templates/* workspace entries pinning real
# transitive deps (which would break frozen install after the workspace edit)
grep -n "^  '\?templates/" pnpm-lock.yaml > ops/codex-pnpm-lock-templates-refs.txt || true

mkdir -p "$ARCHIVE_ROOT/templates"
cp -R templates "$ARCHIVE_ROOT/templates"
git rm -r templates

# docs/placeholder.png (1.6MB)
git rm docs/placeholder.png 2>/dev/null || rm -f docs/placeholder.png

# Re-lock now that workspace globs changed (only place outside Phase 9.5
# that an install is allowed per Hard Rule #11 — workspace edit qualifies).
pnpm install
```

Validate with `pnpm install` (workspace change) and the gate. Commit:

```
chore: remove repo-root dirt, references/, templates/, debug screenshots
```

### Phase 2 — tools/ + playground purge (Goal 7)

Target: delete `tools/` and remove playground references in the registry
generator.

1. **Pre-flight: find EVERY reference to tools/.** This is broader than the
   3 known sites — there's also `knip.json`, `pnpm-lock.yaml`, freshness
   files, and possibly `turbo.json`:
   ```bash
   grep -rn "tools/playground\|/tools/\|tools/design-playground\|tools/obsidian-theme-radiants\|\"tools/" \
     --include='*.ts' --include='*.tsx' --include='*.mjs' --include='*.json' \
     --include='*.md' --include='*.yaml' . 2>/dev/null \
     | grep -v node_modules | grep -v archive/ > ops/codex-tools-refs.txt
   wc -l ops/codex-tools-refs.txt
   ```
2. **CRITICAL pre-flight: verify the registry generator does NOT import
   from `tools/`.** If it does, deleting `tools/` will break
   `pnpm registry:generate` and Phase 2 cannot recover.
   ```bash
   grep -rn "from.*['\"]\\.\\./\\.\\./tools\\|import.*tools/" \
     packages/radiants/scripts/ packages/radiants/registry/ 2>/dev/null
   # If any hits → STOP, document blocker, mark phase reverted, move to Phase 3.
   ```
3. **Edit (not delete) these known consumers:**
   - `packages/radiants/registry/__tests__/forced-state-source.test.ts` — the
     test has a defensive `if (existsSync(playgroundGlobalsPath))` wrapper.
     Remove the entire `playground` test block (it's already noted
     "playground was ejected").
   - `packages/radiants/generated/contract.freshness.json` — generated file.
     After `tools/` is archived and the generator confirmed clean,
     `pnpm registry:generate` will rewrite it.
   - `packages/radiants/DESIGN.md` — search for `tools/playground` (line ~1093)
     and remove that line/example.
   - `knip.json` — remove `tools/*` from the workspaces array if present.
   - `turbo.json`, root `package.json#scripts` — remove any tools-related
     scripts/pipelines.
4. Archive `tools/` (cross-filesystem):
   ```bash
   ARCHIVE_ROOT="$(cat ops/codex-cleanup-archive-path.txt)"
   mkdir -p "$ARCHIVE_ROOT/tools"
   cp -R tools "$ARCHIVE_ROOT/tools"
   git rm -r tools
   ```
5. Re-run `pnpm install` (workspace surface changed) then
   `pnpm registry:generate` to regenerate freshness without playground.
6. Validate. Commit:
   ```
   chore: remove tools/ and playground references from registry generator
   ```

### Phase 3 — scripts/ audit (Goal 5)

Target: `scripts/` at repo root. Files visible:
```
audit-style-authority.mjs        check-design-md-drift.mjs
export-emojis.py                 install-git-hooks-lib.mjs
install-git-hooks.mjs            lint-design-system-staged.mjs
lint-token-colors.mjs            registry-guard-lib.mjs
registry-guard.mjs               report-new-rdna-exceptions.mjs
vectorize-emojis.py              with-registry-guard.mjs
__tests__/
```

For each script:
- Cross-reference against `package.json` `scripts` and `.githooks/`
- If unreferenced AND `pnpm deadcode:check` flags it → archive
- `export-emojis.py` and `vectorize-emojis.py` look one-shot — archive unless
  referenced
- Document each surviving script's purpose in `scripts/README.md` (one line
  each)

Validate. Commit:
```
chore: audit scripts/, archive unused, document survivors
```

### Phase 4 — fonts/ cleanup (Goal 10)

Target: `/fonts/` at repo root. Inspect what's there vs. what's used.
- The canonical fonts live in `packages/radiants/fonts/`.
- Repo-root `fonts/` is likely a dumping ground.
- Cross-ref each font against `@font-face` declarations in
  `packages/radiants/fonts.css`, `fonts-core.css`, `fonts-editorial.css`.
- Unused fonts → archive. Used fonts that should be in the package → move,
  update `@font-face` paths, validate with a build.

If the entire `fonts/` directory is unreferenced, archive the whole folder.

Validate. Commit:
```
chore: consolidate root fonts/ into @rdna/radiants/fonts/
```

### Phase 5 — ops/ review + execute (Goal 8)

Target: `/Users/rivermassey/Desktop/dev/DNA-logo-maker/ops/` (NOT
`apps/rad-os/ops/`).

Subfolders: `cleanup-audit/`, `paper-assets/`, `sessions/`, `session-status.md`,
`bg21.jpg`.

For each item:
- `sessions/*.json` (~hundreds, 103 bytes each) — empty session stubs.
  Archive en masse, do not retain.
- `cleanup-audit/2026-04-21/`, `2026-04-25-todo-rollup/`,
  `design-md-audit/`, `docs-audit/` — read each `ROLLUP.md`. For each
  unfinished action item, decide:
   - "still relevant + actionable" → execute it now (small fixes only;
     anything > 30 LOC change becomes a row in the morning report instead)
   - "completed" or "superseded" → archive
   - "no longer relevant" → archive
- `paper-assets/item58/` — Paper exports queued for translation. Leave in
  place; flag in morning report whether translation is still needed.
- `session-status.md` — read; if stale, archive.
- `bg21.jpg` — investigate; archive if no reference.

Validate. Commit per logical sub-bucket:
```
chore(ops): archive completed cleanup-audit rollups
chore(ops): execute remaining tractable rollup actions
chore(ops): purge empty session stubs
```

### Phase 6 — ideas/ consolidate (Goal 9)

Target: `/ideas/` at repo root.

Structure:
```
ideas/brainstorms/        (10 files)
ideas/dnd-assets/         (4 PNGs)
ideas/html-spikes/        (8 HTML files)
ideas/spikes/             (1 file)
ideas/*.md                (4 top-level idea docs)
```

Steps:
1. **html-spikes/**: for each `*.html`, check if RadOS has a better
   implementation. Heuristics:
   - `corner-*` → covered by `packages/pixel/` and `packages/radiants/pixel-corners.*`
   - `dnd-table.html` → check `apps/rad-os/components/apps/` for a D&D app
   - `icon-audit.html` → covered by `packages/radiants/icons/`
   - `layout-lab-prototype.html` → likely covered by AppWindow island layouts
   - `pixel-corners-mask-test.html` and `pixel-corners-visual.html` → covered
   - `specimen-*.html` → covered by typography-playground / type-manual
   If covered in RadOS → archive. If not covered → keep, but move into
   `ideas/spikes/<name>/` with a one-paragraph `README.md` explaining what
   it spiked and the open question.
2. **brainstorms/**: for each, check if a corresponding implementation exists
   (search `apps/rad-os` and `packages/`). If implemented → archive. If not →
   normalize to the standard front-matter format used elsewhere (look at the
   newest non-archived brainstorm for the template).
3. **Top-level idea docs** (`*.md`): same pass — implemented? archive.
   Unimplemented? keep, normalize.
4. **dnd-assets/**: leave in place if any are referenced; archive otherwise.

Standard idea front-matter (use this format for survivors):
```yaml
---
title: <short title>
status: idea | spike | superseded
created: YYYY-MM-DD
related-impl: <path or "none yet">
---
```

Validate. Commit:
```
chore(ideas): archive implemented ideas, normalize survivors
```

### Phase 7 — archive/ mining (Goal 13)

Target: `/archive/` at repo root.

Spawn parallel sub-agents (or sequential read passes) — one per subfolder:
`brainstorms/`, `brainstorms-ideas-ops-audit-2026-04-25/`, `conversion/`,
`design-docs/`, `manifesto-iterations/`, `ops/`, `ops-cleanup-audit/`,
`plans/`, `production-readiness/`, `prompts/`, `qa/`, `rad-os/`, `reports/`,
`research/`.

Each agent's task: skim docs, surface anything that:
1. Has a non-obvious idea
2. Is NOT already implemented in `apps/rad-os/` or `packages/`
3. Is NOT already superseded by a newer doc

**Output: each sub-agent writes its own shard** at
`ideas/_archive-extract/<subfolder>.md`. Do NOT have parallel agents
write to a single shared file — they will clobber. The main agent
concatenates all shards into `ideas/_archive-extract.md` after all
sub-agents finish (sequential merge step).

**Do not move files out of `archive/`** — extract ideas to the new doc
instead.

**Cap on extractions per shard: 3.** This phase produces at most
~14 × 3 = 42 paragraphs. Anything more is over-extraction.

If nothing is worth keeping in a subfolder, write that explicitly:
> `archive/conversion/`: nothing actionable; webflow conversion already done.

Validate (no code changes here, but still run the gate). Commit:
```
docs(ideas): mine archive/ for unimplemented ideas
```

### Phase 8 — docs/ classify (Goal 11, part 1)

> **Note**: this phase only CLASSIFIES docs (read-only) and stages moves to
> a temp index. The actual archive moves and rewrites happen in Phase 15
> AFTER all code-changing phases (11–14) are done — otherwise we'd be
> truth-checking docs against an API that's still being finalized.

Target: `/docs/` at repo root.

Truth-check protocol: for each doc, read it and ask:
- "Does the codebase actually do this?"
- "Has this been superseded by a newer doc or by `packages/radiants/DESIGN.md`?"

Categorize each into:
- **Truth (keep, possibly update line numbers / paths)** — e.g.
  `theme-spec.md`, `production-readiness-checklist.md` (verify first),
  `corner-model.md`.
- **Stale fact (archive)** — anything contradicted by current code.
- **Valuable but unimplemented idea (move to `ideas/`)** — extract the idea,
  archive the original.

Special files:
- `docs/CODEMAP.md` (29.9KB) — regenerate or verify against current packages
  list. Codex may regenerate the package/app list section by reading
  `packages/*/package.json`.
- `docs/manifesto-draft.md`, `docs/manifesto-questions.md`,
  `docs/ship-pretty-or-die.md` — these are voice/narrative pieces, not specs.
  Leave alone unless clearly stale.
- `docs/git-commands-diagram.mmd` — keep if recent.
- `docs/plans/*` — for each plan, check status:
  - "shipped" → archive
  - "in flight" → keep, add status banner at top
  - "abandoned" → archive

Subfolders `docs/ops/`, `docs/research/`, `docs/solutions/`, `docs/upstreams/`
get the same pass.

**Output of this phase**: `ops/codex-docs-classification.json` with one
entry per doc:
```jsonc
{
  "docs/theme-spec.md": { "verdict": "keep", "notes": "" },
  "docs/CODEMAP.md": { "verdict": "regenerate", "notes": "regen pkg list" },
  "docs/plans/2026-03-30-tabs-coherent-refactor.md": { "verdict": "archive", "reason": "shipped" },
  "docs/manifesto-draft.md": { "verdict": "keep" },
  "ideas-extract": [
    { "from": "docs/research/foo.md", "idea": "<one paragraph>", "to": "ideas/<slug>.md" }
  ]
}
```

**Cap on idea extractions: 5 max.** Anything else stays in archive,
documented in morning report. Don't generate dozens of new `ideas/*.md`
overnight.

Validate (no code changes). Commit:
```
docs: classify docs/ contents (decisions in ops/codex-docs-classification.json)
```

The actual moves/rewrites happen in Phase 15.

### Phase 9 — Packages audit (Goals 3, 4 — pre-work)

Before finalizing any package, audit each one. **Read-only pass first.**

For each of `packages/{ctrl, monolith, pixel, preview, radiants}`:
1. Read `package.json`, `index.ts`/`index.css`, top-level files.
2. Run `pnpm --filter <pkg> exec tsc --noEmit` — record errors.
3. Run `pnpm --filter <pkg> test` if a test script exists.
4. Check for unused exports via knip output.
5. Identify "rough edges":
   - Missing/empty README
   - Files at top level that should be subpath'd
   - Exports listed in `package.json` that don't exist
   - Imports from sibling packages via relative paths instead of `@rdna/*`
   - Dead files
6. **Run the backwards-compat hunt greps scoped to this package** (see
   §"Backwards-compat hunt"). Record findings in the audit doc with a
   verdict per finding: `delete | migrate-and-delete | keep | uncertain`.

Write findings to `ops/codex-cleanup-package-audits/<pkg>.md`. Commit these
audit docs before doing any package edits:
```
docs(audit): per-package audit reports for radiants/pixel/ctrl/preview/monolith
```

### Phase 9.5 — Safe minor/patch dep bumps (NEW)

Target: `pnpm outdated -r` shows ~22 outdated packages. Greenfield repo means
we can safely bump SOME of them tonight, but **not all** — major bumps and
pre-1.0 minor bumps need human review.

#### Allowed autonomously (one commit per bump)

Patch and minor bumps **only**, and only on these:
- `turbo`
- `knip`
- `tailwindcss`, `@tailwindcss/postcss`
- `next` (within v16 line, no major)
- `react`, `react-dom` (patch only — no minor)
- `@types/*`
- `eslint`, `typescript-eslint`, `eslint-plugin-unused-imports`
- `vitest`
- `dependency-cruiser`
- Anything else in `devDependencies` with patch-only delta

#### FORBIDDEN — defer to morning report

- **Any major bump** (e.g., `@mantine/hooks` 8 → 9). Note in
  `state.deferred_to_human[]`.
- **Pre-1.0 minor bumps** (e.g., `@blocknote/core` 0.47 → 0.49). 0.x.y
  releases routinely break on minor.
- **`@chenglou/pretext`** (pre-1.0 + active editor — touches a lot of
  surface).
- Anything that would introduce a new peer-dep warning in the install log.
- Anything that requires a `@types/*` major bump in lockstep.

#### Procedure (per dep)

```bash
PKG='<name>'
TARGET='<new-version>'
# Bump only this package
pnpm update --interactive=false "$PKG@$TARGET" -r
# Validate immediately — don't batch bumps
pnpm lint 2>&1 | tail -20
pnpm test:ci 2>&1 | tail -20
pnpm build 2>&1 | tail -20
# If any fail → revert this single bump and skip
git checkout pnpm-lock.yaml '**/package.json'
# If all pass → commit
git add pnpm-lock.yaml '**/package.json'
git commit -m "chore(deps): bump $PKG to $TARGET"
```

If 3 consecutive bumps fail validation → stop the phase, document
remaining outdated deps in `state.deferred_to_human[]`, move to Phase 10.

If a bump passes but reveals a regression in a downstream phase, that
phase's revert handles it; do not retroactively touch this phase.

Validate. Commits per dep:
```
chore(deps): bump <name> X.Y.Z → X.Y.W
```

### Phase 10 — Plan @rdna/radiants split (Goal 2 — PLAN ONLY)

`@rdna/radiants` is the largest package. Splitting it is the highest-risk
goal in this run. **DO NOT START THE SPLIT.** Instead:

1. Read the current `package.json` `exports` field — it has 14+ subpaths
   (`/tokens`, `/components/core`, `/icons`, `/eslint`, `/registry`, `/meta`,
   `/patterns`, `/pixel-icons`, `/blocknote`, etc.).
2. Identify natural seams that could become separate packages:
   - Strong candidates: `@rdna/eslint-plugin-rdna` (currently
     `packages/radiants/eslint/`), `@rdna/icons`, `@rdna/patterns`,
     `@rdna/registry-tools`.
   - Marginal candidates: `@rdna/blocknote`, `@rdna/meta-types`.
   - Should stay coupled: tokens, base CSS, components/core, fonts.
3. For each candidate, evaluate:
   - **Coupling**: how many internal imports cross the seam?
   - **External consumers**: which apps/packages import it?
   - **Risk**: if extracted, what breaks?
4. Write the plan to `docs/plans/<today>-radiants-package-split.md` with:
   - Recommended target shape (which sub-packages, which exports)
   - Migration steps in dependency order
   - Per-step blast radius
   - "Safe to do now" subset (probably: just the eslint plugin extraction)
   - "Defer to human" subset (the rest)
5. **MACHINE HANDOFF**: write the safe subset (or `null`) to the state
   file as `radiants_split_safe_subset`. Phase 11 reads this and exits
   if `null`. Format:
   ```jsonc
   // ops/codex-cleanup-state.json
   "radiants_split_safe_subset": {
     "target": "eslint-plugin-extraction",
     "source_dir": "packages/radiants/eslint",
     "dest_pkg": "packages/eslint-plugin-rdna",
     "consumers_to_update": ["eslint.rdna.config.mjs", "<...>"]
   }
   // OR
   "radiants_split_safe_subset": null
   ```

**Do not execute the split.** Commit:
```
docs(plan): @rdna/radiants package split plan
```

### Phase 11 — Execute the safe split subset (Goal 2 — EXEC, gated)

**Pre-flight gate (machine-checkable):**
```bash
SAFE=$(node -e "console.log(JSON.stringify(require('./ops/codex-cleanup-state.json').radiants_split_safe_subset))")
if [ "$SAFE" = "null" ] || [ -z "$SAFE" ]; then
  echo "Phase 10 declared no safe subset; skipping Phase 11."
  # mark phase as 'skipped-by-design' in state, move on
  exit 0
fi
```

If the gate passes, proceed only if the safe subset satisfies ALL of:
- **Single directory extraction** (`git mv` of one folder, e.g.
  `packages/radiants/eslint/` → `packages/eslint-plugin-rdna/`).
- **No source-code edits inside the moved files** beyond import path
  rewrites.
- **≤ 10 import-path rewrites** in consumers across the repo.
- **No new public API surface** — exports added to the new package match
  exports previously exposed via `@rdna/radiants/eslint`.
- **All consumers internal to this repo.**

The most likely candidate: extract `packages/radiants/eslint/` into
`packages/eslint-plugin-rdna/` as `@rdna/eslint-plugin-rdna`. If you do
this:
1. `mkdir -p packages/eslint-plugin-rdna && git mv packages/radiants/eslint/* packages/eslint-plugin-rdna/`
2. Add `packages/eslint-plugin-rdna/package.json` with `name`,
   `version: 0.0.1`, `main: index.mjs`, `private: true`, `type: module`.
3. Update `packages/radiants/package.json` — remove the `./eslint` export
   entry. Do NOT leave a re-export shim (greenfield).
4. Update `eslint.rdna.config.mjs` and any `eslint.config.mjs` consumers
   to import from the new package name.
5. `pnpm install`.
6. `pnpm lint:design-system` to validate rules still load.

If anything fails: revert with `git revert HEAD` (and `cp -R` from archive
if files moved), stop the phase, mark as deferred in state, move to next
phase.

Validate. Commit:
```
refactor(@rdna): extract eslint plugin to @rdna/eslint-plugin-rdna
```

### "Finalize a package" — exit criteria (used by Phases 12 & 13)

A package is "finalized" when **all 8** of these pass:
1. `package.json` `exports` has no entries pointing at non-existent files.
   Verify with: `node -e "const p=require('./packages/<pkg>/package.json'); const fs=require('fs'); const e=p.exports||{}; Object.values(e).forEach(v=>{const f=typeof v==='string'?v:v.import||v.types; if(f&&!fs.existsSync('./packages/<pkg>/'+f.replace(/^\\.\\//,''))) throw new Error('Missing: '+f)})"`
2. `pnpm --filter @rdna/<pkg> exec tsc --noEmit` passes (or matches baseline).
3. `dist/`, `*.tsbuildinfo`, `.turbo/` all gitignored AND untracked.
4. README documents every exported subpath, fact-checked against
   `package.json#exports`.
5. Zero `console.log`/`console.debug` in source (test files exempt).
6. Zero `@deprecated`/`legacy`/`v1Compat`/`backwardCompat` markers
   (greenfield).
7. Zero exports flagged unused by knip (or each unused export documented
   in README as "public API for consumers").
8. No relative cross-package imports — sibling packages imported via
   `@rdna/*`.

If all 8 pass → commit `chore(@rdna/<pkg>): finalize`. If any fail →
document each failing criterion as a separate blocker in state, do NOT
commit a half-finalized package.

### Phase 12 — Finalize @rdna/pixel (Goal 3)

`packages/pixel/` is reportedly closer to "ready". Use the audit doc from
Phase 9 + the 8 exit criteria above as the punch list.

Implement only items that are:
- **Mechanical**: export-pointer cleanup, gitignore additions, console
  removal, README subpath documentation, compat-marker deletion.
- **Safe**: test fixes that don't change behavior, type-only changes.

Anything that requires a behavioral change to source → defer to morning
report. Do not refactor source to satisfy criteria.

Validate. Commit:
```
chore(@rdna/pixel): finalize package surface
```

### Phase 13 — Finalize ctrl, preview, monolith (Goal 4)

Same protocol as Phase 12, one commit per package, 8 exit criteria each:
```
chore(@rdna/ctrl): finalize package surface
chore(@rdna/preview): finalize package surface
chore(@rdna/monolith): finalize package surface (or remove if empty)
```

`@rdna/monolith` appears to be a stub (4 CSS files, README only). If it
has zero inbound imports across the repo (`grep -rn "@rdna/monolith"
apps/ packages/`), document in morning report and **defer the deletion**
— that's a strategy decision, not a cleanup decision.

### Phase 14 — rad-os audit (Goal 14)

Read-only audit of `apps/rad-os/`. Write findings to
`ops/codex-cleanup-package-audits/rad-os.md`:

- Dead code from knip
- Unused store slices in `store/`
- Unused hooks in `hooks/`
- Components in `components/apps/` that aren't registered in
  `lib/apps/catalog.tsx`
- ESLint exception expiries (`grep -rn 'eslint-disable.*expires:'`)
- Test files referencing deleted components (the git status shows several
  deleted components — verify their tests are also gone)
- **Backwards-compat cruft** (run the hunt greps scoped to `apps/rad-os/`).
  Greenfield project — any deprecated/legacy/v1 markers, fallback branches
  for removed features, or token aliases pointing at the same value should
  be deleted. `GoodNewsLegacyApp` is a real app name, not a shim — leave
  it alone.

For each finding, classify:
- **Mechanical fix** (e.g., delete an unused file, remove a dangling import)
  → fix it
- **Behavioral risk** (e.g., a component appears unused but might be lazy-loaded)
  → leave, document. Specifically check `lib/apps/catalog.tsx` for any
  `import('...')` dynamic imports — those WON'T appear in static-import
  graphs and may be the only reason a "dead" component exists.

Validate. Commit per bucket:
```
chore(rad-os): remove unused hooks/components flagged by knip
chore(rad-os): clean up tests for deleted components
```

### Phase 14a — Reconcile snapshot-commit deletions (NEW)

The setup-step snapshot commit (very first commit of this run) included
~50 in-flight edits, many of which are file deletions
(see git-status preamble listing `D` entries). After Phase 14's edits
land, verify nothing imports those deleted files and that no orphaned
test files reference them.

```bash
# Find files deleted in the snapshot commit
SNAPSHOT_SHA=$(git log --grep "snapshot pre-cleanup state" --format='%H' -n 1)
git show --diff-filter=D --name-only "$SNAPSHOT_SHA" \
  | grep -E '\.(ts|tsx)$' > ops/codex-snapshot-deletions.txt

# For each, check for surviving imports
while IFS= read -r f; do
  base=$(basename "$f" | sed 's/\.[^.]*$//')
  hits=$(grep -rn "from.*['\"].*$base['\"]" apps/ packages/ \
    --include='*.ts' --include='*.tsx' 2>/dev/null | wc -l)
  if [ "$hits" -gt 0 ]; then
    echo "ORPHAN IMPORTS: $f → $hits hits"
  fi
done < ops/codex-snapshot-deletions.txt > ops/codex-orphan-imports.txt
```

For each orphan import: either re-stub the file (if needed) or remove the
importing line (if the consumer should also be deleted). If unsure →
defer to morning report.

Validate. Commit:
```
chore(rad-os): reconcile imports orphaned by snapshot-commit deletions
```

### Phase 15 — Docs write-pass + package READMEs (Goals 11 & 12)

This phase has two parts. Code-changing phases are now complete, so docs
written here will reflect actual current API.

**Part A — Execute Phase 8's staged docs decisions.**

Read `ops/codex-docs-classification.json` and execute each verdict:
- `archive` → cp + git rm to vault
- `regenerate` → regenerate (esp. `docs/CODEMAP.md` package list)
- `keep` → no-op
- `ideas-extract[]` → write each as `ideas/<slug>.md` with front-matter

Commit per bucket:
```
docs: archive shipped plans (per Phase 8 classification)
docs: archive stale specs superseded by DESIGN.md
docs: regenerate CODEMAP package list
docs: extract <N> unimplemented ideas to ideas/
```

**Part B — Package READMEs.**

For each package (`radiants`, `pixel`, `ctrl`, `preview`, `monolith`):
write/rewrite the README to cover:

```markdown
# @rdna/<pkg>

<one-paragraph mission>

## Install

(internal workspace package — `"@rdna/<pkg>": "workspace:*"`)

## Usage

(minimal example, taken from a real consumer in `apps/rad-os/`)

## Public API

(list every exported subpath from `package.json#exports`, what it provides)

## Architecture

(brief — directory layout, key concepts)

## Development

(how to run tests, how to regenerate, gotchas)
```

Each README must be **fact-checked against current code**. Don't document
non-existent exports or imagined behavior.

Commit:
```
docs(packages): full READMEs for radiants/pixel/ctrl/preview/monolith
```

### Phase 16 — Vault sync (Goal 1)

Move outdated DOCS to the vault archive (this is the doc-archive part of
Goal 1; per-folder archiving from earlier phases already populated
`<ARCHIVE_ROOT>/`).

By this phase, `<ARCHIVE_ROOT>` should already contain everything you
archived. Final step:
1. `MANIFEST.md` at the archive root has every move logged.
2. Write a top-level `<ARCHIVE_ROOT>/README.md` summarizing the cleanup.
3. Verify the archive is on the vault filesystem (it lives outside the
   repo, so no commit needed). Print the archive root path in the morning
   report so the user can verify.

### Phase 17 — Morning report

Write `ops/codex-cleanup-morning-report.md`:

```markdown
# Codex Overnight Cleanup — <YYYY-MM-DD>

## TL;DR
- Phases completed: X / 17
- Commits: <count> (range: <first-sha>..<last-sha>)
- Branch: <branch-name>
- Archive: <full path>
- Net file count delta: -<n>
- LOC delta: -<n>

## What I did
(One bullet per phase, one sentence each.)

## What I deferred to you
(Bullet list with paths + why. This is the most important section.)

## Blockers I hit
(With reproduction steps and where I stopped.)

## Recommended next actions
1. Review the radiants split plan at <path> and approve scope
2. Decide on @rdna/monolith (keep stub or remove)
3. ...

## Files moved to archive (count by category)
- docs: <n>
- ops: <n>
- ideas/html-spikes: <n>
- ...

## Validation status
- pnpm lint: PASS / FAIL (<delta vs baseline>)
- pnpm test:ci: PASS / FAIL (<delta vs baseline>)
- pnpm build: PASS / FAIL (<delta vs baseline>)
```

Commit:
```
docs: codex overnight cleanup morning report
```

Then **stop**. Do not start a second pass without an explicit human
go-ahead.

---

## Sub-agent / parallelization guidance

Codex 5.5 supports `codex exec` for sub-tasks. Use parallel sub-agents only
where work is **read-only** or **partition-clean**:

- **Phase 7 (archive mining)** — one sub-agent per `archive/<subfolder>`,
  each writes a section to `ideas/_archive-extract.md`. Merge sequentially.
- **Phase 9 (package audits)** — one sub-agent per package, each writes its
  own audit file. No conflicts.
- **Phase 8 (docs read-pass)** — one sub-agent per `docs/<subfolder>`
  classifying files; you do the moves yourself sequentially to avoid commit
  races.

**Never parallelize**: phases that move/edit files (commit collisions).
**Never parallelize**: phases that share a build output (`pnpm registry:generate`).

**State file ownership**: only the main agent writes
`ops/codex-cleanup-state.json`. Sub-agents return their findings as JSON
in their final message; the main agent merges them into state. This
avoids the classic concurrent-write race where two sub-agents finishing
at the same time clobber each other's state updates.

---

## When to stop the entire run

Stop and write the morning report immediately if:
- **2 consecutive phases hit unrecoverable blockers** (was 5; tightened
  per safety review).
- `pnpm install` starts failing reproducibly across 2 attempts.
- A phase produces > 1000 file changes (likely a recursive move into a
  tracked path).
- You run out of disk in `_vault/` (`df -h "$ARCHIVE_ROOT"` shows < 1GB free).
- **Wall-clock budget exhausted.** The state file's `started` field is the
  start time. **Budget: 4 hours.** Stop when:
  ```bash
  STARTED=$(node -e "console.log(require('./ops/codex-cleanup-state.json').started)")
  ELAPSED_HRS=$(( ( $(date -u +%s) - $(date -u -j -f '%Y-%m-%dT%H:%M:%SZ' "$STARTED" +%s) ) / 3600 ))
  [ "$ELAPSED_HRS" -ge 4 ] && echo "BUDGET EXHAUSTED"
  ```
- **Mid-phase budget cutoff**: if the cutoff fires while a phase is in
  flight and uncommitted, `git stash push -u -m "codex-cutoff-$(date +%H%M)"`
  and skip directly to Phase 17. Note the stash name in the morning report.

---

## Final reminders

- One bucket = one commit. Conventional Commits.
- Archive, don't delete (except listed exceptions).
- State file updated after every phase.
- Validation gate after every phase.
- Plan-first for risky work; do NOT speculatively refactor.
- Morning report is the user's only window into the night — make it honest
  and complete.
- The user is asleep. Don't ask. Choose the conservative option.
- **Greenfield**: when you find backwards-compat code, delete it (and any
  callers in the same commit). Do not preserve compat shims "to be safe".
  "Conservative" here means "don't break the build", not "don't break
  imaginary external consumers" — there are none.
