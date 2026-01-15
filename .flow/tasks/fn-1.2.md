# fn-1.2 POC: SWC TSX parsing for component props

## Description
Extract component props + file:line location for the Component ID feature.

### Component ID Feature Context
RadFlow's Component ID mode lets users click a component and copy its location to clipboard for LLM context. The LLM then knows exactly where to edit.

### Required Output
- Props interface (names, types, defaults)
- File path + line number for Component ID
- Default export detection

### Test Files
- `/Users/rivermassey/Desktop/dev/radflow/packages/theme-rad-os/components/core/Button.tsx`
- `/Users/rivermassey/Desktop/dev/radflow/packages/theme-rad-os/components/core/Card.tsx`

### Example Input (Button.tsx)
```typescript
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}
export default function Button({ variant = 'primary' }: ButtonProps) {...}
```

### Example Output
```
{
  "name": "Button",
  "file": "components/core/Button.tsx",
  "line": 45,
  "props": [
    {"name": "variant", "type": "ButtonVariant", "default": "primary"},
    {"name": "size", "type": "ButtonSize", "default": "md"}
  ],
  "defaultExport": true
}
```

The file:line output enables copy-paste to LLM: "Edit Button at components/core/Button.tsx:45"
## Acceptance

- [ ] Create Rust POC project at `research/pocs/swc-poc/`
- [ ] Parse Button.tsx successfully
- [ ] Extract union type definitions (ButtonVariant, ButtonSize)
- [ ] Extract interface props with types
- [ ] Identify default values from destructuring
- [ ] Detect default export
- [ ] Handle React.ReactNode and other React types

## Done summary
- Built SWC POC that parses TSX files and extracts component props, types, and line numbers
- Successfully parses union types (ButtonVariant, ButtonSize), interface props, default values from destructuring
- All 4 unit tests pass; Card.tsx parsed with full props extraction
- Validates SWC for Component ID feature (file:line for LLM context)
- Known limitation: Complex polymorphic types need additional type resolution for production
## Evidence
- Commits: 98f24b6846c35161dcebd0089768680de8408154
- Tests: cargo test
- PRs: