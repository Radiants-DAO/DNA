# fn-1-z7k.3 Create fiber source extraction utility

## Description
Create a utility module for extracting React fiber debug source information from DOM elements.

**New file**: `src/utils/fiberSource.ts`

**Types** (define our own - React internals are not exported):

```typescript
/**
 * React Fiber internal type (minimal interface for our needs).
 * React does NOT export fiber types - we define our own.
 */
interface ReactFiber {
  type: {
    displayName?: string;
    name?: string;
  } | string | null;
  _debugSource?: FiberDebugSource | null;
  _debugOwner?: ReactFiber | null;
  _debugStack?: string; // React 19+
  return?: ReactFiber | null;
}

interface FiberDebugSource {
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
}

// Extend Element for fiber access
interface FiberElement extends Element {
  [key: `__reactFiber$${string}`]: ReactFiber | undefined;
}
```

**Exports**:

```typescript
// Get fiber from DOM element (two-tier lookup - DevTools hook is unreliable in Tauri)
export function getFiberFromElement(element: HTMLElement): ReactFiber | null;

// Extract debug source from fiber (traverse _debugOwner chain)
export function extractDebugSource(fiber: ReactFiber): FiberDebugSource | null;

// Convert to SourceLocation format (normalizes absolute paths to relative)
export function fiberSourceToLocation(source: FiberDebugSource): SourceLocation;

// Check if React 19+ (uses _debugStack instead of _debugSource)
export function isReact19OrLater(): boolean;
```

**Implementation**:

1. **Fiber lookup** (priority order):
   ```typescript
   export function getFiberFromElement(element: HTMLElement): ReactFiber | null {
     // Primary: Scan DOM properties for __reactFiber$ prefix
     // This is the most reliable in Tauri where DevTools hook may not exist
     const fiberKey = Object.keys(element).find(
       key => key.startsWith('__reactFiber$')
     );
     if (fiberKey) {
       return (element as FiberElement)[fiberKey as `__reactFiber$${string}`] ?? null;
     }

     // Fallback: Try DevTools hook if available
     const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
     if (hook?.renderers) {
       for (const renderer of hook.renderers.values()) {
         const fiber = renderer.findFiberByHostInstance?.(element);
         if (fiber) return fiber;
       }
     }

     return null;
   }
   ```

2. **Debug source extraction**:
   ```typescript
   export function extractDebugSource(fiber: ReactFiber): FiberDebugSource | null {
     // Direct source
     if (fiber._debugSource) return fiber._debugSource;

     // Traverse _debugOwner chain (max 5 levels for performance)
     let owner = fiber._debugOwner;
     let depth = 0;
     while (owner && depth < 5) {
       if (owner._debugSource) return owner._debugSource;
       owner = owner._debugOwner;
       depth++;
     }

     // React 19: Parse _debugStack string if present
     if (fiber._debugStack) {
       return parseDebugStack(fiber._debugStack);
     }

     return null;
   }
   ```

3. **Path normalization** (convert absolute to relative):
   ```typescript
   export function fiberSourceToLocation(source: FiberDebugSource): SourceLocation {
     // Vite dev paths are typically relative already
     // But handle absolute paths from different build setups
     let relativePath = source.fileName;

     // Strip common prefixes for Vite/Tauri dev
     const prefixes = ['/src/', 'src/'];
     for (const prefix of prefixes) {
       const idx = relativePath.indexOf(prefix);
       if (idx !== -1) {
         relativePath = relativePath.slice(idx + 1); // Keep "src/"
         break;
       }
     }

     return {
       relativePath,
       lineNumber: source.lineNumber,
       columnNumber: source.columnNumber,
     };
   }
   ```

**Reference repos**: click-to-component, react-dev-inspector, react-scan

## Acceptance
- [ ] `src/utils/fiberSource.ts` created with all exports
- [ ] `ReactFiber` interface defined (not imported from React)
- [ ] `getFiberFromElement` uses DOM property scan as primary lookup
- [ ] `extractDebugSource` traverses `_debugOwner` chain (max 5 levels)
- [ ] `fiberSourceToLocation` converts absolute paths to project-relative
- [ ] `isReact19OrLater` detects React version correctly
- [ ] Graceful null returns when source unavailable (no throws)
- [ ] Works in development mode (tested manually)
- [ ] TypeScript compiles without errors
## Done summary
Created fiber source extraction utility (fiberSource.ts) with ReactFiber interface, getFiberFromElement (DOM property scan primary), extractDebugSource (_debugOwner chain traversal max 5 levels), fiberSourceToLocation (path normalization), isReact19OrLater version detection, and getSourceFromElement convenience function. All functions have graceful null returns.
## Evidence
- Commits: 14605e5e2c4a9323327e7759012157d08b9055fc
- Tests: npx tsc --noEmit
- PRs: