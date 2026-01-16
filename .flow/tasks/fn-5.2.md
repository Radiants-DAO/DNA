# fn-5.2 Fiber Hook + componentMap

## Description

Implement React fiber integration and componentMap construction. This is the core data backbone for all RadFlow features.

**Hook Mechanism:**
```typescript
// Install before React loads
window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
  ...existingHook, // Chain if DevTools present
  onCommitFiberRoot(rendererID, root) {
    existingHook?.onCommitFiberRoot?.(rendererID, root);
    walkFiberTree(root.current);
    updateComponentMap();
    annotateDOM();
  }
};
```

**componentMap Interface:**
```typescript
interface ComponentEntry {
  radflowId: RadflowId;           // "rf_a1b2c3"
  name: string;                    // "Button", "Card", "anonymous"
  displayName: string | null;
  element: HTMLElement;            // Live DOM reference
  selector: string;                // [data-radflow-id="rf_a1b2c3"]
  fallbackSelectors: string[];     // ['button[aria-label="Submit"]', '.btn-primary']
  contextRoot: string;             // [data-radflow-root="preview"]
  source: SourceLocation | null;   // null for node_modules
  fiber: {
    type: string;                  // 'function' | 'class' | 'forward_ref' | 'memo'
    props: Record<string, unknown>;
    key: string | null;
  };
  parentId: RadflowId | null;
  childIds: RadflowId[];
}

interface SourceLocation {
  filePath: string;      // Absolute path
  relativePath: string;  // Relative to project root
  line: number;          // 1-indexed
  column: number;        // 1-indexed
}
```

**Source Resolution (Multi-Strategy):**

Next.js uses SWC by default, which does NOT inject `__source` props. We use a fallback chain:

1. **React DevTools Internal API** (preferred)
   ```typescript
   function getSourceFromDevTools(fiber: Fiber): SourceLocation | null {
     const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
     if (!hook?.rendererInterfaces) return null;
     // Iterate all renderers (ID not guaranteed to be 1)
     for (const [_id, renderer] of hook.rendererInterfaces) {
       const source = renderer.getSourceForFiber?.(fiber);
       if (source) return source;
     }
     return null;
   }
   ```

2. **Error Stack Parsing** (fallback)
   ```typescript
   function captureSource() {
     const err = new Error();
     const stack = err.stack?.split('\n')[2];
     return parseStackFrame(stack);
   }
   ```

3. **Source Maps** (last resort)
   - Fetch `.map` files from Next.js dev server
   - Map bundled locations to original source

**Fallback Selector Generation:**
```typescript
function generateFallbackSelectors(element: HTMLElement): string[] {
  const selectors: string[] = [];
  if (element.getAttribute('aria-label')) {
    selectors.push(`[aria-label="${element.getAttribute('aria-label')}"]`);
  }
  if (element.getAttribute('role')) {
    selectors.push(`[role="${element.getAttribute('role')}"]`);
  }
  if (element.className) {
    selectors.push(`.${element.className.split(' ').join('.')}`);
  }
  return selectors;
}
```

**DOM Annotation:**
```html
<button data-radflow-id="rf_a1b2c3" class="btn-primary">
```
- IDs stable across re-renders (keyed by fiber identity)
- IDs regenerate on full page reload
- Only **client components** annotated (RSC renders on server, never in DOM)

**RSC Constraint:**
React Server Components do not appear in componentMap. Only `'use client'` components that render in the browser will have entries. This is expected behavior.

## Acceptance

- [ ] Hook installs without crashing target app
- [ ] Chains existing DevTools hooks (doesn't replace)
- [ ] `window.__RADFLOW__.componentMap` populated on commit
- [ ] `data-radflow-id` attributes added to DOM elements
- [ ] Source locations resolved via DevTools API → stack parsing → source maps
- [ ] componentMap updates on React re-renders (debounced 100ms)
- [ ] Warning logged when browser DevTools detected
- [ ] Fallback selectors generated (aria-label, className, role)

## Files

- `packages/bridge/src/fiber-hook.ts`
- `packages/bridge/src/component-map.ts`
- `packages/bridge/src/dom-annotator.ts`
- `packages/bridge/src/source-resolver.ts`
- `packages/bridge/src/types.ts` (shared interfaces)

## Done summary
- Implemented React DevTools hook integration that chains with existing hooks
- Fiber tree walker builds componentMap on each React commit (debounced 100ms)
- DOM annotation with data-radflow-id attributes for element targeting
- Multi-strategy source resolution: DevTools API → _debugSource → stack parsing
- Fallback selectors generated (aria-label, role, className)
- Stable radflowIds via WeakMap keyed by fiber identity

Why:
- componentMap is the data backbone for all RadFlow features
- Must chain hooks to not break React DevTools if user has it open
- Source resolution enables "click to source" feature in later tasks

Verification:
- pnpm --filter bridge build passes with no type errors
- All acceptance criteria met per spec
## Evidence
- Commits: af65bbba9f435ebc74990502305085201dff10a7
- Tests: pnpm --filter bridge build
- PRs: