# Flow Production Readiness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring Flow to a verifiable production-ready state by restoring a green baseline, fixing the broken comment and feedback loop, converging on one primary UX surface, and adding release guardrails.

**Architecture:** This plan replaces the stale February 2026 plan chain with one ordered execution path. Work proceeds in six gates: baseline verification, comment contract repair, feedback-model convergence, MCP lifecycle convergence, side-panel convergence, and release hardening. Agentation-inspired improvements land inside the existing extension and sidecar architecture rather than as a parallel system.

**Tech Stack:** TypeScript 5.8, React 19, Zustand 5, Vitest, WXT, Chrome Extension APIs, Node 20, h3, MCP SDK

---

## Execution Rules

- Use `@verification-before-completion` before claiming any task is done.
- Use `@javascript-testing-patterns` for new unit and integration tests.
- Keep changes DRY and incremental. Prefer adapters over big-bang rewrites.
- Do not start Task 2 until Task 1 has a real green baseline.
- Responsive Viewer remains deferred until every exit criterion below is true.

## Completed Snapshot

- The core monorepo shape from the master plan exists: `packages/shared`, `packages/extension`, and `packages/server` are present and wired.
- The content-script tool surface is substantial: guides, style copy/paste, keyboard traversal, typography, color, effects, move, layout, and reorder tests all exist.
- The Chrome Side Panel shell exists and uses shared panel hooks.
- The MCP sidecar exists with session, websocket, and feedback-related tool endpoints.
- Prompt compilation, on-page comment badges, prompt builder, and dogfood mode are already present.

## Existing Plan Classification

| Plan | Status | Reason | Carry Forward |
| --- | --- | --- | --- |
| `docs/plans/2026-02-02-flow-2-master-plan.md` | Superseded | Historical architecture plan. Most foundational phases already landed. | Keep for context only. Do not execute directly. |
| `docs/plans/2026-02-06-flow-phase1-visbug-port.md` | Superseded | Large parts of the listed tool work are already shipped. Annotate assumptions are outdated. | Carry only feedback and UX cleanup into Tasks 3-5 below. |
| `docs/plans/2026-02-23-flow-plan-0-restore-baseline.md` | Active prerequisite | Baseline still is not honestly green or reproducible. | Execute as Task 1 below. |
| `docs/plans/2026-02-23-flow-plan-1-test-stabilization.md` | Partially relevant | Coverage expansion is still useful, but it is no longer the next critical gate. | Fold remaining gaps into Task 6 below. |
| `docs/plans/2026-02-23-flow-plan-2-visbug-final-pass.md` | Partially completed, superseded | Several items in the plan already exist in code. | Carry only unresolved cleanup into Tasks 5-6 below. |
| `docs/plans/2026-02-23-flow-plan-3-chrome-side-panel.md` | Active but incomplete | Side Panel shell landed, but `Layers` is still a stub and spotlight is still shipping. | Execute remaining work as Task 5 below. |
| `docs/plans/2026-02-06-flow-2-phase-7-ui-wiring.md` | Superseded | Dogfood mode and on-page UI wiring largely landed; spotlight remains but now conflicts with Side Panel direction. | Treat as historical context only. |
| `docs/plans/2026-02-02-flow-2-phase-7-responsive-viewer.md` | Deferred | Not needed for first production release. | Revisit only after this plan is complete. |
| `docs/plans/archive/*` | Archived | Historical record. | Leave archived. |

## Production Exit Criteria

- `pnpm install` from `tools/flow` produces a usable workspace with `tsc`, `vitest`, and `wxt` available.
- `pnpm typecheck`, `pnpm --filter @flow/extension test --run`, `pnpm --filter @flow/server test --run`, and `pnpm build` all pass locally and in CI.
- On-page comment creation, editing, and removal use one canonical message contract across content script, panel, and background.
- Human and agent feedback share one schema with `intent`, `severity`, `status`, and `threadId`.
- MCP supports `watch`, `acknowledge`, `dismiss`, and `resolve` as one coherent lifecycle.
- Prompt compilation includes the same unified feedback threads the UI shows.
- Side Panel is the primary shipped surface; spotlight is removed from production or explicitly dev-only.
- Primary panel flows do not depend on known store stubs or placeholder panels.
- `README.md` and QA docs describe installation, build, smoke test, and release steps accurately.

## Task 1: Restore the Honest Baseline

**Files:**
- Create: `.github/workflows/flow-ci.yml`
- Modify: `README.md`
- Modify: `packages/server/src/routes/__tests__/health.test.ts`
- Modify: `packages/server/src/__tests__/watcher.test.ts`
- Modify: `packages/extension/src/panel/stores/slices/__tests__/promptBuilderSlice.test.ts`
- Modify: `packages/extension/src/content/__tests__/measurements.test.ts`

**Step 1: Recreate the local workspace install**

Run:

```bash
cd /Users/rivermassey/Desktop/dev/DNA/tools/flow
pnpm install
ls node_modules/.bin | rg '^(tsc|vitest|wxt)$'
```

Expected: all three binaries exist. If install fails, stop and fix workspace setup before touching feature code.

**Step 2: Capture the real baseline**

Run:

```bash
pnpm typecheck
pnpm --filter @flow/extension test --run
pnpm --filter @flow/server test --run
pnpm build
```

Expected: current failures are real and reproducible. Keep the raw failure list in the commit or session notes.

**Step 3: Make server tests deterministic**

- Refactor `packages/server/src/routes/__tests__/health.test.ts` to avoid live random port allocation.
- Refactor `packages/server/src/__tests__/watcher.test.ts` to mock `chokidar.watch` and drive watcher events in-process.

**Step 4: Fix extension baseline mismatches**

- Update `packages/extension/src/panel/stores/slices/__tests__/promptBuilderSlice.test.ts` to use an `AppState`-compatible test store.
- Update `packages/extension/src/content/__tests__/measurements.test.ts` to assert containment measurements instead of expecting an empty array.

**Step 5: Add Flow CI**

Create `.github/workflows/flow-ci.yml` at the repo root. Run Flow-only jobs from `tools/flow`:

```yaml
name: flow-ci
on:
  pull_request:
    paths:
      - 'tools/flow/**'
      - '.github/workflows/flow-ci.yml'
  push:
    branches: [main]
    paths:
      - 'tools/flow/**'
      - '.github/workflows/flow-ci.yml'
jobs:
  verify:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: tools/flow
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          cache-dependency-path: tools/flow/pnpm-lock.yaml
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm --filter @flow/extension test --run
      - run: pnpm --filter @flow/server test --run
      - run: pnpm build
```

**Step 6: Update the setup docs**

Update `README.md` so the documented install and verification commands exactly match the working baseline.

**Step 7: Verify and commit**

Run:

```bash
pnpm typecheck
pnpm --filter @flow/extension test --run
pnpm --filter @flow/server test --run
pnpm build
```

Expected: all commands pass.

Commit:

```bash
git add README.md .github/workflows/flow-ci.yml \
  packages/server/src/routes/__tests__/health.test.ts \
  packages/server/src/__tests__/watcher.test.ts \
  packages/extension/src/panel/stores/slices/__tests__/promptBuilderSlice.test.ts \
  packages/extension/src/content/__tests__/measurements.test.ts
git commit -m "chore(flow): restore honest baseline and add CI gate"
```

## Task 2: Repair the Comment Event Contract

**Files:**
- Modify: `packages/shared/src/messages.ts`
- Modify: `packages/extension/src/content/panelRouter.ts`
- Modify: `packages/extension/src/entrypoints/content.ts`
- Modify: `packages/extension/src/panel/hooks/usePanelConnection.ts`
- Modify: `packages/extension/src/entrypoints/background.ts`
- Modify: `packages/extension/src/content/__tests__/panelRouterComments.test.ts`
- Create: `packages/extension/src/panel/hooks/__tests__/usePanelConnection.test.ts`

**Step 1: Add a failing regression test for canonical comment events**

Create `packages/extension/src/panel/hooks/__tests__/usePanelConnection.test.ts` that proves `comment:submitted` and `comment:edited` updates reach the store and the panel context.

**Step 2: Run the targeted regression suite**

Run:

```bash
pnpm --filter @flow/extension test --run -- \
  src/content/__tests__/panelRouterComments.test.ts \
  src/panel/hooks/__tests__/usePanelConnection.test.ts
```

Expected: the new hook test fails until the contract is normalized.

**Step 3: Normalize the event names in one place**

- Declare one canonical message contract in `packages/shared/src/messages.ts`.
- Update `packages/extension/src/content/panelRouter.ts` and `packages/extension/src/entrypoints/content.ts` to emit the same event names.
- Update `packages/extension/src/panel/hooks/usePanelConnection.ts` and `packages/extension/src/entrypoints/background.ts` to listen for the same contract.

**Step 4: Re-run the targeted tests**

Run:

```bash
pnpm --filter @flow/extension test --run -- \
  src/content/__tests__/panelRouterComments.test.ts \
  src/panel/hooks/__tests__/usePanelConnection.test.ts
```

Expected: both tests pass.

**Step 5: Commit**

```bash
git add packages/shared/src/messages.ts \
  packages/extension/src/content/panelRouter.ts \
  packages/extension/src/entrypoints/content.ts \
  packages/extension/src/panel/hooks/usePanelConnection.ts \
  packages/extension/src/entrypoints/background.ts \
  packages/extension/src/content/__tests__/panelRouterComments.test.ts \
  packages/extension/src/panel/hooks/__tests__/usePanelConnection.test.ts
git commit -m "fix(flow): normalize comment event contract across extension contexts"
```

## Task 3: Introduce a Unified Feedback Schema

**Files:**
- Create: `packages/shared/src/types/feedbackV2.ts`
- Modify: `packages/shared/src/types/feedback.ts`
- Modify: `packages/shared/src/types/agentFeedback.ts`
- Modify: `packages/shared/src/index.ts`
- Modify: `packages/extension/src/panel/components/FeedbackPanel.tsx`
- Create: `packages/extension/src/panel/components/__tests__/FeedbackPanel.test.tsx`
- Modify: `packages/extension/src/services/promptCompiler.ts`
- Modify: `packages/extension/src/services/__tests__/promptCompiler.test.ts`

**Step 1: Add failing tests for unified threads**

- Extend `packages/extension/src/services/__tests__/promptCompiler.test.ts` so a mixed human and agent thread compiles into one feedback section.
- Create `packages/extension/src/panel/components/__tests__/FeedbackPanel.test.tsx` to assert one timeline grouped by `threadId`, including status and severity badges.

**Step 2: Run the targeted tests**

Run:

```bash
pnpm --filter @flow/extension test --run -- \
  src/services/__tests__/promptCompiler.test.ts \
  src/panel/components/__tests__/FeedbackPanel.test.tsx
```

Expected: the new thread-based cases fail until the shared type is introduced.

**Step 3: Add `FeedbackV2` and compatibility adapters**

Create `packages/shared/src/types/feedbackV2.ts` with a single record shape:

```ts
type FeedbackIntent = 'comment' | 'question' | 'issue' | 'suggestion';
type FeedbackSeverity = 'low' | 'medium' | 'high';
type FeedbackStatus = 'open' | 'acknowledged' | 'dismissed' | 'resolved';
interface FeedbackV2 {
  id: string;
  threadId: string;
  author: 'human' | 'agent';
  intent: FeedbackIntent;
  severity: FeedbackSeverity;
  status: FeedbackStatus;
  selector: string | null;
  componentName: string | null;
  content: string;
  createdAt: number;
  metadata?: Record<string, unknown>;
}
```

Then update `packages/shared/src/types/feedback.ts` and `packages/shared/src/types/agentFeedback.ts` to export adapters or aliases instead of competing shapes.

**Step 4: Move the extension UI and compiler to `FeedbackV2`**

- Update `packages/extension/src/panel/components/FeedbackPanel.tsx` to render one unified thread timeline.
- Update `packages/extension/src/services/promptCompiler.ts` to compile unified feedback threads, including agent replies and status metadata.

**Step 5: Re-run the targeted tests**

Run:

```bash
pnpm --filter @flow/extension test --run -- \
  src/services/__tests__/promptCompiler.test.ts \
  src/panel/components/__tests__/FeedbackPanel.test.tsx
pnpm --filter @flow/extension exec tsc --noEmit
```

Expected: tests and typecheck pass.

**Step 6: Commit**

```bash
git add packages/shared/src/types/feedbackV2.ts \
  packages/shared/src/types/feedback.ts \
  packages/shared/src/types/agentFeedback.ts \
  packages/shared/src/index.ts \
  packages/extension/src/panel/components/FeedbackPanel.tsx \
  packages/extension/src/panel/components/__tests__/FeedbackPanel.test.tsx \
  packages/extension/src/services/promptCompiler.ts \
  packages/extension/src/services/__tests__/promptCompiler.test.ts
git commit -m "refactor(flow): unify human and agent feedback under feedback v2"
```

## Task 4: Converge the MCP Feedback Lifecycle

**Files:**
- Modify: `packages/server/src/routes/mcp.ts`
- Modify: `packages/server/src/routes/websocket.ts`
- Modify: `packages/server/src/routes/__tests__/mcp.test.ts`
- Modify: `packages/server/src/routes/__tests__/websocket.test.ts`
- Modify: `packages/shared/src/messages.ts`

**Step 1: Add failing MCP and websocket tests**

- Extend `packages/server/src/routes/__tests__/mcp.test.ts` to expect `flow_watch_feedback`, `flow_acknowledge_feedback`, and `flow_dismiss_feedback`.
- Extend `packages/server/src/routes/__tests__/websocket.test.ts` to expect unified feedback updates in the session payload, not comments-only.

**Step 2: Run the targeted server tests**

Run:

```bash
pnpm --filter @flow/server test --run -- \
  src/routes/__tests__/mcp.test.ts \
  src/routes/__tests__/websocket.test.ts
```

Expected: the new cases fail until the tools and payloads are added.

**Step 3: Implement the lifecycle**

- Add `flow_watch_feedback`, `flow_acknowledge_feedback`, and `flow_dismiss_feedback` to `packages/server/src/routes/mcp.ts`.
- Treat `resolve`, `acknowledge`, and `dismiss` as status transitions on the same feedback record.
- Update `packages/server/src/routes/websocket.ts` so sidecar session updates push unified feedback state instead of comments-only deltas.

**Step 4: Re-run targeted and full server tests**

Run:

```bash
pnpm --filter @flow/server test --run -- \
  src/routes/__tests__/mcp.test.ts \
  src/routes/__tests__/websocket.test.ts
pnpm --filter @flow/server test --run
```

Expected: all server tests pass.

**Step 5: Commit**

```bash
git add packages/server/src/routes/mcp.ts \
  packages/server/src/routes/websocket.ts \
  packages/server/src/routes/__tests__/mcp.test.ts \
  packages/server/src/routes/__tests__/websocket.test.ts \
  packages/shared/src/messages.ts
git commit -m "feat(flow): add unified feedback lifecycle tools and websocket updates"
```

## Task 5: Converge on One Primary User Surface

**Files:**
- Create: `packages/extension/src/panel/components/layout/LayersPanel.tsx`
- Create: `packages/extension/src/panel/components/layout/__tests__/SidePanelLayout.test.tsx`
- Modify: `packages/extension/src/panel/components/layout/SidePanelLayout.tsx`
- Modify: `packages/extension/src/entrypoints/sidepanel/SidePanel.tsx`
- Modify: `packages/shared/src/types/modes.ts`
- Modify: `packages/extension/src/content/ui/toolbar.ts`
- Modify: `packages/extension/src/content/commentBadges.ts`
- Modify: `packages/extension/src/entrypoints/content.ts`
- Modify: `packages/extension/src/content/ui/spotlight.ts`
- Modify: `packages/extension/package.json`

**Step 1: Add a failing side-panel regression test**

Create `packages/extension/src/panel/components/layout/__tests__/SidePanelLayout.test.tsx` covering:
- `Layers` renders a real panel instead of placeholder copy.
- `Designer` still renders existing designer content.
- production mode does not depend on `Cmd+K` spotlight for the primary flow.

**Step 2: Replace the `Layers` placeholder with a real panel**

Create `packages/extension/src/panel/components/layout/LayersPanel.tsx` that shows the selected element hierarchy and current selection metadata using existing inspection context. Then wire `packages/extension/src/panel/components/layout/SidePanelLayout.tsx` to render it instead of `LayersStub`.

**Step 3: Collapse comment and question into one annotate flow**

- Add a single top-level annotate mode in `packages/shared/src/types/modes.ts`.
- Update `packages/extension/src/content/ui/toolbar.ts`, `packages/extension/src/content/commentBadges.ts`, and `packages/extension/src/entrypoints/content.ts` so intent is chosen in the composer, not as separate top-level modes.

**Step 4: Remove spotlight from the production path**

- Delete or hard-disable `Cmd+K` spotlight usage in `packages/extension/src/content/ui/spotlight.ts` and `packages/extension/src/entrypoints/content.ts`.
- Remove `cmdk` from `packages/extension/package.json` if nothing else imports it.

**Step 5: Verify the Side Panel flow**

Run:

```bash
pnpm --filter @flow/extension test --run -- \
  src/panel/components/layout/__tests__/SidePanelLayout.test.tsx \
  src/panel/hooks/__tests__/useActiveTabId.test.ts
pnpm --filter @flow/extension test --run
pnpm --filter @flow/extension exec tsc --noEmit
pnpm build
```

Expected: tests, typecheck, and build pass.

**Step 6: Commit**

```bash
git add packages/extension/src/panel/components/layout/LayersPanel.tsx \
  packages/extension/src/panel/components/layout/__tests__/SidePanelLayout.test.tsx \
  packages/extension/src/panel/components/layout/SidePanelLayout.tsx \
  packages/extension/src/entrypoints/sidepanel/SidePanel.tsx \
  packages/shared/src/types/modes.ts \
  packages/extension/src/content/ui/toolbar.ts \
  packages/extension/src/content/commentBadges.ts \
  packages/extension/src/entrypoints/content.ts \
  packages/extension/src/content/ui/spotlight.ts \
  packages/extension/package.json
git commit -m "feat(flow): converge on side panel and unified annotate workflow"
```

## Task 6: Remove Production-Blocking Stubs and Close Coverage Gaps

**Files:**
- Modify: `packages/extension/src/panel/stores/slices/assetsSlice.ts`
- Modify: `packages/extension/src/panel/stores/slices/workspaceSlice.ts`
- Modify: `packages/extension/src/panel/stores/slices/bridgeSlice.ts`
- Create: `packages/extension/src/panel/stores/slices/__tests__/assetsSlice.test.ts`
- Create: `packages/extension/src/panel/stores/slices/__tests__/workspaceSlice.test.ts`
- Create: `packages/extension/src/panel/stores/slices/__tests__/bridgeSlice.test.ts`
- Create: `docs/qa/production-smoke-checklist.md`
- Modify: `README.md`

**Step 1: Add failing tests for the known stubs**

Create slice tests that prove:
- assets loading either returns real data or a clearly unsupported state, never a silent stub.
- workspace initialization and open actions perform a real state transition.
- rect-based component selection does not fall back to "select all" on the primary path.

**Step 2: Replace or explicitly wall off the stubs**

- Implement the missing behavior in `assetsSlice.ts`, `workspaceSlice.ts`, and `bridgeSlice.ts` when the flow is required for production.
- If a path is not shipping in v1, disable it in the UI and return an explicit unsupported state instead of a no-op.

**Step 3: Add a manual smoke checklist**

Create `docs/qa/production-smoke-checklist.md` covering:
1. install and build
2. load unpacked extension
3. select element and inspect in Side Panel
4. create comment and question through the unified annotate flow
5. receive MCP feedback update and resolve it
6. verify prompt compilation includes unified thread history
7. reload extension and confirm session persistence expectations

**Step 4: Re-run the full verification suite**

Run:

```bash
pnpm typecheck
pnpm --filter @flow/extension test --run
pnpm --filter @flow/server test --run
pnpm build
```

Expected: all commands pass and the smoke checklist is executable as written.

**Step 5: Commit**

```bash
git add packages/extension/src/panel/stores/slices/assetsSlice.ts \
  packages/extension/src/panel/stores/slices/workspaceSlice.ts \
  packages/extension/src/panel/stores/slices/bridgeSlice.ts \
  packages/extension/src/panel/stores/slices/__tests__/assetsSlice.test.ts \
  packages/extension/src/panel/stores/slices/__tests__/workspaceSlice.test.ts \
  packages/extension/src/panel/stores/slices/__tests__/bridgeSlice.test.ts \
  docs/qa/production-smoke-checklist.md \
  README.md
git commit -m "chore(flow): harden panel state and document production smoke checks"
```

## Deferred Until After Release

- `docs/plans/2026-02-02-flow-2-phase-7-responsive-viewer.md`
- any new scanner panels or responsive workspace expansion
- deeper design-surface additions that do not improve correctness, feedback flow, or release confidence

## Definition of Done

This plan is complete only when:

1. Every exit criterion in this document is true.
2. `ops/session-status.md` points at this plan and reports no remaining active tasks.
3. The production smoke checklist is current and executable.
4. Superseded plan docs are clearly treated as historical context rather than current execution instructions.
