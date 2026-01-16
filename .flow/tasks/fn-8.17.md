# fn-8.17 Create Follow-up Epic Specs

## Description
Create comprehensive epic specifications for the 6 follow-up epics identified in the prioritized fix list (fn-8.16). Each epic spec should include scope, tasks with estimates, dependencies, acceptance criteria, and quick commands.

## Acceptance
- [ ] Create fn-9 spec: Write Infrastructure (all write-related P0 gaps)
- [ ] Create fn-10 spec: Theme System (P0/P1 theme gaps)
- [ ] Create fn-11 spec: Git Integration (git-related gaps)
- [ ] Create fn-12 spec: Search & Navigation (search, prefs, shortcuts)
- [ ] Create fn-13 spec: Component Browser Enhancement (live preview, props)
- [ ] Create fn-14 spec: Typography Editor (styleguide, font manager)
- [ ] Each spec has: overview, quick commands, task list with estimates, acceptance criteria
- [ ] Epics registered with flowctl

## Done summary
# fn-8.17 Create Follow-up Epic Specs - Summary

## Deliverable
Created 6 comprehensive epic specifications in `.flow/specs/` and registered them with flowctl.

## Epics Created

| Epic | Title | Hours | Priority Gaps |
|------|-------|-------|---------------|
| fn-9 | Write Infrastructure | 35-50h | P0-1 to P0-6 (token/component writes) |
| fn-10 | Theme System | 25-35h | P0-7 to P0-11 + P1-21 to P1-26 |
| fn-11 | Git Integration | 18-24h | P0-14 to P0-16 (git-as-save) |
| fn-12 | Search & Navigation | 40-60h | P0-17 + P1-31 to P1-36 |
| fn-13 | Component Browser | 35-50h | P0-6 + P1-11 to P1-16 |
| fn-14 | Typography Editor | 30-45h | P0-20, P0-21 + P1-6 to P1-10 |

## Each Epic Includes
- Overview with goal and priority
- Quick commands for verification
- Detailed task breakdown (phases)
- Dependency graph
- Acceptance criteria
- Technical implementation notes
- References to source materials

## Epic Dependencies
- fn-9: No dependencies (foundation)
- fn-10: No dependencies (parallel to fn-9)
- fn-11: Depends on fn-9
- fn-12: Depends on fn-9, fn-11
- fn-13: Depends on fn-9
- fn-14: Depends on fn-9

## Verification
- All 6 epics visible via `flowctl epics`
- All 6 specs readable via `flowctl cat fn-N`
- Epic JSON metadata correctly registered
## Evidence
- Commits: bddd4dc042ec8f07e3bfa6a946af47fc14b0950c
- Tests: flowctl epics --json
- PRs: