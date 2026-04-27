# Brainstorms, Ideas, and Ops Audit
**Date:** 2026-04-25  
**Branch:** feat/logo-asset-maker  
**Auditor:** claude-code (thorough sweep)

---

## BRAINSTORMS (/docs/brainstorms — 9 files)

- `2026-03-29-rados-pretext-migration-brainstorm.md` — ✅ INFORMED-PLAN: `2026-03-29-pretext-migration-phase1-foundation.md` — Migration strategy executed; marked "partially historical" in doc with status update. Archive.

- `2026-03-31-radiants-pixel-art-system-brainstorm.md` — ✅ INFORMED-PLAN: `2026-03-31-pixel-art-engine.md` — Decided status; produced concrete spec; informing active work on `@rdna/pixel` architecture. Keep (still feeding implementation).

- `2026-04-13-dither-pipeline-brainstorm.md` — 🚧 STILL-RELEVANT — Informational brainstorm identifying spike candidates; successor `2026-04-24-pixel-dither-brainstorm.md` shipped implementation in feat/logo-asset-maker. Original stays as landscape reference. Keep.

- `2026-04-18-colors-tab-refactor-brainstorm.md` — ✅ INFORMED-PLAN: `2026-04-18-colors-tab-refactor.md` — Decided status; plan exists and ready for implementation. Archive or keep as front-door doc; plan is primary.

- `2026-04-18-logo-asset-maker-brainstorm.md` — ✅ INFORMED-PLAN: `2026-04-18-logo-asset-maker.md` — Marked "ready for /wf-plan"; plan created. Archive.

- `2026-04-18-pixel-playground-brainstorm.md` — ✅ INFORMED-PLAN: `2026-04-18-pixel-playground.md` — Marked "ready for /wf-plan"; plan created. Archive.

- `2026-04-21-pattern-shape-shadow-brainstorm.md` — ✅ INFORMED-PLAN (inferred) — Decided status; directly addresses pixel-corner shadow rendering (active theme). Plan likely embedded in `2026-03-31-pixel-art-engine.md` or inline. Keep if no corresponding plan found.

- `2026-04-21-studio-tabs-animation-brainstorm.md` — 🚧 STILL-RELEVANT — Decided status (Studio two-tab split: Radiants + Freeform); animation/frames deferred to separate editor. Informing ongoing Studio refactor on feat/logo-asset-maker. Keep.

- `2026-04-24-pixel-dither-brainstorm.md` — ✅ SHIPPED — Shipped in feat/logo-asset-maker commit `17fd1d4d`; consumed by AppWindow + pixel-playground. Marks completion of `2026-04-13-dither-pipeline-brainstorm.md` (Option A path). Archive.

**Status:** 6 archivable (decided → plan), 3 keep (active or reference).

---

## IDEAS / TOP LEVEL (5 files)

- `2026-03-07-rados-agent-native-desktop-architecture.md` — 🪦 DEAD — Draft scope (QEMU + Hyprland); no corresponding plan; not on active theme list (pixel-art/dither, logo-asset, colors, controls, bitgrid, pretext, AppWindow). Delete or deep-archive.

- `radmark-chrome-extension.md` — ❓ UNCLEAR — Early exploration of X/Twitter → Obsidian bookmarking. No plan found; not on active theme list. Status unknown. Flag for decision: keep if exploratory sandbox tool, else delete.

- `rados-postprocessing-pipeline.md` — ❓ UNCLEAR — Idea-stage Three.js WebGPU 10-pass pipeline; ambitious but not scoped for current feat branch. No plan. Keep as long-term reference or delete if descoped. Recommend archival pending team decision.

- `rados-v2-vfs-architecture.md` — ❓ UNCLEAR — Draft VFS layer spec (save cartridge, SQLite); future feature, not on active roadmap. No plan. Archive pending v2 roadmap confirmation.

- `README.md` — ✅ KEEPS — Describes folder structure. Keep.

**Status:** 1 keep (README), 4 unclear/low-priority (recommend archive or delete after team review).

---

## IDEAS/BRAINSTORMS (10 files)

- `2026-03-03-land-finder-app-brainstorm.md` — 🪦 DEAD or ❓ UNCLEAR — Decided status but no visible plan; not on feat/logo-asset-maker or recent themes. Delete or archive.

- `2026-03-16-playground-ops-skill-brainstorm.md` — ✅ INFORMED-PLAN: `2026-04-11-skills-cleanup.md` — Playground ops skill; plan exists in ops plans. Archive.

- `2026-03-26-control-surface-brainstorm.md` — ✅ INFORMED-PLAN: `2026-04-08-control-surface-primitives.md` — Decided; plan created. Implementation branch TBD noted; status: plan ready. Archive.

- `2026-03-27-rdna-controls-library-brainstorm.md` — ✅ INFORMED-PLAN: `2026-03-27-rdna-controls-library.md` — Decided; matching plan from same date. @rdna/controls library framework. Archive.

- `2026-03-28-pretext-layout-editor-brainstorm.md` — ✅ INFORMED-PLAN: `2026-03-28-pretext-editor-backend.md` + `2026-03-28-pretext-editor-frontend.md` — Decided; two plans exist. Archive.

- `2026-03-29-appwindow-taskbar-api-brainstorm.md` — ✅ INFORMED-PLAN: `2026-03-29-appwindow-taskbar-api.md` — Decided; matching plan. Archive.

- `2026-04-11-moodboard-canvas-app-brainstorm.md` — ❓ UNCLEAR — Decided status but no matching plan found. Moodboard canvas app; not on active themes. Delete or archive.

- `2026-04-11-rdna-sprite-grill-kickoff.md` — 🚧 STILL-RELEVANT — Pre-brainstorm seeding grill on feat/pixel-art-system; companion to `2026-04-11-rdna-sprite-grill-output.md`. Output doc marks "Ready for planning" — plan not yet visible but work is staged. Keep until plan created.

- `2026-04-11-rdna-sprite-grill-output.md` — 🚧 STILL-RELEVANT — Grill complete; marked "Ready for planning"; blocks creation of @rdna/sprite plan. Keep until plan written.

- `2026-04-12-rad-tab-chrome-extension-brainstorm.md` — ❓ UNCLEAR — Early exploration (RadTab chrome extension); not on active themes. Status unknown. Delete or archive pending decision.

**Status:** 6 archivable (decided → plan), 2 keep (ready for plan, awaiting plan creation), 2 delete/unclear.

---

## IDEAS/SPIKES (2 files + 1 dir)

- `canvas-patterns.md` — 🪦 DEAD — Orphaned reference (image embedded, no context). Delete.

- `type-playground-wireframes/` — ❓ UNCLEAR — Stale spike (wireframe comments + server setup); type playground not on active roadmap. Delete or archive.

---

## OPS/TOP LEVEL (2 files)

- `session-status.md` — ACTIVE — Last updated 2026-04-24 13:40. Documents Studio rail refactor (feat/logo-asset-maker branch). Keep as current session tracker.

- `note-tile-test.md` — DELETE — Smoke test artifact (2026-04-11); marked "safe to delete." Remove.

---

## OPS/CLEANUP-AUDIT (7 subdirs)

Organized by date and concern:

- `2026-04-21/` — ACTIVE (ongoing audit lane) — coordinator + rdna-drift subdirs. Keep; tracks active discovery.

- `2026-04-25-todo-rollup/` — ACTIVE — SOURCES.md with 27K of consolidated findings. Keep; rolling compilation.

- `coordinator/` — COMPLETE-CAN-ARCHIVE — decision-log.md + execution-manifest.json document pre-implementation planning for monorepo cleanup. Predates recent feature work. Archive to `/archive/ops-cleanup-audit/coordinator/` after extraction.

- `css-overscope/` — COMPLETE-CAN-ARCHIVE — 24 lane reports (00-MASTER.md + 01-appwindow through 23 lanes). Comprehensive CSS scope audit completed 2026-04-20. Archive to `/archive/ops-cleanup-audit/css-overscope/`.

- `design-md-audit/` — ACTIVE (in progress) — lanes 1–4 completed (lane-1-philosophy-color-typography.md, lane-2-shadow-motion-interactive.md, etc.); this audit (lane-5) is part of ongoing docs audit. Keep.

- `docs-audit/` — ACTIVE (current) — lane-1-root-docs.md (11K) + lane-2-app-package-docs.md (13K) completed; lane-5-brainstorms-ideas-ops.md (this file) in progress. Keep for session continuity.

- `stage1/` — COMPLETE-CAN-ARCHIVE — 21 agent dispatch reports (agent-1-dedup.json, etc.) from initial dedup pass. Completed 2026-04-18. Archive to `/archive/ops-cleanup-audit/stage1/`.

- `string-prop-audit.md` — COMPLETE-CAN-ARCHIVE — 4.4K audit report (2026-04-18). Archive with stage1.

---

## OPS/PAPER-ASSETS/ITEM58

BACKGROUND ASSET STAGING — 14 files (bg-texture variants, cursor.png, grid.svg, notification.png, radd1 variants, vector letters). Appears to be a Paper-export staging area for design mockups / visual references. Likely complete/shipped or awaiting cleanup pass. **Action:** Keep unless confirmed unused; no blocker to current work.

---

## OPS/SKILLS-CLEANUP

COMPLETE — Inventory + provenance/staleness/usage reports (6 JSON files, .done sentinels, run-agent.sh, prompts subdir). Audit completed. Archive to `/archive/ops/skills-cleanup/`.

---

## OPS/SESSIONS

893 session directories (Claude Code session history). Beyond scope of this audit; preserve as-is. Recommend periodic archival of old sessions (pre-2026-03) as separate task.

---

## REFERENCES/DESIGN-PLAYGROUND/UPSTREAM.md

REFERENCE SNAPSHOT — Points to upstream https://github.com/B1u3B01t/design-playground/ (2026-03-08 snapshot). Ported code lives at `tools/playground/`. Keep as reference note only.

---

## ROLLUP

### Counts by Status (Brainstorms + Ideas)

| Category | Archivable | Keep | Delete/Unclear |
|----------|-----------|------|-----------------|
| `/docs/brainstorms` (9) | 6 | 3 | — |
| `/ideas` (5) | — | 1 | 4 |
| `/ideas/brainstorms` (10) | 6 | 2 | 2 |
| `/ideas/spikes` (2) | — | — | 2 |
| **Total** | **12** | **6** | **8** |

### Files to Archive

**Target path:** `/archive/brainstorms-ideas-ops-audit-2026-04-25/`

**Brainstorms (6):**
- `docs/brainstorms/2026-03-29-rados-pretext-migration-brainstorm.md`
- `docs/brainstorms/2026-04-18-colors-tab-refactor-brainstorm.md`
- `docs/brainstorms/2026-04-18-logo-asset-maker-brainstorm.md`
- `docs/brainstorms/2026-04-18-pixel-playground-brainstorm.md`
- `docs/brainstorms/2026-04-24-pixel-dither-brainstorm.md`

**Ideas/Brainstorms (6):**
- `ideas/brainstorms/2026-03-03-land-finder-app-brainstorm.md`
- `ideas/brainstorms/2026-03-16-playground-ops-skill-brainstorm.md`
- `ideas/brainstorms/2026-03-26-control-surface-brainstorm.md`
- `ideas/brainstorms/2026-03-27-rdna-controls-library-brainstorm.md`
- `ideas/brainstorms/2026-03-28-pretext-layout-editor-brainstorm.md`
- `ideas/brainstorms/2026-03-29-appwindow-taskbar-api-brainstorm.md`

**Ops Subdirs (3):**
- `ops/cleanup-audit/coordinator/`
- `ops/cleanup-audit/css-overscope/`
- `ops/cleanup-audit/stage1/` (+ `string-prop-audit.md`)
- `ops/skills-cleanup/`

### Files to Delete

- `ops/note-tile-test.md` — smoke test artifact
- `ideas/spikes/canvas-patterns.md` — orphaned reference
- `ideas/spikes/type-playground-wireframes/` — stale wireframe spike

**Candidates for team review (unclear status, low active relevance):**
- `ideas/2026-03-07-rados-agent-native-desktop-architecture.md`
- `ideas/radmark-chrome-extension.md`
- `ideas/rados-postprocessing-pipeline.md`
- `ideas/rados-v2-vfs-architecture.md`
- `ideas/brainstorms/2026-04-11-moodboard-canvas-app-brainstorm.md`
- `ideas/brainstorms/2026-04-12-rad-tab-chrome-extension-brainstorm.md`

### Keep (Active or Required)

**Brainstorms (3):**
- `docs/brainstorms/2026-03-31-radiants-pixel-art-system-brainstorm.md` — feeds active pixel-art work
- `docs/brainstorms/2026-04-13-dither-pipeline-brainstorm.md` — landscape reference for `2026-04-24` shipped version
- `docs/brainstorms/2026-04-21-studio-tabs-animation-brainstorm.md` — informing active Studio refactor

**Ideas (6):**
- `ideas/README.md` — folder guide
- `ideas/brainstorms/2026-04-11-rdna-sprite-grill-kickoff.md` — pre-brainstorm for active spike
- `ideas/brainstorms/2026-04-11-rdna-sprite-grill-output.md` — blocks plan creation; keep until plan written

**Ops (3):**
- `ops/session-status.md` — current session tracker
- `ops/cleanup-audit/2026-04-21/` — active audit lane
- `ops/cleanup-audit/2026-04-25-todo-rollup/` — rolling compilation
- `ops/cleanup-audit/design-md-audit/` — in-progress audit lane (5-lane series)
- `ops/cleanup-audit/docs-audit/` — current audit directory

---

## Suggested Next Action

1. **Immediate:** Delete `ops/note-tile-test.md` and `ideas/spikes/canvas-patterns.md`.

2. **This week:** Archive 12 archivable brainstorms/ideas + 4 ops subdirs to `/archive/brainstorms-ideas-ops-audit-2026-04-25/`. Update links in any docs that reference them.

3. **Team review:** Convene on 6 unclear-status ideas (agent architecture, radmark, postprocessing, vfs, moodboard, rad-tab). Decide: descope to archive or delete.

4. **Follow-up:** After @rdna/sprite plan is written, move `2026-04-11-rdna-sprite-grill-{kickoff,output}.md` to archive.

5. **Ongoing:** Design audit continues with lanes 6–N. Ops cleanup-audit keeps active subdirs (`2026-04-21/`, `2026-04-25-todo-rollup/`, `design-md-audit/`, `docs-audit/`); archive completed lanes after closure.

---

**Status:** Audit complete. 12 files ready to archive, 8 files flagged for team decision, 6 files essential to keep.
