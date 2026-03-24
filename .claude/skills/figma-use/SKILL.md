# SKILL.md — figma-use

**name:** figma-use

**description:** MANDATORY prerequisite — invoke before every `use_figma` tool call. Trigger for write actions or unique read actions requiring JavaScript execution—create/edit/delete nodes, set up variables or tokens, build components and variants, modify auto-layout or fills, bind variables to properties, or inspect file structure programmatically.

**disable-model-invocation:** false

---

## Overview

The `use_figma` MCP executes JavaScript in Figma files via the Plugin API. Always pass `skillNames: "figma-use"` when calling `use_figma` for logging purposes.

For full-page or multi-section layout building, also load `figma-generate-design` to discover design system components, import them, and assemble screens incrementally.

Begin by loading `plugin-api-standalone.index.md` to understand capabilities, then grep `plugin-api-standalone.d.ts` for relevant types and methods.

For design system work: start with `working-with-design-systems/wwds.md` before referencing component, variable, text style, and effect style documentation.

---

## Critical Rules (Summary)

1. Use `return` to send data back; code auto-wraps asynchronously
2. Write plain JavaScript with top-level `await` and `return`
3. `figma.notify()` throws "not implemented"; never use it
4. `getPluginData()`/`setPluginData()` unsupported; use `getSharedPluginData()`/`setSharedPluginData()` instead
5. `console.log()` is not returned; use `return` for output
6. Work incrementally in small steps, validating after each
7. Colors use 0–1 range, not 0–255
8. Fills/strokes are read-only arrays; clone, modify, reassign
9. Load fonts before text operations: `await figma.loadFontAsync({family, style})`
10. Pages load incrementally; use `await figma.setCurrentPageAsync(page)` to switch
11. `setBoundVariableForPaint` returns a new paint; capture and reassign
12. `createVariable` accepts collection object or ID string
13. `layoutSizingHorizontal/Vertical = 'FILL'` must be set AFTER `parent.appendChild(child)`
14. Position new top-level nodes away from (0,0) to avoid overlap
15. On `use_figma` error, STOP—scripts are atomic with no partial execution
16. Return ALL created/mutated node IDs in structured format
17. Set `variable.scopes` explicitly when creating variables; defaults pollute property pickers
18. `await` every Promise—never leave async calls unresolved

---

## Page Rules (Critical)

Page context resets between calls; `figma.currentPage` starts on the first page each time.

Switch pages using **`await figma.setCurrentPageAsync(page)`**. The sync setter throws an error in `use_figma` runtimes.

```js
const targetPage = figma.root.children.find((p) => p.name === "My Page");
await figma.setCurrentPageAsync(targetPage);
// targetPage.children is now loaded
```

For multi-call workflows targeting non-default pages, call `await figma.setCurrentPageAsync(page)` at each call's start.

---

## Output via `return`

The agent sees **only** returned values.

- **Returning IDs (CRITICAL):** Every script creating or mutating canvas nodes must return all affected node IDs as `{ createdNodeIds: [...], mutatedNodeIds: [...] }`
- **Progress reporting:** Include counts, error arrays, status
- `console.log()` output is never returned
- Return actionable data so subsequent calls can reference objects

---

## Editor Mode

`use_figma` works in **design mode** (`editorType` "figma", default). FigJam ("figjam") blocks most design nodes.

**Available:** Rectangle, Frame, Component, Text, Ellipse, Star, Line, Vector, Polygon, BooleanOperation, Slice, Page, Section, TextPath

**Blocked:** Sticky, Connector, ShapeWithText, CodeBlock, Slide, SlideRow, Webpage

---

## Incremental Workflow

Avoid bugs by working in small steps:

1. **Inspect first** — discover existing pages, components, variables
2. **Do one thing per call** — create variables, then components, then layouts
3. **Return IDs from every call** — subsequent calls need these as inputs
4. **Validate after each step** — use `get_metadata`, `get_screenshot`
5. **Fix before moving on** — don't build on broken foundations

### Suggested step order
```
Step 1: Inspect file
Step 2: Create tokens/variables → validate
Step 3: Create components → validate
Step 4: Compose layouts → validate
Step 5: Final verification
```

---

## Error Recovery

Scripts are **atomic**—failed executions make zero changes; file remains unchanged.

**When errors occur:**
1. STOP immediately
2. Read the error message carefully
3. Call `get_metadata`/`get_screenshot` if unclear
4. Fix the script
5. Retry

| Error | Likely Cause | Fix |
|-------|-------------|-----|
| "not implemented" | Used `figma.notify()` | Remove it |
| "node must be an auto-layout frame..." | Set `FILL` before append | Move `appendChild` first |
| "Setting figma.currentPage is not supported" | Used sync setter | Use `await figma.setCurrentPageAsync(page)` |
| Property value out of range | Used 0–255 instead of 0–1 | Divide by 255 |
| "Cannot read properties of null" | Node doesn't exist | Verify ID and page context |

---

## Pre-Flight Checklist

- [ ] Code uses `return` (not `figma.closePlugin()`)
- [ ] Code is NOT wrapped in async IIFE
- [ ] `return` includes structured data with IDs, counts
- [ ] NO `figma.notify()` usage
- [ ] NO `console.log()` as output
- [ ] Colors use 0–1 range
- [ ] Fills/strokes are reassigned as new arrays
- [ ] Page switches use `await figma.setCurrentPageAsync(page)`
- [ ] `layoutSizingVertical/Horizontal = 'FILL'` set AFTER `appendChild`
- [ ] `loadFontAsync()` called BEFORE text changes
- [ ] `lineHeight`/`letterSpacing` use `{unit, value}` format
- [ ] `resize()` called BEFORE sizing modes
- [ ] New top-level nodes positioned away from (0,0)
- [ ] ALL created/mutated IDs returned in structured format
- [ ] Every async call is `await`ed

---

## Discover Conventions First

Always inspect the Figma file before creating anything. Match existing naming conventions, variable structures, and component patterns.

**Quick inspection scripts:**

List pages and top-level nodes:
```js
const pages = figma.root.children.map(p =>
  `${p.name} id=${p.id} children=${p.children.length}`);
return pages.join('\n');
```

List existing components:
```js
const results = [];
for (const page of figma.root.children) {
  await figma.setCurrentPageAsync(page);
  page.findAll(n => {
    if (n.type === 'COMPONENT' || n.type === 'COMPONENT_SET')
      results.push(`[${page.name}] ${n.name} (${n.type}) id=${n.id}`);
    return false;
  });
}
return results.join('\n');
```

List variable collections:
```js
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const results = collections.map(c => ({
  name: c.name, id: c.id,
  varCount: c.variableIds.length,
  modes: c.modes.map(m => m.name)
}));
return results;
```

---

## Reference Docs

| Doc | When to Load | Coverage |
|-----|-------------|----------|
| gotchas.md | Before any `use_figma` | All known pitfalls with WRONG/CORRECT examples |
| common-patterns.md | Need code examples | Script scaffolds: shapes, text, auto-layout, variables, components |
| plugin-api-patterns.md | Creating/editing nodes | Fills, strokes, Auto Layout, effects, grouping, cloning, styles |
| api-reference.md | Need exact API surface | Node creation, variables API, properties |
| validation-and-recovery.md | Multi-step writes or errors | `get_metadata` vs `get_screenshot` workflow |
| component-patterns.md | Creating components/variants | combineAsVariants, properties, INSTANCE_SWAP, discovery |
| variable-patterns.md | Creating/binding variables | Collections, modes, scopes, aliasing, binding, discovery |
| text-style-patterns.md | Creating/applying text styles | Type ramps, font probing, listing, applying styles |
| effect-style-patterns.md | Creating/applying effect styles | Drop shadows, listing, applying styles |
| plugin-api-standalone.index.md | Full API surface understanding | Index of all types, methods, properties |
| plugin-api-standalone.d.ts | Exact type signatures | Full typings—grep for symbols, don't load entirely |

---

## Snippets

Throughout documentation, snippets contain reusable plugin API code. Use as-is or as starter code. Key concepts documented as generic snippets can be written to disk for future reuse.
