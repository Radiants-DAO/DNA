# Flow 2 Dogfood Mode Brainstorm

**Date:** 2026-02-06
**Status:** Decided

## What We're Building

A dogfood mode for the Flow 2 DevTools panel that outlines every component region and shows component name + file path on hover. This lets us identify exactly which component we're looking at, so we can reference it by name in Claude Code to make changes — using Flow to develop Flow.

## Why This Approach

The panel lives inside Chrome DevTools, so Flow's content scripts can't reach it to inspect it. Instead of building a complex mirror/standalone page, we add visual annotations directly to the panel UI. Toggle on, see outlines and tooltips, reference component names when making changes.

Flow 0 had dogfood mode as a toggle to let CommentMode/TextEditMode interact with its own UI (same DOM). Flow 2's version is simpler: just label everything so the developer knows what they're looking at.

## Key Decisions

- **Outline + tooltip** (not badges) — colored outlines around component regions, hover to see name + file path
- **Wrapper component** (`DogfoodBoundary`) — explicit wrapper around each major component, renders outline + tooltip when mode is active, no-op when off
- **Toggle** — uses existing `dogfoodMode` boolean in `uiStateSlice` (already defined, just unused)
- **Scope** — wrap all major panel components: EditorLayout, LeftPanel, RightPanel, PreviewCanvas, SettingsBar, all 9 designer sections, PromptBuilderPanel, ContextOutputPanel, CommentMode, TextEditMode, ComponentIdMode, FloatingModeBar, ColorPicker, GradientEditor, ShadowEditor

## Open Questions

- Keyboard shortcut for toggle? (e.g. Ctrl+Shift+D)
- Should outlines nest (component inside component) or only show leaf-level?
- Color coding by component type (layout=blue, designer=green, etc.) or uniform?

## Research Notes

- `uiStateSlice.ts:27` — `dogfoodMode: boolean` already exists, defaults to `false`
- `uiStateSlice.ts:110` — `setDogfoodMode` setter already exists
- `appStore.ts:51` — `dogfoodMode` already in `partialize` for persistence
- Flow 0 reference: `reference/flow-0/app/components/layout/SettingsBar.tsx:39` — `DogfoodToggle` component pattern
- No component in Flow 2 currently reads `dogfoodMode` from the store
