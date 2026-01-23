# DNA Conversion

This document describes how to convert a theme package to DNA spec compliance.

## Quick Start

1. Run the Phase 0 assessment on your package
2. Review the generated assessment and mapping recommendations
3. Generate a sprint plan from the assessment
4. Work through tasks in order

## Prompt Templates

The conversion process is driven by modular prompt templates:

| Prompt | Purpose |
|--------|---------|
| [`00-controller.prompt.md`](../prompts/dna-conversion/00-controller.prompt.md) | Main orchestrator - defines workflow and inputs |
| [`01-phase0-assessment.prompt.md`](../prompts/dna-conversion/01-phase0-assessment.prompt.md) | Automated codebase scan and gap analysis |
| [`02-sprint-generator.prompt.md`](../prompts/dna-conversion/02-sprint-generator.prompt.md) | Generates sprint plan and task files |

## Task Templates

Reusable templates for common conversion tasks:

| Template | Purpose |
|----------|---------|
| [`token-foundation.md`](../prompts/dna-conversion/templates/token-foundation.md) | Add semantic token layer |
| [`component-schema.md`](../prompts/dna-conversion/templates/component-schema.md) | Generate .schema.json and .dna.json |
| [`component-refactor.md`](../prompts/dna-conversion/templates/component-refactor.md) | Replace brand tokens with semantic tokens |
| [`dark-mode.md`](../prompts/dna-conversion/templates/dark-mode.md) | Create dark mode overrides |

## Example Output

See [`examples/sample-output.md`](../prompts/dna-conversion/examples/sample-output.md) for a complete example of generated assessment and sprint plan.

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    DNA Conversion Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. PHASE 0: Assessment                                     │
│     └─ Scan tokens, components, usage patterns              │
│     └─ Generate gap analysis                                │
│     └─ Output: assessment.md                                │
│                                                             │
│  2. Sprint Planning                                         │
│     └─ Group work into logical sprints                      │
│     └─ Generate individual task files                       │
│     └─ Output: sprint-plan.md + tasks/*.md                  │
│                                                             │
│  3. Execution                                               │
│     └─ Work through tasks in dependency order               │
│     └─ Each task: implement → validate → commit             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Key Concepts

### DNA Token System

Tokens are organized into semantic categories:

| Category | Prefix | Examples |
|----------|--------|----------|
| Backgrounds | `surface-` | `surface-primary`, `surface-secondary` |
| Text/Icons | `content-` | `content-primary`, `content-inverted` |
| Borders | `edge-` | `edge-primary`, `edge-focus` |
| Actions | `action-` | `action-primary`, `action-destructive` |
| Status | `status-` | `status-success`, `status-error` |

### Three-File Component Pattern

DNA-compliant components have three files:

```
Component/
├── Component.tsx           # Implementation
├── Component.schema.json   # Props, variants, examples (AI interface)
└── Component.dna.json      # Token bindings per variant
```

### Required Semantic Tokens

All themes must define at minimum:

```css
--color-surface-primary
--color-surface-secondary
--color-content-primary
--color-content-inverted
--color-edge-primary
```

## Archive

The original conversion guide (flow-next coupled) is archived at:
- [`docs/archive/dna-conversion-guide.md`](archive/dna-conversion-guide.md)
