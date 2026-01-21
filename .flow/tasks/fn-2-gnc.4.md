# fn-2-gnc.4 Create Hybrid Component Meta System

## Description
Create hybrid component meta system combining DNA schemas with auto-generation.

## Context
**DNA's approach** (keep):
- `.schema.json` - Prop types for AI parsing
- `.dna.json` - Token bindings, style presets

**Webstudio's approach** (adopt):
- `WsComponentMeta` - Auto-generated from TypeScript
- Builder hooks - `onNavigatorSelect`, `onNavigatorUnselect`
- Content model - What children are allowed

## Implementation

1. Create `/src/types/componentMeta.ts`:
```typescript
export type ComponentMeta = {
  // Auto-generated from TypeScript
  name: string;
  props: PropMeta[];
  
  // From DNA .schema.json
  aiInterface?: AIInterface;
  slots?: SlotDefinition[];
  
  // From DNA .dna.json  
  tokenBindings?: Record<string, string>;
  presetStyles?: StyleValue[];
  
  // From Webstudio pattern
  contentModel?: ContentModel;
  builderHooks?: BuilderHooks;
};
```

2. Create meta generator (`/src/utils/generateComponentMeta.ts`):
   - Parse TypeScript props with ts-morph or swc
   - Merge with `.dna.json` overrides if present
   - Output combined `ComponentMeta`

3. Enhance component discovery:
   - Modify `/src-tauri/src/commands/components.rs`
   - Return `ComponentMeta` instead of basic `ComponentInfo`

4. Add content model validation:
   - Which components can be children of which
   - Reference: `/webstudio-main/packages/sdk/src/schema/component-meta.ts`

## Key Files
- **Create**: `src/types/componentMeta.ts`
- **Create**: `src/utils/generateComponentMeta.ts`
- **Modify**: `src-tauri/src/commands/components.rs`
- **Modify**: `src/stores/slices/componentsSlice.ts`
## Acceptance
- [ ] ComponentMeta type includes props, slots, tokenBindings, contentModel
- [ ] Auto-generation extracts props from TypeScript component files
- [ ] `.dna.json` overrides merge correctly (don't replace, merge)
- [ ] Content model validates parent-child relationships
- [ ] Bridge inspection returns ComponentMeta (not just ComponentInfo)
- [ ] Missing `.dna.json` uses sensible defaults (not errors)
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
