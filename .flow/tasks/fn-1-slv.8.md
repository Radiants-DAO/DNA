# fn-1-slv.8 Migrate Input component with three-file pattern

## Description
Migrate Input component with DNA three-file pattern.

## Source
- `/Users/rivermassey/rad_os/components/ui/Input.tsx` (177 lines)

## Files to create
```
components/core/Input/
├── Input.tsx
├── Input.schema.json
└── Input.dna.json
```

## Token refactoring
- `bg-cream` → `bg-surface-primary`
- `border-black` → `border-edge-primary`
- `ring-sun-yellow` → `ring-edge-focus`
- `text-black` → `text-content-primary`

## Input.schema.json
```json
{
  "name": "Input",
  "description": "Text input field with optional icon",
  "props": {
    "size": { "type": "enum", "values": ["sm", "md", "lg"], "default": "md" },
    "error": { "type": "boolean", "default": false },
    "icon": { "type": "string", "description": "Icon name for leading icon" }
  }
}
```
## Acceptance
- [ ] Input.tsx created at `components/core/Input/Input.tsx`
- [ ] Uses forwardRef pattern (preserved from source)
- [ ] All brand tokens replaced with semantic tokens
- [ ] Input.schema.json defines props
- [ ] Input.dna.json maps sizes to token values
- [ ] Error state uses status-error token
- [ ] Exported from components/core/index.ts
## Done summary
- Task completed
## Evidence
- Commits:
- Tests:
- PRs: