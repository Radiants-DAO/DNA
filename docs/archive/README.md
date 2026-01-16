# Archived Features

This folder contains feature specs that have been sunset or superseded.

## Why Archive Instead of Delete?

- Historical reference for design decisions
- Context for why certain approaches were abandoned
- May inform future iterations

## Archived Items

| Feature | Date | Reason |
|---------|------|--------|
| fn-10-theme-system.md | 2026-01-16 | RadFlow UI uses fixed theme (theme-rad-os). No need for dynamic switching. |
| fn-11-git-integration.md | 2026-01-16 | Pivot to context engineering. LLMs handle git, not RadFlow. |

## The Context Engineering Pivot

In January 2026, RadFlow pivoted from a direct-edit tool to a **Design System Manager for LLM CLI tools**:

**Before:** RadFlow writes files directly, uses git for save/undo
**After:** RadFlow browses design systems, outputs context for LLMs to make changes

This means:
- No direct file writes
- No git integration (LLM tools handle this)
- Focus on context output for Claude Code, Cursor, etc.

See fn-9 spec for details: `.flow/specs/fn-9.md`
