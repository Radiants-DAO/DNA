# DNA Sprint Generator

**Version:** 1.0.0

This prompt takes an assessment file and generates a sprint plan with individual task files.

---

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `assessment_path` | Yes | Path to the Phase 0 assessment.md file |
| `output_dir` | Yes | Where to write sprint plan and task files |

---

## Sprint Patterns

Organize work into logical sprints based on dependencies.

### Sprint 1: Token Foundation

**Dependencies:** None
**Goal:** Establish the semantic token layer

Tasks:
1. Add semantic tokens to @theme block (or create tokens.css)
2. Map brand → semantic tokens
3. Add motion tokens (duration-*, easing-*)
4. Add spacing tokens (if missing)

### Sprint 2: Component Schemas (Batch 1 - Simple)

**Dependencies:** Sprint 1 complete
**Goal:** Add .schema.json and .dna.json for simple components

Group simple components (1-2 per task):
- Button, Badge, Input
- Card, Divider
- Checkbox, Switch
- etc.

### Sprint 3: Component Schemas (Batch 2 - Compound)

**Dependencies:** Sprint 2 complete
**Goal:** Add schemas for compound components

These require `subcomponents` array in schema:
- Dialog (DialogTrigger, DialogContent, DialogHeader, etc.)
- Sheet
- Accordion
- Select
- etc.

### Sprint 4: Token Refactor

**Dependencies:** Sprint 1 complete (can run parallel to Sprint 2-3)
**Goal:** Replace brand tokens with semantic tokens in components

Group by complexity:
- 3-5 simple components per task
- 1-2 compound components per task

**Note:** Component count for token refactor may differ from schema count. Some decorator components receive colors via props rather than hardcoded className tokens, so they may not need direct refactoring.

### Sprint 5: Configuration & Dark Mode

**Dependencies:** Sprint 1, Sprint 4 complete
**Goal:** Finalize package structure

Tasks:
1. Create dark.css with semantic token overrides (support all 3 activation methods)
2. Update package.json exports
3. Create dna.config.json
4. Final validation

---

## Build Validation

**IMPORTANT:** Run `npm run build` after each sprint completes to catch any issues early. Broken Tailwind classes or TypeScript errors should be fixed before moving to the next sprint.

---

## Task Template

Each task file follows this structure:

```markdown
# Task: {task_name}

**Sprint:** {sprint_number}
**Dependencies:** {list of prerequisite tasks or "none"}
**Complexity:** {simple/medium/complex}

## Description

{What this task accomplishes}

## Files to Modify

- `{file_path_1}` - {what to do}
- `{file_path_2}` - {what to do}

## Implementation Steps

1. {Step 1}
2. {Step 2}
3. {Step 3}

## Validation Criteria

- [ ] {Criterion 1}
- [ ] {Criterion 2}
- [ ] {Criterion 3}
- [ ] Build passes: `npm run build`

## Commit Message

```
{type}({scope}): {description}

{body if needed}
```

## Rollback

If something goes wrong:
```bash
git checkout -- {files}
```
```

---

## Grouping Rules

### Components by Complexity Tier

**Simple (1-2 per task):**
- Single export components
- Few variants/states
- Examples: Button, Badge, Input, Card, Divider

**Compound (1 per task):**
- Multiple subcomponent exports
- Need `subcomponents` in schema
- Examples: Dialog, Sheet, Accordion, Select, Tabs

**Complex (1 per task):**
- Many states, subcomponents, or business logic
- Examples: DataTable, Form, Calendar

### Token Refactor Batching

Group components that use similar tokens:
- All components using `bg-black` → `bg-surface-secondary`
- All components using `text-white` → `text-content-inverted`
- All status-related components together

---

## Output Format

### sprint-plan.md

```markdown
# DNA Conversion Sprint Plan: {project_name}

**Generated:** {date}
**Assessment:** {assessment_path}

## Overview

| Sprint | Name | Tasks | Status |
|--------|------|-------|--------|
| 1 | Token Foundation | 1 | Pending |
| 2 | Simple Component Schemas | X | Pending |
| 3 | Compound Component Schemas | X | Pending |
| 4 | Token Refactor | X | Pending |
| 5 | Configuration & Dark Mode | 3 | Pending |

## Sprint 1: Token Foundation

| Task | Description | Dependencies |
|------|-------------|--------------|
| 01-token-foundation | Add semantic tokens | None |

## Sprint 2: Simple Component Schemas

| Task | Description | Dependencies |
|------|-------------|--------------|
| 02-button-schema | Button .schema.json + .dna.json | 01 |
| 03-card-schema | Card .schema.json + .dna.json | 01 |
| ... | | |

## Sprint 3: Compound Component Schemas

| Task | Description | Dependencies |
|------|-------------|--------------|
| 10-dialog-schema | Dialog with subcomponents | 01 |
| ... | | |

## Sprint 4: Token Refactor

| Task | Description | Dependencies |
|------|-------------|--------------|
| 15-refactor-surface | Components using surface tokens | 01 |
| 16-refactor-content | Components using content tokens | 01 |
| ... | | |

## Sprint 5: Configuration & Dark Mode

| Task | Description | Dependencies |
|------|-------------|--------------|
| 20-dark-mode | Create dark.css | 01, Sprint 4 |
| 21-package-exports | Update package.json | All above |
| 22-final-validation | Run all checks | All above |

## Dependency Graph

```
01-token-foundation
├── 02-button-schema
├── 03-card-schema
├── ...
├── 15-refactor-surface
│   └── 20-dark-mode
│       └── 21-package-exports
│           └── 22-final-validation
```
```

### Individual Task Files

Generate files in `tasks/` subdirectory:
- `tasks/01-token-foundation.md`
- `tasks/02-button-schema.md`
- `tasks/03-card-schema.md`
- etc.

---

## Generation Algorithm

1. **Parse assessment.md**
   - Extract token inventory
   - Extract component list
   - Extract mapping recommendations

2. **Generate Sprint 1 task**
   - List all tokens to add
   - Include mapping table
   - Reference `templates/token-foundation.md`

3. **Generate Sprint 2-3 tasks**
   - Sort components by complexity
   - Group simple components (2-3 per task)
   - One compound component per task
   - Reference `templates/component-schema.md`

4. **Generate Sprint 4 tasks**
   - Group components by token usage
   - Reference `templates/component-refactor.md`

5. **Generate Sprint 5 tasks**
   - Dark mode from semantic tokens
   - Package exports
   - Final validation checklist

6. **Write files**
   - sprint-plan.md
   - tasks/*.md

---

## Example

For an assessment showing:
- 5 simple components (Button, Card, Badge, Input, Divider)
- 2 compound components (Dialog, Select)
- 10 brand tokens needing semantic mapping

Generate:
- Sprint 1: 1 task (token foundation)
- Sprint 2: 3 tasks (2 components each + 1 single)
- Sprint 3: 2 tasks (1 compound each)
- Sprint 4: 2 tasks (grouped by token type)
- Sprint 5: 3 tasks (dark, exports, validation)

Total: ~11 tasks
