# fn-2-gnc.3 Implement Token Resolution Chain

## Description
Implement token resolution that handles `var()` reference chains with proper circular reference detection.

## Context
CSS custom properties can reference each other:
```css
:root {
  --color-brand: #3b82f6;
  --color-primary: var(--color-brand);
  --color-surface: var(--color-primary);
}
```

RadFlow's `tokensSlice` stores raw values but doesn't resolve chains. For preview, we need the actual computed value.

## Implementation

1. Enhance `/src/stores/slices/tokensSlice.ts`:
   - Add `resolvedTokens` state (cached resolved values)
   - Add `resolveToken(name: string): StyleValue` action
   - Use visited set for circular reference detection (NOT max depth alone)

2. Create `/src/utils/tokenResolver.ts` with proper cycle detection:
```typescript
export function resolveTokenChain(
  tokenName: string,
  tokens: Map<string, StyleValue>,
  visited: Set<string> = new Set()
): StyleValue | null {
  // Detect cycles IMMEDIATELY, not after N iterations
  if (visited.has(tokenName)) {
    console.warn(`Circular token reference detected: ${[...visited, tokenName].join(' → ')}`);
    return null;
  }
  
  visited.add(tokenName);
  const value = tokens.get(tokenName);
  
  if (!value) return null;
  if (value.type !== 'var') return value;
  
  // Resolve var reference
  const resolved = resolveTokenChain(value.name, tokens, visited);
  
  // Try fallback if resolution failed
  if (!resolved && value.fallback) {
    return value.fallback;
  }
  
  return resolved;
}
```

3. Handle VarValue with fallbacks:
```typescript
type VarValue = {
  type: 'var';
  name: string;
  fallback?: StyleValue;  // Used if name unresolved
};
```

4. Integrate with style injection:
   - Resolved values used for preview rendering
   - Original `var()` preserved in clipboard output

## Key Files
- **Modify**: `src/stores/slices/tokensSlice.ts`
- **Create**: `src/utils/tokenResolver.ts`
- **Create**: `src/utils/__tests__/tokenResolver.test.ts`
- **Modify**: `src/hooks/useStyleInjection.ts` (use resolved values)
## Context
CSS custom properties can reference each other:
```css
:root {
  --color-brand: #3b82f6;
  --color-primary: var(--color-brand);
  --color-surface: var(--color-primary);
}
```

RadFlow's `tokensSlice` stores raw values but doesn't resolve chains. For preview, we need the actual computed value.

## Implementation

1. Enhance `/src/stores/slices/tokensSlice.ts`:
   - Add `resolvedTokens` state (cached resolved values)
   - Add `resolveToken(name: string): StyleValue` action
   - Handle circular reference detection (max depth)

2. Create `/src/utils/tokenResolver.ts`:
```typescript
export function resolveTokenChain(
  tokenName: string,
  tokens: Map<string, StyleValue>,
  maxDepth: number = 10
): StyleValue | null {
  // Follow var() references until concrete value
  // Return null if circular or unresolved
}
```

3. Handle VarValue with fallbacks:
```typescript
type VarValue = {
  type: 'var';
  name: string;
  fallback?: StyleValue;  // Used if name unresolved
};
```

4. Integrate with style injection:
   - Resolved values used for preview rendering
   - Original `var()` preserved in clipboard output

## Key Files
- **Modify**: `src/stores/slices/tokensSlice.ts`
- **Create**: `src/utils/tokenResolver.ts`
- **Modify**: `src/hooks/useStyleInjection.ts` (use resolved values)
## Acceptance
- [ ] `resolveToken('--color-surface')` returns final ColorValue, not VarValue
- [ ] Handles 3+ level chains: `var(--a)` → `var(--b)` → `#fff`
- [ ] Circular references detected IMMEDIATELY via visited set (not max depth)
- [ ] Circular reference returns null with descriptive console warning showing the cycle path
- [ ] Fallbacks work: `var(--missing, red)` returns red KeywordValue
- [ ] Clipboard output preserves original `var()` syntax
- [ ] Resolution cache invalidates when tokens change
- [ ] Unit tests cover: direct value, 3-level chain, circular A→B→A, circular A→B→C→A, missing with fallback
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
