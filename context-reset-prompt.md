# Context Reset Prompts - Final

```markdown
# Context Reset - radflow-tauri

## Overview
Three flow-next epics. Progress doc spans all three, read at start of each interview.

**Vault**: `~/Desktop/vault/radflow`
**Sister repo**: `~/Desktop/dev/dna` (theme system)
**Progress doc**: `~/Desktop/vault/radflow/03-Sprints/context-reset-log.md`

---

## EPIC 1: Discovery & Audit

### Interview Prompt
```
/flow-next:interview

Topic: Context Reset Phase 1 - Discovery & Audit

Repo: /Users/rivermassey/Desktop/dev/radflow-tauri

Goals:
1. Create progress doc with BEFORE codemap (RepoPrompt + manual exploration)
2. Audit .flow/ - categorize each file as MIGRATE/ARCHIVE/DELETE
3. Confirm doc inventory actions (see below)
4. Document radflow ↔ dna integration scope (how theme system connects)

Constraints:
- No deletions yet
- Update progress doc after EVERY step (narrative + patterns/gotchas)

Checkpoints (pause for confirmation):
- [ ] Progress doc created at ~/Desktop/vault/radflow/03-Sprints/context-reset-log.md
- [ ] BEFORE codemap captured
- [ ] .flow/ audit complete with file counts
- [ ] Doc inventory confirmed with accurate counts
- [ ] dna integration scope documented

Doc Inventory - Confirm:

DELETE (est. ~15+ files):
- docs/reviews/*
- docs/fn4-strategic-review.md
- docs/fn7-comparison.md
- docs/spec-conflicts.md
- docs/archive/*
- docs/feedback/*

MIGRATE TO VAULT (est. 28 files → consolidate to ~10 vault docs):
- README.md, CLAUDE.md, AGENTS.md (3)
- docs/features/* (13 files → 3-4 domain docs)
- docs/research/* (8 files → 2-3 research docs)
- docs/rust-patterns.md (1)
- docs/reference/component-editor-patterns.md (1)
- research/* (4 files → merge with docs/research)

MOVE TO DNA REPO:
- packages/theme-rad-os/* → ~/Desktop/dev/dna/

MERGE FOR DNA (create unified theme spec):
- docs/theme-spec.md
- docs/design-system-infrastructure.md
- ~/Downloads/dna-theme-spec.md
→ Output: ~/Desktop/dev/dna/docs/theme-spec.md
```

---

## EPIC 2: Vault Bootstrap

### Interview Prompt
```
/flow-next:interview

Topic: Context Reset Phase 2 - Vault Bootstrap

FIRST: Read ~/Desktop/vault/radflow/03-Sprints/context-reset-log.md

Goals:
1. Create vault structure at ~/Desktop/vault/radflow (see below)
2. Initialize as Obsidian vault (.obsidian folder)
3. Install/configure Claudesidian plugin for AI search optimization
4. Migrate approved docs - consolidate into domain docs:
   - Features: 13 files → 3-4 domain specs (editor, components, canvas, data)
   - Research: 12 files → 2-3 consolidated research docs
   - Keep atomic: README, CLAUDE.md, rust-patterns, component-editor-patterns
5. Move packages/theme-rad-os/ to ~/Desktop/dev/dna/packages/theme-rad-os/
6. Create unified theme spec in dna from merged sources

Vault Structure:
~/Desktop/vault/radflow/
├── README.md                    # Vault navigation
├── 00-Index/
│   ├── MOC-Architecture.md
│   └── MOC-Features.md
├── 01-Architecture/
│   ├── system-overview.md       # From README.md + CLAUDE.md
│   ├── rust-patterns.md
│   └── component-patterns.md
├── 02-Features/
│   ├── editor-system.md         # Consolidated from features/*
│   ├── component-system.md
│   ├── canvas-system.md
│   └── data-layer.md
├── 03-Sprints/
│   └── context-reset-log.md     # This progress doc
├── 04-References/
│   └── research/                # Consolidated research docs
└── 99-Archive/
    └── flow-backup-[date]/      # .flow/ backup destination

Constraints:
- Don't copy verbatim - consolidate and clarify
- Less is more - prefer 1 clear doc over 3 redundant ones
- Use YAML frontmatter: status, date, tags
- Use wikilinks: [[document-name]]
- Update progress doc after EVERY step

Checkpoints:
- [ ] Vault structure created
- [ ] Obsidian initialized
- [ ] Feature docs consolidated (confirm 3-4 domain docs)
- [ ] Research docs consolidated
- [ ] theme-rad-os moved to dna
- [ ] Unified theme spec created in dna
```

---

## EPIC 3: Cleanup & Reset

### Interview Prompt
```
/flow-next:interview

Topic: Context Reset Phase 3 - Cleanup & Reset

FIRST: Read ~/Desktop/vault/radflow/03-Sprints/context-reset-log.md

Goals:
1. Verify vault content is complete and accurate
2. Delete confirmed stale docs from radflow-tauri (see Epic 1 DELETE list)
3. Update CLAUDE.md - minimal, points to vault for details
4. Backup .flow/ to ~/Desktop/vault/radflow/99-Archive/flow-backup-[date]/
5. Uninstall flow-next, reinstall fresh
6. Re-import only approved unactioned specs (if any identified in audit)
7. Generate AFTER codemap in progress doc
8. Consolidate patterns/gotchas into /context-reset skill template

Constraints:
- Verify vault content BEFORE any deletions
- Update progress doc after EVERY step
- Finalize progress doc as reusable skill template

Checkpoints:
- [ ] Vault verification complete
- [ ] Stale docs deleted (count: X files)
- [ ] CLAUDE.md updated
- [ ] .flow/ backed up
- [ ] flow-next reinstalled fresh
- [ ] AFTER codemap captured
- [ ] Progress doc finalized with skill patterns

Final Deliverables:
- Clean radflow-tauri repo
- Populated ~/Desktop/vault/radflow/
- Initialized ~/Desktop/dev/dna/ with theme system
- Reusable /context-reset skill patterns
```

---

## Progress Doc Template

Create this file first: `~/Desktop/vault/radflow/03-Sprints/context-reset-log.md`

```markdown
# Context Reset Log - radflow-tauri

**Started**: [timestamp]
**Status**: In Progress

---

## Initial State

### Codemap (Before)
```
[RepoPrompt output here]
```

### .flow/ Inventory
| File | Status | Notes |
|------|--------|-------|
| fn-1 | | |
| ... | | |

### Doc Inventory Confirmed
- DELETE: X files
- MIGRATE: Y files → Z vault docs
- MOVE TO DNA: theme-rad-os/
- MERGE: 3 theme docs → 1 unified spec

---

## Epic 1: Discovery & Audit

### [timestamp] - Created progress doc
[narrative]

### [timestamp] - Generated BEFORE codemap
[narrative]
**Pattern**: 
**Gotcha**: 

### [timestamp] - Audited .flow/
[narrative]
**Pattern**: 
**Gotcha**: 

### [timestamp] - Confirmed doc inventory
[narrative]

### [timestamp] - Documented dna integration scope
[narrative]

---

## Epic 2: Vault Bootstrap

### [timestamp] - Starting Phase 2
**Current state**: [summary]

### [timestamp] - Created vault structure
[narrative]

### [timestamp] - Consolidated feature docs
**Input**: 13 files
**Output**: X domain docs
[mapping]

### [timestamp] - Consolidated research docs
**Input**: 12 files  
**Output**: X docs

### [timestamp] - Moved theme-rad-os to dna
[narrative]

### [timestamp] - Created unified theme spec
**Sources merged**: 3
**Output**: ~/Desktop/dev/dna/docs/theme-spec.md

---

## Epic 3: Cleanup & Reset

### [timestamp] - Starting Phase 3
**Current state**: [summary]

### [timestamp] - Verified vault content
[checklist]

### [timestamp] - Deleted stale docs
**Count**: X files
[list]

### [timestamp] - Updated CLAUDE.md
[summary of changes]

### [timestamp] - Backed up and reset .flow/
**Backup**: ~/Desktop/vault/radflow/99-Archive/flow-backup-[date]/

### [timestamp] - Generated AFTER codemap
```
[RepoPrompt output here]
```

---

## Summary

**Duration**: X hours across Y sessions
**Files deleted**: X
**Files migrated**: Y → Z consolidated docs
**Vault docs created**: Z

### /context-reset Skill Patterns
1. Always capture BEFORE state first
2. Single progress doc as continuity thread
3. Categorize before acting: MIGRATE/ARCHIVE/DELETE
4. Consolidate during migration, don't copy verbatim
5. Verify before deleting
6. [add more during execution]

### Gotchas
1. [capture during execution]
2. 
3. 

### Next Sprint
[link to first new sprint doc]
```
```

---