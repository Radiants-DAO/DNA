# DNA Playground Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Use the existing `design-playground` as a reference implementation while building a DNA-native `apps/playground` in the monorepo, prove a manual-registry MVP against real `@rdna/radiants` components, and only then expand into an automated, governed component iteration tool.

**Architecture:** `apps/playground` is a Next.js App Router workspace app that imports real workspace components from `@rdna/*`, renders them directly on a canvas, and delegates iteration to Claude Code via a local API route that writes `.tsx` files to disk. Phase 0 is a strict feasibility spike with a tiny manual registry and hard go/no-go criteria. Later phases harden the app, connect it to the design-system linting pipeline for both generation-time enforcement and a structured violation manifest surfaced inside the playground UI, then add registry automation using existing Radiants metadata (`*.schema.json`, `*.dna.json`) before any `/flow` integration work.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind v4, `@xyflow/react`, pnpm workspaces, Claude Code CLI, RDNA ESLint/design guardrails

---

## Current Status (2026-03-10)

- Phase 0 is complete and recorded in `docs/reports/2026-03-06-playground-spike.md`.
- Phase 1 is complete on `main`.
- The playground now uses the shared `@rdna/radiants/registry` bridge instead of the original tiny manual registry, with 13 renderable entries grouped by category.
- Prompt hardening, app-owned tests, operational docs, and RDNA violation surfacing all shipped in Phase 1.
- Follow-up hardening landed after review:
  - compare mode now surfaces violations for both baseline source files and candidate iteration files
  - route contract tests now import real shared implementations instead of copied helpers
  - `clearCanvasState()` now swallows storage-access failures consistently
  - `violations:generate` now exits non-zero on real ESLint/runtime failures instead of writing a false-clean manifest

## Outcome So Far

Delivered through Phase 1:

1. A usable `apps/playground` app with canvas, compare mode, Sun/Moon review controls, generation, adoption, and rollback guards.
2. Shared-registry-backed component discovery for the playground, with playground-local prompt metadata layered on top.
3. A stricter iteration prompt contract focused on RDNA token usage, motion, component integrity, and prop-shape preservation.
4. App-owned test coverage for storage, prompt building, iteration naming, and route-adjacent contracts.
5. An RDNA violations manifest pipeline plus visible badges in the playground UI for review-time conformance checks.

## Immediate Follow-Up Work

These are useful next steps before or alongside Phase 2:

1. Automate manifest refresh after generate/adopt so the UI cannot drift from the latest lint state.
2. Let reviewers choose a specific candidate iteration instead of always loading the newest file.
3. Add route-level integration tests for generate/adopt rollback and CLI failure paths.

## Preconditions

These are not optional. Do not start Phase 0 until both are true:

1. The current design-system linting work is committed and runnable in this repo, not just drafted.
2. A local command exists for generated-file enforcement, ideally `pnpm lint:design-system` plus a path-scoped variant for the playground app and generated iterations.

If the linting branch is not yet landed, finish that first. The playground should be built against enforcement, not retrofitted into it later.

## Known Repo Facts

- `apps/*` are already first-class pnpm workspaces via [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml).
- `@rdna/radiants` already exports source entrypoints, including `./components/core/index.ts`, from [`packages/radiants/package.json`](../../packages/radiants/package.json).
- Radiants components already have colocated metadata files:
  - `packages/radiants/components/core/*/*.schema.json`
  - `packages/radiants/components/core/*/*.dna.json`
- Existing apps import Radiants directly from CSS in `globals.css`, so the playground can follow the same pattern as [`apps/rad-os/app/globals.css`](../../apps/rad-os/app/globals.css).

## Product Direction

This plan assumes:

- The playground is a dev tool, not a published package.
- `apps/playground` is the correct home.
- The upstream repo should be treated as a reference implementation first. For Phase 0, vendor a point-in-time snapshot into the repo without git history, record provenance, and port only the pieces needed into `apps/playground`.
- The playground is the only code-generation/adoption surface.
- `/flow` stays separate for now and may later provide context into the playground prompt.

## Success Gates

### Phase 0 Go/No-Go Gate

Phase 0 is successful only if all are true:

1. `apps/playground` runs locally inside the monorepo.
2. At least 3 real Radiants components render on the canvas from a manual registry.
3. Claude can generate at least 1 valid variation to disk from a playground action.
4. The playground can render a side-by-side baseline vs candidate comparison for the seed components with stable props.
5. Generated files can be linted with the RDNA design-system rules.
6. An adopted variation can replace a component implementation without breaking typecheck/lint for the touched surface.

If any of those fail, stop and write a short failure memo before Phase 1.

### Phase 1 Readiness Gate

Do not start registry automation until:

1. Manual registration is stable for the seed components.
2. Baseline vs candidate visual comparison works with stable props, viewport presets, and Sun/Moon mode.
3. Prompt context is good enough that generated code usually lands near-compliant.
4. The adoption flow is trustworthy enough that humans would actually use it.

## External Prerequisite: Upstream Reference Snapshot

Use `https://github.com/B1u3B01t/design-playground/` as the upstream reference implementation.

Recommended Phase 0 approach:

- Download a point-in-time snapshot into a clearly non-product path such as `references/design-playground/`.
- Do not preserve upstream git history inside this repo for the first pass.
- Record the upstream URL, imported commit SHA, download date, and license in repo docs.
- Do not use a subtree/submodule for Phase 0.
- Port only the needed shell and interaction patterns into `apps/playground`; do not develop directly inside the reference snapshot.

Optional later step:

- If upstream tracking starts to matter after the spike, create a real fork or separate mirror at that point. Do not add that process cost before the manual-registry MVP proves useful.

## Phase 0: Feasibility Spike [Complete]

### Task 0.1: Record upstream baseline and reference import strategy

**Files:**
- Create: `docs/upstreams/design-playground.md`
- Create: `apps/playground/UPSTREAM.md`
- Create: `references/design-playground/UPSTREAM.md`

**Step 1: Record source provenance**

Document:
- upstream repo URL
- imported commit SHA
- download date
- license status/check
- location of the vendored reference snapshot
- major local deviations from upstream

**Step 2: State import policy**

Write down:
- what is stored only as reference material in `references/design-playground/`
- what is copied or adapted into `apps/playground` in Phase 0
- what is intentionally rewritten for DNA
- how future upstream diffs will be reviewed

**Step 3: Commit**

```bash
git add docs/upstreams/design-playground.md apps/playground/UPSTREAM.md references/design-playground/UPSTREAM.md
git commit -m "docs(playground): record design-playground reference baseline"
```

### Task 0.2: Scaffold `apps/playground` as a workspace app

**Files:**
- Create: `apps/playground/package.json`
- Create: `apps/playground/tsconfig.json`
- Create: `apps/playground/next.config.ts`
- Create: `apps/playground/postcss.config.mjs`
- Create: `apps/playground/app/layout.tsx`
- Create: `apps/playground/app/page.tsx`
- Create: `apps/playground/app/globals.css`

**Step 1: Create the package skeleton**

Use `apps/rad-os` as the local reference for dependency versions and Next.js structure.

**Step 2: Wire Radiants theme CSS**

In `app/globals.css`, import:
- `@rdna/radiants`
- `@rdna/radiants/dark`

Also add `@source "../../../packages/radiants";` so Tailwind v4 can see workspace classes used by the design-system package.

**Step 3: Add a minimal root route**

`app/page.tsx` should either redirect to `/playground` or render a minimal launch page with a link into the tool.

**Step 4: Verify app boot**

Run:

```bash
pnpm --filter @rdna/playground dev
```

Expected:
- Next.js dev server starts
- no missing dependency errors
- Radiants CSS resolves correctly

**Step 5: Commit**

```bash
git add apps/playground
git commit -m "feat(playground): scaffold workspace app"
```

### Task 0.3: Port the upstream route shell into DNA

**Files:**
- Create: `apps/playground/app/playground/page.tsx`
- Create: `apps/playground/app/playground/PlaygroundCanvas.tsx`
- Create: `apps/playground/app/playground/PlaygroundSidebar.tsx`
- Create: `apps/playground/app/playground/nodes/ComponentNode.tsx`
- Create: `apps/playground/app/playground/types.ts`
- Create: `apps/playground/app/playground/lib/storage.ts`

**Step 1: Copy the minimum shell from the vendored reference**

Bring over only the core route shell:
- canvas
- sidebar
- component node
- local persistence helpers

Do not port advanced features yet if they are not required for the spike.

**Step 2: Keep the route DNA-local**

Rename or restructure files only if needed to fit `apps/playground/app/playground/*`.

**Step 3: Verify render shell without generation**

Expected:
- canvas loads
- sidebar loads
- drag/drop or add-to-canvas works with placeholder registry data

**Step 4: Commit**

```bash
git add apps/playground/app/playground
git commit -m "feat(playground): port baseline route shell"
```

### Task 0.4: Add a manual registry for 3 seed components

**Files:**
- Create: `apps/playground/app/playground/registry.tsx`
- Modify: `apps/playground/app/playground/PlaygroundSidebar.tsx`
- Modify: `apps/playground/app/playground/nodes/ComponentNode.tsx`

**Seed components:**
- `Button`
- `Card`
- `Input`

**Source references:**
- `packages/radiants/components/core/Button/Button.tsx`
- `packages/radiants/components/core/Card/Card.tsx`
- `packages/radiants/components/core/Input/Input.tsx`

**Step 1: Define a tiny registry contract**

Each entry should include:
- `id`
- `label`
- `group`
- `Component`
- `defaultProps`
- `sourcePath`
- `schemaPath` if available
- `propsInterface` or equivalent prompt metadata

**Step 2: Seed realistic defaults**

Do not use fake empty props if the component needs meaningful content to be visually legible.

**Step 3: Verify direct workspace imports**

Expected:
- `@rdna/radiants/components/core` imports resolve
- all 3 components render on canvas without bundling hacks

**Step 4: Commit**

```bash
git add apps/playground/app/playground/registry.tsx apps/playground/app/playground/PlaygroundSidebar.tsx apps/playground/app/playground/nodes/ComponentNode.tsx
git commit -m "feat(playground): register seed radiants components"
```

### Task 0.5: Swap agent execution from Cursor to Claude

**Files:**
- Create: `apps/playground/app/playground/api/generate/route.ts`
- Create: `apps/playground/app/playground/prompts/iteration.prompt.ts`
- Create: `apps/playground/app/playground/iterations/.gitkeep`
- Create: `apps/playground/app/playground/iterations/index.ts`
- Create: `apps/playground/app/playground/iterations/tree.json`

**Step 1: Port the upstream generate route**

Keep:
- lockfile or single-run protection
- prompt over stdin
- exit-code based success detection
- filesystem write flow

Replace:
- `cursor agent --print --force`
with:
- `claude --print`

**Step 2: Inject DNA context into the prompt**

The prompt must reference:
- `packages/radiants/DESIGN.md`
- the seed component source file
- available schema/dna metadata when present
- local linting expectations and forbidden patterns

**Step 3: Keep the output shape strict**

Require the agent to:
- create N variation files in `iterations/`
- update `iterations/index.ts`
- update `iterations/tree.json`
- preserve the original prop shape for swappability

**Step 4: Run a manual generation**

Expected:
- route returns success on exit code `0`
- at least 1 variation file appears
- the canvas can discover and render it

**Step 5: Commit**

```bash
git add apps/playground/app/playground/api/generate/route.ts apps/playground/app/playground/prompts/iteration.prompt.ts apps/playground/app/playground/iterations
git commit -m "feat(playground): add claude-backed iteration route"
```

### Task 0.6: Add generated-code governance to the spike

**Files:**
- Modify: `apps/playground/package.json`
- Create: `apps/playground/scripts/verify-generated-variation.mjs`
- Modify: root `package.json` if a workspace-level helper script is needed

**Step 1: Add a path-scoped verification command**

The command should lint:
- `apps/playground/app/playground/iterations/**/*.tsx`
- any adopted destination file

Use the RDNA lint rules if available. If the linting work has not landed under stable paths yet, stop here and finish that work first.

**Step 2: Fail fast on bad generation**

Generation success is not just “Claude exited 0”. Treat the run as failed if the generated files do not pass the required verification command.

**Step 3: Verify one passing and one failing case**

Expected:
- a compliant variation passes
- an intentionally bad variation fails clearly

**Step 4: Commit**

```bash
git add apps/playground/package.json apps/playground/scripts/verify-generated-variation.mjs package.json
git commit -m "feat(playground): enforce lint checks on generated variations"
```

### Task 0.7: Add adoption flow for a single seed component

**Files:**
- Create: `apps/playground/app/playground/api/adopt/route.ts`
- Modify: `apps/playground/app/playground/nodes/ComponentNode.tsx`
- Modify: `apps/playground/app/playground/registry.tsx`

**Step 1: Keep adoption narrow**

Support adoption only for the 3 seed components in Phase 0.

**Step 2: Implement copy/replace flow**

The route should:
- validate the selected iteration file exists
- validate the target `sourcePath` is one of the allowed seed destinations
- replace the implementation file contents
- rerun verification for the touched target path

**Step 3: Prove end-to-end on `Button`**

Expected:
- variation renders
- adopt succeeds
- target source file changes
- local typecheck/lint for touched surface still passes

**Step 4: Write the spike verdict**

Create:
- `docs/reports/2026-03-06-playground-spike.md`

Include:
- what worked
- what broke
- go/no-go decision
- recommended Phase 1 scope

**Step 5: Commit**

```bash
git add apps/playground/app/playground/api/adopt/route.ts apps/playground/app/playground/nodes/ComponentNode.tsx apps/playground/app/playground/registry.tsx docs/reports/2026-03-06-playground-spike.md
git commit -m "feat(playground): complete spike adoption flow"
```

### Task 0.8: Add baseline vs candidate comparison mode

**Files:**
- Create: `apps/playground/app/playground/lib/compare.ts`
- Modify: `apps/playground/app/playground/registry.tsx`
- Modify: `apps/playground/app/playground/PlaygroundCanvas.tsx`
- Modify: `apps/playground/app/playground/nodes/ComponentNode.tsx`
- Modify: `apps/playground/app/playground/types.ts`

**Step 1: Define the comparison contract**

Add explicit support for two render sources:
- `baseline` = current workspace component implementation
- `candidate` = generated variation or selected alternative implementation

The comparison model must include:
- component id
- stable props payload
- viewport preset
- color mode
- source labels shown in the UI

**Step 2: Render side-by-side comparison**

The canvas should support a comparison mode that renders:
- baseline on the left
- candidate on the right

Do not use random/default canvas state for the comparison view. The same component instance must be rendered with identical props and layout constraints on both sides.

**Step 3: Seed stable comparison props**

For the Phase 0 seed components (`Button`, `Card`, `Input`), define stable visual props that make differences obvious and reviewable.

**Step 4: Verify comparison mode**

Expected:
- baseline and candidate render simultaneously
- switching between seed components preserves deterministic props
- a generated variation can be selected as the candidate source without breaking baseline render

**Step 5: Commit**

```bash
git add apps/playground/app/playground/lib/compare.ts apps/playground/app/playground/registry.tsx apps/playground/app/playground/PlaygroundCanvas.tsx apps/playground/app/playground/nodes/ComponentNode.tsx apps/playground/app/playground/types.ts
git commit -m "feat(playground): add baseline vs candidate comparison mode"
```

### Task 0.9: Add visual QA harness controls and evidence capture

**Files:**
- Create: `apps/playground/app/playground/components/ViewportPresetBar.tsx`
- Create: `apps/playground/app/playground/components/ReviewChecklist.tsx`
- Create: `apps/playground/app/playground/lib/review-checklist.ts`
- Modify: `apps/playground/app/playground/page.tsx`
- Modify: `apps/playground/app/playground/PlaygroundSidebar.tsx`
- Modify: `apps/playground/README.md` if it exists by then, otherwise modify `docs/reports/2026-03-06-playground-spike.md`

**Step 1: Add viewport presets**

Support at least:
- compact window
- standard desktop window
- mobile/fullscreen modal

These presets should size the comparison surface, not the whole browser viewport.

**Step 2: Add Sun/Moon mode toggle**

The comparison harness must let reviewers toggle both renders between:
- Sun Mode
- Moon Mode

Use the same mode for both panes during a comparison pass.

**Step 3: Add review checklist UI**

Create a small review checklist tied to RDNA concerns:
- radius consistency
- elevation / shadow consistency
- motion feel / reduced motion readiness
- spacing and typography consistency
- chrome vs environment balance
- viewport/container-query behavior

This does not need persistence in Phase 0. It is a structured manual review aid.

**Step 4: Add evidence capture path**

Provide one of:
- screenshot export
- or a documented manual screenshot workflow from the playground route

The important requirement is that a reviewer can produce visual evidence for baseline vs candidate decisions.

**Step 5: Verify the visual QA harness**

Expected:
- reviewer can compare baseline vs candidate
- reviewer can switch viewport presets
- reviewer can switch Sun/Moon mode
- reviewer has an explicit checklist while reviewing
- reviewer can capture evidence for the spike report

**Step 6: Commit**

```bash
git add apps/playground/app/playground/components/ViewportPresetBar.tsx apps/playground/app/playground/components/ReviewChecklist.tsx apps/playground/app/playground/lib/review-checklist.ts apps/playground/app/playground/page.tsx apps/playground/app/playground/PlaygroundSidebar.tsx apps/playground/README.md docs/reports/2026-03-06-playground-spike.md
git commit -m "feat(playground): add visual qa harness controls"
```

## Phase 1: Harden the Manual-Registry MVP [Complete]

Start this phase only if Phase 0 is a clear “go”.

### Task 1.1: Clean up app shell and provider requirements [Complete]

**Files:**
- Modify: `apps/playground/app/layout.tsx`
- Modify: `apps/playground/app/globals.css`
- Create: `apps/playground/app/providers.tsx` if needed

**Goal:**
- ensure fonts, mode handling, and any required providers are explicit
- remove spike-only shortcuts

**Status (2026-03-10):**
- complete
- `apps/playground/app/layout.tsx` now applies `font-sans` explicitly
- no additional provider layer was required for the Phase 1 shell

### Task 1.2: Expand manual registry to a representative core set [Complete]

**Files:**
- Modify: `apps/playground/app/playground/registry.tsx`

**Target set:**
- 8-12 core Radiants components
- include both simple and compound components
- include at least one menu/dialog-like component

**Status (2026-03-10):**
- complete
- the original manual seed registry was replaced with a bridge to `@rdna/radiants/registry`
- the playground now exposes 13 renderable shared-registry entries grouped by category
- playground-specific `propsInterface` overrides remain local so prompt context can diverge from shared display metadata when needed

### Task 1.3: Improve prompt contract and house rules [Complete]

**Files:**
- Modify: `apps/playground/app/playground/prompts/iteration.prompt.ts`
- Modify: `packages/radiants/DESIGN.md` only if a missing machine-enforcement section is discovered
- Create: `apps/playground/app/playground/prompts/adoption.prompt.ts` if adopt becomes agent-assisted

**Goal:**
- make RDNA constraints first-class in the prompt
- codify “preserve prop shape”
- codify “no raw HTML replacements when RDNA wrappers exist”

**Status (2026-03-10):**
- complete
- the iteration prompt now carries explicit RDNA rules for token usage, radius, shadow, motion, component integrity, and prop-shape preservation
- the prompt also distinguishes what the model may vary versus what must remain stable for drop-in replacement behavior

### Task 1.4: Add tests around the app-owned logic [Complete]

**Files:**
- Create: `apps/playground/app/playground/lib/__tests__/storage.test.ts`
- Create: `apps/playground/app/playground/prompts/__tests__/iteration-prompt.test.ts`
- Create: `apps/playground/app/playground/api/__tests__/route-contract.test.ts`

**Goal:**
- test local pure logic and route contracts
- do not try to fully test Claude itself

**Status (2026-03-10):**
- complete
- added test files for storage, iteration prompt building, and route-adjacent contract behavior
- post-review hardening moved `extractCodeBlocks` into shared app code and updated tests to import the real implementation
- adoption validation tests now exercise the real `validateAdoptionFile` helper instead of a copied contract

### Task 1.5: Add operational guardrails [Complete]

**Files:**
- Create: `apps/playground/README.md`
- Modify: `apps/playground/package.json`

**Goal:**
- explicit setup instructions
- explicit Claude CLI prerequisite
- clear warning that this app writes source files

**Status (2026-03-10):**
- complete
- `apps/playground/README.md` documents setup, Claude Code CLI requirements, and the fact that the app writes source files to disk
- `apps/playground/package.json` now includes a `typecheck` script for local verification

### Task 1.6: Surface RDNA lint violations inside the playground [Complete]

**Files:**
- Create: `apps/playground/scripts/generate-violations-manifest.mjs`
- Create: `apps/playground/generated/violations.manifest.json`
- Create: `apps/playground/app/playground/lib/violations.ts`
- Modify: `apps/playground/package.json`
- Modify: `apps/playground/app/playground/registry.tsx`
- Modify: `apps/playground/app/playground/PlaygroundSidebar.tsx`
- Modify: `apps/playground/app/playground/nodes/ComponentNode.tsx`
- Modify: `apps/playground/app/playground/types.ts`
- Modify: `apps/playground/README.md`

**Goal:**
- make design-system violations visible inside the playground, not only in terminal/CI output
- annotate components with warning/error status so reviewers and agents can see conformance while comparing variants

**Status (2026-03-10):**
- complete
- `scripts/generate-violations-manifest.mjs`, `generated/violations.manifest.json`, and `app/playground/lib/violations.ts` now provide structured violation data to the UI
- sidebar entries and canvas nodes show violation badges with rule details
- compare mode now shows baseline-source violations and candidate-iteration violations separately
- the current supported refresh path is explicit manual regeneration via `pnpm violations:generate`
- post-review hardening changed the manifest generator to fail loudly on real ESLint/runtime failures instead of writing a false-clean manifest

**Step 1: Add a manifest generator that converts ESLint results into playground data**

Create a Node script that runs the RDNA lint scan for in-scope playground targets using the existing config:
- `eslint.rdna.config.mjs`
- `pnpm lint:design-system` or a path-scoped equivalent

Do not run ESLint in the browser. Instead, write a normalized JSON manifest keyed by `sourcePath` and/or registry component id. Each entry should include at least:
- `ruleId`
- `severity`
- `message`
- `filePath`
- `line`
- `column`

**Step 2: Add a small playground-side loader and mapping layer**

Load `generated/violations.manifest.json` into the app and map violations onto registry entries using the existing source-path metadata from the manual registry. Keep this layer read-only; the playground should consume structured diagnostics, not parse raw ESLint text.

**Step 3: Add visible badges and explanation UI**

Update the sidebar and component nodes so each registered component can show:
- red badge when it has `error`-level violations
- yellow badge when it has only `warn`-level violations
- no badge when clean

Add a click or hover affordance that shows:
- short rule summary first
- raw message second
- file path and line reference

The first implementation can be a small popover or inline detail panel. The important requirement is that a reviewer can tell why a component is marked dirty without leaving the playground.

**Step 4: Define the refresh path**

For Phase 1, it is acceptable if the manifest refresh is explicit rather than live. Support at least one clear refresh path:
- rerun the manifest generator after generate/adopt actions, or
- provide a documented manual refresh command before reloading the page

Keep the mechanism simple and deterministic before considering watch mode.

**Step 5: Verify one failing and one clean component**

Expected:
- an intentionally violating component shows a visible badge in the sidebar and node view
- the explanation UI names the relevant rule(s)
- a compliant component shows no badge
- fixing the violation and regenerating the manifest clears the indicator

**Step 6: Commit**

```bash
git add apps/playground/scripts/generate-violations-manifest.mjs apps/playground/generated/violations.manifest.json apps/playground/app/playground/lib/violations.ts apps/playground/package.json apps/playground/app/playground/registry.tsx apps/playground/app/playground/PlaygroundSidebar.tsx apps/playground/app/playground/nodes/ComponentNode.tsx apps/playground/app/playground/types.ts apps/playground/README.md
git commit -m "feat(playground): surface rdna violations in ui"
```

## Phase 2: Registry Automation [Complete]

Only start after the manual registry proves useful.

### Task 2.1: Build a registry manifest generator [Complete]

**Files:**
- Create: `apps/playground/scripts/generate-registry.mjs`
- Create: `apps/playground/generated/registry.manifest.json`
- Modify: `apps/playground/package.json`

**Primary metadata sources:**
- `packages/*/components/**/*.schema.json`
- `packages/*/components/**/*.dna.json`
- exported component barrels such as `packages/radiants/components/core/index.ts`

**Important rule:**
- prefer schema/dna metadata first
- use TS parsing only for gaps, not as the first strategy

### Task 2.2: Generate a typed registry module from the manifest [Complete]

**Files:**
- Create: `apps/playground/generated/registry.ts`
- Modify: `apps/playground/app/playground/registry.tsx`

**Goal:**
- convert manifest data into the runtime registry used by the UI
- preserve room for hand-authored overrides

### Task 2.3: Add manual overrides for poor auto-defaults [Complete]

**Files:**
- Create: `apps/playground/app/playground/registry.overrides.ts`

**Goal:**
- handle components whose best demo props cannot be inferred automatically

### Task 2.4: Group components by package [Complete]

**Files:**
- Modify: `apps/playground/app/playground/PlaygroundSidebar.tsx`

**Goal:**
- `@rdna/radiants` and future packages appear as separate groups

## Phase 3: Multi-Package and App Integration [Complete]

### Task 3.1: Allow app-local registration alongside package registration [Complete]

**Files:**
- Create: `apps/playground/app/playground/app-registry.ts`
- Modify: `apps/playground/app/playground/registry.tsx`

**Goal:**
- let monorepo apps opt in their own local components without polluting the package-level manifest

### Task 3.2: Add source-path allowlists [Complete]

**Files:**
- Create: `apps/playground/app/playground/lib/source-path-policy.ts`
- Modify: adoption and generation routes

**Goal:**
- prevent writes outside intended package/app roots

### Task 3.3: Support package-level iteration directories if needed [Complete — keeping app-local]

**Files:**
- Modify: generation/adoption routes

**Goal:**
- decide whether iterations remain app-local or can be colocated nearer to target packages

Keep app-local iteration files unless a concrete need emerges.

## Phase 4: `/flow` Context Handoff

This is later work, not part of the initial MVP.

### Task 4.1: Define a context payload contract

**Files:**
- Create: `apps/playground/app/playground/lib/flow-context.ts`
- Create: `docs/contracts/flow-playground-context.md`

**Payload should include:**
- component id
- app route
- viewport or responsive context
- screenshot or screenshot reference
- DOM notes from `/flow`
- natural-language problem statement

### Task 4.2: Teach the prompt to consume `/flow` context

**Files:**
- Modify: `apps/playground/app/playground/prompts/iteration.prompt.ts`

**Goal:**
- let `/flow` provide “real app context”
- keep code generation exclusively in the playground

## Open Questions

These do not block Phase 0, but should be answered before or during Phase 1:

1. Should the playground initially target only `@rdna/radiants`, or support additional packages from day one?
2. Do you want the default app route to be `/` or `/playground`?
3. Should “adopt” be a direct file replace in v1, or should it create a patch/backup artifact first?
4. Do you want generated iterations committed to git by default, or ignored unless adopted?
5. Should prompt context read only `packages/radiants/DESIGN.md`, or also root `CLAUDE.md` and package-local agent docs?

## Recommended Delivery Sequence

1. Land the current linting system and make sure the commands are real in this repo.
2. Vendor the upstream reference snapshot and record provenance before porting code.
3. Execute Phase 0 in a fresh worktree.
4. Treat the visual QA harness as part of Phase 0 exit criteria, not optional polish.
5. If Phase 0 passes, execute Phase 1 before any registry automation.
6. Treat in-app violation visibility as part of the hardening work, not optional polish.
7. If the manual registry and visual compare workflow see real use, start Phase 2.
8. Keep `/flow` integration out of scope until the playground is already useful on its own.

## Verification Checklist Per Phase

- `pnpm install` completes without workspace drift.
- `pnpm --filter @rdna/playground dev` boots.
- the seed components render from workspace imports.
- baseline vs candidate comparison works with stable props.
- viewport presets and Sun/Moon mode work in the comparison view.
- the Claude route can write the expected files.
- generated files pass the intended lint gate.
- playground components can show current RDNA violation status from the generated manifest.
- adopted files still satisfy the touched surface’s verification commands.
