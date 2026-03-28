# DNA Conversion Controller

**Version:** 1.0.0

This prompt orchestrates the conversion of a theme package to DNA spec compliance. It coordinates assessment, planning, and execution phases.

---

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `project_path` | Yes | Path to the theme package (e.g., `packages/layer33`) |
| `output_dir` | No | Where to write sprint/task files (default: `{project_path}/.dna-conversion/`) |
| `conversion_type` | No | `full` (default) or `tokens-only` |

---

## Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    DNA Conversion Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. PHASE 0: Assessment                                     │
│     └─ Run: 01-phase0-assessment.prompt.md                  │
│     └─ Output: assessment.md (gap analysis)                 │
│                                                             │
│  2. Sprint Planning                                         │
│     └─ Run: 02-sprint-generator.prompt.md                   │
│     └─ Input: assessment.md                                 │
│     └─ Output: sprint-plan.md + task files                  │
│                                                             │
│  3. Execution (manual or agent-driven)                      │
│     └─ Work through tasks sequentially                      │
│     └─ Each task: branch → implement → validate → commit    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Git Branch Strategy

Create a feature branch for the conversion:

```bash
git checkout -b dna-convert/{project-name}
```

Example: `dna-convert/layer33`

Each sprint gets its own commits. Merge to main when complete.

---

## Execution Instructions

### Step 1: Run Phase 0 Assessment

Use the Phase 0 prompt to scan the project:

```
Execute archive/prompts/dna-conversion/01-phase0-assessment.prompt.md

Inputs:
- project_path: {project_path}
```

This produces an `assessment.md` file with:
- Token inventory (brand vs semantic)
- Component inventory (with/without schemas)
- Gap analysis (what's missing)
- Recommended mapping strategy

### Step 2: Generate Sprint Plan

Use the Sprint Generator to create tasks:

```
Execute archive/prompts/dna-conversion/02-sprint-generator.prompt.md

Inputs:
- assessment_path: {output_dir}/assessment.md
- output_dir: {output_dir}
```

This produces:
- `sprint-plan.md` - Overview of all sprints and tasks
- Individual task files in `tasks/` subdirectory

### Step 3: Execute Tasks

Work through tasks in order. Each task file contains:
- Description of what to do
- Files to modify
- Validation criteria
- Commit message template

---

## Output Structure

```
{project_path}/.dna-conversion/
├── assessment.md           # Phase 0 output
├── sprint-plan.md          # Sprint overview
└── tasks/
    ├── 01-token-foundation.md
    ├── 02-component-button-schema.md
    ├── 03-component-button-refactor.md
    └── ...
```

---

## Validation Checkpoints

### After Phase 0
- [ ] Assessment file exists and is readable
- [ ] Token inventory shows current state
- [ ] Gap analysis identifies missing items

### After Sprint Planning
- [ ] Sprint plan covers all gaps from assessment
- [ ] Tasks are ordered by dependency
- [ ] Each task has clear validation criteria

### After Each Task
- [ ] Validation criteria pass
- [ ] No TypeScript errors
- [ ] No CSS resolution errors

### After Full Conversion
- [ ] All required semantic tokens defined
- [ ] All components have .schema.json
- [ ] All components have .meta.ts (token bindings flow through registry)
- [ ] No brand tokens in component className props
- [ ] Dark mode works (if applicable)

---

## Quick Reference

### Required Semantic Tokens (minimum)

```css
--color-page
--color-inv
--color-main
--color-flip
--color-line
```

### Two-File Authored Pattern

```
Component/
├── Component.tsx           # Implementation
├── Component.meta.ts       # Authored metadata + token bindings + registry facts
└── Component.schema.json   # Generated from meta
```

### Token Naming Convention

| Category | Pattern | Example |
|----------|---------|---------|
| Backgrounds | `surface-{level}` | `page`, `inv` |
| Text/Icons | `content-{level}` | `main`, `flip` |
| Borders | `edge-{level}` | `line`, `focus` |
| Actions | `action-{type}` | `accent`, `danger` |
| Status | `status-{state}` | `success`, `danger` |

---

## Troubleshooting

### "Too many components to convert"

Use `conversion_type: tokens-only` for initial pass. Add schemas in a follow-up.

### "Can't determine token mapping"

Check the assessment output. If brand tokens are unclear, you may need to manually specify the mapping table in the sprint generator input.

### "TypeScript errors after conversion"

Usually means a token was renamed but not updated everywhere. Run:

```bash
grep -r "bg-{old-token}" components/
grep -r "text-{old-token}" components/
```
