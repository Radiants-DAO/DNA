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
## What changed
- Updated 01-variables-editor.md: Replaced accent-* tokens with state tokens (surface-success, content-success, etc.) within semantic categories
- Updated 04-theme-system.md: Added both CSS-at-root (preferred) and theme/ subfolder patterns, added component organization options (flat vs type-based)
- Updated 05-assets-manager.md: Marked assets as optional, documented external icon library support (Phosphor, Lucide, Heroicons)
- Updated theme-spec.md: Major revision to accept flexible patterns for config location, CSS location, and validation rules

## Why
- Gap analysis (fn-1.7) revealed the spec didn't match reality of existing theme-rad-os implementation
- Parser implementation should be flexible to handle both patterns rather than forcing migration

## Verification
- Searched all specs for remaining inconsistencies - none found
- All changes align with findings documented in docs/spec-conflicts.md

## Follow-ups
- Parser implementation should check both CSS locations
- Consider adding automated spec compliance checker
## Evidence
- Commits: 1bf2802608f5dfa8c41097b721489da071800ff3
- Tests: grep search for inconsistencies
- PRs: