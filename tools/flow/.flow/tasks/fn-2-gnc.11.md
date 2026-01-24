# fn-2-gnc.11 Implement Hybrid Component Discovery

## Description
Implement hybrid component discovery combining runtime fiber inspection with static TypeScript type information.

## Context
RadFlow has runtime fiber inspection (bridge package). Webstudio has static TypeScript parsing. Combine both for richer component metadata.

## Current State
- **Fiber bridge** (`packages/bridge/`): Runtime component instances, actual prop values
- **SWC parsing** (`src-tauri/src/commands/components.rs`): Static TypeScript analysis

## Implementation

1. **Enhance Rust component parsing** to return full PropMeta:
```rust
pub struct PropMeta {
    pub name: String,
    pub type_name: String,
    pub required: bool,
    pub default_value: Option<String>,
    pub description: Option<String>,  // from JSDoc
    pub control_type: Option<String>, // inferred: "text", "number", "boolean", "select"
}
```

2. **Create TypeScript ComponentMeta type**:
```typescript
interface ComponentMeta {
  // From static analysis (SWC)
  name: string;
  filePath: string;
  line: number;
  props: PropMeta[];
  
  // From fiber bridge (runtime)
  instances: ComponentInstance[];
  
  // From DNA .dna.json (if exists)
  tokenBindings?: Record<string, string>;
  contentModel?: ContentModel;
}
```

3. **Merge Strategy** (specific algorithm):
```typescript
// src/utils/mergeComponentMeta.ts
export function mergeComponentMeta(
  staticMeta: ComponentInfo[],
  runtimeEntries: SerializedComponentEntry[]
): ComponentMeta[] {
  // 1. Index static by file:line (unique key)
  const staticIndex = new Map<string, ComponentInfo>();
  for (const meta of staticMeta) {
    staticIndex.set(`${meta.file}:${meta.line}`, meta);
  }
  
  // 2. For each runtime entry, find matching static
  const merged: ComponentMeta[] = [];
  for (const entry of runtimeEntries) {
    if (!entry.source) continue;  // Skip node_modules
    
    const key = `${entry.source.filePath}:${entry.source.line}`;
    const static = staticIndex.get(key);
    
    if (static) {
      merged.push({
        ...static,
        instances: [entry],  // Add runtime instance
      });
      staticIndex.delete(key);  // Mark as merged
    } else {
      // Runtime-only (dynamic component?)
      merged.push({
        name: entry.name,
        filePath: entry.source.filePath,
        line: entry.source.line,
        props: [],  // No static info
        instances: [entry],
      });
    }
  }
  
  // 3. Add unrendered static components
  for (const [_, static] of staticIndex) {
    merged.push({
      ...static,
      instances: [],  // Not rendered
    });
  }
  
  return merged;
}
```

4. **Edge Cases Handled**:
   - Component name differs between static (export name) and runtime (displayName): Use file:line as primary key
   - Multiple components with same name in different files: File path disambiguates
   - Static analysis finds component but it's never rendered: Included with empty instances array

5. **Content Model validation** (from Webstudio pattern):
```typescript
interface ContentModel {
  category: "instance" | "text" | "none";
  children?: string[];      // allowed child component names
  descendants?: string[];   // allowed anywhere in subtree
}
```

6. **Control type inference**:
   - `string` → "text"
   - `number` → "number"  
   - `boolean` → "boolean"
   - `"a" | "b" | "c"` → "select" with options
   - `React.ReactNode` → "slot"

## Key Files
- **Modify**: `src-tauri/src/commands/components.rs` (enhance parsing)
- **Create**: `src/types/componentMeta.ts`
- **Modify**: `src/stores/slices/componentsSlice.ts` (merge logic)
- **Create**: `src/utils/mergeComponentMeta.ts`
- **Create**: `src/utils/__tests__/mergeComponentMeta.test.ts`
## Context
RadFlow has runtime fiber inspection (bridge package). Webstudio has static TypeScript parsing. Combine both for richer component metadata.

## Current State
- **Fiber bridge** (`packages/bridge/`): Runtime component instances, actual prop values
- **SWC parsing** (`src-tauri/src/commands/components.rs`): Static TypeScript analysis

## Implementation

1. **Enhance Rust component parsing** to return full PropMeta:
```rust
pub struct PropMeta {
    pub name: String,
    pub type_name: String,
    pub required: bool,
    pub default_value: Option<String>,
    pub description: Option<String>,  // from JSDoc
    pub control_type: Option<String>, // inferred: "text", "number", "boolean", "select"
}
```

2. **Create TypeScript ComponentMeta type**:
```typescript
interface ComponentMeta {
  // From static analysis (SWC)
  name: string;
  filePath: string;
  props: PropMeta[];
  
  // From fiber bridge (runtime)
  instances?: ComponentInstance[];
  
  // From DNA .dna.json (if exists)
  tokenBindings?: Record<string, string>;
  contentModel?: ContentModel;
}
```

3. **Merge strategy**:
   - Static analysis runs on project load (background)
   - Fiber bridge captures runtime instances
   - Merge by component name: `staticMeta + runtimeInstances`
   - DNA overrides applied last (if .dna.json exists)

4. **Content Model validation** (from Webstudio pattern):
```typescript
interface ContentModel {
  category: "instance" | "text" | "none";
  children?: string[];      // allowed child component names
  descendants?: string[];   // allowed anywhere in subtree
}
```

5. **Control type inference**:
   - `string` → "text"
   - `number` → "number"  
   - `boolean` → "boolean"
   - `"a" | "b" | "c"` → "select" with options
   - `React.ReactNode` → "slot"

## Key Files
- **Modify**: `src-tauri/src/commands/components.rs` (enhance parsing)
- **Create**: `src/types/componentMeta.ts`
- **Modify**: `src/stores/slices/componentsSlice.ts` (merge logic)
- **Create**: `src/utils/mergeComponentMeta.ts`
## Acceptance
- [ ] Rust parsing extracts full PropMeta (name, type, required, default, description)
- [ ] Control type inferred from TypeScript type
- [ ] Union types detected and converted to select options
- [ ] ComponentMeta TypeScript type defined with all required fields
- [ ] Merge function uses file:line as primary key (not component name)
- [ ] Merge handles: matching static+runtime, runtime-only, static-only
- [ ] Merge function has unit tests covering all edge cases
- [ ] DNA .dna.json overrides applied when present
- [ ] ContentModel type defined for nesting validation
- [ ] Components slice stores merged ComponentMeta
- [ ] Props playground can use PropMeta for controls
## Done summary
Implemented hybrid component discovery combining static TypeScript analysis with runtime fiber inspection. Enhanced Rust PropInfo with required, controlType, and options fields. Created mergeComponentMeta utility using file:line as primary key to match static and runtime data. Added 30 unit tests covering merge, runtime-only, static-only, and statistics. Integrated merge function into componentsSlice with radflowId lookup support.

## Evidence
- Commits: 5dfdf04, 77d8d09
- Tests: pnpm test (193 passing), cargo test components (3 passing)
- PRs: N/A
