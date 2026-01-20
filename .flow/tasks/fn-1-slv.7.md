# fn-1-slv.7 Migrate Button component with three-file pattern

## Description
Migrate Button component with DNA three-file pattern.

## Source
- `/Users/rivermassey/rad_os/components/ui/Button.tsx` (266 lines)

## Files to create
```
components/core/Button/
├── Button.tsx           # Implementation (refactor tokens)
├── Button.schema.json   # NEW: AI interface
└── Button.dna.json      # NEW: Token bindings
```

## Token refactoring in Button.tsx
- `bg-sun-yellow` → `bg-action-primary`
- `bg-black` → `bg-surface-secondary`
- `text-black` → `text-content-primary`
- `text-cream` → `text-content-inverted`
- `border-black` → `border-edge-primary`
- `ring-sun-yellow` → `ring-edge-focus`

## Button.schema.json structure
```json
{
  "name": "Button",
  "description": "Primary action trigger with retro lift effect",
  "props": {
    "variant": { "type": "enum", "values": ["primary", "secondary", "outline", "ghost"], "default": "primary" },
    "size": { "type": "enum", "values": ["sm", "md", "lg"], "default": "md" },
    "disabled": { "type": "boolean", "default": false }
  },
  "slots": ["icon", "children"]
}
```

## Button.dna.json maps variants to tokens
## Acceptance
- [ ] Button.tsx created at `components/core/Button/Button.tsx`
- [ ] All brand token references replaced with semantic tokens
- [ ] Button.schema.json defines props, slots, examples
- [ ] Button.dna.json maps variants to token bindings
- [ ] Retro lift effect preserved (shadow-btn, translate on hover/active)
- [ ] Component exports from components/core/index.ts
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
