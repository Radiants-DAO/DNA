# fn-2-zcd.12 Migrate Tabs component to theme

## Description
TBD

## Acceptance
- [ ] TBD

## Done summary
Migrated Tabs component to theme core package. The component file (Tabs.tsx) was already in place, added the exports for Tabs, TabList, TabTrigger, and TabContent to the core index.ts. Removed iconName prop dependency on app's Icon component in favor of slot-based icon prop.
## Evidence
- Commits: ba96e58db8cb8d062c21bb9be440e2dd2b93b98a, cfeae86b6382d58027d505efab835cc04162b02f
- Tests:
- PRs: