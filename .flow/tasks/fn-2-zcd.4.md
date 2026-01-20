# fn-2-zcd.4 Update app tsconfig.json paths

## Description
Update app tsconfig.json for monorepo path resolution.

## Changes to packages/radiants/apps/rad_os/tsconfig.json

Update paths:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@dna/radiants": ["../../"],
      "@dna/radiants/*": ["../../*"]
    }
  }
}
```

This allows:
- `@/components/*` → app-local components
- `@dna/radiants` → theme package root
- `@dna/radiants/components/core` → theme components
## Acceptance
- [ ] tsconfig.json has @/* path pointing to app root
- [ ] tsconfig.json has @dna/radiants path pointing to theme
- [ ] TypeScript resolves theme imports correctly
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
