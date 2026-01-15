# fn-1.7 Validate spec vs reality, document gaps

## Description

Compare our theme spec against the real theme-rad-os implementation and document all gaps, mismatches, and migration requirements.

### Comparison Points

| Spec Says | Reality Check |
|-----------|---------------|
| CSS in `theme/` subfolder | Currently at package root |
| `radflow.config.json` required | No config file exists |
| Components by type | Currently in `core/` flat |
| `surface-*`, `content-*`, `edge-*` only | Has legacy tokens too |
| `modes.css` for color modes | Has `dark.css` |

### Files to Analyze
- `docs/theme-spec.md` (our spec)
- `docs/spec-conflicts.md` (known conflicts)
- `/Users/rivermassey/Desktop/dev/radflow/packages/theme-rad-os/` (reality)

### Output
Update `docs/spec-conflicts.md` with:
- Complete gap analysis
- Migration steps for each gap
- Priority ordering
- Breaking vs non-breaking changes

## Acceptance

- [ ] Audit all CSS file locations
- [ ] Audit component organization
- [ ] Audit token naming (legacy vs new)
- [ ] Audit typography implementation
- [ ] Audit color mode implementation
- [ ] Document complete migration checklist
- [ ] Prioritize migration steps
- [ ] Identify breaking changes

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
