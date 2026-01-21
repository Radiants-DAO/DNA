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
- [ ] dom-annotator.ts injects data-radflow-id attributes on component mount
- [ ] Attributes removed on component unmount (cleanup)
- [ ] MutationObserver re-applies attributes on dynamic content changes
- [ ] Attribute updates are batched to avoid layout thrashing
- [ ] Unit tests cover mount/unmount/mutation scenarios
- [ ] Bridge message protocol unchanged (backward compatible)
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
