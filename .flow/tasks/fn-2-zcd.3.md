# fn-2-zcd.3 Update app package.json with theme dependency

## Description
Update app package.json to add @dna/radiants as a workspace dependency.

## Changes to packages/radiants/apps/rad_os/package.json

Add dependency:
```json
"dependencies": {
  "@dna/radiants": "workspace:*",
  ...existing deps
}
```

Update name to scoped package:
```json
"name": "@dna/rad-os"
```

Keep existing scripts and dependencies (next, react, react-dom, zustand, react-draggable, etc.)
## Acceptance
- [ ] package.json has @dna/radiants dependency with workspace: protocol
- [ ] package name is @dna/rad-os
- [ ] Existing dependencies preserved
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
