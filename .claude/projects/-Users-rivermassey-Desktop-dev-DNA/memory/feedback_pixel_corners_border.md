---
name: pixel-corners-border-overflow-rule
description: Never use border or overflow-hidden on pixel-rounded elements — ::after handles borders, clip-path handles overflow. Enforce with rdna/no-clipped-shadow extension.
type: feedback
---

## Rule: No border/overflow-hidden on pixel-cornered elements

### What goes wrong
`pixel-rounded-*` classes use `clip-path` (for corners) and `::after` (for visible border).

Adding `border border-*` or `overflow-hidden` to the same element:
- The CSS border gets clipped by the `clip-path` → visible border clips at edges
- `overflow-hidden` clips the `::after` pseudo-element → border disappears or partially clips
- Combined, the card borders visually cut off, especially on the right/bottom edges

### The rule
- **NEVER** put `border-*` classes on elements that also have `pixel-rounded-xs/sm/md/lg/xl`
- **NEVER** put `overflow-hidden` on elements that also have `pixel-rounded-*`
- `pixel-rounded-*` handles its own border via `::after` — no explicit border needed
- `pixel-rounded-*` handles its own overflow via `clip-path` — no `overflow-hidden` needed

### Exception: small non-decorative elements
For small indicator swatches (w-4/w-5/w-6, no decorative intent), use `rounded-sm` (standard Tailwind radius) instead of `pixel-rounded-xs` so `border` + `overflow-hidden` can be used freely.

### Enforcement
Tracked by `rdna/no-clipped-shadow` (shadow variant) in eslint-plugin-rdna. A parallel `rdna/no-pixel-border` rule should be added to catch the border/overflow variant.
