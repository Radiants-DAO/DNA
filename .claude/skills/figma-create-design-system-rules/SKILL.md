---
name: figma-create-design-system-rules
description: Generates custom design system rules for the user's codebase. Use when user says "create design system rules", "generate rules for my project", "set up design rules", "customize design system guidelines", or wants to establish project-specific conventions for Figma-to-code workflows. Requires Figma MCP server connection.
disable-model-invocation: false
---

# Create Design System Rules

## Overview

This skill helps you generate custom design system rules tailored to your project's specific needs. These rules guide AI coding agents to produce consistent, high-quality code when implementing Figma designs.

## Skill Boundaries

- Use this skill for generating project-specific design system rules.
- If the task requires writing to the Figma canvas, switch to [figma-use](../figma-use/SKILL.md).
- If the task is implementing code from Figma, switch to [figma-implement-design](../figma-implement-design/SKILL.md).

## Prerequisites

- Figma MCP server must be connected and accessible
- Access to the project codebase for analysis

## Required Workflow

### Step 1: Run the Create Design System Rules Tool

Call `create_design_system_rules` with:
- `clientLanguages`: Comma-separated list of languages (e.g., "typescript,javascript")
- `clientFrameworks`: Framework being used (e.g., "react", "vue", "svelte")

### Step 2: Analyze the Codebase

Analyze the project to understand existing patterns:

- **Component Organization:** Where are UI components located? How are they organized?
- **Styling Approach:** What CSS framework is used? Where are design tokens defined?
- **Component Patterns:** Naming conventions, prop structures, composition patterns
- **Architecture Decisions:** State management, routing, import patterns

### Step 3: Generate Project-Specific Rules

Based on analysis, generate rules covering:

- **General Component Rules** — paths, naming, exports
- **Styling Rules** — CSS approach, tokens, spacing, typography
- **Figma MCP Integration Rules** — required flow for implementing designs
- **Asset Handling Rules** — where to store assets, using localhost sources
- **Project-Specific Conventions** — architecture, testing, accessibility

### Step 4: Save Rules to the Appropriate Rule File

| Agent | Rule File |
|-------|-----------|
| Claude Code | `CLAUDE.md` or `.claude/rules/figma-design-system.md` |
| Codex CLI | `AGENTS.md` |
| Cursor | `.cursor/rules/figma-design-system.mdc` |

### Step 5: Validate and Iterate

1. Test with a simple Figma component implementation
2. Verify the agent follows the rules correctly
3. Refine any rules that aren't working as expected

## Best Practices

- **Start Simple, Iterate** — Don't try to capture every rule upfront
- **Be Specific** — Tell the agent exactly what to do, not just what to avoid
- **Use IMPORTANT** — Prefix critical rules with "IMPORTANT:"
- **Document the Why** — Explain reasoning for non-obvious rules
