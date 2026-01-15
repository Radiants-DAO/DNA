# fn-1.8 Update feature specs per conflict resolutions

## Description

Update all feature specs in `/docs/features/` to align with resolved conflicts from `docs/spec-conflicts.md`.

### Specs to Update

| Spec | Changes Needed |
|------|----------------|
| `01-variables-editor.md` | Remove accent-* tokens, update edge token names |
| `03-component-browser.md` | Change manifest.json → radflow.config.json, update paths |
| `04-theme-system.md` | Move CSS to theme/ subfolder, update config filename |
| `05-assets-manager.md` | Update structure to show new organization |
| `10-tauri-architecture.md` | Update file path references |

### Resolutions to Apply

From `docs/spec-conflicts.md`:
- CSS location: `theme/` subfolder
- Config filename: `radflow.config.json`
- Accent tokens: Merged with state tokens
- Component organization: By type

## Acceptance

- [ ] Update 01-variables-editor.md
- [ ] Update 03-component-browser.md
- [ ] Update 04-theme-system.md
- [ ] Update 05-assets-manager.md
- [ ] Update 10-tauri-architecture.md
- [ ] Search all specs for remaining inconsistencies
- [ ] Update theme-spec.md if needed based on research findings

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
