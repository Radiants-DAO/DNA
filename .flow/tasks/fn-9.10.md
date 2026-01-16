# fn-9.10 Output Formatter

## Description
Create the formatter that converts accumulated edits into LLM-ready output.

**Output formats:**
- Prompt (default): Natural language instructions for LLM
- Code only: Just the changes in code format
- Diff: Unified diff format

**Context included per edit:**
- DOM Path, React Component name, HTML Element snippet, File path (relative)

**Example prompt:**
```
Update the following design tokens in theme-rad-os:
File: packages/theme-rad-os/tokens.css
Changes:
1. --color-surface-primary: #FEF8E2 → #FFFFFF
   Context: Used as main background in Card components
```
## Acceptance
- [ ] formatAsPrompt() function works
- [ ] formatAsCode() function works
- [ ] formatAsDiff() function works
- [ ] Context included in prompt format
- [ ] File paths are relative
- [ ] Multiple edits grouped logically in output
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
