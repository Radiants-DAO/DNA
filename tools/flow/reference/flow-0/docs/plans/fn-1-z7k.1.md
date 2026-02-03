# fn-1-z7k.1 Add dogfoodMode state to UiSlice

## Description
Add `dogfoodMode` boolean state and `setDogfoodMode` action to UiSlice, following the existing `devMode` pattern. Also add to persistence config.

**Files to modify**:
- `src/stores/types.ts:193-206` - Add `dogfoodMode: boolean` and `setDogfoodMode: (enabled: boolean) => void` to `UiSlice` interface
- `src/stores/slices/uiSlice.ts` - Add state (default `false`) and action implementation
- `src/stores/appStore.ts:57-71` - Add `dogfoodMode: state.dogfoodMode` to `partialize` function

**Pattern reference** (uiSlice.ts:16,98):
```typescript
devMode: false,
// ...
setDevMode: (enabled) => set({ devMode: enabled }),
```

**Persistence** (appStore.ts:57-71):
```typescript
partialize: (state) => ({
  // ... existing fields
  dogfoodMode: state.dogfoodMode, // ADD THIS
}),
```

**Behavior**:
- Default: `false` (dogfood mode off)
- Persists across sessions via zustand persist `partialize`
- When toggled, no side effects needed (CommentMode reads state directly)

## Acceptance
- [ ] `dogfoodMode: boolean` added to `UiSlice` interface in types.ts
- [ ] `setDogfoodMode: (enabled: boolean) => void` added to interface
- [ ] State initialized to `false` in uiSlice.ts
- [ ] Action implementation follows `setDevMode` pattern
- [ ] `dogfoodMode` added to `partialize` in appStore.ts
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
## Done summary
Added dogfoodMode boolean state and setDogfoodMode action to UiSlice following the existing devMode pattern, with persistence via partialize in appStore.ts.
## Evidence
- Commits: 0cc4d0cc454924044757956a6e73dbae0c98a6ac
- Tests: npx tsc --noEmit
- PRs: