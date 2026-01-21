# fn-2-gnc.12 Enhance DOM Annotator with Attribute Injection

## Description
Modify `packages/bridge/src/dom-annotator.ts` to inject `data-radflow-id` attributes into the live DOM for selection/hover detection.

## Context
Canvas interaction (fn-2-gnc.9) assumes `data-radflow-id` attributes exist on DOM elements, but the current bridge only tracks elements in a Map without injecting attributes.

## Implementation

1. **Attribute Injection**: When a component is mounted and tracked, inject `data-radflow-id` attribute
2. **Cleanup**: Remove attributes on unmount to prevent stale references
3. **Dynamic Content**: Use MutationObserver to re-apply attributes when DOM changes dynamically
4. **Performance**: Batch attribute updates to avoid layout thrashing

## Key Files
- **Modify**: `packages/bridge/src/dom-annotator.ts`
- **Test**: `packages/bridge/src/__tests__/dom-annotator.test.ts`
## Acceptance
- [x] dom-annotator.ts injects data-radflow-id attributes on component mount
- [x] Attributes removed on component unmount (cleanup)
- [x] MutationObserver re-applies attributes on dynamic content changes
- [x] Attribute updates are batched to avoid layout thrashing
- [x] Unit tests cover mount/unmount/mutation scenarios
- [x] Bridge message protocol unchanged (backward compatible)
## Done summary
Enhanced DOM annotator with data-radflow-id attribute injection, batched updates using requestAnimationFrame, and MutationObserver for dynamic content re-application. Added comprehensive unit tests covering mount/unmount/mutation scenarios.

## Evidence
- Commits: 27333689340934b8f6d5644a4871127b14154998
- Tests: pnpm test -- --grep dom-annotator (20 tests passed)
- PRs:
