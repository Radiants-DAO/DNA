---
name: figma-generate-design
description: Create or update full-page screens in Figma by leveraging published design systems. Triggers on "write to Figma", "create in Figma from code", "push page to Figma", "create a screen", "build a landing page in Figma", "update the Figma screen to match code".
disable-model-invocation: false
---

# figma-generate-design — Create/Update Screens in Figma

Use this skill when creating or updating full-page screens in Figma from code or design specs. Leverages published design systems rather than building from scratch.

## Core Workflow

### Step 1: Understand the Screen
Read source code and identify major sections and UI components.

### Step 2: Discover Design System
Find components, variables, and styles. Search existing screens first before using `search_design_system`. Two different variable discovery methods exist — local vs library. Never conclude variables don't exist based only on local checks.

### Step 3: Create Page Wrapper
Build the wrapper frame in its own `use_figma` call, returning its ID.

### Step 4: Build Sections Incrementally
Construct one section per `use_figma` call inside the wrapper.

### Step 5: Validate Visually
Use `get_screenshot` to catch issues like text clipping and overlapping content.

### Step 6: Update Existing Screens
For updates, identify needed changes and apply targeted modifications.

## Key Rules

- **Always search before building** — the design system likely has the component, variable, or style you need
- **Work section-by-section** — never try to build an entire page in one call
- **Return node IDs from every call** — subsequent calls need them
- **Validate visually after each section** — use `get_screenshot`
- **Load `figma-use` skill** before any `use_figma` call
- **Always pass `skillNames: "figma-generate-design"`** when calling `use_figma`

## Choosing Between use_figma and generate_figma_design

- Use `generate_figma_design` (capture tool) when **capturing a web app page into Figma for the first time**
- Use `use_figma` (this workflow) when **updating or syncing a page that has already been captured**, or when building from code/specs
- When in doubt, use `use_figma`
