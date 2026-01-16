# fn-5.5 React fiber hook implementation

## Description
Implement the React DevTools hook integration used by the bridge for fiber
inspection and component metadata.

**Hook Mechanism:**
- Hook into `window.__REACT_DEVTOOLS_GLOBAL_HOOK__`
- Walk fiber tree on `onCommitFiberRoot`
- Add `data-radflow-id` attributes to DOM elements
- Build `componentMap: Map<elementId, ComponentInfo>`

**DevTools Collision Handling:**
- If `__REACT_DEVTOOLS_GLOBAL_HOOK__` already exists (browser extension), wrap/forward calls
- Log warning in RadFlow UI when collision detected
- Document: "Disable browser React DevTools for best experience"
- Chain pattern: store original callbacks, call both

## Acceptance
- [ ] Hook initializes without crashing target app
- [ ] `data-radflow-id` attributes added to DOM elements
- [ ] `componentMap` accessible via `window.__RADFLOW_HOOK__`
- [ ] Existing DevTools hooks are chained, not replaced
- [ ] Warning shown in RadFlow when DevTools extension detected
- [ ] Component names resolved (displayName || name || anonymous)

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
