# fn-1-cs3.4 Refactor useStaking to remove mock state

## Description
Refactor `hooks/useStaking.ts` to remove all devtools dependencies.

## Current imports to remove (lines 4-5)
```typescript
import { useMockState } from '@/devtools/hooks/useMockState';
import { useDevToolsStore } from '@/devtools/store';
```

## Code sections to modify

1. **Line 37**: Remove `const walletState = useMockState<WalletState>('wallet');`
2. **Lines 38-43**: Remove `useDevToolsStore` destructuring and mock state logic
3. **Lines 100-104**: Remove `updateMockStateValue` calls in connect logic
4. **Lines 119-149**: Remove or simplify the "no real wallet, use simulation" path
5. **Lines 159-161**: Remove `updateMockStateValue` in disconnect
6. **Lines 328-332**: Remove `simulate.setBalance` that uses mock state

## Replacement strategy
Return a disconnected wallet state:
```typescript
const walletState: WalletState = {
  isConnected: false,
  address: null,
  balance: '0',
};
```

The connect/disconnect functions should be no-ops or require real wallet adapter integration later.

## Preserve
- The hook signature and return type
- Real wallet adapter path if one exists
- Position and transaction state handling (not dependent on devtools)
## Acceptance
- [ ] No imports from `@/devtools` in useStaking.ts
- [ ] Hook compiles without TypeScript errors
- [ ] Hook returns valid (disconnected) wallet state
- [ ] No runtime errors when StakingForm mounts
## Done summary
Refactored useStaking hook to remove all devtools dependencies by replacing mock state with local React useState, simplifying connect/disconnect/stake functions to work with real wallet adapter callbacks or show warning toasts.
## Evidence
- Commits: fddb9fee35a2a0b03229d63d65d85c01639ef8a1
- Tests: npm run build
- PRs: