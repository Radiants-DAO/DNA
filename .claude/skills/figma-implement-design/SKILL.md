---
name: figma-implement-design
description: Translates Figma designs into production-ready code with 1:1 visual fidelity. Use when implementing UI from Figma files, when user mentions "implement design", "generate code", "implement component", "build Figma design", "code this design", or wants to create code from a Figma file. For canvas writes via `use_figma`, use `figma-use`.
disable-model-invocation: false
---

# Implement Design — Figma to Code

## Overview

This skill provides a structured workflow for converting Figma designs into production-ready code with pixel-perfect accuracy. It ensures consistent integration with the Figma MCP server, proper use of design tokens, and 1:1 visual parity with designs.

## Skill Boundaries

- Use this skill when the deliverable is **code in the user's repository**.
- Switch to `figma-use` if the user asks to create/edit/delete nodes in Figma itself.
- Switch to `figma-generate-design` for full-page screen building in Figma.
- Switch to `figma-code-connect-components` for Code Connect mappings only.
- Switch to `figma-create-design-system-rules` for authoring reusable agent rules.

## Prerequisites

- Figma MCP server must be connected and accessible
- User must provide a Figma URL: `https://figma.com/design/:fileKey/:fileName?node-id=1-2`
- **OR** when using `figma-desktop` MCP: User can select a node directly in the Figma desktop app
- Project should have an established design system or component library (preferred)

## Required Workflow (7 Steps)

**Follow these steps in order. Do not skip steps.**

### Step 1: Get Node ID

Parse the Figma URL to extract the file key and node ID.

- URL format: `https://figma.com/design/:fileKey/:fileName?node-id=1-2`
- Convert `node-id=1-2` to `nodeId=1:2` (hyphens to colons)
- Branch URLs: `figma.com/design/:fileKey/branch/:branchKey/:fileName` → use `branchKey` as fileKey

If using Figma Desktop MCP with no URL, use the current selection.

### Step 2: Fetch Design Context

Run `get_design_context` to obtain structured design data:

- Layout structure (auto-layout, constraints, sizing)
- Typography (font, size, weight, line height)
- Colors (fills, strokes, effects)
- Design tokens and variables
- Spacing and padding values
- Code Connect snippets (if available)

If the response is too large or truncated, run `get_metadata` first for the high-level node map, then re-fetch specific nodes individually.

### Step 3: Capture Visual Reference

Run `get_screenshot` for the target node. This provides:

- Visual validation reference throughout implementation
- Catches details that structured data might miss
- Use for side-by-side comparison during development

### Step 4: Download Required Assets

Retrieve images, icons, and SVGs from the Figma MCP server:

- **IMPORTANT:** If the Figma MCP server returns a localhost source for an image or SVG, use that source directly
- **IMPORTANT:** DO NOT import/add new icon packages — all assets should come from the Figma payload
- **IMPORTANT:** DO NOT use or create placeholders if a localhost source is provided
- Store downloaded assets in the project's designated asset directory

### Step 5: Translate to Project Conventions

The design context output (typically React + Tailwind) is a **representation**, not final code:

- Replace with the project's framework (Vue, Svelte, etc.) if different
- Map Figma tokens to project design system tokens
- Reuse existing project components instead of recreating
- Apply project naming conventions and file organization
- Respect existing routing, state management, and data-fetch patterns

**Key mappings:**
- Figma colors → project color tokens
- Figma typography → project type scale
- Figma spacing → project spacing scale
- Figma components → existing project components

### Step 6: Achieve 1:1 Visual Parity

Strive for pixel-perfect accuracy:

- Match layout, spacing, and alignment exactly
- Use correct typography (font, size, weight, line height, letter spacing)
- Apply precise colors from design tokens
- Implement all visual states (hover, active, disabled, focus)
- Handle responsive behavior as designed
- Prioritize Figma fidelity while using design tokens

### Step 7: Validate Against Figma

Final checklist:

- [ ] Layout matches Figma (spacing, alignment, sizing)
- [ ] Typography is correct (font, size, weight, line height)
- [ ] Colors match (backgrounds, text, borders, shadows)
- [ ] Interactive states work (hover, active, disabled, focus)
- [ ] Responsive behavior matches design intent
- [ ] Assets render correctly (images, icons, SVGs)
- [ ] Accessibility basics (semantic HTML, ARIA labels, keyboard nav)

## Implementation Rules

### Component Organization
- Place components in the project's designated design system directory
- Follow the project's naming conventions
- Export components consistently with the project pattern

### Design System Integration
- **IMPORTANT:** Use existing project components when possible
- Map Figma tokens to project tokens — don't hardcode values
- Extend components rather than creating duplicates

### Code Quality
- Avoid hardcoded colors, spacing, or typography values
- Keep components composable and reusable
- Add TypeScript types for all props
- Include JSDoc comments for exported components

## Common Issues & Solutions

- **Truncated output:** Use `get_metadata` first to understand structure, then fetch specific nodes with `get_design_context`
- **Design mismatches:** Compare side-by-side with the screenshot; verify spacing, colors, and typography
- **Assets not loading:** Verify the Figma MCP server's assets endpoint; use localhost URLs directly
- **Token discrepancies:** Prefer project tokens for consistency while maintaining visual fidelity
