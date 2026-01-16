# fn-9.7 Accumulator Store

## Description
Create the Zustand store for tracking accumulated edits.

**Interface:**
```typescript
interface AccumulatedEdit {
  id: string;
  type: 'token' | 'typography' | 'component' | 'style';
  target: { file: string; selector?: string; domPath?: string; };
  change: { property: string; oldValue: string; newValue: string; };
  context: { component?: string; element?: string; };
  annotation?: string;
  timestamp: number;
}
```

**Features:**
- Track edits by type (token, typography, component, style)
- Smart auto-grouping (by file when logical)
- Ephemeral (clears on app restart, no localStorage)
- Actions: addEdit, removeEdit, clearAll, getByType, getByFile
## Acceptance
- [ ] `useEditAccumulator` store created in `src/stores/`
- [ ] AccumulatedEdit interface matches spec
- [ ] addEdit action works
- [ ] removeEdit action works
- [ ] clearAll action works
- [ ] getByType selector works
- [ ] getByFile selector works
- [ ] State clears on app restart (no persistence)
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
