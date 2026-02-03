# fn-2-gnc.1 Port StyleValue Type System from Webstudio

## Description
Port Webstudio's Zod-validated StyleValue discriminated union to RadFlow TypeScript.

## Context
Webstudio's `css-engine/src/schema.ts` defines comprehensive CSS value types:
- UnitValue (px, em, %, etc.)
- KeywordValue (auto, inherit, etc.)
- ColorValue (14 color spaces)
- LayersValue (gradients, shadows)
- FunctionValue (calc, var)
- VarValue (CSS variable references with fallbacks)

RadFlow currently uses simple `HashMap<String, String>` which cannot represent complex values.

## Critical: Type System Bridge Decision

**Problem**: Rust backend returns `HashMap<String, String>` but TypeScript needs `StyleValue` discriminated union.

**Chosen Approach**: **Option B - TypeScript Parser** (simpler, faster to implement)
- Keep strings in Rust IPC (no Rust type changes needed)
- Add TypeScript parser `src/utils/parseStyleValue.ts` that converts CSS strings → `StyleValue`
- Less type-safe at IPC boundary but faster to implement

**Alternative (if perf issues)**: Option A - Rust StyleValue types
- Define Rust enums matching TypeScript discriminated union
- More work but fully type-safe end-to-end

## Implementation

1. Create `/src/types/styleValue.ts` with discriminated union:
```typescript
export type StyleValue = 
  | UnitValue 
  | KeywordValue 
  | ColorValue 
  | VarValue 
  | FunctionValue 
  | LayersValue 
  | TupleValue;
```

2. Port from Webstudio (AGPL-3.0 - attribute):
   - `/webstudio-main/packages/css-engine/src/schema.ts:L1-260`
   - Use Zod or manual type guards

3. Create TypeScript CSS string parser:
   - `/src/utils/parseStyleValue.ts`
   - Converts raw CSS strings from Rust → StyleValue types
   - Handles all value types: units, colors, var(), calc(), etc.

4. Create value-to-CSS converter:
   - `/src/utils/styleValueToCss.ts`
   - Reference: `/webstudio-main/packages/css-engine/src/core/to-value.ts`

## Key Files
- **Create**: `src/types/styleValue.ts`
- **Create**: `src/types/index.ts` (re-export)
- **Create**: `src/utils/parseStyleValue.ts` (CSS string → StyleValue)
- **Create**: `src/utils/styleValueToCss.ts` (StyleValue → CSS string)
## Context
Webstudio's `css-engine/src/schema.ts` defines comprehensive CSS value types:
- UnitValue (px, em, %, etc.)
- KeywordValue (auto, inherit, etc.)
- ColorValue (14 color spaces)
- LayersValue (gradients, shadows)
- FunctionValue (calc, var)
- VarValue (CSS variable references with fallbacks)

RadFlow currently uses simple `HashMap<String, String>` which cannot represent complex values.

## Implementation

1. Create `/src/types/styleValue.ts` with discriminated union:
```typescript
export type StyleValue = 
  | UnitValue 
  | KeywordValue 
  | ColorValue 
  | VarValue 
  | FunctionValue 
  | LayersValue 
  | TupleValue;
```

2. Port from Webstudio (AGPL-3.0 - attribute):
   - `/webstudio-main/packages/css-engine/src/schema.ts:L1-260`
   - Use Zod or manual type guards

3. Create value-to-CSS converter:
   - `/src/utils/styleValueToCss.ts`
   - Reference: `/webstudio-main/packages/css-engine/src/core/to-value.ts`

4. Add CSS-to-StyleValue parser (uses lightningcss from Rust):
   - Enhance `/src-tauri/src/commands/css.rs` to return typed values

## Key Files
- **Create**: `src/types/styleValue.ts`
- **Create**: `src/types/index.ts` (re-export)
- **Create**: `src/utils/styleValueToCss.ts`
- **Modify**: `src-tauri/src/types/mod.rs` (add Rust equivalents for IPC)
## Acceptance
- [ ] StyleValue discriminated union covers: unit, keyword, color, var, function, layers, tuple
- [ ] Each value type has TypeScript type guard (`isUnitValue()`, etc.)
- [ ] `parseStyleValue(cssString)` converts any CSS value string to StyleValue
- [ ] `styleValueToCss(value)` converts any StyleValue to valid CSS string
- [ ] Round-trip tests pass: parse → serialize → parse yields equivalent value
- [ ] Unit tests cover all value types with edge cases
- [ ] Zod schemas validate at runtime (or manual validators if not using Zod)
- [ ] AGPL attribution comment in derived files
## Done summary
Ported Webstudio's StyleValue type system to RadFlow TypeScript with discriminated union types, Zod schemas for runtime validation, parseStyleValue() for CSS string parsing, styleValueToCss() for serialization, and 79 comprehensive unit tests. All 14 color spaces supported including oklch and oklab.
## Evidence
- Commits: 3071b9831589ef2f925a881e839037effb551c40
- Tests: pnpm test:run, pnpm typecheck
- PRs: