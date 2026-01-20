# fn-2-zcd.1 Configure pnpm workspace + turbo.json

## Description
Configure pnpm workspace to include nested apps and add turborepo for build orchestration.

## Changes

### pnpm-workspace.yaml
Update to include nested apps pattern:
```yaml
packages:
  - "packages/*"
  - "packages/*/apps/*"
```

### turbo.json (new file at repo root)
```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    }
  }
}
```

### package.json (repo root - create if needed)
```json
{
  "name": "dna",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```

## Source files
- `pnpm-workspace.yaml` (modify)
- `turbo.json` (create)
- `package.json` (create at root)
## Acceptance
- [ ] pnpm-workspace.yaml includes `packages/*/apps/*` pattern
- [ ] turbo.json exists at repo root
- [ ] turbo.json has build, dev, lint tasks
- [ ] Root package.json has turbo scripts
- [ ] `pnpm install` succeeds
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
