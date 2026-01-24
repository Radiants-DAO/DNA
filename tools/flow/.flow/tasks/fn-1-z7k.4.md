# fn-1-z7k.4 Integrate fiber parsing into CommentMode

## Description
Integrate fiber source parsing into CommentMode's `getElementInfo()` function.

**File to modify**: `src/components/CommentMode.tsx:83-122`

**Changes**:

1. Import fiber utilities:
   ```typescript
   import { getFiberFromElement, extractDebugSource, fiberSourceToLocation, ReactFiber } from "../utils/fiberSource";
   ```

2. Read `dogfoodMode` from store:
   ```typescript
   const dogfoodMode = useAppStore((s) => s.dogfoodMode);
   ```

3. Add helper to detect iframe elements (ROBUST version):
   ```typescript
   /**
    * Check if element is inside an iframe or IS an iframe.
    * Handles both cases:
    * - Element inside iframe: ownerDocument !== document
    * - Element IS an iframe: check for contentDocument
    */
   function isIframeOrInIframe(element: HTMLElement): boolean {
     // Element is inside an iframe
     if (element.ownerDocument !== document) {
       return true;
     }
     // Element IS an iframe (don't try fiber parsing on iframe element itself)
     if (element.tagName === 'IFRAME') {
       return true;
     }
     return false;
   }
   ```

4. Update `getElementInfo()` logic:
   ```typescript
   const getElementInfo = useCallback((element: HTMLElement): ElementInfo => {
     // Existing: check data-radflow-id (bridge components)
     // Existing: check data-devflow-id (RadFlow UI)

     // NEW: If dogfoodMode is ON and element is NOT in iframe
     if (dogfoodMode && !isIframeOrInIframe(element)) {
       const fiber = getFiberFromElement(element);
       if (fiber) {
         const debugSource = extractDebugSource(fiber);
         if (debugSource) {
           // Get component name from fiber.type (handle string types for intrinsics)
           const componentName = typeof fiber.type === 'string'
             ? fiber.type
             : (fiber.type?.displayName || fiber.type?.name || "Component");

           return {
             componentName,
             source: fiberSourceToLocation(debugSource),
             selector: generateSelector(element),
             devflowId: null,
           };
         }
       }
     }

     // Existing fallback logic...
   }, [dogfoodMode, findComponentByRadflowId]);
   ```

**Behavior**:
- When `dogfoodMode` OFF: existing behavior (bridge + devflow-id + fallback)
- When `dogfoodMode` ON: try fiber first for non-iframe elements, then fallback
- Iframe elements (inside OR the iframe tag itself) always use existing logic

## Acceptance
- [ ] Fiber utilities imported in CommentMode.tsx
- [ ] `dogfoodMode` read from store
- [ ] `isIframeOrInIframe` helper handles both cases (inside iframe AND iframe element)
- [ ] `getElementInfo()` tries fiber parsing when dogfoodMode ON
- [ ] Iframe elements still use bridge/existing logic
- [ ] Handles both object and string fiber.type (intrinsic elements)
- [ ] Fallback to CSS selector when fiber source unavailable
- [ ] Comment popover shows file:line when source found
- [ ] Compiled markdown groups by file with line numbers
- [ ] TypeScript compiles without errors
- [ ] Manual test: toggle ON, press C, click RadFlow button, see file:line
## Done summary
Integrated fiber source parsing into CommentMode's getElementInfo() function. When dogfoodMode is ON, clicking RadFlow UI elements now extracts React fiber debug source for precise file:line references. Includes robust iframe detection and try-catch error handling per review feedback.
## Evidence
- Commits: 7708930, 86c59c2
- Tests: npx tsc --noEmit
- PRs: