# Moodboard Canvas App Brainstorm

**Date:** 2026-04-11
**Status:** Decided

## What We're Building

A RadOS app that renders, creates, and curates Obsidian-compatible `.canvas` files as "vibe boards". Drag/drop/paste images, links, and text to quickly collect references into a machine-readable local vault. Each `.canvas` is one vibe, with a sidecar `.md` front-matter file for tags and description. Full Obsidian Canvas 1:1 parity is the destination.

## Why This Approach

**Approach A — Collection-loop-first.** The primary goal is *collecting*, not editing. Phase 1 gets the end-to-end drop-and-save loop working so the app is usable on day one; editing becomes polish on top. React Flow handles nodes, edges, and pan/zoom out of the box; we bridge its model to the JSON Canvas spec on load/save. Filesystem Access API holds the vault directly, so every file is a real Obsidian-readable document on disk.

## Key Decisions

- **Vault storage**: Filesystem Access API. User picks a folder once; app reads/writes `.canvas`, images, and sidecar `.md` files directly to disk. Chromium-only is fine for RadOS.
- **Vibe model**: one `.canvas` file = one vibe. Spatial arrangement IS the organization.
- **Scope target**: full Obsidian Canvas 1:1 parity — `text` / `file` / `link` / `group` nodes, edges, resize, inline markdown editing.
- **Renderer**: React Flow (`@xyflow/react`). Bridges to JSON Canvas on load/save.
- **Metadata**: sidecar `.md` with YAML front-matter — tags, mood descriptors, description, timestamps, source URLs. Grep-able, git-friendly, Obsidian-readable.
- **Vibe browser**: collapsible sidebar inside the RadOS window with live thumbnails + tag chips.
- **Build phasing**: Approach A — collection-loop-first.
  - **Phase 1** — vault picker, sidebar, create canvas, drop/paste to add nodes, save to disk. Existing nodes are read-only for now.
  - **Phase 2** — full node interaction: move, resize, select, delete.
  - **Phase 3** — edges: create, delete, route.
  - **Phase 4** — metadata sidecar layer: front-matter editor, tag chips in sidebar, tag-based filtering.
  - **Phase 5** — groups, inline markdown editing, full parity.

## Open Questions

- **Link node previews** — OG metadata fetch: client-side (CORS?), Next.js route handler, or plain link chip with no preview in Phase 1?
- **Image paste storage** — default path inside vault (`assets/`? hashed filenames? keep originals?).
- **Multi-canvas windows** — opening a second canvas: new RadOS window or replace current? (Defer until Phase 2.)
- **RDNA styling of React Flow** — how much of React Flow's default chrome do we override vs hide? Needs a visual spike in Phase 1.
- **Conflict resolution** — Obsidian edits the same canvas while RadOS has it open: last-write-wins or merge? (Phase 5+.)

## Worktree Context

- **Path**: `/Users/rivermassey/Desktop/dev/DNA-moodboard`
- **Branch**: `feat/moodboard-app`

## Research Notes

- **JSON Canvas spec** — open standard at jsoncanvas.org. Node types: `text`, `file`, `link`, `group`. Edges reference node IDs with optional side/end labels.
- **Existing RadOS apps** (no canvas/moodboard yet): About, BrandAssets, GoodNews, Links, Manifesto, PatternPlayground, Pretext, RadRadio, Scratchpad, Studio, TypographyPlayground.
- App components live at `apps/rad-os/components/apps/`. Window state is managed in `apps/rad-os/store/slices/windowsSlice.ts`.
- **Tailwind v4 trap** — `max-w-{T-shirt}` classes resolve to tiny values. React Flow styling must use explicit rem widths on any wrapper constraints.
- **Filesystem Access API** — Chromium only; `showDirectoryPicker()` needs a user gesture; folder handles can be persisted in IndexedDB to restore the vault across sessions without reprompting.
- **React Flow** — `@xyflow/react`, custom node types via `nodeTypes` prop, custom edges via `edgeTypes`. Built-in pan/zoom, minimap, controls. MIT license.
