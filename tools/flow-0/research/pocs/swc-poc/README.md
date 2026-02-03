# SWC TSX Parsing POC

Proof of concept for extracting React component props using SWC's TypeScript/TSX parser.

## Purpose

Validates that SWC can parse TSX files and extract component metadata for RadFlow's Component ID feature, which lets users click a component and copy its location (file:line) to clipboard for LLM context.

## Features Demonstrated

- ✅ Parse TSX files successfully
- ✅ Extract union type definitions (`type ButtonVariant = 'primary' | 'secondary'`)
- ✅ Extract interface props with types
- ✅ Identify default values from destructuring patterns
- ✅ Detect default exports
- ✅ Track line numbers for Component ID

## Usage

```bash
cargo run -- <tsx-file>
```

Example:
```bash
cargo run -- /path/to/Button.tsx
```

## Output Format

```json
{
  "name": "Card",
  "file": "components/core/Card.tsx",
  "line": 51,
  "props": [
    {"name": "variant", "type": "CardVariant", "default": "default"},
    {"name": "children", "type": "React.ReactNode"}
  ],
  "defaultExport": true,
  "unionTypes": [
    {"name": "CardVariant", "values": ["default", "dark", "raised"], "line": 8}
  ]
}
```

## Tests

```bash
cargo test
```

## Known Limitations

1. **Polymorphic types**: Complex intersection types like `PolymorphicButtonProps<C> = BaseButtonProps & {...}` require additional type resolution logic. The POC extracts the type name but doesn't resolve through type aliases.

2. **JSDoc comments**: Comment extraction requires additional parsing setup. Currently returns `null` for doc fields.

3. **Generics in props**: Generic type parameters in prop types are preserved as-is (e.g., `ElementType`).

## Dependencies

- `swc_common` v18 - Source map and error handling
- `swc_ecma_parser` v32 - TSX parser
- `swc_ecma_ast` v19 - AST types
- `serde` + `serde_json` - JSON serialization

## Verdict

**PASS** - SWC successfully parses TSX and extracts the component metadata needed for RadFlow's Component ID feature. Production implementation would need:
- Type resolution for complex types
- Comment extraction for prop documentation
- Caching for performance with large codebases
