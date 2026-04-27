# Lane 4 Audit: Loose Top-Level Docs in /docs/

**Audit date:** 2026-04-25  
**Last git touches on all files:** 2026-04-25 (all touched today)  
**Threshold:** 9 loose files + Mermaid diagram + adjacent dir classification

---

## 1. manifesto-draft.md (23.5K)

**Status:** ❌ **Painfully stale + superseded**

**What it is:** A 320-line personal manifesto written as narrative essay. Starts with childhood memories (Hopi reservation, crypto losses, friend's mother's death, Radiants launch), then pivots to four philosophical sections: (I) consensus reality breakdown via media theory, (II) curation as power, (III) alchemy and community transformation.

**Git history:** Last touched 2026-04-25 (today) — but content is dated.

**Drift & stale claims:**
- Treats Radiants as aspirational / in-planning when it's now shipping (RadOS launching this cycle).
- "Code is becoming worthless" (section II) — framed as predictive, but this doc predates the actual agentic-web reality it claims to project.
- References "we just didn't know we would miss the dreams more than we'd love their fulfillment" — nostalgic tone that conflicts with the current building phase.
- Section on "build something, pick up the tool" is motivational theater; the actual project is already being built.

**Still useful sections:**
- The personal arc (Hopi → crypto → loss → manifesto) is emotionally authentic and differentiates Radiants' founder story. This is load-bearing.
- Section II (curate & reject) — the Hopi water pump as metaphor for conscious civilizational choice. This concept is still relevant.
- Section III's "be the alchemist and the substance" — this phrase recurs in manifesto-questions.md and is now the north star.

**What's happened since:** The draft was written before grief-processing phase fully resolved. `manifesto-questions.md` shows a Q&A with the author reflecting on what the draft got right/wrong. The current canonical form is now in RadOS (`apps/rad-os/components/apps/manifesto/manifesto-data.ts`), which parses markdown and renders it as a book primitive via the Pretext system.

**Recommendation:** 📦 **Archive**. The draft is historically valuable (shows iteration), but the canonical form is now in-app. Move to `archive/drafts/` or `archive/manifesto-iterations/` to preserve revision history without cluttering the active docs lane.

---

## 2. manifesto-questions.md (63K — huge)

**Status:** ⚠️ **Partially stale but still load-bearing**

**What it is:** A 576-line Q&A document. An interviewer asks 20+ probing questions about the manifesto draft, and the author (River) answers. Questions cover: personal identity shifts, what Radiants actually is, contradictions in the positioning, whether consensus reality crisis is universal or personal.

**Git history:** Last touched 2026-04-25 (today).

**Sampling & drift assessment:**

Sections sampled:
1. **Question 1: "Who Are You Now?"** — River answers that he's now "a man who knows what he wants, feels the sand shifting beneath his feet, must fight for the things he believes in." Tone: warrior → builder phase complete, mourner phase resolved. Dates the question set to early-mid 2026.

2. **Question 2a: "What Is Radiants, Really?"** — River says "It's an internet community that has not yet become a real community, because I'm increasingly believing that an internet community cannot truly be a community." Then: "It will one day soon need to become real → transition to bits/atoms → allow people to make, with their hands." This is dated (written before physical space plans solidified). The phrase "Radiants will exist permanently for one person: me" is both defiant and suggests project scope is shifting.

3. **Question 3: "The Crisis"** — Questions about whether consensus reality breakdown is universal or specific to privileged crypto participants. River's answer: "There is no universal crisis → everyone experiences a universe filled with thousands or millions." This is philosophically sound but unresolved in the manifesto draft itself.

**Stale claims:**
- "Not much [built yet]. The manifesto will launch on RadOS → where people can npx @rdna/create and have an app scaffold they can vibecode." — RadOS is shipping now (April 2026), so this is no longer future-tense.
- References to "I was unable to get anyone else to build it to my standards (very high)" — now building solo with Claude Code. Tone of the constraint has shifted.
- CabinDAO critique ("Tokens are retarded, pointless, meaningless") — strong language from early 2026, but if this doc is being referenced post-launch, it should be archived (not actively refined).

**Still useful sections:**
- The author's self-reflection on identity (mourner → warrior phase). This is raw and honest, good for understanding founder mindset.
- The contradiction between "empower individual as collective" and the practical reality of "rejection of outsiders, shared scar tissue." This is unresolved in the draft and needs to stay visible.
- The CabinDAO critique is useful institutional memory (why not to fork their approach).

**Recommendation:** 📦 **Archive with annotation**. This is a working document (Q&A format, conversational, not polished). It serves as revision context for the manifesto draft. Move both manifesto-draft.md and manifesto-questions.md to `archive/manifesto-iterations/` with a README explaining the Q&A was an iteration pass. Do not delete — preserve for institutional memory and future manifesto revisits.

---

## 3. corner-generation.md (3.7K)

**Status:** 🪦 **Dead**

**What it is:** A technical planning doc titled "Corner Generation." Describes a three-stage pipeline: author → prepare → materialize. Claims "authors define corner shapes, recipes, or overrides in `@rdna/pixel`" and "prepare step performs deterministic rasterization and caching."

**Git history:** Last touched 2026-04-25 (today) — but likely hasn't been edited in months; the touch is incidental.

**Drift:**
- This doc was written as planning for the pixel-corners feature before `corner-model.md` existed.
- Refers to "authors define corner shapes" in the abstract, but all actual authoring now happens in `packages/pixel/src/corners/registry.ts` (as confirmed by corner-model.md).
- The pipeline (author → prepare → materialize) is correct in concept but the doc is an early sketch, not the final spec.
- `corner-model.md` (section 4) supersedes this with a concrete data model and explicit rules.

**Still useful sections:**
- The three-stage pipeline concept is still the right mental model.
- The section "Math-First By Default" explains the Bresenham approach, which is still valid.
- The "Relationship To Other Pixel Assets" section (patterns, icons) is a useful map of the broader system.

**What's happened:** `corner-model.md` and `rad-os-authoring.md` were written as the actual implementation spec. Both reference corner-generation.md as a precursor. The pixel-corners feature has shipped (evidence: `packages/pixel/PIXEL-CORNERS.md` exists, `pixel-rounded-*` classes are in production CSS).

**Recommendation:** 📦 **Archive**. Move to `archive/design-docs/pixel-system-iterations/` as historical context. Keep the three-stage pipeline concept visible by referencing it from corner-model.md's "Related Docs" section (already does this).

---

## 4. corner-model.md (4.3K)

**Status:** ✅ **Current but transitional**

**What it is:** A formal specification for the pixel corners data model. Defines `CornerValue`, `CornerShapeBinding` (theme vs. fixed), and normalization rules. Specifies that authors use `packages/pixel/src/corners/registry.ts` as source of truth.

**Git history:** Last touched 2026-04-25 (today).

**Drift assessment:**
- The data model (theme vs. fixed, radiusPx, edge flags) matches what's in packages/pixel/src/.
- Rule: "No corner should depend on the global theme unless `source: 'theme'` was chosen explicitly." — This is enforced design, not yet a code assertion.
- References "chrome tabs as the reference case" for theme-following corners. Chrome tabs are in RadOS, so this is live and correct.
- "Treat old positional or duplicate registry surfaces as migration-only shims." — The doc acknowledges this is a transition state, which is accurate.

**Still useful sections:**
- All of it. This is the canonical data model and should remain as the source of truth reference.
- The distinction between theme-bound and fixed corners is critical for understanding the system's behavior.

**What's happened:** This spec was written as the replacement model after corner-generation.md. It's now the active reference. Evidence: rad-os-authoring.md cross-references it.

**Recommendation:** ✅ **Keep**. This is a current, load-bearing spec. No drift detected. Update frequency: low (the model is stable). Consider promoting it to `packages/pixel/CORNER-MODEL.md` (co-located with PIXEL-CORNERS.md) if other teams need to reference it, but the current location is acceptable.

---

## 5. pixel-corners.md (23.6K)

**Status:** ⚠️ **Partially stale — CSS outdated, architecture current**

**What it is:** A comprehensive technical guide to pixel corners. 798 lines covering overview, architecture, CSS classes, runtime px() API, shapes, shadow handling, discrete clamping, regeneration, testing, and ESLint enforcement.

**Git history:** Last touched 2026-04-25 (today).

**Drift assessment (sampled 3 sections):**

1. **CSS Classes (lines 114–157):** Lists numeric scale (pixel-rounded-2 through pixel-rounded-full) and legacy t-shirt aliases (xs, sm, md, lg, xl). Cross-checks against `packages/pixel/PIXEL-CORNERS.md`:
   - This doc claims `pixel-rounded-full` is "20 x 20 canonical circle."
   - The shipped PIXEL-CORNERS.md says `pixel-rounded-full` maps to the existing preset, with sizing that depends on CSS border-radius.
   - The numeric scale matches the production config, so this is current.

2. **Architecture (lines 49–95):** Describes the pipeline from Bresenham arc → `generateCorner(radius)` → `bitsToPath()` → `bitsToMaskURI()` → CSS custom properties → mask-image rules. Key files listed:
   - `packages/pixel/src/generate.ts` ✓ exists
   - `packages/pixel/src/shapes.ts` ✓ exists
   - `packages/pixel/src/path.ts` ✓ exists
   - `packages/radiants/scripts/pixel-corners-lib.mjs` — cannot verify path directly, but consistent with expected location.
   - This architecture is current and matches code structure.

3. **Testing & ESLint (lines beyond 180):** Not fully sampled, but headers reference enforcement via `eslint-plugin-rdna`. This is mentioned in ship-pretty-or-die.md ("Your linter is your brand guardian"), so the concept is consistent.

**Stale claims:**
- Refers to "legacy support" for t-shirt aliases (xs, sm, md). If the migration is complete, these should be marked deprecated with a sunset date.
- Section on "Regenerating CSS" likely refers to scripts that have since changed or been automated.

**Still useful sections:**
- Architecture section (50–95) is the clearest visual explanation of the pixel-corners pipeline.
- The table of CSS classes and their use cases is a practical reference.
- The two-layer mask system explanation (host + border) is well-written and correct.

**What's happened:** This doc was written as a user-facing guide. It's comprehensive but somewhat ahead of the current state (it's written as a shipping product reference, not a development guide). The equivalent shipped doc is `packages/pixel/PIXEL-CORNERS.md` (15K, updated 2026-04-10, written as a product guide for downstream consumers).

**Recommendation:** 🔀 **Consolidate with packages/pixel/PIXEL-CORNERS.md**. This docs/pixel-corners.md is more comprehensive in some areas (testing, ESLint) but duplicates content. Proposal:
- Keep shipping reference in `packages/pixel/PIXEL-CORNERS.md` (already in the right place).
- Archive this docs/pixel-corners.md or merge its unique sections (testing, ESLint) into the shipped doc.
- If this doc serves as a development guide (different from the shipping reference), retitle and relocate to `docs/design-system/pixel-corners-dev-guide.md` to clarify its role.

---

## 6. production-readiness-checklist.md (12.1K)

**Status:** 🔀 **Duplicate of archive/reports/2026-03-27-production-readiness-checklist.md**

**What it is:** A task/checklist document organized by priority tier (T0–T7): T0 (fix now), T1 (component visual quality), T2 (mobile rebuild), T3 (app content), T4 (tooling), T5 (motion pipeline), T6 (documentation), T7 (post-launch).

**Git history:** Last touched 2026-04-25 (today). But the file itself states: "Regenerated 2026-04-15 from codebase audit against archived checklist (`archive/reports/2026-03-27-production-readiness-checklist.md`). Stale/completed items removed. New work added."

**Duplicate check:**
- Archive version: 2026-03-27, created from 7-agent codebase audit + 40-question interview.
- Docs version: 2026-04-15, regenerated from codebase audit, removing stale items and adding new work.
- These are the same source document, with the docs/ version being the updated copy.

**Drift assessment:**
- The docs/production-readiness-checklist.md header says it's regenerated from the archive version. This is intentional, but creates a confusing duplication.
- The docs version is the more current (2026-04-15 vs. 2026-03-27).
- Both are work-in-progress (checklist format, unchecked items), so neither is finalized.

**Still useful sections:**
- All of it, IF it's the active version. But there's ambiguity about which is the source of truth.

**Recommendation:** 🔀 **Consolidate: Keep in /docs/, delete from archive/**. The checklist should live in docs/ where it's actively maintained. The archive/ version should be deleted (or moved to archive/reports/historical/ if you want to preserve the audit trail). Clarify in the checklist header: "Last updated: [DATE]. Previous versions archived at [path]." This eliminates confusion about which version is active.

---

## 7. rad-os-authoring.md (3.1K)

**Status:** ✅ **Current**

**What it is:** A short reference guide titled "RadOS Authoring." Describes the active RadOS authoring surface during pre-launch, source-of-truth paths, theme-following vs. fixed corners, playground workflow, and authoring rules.

**Git history:** Last touched 2026-04-25 (today).

**Drift assessment:**
- "Active surface that must stay working" section lists: global corner preference, chrome tabs, pixel playground prompt/export, pattern and icon entry points.
- All of these are confirmed in RadOS codebase (`apps/rad-os/CLAUDE.md` mentions the playground and app catalog).
- Cross-references to corner-model.md and corner-generation.md are accurate.
- Source-of-truth paths specified:
  - `packages/pixel/src/corners/registry.ts` ✓
  - `packages/pixel/src/patterns/registry.ts` ✓
  - `packages/pixel/src/icons/registry.ts` ✓
  - `packages/radiants/icons/manifest.ts` ✓
- All verified to exist.

**Still useful sections:**
- All of it. Concise and accurate.

**Recommendation:** ✅ **Keep**. This is a current, accurate reference. Low maintenance burden. No drift detected.

---

## 8. rdna-ctrl-handoff.md (18K)

**Status:** ⚠️ **Partially stale — architecture locked, status outdated**

**What it is:** A developer handoff document for `@rdna/ctrl`, a portable control surface library (knobs, faders, sliders, color pickers, etc. for tool UIs). Describes: what ctrl is, why it exists, architecture rules, component topology, and current implementation status.

**Git history:** Last touched 2026-04-25 (today). Header says "Date: 2026-04-14, Status: Active development."

**Drift assessment:**

1. **Architecture rules (locked):** All seven rules are explicit and reasonable:
   - Portable library, zero RadOS coupling ✓
   - Controlled components only ✓
   - Extends radiants tokens ✓
   - Base UI where useful ✓
   - Rendering: DOM default, canvas for hot data, SVG for arcs ✓
   - Density context ✓
   - Primitives only, no domain presets ✓
   - These are design decisions, not code, so unlikely to be outdated.

2. **Component status:** "27/27 components are partially implemented. Every component has a real, functional implementation with styling, event handling, and integration with `useDragControl` or Base UI."
   - This is dated language. "Partially implemented" was probably true in Feb/Mar 2026. Current status (April 25) is unknown from this doc.
   - The doc was written before full ctrl rollout, but that's okay — it's a handoff doc, not a status report.

3. **Current export topology:** Lists @rdna/ctrl, @rdna/ctrl/controls, @rdna/ctrl/selectors, etc. Matches the actual package structure in `packages/ctrl/` (verified: controls/, layout/, primitives/, readouts/, selectors/, test/ exist).

**Still useful sections:**
- Architecture rules (section 2) — these are decision docs and stay relevant.
- Rule of thumb: "If it lives inside a control panel and adjusts a value, it's ctrl" — still the right mental model.
- Consumer matrix (StudioApp, Flow, dithwather, etc.) — useful for understanding scope.
- The Density context pattern and rendering guidelines are still current.

**Stale sections:**
- "What exists today" — status from April 14. By April 25, this is 11 days old. Not ancient, but may not reflect recent completions.
- Tone: "Here's what exists today" — reads like a handoff moment (and the header confirms it's dated 04-14), suggesting it was written for a specific handoff event. If that event has passed, the doc should be re-dated or marked [ARCHIVED].

**Recommendation:** ⚠️ **Keep with metadata update**. This is a handoff doc, which means its date and purpose are part of its identity. Options:
1. **Refresh:** Update "What exists today" section with current component status (April 25), re-date the doc.
2. **Archive:** Move to `archive/handoffs/2026-04-14-ctrl-handoff.md` and create a new `docs/ctrl-architecture.md` that focuses on architecture rules (timeless) rather than status (time-bound).
3. **Hybrid:** Keep this doc but add a "Status as of [DATE]" section and a link to the latest status elsewhere.

Recommend option 2 (archive the dated handoff, keep the architecture rules as a standalone reference).

---

## 9. ship-pretty-or-die.md (8.6K)

**Status:** ✅ **Current vibe doc, with test checklist rot**

**What it is:** A presentation thesis + speaker notes for a talk on design system philosophy. Seven sections: (I) full-stack design, (II) linter as brand guardian, (III) build your own tools, (IV) agentic web demands beauty, (V) branding collapsed into design, (VI) time in market of the mind, (VII) open brand > protected brand. Followed by a "Pretext Browser Smoke Checklist" (50+ line QA checklist).

**Git history:** Last touched 2026-04-25 (today).

**Drift assessment:**

1. **Philosophy sections (I–VII):** All are general positioning/vibe docs. Examples:
   - "Taste is bullshit, but applying it consistently is everything" — timeless.
   - "Your linter is your brand guardian" — echoes eslint-plugin-rdna (referenced in ship-pretty-or-die.md as demo). Still relevant.
   - "Build your own tools" — lists Flow, RadOS, DNA/Radiants as examples. RadOS is shipping now, Flow is mentioned as prototype, DNA is the design system. All current.
   - "Agentic web demands beauty" — this is a forward-looking thesis (written before AI agents were at scale), now increasingly relevant.
   - "Open brand > protected brand" — the CTA (make assets available) is still the positioning, and it's consistent with Radiants' approach.

2. **Pretext Browser Smoke Checklist (lines 117–215):** A 100-line QA checklist for a "Scratchpad" app in RadOS, covering markdown editing, editorial primitive, broadsheet primitive, book primitive, export/import, shared consumers (GoodNews, Manifesto), sample bundles, and red flags.
   - This is **rotted QA checklist**. It references specific app features that may or may not exist (Scratchpad, editorial preview, broadsheet preview, book preview).
   - The checklist is dated and should be moved to the relevant app's test directory, not kept in a vibe doc.
   - Evidence: The checklist mentions "Legacy docs, if present, show the compatibility banner" — this is a specific, time-bound feature toggle.

**Still useful sections:**
- All seven philosophy sections are load-bearing positioning.
- The checklist should be extracted and archived (or moved to the actual test directory).

**Recommendation:** ✅ **Keep philosophy, archive checklist**. Split the file:
1. Keep sections I–VII as `docs/ship-pretty-or-die.md` (vibe/positioning doc, evergreen).
2. Move the "Pretext Browser Smoke Checklist" to `apps/rad-os/components/apps/scratchpad/__tests__/smoke-checklist.md` (or wherever Scratchpad tests live) and mark it with the date it was created + last verified date.

---

## 10. git-commands-diagram.mmd (7.2K)

**Status:** ✅ **Current (educational, low maintenance)**

**What it is:** A Mermaid flowchart that maps git commands to Figma-like UI concepts (canvas, redlining, selecting layers, saving versions, variants, flattening, syncing, undo, drawer, labeling, power tools). Educational reference for non-developers learning git via design metaphors.

**Git history:** Last touched 2026-04-25 (today).

**Drift assessment:**
- The metaphor mapping (git init = new artboard, git clone = duplicate file) is evergreen and pedagogically sound.
- All commands listed are stable git fundamentals (no command deprecations).
- The visual styling (color scheme, Mermaid theme) is themed for dark mode, consistent with RDNA design language.
- No stale commands or broken metaphors detected.

**Still useful sections:**
- All of it. This is a reference diagram, not a procedural guide, so it ages very slowly.

**Recommendation:** ✅ **Keep**. Low maintenance, evergreen value. Could be promoted to a wiki or learning resource if you have one, but current location is fine.

---

## Adjacent Directories (Brief Classification)

| Dir | Status | Notes |
|-----|--------|-------|
| `/docs/research/` | ⚠️ prompt-library.md (3.8K), design-guard/, prompts/, design-playground.md (1.7K). Not audited deeply, but metadata suggests research-track docs (prompts are organized by use case, design-guard is validation rules). Keep if actively maintained; archive if not. |
| `/docs/solutions/` | 🔍 integration-issues/, tooling/. Subdirs, not audited. These are likely solution-specific docs; verify they're indexed/discoverable. |
| `/docs/upstreams/` | 🔍 design-playground.md (1.7K). Single file, brief. Purpose unclear without reading; likely notes on upstream design tools. |
| `/docs/ops/` | ✅ paper/, playground-fix-log.md (23.8K), qc-visual-t1-checklist.md (1.9K), qc-visual-t1-loop.md (3.1K), README.md. This is the operational lane; may be covered by a separate audit. |

---

## Summary Table

| File | Status | Action |
|------|--------|--------|
| manifesto-draft.md | ❌ Painfully stale | Archive to `archive/manifesto-iterations/` |
| manifesto-questions.md | ⚠️ Partially stale | Archive to `archive/manifesto-iterations/` (paired with draft) |
| corner-generation.md | 🪦 Dead | Archive to `archive/design-docs/` |
| corner-model.md | ✅ Current | Keep (canonical spec) |
| pixel-corners.md | ⚠️ Partially stale | Consolidate with `packages/pixel/PIXEL-CORNERS.md` or retitle as dev guide |
| production-readiness-checklist.md | 🔀 Duplicate | Consolidate: keep in /docs/, delete archive copy, clarify source of truth |
| rad-os-authoring.md | ✅ Current | Keep (reference guide) |
| rdna-ctrl-handoff.md | ⚠️ Partially stale | Archive handoff (dated 04-14), keep architecture rules as standalone reference |
| ship-pretty-or-die.md | ✅ Current (with rot) | Split: keep philosophy sections, move QA checklist to app tests |
| git-commands-diagram.mmd | ✅ Current | Keep (educational, low maintenance) |

---

## Top-Level Recommendations

1. **Establish an archive lane:** Create `archive/manifesto-iterations/`, `archive/design-docs/`, `archive/handoffs/` to separate historical docs from active ones. Use metadata (date, version, status) to make the boundary clear.

2. **Consolidate checklist source of truth:** The production-readiness-checklist is duplicated between /docs/ and /archive/reports/. Decide: is it a living doc (keep in /docs/, archive old versions) or a snapshot (keep in /archive/, create a new active checklist in /docs/)? Current state is ambiguous.

3. **Split philosophical vibe docs from QA checklists:** ship-pretty-or-die.md mixes a timeless positioning doc with a time-bound QA checklist. Move the checklist to the app it tests; keep the vibe doc.

4. **Co-locate pixel system docs:** The pixel corners story is split across /docs/corner-generation.md, /docs/corner-model.md, /docs/pixel-corners.md, /docs/rad-os-authoring.md, and packages/pixel/PIXEL-CORNERS.md. Consider a single source (packages/pixel/DESIGN.md with sections for model, generation, authoring, API) and thin references from /docs/.

5. **Establish a "Last Verified" date:** Several docs (rdna-ctrl-handoff, pixel-corners) have embedded status claims ("27 components partially implemented," "legacy t-shirt aliases deprecated"). Add a verification pass quarterly to update these dates and surface rot early.

