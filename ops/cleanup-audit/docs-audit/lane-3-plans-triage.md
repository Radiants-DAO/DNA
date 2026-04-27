# Plans Directory Triage — `/docs/plans/` Status Audit
**Date:** 2026-04-25  
**Scope:** 26 plan files (2026-03-27 through 2026-04-24); excludes `/archive/plans/` (intentionally out of scope)  
**Assessment method:** git history, file skimming (Status/summary sections), implementation verification via `find`/`ls`

---

## Individual Plan Statuses

- **2026-03-27-rdna-controls-library.md** — 🪦 DEAD — Refers to a separate DNA worktree `/Users/rivermassey/Desktop/dev/DNA` on `feat/rdna-controls`; this repo is DNA-logo-maker (different context); plan superseded by control-density work or abandoned branch.

- **2026-03-28-control-density-modes.md** — 🪦 DEAD — Proposes phase-0 donor UI imports and control-density CSS layer; no evidence of execution in logo-maker repo; references `/Users/rivermassey/Desktop/dev/DNA/tools/playground` (external). Likely belongs in different worktree.

- **2026-03-28-pretext-editor-backend.md** — 🪦 DEAD — Depends on `@rdna/controls` shell (Task 2 from rdna-controls-library); plan incomplete due to missing prerequisite; should be deleted or moved to archive pending controls library completion elsewhere.

- **2026-03-28-pretext-editor-frontend.md** — 🪦 DEAD — Frontend counterpart to backend plan; depends on non-existent backend and `@rdna/controls` P0; same status as backend — incomplete prerequisite chain.

- **2026-03-29-appwindow-taskbar-api.md** — ✅ DONE — Worktree reference indicates separate DNA branch; feature appears shipped in AppWindow.tsx (Nav/Toolbar/Content compound children documented). Plan can be archived.

- **2026-03-29-pretext-migration-phase1-foundation.md** — ✅ DONE — Status section (line 15) states "foundation has already been carried forward"; marked stale with current pretext work moved to authoring/runtime. Safe to archive.

- **2026-03-29-pretext-standalone-panel.md** — 🪦 DEAD — Vanilla TS factory pattern for ShadowDOM panels; no corresponding implementation in logo-maker repo; references external flow sandbox. Belongs in separate DNA context.

- **2026-03-30-appwindow-island-layouts.md** — ✅ DONE — AppWindow.Island + AppWindow.Content layout system; verified live in AppWindow.tsx (Island, Content compound children); git history shows no edits since 2026-04-14 merge. Shipped and stale.

- **2026-03-30-tabs-coherent-refactor.md** — 🚧 ACTIVE — Targets Tabs refactor via CVA + data attributes (zero render branching); git log shows last edit 2026-03-30 but plan references separate `feat/tabs-refactor` worktree. Status unclear; recommend spot-check on other DNA branches.

- **2026-03-31-appwindow-container-audit.md** — ❓ UNCLEAR — Audit document only (no implementation tasks); describes current vs ideal DOM structure; unclear if it's a spec, a review note, or an incomplete plan. Recommend clarify intent.

- **2026-03-31-pixel-art-engine.md** — 🔀 SUPERSEDED-BY: 2026-04-15-pixel-art-system-plan-rewrite-from-stash.md — v1 engine plan dated 2026-03-31; newer "rewrite-from-stash" dated 2026-04-15 references this as prior work. Older version should be archived.

- **2026-04-03-pretext-authoring-primitives.md** — 🚧 ACTIVE — Scratchpad as markdown-first authoring studio + shared pretext primitives (editorial/broadsheet/book); plan scope matches current active work (GoodNews, Manifesto migration). Checklist and implementation details present but status section needs update.

- **2026-04-08-control-surface-primitives.md** — 🚧 ACTIVE — Styleguide/reference doc (not a task plan) — lists 30+ control types (knob, fader, XY pad, etc.) with checkmarks; serves as inventory for control system. Not a traditional implementation plan; keep as reference unless intent changes.

- **2026-04-11-pixel-corners-consumer-migration.md** — 🚧 ACTIVE — Migrate 115 `pixel-rounded-*` CSS usages to `<PixelBorder>` component; prerequisite (PixelBorder rewrite) already shipped. Plan in execution phase; multiple stale checklist items (consumers per file). Needs update to reflect current progress.

- **2026-04-11-skills-cleanup.md** — ❓ UNCLEAR — Orchestration plan for auditing Claude skills across global/project scopes; marked as docs-only in a pixel-art worktree. Unclear if executed; recommend check git history for actual skill deletion commits.

- **2026-04-14-pixel-mask-architecture.md** — 🚧 ACTIVE — Build CSS mask tokens + static 1-bit icon primitive + animated transition primitive; live dither implementation exists (`packages/pixel/src/dither/`), mask.ts present. Plan in progress; checklist needs verification.

- **2026-04-14-ui-library-three-column.md** — ✅ DONE — UILibraryTab refactor replacing DesignSystemTab; git log shows commit `f7f0e36d` "feat(rad-os): UI Library 3-column viewer" matches plan scope. Implementation shipped; plan can be archived.

- **2026-04-15-monorepo-cleanup-orchestration.md** — ❓ UNCLEAR — Meta-plan for coordinating parallel cleanup agents without conflicts. Describes a workflow, not specific tasks. Unclear if this is a living framework or a past attempt. Recommend decision: keep as template or delete.

- **2026-04-15-pixel-art-system-plan-rewrite-from-stash.md** — 🚧 ACTIVE — Replacement for 2026-03-31 engine plan; unifies corner/pattern/icon authoring + preparation pipeline. Most recent and detailed pixel roadmap. Extensive checklist; last edited 2026-04-19. Major active work.

- **2026-04-18-colors-tab-refactor.md** — 🚧 ACTIVE — Fibonacci spiral mosaic for brand colors + semantic audit; worktree is logo-maker, branch feat/logo-asset-maker. No Colors tab visible in current repo but plan is detailed. Status unclear; recommend verify if BrandAssetsApp has color sub-tab or if this is planned-but-deferred.

- **2026-04-18-logo-asset-maker.md** — 🚧 ACTIVE — Logo asset maker replacing static preset grid in BrandAssetsApp Logos tab; **LogoMaker.tsx exists** (`apps/rad-os/components/apps/brand-assets/LogoMaker.tsx`); architecture matches plan. Implementation in progress (last edited 2026-04-19). Active work on current branch.

- **2026-04-18-pixel-playground.md** — 🚧 ACTIVE — Pixel tab (1-bit editor) in BrandAssetsApp; **directory exists** (`apps/rad-os/components/apps/pixel-playground/`); plan references this branch (feat/logo-asset-maker). Implementation underway.

- **2026-04-18-radio-rebuild.md** — 🚧 ACTIVE — Music app rebuild (Radio app) side-by-side with RadRadioApp; simple spec (not task-based plan); references Paper design + Zustand audio store. Unclear execution status; brief scope suggests possible placeholder or completed work. Recommend clarify intent.

- **2026-04-19-pixel-authoring-preparation-unification.md** — 🚧 ACTIVE — Replace pre-launch corner/pattern/icon implementations with unified author → prepare → materialize pipeline; most recent pixel strategy (dated 2026-04-19). Detailed checklist; directly overlaps with pixel-art-system rewrite. Recommend merge or clarify relationship.

- **2026-04-20-bitgrid-editor.md** — 🚧 ACTIVE — Replace Dotting-based OneBitCanvas with small purpose-built BitGridEditor (SVG grid, pure bitstring state, undo/redo); spec is detailed; no implementation directory found in pixel-playground. New component planned but not yet built. Likely next task after pixel-playground base.

- **2026-04-24-pixel-dither.md** — 🚧 ACTIVE — Bayer-matrix 1-bit density ramps via `@rdna/pixel/dither` submodule; **dither directory exists** with bayer.ts, prepare.ts, ramp.ts, types.ts; AppWindow chrome gradient planned replacement. Implementation in flight (last edited 2026-04-24 — most recent file).

---

## Roll-Up Summary

### Counts by Status
- ✅ **DONE:** 4 files (taskbar-api, pretext-migration-phase1, appwindow-island-layouts, ui-library-three-column)
- 🚧 **ACTIVE:** 12 files (pretext-authoring-primitives, control-surface-primitives, pixel-corners-consumer-migration, pixel-mask-architecture, pixel-art-system-rewrite, colors-tab-refactor, logo-asset-maker, pixel-playground, radio-rebuild, pixel-authoring-preparation-unification, bitgrid-editor, pixel-dither)
- 🪦 **DEAD:** 6 files (rdna-controls-library, control-density-modes, pretext-editor-backend, pretext-editor-frontend, pretext-standalone-panel, pixel-art-engine)
- 🔀 **SUPERSEDED:** 1 file (pixel-art-engine → pixel-art-system-rewrite)
- ❓ **UNCLEAR:** 3 files (appwindow-container-audit, skills-cleanup, monorepo-cleanup-orchestration, radio-rebuild)

### Files to ARCHIVE (move to `/archive/plans/`)
1. `2026-03-29-appwindow-taskbar-api.md` — Feature shipped; refers to separate worktree.
2. `2026-03-29-pretext-migration-phase1-foundation.md` — Marked stale by author; foundation complete.
3. `2026-03-30-appwindow-island-layouts.md` — Island system shipped; no edits since 2026-04-14.
4. `2026-04-14-ui-library-three-column.md` — Implementation committed (f7f0e36d).
5. `2026-03-31-pixel-art-engine.md` — Superseded by rewrite-from-stash (2026-04-15).

### Files to DELETE (no value; wrong context or abandoned)
1. `2026-03-27-rdna-controls-library.md` — References separate `/Users/rivermassey/Desktop/dev/DNA` worktree; doesn't belong in logo-maker repo.
2. `2026-03-28-control-density-modes.md` — Refers to `/Users/rivermassey/Desktop/dev/DNA/tools/playground`; execution context is different repo.
3. `2026-03-28-pretext-editor-backend.md` — Broken prerequisite chain (controls library doesn't exist here).
4. `2026-03-28-pretext-editor-frontend.md` — Same broken prerequisite chain.
5. `2026-03-29-pretext-standalone-panel.md` — References flow sandbox; execution context is different.

### Files Requiring Status Update (active but stale checklists)
1. `2026-04-03-pretext-authoring-primitives.md` — Update top-of-file summary; add current status section.
2. `2026-04-11-pixel-corners-consumer-migration.md` — Verify checklist: which consumers migrated? Update per-file progress.
3. `2026-04-15-pixel-art-system-plan-rewrite-from-stash.md` — Add current phase status (Phase 1? Phase 2?).
4. `2026-04-19-pixel-authoring-preparation-unification.md` — Clarify relationship to pixel-art-system-rewrite; merge if duplicate.

### Recommendations

**Immediate Actions:**
- Delete 5 files that reference wrong worktrees (DNA vs DNA-logo-maker context mismatch).
- Archive 5 shipped/superseded files.
- Clarify the 3 UNCLEAR files (especially `appwindow-container-audit` — is it a spec or stale review?).

**Next Review (optional but suggested):**
- Consolidate the two pixel refactor plans (`pixel-art-system-rewrite` + `pixel-authoring-preparation-unification`) — they overlap significantly.
- Verify `radio-rebuild` intent (is it a placeholder, a spec, or deferred work?).
- Once pixel-playground ships, mark as ✅ DONE and archive.
- Once colors-tab ships, mark as ✅ DONE and archive.

**Automation Opportunity:**
- Set up a pre-commit hook to auto-archive closed plans (look for ✅ DONE tags in file top-level summary, move to archive/).
- Add template header to all plans: `## Status (Last Updated: YYYY-MM-DD)` to force regular updates.

---

**Output generated:** 2026-04-25 by automated triage.  
**Next step:** Review UNCLEAR files + execute DELETE/ARCHIVE operations per recommendations.
