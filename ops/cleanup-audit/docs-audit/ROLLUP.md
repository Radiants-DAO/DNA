# Docs Audit — Rollup

**Audit date:** 2026-04-25
**Branch:** `feat/logo-asset-maker`
**Scope:** all `*.md` outside `/archive/` and `node_modules/` — root docs, app/package docs, plans, brainstorms, ideas, ops.
**Method:** 5 parallel Explore agents, one per lane. Reports live alongside this file at `ops/cleanup-audit/docs-audit/lane-{1..5}-*.md`.

---

## Headline

The docs are in worse shape than they look. Most files were "touched" today by an auto-commit, but a lot of the content is **months out of date**. The damage is concentrated in three places:

1. **`apps/rad-os/SPEC.md`** — 70% of the documented app inventory has been removed/renamed. Painfully stale.
2. **`packages/radiants/DESIGN.md`** — typography table says `text-xs = 8px` but generated tokens (regenerated 2026-04-19) say **10px**. This will cause UI bugs for anyone reading the spec.
3. **`docs/plans/`** — 5 plans reference the wrong worktree (`/Users/rivermassey/Desktop/dev/DNA`, not the logo-maker repo). They've been rotting in this repo since 2026-03-27.

Everything else is fixable in a few hours; these three are the urgent ones.

---

## Top drift offenders (ranked by harm)

| # | File | Drift | Severity |
|---|------|-------|----------|
| 1 | `apps/rad-os/SPEC.md` | Lists Calendar, Links, Settings, Murder Tree, Auctions, Rad Radio as apps. Missing Lab, Scratchpad, Good-News. ~70% wrong. | ❌ Critical |
| 2 | `packages/radiants/DESIGN.md` (Typography table, lines 372–379) | `text-xs = 8px` (should be 10px). Other rows wrong too. Generated tokens are the source of truth. | ❌ Critical |
| 3 | `docs/CODEMAP.md` | Claims 33 components in `components/core/`. Actual: 44. Component table is missing 10 entries. | ⚠️ High |
| 4 | `docs/theme-spec.md` | Claims `vercel-labs/json-render` is the runtime format — it's not integrated. Color-mode flexibility overstated. | ⚠️ High |
| 5 | `apps/rad-os/README.md` | App list claims 4 apps; catalog has 7. References dead `pattern-playground` / `typography-playground`. | ⚠️ High |
| 6 | 5 plans referencing `/Users/rivermassey/Desktop/dev/DNA` worktree | Wrong-repo plans rotting in logo-maker. | ⚠️ High |
| 7 | `docs/manifesto-{draft,questions}.md` | Treats Radiants as aspirational; canonical form has moved into `apps/rad-os/components/apps/manifesto/`. | 📦 Archive |
| 8 | `docs/corner-generation.md` + `docs/pixel-corners.md` | Pre-implementation planning, superseded by `corner-model.md` and `packages/pixel/PIXEL-CORNERS.md`. | 📦 Archive |
| 9 | `docs/production-readiness-checklist.md` | Confusingly duplicated with `archive/reports/2026-03-27-production-readiness-checklist.md`. | 🔀 Consolidate |
| 10 | `docs/rdna-ctrl-handoff.md` | Dated handoff doc (2026-04-14) with status claims that already need refresh. | 📦 Split: archive handoff, keep architecture |

---

## Pattern: why so much drift?

Several root causes recur across lanes:

1. **No sync hook between code and docs.** `apps/rad-os/lib/apps/catalog.tsx` is the live source of truth for the app inventory; SPEC.md and README.md duplicate it manually and have drifted.
2. **Generated tokens vs. hand-written tables.** `packages/radiants/generated/typography-tokens.css` is auto-generated; DESIGN.md's typography table is hand-maintained and out of sync.
3. **Wrong-worktree plans.** Multiple plans were authored in/about a separate `/Users/rivermassey/Desktop/dev/DNA` worktree but committed in this repo.
4. **Aspirational specs presented as current.** `theme-spec.md` describes json-render integration that never happened.
5. **Brainstorm/plan/implementation loop incomplete.** Many brainstorms produced plans, plans shipped, but the brainstorms and superseded plans were never archived.

---

## Action plan

Three buckets, ranked by reversibility and value.

### A. Fix the three critical drift sites (do first, ~90 min total)

| Task | File | Effort |
|------|------|--------|
| Update typography table to match generated tokens (`text-xs: 10px`, etc.) and add a "source of truth: generated/typography-tokens.css" pointer | `packages/radiants/DESIGN.md` | 15 min |
| Rewrite or replace SPEC.md app inventory from `apps/rad-os/lib/apps/catalog.tsx` (or just delete and let README.md own it) | `apps/rad-os/SPEC.md` | 30 min |
| Update CODEMAP.md component count + complete component table | `docs/CODEMAP.md` | 30 min |
| Update README.md app list to match catalog (7 apps); kill references to pattern-playground/typography-playground | `apps/rad-os/README.md` | 15 min |

### B. Archive shipped/superseded work (medium-impact cleanup, ~60 min)

**Plans to archive** (move to `/archive/plans/`):
- `2026-03-29-appwindow-taskbar-api.md` — shipped
- `2026-03-29-pretext-migration-phase1-foundation.md` — author marked stale
- `2026-03-30-appwindow-island-layouts.md` — shipped
- `2026-04-14-ui-library-three-column.md` — shipped (commit `f7f0e36d`)
- `2026-03-31-pixel-art-engine.md` — superseded by `2026-04-15-pixel-art-system-plan-rewrite-from-stash.md`

**Brainstorms to archive** (decided → plan exists):
- `docs/brainstorms/2026-03-29-rados-pretext-migration-brainstorm.md`
- `docs/brainstorms/2026-04-18-colors-tab-refactor-brainstorm.md`
- `docs/brainstorms/2026-04-18-logo-asset-maker-brainstorm.md`
- `docs/brainstorms/2026-04-18-pixel-playground-brainstorm.md`
- `docs/brainstorms/2026-04-24-pixel-dither-brainstorm.md`
- `ideas/brainstorms/2026-03-16-playground-ops-skill-brainstorm.md`
- `ideas/brainstorms/2026-03-26-control-surface-brainstorm.md`
- `ideas/brainstorms/2026-03-27-rdna-controls-library-brainstorm.md`
- `ideas/brainstorms/2026-03-28-pretext-layout-editor-brainstorm.md`
- `ideas/brainstorms/2026-03-29-appwindow-taskbar-api-brainstorm.md`

**Loose docs to archive:**
- `docs/manifesto-draft.md` + `docs/manifesto-questions.md` → `archive/manifesto-iterations/`
- `docs/corner-generation.md` → `archive/design-docs/pixel-system-iterations/`
- `docs/rdna-ctrl-handoff.md` → `archive/handoffs/2026-04-14-ctrl-handoff.md` (extract architecture rules to a separate doc first)

**Ops subdirs to archive:**
- `ops/cleanup-audit/coordinator/` — pre-implementation planning, complete
- `ops/cleanup-audit/css-overscope/` — 24-lane audit complete (2026-04-20)
- `ops/cleanup-audit/stage1/` (+ `string-prop-audit.md`) — agent dispatch complete (2026-04-18)
- `ops/skills-cleanup/` — inventory + reports complete

### C. Delete outright (zero value, ~10 min)

**Plans for the wrong worktree** (these were never meant to live in logo-maker):
- `docs/plans/2026-03-27-rdna-controls-library.md`
- `docs/plans/2026-03-28-control-density-modes.md`
- `docs/plans/2026-03-28-pretext-editor-backend.md`
- `docs/plans/2026-03-28-pretext-editor-frontend.md`
- `docs/plans/2026-03-29-pretext-standalone-panel.md`

**Stale spike artifacts:**
- `ops/note-tile-test.md` — smoke-test artifact, marked safe to delete
- `ideas/spikes/canvas-patterns.md` — orphaned reference
- `ideas/spikes/type-playground-wireframes/` — stale spike

### D. Files needing your decision (no clear archive vs. delete signal)

These need your call before any action:

- `docs/plans/2026-03-31-appwindow-container-audit.md` — spec or stale review note?
- `docs/plans/2026-04-15-monorepo-cleanup-orchestration.md` — living template or past attempt?
- `docs/plans/2026-04-18-radio-rebuild.md` — placeholder, spec, or done?
- `docs/plans/2026-04-19-pixel-authoring-preparation-unification.md` overlaps `2026-04-15-pixel-art-system-plan-rewrite-from-stash.md` — merge or pick one?
- `ideas/2026-03-07-rados-agent-native-desktop-architecture.md` — alive or descoped?
- `ideas/radmark-chrome-extension.md` — alive or descoped?
- `ideas/rados-postprocessing-pipeline.md` — alive or descoped?
- `ideas/rados-v2-vfs-architecture.md` — alive or descoped?
- `ideas/brainstorms/2026-04-11-moodboard-canvas-app-brainstorm.md` — alive or descoped?
- `ideas/brainstorms/2026-04-12-rad-tab-chrome-extension-brainstorm.md` — alive or descoped?
- `docs/plans/2026-04-11-skills-cleanup.md` — was it executed? check git for skill-deletion commits

### E. Keep as-is (already current)

- `/README.md`
- `/CLAUDE.md`
- `/docs/README.md`
- `/apps/rad-os/CLAUDE.md`
- `/apps/rad-os/design.md` (symlink to DESIGN.md)
- `/packages/radiants/CLAUDE.md`
- `/packages/pixel/PIXEL-CORNERS.md`
- `/docs/corner-model.md`
- `/docs/rad-os-authoring.md`
- `/docs/git-commands-diagram.mmd`
- `/docs/ship-pretty-or-die.md` *(but extract the Pretext Browser Smoke Checklist out to `apps/rad-os/components/apps/scratchpad/__tests__/`)*
- 12 active plans (logo-asset-maker, pixel-playground, pixel-dither, colors-tab, etc.)
- 3 still-relevant brainstorms (pixel-art-system, dither-pipeline, studio-tabs-animation)
- ops subdirs: `2026-04-21/`, `2026-04-25-todo-rollup/`, `design-md-audit/`, `docs-audit/`

---

## Suggested order of operations

1. **Now:** Apply the 4 critical fixes from bucket A (typography table, SPEC.md, CODEMAP.md, README.md). ~90 min.
2. **Next:** Delete bucket C in one commit (5 wrong-worktree plans + 3 stale spikes + note-tile-test). ~10 min, fully reversible via git.
3. **Then:** Mass-archive bucket B in a single commit so the move is atomic and traceable. Decide on `/archive/` substructure first (`/archive/plans/`, `/archive/brainstorms/`, `/archive/manifesto-iterations/`, etc.).
4. **Convene:** Walk through bucket D as a list and make 11 quick decisions.
5. **Finally:** Update active plan status sections (4 plans flagged as "active but stale" — pretext-authoring-primitives, pixel-corners-consumer-migration, pixel-art-system-rewrite, pixel-authoring-preparation-unification).

---

## Process recommendations

To keep this from happening again:

1. **Make `apps/rad-os/lib/apps/catalog.tsx` the only source for app inventory.** Either remove the duplicated lists in README/SPEC, or generate them from catalog at build time. Don't hand-maintain three copies.
2. **Lock DESIGN.md typography to generated tokens.** Either auto-generate the table or add a CI check that diffs it against `generated/typography-tokens.css`.
3. **Add `Last Verified: YYYY-MM-DD` headers** to docs with embedded status claims (rdna-ctrl-handoff, pixel-corners, production-readiness-checklist) so rot is visible.
4. **Move "DONE → archive" into a hook.** When a plan's top-level summary contains `Status: DONE` (or equivalent), auto-suggest moving it to `/archive/plans/` on commit.
5. **Distinguish portable spec from RDNA implementation.** `theme-spec.md` should declare itself aspirational/portable; `packages/radiants/DESIGN.md` should declare itself the implementation reference. Today both blur into each other.

---

## File index

- [`lane-1-root-docs.md`](lane-1-root-docs.md) — README, CLAUDE, docs/README, CODEMAP, theme-spec
- [`lane-2-app-package-docs.md`](lane-2-app-package-docs.md) — apps/rad-os/* and packages/* docs
- [`lane-3-plans-triage.md`](lane-3-plans-triage.md) — 26 plans classified DONE/ACTIVE/DEAD/SUPERSEDED
- [`lane-4-loose-docs.md`](lane-4-loose-docs.md) — 9 loose `/docs/*.md` files + Mermaid diagram
- [`lane-5-brainstorms-ideas-ops.md`](lane-5-brainstorms-ideas-ops.md) — brainstorms, ideas, ops state
