# React DevTools Integration Brainstorm

**Date:** 2026-02-05
**Status:** Decided

## What We're Building

A **Layers tab** that renders the full React component tree for the inspected page, with inline props/state editing per component. Selecting a component in the tree triggers full cross-tab sync — highlighting on page, populating Designer with styles, and updating the Inspector view. Prop/state changes flow into the existing Mutations tab alongside CSS edits for unified change tracking.

## Why This Approach

Direct fiber tree integration via `__REACT_DEVTOOLS_GLOBAL_HOOK__` rather than forking React DevTools. Flow already has `fiberWalker.ts` extracting component names, props, source locations, and hierarchy from the fiber tree. The hook's `overrideProps` and `overrideHookState` APIs enable live editing without maintaining a React DevTools fork.

## Key Decisions

- **Full page tree** — show entire component hierarchy from root, not just subtree of selection
- **Inline props/state editing** — expanding a component in the tree reveals editable props/state below it
- **Separate tab** — Layers lives alongside (not replacing) the existing Components flat-scan tab
- **Unified mutations** — prop/state overrides appear in the Mutations tab alongside CSS diffs
- **Full cross-tab sync** — clicking a component in Layers = Alt+clicking its DOM element (highlights on page, populates Designer, updates Inspector)

## Tab Layout After Integration

| Tab | Purpose | New? |
|-----|---------|------|
| Inspector | PreviewCanvas + mode overlays | Existing |
| **Layers** | Full React component tree + inline props/state editing | **New** |
| Components | Flat component scan with framework badges | Existing |
| Designer | CSS style editing for selected element | Existing |
| Mutations | Unified diffs (CSS + prop/state overrides) | Existing (extended) |
| Prompt | LLM context output | Existing |

## What Needs to Be Created

### Content Script Layer
- **Fiber tree walker** — extend `fiberWalker.ts` to walk the full tree (currently only walks up from a single element). Needs `getFiberRoots()` traversal to build complete tree
- **Prop/state override agent** — new agent command that calls `overrideProps(fiber, path, value)` and `overrideHookState(fiber, hookId, path, value)` on the hook renderer
- **Tree change listener** — hook into renderer's `onCommitFiberRoot` to detect re-renders and push tree updates to panel

### Message Bridge
- **New message types**: `flow:content:fiber-tree` (full tree snapshot), `flow:content:fiber-update` (incremental re-render delta), `panel:override-prop`, `panel:override-state`
- **Selection sync**: `panel:select-fiber` message triggers element highlight + inspection pipeline on the content side

### Panel Layer
- **LayersPanel component** — recursive tree UI with expand/collapse, component name + source file, indent lines
- **Inline prop/state editor** — collapsible section per component showing editable key/value pairs. JSON editor for complex objects, inline inputs for primitives
- **MutationSlice extension** — new diff type `prop-override` alongside existing `style-change`. Track fiber ID + prop path + old/new value
- **Cross-tab sync wiring** — selecting in Layers dispatches same actions as `element:selected` message, triggering Designer population and page highlight

### Shared Types
- `FiberTreeNode` — id, componentName, props, state, hooks, children[], source, elementRef
- `PropOverrideDiff` — fiberId, path, oldValue, newValue, type: 'prop' | 'state'

## Data Flow

```
[Page] __REACT_DEVTOOLS_GLOBAL_HOOK__
  → fiberWalker walks full tree from roots
  → serializes to FiberTreeNode[]
  → sends flow:content:fiber-tree via port
  → Panel receives, renders LayersPanel

[Panel] User clicks component in Layers
  → sends panel:select-fiber with elementRef
  → content script highlights element, runs inspection
  → sends element:selected + inspection-result back
  → Designer tab populates, Inspector tab updates

[Panel] User edits prop in Layers
  → sends panel:override-prop with fiberId + path + value
  → agent calls hook.overrideProps()
  → React re-renders component
  → onCommitFiberRoot fires, sends updated tree diff
  → Mutations tab records PropOverrideDiff
```

## Open Questions

- **Performance**: full tree serialization on large apps (1000+ components) — may need virtualized tree + lazy child loading
- **Hooks display**: should we show all hooks (useState, useEffect, useMemo, useRef) or just state hooks that are editable?
- **Re-render tracking**: do we want visual re-render flash indicators in the tree (like React DevTools profiler)?
- **Non-React pages**: Layers tab shows empty state, Components tab still works for Vue/Svelte/custom elements

## Research Notes

- `agent/fiberWalker.ts` — already walks fiber, extracts props/source/hierarchy. Needs extension for full-tree traversal
- `agent/index.ts` — agent bridge listens for `flow:content:request-fiber`, responds with fiber data per element
- `shared/types/inspection.ts` — `FiberData.hierarchy: HierarchyEntry[]` exists but only stores parent chain (up), not children (down)
- `panel/components/ComponentsPanel.tsx` — flat scan via framework detection, no hierarchy
- `panel/stores/slices/mutationSlice.ts` — tracks `mutationDiffs[]`, needs new diff type for prop overrides
- Dual mutation system (mutationEngine vs mutationRecorder) needs unification before this work — noted in `docs/solutions/2026-02-06-inspector-vs-flow-comparison.md`
