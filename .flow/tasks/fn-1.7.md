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
- Complete gap analysis between theme-spec.md and theme-rad-os implementation
- Audited 8 comparison areas: CSS locations, components, tokens, typography, color modes, config, assets, exports
- Found theme-rad-os already aligned on token naming (surface-*, content-*, edge-*)
- Documented all structural differences with recommendations

Key finding: Reality exceeds spec in token coverage. Recommend updating specs to match reality (flexible vs strict validation).

Verification: Manual review of all theme-rad-os CSS files, components, and package.json
## Evidence
- Commits: 9657b889238d51e027dd1d4c408ad7d947cb0876
- Tests: manual-audit
- PRs: