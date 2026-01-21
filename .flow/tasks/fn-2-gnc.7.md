# fn-2-gnc.7 Add AGPL Attribution and Documentation

## Description
Add proper AGPL-3.0 attribution and document Webstudio-derived code.

## Context
Webstudio is AGPL-3.0 licensed. When forking code, we must:
1. Maintain the same license for derived works
2. Provide clear attribution
3. Document what was derived

## AGPL-3.0 Network Copyleft Note
AGPL has network copyleft requirements:
- **Network copyleft**: AGPL requires source disclosure for network-accessible software
- **Desktop app exemption**: For desktop-only use (Tauri), standard AGPL distribution requirements apply
- **Future consideration**: If RadFlow ever runs as a web service, the entire source must be made available to users

## Implementation

1. Create `/ATTRIBUTION.md`:
   - List all Webstudio-derived code
   - Link to original files
   - Note modifications made

2. Add header comments to derived files:
```typescript
/**
 * Derived from Webstudio (https://github.com/webstudio-is/webstudio)
 * Original: packages/css-engine/src/schema.ts
 * License: AGPL-3.0-or-later
 * Modifications: Adapted for RadFlow's clipboard workflow
 */
```

3. Update `/LICENSE`:
   - Ensure AGPL-3.0 is primary license
   - Note dual-licensing if applicable

4. Create `/docs/webstudio-adoption.md`:
   - Document architectural decisions
   - List what was adopted vs adapted
   - Explain DNA integration rationale

5. Update README:
   - Add Webstudio acknowledgment
   - Add "Source available under AGPL-3.0" notice
   - Link to ATTRIBUTION.md

## AGPL Compliance Checklist
- [ ] ATTRIBUTION.md lists all Webstudio-derived files
- [ ] LICENSE file is AGPL-3.0 (or dual-licensed with clear boundaries)
- [ ] README includes "Source available under AGPL-3.0" notice
- [ ] Each derived file has license header comment
- [ ] If RadFlow ever has a web service component, source disclosure mechanism exists
- [ ] Legal review completed (if commercial use planned)

## Key Files
- **Create**: `ATTRIBUTION.md`
- **Create**: `docs/webstudio-adoption.md`
- **Modify**: `LICENSE` (if needed)
- **Modify**: `README.md`
- **Modify**: All derived `.ts` files (add header comments)
## Context
Webstudio is AGPL-3.0 licensed. When forking code, we must:
1. Maintain the same license for derived works
2. Provide clear attribution
3. Document what was derived

## Implementation

1. Create `/ATTRIBUTION.md`:
   - List all Webstudio-derived code
   - Link to original files
   - Note modifications made

2. Add header comments to derived files:
```typescript
/**
 * Derived from Webstudio (https://github.com/webstudio-is/webstudio)
 * Original: packages/css-engine/src/schema.ts
 * License: AGPL-3.0-or-later
 * Modifications: Adapted for RadFlow's clipboard workflow
 */
```

3. Update `/LICENSE`:
   - Ensure AGPL-3.0 is primary license
   - Note dual-licensing if applicable

4. Create `/docs/webstudio-adoption.md`:
   - Document architectural decisions
   - List what was adopted vs adapted
   - Explain DNA integration rationale

5. Update README:
   - Add Webstudio acknowledgment
   - Link to ATTRIBUTION.md

## Key Files
- **Create**: `ATTRIBUTION.md`
- **Create**: `docs/webstudio-adoption.md`
- **Modify**: `LICENSE` (if needed)
- **Modify**: `README.md`
- **Modify**: All derived `.ts` files (add header comments)
## Acceptance
- [ ] ATTRIBUTION.md lists all Webstudio-derived files with original paths
- [ ] Each derived file has license header comment (AGPL-3.0-or-later)
- [ ] LICENSE file includes AGPL-3.0 full text
- [ ] README acknowledges Webstudio with link to their repo
- [ ] README includes "Source available under AGPL-3.0" notice
- [ ] docs/webstudio-adoption.md explains architectural decisions
- [ ] No Webstudio code exists without attribution
- [ ] Network copyleft implications documented for future web service scenarios
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
