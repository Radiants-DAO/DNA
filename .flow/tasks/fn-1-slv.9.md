# fn-1-slv.9 Migrate Card component with three-file pattern

## Description
Migrate Card component with DNA three-file pattern.

## Source
- `/Users/rivermassey/rad_os/components/ui/Card.tsx` (138 lines)

## Files to create
```
components/core/Card/
├── Card.tsx           # Card, CardHeader, CardBody, CardFooter
├── Card.schema.json
└── Card.dna.json
```

## Token refactoring
- `bg-cream` → `bg-surface-primary`
- `bg-black` → `bg-surface-secondary`
- `border-black` → `border-edge-primary`
- `shadow-card` → preserved (uses semantic edge token)

## Card.schema.json
```json
{
  "name": "Card",
  "description": "Container with header, body, and footer sections",
  "props": {
    "variant": { "type": "enum", "values": ["default", "dark", "raised"], "default": "default" }
  },
  "slots": ["children"],
  "subcomponents": ["CardHeader", "CardBody", "CardFooter"]
}
```
## Acceptance
- [ ] Card.tsx created with Card, CardHeader, CardBody, CardFooter
- [ ] All brand tokens replaced with semantic tokens
- [ ] Card.schema.json defines variants and subcomponents
- [ ] Card.dna.json maps variants to token bindings
- [ ] shadow-card retro effect preserved
- [ ] All subcomponents exported from components/core/index.ts
## Done summary
- Task completed
## Evidence
- Commits:
- Tests:
- PRs: