# fn-16: Context Reset Phase 1 - Discovery & Audit

## Overview

Audit and document the current state of radflow-tauri before reorganizing documentation into an Obsidian vault and initializing the DNA monorepo. This is the discovery phase - **no deletions**, only analysis and documentation.

**Goal:** Create a complete inventory of .flow/, docs/, and codebase state to inform Phases 2 (Vault Bootstrap) and 3 (Cleanup & Reset).

**Priority:** P0 - Blocking Phases 2 and 3

---

## Quick Commands

```bash
# Verify vault directory exists
ls -la ~/Desktop/vault/radflow/

# Generate file tree
tree -L 3 /Users/rivermassey/Desktop/dev/radflow-tauri

# Count .flow files by type
FLOWCTL="/Users/rivermassey/.claude/plugins/cache/gmickel-claude-marketplace/flow-next/0.5.9/scripts/flowctl"
$FLOWCTL list --json | jq '.epics | length'

# Verify RepoPrompt is available
which rp-cli

# Count docs files
find /Users/rivermassey/Desktop/dev/radflow-tauri/docs -type f | wc -l
```

---

## Scope

### In Scope

1. **Vault Structure Creation**
   - Create folder structure at `~/Desktop/vault/radflow/`
   - Initialize `.obsidian/` for Obsidian vault
   - Create 6 domain doc placeholders (component-canvas, page-builder, editor-panels, designer-panels, ai-integration, infrastructure)

2. **Progress Doc with BEFORE State**
   - Create `03-Sprints/context-reset-log.md`
   - Capture BEFORE codemap using RepoPrompt + tree
   - Document starting file counts

3. **.flow/ Audit**
   - 15 epics: summarize by status (8 done, 1 open, 2 archived, 4 draft)
   - Note: fn-7 is active with 5 remaining tasks
   - Categorize: ARCHIVE completed, MIGRATE in-progress, DELETE abandoned
   - DELETE: memory/, evidence/, tmp/, temp/, summaries/

4. **docs/ Audit**
   - 47 files total
   - DELETE: 7 files (archive/*, fn4-strategic-review, fn7-comparison, spec-conflicts, feedback/*)
   - MIGRATE: 22 files → 6 vault domain docs
   - ARCHIVE: 16 files (reviews/*) → consolidated implementation-notes.md
   - MERGE: 2 files (theme-spec.md, design-system-infrastructure.md) → dna theme spec

5. **RadTools Architecture Comparison**
   - Compare `~/Downloads/radtools-architecture.md` vs current codebase
   - Document what's built vs. specced
   - Note conflicts (e.g., Shadow DOM specced but iframe implemented)

6. **DNA Integration Scope**
   - Document monorepo structure: packages/core, packages/rad-os, tools/, docs/
   - Confirm theme-rad-os move scope
   - Document ai-skills/ usage (RadFlow reads + external tools)

### Out of Scope

- Actual file deletions (Phase 3)
- Doc content migration (Phase 2)
- DNA repo file moves (Phase 2)
- flow-next reinstall (Phase 3)

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| 6 vault domain docs | Component Canvas, Page Builder, Editor Panels, Designer Panels, AI Integration, Infrastructure |
| .flow/memory DELETE | Operational artifacts, patterns can be recreated |
| docs/reviews → single doc | Consolidate 16 review files into implementation-notes.md |
| Bridge stays in radflow | Bridge is radflow's injection mechanism, not a theme package |
| Search is project-scoped | Not cross-repo, matches current implementation |

---

## Dependencies

- RepoPrompt CLI (`rp-cli`) for codemap generation
- flowctl for .flow/ analysis
- Access to `~/Downloads/radtools-architecture.md` and `~/Downloads/dna-theme-spec.md`

---

## Acceptance Criteria

- [ ] Vault structure created at `~/Desktop/vault/radflow/` with all folders
- [ ] `.obsidian/` folder initialized
- [ ] Progress doc exists at `03-Sprints/context-reset-log.md`
- [ ] BEFORE codemap captured (RepoPrompt output + tree)
- [ ] .flow/ audit complete with epic status summary table
- [ ] docs/ audit complete with file categorization table
- [ ] RadTools Architecture comparison documented with conflicts noted
- [ ] DNA integration scope documented (monorepo structure, ai-skills usage)

---

## References

- Progress doc template: See Epic 1 prompt in `/Users/rivermassey/Desktop/dev/radflow-tauri/context-reset-prompt.md`
- DNA spec: `~/Downloads/dna-theme-spec.md`
- RadTools architecture: `~/Downloads/radtools-architecture.md`
- Current .flow/ status: `flowctl list`
