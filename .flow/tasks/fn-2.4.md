# fn-2.4 Zustand store setup with Tauri IPC

## Description

Set up Zustand store with slice composition pattern and Tauri IPC integration.

## Technical Details

1. **Store structure** (port from current RadFlow)
   ```typescript
   // src/store/index.ts
   import { create } from 'zustand'
   import { persist, devtools } from 'zustand/middleware'
   
   interface AppState {
     // From slices
     ...componentIdSlice,
     ...textEditSlice,
     ...panelsSlice,
     ...projectSlice,
   }
   ```

2. **Slices to create**
   - `projectSlice` - current project path, recent projects
   - `componentIdSlice` - selected components, mode active
   - `textEditSlice` - text changes, clipboard accumulation
   - `panelsSlice` - active panel, panel state
   - `tokensSlice` - loaded design tokens
   - `uiSlice` - preview mode, sidebar width

3. **Tauri IPC integration**
   - Create hooks that wrap Tauri commands
   - `useComponents()` - fetches via `invoke('scan_components')`
   - `useTokens()` - fetches via `invoke('parse_tokens')`
   - Handle loading/error states

4. **Persistence**
   - Use `persist` middleware
   - Partialize to only persist UI state, not fetched data
   - Store in localStorage (or Tauri store plugin)

## References

- Current RadFlow store: see exploration report for patterns
- Zustand persist: https://zustand.docs.pmnd.rs/middlewares/persist
## Acceptance
- [ ] Zustand store with slice composition working
- [ ] Persist middleware saves UI state across restarts
- [ ] Hooks for Tauri IPC with loading/error states
- [ ] TypeScript types for all state slices
- [ ] DevTools middleware enabled in development
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
