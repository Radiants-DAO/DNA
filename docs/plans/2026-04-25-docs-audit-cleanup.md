# Docs Audit Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Clean up stale, misleading docs surfaced by `ops/cleanup-audit/docs-audit/ROLLUP.md` without mixing that work into the focused DESIGN.md rewrite.

**Scope:** This plan owns RadOS SPEC/README app inventory, CODEMAP drift, wrong-worktree plan deletion, and archive/delete triage from the docs audit. It does not implement the DESIGN.md generator and does not perform code refactors.

**Architecture:** Treat source files as authoritative. `apps/rad-os/lib/apps/catalog.tsx` owns app inventory. `packages/radiants/components/core/` owns component inventory. `docs/plans/` should contain active plans for this repo only; shipped, superseded, wrong-worktree, and stale planning artifacts should be archived or deleted as classified by the audit.

**Tech Stack:** Markdown, shell verification with `rg`, git moves/deletes.

---

## Phase 0: Orientation

### Task 0.1: Read the docs audit rollup

**Files:**
- Read: `ops/cleanup-audit/docs-audit/ROLLUP.md`
- Read: `ops/cleanup-audit/docs-audit/lane-1-root-docs.md`
- Read: `ops/cleanup-audit/docs-audit/lane-2-app-package-docs.md`
- Read: `ops/cleanup-audit/docs-audit/lane-3-plans-triage.md`
- Read: `ops/cleanup-audit/docs-audit/lane-4-loose-docs.md`
- Read: `ops/cleanup-audit/docs-audit/lane-5-brainstorms-ideas-ops.md`

**Step 1:** Confirm the three urgent drift sites:
- `apps/rad-os/SPEC.md`
- `packages/radiants/DESIGN.md`
- `docs/plans/` wrong-worktree files

**Step 2:** Confirm DESIGN.md work is handled by `docs/plans/2026-04-25-design-md-rewrite.md`, not this plan.

**Step 3:** Commit nothing during orientation.

---

## Phase A: Critical stale docs

### Task A.1: Rewrite RadOS SPEC app inventory

**Files:**
- Modify: `apps/rad-os/SPEC.md`
- Reference: `apps/rad-os/lib/apps/catalog.tsx`

**Step 1:** Remove stale app claims for removed/renamed app windows:
- Calendar
- Links as an app window
- Settings
- Murder Tree
- Auctions
- Rad Radio as a launchable AppWindow

**Step 2:** Replace with a catalog-backed inventory section.

At execution time, read `APP_CATALOG` and document the current entries, including:
- id;
- window title;
- category;
- desktop visibility;
- subtabs when present.

As of the latest factual review, `APP_CATALOG` has 8 desktop-visible entries: `brand`, `lab`, `pixel-lab`, `scratchpad`, `hackathon-exe`, `good-news`, `about`, and `manifesto`. Do not use the older audit wording that said 7 apps.

**Step 3:** Add a note that Radio is taskbar-hosted, not an `APP_CATALOG` window entry.

**Step 4:** Verify stale app names are gone except where clearly historical.
```bash
rg -n "Calendar|Murder Tree|Auctions|Rad Radio|Settings" apps/rad-os/SPEC.md
```

**Step 5:** Commit.
```bash
git add apps/rad-os/SPEC.md
git commit -m "docs(rad-os): refresh SPEC app inventory"
```

---

### Task A.2: Rewrite RadOS README current surface

**Files:**
- Modify: `apps/rad-os/README.md`
- Reference: `apps/rad-os/lib/apps/catalog.tsx`

**Step 1:** Replace the stale app list with current `APP_CATALOG` entries.

**Step 2:** Remove dead references to `pattern-playground` and `typography-playground`.

**Step 3:** Replace absolute `/Users/rivermassey/Desktop/dev/DNA/...` links with repo-relative paths.

**Step 4:** Commit.
```bash
git add apps/rad-os/README.md
git commit -m "docs(rad-os): refresh README current surface"
```

---

### Task A.3: Refresh CODEMAP app and component inventory

**Files:**
- Modify: `docs/CODEMAP.md`
- Reference: `packages/radiants/components/core/`

**Step 1:** Remove stale RadOS app/component references.

Current CODEMAP still needs to be checked for stale entries such as `LinksApp`, `RadRadioApp`, `typography-playground`, `music`, `links`, and old `studio` assumptions. Replace RadOS app inventory with `APP_CATALOG` truth.

**Step 2:** Count current component directories, excluding support directories.
```bash
find packages/radiants/components/core -mindepth 1 -maxdepth 1 -type d ! -name '__tests__' ! -name '_shared' | sort
```

Expected component-like directory count at the last factual review: 42. If the command returns a different count, use the command output and note that the inventory was refreshed against current source.

**Step 3:** Update CODEMAP's component count and table.

Keep descriptions terse and avoid inventing behavior. If uncertain, use the component name and local filenames as the source of truth.

**Step 4:** Commit.
```bash
git add docs/CODEMAP.md
git commit -m "docs: refresh CODEMAP component inventory"
```

---

## Phase B: Plans and stale artifacts

### Task B.1: Delete wrong-worktree plans

**Files:**
- Delete: `docs/plans/2026-03-27-rdna-controls-library.md`
- Delete: `docs/plans/2026-03-28-control-density-modes.md`
- Delete: `docs/plans/2026-03-28-pretext-editor-backend.md`
- Delete: `docs/plans/2026-03-28-pretext-editor-frontend.md`
- Delete: `docs/plans/2026-03-29-pretext-standalone-panel.md`

**Step 1:** Find current links to these files.
```bash
rg -n "2026-03-27-rdna-controls-library|2026-03-28-control-density-modes|2026-03-28-pretext-editor-backend|2026-03-28-pretext-editor-frontend|2026-03-29-pretext-standalone-panel" docs apps packages
```

As of the factual review, `docs/rdna-ctrl-handoff.md` links `docs/plans/2026-03-28-control-density-modes.md`, and the plans may cross-link each other.

**Step 2:** Update or remove active-doc links before deleting the target files.

**Step 3:** Delete the five files.

**Step 4:** Commit.
```bash
git add docs/plans
git commit -m "docs: remove wrong-worktree plans"
```

---

### Task B.2: Archive shipped and superseded plans

**Files:**
- Move to `archive/plans/`:
  - `docs/plans/2026-03-29-appwindow-taskbar-api.md`
  - `docs/plans/2026-03-29-pretext-migration-phase1-foundation.md`
  - `docs/plans/2026-03-30-appwindow-island-layouts.md`
  - `docs/plans/2026-04-14-ui-library-three-column.md`
  - `docs/plans/2026-03-31-pixel-art-engine.md`

**Step 1:** Re-check each file against `ops/cleanup-audit/docs-audit/ROLLUP.md` before moving.

**Step 2:** Find and update active references before moving.
```bash
rg -n "2026-03-29-appwindow-taskbar-api|2026-03-29-pretext-migration-phase1-foundation|2026-03-30-appwindow-island-layouts|2026-04-14-ui-library-three-column|2026-03-31-pixel-art-engine" docs apps packages
```

As of the factual review, active docs still reference at least `2026-03-29-pretext-migration-phase1-foundation.md`, `2026-03-29-appwindow-taskbar-api.md`, and `2026-03-31-pixel-art-engine.md`.

**Step 3:** Move files with `git mv`.

**Step 4:** Commit.
```bash
git add docs/plans archive/plans
git commit -m "docs: archive shipped and superseded plans"
```

---

### Task B.3: Archive decided brainstorms

**Files:**
- Move decided brainstorms listed in `ops/cleanup-audit/docs-audit/ROLLUP.md` to an archive location.

**Step 1:** Reconcile the rollup and lane-5 archive lists before moving anything.

The rollup and lane report are not identical; lane 5 also classified `ideas/brainstorms/2026-03-03-land-finder-app-brainstorm.md` as archivable. Make one explicit archive list in the commit message or checklist.

**Step 2:** Use one archive destination for this audit batch, such as `archive/brainstorms-ideas-ops-audit-2026-04-25/`, unless the owner chooses the existing `archive/brainstorms/` structure.

**Step 3:** Preserve filenames under the chosen archive folder.

**Step 4:** Commit.
```bash
git add docs/brainstorms ideas/brainstorms archive/brainstorms
git commit -m "docs: archive decided brainstorms"
```

---

### Task B.4: Archive or delete loose stale docs

**Files:**
- Move/archive/delete only files classified by `ops/cleanup-audit/docs-audit/ROLLUP.md`.

**Step 1:** Archive:
- `docs/manifesto-draft.md`
- `docs/manifesto-questions.md`
- `docs/corner-generation.md`

**Step 2:** Split `docs/rdna-ctrl-handoff.md` only if you are ready to preserve live architecture content; otherwise leave it and record the decision needed.

**Step 3:** Delete stale spike artifacts only if still present and unreferenced:
- `ops/note-tile-test.md`
- `ideas/spikes/canvas-patterns.md`
- `ideas/spikes/type-playground-wireframes/`

**Step 4:** Commit.
```bash
git add docs ideas ops archive
git commit -m "docs: archive stale loose docs and spikes"
```

---

### Task B.5: Archive completed ops cleanup directories

**Files:**
- Move/archive: `ops/cleanup-audit/coordinator/`
- Move/archive: `ops/cleanup-audit/css-overscope/`
- Move/archive: `ops/cleanup-audit/stage1/`
- Move/archive: `ops/cleanup-audit/string-prop-audit.md`
- Move/archive: `ops/skills-cleanup/`

**Step 1:** Confirm each path still exists.

**Step 2:** Move the paths to the chosen archive destination for this audit batch.

**Step 3:** Verify active docs do not reference the old paths.

**Step 4:** Commit.
```bash
git add ops archive
git commit -m "docs: archive completed cleanup ops artifacts"
```

---

## Phase C: Decision-needed docs

### Task C.1: Create a decision checklist

**Files:**
- Create: `docs/plans/2026-04-25-docs-decision-checklist.md`

**Step 1:** Copy the "Files needing your decision" list from `ops/cleanup-audit/docs-audit/ROLLUP.md`.

**Step 2:** Add three columns:
- `Keep`
- `Archive`
- `Delete`

**Step 3:** Commit.
```bash
git add docs/plans/2026-04-25-docs-decision-checklist.md
git commit -m "docs: add docs cleanup decision checklist"
```

---

## Phase D: Validation

### Task D.1: Final docs sanity checks

**Step 1:** Verify urgent stale strings are gone from current docs where expected.
```bash
rg -n "Murder Tree|Auctions|pattern-playground|typography-playground|/Users/rivermassey/Desktop/dev/DNA/" docs apps packages
```

**Step 2:** Verify archived/deleted files are not still linked from active docs.

**Step 3:** Self-review.
```bash
git diff main...HEAD --stat
```

---

## Open questions before execute

1. Should SPEC/README app inventory be generated from `APP_CATALOG` in a future plan, or should hand-maintained lists be minimized?
2. Which archive subfolder structure should be used for brainstorms and loose docs?
3. Should `docs/rdna-ctrl-handoff.md` be split now or deferred?
