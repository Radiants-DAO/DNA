# fn-2-gnc.8 Create Dual-Mode Output Interface

## Description
Create an abstraction layer that supports both clipboard output AND direct file writes.

## Context
RadFlow currently uses clipboard-only output. Direct file editing is critical for future. Design the type system to support both from day one.

## Implementation

1. Create `/src/types/output.ts`:
```typescript
export interface IDesignOutput {
  // Compile changes to string format
  compile(): string;
  
  // Persist to target (clipboard or file)
  persist(target: OutputTarget): Promise<PersistResult>;
  
  // Rollback last change (for file mode)
  rollback?(): Promise<void>;
}

export type OutputTarget = "clipboard" | "file" | "both";

export type PersistResult = {
  success: boolean;
  target: OutputTarget;
  error?: string;
};
```

2. Create implementations:
   - `/src/utils/output/clipboardOutput.ts` - Current behavior
   - `/src/utils/output/fileOutput.ts` - Future direct writes (stub for now)

3. Create output mode store:
   - `/src/stores/slices/outputSlice.ts`
   - Track current mode (default → clipboard)
   - Mode tied to panel modes: Default/Focus = clipboard, Advanced = file

4. Integrate with existing edit flow:
   - `editsSlice.ts` accumulates changes
   - `IDesignOutput.compile()` formats them
   - `IDesignOutput.persist()` sends to target

## Panel Mode Mapping
| Panel Mode | Output Target | Behavior |
|------------|---------------|----------|
| Default (Figma-like) | clipboard | Copy to clipboard only |
| Focus (all props) | clipboard | Copy to clipboard only |
| Advanced | file | Direct file write + CSS editor |

## Key Files
- **Create**: `src/types/output.ts`
- **Create**: `src/utils/output/clipboardOutput.ts`
- **Create**: `src/utils/output/fileOutput.ts` (stub)
- **Create**: `src/stores/slices/outputSlice.ts`
- **Modify**: `src/stores/slices/editsSlice.ts` (use IDesignOutput)
## Acceptance
- [ ] IDesignOutput interface defined with compile(), persist(), rollback()
- [ ] ClipboardOutput implementation works (current behavior preserved)
- [ ] FileOutput stub exists (returns not-implemented for now)
- [ ] outputSlice tracks current OutputTarget
- [ ] Panel mode changes update OutputTarget
- [ ] Existing clipboard workflow still works
- [ ] Types exported and available to other modules
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
