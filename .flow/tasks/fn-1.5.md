# fn-1.5 POC: tantivy search indexing

## Description
**MINIMAL SCOPE** - v1 only needs component and icon name search.

### v1 Search Requirements
- Index component names (Button, Card, Input, etc.)
- Index icon names (from assets/icons/)
- Keyboard shortcuts: Enter = copy, Cmd+Enter = navigate
- Full-text search is post-v1

### Why tantivy?
Fast fuzzy matching for names. User types "btn" → finds "Button".

### Test Scope
1. Index ~30 component names from theme-rad-os/components/core/
2. Index ~168 icon names from public/assets/icons/
3. Search by partial name with fuzzy matching
4. Return name + file path for clipboard/navigation

### NOT in v1
- Full file content indexing
- Complex queries
- Relevance scoring
- Incremental updates

Keep the POC minimal - just prove names can be indexed and searched quickly.
## Acceptance

- [ ] Create Rust POC project at `research/pocs/tantivy-poc/`
- [ ] Define index schema
- [ ] Create in-memory index
- [ ] Index CSS file contents
- [ ] Index TSX file contents
- [ ] Search by exact term
- [ ] Search with fuzzy matching
- [ ] Return file path and line number
- [ ] Benchmark: index 100 files in < 1 second

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
