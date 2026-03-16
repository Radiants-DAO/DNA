# Release Blockers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the npm release blockers for the core and React packages so the workspace builds cleanly and the published artifacts match the documented contract.

**Architecture:** First repair the workspace/package wiring so Turbo and pnpm build the sibling packages in the intended order and the React tarball ships declarations. Then make the core gradient renderer runtime-safe without DOM globals, add regression coverage, and align release metadata and docs with the real package names and API.

**Tech Stack:** pnpm workspaces, Turborepo, TypeScript, tsup, Vitest, React 18

---

### Task 1: Repair workspace and publish metadata

**Files:**
- Modify: `packages/react/package.json`
- Modify: `.changeset/config.json`

**Steps:**
1. Point `@rdna/dithwather-react` at `@rdna/dithwather-core` with the workspace protocol.
2. Add the React package `types` entry and `exports["."].types`.
3. Fix linked package names in Changesets so versioning tracks the actual published packages.

### Task 2: Add a failing Node regression for core gradient rendering

**Files:**
- Create: `packages/core/src/gradients/render.node.test.ts`

**Steps:**
1. Add a `node` environment test that calls `renderGradientDither` with no DOM globals available.
2. Run the targeted test to verify it fails for the current `document` fallback.

### Task 3: Make core gradient rendering DOM-independent

**Files:**
- Modify: `packages/core/src/gradients/render.ts`

**Steps:**
1. Replace the `document.createElement('canvas')` fallback in `createImageData` with a pure-JS `ImageData` shim object when the global constructor is unavailable.
2. Re-run the targeted Node test and the core test suite to verify the renderer works in both environments.

### Task 4: Align docs with the real package contract

**Files:**
- Modify: `README.md`
- Modify: `packages/core/README.md`
- Modify: `packages/react/README.md`

**Steps:**
1. Replace stale `@dithwather/*` names with the actual `@rdna/*` package names.
2. Update examples to use the current public API.
3. Document that pure pixel rendering works without the DOM while canvas/data URL helpers require a browser-like environment.

### Task 5: Verify the release path end to end

**Steps:**
1. Run `pnpm install` to refresh workspace links and lockfile state.
2. Run `pnpm typecheck`, `pnpm build`, and `pnpm test`.
3. Run `npm pack --dry-run --json` for both packages with a writable cache override and confirm declarations/files are present.
