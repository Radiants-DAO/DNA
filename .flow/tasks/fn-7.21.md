# fn-7.21 Undo/Redo Stack - Local session history

## Description
Implement an undo/redo system for style changes made during a RadFlow session. Changes are tracked in-memory and can be undone/redone via keyboard shortcuts or UI buttons.

**Scope:**
- Only tracks style injection changes (via fn-7.20 Direct-Edit Mode)
- Session-based: History cleared when closing RadFlow
- Does NOT track file saves (those go through git)

**Architecture:**
```typescript
interface StyleChange {
  id: string;
  timestamp: number;
  elementSelector: string;
  property: string;
  oldValue: string | null;
  newValue: string;
}

interface UndoStack {
  past: StyleChange[];
  future: StyleChange[];  // For redo
  maxHistory: number;     // Default: 100
}
```

**Operations:**
- `pushChange(change)`: Add new change, clear future stack
- `undo()`: Pop from past, push to future, apply oldValue
- `redo()`: Pop from future, push to past, apply newValue
- `clear()`: Reset both stacks

**UI:**
```
┌─────────────────────────────────────┐
│ [◀ Undo] [Redo ▶]  "12 changes"     │
└─────────────────────────────────────┘
```

**Keyboard Shortcuts:**
- Cmd/Ctrl+Z: Undo
- Cmd/Ctrl+Shift+Z: Redo

## Acceptance
- [ ] StyleChange interface with element, property, old/new values
- [ ] UndoStack with past/future arrays
- [ ] Cmd/Ctrl+Z triggers undo
- [ ] Cmd/Ctrl+Shift+Z triggers redo
- [ ] Undo applies oldValue to element
- [ ] Redo applies newValue to element
- [ ] New changes clear the redo (future) stack
- [ ] UI shows undo/redo buttons in top bar or status area
- [ ] UI shows change count indicator
- [ ] History limited to 100 changes (configurable)
- [ ] History cleared on session end (not persisted)

## Files
- `src/stores/slices/undoSlice.ts` (Zustand slice)
- `src/hooks/useUndoRedo.ts` (hook for keyboard shortcuts)
- Integration with fn-7.20 Direct-Edit Mode

## Done summary
Implemented - merged from fn-7 branch
## Evidence
- Commits:
- Tests:
- PRs: