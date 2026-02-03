# Dogfood Mode + Fiber Source Parsing for Comment Mode

## Overview

Enable commenting on RadFlow's own UI (dogfooding) by parsing React fiber `_debugSource` to get actual file paths and line numbers. Add a toggle in the top bar to switch between dogfood mode (comment on RadFlow UI) and normal mode (comment on iframe/target project only).

**Current state**: Comment Mode works but returns `source: null` for RadFlow UI elements, producing unhelpful selectors like `div.flex > button:nth-child(2)` instead of `src/components/ModeToolbar.tsx:47`.

**Target state**: When Dogfood Mode is ON, clicking any RadFlow UI element extracts its React fiber debug source, providing precise `file:line` references in compiled prompts.

## Scope

**In scope**:
- Add `dogfoodMode: boolean` state to UiSlice
- Add `dogfoodMode` to `partialize` in appStore.ts for persistence
- Add toggle switch in TitleBar (right section)
- Implement fiber extraction with own `ReactFiber` interface (React internals not exported)
- Three-tier fiber lookup: DevTools hook → DOM property scan (`__reactFiber$` prefix) → root container
- Fallback chain: `_debugSource` → `_debugOwner` chain → data attributes → CSS selector
- React 18/19 compatibility (check for `_debugSource` vs `_debugStack`)
- File path normalization: convert absolute paths to project-relative paths
- Update vault comment-mode.md with current implementation status
- Disable dogfood toggle in production builds using `import.meta.env.PROD`

**Out of scope**:
- Source map resolution
- Cross-origin iframe fiber access
- Arrow key component navigation
- Babel plugin for data-inspector attributes

## Approach

1. **State**: Add `dogfoodMode` to `UiSlice` following existing `devMode` pattern
2. **Persistence**: Add `dogfoodMode` to `partialize` in `appStore.ts` (line 57-71)
3. **Toggle UI**: Add switch in TitleBar (right section, before clipboard indicator)
   - Use `import.meta.env.PROD` to hide in production (Vite/Tauri standard)
4. **Fiber utility**: Create `src/utils/fiberSource.ts` with:
   - Own `ReactFiber` interface (type-safe, not dependent on React internals)
   - `getFiberFromElement(element)` - three-tier lookup
   - `extractDebugSource(fiber)` - traverse `_debugOwner` chain for source
   - `fiberSourceToLocation(source)` - normalize absolute paths to relative
   - `isReact19()` - version detection for `_debugStack` fallback
5. **Integration**: Update `CommentMode.getElementInfo()` to call fiber parsing when `dogfoodMode` is ON and element is NOT in iframe
   - Iframe detection: check `element.ownerDocument !== document` AND handle `contentDocument` for iframe elements themselves
6. **Documentation**: Update vault spec with implementation status and features

## Quick commands

```bash
# TypeScript check
npx tsc --noEmit

# Run dev server
pnpm tauri dev

# Verify dogfood mode
# 1. Toggle ON in top bar
# 2. Press C for comment mode
# 3. Click any RadFlow UI element
# 4. Should show file:line in popover header and compiled prompt
```

## Acceptance

- [ ] Dogfood Mode toggle visible in TitleBar (right section)
- [ ] Toggle OFF by default, persists across sessions (via `partialize`)
- [ ] Toggle hidden/disabled in production builds (`import.meta.env.PROD`)
- [ ] When ON: clicking RadFlow UI elements shows `file:line` in comment popover
- [ ] When OFF: comment mode only works on iframe content (existing behavior)
- [ ] Fallback to CSS selector when fiber source unavailable (no crash)
- [ ] File paths are project-relative, not absolute
- [ ] Compiled markdown shows proper file grouping with line numbers
- [ ] Vault comment-mode.md updated with implementation status

## Risks

| Risk | Mitigation |
|------|------------|
| React 19 removed `_debugSource` | Check React version, fall back to `_debugStack` parsing |
| DevTools hook unavailable in Tauri | Use direct DOM property scan (`__reactFiber$` prefix) as primary |
| Production builds have no source info | Hide/disable toggle using `import.meta.env.PROD` |
| Fiber API changes between React versions | Feature-detect properties, graceful fallback |
| React Fiber types not exported | Define own `ReactFiber` interface matching needed properties |

## References

- Spec: `~/Desktop/vault/radflow/02-Features/comment-mode.md` (lines 316-326)
- Pattern: `src/stores/slices/uiSlice.ts:98` (`setDevMode`)
- Persistence: `src/stores/appStore.ts:57-71` (`partialize`)
- Target file: `src/components/CommentMode.tsx:83-122` (`getElementInfo`)
- Libraries: click-to-component, react-dev-inspector, react-scan patterns
