---
name: figma-code-connect-components
description: Connects Figma design components to code components using Code Connect mapping tools. Use when user says "code connect", "connect this component to code", "map this component", "link component to code", "create code connect mapping", or wants to establish mappings between Figma designs and code implementations. For canvas writes via `use_figma`, use `figma-use`.
disable-model-invocation: false
---

# Code Connect Components

## Overview

This skill helps you connect Figma design components to their corresponding code implementations using Figma's Code Connect feature. It analyzes the Figma design structure, searches your codebase for matching components, and establishes mappings that maintain design-code consistency.

## Skill Boundaries

- Use this skill for `get_code_connect_suggestions` + `send_code_connect_mappings` workflows.
- If the task requires writing to the Figma canvas with Plugin API scripts, switch to [figma-use](../figma-use/SKILL.md).
- If the task is building or updating a full-page screen in Figma from code or a description, switch to [figma-generate-design](../figma-generate-design/SKILL.md).
- If the task is implementing product code from Figma, switch to [figma-implement-design](../figma-implement-design/SKILL.md).

## Prerequisites

- Figma MCP server must be connected and accessible
- User must provide a Figma URL with node ID: `https://figma.com/design/:fileKey/:fileName?node-id=1-2`
  - **IMPORTANT:** The Figma URL must include the `node-id` parameter. Code Connect mapping will fail without it.
- **OR** when using `figma-desktop` MCP: User can select a node directly in the Figma desktop app (no URL required)
- **IMPORTANT:** The Figma component must be published to a team library. Code Connect only works with published components or component sets.
- **IMPORTANT:** Code Connect is only available on Organization and Enterprise plans.
- Access to the project codebase for component scanning

## Required Workflow

**Follow these steps in order. Do not skip steps.**

### Step 1: Get Code Connect Suggestions

Call `get_code_connect_suggestions` to identify all unmapped components in a single operation. This tool automatically:

- Fetches component info from the Figma scenegraph
- Identifies published components in the selection
- Checks existing Code Connect mappings and filters out already-connected components
- Returns component names, properties, and thumbnail images for each unmapped component

#### Option A: Using `figma-desktop` MCP (no URL provided)

If the `figma-desktop` MCP server is connected and the user has NOT provided a Figma URL, immediately call `get_code_connect_suggestions`. No URL parsing is needed — the desktop MCP server automatically uses the currently selected node from the open Figma file.

#### Option B: When a Figma URL is provided

Parse the URL to extract `fileKey` and `nodeId`, then call `get_code_connect_suggestions`.

**IMPORTANT:** When extracting the node ID from a Figma URL, convert the format:

- URL format uses hyphens: `node-id=1-2`
- Tool expects colons: `nodeId=1:2`

### Step 2: Scan Codebase for Matching Components

For each unmapped component returned by `get_code_connect_suggestions`, search the codebase for a matching code component.

**Search strategy:**

1. Search for component files with matching names
2. Read candidate files to check structure and props
3. Compare the code component's props with the Figma component properties returned in Step 1
4. Detect the programming language and framework
5. Identify the best match based on structural similarity
6. If multiple candidates are equally good, pick the one with the closest prop-interface match

### Step 3: Present Matches to User

Present your findings and let the user choose which mappings to create.

### Step 4: Create Code Connect Mappings

Once the user confirms their selections, call `send_code_connect_mappings` with only the accepted mappings.

**Key parameters for each mapping:**

- `nodeId`: The Figma node ID (with colon format: `1:2`)
- `componentName`: Name of the component to connect
- `source`: Path to the code component file (relative to project root)
- `label`: The framework or language label (e.g., 'React', 'Vue', 'SwiftUI')

## Common Issues and Solutions

- **"No published components found"** → Components need to be published to a team library first
- **"All components already connected"** → Everything is already mapped
- **"Published component not found"** → Verify source path and componentName
- **"Insufficient permissions"** → User needs edit access to the file
